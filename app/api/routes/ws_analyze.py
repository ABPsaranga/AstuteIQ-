import fitz
import json
from openai import AsyncOpenAI
from app.core.config import settings

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


# -----------------------------
# 📄 Extract PDF blocks
# -----------------------------
def extract_blocks(file_bytes):
    doc = fitz.open(stream=file_bytes, filetype="pdf")

    pages_data = []

    # ✅ FIXED iteration (no enumerate(doc))
    for page_index in range(len(doc)):
        page = doc[page_index]

        blocks = page.get_text("blocks")

        page_blocks = []
        for b in blocks:
            x1, y1, x2, y2, text, *_ = b

            if not text or not text.strip():
                continue

            page_blocks.append({
                "text": text,
                "bbox": {
                    "x1": x1,
                    "y1": y1,
                    "x2": x2,
                    "y2": y2,
                }
            })

        pages_data.append({
            "page": page_index + 1,
            "blocks": page_blocks
        })

    return pages_data


# -----------------------------
# 🧠 SINGLE BLOCK ANALYSIS
# -----------------------------
async def analyze_block(block: dict, page: int):
    text = block.get("text", "")

    if len(text.strip()) < 60 or len(text.split()) < 8:
        return []

    prompt = f"""
You are a financial compliance AI.

Analyze this SOA text and detect issues.

Text:
{text}

Return ONLY JSON array:
[
  {{
    "title": "...",
    "description": "...",
    "severity": "low | medium | high",
    "confidence": 0-100
  }}
]
"""

    try:
        res = await client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
        )

        content = res.choices[0].message.content

        if not content:
            return []

        data = json.loads(content)

        issues = []
        for item in data:
            issues.append({
                "title": item.get("title", "Issue"),
                "description": item.get("description", ""),
                "severity": item.get("severity", "low"),
                "confidence": item.get("confidence", 70),
                "page": page,
                "bbox": block.get("bbox"),
            })

        return issues

    except Exception as e:
        print("GPT error:", e)
        return []