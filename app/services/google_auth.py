from google.oauth2 import id_token
from google.auth.transport import requests
from sqlalchemy.orm import Session

from app.models.user import User
from app.core.security import create_access_token

GOOGLE_CLIENT_ID = "493682695714-tdhilbhvn3orblf91fig32tnqjhl9a9r.apps.googleusercontent.com"


def verify_google_token(token: str):
    try:
        idinfo = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            GOOGLE_CLIENT_ID
        )

        return {
            "email": idinfo.get("email"),
            "name": idinfo.get("name"),
            "picture": idinfo.get("picture"),
        }

    except Exception:
        return None


def handle_google_login(db: Session, token: str):
    user_data = verify_google_token(token)

    if not user_data:
        return None

    user = db.query(User).filter(User.email == user_data["email"]).first()

    # 🆕 Create user if not exists
    if not user:
        user = User(
            email=user_data["email"],
            name=user_data["name"],
            role="user",  # default role
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # 🔐 Create YOUR JWT
    access_token = create_access_token({"sub": str(user.id), "role": user.role})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role
    }