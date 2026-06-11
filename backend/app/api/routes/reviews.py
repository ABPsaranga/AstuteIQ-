"""
Reviews router — history, run review, file upload, overrides, analytics.
Uses Supabase for persistence instead of JSON files.
"""
import os
import uuid
import time
from typing import Any, Optional, cast
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from app.core.deps import get_current_user

router = APIRouter()

# Supabase setup
def get_supabase():
    try:
        from supabase import create_client
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_KEY")
        if url and key:
            return create_client(url, key)
    except ImportError:
        pass
    return None

class RunReviewPayload(BaseModel):
    fileIds: list[str]
    mode: str = "full"

class OverridePayload(BaseModel):
    checkId: str
    newStatus: str
    comment: str

# File storage (in-memory for now, could be Supabase storage later)
_uploads: dict[str, dict] = {}

@router.post("/upload")
async def upload_file(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    content = await file.read()
    fid = f"file_{uuid.uuid4().hex[:12]}"
    _uploads[fid] = {
        "filename": file.filename,
        "size": len(content),
        "userId": user.get("sub") or user.get("id"),
        "content": content  # Store content for processing
    }
    return {"fileId": fid}

@router.post("/run")
async def run_review(body: RunReviewPayload, user: dict = Depends(get_current_user)):
    if not body.fileIds:
        raise HTTPException(status_code=400, detail="No file IDs provided.")

    # Get file content
    file_id = body.fileIds[0]
    if file_id not in _uploads:
        raise HTTPException(status_code=404, detail="File not found.")

    file_data = _uploads[file_id]

    # Call SOA processing
    from app.api.routes.soa import run_review as soa_run_review
    from app.api.routes.soa import DocumentPart, ReviewPayload

    print(f"[reviews/run] SOA import successful")

    # Convert file to document parts
    documents = [
        DocumentPart(
            type="pdf",
            label=file_data["filename"],
            content=file_data["content"].decode("latin-1")  # PDF content as string
        )
    ]

    payload = ReviewPayload(mode=body.mode, documents=documents)

    print(f"[reviews/run] Starting review for file: {file_data['filename']}, mode: {body.mode}")
    print(f"[reviews/run] Calling SOA with {len(documents)} documents")

    # Run the actual AI review
    result = await soa_run_review(payload)

    print(f"[reviews/run] SOA result received: {type(result)}, keys: {list(result.keys()) if isinstance(result, dict) else 'not dict'}")

    # Check for SOA errors
    if "error" in result:
        print(f"[reviews/run] SOA error: {result['error']}")
        raise HTTPException(status_code=500, detail=f"AI review failed: {result['error']}")

    print(f"[reviews/run] Processing {len(result.get('checks', []))} checks")

    # Convert SOA result to review format
    review_data = {
        "id": f"rev_{uuid.uuid4().hex[:12]}",
        "userId": user.get("sub") or user.get("id") or "unknown",
        "fileName": file_data["filename"],
        "fileSize": file_data["size"],
        "mode": body.mode,
        "status": "complete",
        "score": 75,  # Could calculate from checks
        "findings": [
            {
                "checkId": check.get("id"),
                "category": check.get("area"),
                "title": check.get("label"),
                "status": str(check.get("status", "")).upper(),
                "confidence": 85,  # Default confidence
                "message": check.get("note"),
                "pages": [],  # Could extract from content
                "section": check.get("area")
            }
            for check in result.get("checks", [])
            if isinstance(check, dict)
        ],
        "overrides": [],
        "createdAt": datetime.utcnow().isoformat(),
        "completedAt": datetime.utcnow().isoformat(),
        # Additional metadata from SOA result
        "clientName": result.get("client_name", file_data["filename"]),
        "adviserName": result.get("adviser_name"),
        "practiceName": result.get("practice_name"),
        "adviceType": result.get("advice_type"),
        "riskLevel": result.get("risk_level"),
        "docsReviewed": result.get("docs_reviewed", []),
        "summary": result.get("summary")
    }

    # Save to Supabase
    supabase = get_supabase()
    if supabase:
        try:
            supabase.table("reviews").insert(review_data).execute()
        except Exception as e:
            print(f"Failed to save to Supabase: {e}")
            # Continue anyway - review data is still returned

    return review_data

@router.get("/history")
def review_history(page: int = 1, limit: int = 20, user: dict = Depends(get_current_user)):
    user_id = user.get("sub") or user.get("id") or "unknown"

    supabase = get_supabase()
    if supabase:
        try:
            offset = (page - 1) * limit
            response = supabase.table("reviews").select("*").eq("userId", user_id).order("createdAt", desc=True).range(offset, offset + limit - 1).execute()

            # Get total count
            total_response = supabase.table("reviews").select("*").eq("userId", user_id).execute()
            total = len(total_response.data or [])

            return {
                "reviews": response.data,
                "total": total,
                "page": page,
                "limit": limit
            }
        except Exception as e:
            print(f"Failed to fetch from Supabase: {e}")

    # Fallback - return empty for now
    return {"reviews": [], "total": 0, "page": page, "limit": limit}

@router.get("/analytics")
def get_analytics(user: dict = Depends(get_current_user)):
    user_id = user.get("sub") or user.get("id") or "unknown"

    supabase = get_supabase()
    if supabase:
        try:
            # Get all user reviews
            response = supabase.table("reviews").select("*").eq("userId", user_id).eq("status", "complete").execute()
            raw_reviews = response.data or []
            reviews = [r for r in raw_reviews if isinstance(r, dict)]

            if reviews:
                scores = []
                for review in reviews:
                    score_value = review.get("score")
                    if isinstance(score_value, (int, float)):
                        scores.append(int(score_value))
                    elif isinstance(score_value, str):
                        try:
                            scores.append(int(float(score_value)))
                        except ValueError:
                            continue

                avg_score = round(sum(scores) / len(scores)) if scores else 0
                month_prefix = datetime.utcnow().strftime("%Y-%m")

                # Count this month reviews with proper type checking
                this_month = 0
                for r in reviews:
                    created_at = r.get("createdAt")
                    if isinstance(created_at, str) and created_at.startswith(month_prefix):
                        this_month += 1
            else:
                avg_score = 0
                this_month = 0

            critical_failures = 0
            for review in reviews:
                findings = review.get("findings")
                if isinstance(findings, list):
                    for finding in findings:
                        if isinstance(finding, dict) and finding.get("status") == "FAIL":
                            critical_failures += 1

            return {
                "kpis": {
                    "reviews_this_month": this_month,
                    "pass_rate": f"{avg_score}%" if reviews else "—",
                    "avg_confidence": "85%",  # Could calculate from findings
                    "critical_failures": critical_failures
                },
                "monthly_data": [],  # Could implement later
                "category_data": [],  # Could implement later
                "pie_data": []  # Could implement later
            }
        except Exception as e:
            print(f"Failed to fetch analytics from Supabase: {e}")

    # Fallback
    return {
        "kpis": {"reviews_this_month": 0, "pass_rate": "—", "avg_confidence": "—", "critical_failures": 0},
        "monthly_data": [], "category_data": [], "pie_data": []
    }


# ─── STATS ────────────────────────────────────────────────────────────────
# IMPORTANT: this must be defined BEFORE /{review_id}, otherwise FastAPI
# matches "/stats" as a review_id and returns 404 "Review not found".

@router.get("/stats")
def review_stats(user: dict = Depends(get_current_user)):
    user_id = user.get("sub") or user.get("id") or "unknown"

    supabase = get_supabase()
    if supabase:
        try:
            # Get user's reviews
            response = supabase.table("reviews").select("*").eq("userId", user_id).execute()
            reviews = response.data

            if not reviews:
                return {
                    "total": 0,
                    "avgScore": None,
                    "thisWeek": 0,
                    "overrides": 0,
                }

            # Calculate stats
            completed = [r for r in reviews if isinstance(r, dict) and r.get("status") == "complete"]
            score_values = []
            for r in completed:
                score = r.get("score")
                if isinstance(score, (int, float)):
                    score_values.append(score)
                elif isinstance(score, str):
                    try:
                        score_values.append(float(score))
                    except ValueError:
                        continue

            avg_score = round(sum(score_values) / len(score_values)) if score_values else None

            # Reviews this week
            now = datetime.utcnow()
            week_ago = now - timedelta(days=7)
            this_week = 0
            for r in reviews:
                if isinstance(r, dict):
                    created_at = r.get("createdAt")
                    if isinstance(created_at, str):
                        try:
                            review_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                            if review_date >= week_ago:
                                this_week += 1
                        except (ValueError, TypeError):
                            pass

            # Total overrides
            overrides = 0
            for r in reviews:
                if isinstance(r, dict):
                    r_overrides = r.get("overrides", [])
                    if isinstance(r_overrides, list):
                        overrides += len(r_overrides)

            return {
                "total": len(reviews),
                "avgScore": avg_score,
                "thisWeek": this_week,
                "overrides": overrides,
            }
        except Exception as e:
            print(f"Failed to fetch stats from Supabase: {e}")

    # Fallback
    return {
        "total": 0,
        "avgScore": None,
        "thisWeek": 0,
        "overrides": 0,
    }


# ─── REVIEW BY ID ───────────────────────────────────────────────────────────
# These parameterised routes MUST come after all literal routes above
# (e.g. /history, /analytics, /stats) or they'll shadow them.

@router.get("/{review_id}")
def get_review(review_id: str, user: dict = Depends(get_current_user)):
    user_id = user.get("sub") or user.get("id") or "unknown"

    supabase = get_supabase()
    if supabase:
        try:
            response = supabase.table("reviews").select("*").eq("id", review_id).eq("userId", user_id).execute()
            if response.data:
                return response.data[0]
        except Exception as e:
            print(f"Failed to fetch review from Supabase: {e}")

    # Fallback - return not found
    raise HTTPException(status_code=404, detail="Review not found")

@router.post("/{review_id}/override")
def submit_override(review_id: str, body: OverridePayload, user: dict = Depends(get_current_user)):
    user_id = user.get("sub") or user.get("id") or "unknown"

    supabase = get_supabase()
    if supabase:
        try:
            # Get current review
            response = supabase.table("reviews").select("overrides, findings").eq("id", review_id).eq("userId", user_id).execute()
            if response.data:
                review_data = response.data[0]
                if not isinstance(review_data, dict):
                    raise HTTPException(status_code=500, detail="Invalid review data format")
                current_overrides = review_data.get("overrides", [])
                findings = review_data.get("findings", [])

                # Ensure overrides and findings are lists
                if not isinstance(current_overrides, list):
                    current_overrides = []
                if not isinstance(findings, list):
                    findings = []

                # Find the original status
                original_status = None
                for finding in findings:
                    if isinstance(finding, dict) and finding.get("checkId") == body.checkId:
                        original_status = finding.get("status")
                        break

                if original_status is None:
                    raise HTTPException(status_code=404, detail="Finding not found")

                # Add new override
                new_override = {
                    "checkId": body.checkId,
                    "originalStatus": original_status,
                    "newStatus": body.newStatus,
                    "comment": body.comment,
                    "overriddenBy": user_id,
                    "overriddenAt": datetime.utcnow().isoformat()
                }
                current_overrides.append(new_override)

                # Update review
                supabase.table("reviews").update({"overrides": current_overrides}).eq("id", review_id).execute()

                return {"message": "Override saved."}
        except Exception as e:
            print(f"Failed to save override to Supabase: {e}")

    # Fallback
    return {"message": "Override saved (locally only)."}