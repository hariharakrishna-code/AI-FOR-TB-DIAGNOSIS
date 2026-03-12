import logging
from langchain_community.document_loaders import PyPDFLoader
from langchain_qdrant import Qdrant
from langchain_huggingface import HuggingFaceEmbeddings
import llm
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
QDRANT_URL = "https://ae6c6ba6-9baa-45b8-8628-9d97edb51138.us-east-1-1.aws.cloud.qdrant.io"
QDRANT_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.jgYS4YKNezLZHuAWqtPBKIK7txbVtfWByKCZAgTXA_s"
COLLECTION_NAME = "tb_diagnosis_knowledge"

# Embeddings model
embeddings = HuggingFaceEmbeddings(
    model_name="all-MiniLM-L6-v2"
)

def get_vector_store():
    """Returns the Qdrant vector store instance."""
    return Qdrant.from_existing_collection(
        embeddings=embeddings,
        collection_name=COLLECTION_NAME,
        url=QDRANT_URL,
        api_key=QDRANT_API_KEY,
    )

def retrieval_qa(question, image_url=None):
    """
    Retrieves context from the vector store and asks the LLM.
    Used for the 'Chat with Knowledge Base' feature.
    """
    try:
        qdrant = get_vector_store()
        results = qdrant.similarity_search(question, k=3)

        logger.info(f"Similarity search results found: {len(results)}")

        context_text = "\n\n".join([doc.page_content for doc in results])

        prompt = f"""
Context Information:
{context_text}

Question: {question}

Answer the question strictly based on the provided medical context.
If the answer is not in the context, say so, but provide general medical advice with a disclaimer.
"""

        return llm.get_response(prompt, image_url)

    except Exception as e:
        logger.error(f"Error in retrieval_qa: {e}")
        # Fallback to LLM without context
        return llm.get_response(question, image_url)
