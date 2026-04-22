from sqlalchemy.orm import Session
from app.models.user_profile import UserProfile

def get_or_create_user(db: Session, payload: dict):
    supabase_id = payload.get("sub")
    email = payload.get("email")

    user = db.query(UserProfile).filter(UserProfile.supabase_id == supabase_id).first()

    if user:
        return user

    # create new user
    user = UserProfile(
        supabase_id=supabase_id,
        email=email,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user