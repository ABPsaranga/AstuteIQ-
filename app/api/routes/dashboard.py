from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.models.review import Review
from app.api.deps import get_current_user
router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


# ================= STATS =================
@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    total_reviews = db.query(Review).count()

    # ✅ use rating instead of score
    avg_rating = db.query(func.avg(Review.rating)).scalar() or 0

    # simple distribution based on rating
    high = db.query(Review).filter(Review.rating >= 4).count()
    medium = db.query(Review).filter(Review.rating == 3).count()
    low = db.query(Review).filter(Review.rating <= 2).count()

    return {
        "total_reviews": total_reviews,
        "avg_rating": round(avg_rating, 2),
        "rating_distribution": {
            "high": high,
            "medium": medium,
            "low": low
        }
    }


# ================= RECENT REVIEWS =================
@router.get("/reviews")
def get_recent_reviews(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    reviews = (
        db.query(Review)
        .order_by(Review.created_at.desc())
        .limit(10)
        .all()
    )

    return [
        {
            "id": r.id,
            "content": r.content,   # ✅ fixed
            "rating": r.rating
        }
        for r in reviews
    ]