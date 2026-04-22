from google.oauth2 import id_token
from google.auth.transport import requests
from sqlalchemy.orm import Session
import uuid

from app.models.user_profile import UserProfile
from app.core.security import create_access_token

SECRET_KEY = "supersecretkey" 

GOOGLE_CLIENT_ID = "493682695714-tdhilbhvn3orblf91fig32tnqjhl9a9r.apps.googleusercontent.com"


# ================= VERIFY TOKEN =================
def verify_google_token(token: str):
    try:
        idinfo = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            GOOGLE_CLIENT_ID
        )

        # ✅ Ensure email is verified
        if not idinfo.get("email_verified"):
            return None

        return {
            "email": idinfo.get("email"),
            "full_name": idinfo.get("name"),
            "picture": idinfo.get("picture"),
        }

    except Exception as e:
        print("Google token error:", e)
        return None


# ================= HANDLE LOGIN =================
def handle_google_login(db: Session, token: str):
    user_data = verify_google_token(token)

    if not user_data:
        return None

    # ✅ Check existing user
    user = db.query(UserProfile).filter(
        UserProfile.email == user_data["email"]
    ).first()

    # ================= CREATE USER =================
    if not user:
        user = UserProfile(
            id=str(uuid.uuid4()),  # ✅ REQUIRED
            email=user_data["email"],
            full_name=user_data["full_name"],  # ✅ FIXED
            role="paraplanner",  # or "user"
        )

        db.add(user)
        db.commit()
        db.refresh(user)

    # ================= CREATE JWT =================
    access_token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
    })

    # ================= RESPONSE =================
    return {
        "user": {
            "id": str(user.id),
            "email": user.email,
            "role": user.role,
        },
        "token": access_token,
    }