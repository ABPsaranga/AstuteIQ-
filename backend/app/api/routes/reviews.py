"""
Reviews router — history, run review, file upload, overrides, analytics.
"""
import os, uuid, time, random, json, pathlib
from typing import Any
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from app.core.deps import get_current_user

router = APIRouter()

_DB_PATH = pathlib.Path("reviews_db.json")

def _load() -> dict:
    if _DB_PATH.exists():
        try: return json.loads(_DB_PATH.read_text())
        except: pass
    return {}

def _save(r: dict) -> None:
    try: _DB_PATH.write_text(json.dumps(r, indent=2))
    except: pass

_reviews: dict[str, dict] = _load()
_uploads: dict[str, dict] = {}

class RunReviewPayload(BaseModel):
    fileIds: list[str]
    mode: str = "full"

class OverridePayload(BaseModel):
    checkId: str
    newStatus: str
    comment: str

CHECK_TEMPLATES = [
    {"title": "Risk profile documented", "category": "Risk Profile",
     "messages": {"PASS": "Client risk profile clearly documented.", "FAIL": "No risk profile questionnaire found.", "WARNING": "Risk profile present but outdated."}},
    {"title": "Fee disclosure complete", "category": "Fees & Costs",
     "messages": {"PASS": "All fees disclosed in dollar terms.", "FAIL": "Ongoing fees not in dollar terms.", "WARNING": "Fee disclosure missing estimated ongoing advice fee."}},
    {"title": "Best interests duty addressed", "category": "Best Interests Duty",
     "messages": {"PASS": "Best interests duty clearly addressed.", "FAIL": "No best interests statement found.", "WARNING": "Best interests statement lacks specificity."}},
    {"title": "Client objectives captured", "category": "Client Objectives",
     "messages": {"PASS": "Client objectives are specific and measurable.", "FAIL": "Client goals section missing or too vague.", "WARNING": "Objectives not linked to recommendations."}},
]

def _mock(rid: str, fid: str, mode: str, uid: str) -> dict:
    findings = []
    for i, c in enumerate(CHECK_TEMPLATES):
        r = random.random()
        s = "PASS" if r < 0.55 else "FAIL" if r < 0.75 else "WARNING" if r < 0.90 else "NA"
        findings.append({"checkId": f"chk_{i+1}", "category": c["category"], "title": c["title"],
            "status": s, "confidence": random.randint(60,99),
            "message": c["messages"].get(s) or c["messages"].get("PASS",""),
            "pages": [random.randint(1,8)], "section": c["category"]})
    passing = sum(1 for f in findings if f["status"]=="PASS")
    total = sum(1 for f in findings if f["status"]!="NA")
    up = _uploads.get(fid, {})
    return {"id": rid, "userId": uid, "fileName": up.get("filename","SOA.pdf"),
        "fileSize": up.get("size", 800000), "mode": mode, "status": "complete",
        "score": round((passing/total)*100) if total else 0, "findings": findings, "overrides": [],
        "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(time.time()-3600)),
        "completedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}

@router.post("/upload")
async def upload_file(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    content = await file.read()
    fid = f"file_{uuid.uuid4().hex[:12]}"
    _uploads[fid] = {"filename": file.filename, "size": len(content), "userId": user.get("sub") or user.get("id")}
    return {"fileId": fid}

@router.post("/run")
async def run_review(body: RunReviewPayload, user: dict = Depends(get_current_user)):
    if not body.fileIds:
        raise HTTPException(status_code=400, detail="No file IDs provided.")
    uid = user.get("sub") or user.get("id") or "unknown"
    rid = f"rev_{uuid.uuid4().hex[:12]}"
    review = _mock(rid, body.fileIds[0], body.mode, uid)
    _reviews[rid] = review
    _save(_reviews)
    return review

@router.get("/history")
def review_history(page: int = 1, limit: int = 20, user: dict = Depends(get_current_user)):
    uid = user.get("sub") or user.get("id") or "unknown"
    user_reviews = sorted([r for r in _reviews.values() if r.get("userId") == uid],
        key=lambda r: r.get("createdAt",""), reverse=True)
    start = (page-1)*limit
    return {"reviews": user_reviews[start:start+limit], "total": len(user_reviews), "page": page, "limit": limit}

@router.get("/analytics")
def get_analytics(user: dict = Depends(get_current_user)):
    all_reviews = list(_reviews.values())
    completed = [r for r in all_reviews if r.get("status")=="complete"]
    avg = round(sum(r["score"] for r in completed)/len(completed)) if completed else 0
    return {"kpis": {"reviews_this_month": len(all_reviews), "pass_rate": f"{avg}%" if completed else "—",
        "avg_confidence": "79%", "critical_failures": 0},
        "monthly_data": [], "category_data": [], "pie_data": []}

@router.get("/{review_id}")
def get_review(review_id: str, user: dict = Depends(get_current_user)):
    review = _reviews.get(review_id)
    if review: return review
    uid = user.get("sub") or user.get("id") or "unknown"
    return _mock(review_id, "", "full", uid)

@router.post("/{review_id}/override")
def submit_override(review_id: str, body: OverridePayload, user: dict = Depends(get_current_user)):
    review = _reviews.get(review_id)
    if review:
        review["overrides"].append({"checkId": body.checkId, "newStatus": body.newStatus,
            "comment": body.comment, "overriddenBy": user.get("sub") or user.get("id"),
            "overriddenAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())})
        _save(_reviews)
    return {"message": "Override saved."}

@router.get("/stats")
def review_stats(user: dict = Depends(get_current_user)):
    user_id = user["sub"]  # ✅ IMPORTANT: use "sub", not "id"

    # TODO: replace with DB queries
    reviews = []  # fetch from DB

    if not reviews:
        return {
            "total": 0,
            "avgScore": None,
            "thisWeek": 0,
            "overrides": 0,
        }

    from datetime import datetime, timedelta

    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)

    completed = [r for r in reviews if r["status"] == "complete"]

    avg_score = (
        round(sum(r.get("score", 0) for r in completed) / len(completed))
        if completed else None
    )

    this_week = sum(
        1 for r in reviews
        if r.get("createdAt") and r["createdAt"] >= week_ago
    )

    overrides = sum(len(r.get("overrides", [])) for r in reviews)

    return {
        "total": len(reviews),
        "avgScore": avg_score,
        "thisWeek": this_week,
        "overrides": overrides,
    }
