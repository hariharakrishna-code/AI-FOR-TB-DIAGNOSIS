from langchain_community.document_loaders import PyPDFLoader
from langchain_qdrant import QdrantVectorStore
from llm import get_response as llm_get_response
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from langchain_huggingface import HuggingFaceEmbeddings

embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

# Create the vector store
url = "https://76cd8643-b781-4440-9a70-0ee55ce5d373.eu-west-1-0.aws.cloud.qdrant.io:6333"
api_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIiwiZXhwIjoxNzcxODEzMjM5fQ.s9j8nf8Ho3FFeOth_lYSumN8g5iXJ0oZrYR5GJfXAIA"

qdrant = QdrantVectorStore.from_existing_collection(
    embedding=embeddings,
    collection_name="cardio vasculae",
    url=url,
    api_key=api_key,
)

def get_response(question,image_url):
    results = qdrant.similarity_search(
    question, k=2
     )
    logger.info(f"similarity search results:")
    prompt=f"""
    Question :{question}
    Context :{results}
    Answer the question based on the context provided.
    """
    logger.info(f"sucessfully get response")
    return llm_get_response(prompt,image_url)
    
print(get_response("What's in this image?","https://imgs.search.brave.com/AZYtZvrqEtW0RHYg2_6JeTleF-Cw4jn8SilcA3WPwjA/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9lcmMu/ZXVyb3BhLmV1L3Np/dGVzL2RlZmF1bHQv/ZmlsZXMvc3Rvcmll/cy9pbWFnZXMvYW5n/aW8tY29yb25hcnkl/MjAuanBn"))