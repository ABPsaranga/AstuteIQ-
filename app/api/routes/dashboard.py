from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.review import Review

router = APIRouter()

@router.get("/")
def get_dashboard(db: Session = Depends(get_db)):
    reviews = db.query(Review).all()

    total = len(reviews)
    fail = 0

    for r in reviews:
        for item in r.results:
            if item["status"] == "FAIL":
                fail += 1

    pass_rate = 100 - (fail / max(total, 1)) * 100

    return {
        "total": total,
        "fail": fail,
        "pass_rate": round(pass_rate, 2)
    }