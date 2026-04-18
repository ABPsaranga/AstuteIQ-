from typing import Any
from pydantic import BaseModel

class ReviewCheck(BaseModel):
    id: str
    area: str
    label: str
    status: str
    note: str

class ReviewData(BaseModel):
    client_name: str
    adviser_name: str
    practice_name: str
    advice_type: str
    date: str
    summary: str
    risk_level: str
    mode: str
    checks: list[ReviewCheck]

class ReviewResponse(BaseModel):
    message: str
    data: ReviewData

class ReviewHistoryItem(BaseModel):
    id: int
    client_name: str
    adviser_name: str
    practice_name: str | None = None
    advice_type: str
    date: str
    summary: str
    risk_level: str

class ClaudeHistoryResult(BaseModel):
    client_name: str 
    adviser_name: str
    practice_name: str 
    date: str 
    advice_type: str
    date: str 
    risk_level: str 
    docs_reviewed: list[str]
    checks: list[ReviewCheck]
    summary: str
    

