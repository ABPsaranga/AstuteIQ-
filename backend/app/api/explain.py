from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI
from app.core.config import settings
import json

router = APIRouter()

# ✅ Get API key from settings
api_key = settings.OPENAI_API_KEY

if not api_key:
    raise ValueError("OPENAI_API_KEY is not set in environment")

# ✅ Initialize OpenAI client
client = OpenAI(api_key=api_key)


# ================= REQUEST MODEL ================= #

class ExplainRequest(BaseModel):
    title: str
    description: str
    severity: str


# ================= ROUTE ================= #

@router.post("/api/explain")
async def explain_issue(req: ExplainRequest):
    prompt = f"""
You are a financial compliance expert.

Explain this issue clearly:

Title: {req.title}
Description: {req.description}
Severity: {req.severity}

Return ONLY valid JSON:
{{
  "summary": "...",
  "why_it_matters": "...",
  "fix": "...",
  "risk_level": "LOW | MEDIUM | HIGH"
}}
"""

    try:
        res = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
        )

        content = res.choices[0].message.content

        # ✅ Handle empty response
        if not content:
            raise HTTPException(status_code=500, detail="Empty AI response")

        # ✅ Parse JSON safely
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=500,
                detail=f"Invalid JSON from AI: {content}",
            )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))