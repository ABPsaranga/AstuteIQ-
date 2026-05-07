"""
Feedback / override router.
Stores per-user, per-review finding overrides server-side.
"""
import time
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.deps import get_current_user

router = APIRouter()

# In-memory store: { "userId:reviewId": [FeedbackRecord, ...] }
# Replace with DB in production
_feedback: dict[str, list[dict[str, Any]]] = {}


class FeedbackPayload(BaseModel):
    review_id:    str
    check_id:     str
    check_label:  str
    original_status: str
    new_status:   str   # PASS | FAIL | WARNING | NA | INCORRECT
    comment:      str


class FeedbackResponse(BaseModel):
    id:              str
    review_id:       str
    check_id:        str
    check_label:     str
    original_status: str
    new_status:      str
    comment:         str
    user_id:         str
    created_at:      str


def _key(user_id: str, review_id: str) -> str:
    return f"{user_id}:{review_id}"


@router.post("/feedback", response_model=FeedbackResponse)
def save_feedback(
    body: FeedbackPayload,
    user: dict = Depends(get_current_user),
):
    user_id = user.get("id") or user.get("sub") or "unknown"
    key     = _key(user_id, body.review_id)

    record: dict[str, Any] = {
        "id":              f"fb_{int(time.time() * 1000)}",
        "review_id":       body.review_id,
        "check_id":        body.check_id,
        "check_label":     body.check_label,
        "original_status": body.original_status,
        "new_status":      body.new_status,
        "comment":         body.comment,
        "user_id":         user_id,
        "created_at":      time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }

    existing = _feedback.get(key, [])
    # Replace existing feedback for same check, or append
    updated = [f for f in existing if f["check_id"] != body.check_id]
    updated.append(record)
    _feedback[key] = updated

    return record


@router.get("/feedback/{review_id}")
def get_feedback(
    review_id: str,
    user: dict = Depends(get_current_user),
):
    user_id = user.get("id") or user.get("sub") or "unknown"
    key     = _key(user_id, review_id)
    return _feedback.get(key, [])


@router.delete("/feedback/{review_id}/{check_id}")
def delete_feedback(
    review_id: str,
    check_id:  str,
    user: dict = Depends(get_current_user),
):
    user_id = user.get("id") or user.get("sub") or "unknown"
    key     = _key(user_id, review_id)
    _feedback[key] = [f for f in _feedback.get(key, []) if f["check_id"] != check_id]
    return {"message": "Feedback removed."}