import os
import json
import re
from pathlib import Path


# ==================================================
# PATH CONFIGURATION
# ==================================================

BASE_DIR = Path(__file__).resolve().parent.parent

DATASET_DIR = BASE_DIR / "data" / "CORVIT_DATASET"

OUTPUT_FILE = Path(__file__).resolve().parent / "processed_chunks.json"


# ==================================================
# CLEAN TEXT
# ==================================================

def clean_text(text):
    """
    Cleans unnecessary spaces, HTML tags,
    URLs and unwanted characters.
    """

    if not text:
        return ""

    # Convert to string
    text = str(text)

    # Remove HTML tags
    text = re.sub(r"<[^>]+>", " ", text)

    # Remove multiple spaces
    text = re.sub(r"\s+", " ", text)

    # Remove excessive newlines
    text = re.sub(r"\n+", "\n", text)

    return text.strip()


# ==================================================
# EXTRACT TEXT FROM JSON
# ==================================================

def extract_text_from_json(data):
    """
    Recursively extracts text from JSON data.
    """

    texts = []

    if isinstance(data, dict):

        for key, value in data.items():

            # Ignore URL-only fields
            if key.lower() not in [
                "url",
                "link",
                "image",
                "image_url",
                "source"
            ]:
                texts.extend(extract_text_from_json(value))

    elif isinstance(data, list):

        for item in data:
            texts.extend(extract_text_from_json(item))

    elif isinstance(data, str):

        cleaned = clean_text(data)

        if len(cleaned) > 20:
            texts.append(cleaned)

    return texts


# ==================================================
# CREATE TEXT CHUNKS
# ==================================================

def create_chunks(text, chunk_size=800, overlap=100):
    """
    Splits large text into smaller overlapping chunks.
    """

    chunks = []

    start = 0
    text_length = len(text)

    while start < text_length:

        end = start + chunk_size

        chunk = text[start:end]

        # Try to end at a sentence
        if end < text_length:

            last_period = chunk.rfind(".")

            if last_period > chunk_size * 0.5:
                end = start + last_period + 1
                chunk = text[start:end]

        chunk = chunk.strip()

        if len(chunk) > 50:
            chunks.append(chunk)

        start = end - overlap

        if start < 0:
            start = 0

        if end >= text_length:
            break

    return chunks


# ==================================================
# PROCESS FILE
# ==================================================

def process_file(file_path):

    try:

        # ------------------------------------------
        # JSON FILE
        # ------------------------------------------

        if file_path.suffix.lower() == ".json":

            with open(
                file_path,
                "r",
                encoding="utf-8"
            ) as f:

                data = json.load(f)

            texts = extract_text_from_json(data)

            return " ".join(texts)


        # ------------------------------------------
        # TEXT FILE
        # ------------------------------------------

        elif file_path.suffix.lower() == ".txt":

            with open(
                file_path,
                "r",
                encoding="utf-8"
            ) as f:

                return clean_text(f.read())


    except Exception as e:

        print(f"Error processing {file_path.name}: {e}")

    return ""


# ==================================================
# MAIN PREPROCESSING FUNCTION
# ==================================================

def preprocess_dataset():

    print("\n" + "=" * 60)
    print("STARTING DATA PREPROCESSING")
    print("=" * 60 + "\n")

    all_chunks = []

    processed_files = 0


    # Find all JSON and TXT files
    files = list(DATASET_DIR.rglob("*.json"))
    files += list(DATASET_DIR.rglob("*.txt"))


    print(f"Files found: {len(files)}\n")


    for file_path in files:

        print(f"Processing: {file_path.name}")

        text = process_file(file_path)


        if text:

            chunks = create_chunks(text)


            for chunk in chunks:

                all_chunks.append({
                    "text": chunk,
                    "source": str(
                        file_path.relative_to(DATASET_DIR)
                    )
                })


            processed_files += 1


    # ==================================================
    # REMOVE DUPLICATE CHUNKS
    # ==================================================

    unique_chunks = []

    seen = set()

    for item in all_chunks:

        normalized_text = item["text"].lower().strip()

        if normalized_text not in seen:

            seen.add(normalized_text)

            unique_chunks.append(item)


    # ==================================================
    # SAVE PROCESSED DATA
    # ==================================================

    with open(
        OUTPUT_FILE,
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(
            unique_chunks,
            f,
            indent=4,
            ensure_ascii=False
        )


    # ==================================================
    # RESULTS
    # ==================================================

    print("\n" + "=" * 60)
    print("PREPROCESSING COMPLETED")
    print("=" * 60)

    print(f"Files processed: {processed_files}")
    print(f"Total chunks: {len(all_chunks)}")
    print(f"Unique chunks: {len(unique_chunks)}")

    print(f"\nSaved to:")
    print(OUTPUT_FILE)


# ==================================================
# PROGRAM START
# ==================================================

if __name__ == "__main__":

    preprocess_dataset()