"""
strip_nav_boilerplate.py
--------------------------
One-time cleanup: removes the repeated navigation menu text that appears at
the start of almost every chunk in chatbot/corvit_data.json (e.g. "Skip to
content Corvit Systems- Timings 9 Am to 9 Pm Home Courses Web Development...
Schedules Lahore Campus Islamabad Campus Rawalpindi Campus Contact Us Menu").

Why this matters: since that nav text repeats on every single page, words
like "Schedule" or "Fees" inside it pollute search results for EVERY chunk,
making it impossible to tell a page that's genuinely about schedules from
one that just has "Schedules" in its menu.

Run from your project root (Corvit_Chatbot/):
    python processing/strip_nav_boilerplate.py
"""

import json
import re
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = PROJECT_ROOT / "chatbot" / "corvit_data.json"

# The repeated nav block varies slightly in whitespace/repetition across pages,
# so we match it as a flexible pattern rather than one exact string.
NAV_PATTERN = re.compile(
    r"(Skip to content\s*)?"
    r"Corvit Systems-?\s*Timings 9 ?Am to 9 ?Pm\s*"
    r"(Home\s*)?"
    r"(Courses\s*)?"
    r".*?Contact Us\s*(Menu)?",
    re.IGNORECASE | re.DOTALL,
)

# The nav block sometimes appears TWICE in a row (once for desktop, once
# for mobile menu) -- this pattern with a non-greedy match plus re-running
# it handles that.

# Also strip the repeated footer block that appears at the end of most pages.
FOOTER_PATTERN = re.compile(
    r"We focus on technologies like Routing.*?(All rights Reserved.*?Corvit Systems-?\d*)?$",
    re.IGNORECASE | re.DOTALL,
)


def clean_text(text: str) -> str:
    original_len = len(text)

    # Strip nav block (run twice in case it appears duplicated)
    text = NAV_PATTERN.sub("", text, count=1)
    text = NAV_PATTERN.sub("", text, count=1)

    # Strip footer block
    text = FOOTER_PATTERN.sub("", text)

    text = text.strip()

    # If stripping ate almost everything (nav-only chunk with no real
    # content), flag it by returning empty so we can drop it.
    if len(text) < 30:
        return ""

    return text


def clean_all():
    if not DATA_PATH.exists():
        print(f"ERROR: could not find {DATA_PATH}")
        return

    records = json.loads(DATA_PATH.read_text(encoding="utf-8"))

    cleaned = []
    dropped = 0
    for r in records:
        new_text = clean_text(r["text"])
        if not new_text:
            dropped += 1
            continue
        r["text"] = new_text
        cleaned.append(r)

    DATA_PATH.write_text(json.dumps(cleaned, ensure_ascii=False, indent=2), encoding="utf-8")

    print("=" * 50)
    print("BOILERPLATE CLEANUP COMPLETE")
    print("=" * 50)
    print(f"Original records : {len(records)}")
    print(f"Cleaned records  : {len(cleaned)}")
    print(f"Dropped (empty)  : {dropped}")
    print(f"Updated file     : {DATA_PATH}")


if __name__ == "__main__":
    clean_all()