from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI
import json

from app.core.config import settings

router = APIRouter()

client = OpenAI(api_key=settings.OPENAI_API_KEY)


class ExplainRequest(BaseModel):
    title: str
    description: str
    severity: str


@router.post("/api/explain")
async def explain_issue(req: ExplainRequest):
    prompt = f"""
Explain this issue:

Title: {req.title}
Description: {req.description}
Severity: {req.severity}

Return JSON:
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

        if not content:
            raise HTTPException(status_code=500, detail="Empty AI response")

        return json.loads(content)

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=502,
            detail="AI returned invalid JSON"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))