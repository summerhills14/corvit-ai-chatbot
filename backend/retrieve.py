import os
import chromadb

from sentence_transformers import SentenceTransformer


# ==========================================
# BASE DIRECTORY
# ==========================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)


# ==========================================
# CONFIGURATION
# ==========================================

VECTOR_DB_PATH = os.path.join(
    BASE_DIR,
    "vector_db",
    "chroma_db"
)

COLLECTION_NAME = "corvit_knowledge"

EMBEDDING_MODEL = "all-MiniLM-L6-v2"


# ==========================================
# LOAD EMBEDDING MODEL
# ==========================================

print("Loading embedding model...")

embedding_model = SentenceTransformer(
    EMBEDDING_MODEL
)

print("Embedding model loaded.")


# ==========================================
# CONNECT TO CHROMADB
# ==========================================

print("Connecting to ChromaDB...")

chroma_client = chromadb.PersistentClient(
    path=VECTOR_DB_PATH
)

collection = chroma_client.get_collection(
    name=COLLECTION_NAME
)

print("Connected successfully.")

print(
    "Documents:",
    collection.count()
)


# ==========================================
# RETRIEVAL FUNCTION
# ==========================================

def retrieve_documents(
    query,
    n_results=8
):

    query_embedding = embedding_model.encode(
        query
    ).tolist()

    results = collection.query(
        query_embeddings=[
            query_embedding
        ],
        n_results=n_results
    )

    return results