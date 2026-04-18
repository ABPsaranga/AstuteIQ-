import fitz  # PyMuPDF
from openai import OpenAI
from app.core.config import settings
import json

# ✅ Correct API key usage
client = OpenAI(api_key=settings.openai_api_key)


# -----------------------------
# 📄 Extract text + bounding boxes
# -----------------------------
def extract_blocks(file_bytes: bytes):
    doc = fitz.open(stream=file_bytes, filetype="pdf")

    pages_data = []

    for page_index in range(len(doc)):  # ✅ safe iteration
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
# 🧠 GPT ANALYSIS (OPTIMIZED ⚡)
# -----------------------------
def analyze_with_gpt(pages_data):
    issues = []
    issue_id = 1

    for page in pages_data:
        page_number = page["page"]

        # 🔥 Combine page text (FASTER than block-by-block)
        full_text = "\n".join(
            [b["text"] for b in page["blocks"] if len(b["text"]) > 20]
        )

        if len(full_text) < 50:
            continue

        prompt = f"""
You are a financial compliance AI.

Analyze this Statement of Advice (SOA).

Return ONLY JSON:

{{
  "issues": [
    {{
      "title": "...",
      "description": "...",
      "severity": "low | medium | high",
      "confidence": number,
      "quote": "exact matching phrase from text"
    }}
  ]
}}

TEXT:
{full_text[:12000]}
"""

        try:
            res = client.chat.completions.create(
                model="gpt-4.1-mini",
                messages=[
                    {"role": "system", "content": "You are a financial compliance AI."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,
            )

            content = res.choices[0].message.content

            # ✅ Safe handling
            if not content:
                continue

            try:
                parsed = json.loads(content)
            except json.JSONDecodeError:
                print("⚠️ Invalid JSON from GPT:", content[:200])
                continue

            found = parsed.get("issues", [])

            # 🔥 Match quote → bbox
            for item in found:
                quote = item.get("quote", "").lower()

                matched_bbox = None

                for block in page["blocks"]:
                    if quote and quote in block["text"].lower():
                        matched_bbox = block["bbox"]
                        break

                issues.append({
                    "id": issue_id,
                    "title": item.get("title", "Issue"),
                    "description": item.get("description", ""),
                    "severity": item.get("severity", "low"),
                    "confidence": item.get("confidence", 70),
                    "page": page_number,
                    "quote": item.get("quote", ""),
                    "bbox": matched_bbox,  # 🔥 real highlight mapping
                })

                issue_id += 1

        except Exception as e:
            print("❌ GPT error:", str(e))

    return issues