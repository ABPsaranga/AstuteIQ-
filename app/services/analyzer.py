import fitz
from openai import OpenAI
import json
from app.core.config import settings
client = OpenAI(api_key=settings.OPENAI_API_KEY)


def extract_blocks(file_bytes: bytes):
    doc = fitz.open(stream=file_bytes, filetype="pdf")

    pages_data = []

    for page_index in range(len(doc)):
        page = doc[page_index]
        blocks = page.get_text("blocks")

        page_blocks = []

        for b in blocks:
            x1, y1, x2, y2, text, *_ = b

            if not isinstance(text, str) or not text.strip():
                continue

            page_blocks.append({
                "text": text.strip(),
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


def analyze_with_gpt(pages_data):
    issues = []
    issue_id = 1

    for page in pages_data:
        for block in page["blocks"]:
            text = block["text"]

            if len(text) < 40:
                continue

            prompt = f"""
Return JSON:

[
  {{
    "title": "...",
    "description": "...",
    "severity": "low | medium | high",
    "confidence": number
  }}
]

TEXT:
{text}
"""

            try:
                res = client.chat.completions.create(
                    model="gpt-4.1-mini",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.2,
                )

                content = res.choices[0].message.content

                if not content:
                    continue

                try:
                    data = json.loads(content)
                except json.JSONDecodeError:
                    continue

                found = data if isinstance(data, list) else data.get("issues", [])

                for item in found:
                    issues.append({
                        "id": issue_id,
                        "title": item.get("title", "Issue"),
                        "description": item.get("description", ""),
                        "severity": item.get("severity", "low"),
                        "confidence": item.get("confidence", 70),
                        "page": page["page"],
                        "bbox": block["bbox"],
                    })
                    issue_id += 1

            except Exception as e:
                print("GPT error:", e)

    return issues