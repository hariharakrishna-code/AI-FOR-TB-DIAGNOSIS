from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
import shutil
import os
from dotenv import load_dotenv

load_dotenv()

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

# 1.5 Dashboard Stats
@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db), current_user: database.User = Depends(get_current_user)):
    total_patients = db.query(database.Patient).count()
    high_risk = db.query(database.Diagnosis).filter(database.Diagnosis.risk_level == "High").count()
    
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    completed_today = db.query(database.Diagnosis).filter(database.Diagnosis.created_at >= today_start).count()
    
    # Get recent diagnoses with patient info
    recent = db.query(database.Diagnosis, database.Patient)\
               .join(database.Patient)\
               .order_by(database.Diagnosis.created_at.desc())\
               .limit(5).all()
               
    recent_list = []
    for diag, patient in recent:
        recent_list.append({
            "id": diag.id,
            "patient_name": patient.full_name,
            "risk_level": diag.risk_level,
            "timestamp": diag.created_at.isoformat(),
            "confidence": diag.confidence_score
        })
    
    return {
        "patients": total_patients,
        "highRisk": high_risk,
        "completed": completed_today,
        "recent": recent_list
    }

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

    # 1. Parse Data Safely
    try:
        symptoms_data = json.loads(symptoms) if isinstance(symptoms, str) else symptoms
        vitals_data = json.loads(vitals) if isinstance(vitals, str) else vitals
    except (json.JSONDecodeError, TypeError) as e:
        logger.error(f"JSON Parsing Error: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid JSON format for symptoms or vitals: {str(e)}")

    patient_data = {"age": patient.age, "gender": patient.gender}
    
    try:
        # 2. Engines Import
        from clinical_engine import engine as clinical_engine
        from radiology_engine import engine as radiology_engine
        from fusion_engine import engine as fusion_engine
        
        # 3. Clinical Analysis (Mandatory)
        clinical_analysis = clinical_engine.analyze(symptoms_data, patient_data)
        logger.info(f"Clinical Analysis Complete: {clinical_analysis['risk_level']}")

        # 4. Radiology Analysis (Optional)
        radiology_analysis = None
        file_path_db = None
        
        if file and file.filename:
            logger.info(f"Processing X-ray upload: {file.filename}")
            file_location = os.path.join(UPLOAD_DIR, f"{patient_id}_{int(datetime.now().timestamp())}_{file.filename}")
            with open(file_location, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            file_path_db = file_location
            
            # Real Inference on Image
            radiology_analysis = radiology_engine.analyze(file_location)
            logger.info(f"Radiology Analysis Complete: {radiology_analysis.get('probability')}")
        else:
            logger.info("No X-ray file provided, skipping radiology stream.")

        # 5. Multimodal Fusion
        fusion_result = fusion_engine.fuse(clinical_analysis, radiology_analysis)
        logger.info(f"Multimodal Fusion Complete. Final Risk: {fusion_result['final_risk_level']}")
        
        # 6. Final Risk Determination
        final_risk = fusion_result["final_risk_level"]
        final_prob = fusion_result["final_probability"]
        
        # 7. Recommendations (Structured)
        recommendations = []
        if final_risk == "High":
             recommendations = ["URGENT: Isolate Patient", "Order CBNAAT / GeneXpert Test", "Sputum Smear Microscopy", "Contact Tracing Initiation"]
        elif final_risk == "Medium":
             recommendations = ["Order Sputum AFB Culture", "Chest X-Ray Repeat in 2 weeks", "Broad-spectrum antibiotics (Non-Quinolone)", "Daily Temperature monitoring"]
        else:
             recommendations = ["Symptomatic treatment", "Follow-up in 7 days if symptoms persist", "Routine health education"]

        # 8. Persistence (Save to Database)
        # We store the most critical info in existing columns
        new_diagnosis = database.Diagnosis(
            patient_id=patient_id,
            symptoms=json.dumps(symptoms_data),
            vitals=json.dumps(vitals_data),
            xray_path=file_path_db,
            risk_level=final_risk,
            confidence_score=final_prob,
            ai_analysis=fusion_result["fusion_explanation"],
            clinical_breakdown=json.dumps({
                "clinical_path": clinical_analysis,
                "radiology_path": radiology_analysis,
                "fusion_details": fusion_result
            }),
            recommendations=json.dumps(recommendations)
        )
        db.add(new_diagnosis)
        db.commit()
        db.refresh(new_diagnosis)
        
        # 9. Return Structured Response
        return {
            "diagnosis_id": new_diagnosis.id,
            "clinical_analysis": clinical_analysis,
            "radiology_analysis": radiology_analysis,
            "fusion_analysis": fusion_result,
            "final_risk": {
                "level": final_risk,
                "probability": final_prob,
                "category": final_risk
            },
            "confidence_explanation": fusion_result["fusion_explanation"],
            "recommended_actions": recommendations,
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Diagnosis Pipeline Failure: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal Analysis Error: {str(e)}")

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
