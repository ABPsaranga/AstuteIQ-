import base64
from datetime import datetime
import io
import json
import os
import re
from typing import Optional, Dict, Any

import anthropic
import pdfplumber
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.api.routes.auth_routes import router as auth_router
from app.models.user_profile import UserProfile
from app.api.routes import reviews_routes, ws_analyze

from app.core.security import decode_access_token
from app.db.database import SessionLocal

load_dotenv()

app = FastAPI(title="AstuteIQ SOA Review", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

app.include_router(auth_router)

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
MODEL = "claude-opus-4-5"

# ───────────────── DB ─────────────────

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ───────────────── AUTH ─────────────────

bearer = HTTPBearer(auto_error=False)

def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
) -> str:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = credentials.credentials
    payload: Optional[Dict[str, Any]] = decode_access_token(token)

    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("sub")

    if not isinstance(user_id, str):
        raise HTTPException(status_code=401, detail="Invalid token payload")

    return user_id

# ───────────────── SCHEMAS ─────────────────

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

# ───────────────── ROUTES ─────────────────

@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL}

@app.post("/reviews")
async def create_review(
    review: ReviewCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    from app.models.review import Review

    db_review = Review(
        user_id=user_id,
        client_name=review.client_name,
        filename=review.filename,
        practice=review.practice,
        mode=review.mode,
        score=review.score,
        risk_rating=review.risk_rating,
        issue_count=review.issue_count,
        high_count=review.high_count,
        medium_count=review.medium_count,
        low_count=review.low_count,
        summary_headline=review.summary_headline,
        summary_key_findings=json.dumps(review.summary_key_findings),
        client_impact=review.client_impact,
        executive_summary=review.executive_summary,
        issues=json.dumps(review.issues),
        plan_steps=json.dumps(review.plan_steps),
        plan_priority=review.plan_priority,
    )

    db.add(db_review)
    db.commit()
    db.refresh(db_review)

    return {"id": db_review.id, "message": "Review created"}

@app.get("/api/reviews/history")
async def get_review_history(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    from app.models.review import Review

    reviews = (
        db.query(Review)
        .filter(Review.user_id == user_id)
        .order_by(Review.id.desc())
        .all()
    )

    return [
        {
            "id": str(r.id),
            "client_name": r.client_name,
            "filename": r.filename,
            "date": (
                r.created_at.isoformat()
                if isinstance(r.created_at, datetime)
                else str(r.created_at)
            ),            "score": r.score,
            "risk_rating": r.risk_rating,
            "high_count": r.high_count,
            "medium_count": r.medium_count,
            "low_count": r.low_count,
            "practice": r.practice,
        }
        for r in reviews
    ]

# ───────────────── HELPERS ─────────────────

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
    parts = []
    for block in message.content:
        if hasattr(block, "text") and block.text:
            parts.append(block.text)
    return "".join(parts)

# ───────────────── AI ROUTES ─────────────────

@app.post("/api/analyze")
async def analyze(req: AnalyzeRequest):
    new_pdf_bytes = decode_pdf(req.new_soa_b64)

    max_pages = 10 if req.mode == "quick" else None
    new_soa_text = extract_text_from_bytes(new_pdf_bytes, max_pages=max_pages)

    if not new_soa_text.strip():
        raise HTTPException(422, "No text found in PDF")

    prompt = f"Analyse SOA:\n{new_soa_text}"

    message = client.messages.create(
        model=MODEL,
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )

    raw_text = extract_claude_text(message)
    return parse_json_response(raw_text)

# ───────────────── ENTRYPOINT ─────────────────
app.include_router(reviews_routes.router, prefix="/api/reviews")
app.include_router(ws_analyze.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8001, reload=True)