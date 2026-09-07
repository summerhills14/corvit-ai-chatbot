"""
convert_to_web_data.py
------------------------
Converts processing/processed_chunks.json (your process.py output) into
chatbot/corvit_data.json -- the exact format chatbot.js expects:

    [
      {"id": "...", "category": "courses", "title": "...", "url": "...", "text": "..."},
      ...
    ]

Your processed_chunks.json format is: [{"text": "...", "source": "courses\\course_python_c30a6738.txt"}, ...]

What this script does:
  - Skips entries whose source ends in "_metadata.json" (these are just short
    duplicate page titles -- the full content already exists under the
    matching .txt source).
  - Extracts "category" from the first folder in the source path
    (courses, fees, campuses, website, etc.)
  - Builds a readable "title" from the filename (e.g. "course_ai-deep-
    learning_5a7ce97a.txt" -> "Ai Deep Learning"), reused for every chunk
    from the same source file.
  - Best-effort reconstructs the original corvit.com.pk URL from the
    filename pattern. If it can't confidently guess, leaves url empty --
    that's fine, chatbot.js already handles a missing url gracefully.

Run from your project root (Corvit_Chatbot/):
    python processing/convert_to_web_data.py
"""

import json
import re
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
INPUT_PATH = PROJECT_ROOT / "processing" / "processed_chunks.json"
OUTPUT_PATH = PROJECT_ROOT / "chatbot" / "corvit_data.json"

BASE_URL = "https://corvit.com.pk"


def normalize_source(source: str):
    """Split a source path like 'courses\\course_python_c30a6738.txt'
    into (category, filename)."""
    parts = re.split(r"[\\/]", source)
    category = parts[0] if len(parts) > 1 else "website"
    filename = parts[-1]
    return category, filename


def strip_hash_suffix(stem: str) -> str:
    """Remove the trailing 8-char hex hash Corvit's scraper added, e.g.
    'course_ai-deep-learning_5a7ce97a' -> 'course_ai-deep-learning'."""
    return re.sub(r"_[0-9a-f]{8}$", "", stem)


def make_title(filename: str, category: str) -> str:
    stem = filename.rsplit(".", 1)[0]
    stem = strip_hash_suffix(stem)

    # Drop common prefixes that aren't part of the readable title
    stem = re.sub(r"^course-category_", "", stem)
    stem = re.sub(r"^course_", "", stem)

    words = stem.replace("-", " ").replace("_", " ").split()
    return " ".join(w.capitalize() for w in words) if words else category.capitalize()


def guess_url(filename: str, category: str) -> str:
    stem = filename.rsplit(".", 1)[0]
    stem = strip_hash_suffix(stem)

    if stem.startswith("course_"):
        slug = stem[len("course_"):]
        return f"{BASE_URL}/course/{slug}"

    if stem.startswith("course-category_"):
        slug = stem[len("course-category_"):]
        return f"{BASE_URL}/course-category/{slug}"

    if category in ("campuses", "fees"):
        return f"{BASE_URL}/{stem}"

    if category == "website":
        # Blog posts / misc pages: filenames often mirror the URL path
        # closely enough to be useful, though not guaranteed exact.
        return f"{BASE_URL}/{stem}"

    return ""


def convert():
    if not INPUT_PATH.exists():
        print(f"ERROR: could not find {INPUT_PATH}")
        return

    raw = json.loads(INPUT_PATH.read_text(encoding="utf-8"))

    records = []
    skipped_metadata = 0
    title_cache = {}  # source -> title, so all chunks from one file match

    for i, entry in enumerate(raw):
        source = entry.get("source", "")
        text = entry.get("text", "").strip()

        if source.endswith("_metadata.json"):
            skipped_metadata += 1
            continue

        if not text:
            continue

        category, filename = normalize_source(source)

        if source not in title_cache:
            title_cache[source] = make_title(filename, category)
        title = title_cache[source]

        url = guess_url(filename, category)

        records.append({
            "id": f"{source}__{i}",
            "category": category,
            "title": title,
            "url": url,
            "text": text,
        })

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")

    size_kb = OUTPUT_PATH.stat().st_size / 1024
    print("=" * 50)
    print("CONVERSION COMPLETE")
    print("=" * 50)
    print(f"Input chunks         : {len(raw)}")
    print(f"Skipped (metadata)   : {skipped_metadata}")
    print(f"Output records       : {len(records)}")
    print(f"Output file          : {OUTPUT_PATH}")
    print(f"File size            : {size_kb:.1f} KB")


if __name__ == "__main__":
    convert()