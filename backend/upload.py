import logging
from langchain_community.document_loaders import PyPDFLoader
from langchain_qdrant import Qdrant
from langchain_huggingface import HuggingFaceEmbeddings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
QDRANT_URL = "https://76cd8643-b781-4440-9a70-0ee55ce5d373.eu-west-1-0.aws.cloud.qdrant.io:6333"
QDRANT_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiJtIiwiZXhwIjoxNzcxODEzMjM5fQ.s9j8nf8Ho3FFeOth_lYSumN8g5iXJ0oZrYR5GJfXAIA"
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
