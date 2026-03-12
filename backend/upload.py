import logging
from fastapi import FastAPI
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import Qdrant
from langchain_huggingface import HuggingFaceEmbeddings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Constants
QDRANT_URL = "https://ae6c6ba6-9baa-45b8-8628-9d97edb51138.us-east-1-1.aws.cloud.qdrant.io"
QDRANT_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.jgYS4YKNezLZHuAWqtPBKIK7txbVtfWByKCZAgTXA_s"
COLLECTION_NAME = "tb_diagnosis_knowledge"

# Embeddings
embeddings = HuggingFaceEmbeddings(
    model_name="all-MiniLM-L6-v2"
)

def upload_pdf(file_path: str):
    """
    Uploads a PDF file to Qdrant vector store.
    """
    try:
        loader = PyPDFLoader(file_path)
        documents = loader.load()

        logger.info(f"Loaded {len(documents)} documents from PDF")

        vectorstore = Qdrant.from_documents(
            documents=documents,
            embeddings=embeddings,
            url=QDRANT_URL,
            api_key=QDRANT_API_KEY,
            collection_name=COLLECTION_NAME,
        )

        logger.info("Documents successfully uploaded to Qdrant")

        return True

    except Exception as e:
        logger.error(f"Error uploading PDF: {e}")
        return False
