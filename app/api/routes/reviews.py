"""
Reviews router — history, run review, file upload, overrides, analytics.
"""
import os
import uuid
import time
import random
import json
import pathlib
from typing import Any, Optional
from collections import defaultdict

import anthropic
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel

from app.core.deps import get_current_user

router = APIRouter()

# ── Persistence (JSON file — survives restarts) ───────────────────────────────

_DB_PATH = pathlib.Path("reviews_db.json")

def _load_reviews() -> dict[str, dict]:
    if _DB_PATH.exists():
        try:
            return json.loads(_DB_PATH.read_text())
        except Exception:
            pass
    return {}

def _save_reviews(reviews: dict[str, dict]) -> None:
    try:
        _DB_PATH.write_text(json.dumps(reviews, indent=2))
    except Exception:
        pass

_reviews: dict[str, dict] = _load_reviews()
_uploads: dict[str, dict] = {}

# ── Supabase (optional — used if env vars are set) ────────────────────────────

def get_supabase():  # type: ignore[return]
    try:
        from supabase import create_client  # type: ignore[import]
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_KEY")
        if url and key:
            return create_client(url, key)
    except ImportError:
        pass
    return None

# ── Schemas ───────────────────────────────────────────────────────────────────

class RunReviewPayload(BaseModel):
    fileIds: list[str]
    mode:    str = "full"

class OverridePayload(BaseModel):
    checkId:   str
    newStatus: str
    comment:   str

# ── Mock data ─────────────────────────────────────────────────────────────────

CHECK_TEMPLATES = [
    {"title": "Risk profile documented",        "category": "Risk Profile",
     "messages": {"PASS": "Client risk profile clearly documented.", "FAIL": "No risk profile questionnaire found.", "WARNING": "Risk profile present but outdated."}},
    {"title": "Fee disclosure complete",         "category": "Fees & Costs",
     "messages": {"PASS": "All fees disclosed in dollar terms.", "FAIL": "Ongoing fees not in dollar terms.", "WARNING": "Fee disclosure missing estimated ongoing advice fee."}},
    {"title": "Best interests duty addressed",   "category": "Best Interests Duty",
     "messages": {"PASS": "Best interests duty clearly addressed.", "FAIL": "No best interests statement found.", "WARNING": "Best interests statement lacks specificity."}},
    {"title": "Client objectives captured",      "category": "Client Objectives",
     "messages": {"PASS": "Client objectives are specific and measurable.", "FAIL": "Client goals section missing or too vague.", "WARNING": "Objectives not linked to recommendations."}},
    {"title": "Replacement product comparison",  "category": "Replacement Product",
     "messages": {"PASS": "Replacement product analysis complete.", "FAIL": "Replacement product advice lacks comparison.", "NA": "No replacement product advice in this document."}},
    {"title": "Scope of advice defined",         "category": "Scope of Advice",
     "messages": {"PASS": "Scope clearly defined.", "WARNING": "Scope defined but recommendations extend beyond it."}},
    {"title": "Insurance needs analysis",        "category": "Insurance Adequacy",
     "messages": {"PASS": "Insurance needs analysis complete.", "FAIL": "Insurance recommendations without needs analysis.", "NA": "Insurance not in scope."}},
    {"title": "Projection assumptions disclosed","category": "Projections & Modelling",
     "messages": {"PASS": "All projection assumptions disclosed.", "FAIL": "Projections without assumptions.", "WARNING": "Growth rates inconsistent with risk profile."}},
]

def _weighted_status() -> str:
    r = random.random()
    if r < 0.55: return "PASS"
    if r < 0.75: return "FAIL"
    if r < 0.90: return "WARNING"
    return "NA"

def _mock_review(review_id: str, file_id: str, mode: str, user_id: str) -> dict[str, Any]:
    findings = []
    for i, c in enumerate(CHECK_TEMPLATES):
        status  = _weighted_status()
        message = c["messages"].get(status) or c["messages"].get("PASS", "Review complete.")
        findings.append({
            "checkId":    f"chk_{i+1}",
            "category":   c["category"],
            "title":      c["title"],
            "status":     status,
            "confidence": random.randint(60, 99),
            "message":    message,
            "pages":      [random.randint(1, 8), random.randint(9, 16)],
            "excerpt":    f"...relevant excerpt from page {random.randint(1, 10)}..." if status != "NA" else None,
            "section":    c["category"],
        })

    passing = sum(1 for f in findings if f["status"] == "PASS")
    total   = sum(1 for f in findings if f["status"] != "NA")
    score   = round((passing / total) * 100) if total > 0 else 0
    upload  = _uploads.get(file_id, {})

    return {
        "id":          review_id,
        "userId":      user_id,
        "fileName":    upload.get("filename", "SOA_Document.pdf"),
        "fileSize":    upload.get("size", 800_000),
        "mode":        mode,
        "status":      "complete",
        "score":       score,
        "findings":    findings,
        "overrides":   [],
        "createdAt":   time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(time.time() - 3600)),
        "completedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }

# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    user: dict       = Depends(get_current_user),
):
    content = await file.read()
    file_id = f"file_{uuid.uuid4().hex[:12]}"
    _uploads[file_id] = {"filename": file.filename, "size": len(content), "userId": user.get("sub") or user.get("id")}
    return {"fileId": file_id}


@router.post("/run")
async def run_review(
    body: RunReviewPayload,
    user: dict = Depends(get_current_user),
):
    if not body.fileIds:
        raise HTTPException(status_code=400, detail="No file IDs provided.")

    user_id   = user.get("sub") or user.get("id") or "unknown"
    review_id = f"rev_{uuid.uuid4().hex[:12]}"
    review    = _mock_review(review_id, body.fileIds[0] if body.fileIds else "", body.mode, user_id)

    _reviews[review_id] = review
    _save_reviews(_reviews)
    return review


@router.get("/history")
def review_history(
    page:  int  = 1,
    limit: int  = 20,
    user:  dict = Depends(get_current_user),
):
    from typing import cast
    user_id  = user.get("sub") or user.get("id") or "unknown"
    supabase = get_supabase()

    if supabase:
        try:
            offset = (page - 1) * limit
            res = (
                supabase.table("reviews")
                .select("*")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .range(offset, offset + limit - 1)
                .execute()
            )
            count_res = (
                supabase.table("reviews")
                .select("id", count="exact")  # type: ignore[call-arg]
                .eq("user_id", user_id)
                .execute()
            )
            rows: list[dict[str, Any]] = cast(list, res.data or [])
            reviews = [{
                "id":          r["id"],
                "userId":      r["user_id"],
                "fileName":    r["file_name"],
                "fileSize":    r["file_size"],
                "mode":        r["mode"],
                "status":      r["status"],
                "score":       r["score"],
                "findings":    r["findings"] or [],
                "overrides":   r["overrides"] or [],
                "createdAt":   r["created_at"],
                "completedAt": r["completed_at"],
            } for r in rows]
            count = getattr(count_res, "count", None) or 0
            return {"reviews": reviews, "total": count, "page": page, "limit": limit}
        except Exception as e:
            print(f"Supabase error: {e}")

    # Fallback: JSON-persisted in-memory reviews
    user_reviews = sorted(
        [r for r in _reviews.values() if r.get("userId") == user_id],
        key=lambda r: r.get("createdAt", ""),
        reverse=True,
    )
    start = (page - 1) * limit
    return {
        "reviews": user_reviews[start:start + limit],
        "total":   len(user_reviews),
        "page":    page,
        "limit":   limit,
    }
@router.get("/analytics")
def get_analytics(user: dict = Depends(get_current_user)):
    all_reviews = list(_reviews.values())

    # Monthly volume
    monthly: dict[str, dict[str, Any]] = {}
    for r in all_reviews:
        try:
            month = r["createdAt"][:7]
            if month not in monthly:
                monthly[month] = {"month": month, "reviews": 0, "pass": 0, "fail": 0}
            monthly[month]["reviews"] += 1
            if r["score"] >= 70:
                monthly[month]["pass"] += 1
            else:
                monthly[month]["fail"] += 1
        except Exception:
            pass

    # Category pass rates
    category_scores: dict[str, list[int]] = defaultdict(list)
    status_counts: dict[str, int] = {"pass": 0, "fail": 0, "warning": 0, "na": 0}

    for r in all_reviews:
        for f in r.get("findings", []):
            cat = f.get("category", "Other")
            category_scores[cat].append(1 if f["status"] == "PASS" else 0)
            s = f["status"].lower()
            if s in status_counts:
                status_counts[s] += 1

    category_data = [
        {"name": cat, "value": round(sum(scores) / len(scores) * 100) if scores else 0}
        for cat, scores in category_scores.items()
    ] or [
        {"name": "Risk Profile",      "value": 94},
        {"name": "Fees & Costs",      "value": 78},
        {"name": "Best Interests",    "value": 86},
        {"name": "Client Objectives", "value": 82},
        {"name": "Insurance",         "value": 71},
        {"name": "Projections",       "value": 68},
    ]

    total_findings = sum(status_counts.values()) or 1
    pie_data = [
        {"name": "PASS",    "value": round(status_counts["pass"]    / total_findings * 100), "color": "#22c55e"},
        {"name": "FAIL",    "value": round(status_counts["fail"]    / total_findings * 100), "color": "#ef4444"},
        {"name": "WARNING", "value": round(status_counts["warning"] / total_findings * 100), "color": "#f97316"},
        {"name": "NA",      "value": round(status_counts["na"]      / total_findings * 100), "color": "#6b7280"},
    ] if sum(status_counts.values()) > 0 else [
        {"name": "PASS",    "value": 55, "color": "#22c55e"},
        {"name": "FAIL",    "value": 20, "color": "#ef4444"},
        {"name": "WARNING", "value": 18, "color": "#f97316"},
        {"name": "NA",      "value": 7,  "color": "#6b7280"},
    ]

    completed  = [r for r in all_reviews if r.get("status") == "complete"]
    avg_score  = round(sum(r["score"] for r in completed) / len(completed)) if completed else 0

    return {
        "kpis": {
            "reviews_this_month": len(all_reviews),
            "pass_rate":          f"{avg_score}%" if completed else "—",
            "avg_confidence":     "79%",
            "critical_failures":  status_counts["fail"],
        },
        "monthly_data":   sorted(monthly.values(), key=lambda x: x["month"])[-7:],
        "category_data":  category_data,
        "pie_data":       pie_data,
    }


@router.get("/{review_id}")
def get_review(
    review_id: str,
    user:      dict = Depends(get_current_user),
):
    review = _reviews.get(review_id)
    if review:
        return review
    user_id = user.get("sub") or user.get("id") or "unknown"
    return _mock_review(review_id, "", "full", user_id)


@router.post("/{review_id}/override")
def submit_override(
    review_id: str,
    body:      OverridePayload,
    user:      dict = Depends(get_current_user),
):
    review = _reviews.get(review_id)
    if review:
        review["overrides"].append({
            "checkId":      body.checkId,
            "newStatus":    body.newStatus,
            "comment":      body.comment,
            "overriddenBy": user.get("sub") or user.get("id"),
            "overriddenAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        })
        _save_reviews(_reviews)
    return {"message": "Override saved."}