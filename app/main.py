import base64
import io
import json
import os
import re
from typing import Optional

import anthropic
import pdfplumber
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from datetime import datetime


load_dotenv()

app = FastAPI(title="AstuteIQ SOA Review", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

MODEL = "claude-opus-4-5"

# ─────────────────────────── SCHEMAS ───────────────────────────

class AnalyzeRequest(BaseModel):
    mode: str = Field("full", pattern="^(quick|full)$")
    new_soa_b64: str
    new_soa_name: str = "document.pdf"
    ref_soa_b64: Optional[str] = None
    support_files_b64: list[str] = []


class ExplainRequest(BaseModel):
    issue: dict


class ReviewCreate(BaseModel):
    client_name: str
    filename: str
    practice: str
    mode: str
    score: int
    risk_rating: str
    issue_count: int
    high_count: int
    medium_count: int
    low_count: int
    summary_headline: str
    summary_key_findings: list
    client_impact: str
    executive_summary: str
    issues: list
    plan_steps: list
    plan_priority: str    

@app.post("/reviews")
async def create_review(review: ReviewCreate):
    # simulate DB insert
    return {
        "id": int(datetime.now().timestamp()),
        "message": "Review created"
    }


# ─────────────────────────── HELPERS ───────────────────────────

def decode_pdf(b64: str) -> bytes:
    try:
        return base64.b64decode(b64)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 PDF: {e}")


def extract_text_from_bytes(pdf_bytes: bytes, max_pages: Optional[int] = None) -> str:
    text_parts: list[str] = []
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        pages = pdf.pages if max_pages is None else pdf.pages[:max_pages]
        for page_num, page in enumerate(pages, start=1):
            page_text = page.extract_text() or ""
            if page_text.strip():
                text_parts.append(f"[PAGE {page_num}]\n{page_text}")
    return "\n\n".join(text_parts)


def parse_json_response(text: str) -> dict:
    cleaned = re.sub(r"^```(?:json)?\s*", "", text.strip(), flags=re.MULTILINE)
    cleaned = re.sub(r"\s*```$", "", cleaned.strip(), flags=re.MULTILINE)
    return json.loads(cleaned)


def extract_claude_text(message) -> str:
    """
    Safely extract text from Claude response.
    Works with ALL block types.
    """
    parts = []

    for block in message.content:
        if hasattr(block, "text") and block.text:
            parts.append(block.text)

    return "".join(parts)


# ─────────────────────────── PROMPTS ───────────────────────────

SYSTEM_COMPLIANCE = """You are an expert Australian financial planning compliance analyst
specialising in Statements of Advice (SOA) under the Corporations Act 2001 and ASIC RG 175.

Always respond with valid JSON only.
"""

SYSTEM_EXPLAIN = """You are a financial compliance expert.
Always respond with valid JSON only.
"""


def build_analysis_prompt(new_soa_text, ref_soa_text, support_text, mode):
    sections = [f"=== NEW SOA ===\n{new_soa_text}"]

    if ref_soa_text:
        sections.append(f"=== REFERENCE SOA ===\n{ref_soa_text}")

    if support_text:
        sections.append(f"=== SUPPORT DOCUMENTS ===\n{support_text}")

    detail = (
        "Be thorough — identify all issues."
        if mode == "full"
        else "Focus on critical issues only."
    )

    return f"""
Analyse the SOA. {detail}

{chr(10).join(sections)}

Return JSON:
{{
  "issues": [],
  "summary": {{}},
  "report": {{}},
  "plan": {{}},
  "client_impact": ""
}}
"""


def build_explain_prompt(issue: dict) -> str:
    return f"""
Explain this issue:

Title: {issue.get('title')}
Description: {issue.get('description')}
Severity: {issue.get('severity')}

Return JSON:
{{
  "summary": "...",
  "fix": "...",
  "risk": "..."
}}
"""


# ─────────────────────────── ROUTES ───────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL}


@app.post("/api/analyze")
async def analyze(req: AnalyzeRequest):

    new_pdf_bytes = decode_pdf(req.new_soa_b64)
    ref_pdf_bytes = decode_pdf(req.ref_soa_b64) if req.ref_soa_b64 else None
    support_bytes_list = [decode_pdf(b) for b in req.support_files_b64]

    max_pages = 10 if req.mode == "quick" else None
    new_soa_text = extract_text_from_bytes(new_pdf_bytes, max_pages=max_pages)

    if not new_soa_text.strip():
        raise HTTPException(422, "No text found in PDF")

    ref_soa_text = (
        extract_text_from_bytes(ref_pdf_bytes, max_pages=max_pages)
        if ref_pdf_bytes else None
    )

    support_text = "\n\n---\n\n".join(
        extract_text_from_bytes(b, max_pages=5)
        for b in support_bytes_list
    )

    del new_pdf_bytes, ref_pdf_bytes, support_bytes_list

    prompt = build_analysis_prompt(new_soa_text, ref_soa_text, support_text, req.mode)

    try:
        message = client.messages.create(
            model=MODEL,
            max_tokens=4096,
            system=SYSTEM_COMPLIANCE,
            messages=[{"role": "user", "content": prompt}],
        )
    except anthropic.APIError as e:
        raise HTTPException(502, f"Claude error: {e}")

    try:
        raw_text = extract_claude_text(message)
        result = parse_json_response(raw_text)
    except Exception as e:
        raise HTTPException(502, f"Parse error: {e}")

    return result


@app.post("/api/explain")
async def explain(req: ExplainRequest):

    prompt = build_explain_prompt(req.issue)

    try:
        message = client.messages.create(
            model=MODEL,
            max_tokens=1024,
            system=SYSTEM_EXPLAIN,
            messages=[{"role": "user", "content": prompt}],
        )
    except anthropic.APIError as e:
        raise HTTPException(502, f"Claude error: {e}")

    try:
        raw_text = extract_claude_text(message)
        result = parse_json_response(raw_text)
    except Exception as e:
        raise HTTPException(502, f"Parse error: {e}")

    return result


# ─────────────────────────── ENTRYPOINT ───────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)