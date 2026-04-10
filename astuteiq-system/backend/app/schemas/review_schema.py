from typing import Any

from pydantic import BaseModel


class ReviewResponse(BaseModel):
    message: str
    data: dict[str, Any]


class ReviewHistoryItem(BaseModel):
    id: int
    client_name: str | None = None
    review_mode: str
    risk_level: str | None = None
    created_at: str
