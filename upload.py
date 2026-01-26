from langchain_community.document_loaders import PyPDFLoader
from langchain_qdrant import QdrantVectorStore
from langchain_huggingface import HuggingFaceEmbeddings

embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")


file_path = "C:/Users/karis/OneDrive/Desktop/siva_kamal_project/backend/DCP33.pdf"
loader = PyPDFLoader(file_path)


docs = loader.load_and_split()


# Create the vector store
url = "https://76cd8643-b781-4440-9a70-0ee55ce5d373.eu-west-1-0.aws.cloud.qdrant.io:6333"
api_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIiwiZXhwIjoxNzcxODEzMjM5fQ.s9j8nf8Ho3FFeOth_lYSumN8g5iXJ0oZrYR5GJfXAIA"

qdrant = QdrantVectorStore.from_documents(
    docs,
    embeddings,
    url=url,
    api_key=api_key,
    collection_name="cardio vasculae",
)