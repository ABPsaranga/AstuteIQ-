import io
import os
from datetime import datetime
from typing import Optional, cast
from uuid import uuid4

from docx import Document as DocxDocument
from docx.shared import Pt, RGBColor
from docx.styles.style import _ParagraphStyle

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from sqlalchemy import (
    JSON,
    Column,
    DateTime,
    Integer,
    String,
    Text,
    create_engine,
)
from sqlalchemy.orm import Session, declarative_base, sessionmaker


# ─────────────────────────── DATABASE ───────────────────────────

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./astuteiq.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


class ReviewRecord(Base):
    __tablename__ = "reviews"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    client_name = Column(String, nullable=False, index=True)
    filename = Column(String, nullable=False)
    practice = Column(String, default="")
    reviewer = Column(String, default="")
    mode = Column(String, default="full")
    date = Column(DateTime, default=datetime.utcnow, index=True)

    score = Column(Integer, nullable=False)
    risk_rating = Column(String, nullable=False)

    issue_count = Column(Integer, default=0)
    high_count = Column(Integer, default=0)
    medium_count = Column(Integer, default=0)
    low_count = Column(Integer, default=0)

    summary_headline = Column(Text, default="")
    summary_key_findings = Column(JSON, default=list)
    client_impact = Column(Text, default="")
    executive_summary = Column(Text, default="")

    issues = Column(JSON, default=list)
    plan_steps = Column(JSON, default=list)
    plan_priority = Column(String, default="")

    created_at = Column(DateTime, default=datetime.utcnow)


Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─────────────────────────── SCHEMAS ───────────────────────────

class SaveReviewRequest(BaseModel):
    client_name: str
    filename: str
    practice: str = ""
    reviewer: str = ""
    mode: str = "full"
    score: int
    risk_rating: str

    issue_count: int
    high_count: int
    medium_count: int
    low_count: int

    summary_headline: str = ""
    summary_key_findings: list[str] = []
    client_impact: str = ""
    executive_summary: str = ""

    issues: list[dict] = []
    plan_steps: list[dict] = []
    plan_priority: str = ""


# ─────────────────────────── HELPERS ───────────────────────────

def record_to_summary(r: ReviewRecord) -> dict:
    return {
        "id": r.id,
        "client_name": r.client_name,
        "filename": r.filename,
        "practice": r.practice,
        "reviewer": r.reviewer,
        "mode": r.mode,
        "date": r.date.isoformat() if r.date else None, # pyright: ignore[reportGeneralTypeIssues]
        "score": r.score,
        "risk_rating": r.risk_rating,
        "issue_count": r.issue_count,
        "high_count": r.high_count,
        "medium_count": r.medium_count,
        "low_count": r.low_count,
    }


def record_to_detail(r: ReviewRecord) -> dict:
    return {
        **record_to_summary(r),
        "summary_headline": r.summary_headline,
        "summary_key_findings": r.summary_key_findings or [],
        "client_impact": r.client_impact,
        "executive_summary": r.executive_summary,
        "issues": r.issues or [],
        "plan_steps": r.plan_steps or [],
        "plan_priority": r.plan_priority,
    }


# ─────────────────────────── WORD EXPORT ───────────────────────

def build_word_report(record: ReviewRecord) -> bytes:
    doc = DocxDocument()

    style = cast(_ParagraphStyle, doc.styles["Normal"])
    style.font.name = "Calibri"
    style.font.size = Pt(11)

    def add_heading(text: str, level: int = 1):
        h = doc.add_heading(text, level=level)
        if h.runs:
            h.runs[0].font.color.rgb = RGBColor(0x2D, 0x27, 0x8B)

    def add_para(text: str, bold: bool = False, color: Optional[RGBColor] = None):
        p = doc.add_paragraph()
        run = p.add_run(text)
        run.bold = bold
        if color:
            run.font.color.rgb = color
        return p

    def add_rule():
        doc.add_paragraph("─" * 60)

    # ✅ normalize ORM → Python types
    score = int(record.score or 0) # pyright: ignore[reportArgumentType]
    risk_rating = str(record.risk_rating or "")

    client_name = str(record.client_name or "")
    filename = str(record.filename or "")
    practice = str(record.practice or "")
    reviewer = str(record.reviewer or "AstuteIQ AI")
    mode = str(record.mode or "")

    summary_headline = str(record.summary_headline or "")
    executive_summary = str(record.executive_summary or "")
    client_impact = str(record.client_impact or "")

    issues = list(record.issues or []) # pyright: ignore[reportArgumentType]
    steps = list(record.plan_steps or []) # pyright: ignore[reportArgumentType]
    key_findings = list(record.summary_key_findings or []) # pyright: ignore[reportArgumentType]

    plan_priority = str(record.plan_priority or "")

    date_str = (
        record.date.strftime('%d %B %Y')
        if record.date else datetime.utcnow().strftime('%d %B %Y') # pyright: ignore[reportGeneralTypeIssues]
    )

    # ── Cover ──
    doc.add_heading("AstuteIQ — SOA Compliance Report", 0)
    doc.add_paragraph(f"Client: {client_name}")
    doc.add_paragraph(f"File: {filename}")
    doc.add_paragraph(f"Practice: {practice}")
    doc.add_paragraph(f"Reviewer: {reviewer}")
    doc.add_paragraph(f"Date: {date_str}")
    doc.add_paragraph(f"Mode: {mode.title()} Analysis")
    doc.add_page_break()

    # ── Executive Summary ──
    add_heading("Executive Summary")

    score_color = (
        RGBColor(0x4F, 0xC8, 0xA4) if score >= 75
        else RGBColor(0xF5, 0xA6, 0x23) if score >= 50
        else RGBColor(0xF0, 0x60, 0x60)
    )

    add_para(f"Compliance Score: {score}/100", bold=True, color=score_color)
    add_para(f"Risk Rating: {risk_rating}", bold=True)

    doc.add_paragraph()
    add_para(summary_headline)

    if executive_summary.strip():
        doc.add_paragraph(executive_summary)

    # ── Key Findings ──
    if key_findings:
        add_heading("Key Findings", level=2)
        for f in key_findings:
            doc.add_paragraph(f"• {f}")

    # ── Client Impact ──
    if client_impact.strip():
        add_heading("Client Impact", level=2)
        doc.add_paragraph(client_impact)

    add_rule()

    # ── Issues ──
    add_heading(f"Compliance Issues ({len(issues)})")

    sev_colors = {
        "high": RGBColor(0xF0, 0x60, 0x60),
        "medium": RGBColor(0xF5, 0xA6, 0x23),
        "low": RGBColor(0x4F, 0xC8, 0xA4),
    }

    for i, issue in enumerate(issues, 1):
        sev = issue.get("severity", "low")
        color = sev_colors.get(sev, RGBColor(0x88, 0x88, 0x88))

        add_para(
            f"{i}. [{sev.upper()}] p.{issue.get('page', '?')} — {issue.get('title', '')}",
            bold=True,
            color=color,
        )
        doc.add_paragraph(f"Category: {issue.get('category', '')}")
        doc.add_paragraph(issue.get("description", ""))

        if issue.get("regulation"):
            add_para(f"Regulation: {issue['regulation']}", color=RGBColor(0x55, 0x55, 0xAA))

        if issue.get("fix"):
            add_para(f"Remediation: {issue['fix']}", color=RGBColor(0x2A, 0x8A, 0x6A))

    add_rule()

    # ── Plan ──
    add_heading(f"Remediation Plan — {plan_priority}")

    for i, step in enumerate(steps, 1):
        add_para(f"{i}. {step.get('step', '')}", bold=True)
        doc.add_paragraph(f"Owner: {step.get('owner', '')}")
        doc.add_paragraph(step.get("detail", ""))

    add_rule()
    doc.add_paragraph(
        "Generated by AstuteIQ AI | "
        f"{datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')}"
    )

    buf = io.BytesIO()
    doc.save(buf)
    buf.seek(0)
    return buf.read()


# ─────────────────────────── ROUTES ───────────────────────────

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.get("/history")
def list_reviews(limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    records = (
        db.query(ReviewRecord)
        .order_by(ReviewRecord.date.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [record_to_summary(r) for r in records]


@router.get("/{review_id}")
def get_review(review_id: str, db: Session = Depends(get_db)):
    record = db.query(ReviewRecord).filter(ReviewRecord.id == review_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Review not found")
    return record_to_detail(record)


@router.get("/{review_id}/export")
def export_review(review_id: str, db: Session = Depends(get_db)):
    record = db.query(ReviewRecord).filter(ReviewRecord.id == review_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Review not found")

    docx_bytes = build_word_report(record)

    filename = (
        f"astuteiq-{record.client_name.replace(' ', '-').lower()}-"
        f"{record.date.strftime('%Y%m%d')}.docx"
    )

    return StreamingResponse(
        io.BytesIO(docx_bytes),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("", status_code=201)
def save_review(req: SaveReviewRequest, db: Session = Depends(get_db)):
    record = ReviewRecord(**req.dict())
    db.add(record)
    db.commit()
    db.refresh(record)
    return {"id": record.id}


@router.delete("/{review_id}", status_code=204)
def delete_review(review_id: str, db: Session = Depends(get_db)):
    record = db.query(ReviewRecord).filter(ReviewRecord.id == review_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Review not found")
    db.delete(record)
    db.commit()