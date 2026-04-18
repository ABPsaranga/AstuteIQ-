import json

from sqlalchemy.orm import Session
from app.models.review import Review

def create_review(
        db: Session,
        user_id: int,
        client_name: str,
        advisor_name: str,
        advice_type: str,
        review_model: str,
        risk_level: str,
        result_data: dict,
        summary: str,
        practice_name: str,
) -> Review:
    new_review = Review(
        user_id=user_id,
        client_name=client_name,
        advisor_name=advisor_name,
        advice_type=advice_type,
        practice_name=practice_name,
        risk_level=risk_level,
        result_json=json.dumps(result_data),
        summary=summary
    )
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    return new_review

def get_review_by_id(db: Session, review_id: int) -> Review | None:
    return db.query(Review).filter(Review.id == review_id).first()

def get_reviews_by_user_id(db: Session, user_id: int) -> list[Review]:
    return db.query(Review).filter(Review.user_id == user_id).order_by(Review.created_at.desc()).all()

def delete_review(db: Session, review_id: int) -> bool:
    review = db.query(Review).filter(Review.id == review_id).first()
    if review:
        db.delete(review)
        db.commit()
        return True
    return False