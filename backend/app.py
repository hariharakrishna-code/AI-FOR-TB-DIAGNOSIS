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
from clinical_logic import calculate_tb_risk

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

@app.get("/api/diagnoses/recent")
def get_recent_diagnoses(limit: int = 10, db: Session = Depends(get_db), current_user: database.User = Depends(get_current_user)):
    """
    Fetches the latest diagnoses for the dashboard comparison view.
    Parses JSON fields for immediate frontend use.
    """
    recent = db.query(database.Diagnosis)\
               .order_by(database.Diagnosis.created_at.desc())\
               .limit(limit).all()
    
    results = []
    for d in recent:
        # Load patient
        patient = db.query(database.Patient).filter(database.Patient.id == d.patient_id).first()
        
        # Safely parse JSON fields
        try:
            symptoms = json.loads(d.symptoms) if d.symptoms else {}
            vitals = json.loads(d.vitals) if d.vitals else {}
            breakdown = json.loads(d.clinical_breakdown) if d.clinical_breakdown else {}
        except json.JSONDecodeError:
            symptoms, vitals, breakdown = {}, {}, {}

        results.append({
            "id": d.id,
            "patient": {
                "full_name": patient.full_name if patient else "Unknown",
                "age": patient.age if patient else 0,
                "gender": patient.gender if patient else "N/A",
                "id": d.patient_id
            },
            "risk_level": d.risk_level,
            "confidence_score": d.confidence_score,
            "created_at": d.created_at.isoformat(),
            "has_xray": bool(d.xray_path),
            "symptoms": symptoms,
            "vitals": vitals,
            "clinical_breakdown": breakdown,
            "ai_analysis": d.ai_analysis
        })
    
    return results

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
    Hybrid Clinical Decision Support System diagnosis endpoint.
    Deterministic scoring + LLM Clinical Explanation.
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
        raise HTTPException(status_code=400, detail="Invalid JSON format for symptoms or vitals")

    # 2. Handle X-Ray (Binary Amplifier for Task 4)
    xray_present = False
    file_path_db = None
    if file and file.filename:
        logger.info(f"X-ray upload detected: {file.filename}")
        file_location = os.path.join(UPLOAD_DIR, f"{patient_id}_{int(datetime.now().timestamp())}_{file.filename}")
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_path_db = file_location
        xray_present = True # Treat as abnormal for score amplification in this CDSS version

    # 3. Deterministic Clinical Scoring (Task 1)
    assessment = calculate_tb_risk(symptoms_data, vitals_data, xray_present)
    
    risk_level = assessment["risk_level"]
    risk_score = assessment["risk_score"]
    confidence = assessment["confidence"]
    findings = assessment["findings"]

    # 4. LLM Clinical Explanation (Task 2)
    # LLM ONLY explains, it does NOT decide.
    explanation_data = llm.get_clinical_explanation(
        risk_level=risk_level,
        risk_score=risk_score,
        findings=findings,
        symptoms=symptoms_data,
        vitals=vitals_data
    )

    reasoning = explanation_data.get("reasoning", "Analysis based on standard clinical TB indicators.")
    recommendations = explanation_data.get("next_steps", ["Consult clinical guidelines"])

    # 5. Persistence (Save to Database)
    new_diagnosis = database.Diagnosis(
        patient_id=patient_id,
        symptoms=json.dumps(symptoms_data),
        vitals=json.dumps(vitals_data),
        xray_path=file_path_db,
        risk_level=risk_level,
        confidence_score=confidence / 100.0, # Store as 0.0-1.0
        ai_analysis=reasoning,
        clinical_breakdown=json.dumps({
            "calculated_score": risk_score,
            "max_score": 13,
            "findings": findings,
            "xray_included": xray_present
        }),
        recommendations=json.dumps(recommendations)
    )
    db.add(new_diagnosis)
    db.commit()
    db.refresh(new_diagnosis)
    
    # 6. Return Structured Response
    return {
        "diagnosis_id": new_diagnosis.id,
        "final_risk": {
            "level": risk_level,
            "score": risk_score,
            "max_score": 13,
            "probability": confidence, # Returning as percentage for frontend
            "category": risk_level
        },
        "findings": findings,
        "clinical_reasoning": reasoning,
        "recommended_actions": recommendations,
        "clinical_analysis": {
            "risk_level": risk_level,
            "findings": findings
        },
        "fusion_analysis": {
            "fusion_explanation": reasoning
        },
        "timestamp": datetime.utcnow().isoformat()
    }


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
