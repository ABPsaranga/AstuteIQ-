import json

from sqlalchemy.orm import Session

from app.models.review import Review


def create_review(
    db: Session,
    user_id: int,
    client_name: str | None,
    adviser_name: str | None,
    practice_name: str | None,
    advice_type: str | None,
    review_mode: str,
    risk_level: str | None,
    result_data: dict,
) -> Review:
    review = Review(
        user_id=user_id,
        client_name=client_name,
        adviser_name=adviser_name,
        practice_name=practice_name,
        advice_type=advice_type,
        review_mode=review_mode,
        risk_level=risk_level,
        result_json=json.dumps(result_data),
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


def get_reviews_by_user(db: Session, user_id: int) -> list[Review]:
    return (
        db.query(Review)
        .filter(Review.user_id == user_id)
        .order_by(Review.created_at.desc())
        .all()
    )
