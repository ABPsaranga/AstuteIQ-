from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
import uuid

from app.schemas.auth_schema import RegisterRequest
from app.db.database import SessionLocal
from app.models.user_profile import UserProfile
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


# ================= DB =================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ================= LOGIN SCHEMA =================
class LoginRequest(BaseModel):
    email: str
    password: str


# ================= REGISTER =================
@router.post("/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):

    existing = db.query(UserProfile).filter(
        UserProfile.email == data.email
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    user = UserProfile(
        id=uuid.uuid4(),
        email=data.email,
        password=hash_password(data.password),
        full_name=data.full_name,
        practice_name=data.practice_name,
        role=data.role,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "id": str(user.id),  # ✅ FIXED
        "email": user.email,
        "role": user.role,
        "full_name": user.full_name,
        "practice_name": user.practice_name,
    }


# ================= LOGIN =================
@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):

    user = db.query(UserProfile).filter(
        UserProfile.email == data.email
    ).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    print("USER FOUND:", user.email)

    if not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    payload = {
        "sub": str(user.id),  # ✅ FIXED
        "email": user.email,
        "role": user.role
    }

    access_token = create_access_token(payload)
    refresh_token = create_refresh_token(payload)

    response = JSONResponse({
        "access_token": access_token,
        "id": str(user.id),  # ✅ FIXED
        "email": user.email,
        "role": user.role,
    })

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=60 * 60 * 24 * 7,
    )

    return response