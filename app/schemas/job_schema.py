from pydantic import BaseModel
from typing import Optional, List


class Finding(BaseModel):
    id: str
    title: str
    status: str
    message: str


class ReviewResult(BaseModel):
    score: int
    findings: List[Finding]


class JobStatusResponse(BaseModel):
    status: str
    progress: int
    result: Optional[ReviewResult] = None