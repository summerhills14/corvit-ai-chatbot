"""
CORVIT CHATBOT
Build Vector Database

Reads:
    processing/processed_chunks.json

Creates:
    vector_db/chroma_db/

Embedding model:
    sentence-transformers/all-MiniLM-L6-v2
"""

import json
import shutil
from pathlib import Path

import chromadb
from sentence_transformers import SentenceTransformer


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

CHUNKS_FILE = (
    BASE_DIR
    / "processing"
    / "processed_chunks.json"
)

VECTOR_DB_DIR = (
    BASE_DIR
    / "vector_db"
    / "chroma_db"
)


# ============================================================
# SETTINGS
# ============================================================

COLLECTION_NAME = "corvit_knowledge"

EMBEDDING_MODEL = "all-MiniLM-L6-v2"


# ============================================================
# LOAD CHUNKS
# ============================================================

def load_chunks():
    print("=" * 60)
    print("CORVIT VECTOR DATABASE BUILDER")
    print("=" * 60)

    print(f"\nLoading chunks from:")
    print(CHUNKS_FILE)

    if not CHUNKS_FILE.exists():
        raise FileNotFoundError(
            f"\nERROR: Could not find:\n{CHUNKS_FILE}\n\n"
            "Make sure you have already run:\n"
            "python processing/process.py"
        )

    with open(CHUNKS_FILE, "r", encoding="utf-8") as file:
        data = json.load(file)

    return data


# ============================================================
# EXTRACT TEXT
# ============================================================

def extract_chunks(data):
    """
    Converts different possible JSON structures
    into a simple list of text chunks.
    """

    chunks = []

    # --------------------------------------------------------
    # Case 1:
    # JSON is directly a list
    # --------------------------------------------------------

    if isinstance(data, list):

        for item in data:

            if isinstance(item, str):
                text = item.strip()

                if text:
                    chunks.append({
                        "text": text,
                        "metadata": {}
                    })

            elif isinstance(item, dict):

                text = (
                    item.get("text")
                    or item.get("content")
                    or item.get("chunk")
                    or item.get("page_content")
                )

                if text and isinstance(text, str):
                    chunks.append({
                        "text": text.strip(),
                        "metadata": item
                    })

    # --------------------------------------------------------
    # Case 2:
    # JSON is a dictionary
    # --------------------------------------------------------

    elif isinstance(data, dict):

        # Common structure:
        # {"chunks": [...]}

        if isinstance(data.get("chunks"), list):

            for item in data["chunks"]:

                if isinstance(item, str):

                    text = item.strip()

                    if text:
                        chunks.append({
                            "text": text,
                            "metadata": {}
                        })

                elif isinstance(item, dict):

                    text = (
                        item.get("text")
                        or item.get("content")
                        or item.get("chunk")
                        or item.get("page_content")
                    )

                    if text and isinstance(text, str):

                        chunks.append({
                            "text": text.strip(),
                            "metadata": item
                        })

        else:

            # Try to find text-like values
            # inside the dictionary.

            for key, value in data.items():

                if isinstance(value, str):

                    text = value.strip()

                    if len(text) > 30:

                        chunks.append({
                            "text": text,
                            "metadata": {
                                "source": key
                            }
                        })

    # --------------------------------------------------------
    # Remove empty chunks
    # --------------------------------------------------------

    chunks = [
        chunk
        for chunk in chunks
        if chunk["text"].strip()
    ]

    return chunks


# ============================================================
# CLEAN METADATA
# ============================================================

def clean_metadata(metadata):
    """
    ChromaDB metadata only supports simple values.
    """

    clean = {}

    if not isinstance(metadata, dict):
        return clean

    for key, value in metadata.items():

        if value is None:
            continue

        if isinstance(value, (str, int, float, bool)):

            clean[str(key)] = value

        else:

            # Convert lists/dictionaries/etc. to text
            clean[str(key)] = str(value)

    return clean


# ============================================================
# BUILD VECTOR DATABASE
# ============================================================

def build_vector_database():

    # --------------------------------------------------------
    # Load processed data
    # --------------------------------------------------------

    data = load_chunks()

    chunks = extract_chunks(data)

    print(f"\nChunks found: {len(chunks)}")

    if not chunks:

        raise ValueError(
            "\nERROR: No usable text chunks were found "
            "inside processed_chunks.json."
        )

    # --------------------------------------------------------
    # Show sample
    # --------------------------------------------------------

    print("\nSample chunk:")
    print("-" * 60)
    print(chunks[0]["text"][:500])
    print("-" * 60)

    # --------------------------------------------------------
    # Create vector database directory
    # --------------------------------------------------------

    VECTOR_DB_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    # --------------------------------------------------------
    # Load embedding model
    # --------------------------------------------------------

    print("\nLoading embedding model...")
    print(f"Model: {EMBEDDING_MODEL}")

    model = SentenceTransformer(
        EMBEDDING_MODEL
    )

    print("Embedding model loaded.")

    # --------------------------------------------------------
    # Create Chroma client
    # --------------------------------------------------------

    print("\nCreating Chroma vector database...")

    client = chromadb.PersistentClient(
        path=str(VECTOR_DB_DIR)
    )

    # --------------------------------------------------------
    # Delete old collection if it exists
    # --------------------------------------------------------

    try:

        client.delete_collection(
            name=COLLECTION_NAME
        )

        print("Old collection removed.")

    except Exception:
        pass

    # --------------------------------------------------------
    # Create collection
    # --------------------------------------------------------

    collection = client.create_collection(
        name=COLLECTION_NAME
    )

    # --------------------------------------------------------
    # Prepare data
    # --------------------------------------------------------

    documents = []
    metadatas = []
    ids = []

    for index, chunk in enumerate(chunks):

        text = chunk["text"]

        metadata = clean_metadata(
            chunk.get("metadata", {})
        )

        # Add our own useful metadata
        metadata["chunk_id"] = index

        documents.append(text)

        metadatas.append(metadata)

        ids.append(
            f"corvit_chunk_{index}"
        )

    # --------------------------------------------------------
    # Generate embeddings
    # --------------------------------------------------------

    print("\nCreating embeddings...")
    print("This may take some time the first time.")

    embeddings = model.encode(
        documents,
        show_progress_bar=True
    )

    # --------------------------------------------------------
    # Add to Chroma
    # --------------------------------------------------------

    print("\nSaving vectors...")

    collection.add(
        ids=ids,
        documents=documents,
        metadatas=metadatas,
        embeddings=embeddings.tolist()
    )

    # --------------------------------------------------------
    # Verify
    # --------------------------------------------------------

    total = collection.count()

    print("\n" + "=" * 60)
    print("VECTOR DATABASE CREATED SUCCESSFULLY")
    print("=" * 60)

    print(f"\nDocuments stored: {total}")

    print(f"\nVector database:")
    print(VECTOR_DB_DIR)

    print("\nCollection:")
    print(COLLECTION_NAME)

    print("\nEmbedding model:")
    print(EMBEDDING_MODEL)

    print("\nNext step:")
    print("Build the chatbot retrieval system.")
    print("=" * 60)


# ============================================================
# PROGRAM START
# ============================================================

if __name__ == "__main__":
    build_vector_database()