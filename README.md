# AI-Based Multimodal TB Diagnosis System

A comprehensive decision support system for Early Tuberculosis Diagnosis using AI.

## Project Structure
- **`backend/`**: FastAPI Server (Python). Handles AI Logic, Database, Auth.
- **`frontend/`**: React App (Vite). Professional Medical UI for Doctors.

## Quick Start

### 1. Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app:app --reload
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

## Features
- **Multimodal Analysis**: Combines Symptoms, Vitals, and Chest X-rays.
- **AI-Powered**: Uses Large Language Models (LLM) with Vision capabilities.
- **Patient Management**: Secure records of patients and diagnosis history.
- **Professional UI**: Designed for rural healthcare context.
