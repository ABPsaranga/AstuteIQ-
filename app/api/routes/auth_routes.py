from fastapi import APIRouter, HTTPException
from jose import jwt
from datetime import datetime, timedelta

router = APIRouter(prefix="/auth", tags=["auth"])

SECRET_KEY = "super-secret-key"  # 🔥 change in production
ALGORITHM = "HS256"


def create_access_token(user_id: str):
    payload = {
        "sub": user_id,
        "exp": datetime.utcnow() + timedelta(hours=12),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/supabase-login")
def supabase_login(data: dict):
    access_token = data.get("access_token")

    if not access_token:
        raise HTTPException(status_code=400, detail="Missing access token")

    # 🔥 TEMP: trust Supabase token (we can verify later)
    # In production: verify with Supabase

    # Fake user extraction (replace later)
    user_id = "user-123"
    role = "paraplanner"

    # ✅ CREATE YOUR OWN JWT
    backend_token = create_access_token(user_id)

    return {
        "user": {
            "id": user_id,
            "role": role,
        },
        "token": backend_token,   # 🔥 THIS is what frontend must store
    }