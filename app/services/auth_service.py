from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.user_profile import UserProfile
import uuid

def register_user(db: Session, email: str, role: str):
    existing = db.query(UserProfile).filter(
        UserProfile.email == email
    ).first()

    if existing:
        return {
            "id": str(existing.id),
            "email": existing.email,
            "role": existing.role,
        }

    user = UserProfile(
        id=uuid.uuid4(),
        email=email,
        role=role,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "id": str(user.id),
        "email": user.email,
        "role": user.role,
    }