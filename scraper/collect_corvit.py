import os
import json
import time
import hashlib
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup


# ============================================================
# CONFIGURATION
# ============================================================

BASE_URL = "https://corvit.com.pk/"
ALLOWED_DOMAIN = "corvit.com.pk"

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DATASET_DIR = os.path.join(
    PROJECT_ROOT,
    "data",
    "CORVIT_DATASET"
)

MAX_PAGES = 50
REQUEST_DELAY = 1

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 Chrome/131.0 Safari/537.36"
    )
}


# ============================================================
# FOLDER CLASSIFICATION
# ============================================================

def get_category(url):
    """
    Decide which dataset folder a URL belongs to.
    """

    url_lower = url.lower()

    if "navttc" in url_lower:
        return "navttc"

    if "fee" in url_lower or "price" in url_lower:
        return "fees"

    if "course" in url_lower or "training" in url_lower:
        return "courses"

    if "campus" in url_lower or "location" in url_lower:
        return "campuses"

    if "schedule" in url_lower or "timetable" in url_lower:
        return "timetables"

    if (
        "announcement" in url_lower
        or "news" in url_lower
        or "event" in url_lower
    ):
        return "announcements"

    return "website"


# ============================================================
# URL CLEANING
# ============================================================

def normalize_url(url):
    """
    Clean URLs so the same page isn't collected multiple times.
    """

    parsed = urlparse(url)

    clean_url = parsed._replace(
        fragment="",
        query=""
    ).geturl()

    if clean_url.endswith("/"):
        clean_url = clean_url[:-1]

    return clean_url


# ============================================================
# CHECK URL
# ============================================================

def is_valid_url(url):
    """
    Allow only HTTP/HTTPS pages from Corvit's domain.
    """

    parsed = urlparse(url)

    if parsed.scheme not in ["http", "https"]:
        return False

    domain = parsed.netloc.lower()

    return (
        domain == ALLOWED_DOMAIN
        or domain.endswith("." + ALLOWED_DOMAIN)
    )


# ============================================================
# CREATE SAFE FILE NAME
# ============================================================

def create_filename(url):
    """
    Create a safe filename from a URL.
    """

    parsed = urlparse(url)

    path = parsed.path.strip("/")

    if not path:
        name = "home"
    else:
        name = path.replace("/", "_")

    # Remove unsafe characters
    safe_name = "".join(
        char if char.isalnum() or char in "-_"
        else "_"
        for char in name
    )

    # Prevent extremely long filenames
    safe_name = safe_name[:100]

    # Add short URL hash to avoid collisions
    url_hash = hashlib.md5(
        url.encode("utf-8")
    ).hexdigest()[:8]

    return f"{safe_name}_{url_hash}"


# ============================================================
# DOWNLOAD PAGE
# ============================================================

def download_page(url):
    """
    Download one webpage.
    """

    try:

        response = requests.get(
            url,
            headers=HEADERS,
            timeout=20
        )

        response.raise_for_status()

        content_type = response.headers.get(
            "Content-Type",
            ""
        )

        if "text/html" not in content_type:
            print(f"Skipped non-HTML: {url}")
            return None

        return response.text

    except requests.RequestException as error:

        print(f"ERROR: {url}")
        print(error)

        return None


# ============================================================
# EXTRACT PAGE INFORMATION
# ============================================================

def extract_page_data(html, url):

    soup = BeautifulSoup(
        html,
        "html.parser"
    )

    # Remove unnecessary elements
    for tag in soup(
        ["script", "style", "noscript"]
    ):
        tag.decompose()

    title = ""

    if soup.title:
        title = soup.title.get_text(
            " ",
            strip=True
        )

    text = soup.get_text(
        "\n",
        strip=True
    )

    # Find internal links
    links = set()

    for anchor in soup.find_all("a", href=True):

        href = anchor["href"].strip()

        if not href:
            continue

        full_url = urljoin(
            url,
            href
        )

        full_url = normalize_url(
            full_url
        )

        if is_valid_url(full_url):

            links.add(full_url)

    return {
        "title": title,
        "text": text,
        "links": list(links)
    }


# ============================================================
# SAVE PAGE
# ============================================================

def save_page(url, html, page_data):

    category = get_category(url)

    category_dir = os.path.join(
        DATASET_DIR,
        category
    )

    os.makedirs(
        category_dir,
        exist_ok=True
    )

    filename = create_filename(url)

    html_path = os.path.join(
        category_dir,
        filename + ".html"
    )

    text_path = os.path.join(
        category_dir,
        filename + ".txt"
    )

    metadata_path = os.path.join(
        category_dir,
        filename + "_metadata.json"
    )

    # Save original HTML
    with open(
        html_path,
        "w",
        encoding="utf-8"
    ) as file:

        file.write(html)

    # Save extracted text
    with open(
        text_path,
        "w",
        encoding="utf-8"
    ) as file:

        file.write(page_data["text"])

    # Save metadata
    metadata = {
        "url": url,
        "title": page_data["title"],
        "category": category,
        "source": "Corvit official website",
        "source_type": "official_website",
        "date_collected": time.strftime(
            "%Y-%m-%d"
        ),
        "status": "collected"
    }

    with open(
        metadata_path,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            metadata,
            file,
            indent=4,
            ensure_ascii=False
        )

    print(f"Saved: {category}/{filename}")


# ============================================================
# MAIN CRAWLER
# ============================================================

def crawl():

    print("=" * 60)
    print("CORVIT DATA COLLECTOR")
    print("=" * 60)

    print(f"Starting URL: {BASE_URL}")
    print(f"Maximum pages: {MAX_PAGES}")
    print()

    visited = set()

    queue = [
        normalize_url(BASE_URL)
    ]

    collected = 0

    while queue and collected < MAX_PAGES:

        url = queue.pop(0)

        if url in visited:
            continue

        visited.add(url)

        print(
            f"[{collected + 1}/{MAX_PAGES}] "
            f"Collecting: {url}"
        )

        html = download_page(url)

        if html is None:
            continue

        page_data = extract_page_data(
            html,
            url
        )

        save_page(
            url,
            html,
            page_data
        )

        collected += 1

        # Add newly discovered links
        for link in page_data["links"]:

            if (
                link not in visited
                and link not in queue
            ):
                queue.append(link)

        time.sleep(
            REQUEST_DELAY
        )

    print()
    print("=" * 60)
    print("COLLECTION COMPLETED")
    print("=" * 60)

    print(f"Pages collected: {collected}")
    print(f"Pages visited: {len(visited)}")
    print()
    print(
        f"Dataset location:\n{DATASET_DIR}"
    )


# ============================================================
# PROGRAM START
# ============================================================

if __name__ == "__main__":
    crawl()