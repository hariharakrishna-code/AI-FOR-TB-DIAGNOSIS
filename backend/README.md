# TB Diagnosis System - Backend

This folder contains the backend API for the AI-Based Multimodal Early Tuberculosis Diagnosis Support System.

## Architecture
- **FastAPI** (`app.py`): The high-performance web server handling API requests.
- **Groq Llama** (`llm.py`): The AI engine. Uses Llama 3 models (via Groq) to analyze medical data and X-ray images.
- **Qdrant** (`retriever.py`): Vector database integration for retrieving medical guidelines and similar cases (RAG).
- **LangChain** (`upload.py`): Tools for processing and ingesting medical PDF documents into the knowledge base.

## Setup
1.  **Install Requirements**:
    ```bash
    pip install -r requirements.txt
    ```
2.  **Environment Variables**:
    Ensure you have your `GROQ_API_KEY` and Qdrant credentials set (or updated in `llm.py`/`retriever.py` for testing).

## Running the Server
```bash
uvicorn app:app --reload
```
The server will start at `http://localhost:8000`.

## API Endpoints
- **`POST /api/diagnose`**: Main diagnosis endpoint.
- **`POST /api/chat`**: Chatbot endpoint for querying the knowledge base.
- **`POST /api/upload-knowledge`**: Admin endpoint to add new knowledge (PDFs).

## Frontend Integration
Your frontend should make POST requests to these endpoints. Ensure your frontend runs on a port allowed by the CORS configuration (currently `*` allowing all).
