import os
import json
from datetime import datetime
from anthropic import Anthropic
from dotenv import load_dotenv
from app.utils.chunking import chunk_text

load_dotenv()

client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


async def run_claude_review(mode: str, files: list[dict]) -> dict:
    combined_text = ""

    for f in files:
        try:
            text = f["content"].decode(errors="ignore")
            chunks = chunk_text(text)

            for chunk in chunks[:3]:  # limit chunks per file
                combined_text += f"\n\nFILE: {f['filename']}\n{chunk}"
        except:
            continue

    prompt = f"""
You are a financial compliance AI.

Return ONLY JSON:

{{
  "risk_score": float,
  "summary": string,
  "checks": [
    {{"check": string, "result": "Pass" | "Fail"}}
  ]
}}

Mode: {mode}

Documents:
{combined_text[:10000]}
"""

    response = client.messages.create(
        model="claude-3-sonnet-20240229",
        max_tokens=1000,
        temperature=0.2,
        messages=[{"role": "user", "content": prompt}],
    )

    output_text = "".join(
    block.type for block in response.content
    if getattr(block, "type", None) == "text"
    )

    try:
        parsed = json.loads(output_text)
    except:
        parsed = {
            "risk_score": 0.5,
            "summary": output_text,
            "checks": [],
        }

    return {
        "client_name": "Claude",
        "mode": mode,
        "datetime": datetime.utcnow().isoformat(),
        **parsed,
    }