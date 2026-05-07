from openai import OpenAI
import json
from app.core.config import settings


client = OpenAI(api_key=settings.OPENAI_API_KEY)


def analyze_soa(text: str):
    prompt = f"""
Return ONLY valid JSON:

[
  {{
    "title": "...",
    "description": "...",
    "severity": "low | medium | high",
    "confidence": number,
    "quote": "exact matching phrase"
  }}
]

TEXT:
{text[:12000]}
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {"role": "system", "content": "Return only JSON."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
        )

        content = response.choices[0].message.content

        if not content:
            raise ValueError("Empty response from OpenAI")

        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return [{
                "title": "Invalid JSON from AI",
                "description": content[:500],
                "severity": "medium",
                "confidence": 50,
                "quote": "",
            }]

    except Exception as e:
        return [{
            "title": "AI Processing Error",
            "description": str(e),
            "severity": "high",
            "confidence": 0,
            "quote": "",
        }]