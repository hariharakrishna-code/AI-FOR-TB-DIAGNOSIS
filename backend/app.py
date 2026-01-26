from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
import shutil
import os
import base64
import json
import logging
from typing import List, Optional
from datetime import datetime

# Local modules
import llm
import retriever
import upload as knowledge_uploader
import database
import auth_utils

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize DB
database.init_db()

app = FastAPI(title="TB Diagnosis Support System API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directories
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Auth Configuration
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# --- Dependencies ---
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = auth_utils.jwt.decode(token, auth_utils.SECRET_KEY, algorithms=[auth_utils.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except auth_utils.JWTError:
        raise credentials_exception
    
    user = db.query(database.User).filter(database.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# --- Pydantic Models for Requests/Responses ---
class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "doctor"

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    class Config:
         from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class PatientCreate(BaseModel):
    full_name: str
    age: int
    gender: str
    contact_number: Optional[str] = None
    medical_history: Optional[str] = None

class PatientOut(BaseModel):
    id: int
    full_name: str
    age: int
    gender: str
    created_at: datetime
    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    question: str
    image_url: Optional[str] = None

# --- API Endpoints ---

@app.get("/")
def read_root():
    return {"status": "active", "system": "TB Diagnosis Support System (Secured)"}

# 1. Auth Headers
@app.post("/api/auth/register", response_model=UserOut)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(database.User).filter(database.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth_utils.get_password_hash(user.password)
    new_user = database.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/auth/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(database.User).filter(database.User.email == form_data.username).first()
    if not user or not auth_utils.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth_utils.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=UserOut)
def read_users_me(current_user: database.User = Depends(get_current_user)):
    return current_user

# 2. Patient Management
@app.post("/api/patients", response_model=PatientOut)
def create_patient(patient: PatientCreate, db: Session = Depends(get_db), current_user: database.User = Depends(get_current_user)):
    db_patient = database.Patient(**patient.model_dump(), created_by_id=current_user.id)
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

@app.get("/api/patients", response_model=List[PatientOut])
def get_patients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: database.User = Depends(get_current_user)):
    return db.query(database.Patient).offset(skip).limit(limit).all()

@app.get("/api/patients/{patient_id}", response_model=PatientOut)
def get_patient(patient_id: int, db: Session = Depends(get_db), current_user: database.User = Depends(get_current_user)):
    patient = db.query(database.Patient).filter(database.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@app.get("/api/patients/{patient_id}/history")
def get_patient_history(patient_id: int, db: Session = Depends(get_db), current_user: database.User = Depends(get_current_user)):
    diagnoses = db.query(database.Diagnosis).filter(database.Diagnosis.patient_id == patient_id).all()
    return diagnoses

# 3. Diagnosis (Now Secured & Persisted)
def encode_image_to_base64(file_path):
    with open(file_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

@app.post("/api/diagnose")
async def diagnose(
    patient_id: int = Form(...),
    symptoms: str = Form(...),
    vitals: str = Form(...),
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: database.User = Depends(get_current_user)
):
    """
    Multimodal diagnosis endpoint using LLM Analysis.
    Saves the result to the database linked to the patient.
    """
    # Verify patient exists
    patient = db.query(database.Patient).filter(database.Patient.id == patient_id).first()
    if not patient:
         raise HTTPException(status_code=404, detail="Patient not found")

    try:
        # Parse JSON inputs
        symptoms_data = json.loads(symptoms)
        vitals_data = json.loads(vitals)
        
        # Build LLM Prompt
        question = (
            f"Patient Assessment Request (Patient: {patient.full_name}, Age: {patient.age}):\n"
            f"Symptoms: {json.dumps(symptoms_data, indent=2)}\n"
            f"Vital Signs: {json.dumps(vitals_data, indent=2)}\n\n"
            f"Please analyze these clinical findings"
        )
        
        image_data_url = None
        file_path_db = None

        if file:
            # Save file locally
            file_location = os.path.join(UPLOAD_DIR, f"{patient_id}_{int(datetime.now().timestamp())}_{file.filename}")
            with open(file_location, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Prepare for LLM
            base64_image = encode_image_to_base64(file_location)
            mime_type = file.content_type or "image/jpeg"
            image_data_url = f"data:{mime_type};base64,{base64_image}"
            
            question += " and the provided Chest X-ray image."
            file_path_db = file_location
        else:
            question += "."

        # Call AI
        logger.info(f"Running AI Diagnosis for Patient {patient_id}...")
        ai_response_text = llm.get_response(question, image_data_url)
        
        # Simple parsing logic to extract structured fields from AI response (Robustness relies on LLM prompt adherence)
        # In a production system, we'd use Function Calling or JSON Mode.
        # Here we default "High" if the word High is in the text, heuristics for demo.
        risk_level = "Medium" 
        if "High Risk" in ai_response_text: risk_level = "High"
        elif "Low Risk" in ai_response_text: risk_level = "Low"
        
        confidence = 0.85 # Mocked for demo if LLM doesn't output number cleanly
        
        # Save to DB
        new_diagnosis = database.Diagnosis(
            patient_id=patient_id,
            symptoms=symptoms,
            vitals=vitals,
            xray_path=file_path_db,
            risk_level=risk_level,
            confidence_score=confidence,
            ai_analysis=ai_response_text,
            recommendations="Refer to clinical guidelines."
        )
        db.add(new_diagnosis)
        db.commit()
        db.refresh(new_diagnosis)
        
        return {
            "diagnosis_id": new_diagnosis.id,
            "risk_level": risk_level,
            "analysis": ai_response_text,
            "timestamp": new_diagnosis.created_at
        }

    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON for symptoms/vitals")
    except Exception as e:
        logger.error(f"Diagnosis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 4. RAG Chat
@app.post("/api/chat")
async def chat(request: ChatRequest, current_user: database.User = Depends(get_current_user)):
    try:
        response = retriever.retrieval_qa(request.question, request.image_url)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 5. Connect Knowledge
@app.post("/api/upload-knowledge")
async def upload_knowledge(file: UploadFile = File(...), current_user: database.User = Depends(get_current_user)):
    if current_user.role != "admin" and current_user.role != "doctor":
         raise HTTPException(status_code=403, detail="Not authorized")
         
    try:
        file_location = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        success = knowledge_uploader.ingest_pdf(file_location)
        return {"status": "success", "message": f"Ingested {file.filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Create tables on startup if they don't exist
    database.init_db()
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
