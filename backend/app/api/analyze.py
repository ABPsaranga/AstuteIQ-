import fitz  # PyMuPDF
from openai import OpenAI
from app.core.config import settings
import json

# ✅ FIX 1: correct key
client = OpenAI(api_key=settings.openai_api_key)


# -----------------------------
# 📄 Extract text + bounding boxes
# -----------------------------
def extract_blocks(file_bytes: bytes):
    doc = fitz.open(stream=file_bytes, filetype="pdf")

    pages_data = []

    # ✅ FIX 2: proper iteration
    for page_index in range(len(doc)):
        page = doc[page_index]
        blocks = page.get_text("blocks")

        page_blocks = []

        for b in blocks:
            x1, y1, x2, y2, text, *_ = b

            if not isinstance(text, str):
                continue

            clean_text = text.strip()

            if not clean_text:
                continue

            page_blocks.append({
                "text": clean_text,
                "bbox": {
                    "x1": float(x1),
                    "y1": float(y1),
                    "x2": float(x2),
                    "y2": float(y2),
                }
            })

        pages_data.append({
            "page": page_index + 1,
            "blocks": page_blocks
        })

    return pages_data


# -----------------------------
# 🧠 GPT ANALYSIS
# -----------------------------
def analyze_with_gpt(pages_data):
    issues = []
    issue_id = 1

    for page in pages_data:
        for block in page["blocks"]:
            text = block["text"]

            if len(text) < 40:
                continue

            prompt = f"""
You are a financial compliance AI.

Analyze this SOA text and detect issues.

Text:
{text}

Return JSON:
{{
  "issues": [
    {{
      "title": "...",
      "description": "...",
      "severity": "low | medium | high",
      "confidence": 0-100
    }}
  ]
}}
"""

            try:
                res = client.chat.completions.create(
                    model="gpt-4.1-mini",
                    messages=[
                        {"role": "system", "content": "You are a compliance AI."},
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.2,
                )

                content = res.choices[0].message.content

                # ✅ FIX 3: safe handling
                if not content:
                    continue

                try:
                    parsed = json.loads(content)
                except json.JSONDecodeError:
                    print("⚠️ Invalid JSON from GPT:", content[:200])
                    continue

                found = parsed.get("issues", [])

                for item in found:
                    issues.append({
                        "id": issue_id,
                        "title": item.get("title", "Issue"),
                        "description": item.get("description", ""),
                        "severity": item.get("severity", "low"),
                        "confidence": item.get("confidence", 70),
                        "page": page["page"],
                        "bbox": block["bbox"],  # 🔥 highlight mapping
                    })
                    issue_id += 1

            except Exception as e:
                print("❌ GPT error:", str(e))

    return issues