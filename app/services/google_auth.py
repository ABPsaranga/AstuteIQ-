from google.oauth2 import id_token
from google.auth.transport import requests
from sqlalchemy.orm import Session
from fastapi import HTTPException
import uuid

from app.models.user_profile import UserProfile
from app.core.config import settings

GOOGLE_CLIENT_ID = settings.GOOGLE_CLIENT_ID


# ================= VERIFY GOOGLE TOKEN =================
def verify_google_token(token: str):
    try:
        idinfo = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            GOOGLE_CLIENT_ID,
        )

        if not idinfo.get("email_verified"):
            raise HTTPException(status_code=400, detail="Email not verified")

        return {
            "email": idinfo.get("email"),
            "full_name": idinfo.get("name"),
            "picture": idinfo.get("picture"),
        }

    except Exception as e:
        print("Google token error:", e)
        raise HTTPException(status_code=401, detail="Invalid Google token")


# ================= CREATE / SYNC USER =================
def handle_google_login(db: Session, token: str):
    user_data = verify_google_token(token)

    user = db.query(UserProfile).filter(
        UserProfile.email == user_data["email"]
    ).first()

    if not user:
        user = UserProfile(
            id=uuid.uuid4(),
            email=user_data["email"],
            full_name=user_data.get("full_name"),
            role="paraplanner",
            password=None,
            practice_name=None,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    elif not user.full_name and user_data.get("full_name"):
        user.full_name = str(user_data["full_name"])  # ✅ cast to str
        db.commit()

    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
    }