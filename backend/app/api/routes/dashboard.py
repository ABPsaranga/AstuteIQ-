from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.api.deps import require_admin
from app.models.user import User
from app.models.review import Review

router = APIRouter(tags=["admin"])


@router.get("/dashboard")
def admin_dashboard(
    user=Depends(require_admin),
    db: Session = Depends(get_db)
):
    total_users = db.query(func.count(User.id)).scalar()
    total_reviews = db.query(func.count(Review.id)).scalar()

    reviews = db.query(Review.results).all()

    fail_count = 0
    for r in reviews:
        for item in r.results:
            if item.get("status") == "FAIL":
                fail_count += 1

    return {
        "total_users": total_users,
        "total_reviews": total_reviews,
        "fail_issues": fail_count,
    }