# TB-Inference: Multimodal AI-Driven Tuberculosis Diagnosis Support System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![React](https://img.shields.io/badge/frontend-React-61dafb.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)

## 📌 Project Overview
TB-Inference is a professional-grade Clinical Decision Support System (CDSS) designed to assist medical practitioners in the early detection and risk assessment of Tuberculosis (TB). By fusing clinical symptomology with automated radiological feature extraction from Chest X-rays, the system provides a robust, multimodal probability assessment.

This project is built for academic excellence and clinical defensibility, moving beyond simple black-box AI to provide explainable, rule-based, and statistical evidence for every diagnosis.

---

## 🚀 Key Features

### 1. Multimodal AI Fusion
*   **Clinical Stream**: A statistical risk model using weighted epidemiological indicators (e.g., cough duration, hemoptysis, systemic symptoms).
*   **Radiology Stream (Rad-IA)**: A feature-extraction engine that analyzes Chest X-ray opacities, bilateral asymmetry, and parenchymal textures in the pulmonary upper zones.
*   **Bayesian Fusion**: An intelligent fusion layer that combines both streams and calculates an **Inference Agreement Score** to detect clinical-radiological discordance.

### 2. Explainable AI (XAI)
*   Provides structured reasoning for every assessment.
*   Detailed breakdown of contributing clinical factors.
*   Radiological indices (Opacity Index, Asymmetry Index) for expert review.

### 3. Professional Medical Dashboard
*   **Patient Registry**: Secure management of patient records and medical history.
*   **Diagnosis Wizard**: Step-by-step clinical assessment workflow.
*   **Rich Reports**: Visual probability gauges, WHO-aligned clinical protocols, and automated report generation for printing.

---

## 🛠 Tech Stack

### Backend (Inference Engine)
*   **Framework**: FastAPI (Python)
*   **Database**: SQLAlchemy (SQLite for portability)
*   **Image Processing**: Pillow, NumPy (Deterministic feature extraction)
*   **AI Integration**: Groq (Llama 3.2 Vision) for assistive insights
*   **Vector DB**: Qdrant (for RAG-based medical knowledge retrieval)

### Frontend (Clinical UI)
*   **Framework**: React.js + Vite
*   **Styling**: Tailwind CSS (Modern, responsive clinical aesthetics)
*   **State Management**: React Hooks & Context API
*   **Icons**: Lucide-React

---

## 🏗 System Architecture

```text
[Patient Data] + [Chest X-Ray]
       │             │
       ▼             ▼
[Clinical Engine]  [Radiology Engine]
       │             │
       └─────┬───────┘
             ▼
      [Fusion Engine] ──▶ [Consensus Filtering]
             │
             ▼
    [Diagnostic Report] ──▶ [Actionable Recommendations]
```

---

## 🚦 Getting Started

### Prerequisites
*   Python 3.9+
*   Node.js 16+
*   Groq API Key (for assistive AI features)

### Backend Setup
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Create a virtual environment and install dependencies:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Create a `.env` file and add your credentials:
   ```env
   GROQ_API_KEY=your_key_here
   ```
4. Start the server:
   ```bash
   python app.py
   ```

### Frontend Setup
1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

---

## 🛡 Disclaimer
This system is designed as a **Clinical Decision Support Tool** for academic and research purposes. It is NOT a substitute for professional medical judgment. All automated findings must be verified by a registered medical practitioner.

---

## 👨‍💻 Author
**Hariharakrishnan**
*   GitHub: [@hariharakrishna-code](https://github.com/hariharakrishna-code)

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
