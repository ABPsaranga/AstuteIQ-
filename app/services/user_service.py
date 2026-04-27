from sqlalchemy.orm import Session
from app.models.user_profile import UserProfile
import uuid

def get_or_create_user(db: Session, payload: dict):
    supabase_id = payload.get("sub")
    email = payload.get("email")

    user = db.query(UserProfile).filter(UserProfile.supabase_id == supabase_id).first()

    if user:
        return user



        user = UserProfile(
            id=uuid.uuid4(),
            email=email,
            password=None,
            role=None,
            full_name=None,
            practice_name=None,
        )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user