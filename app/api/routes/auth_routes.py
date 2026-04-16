from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import (
    verify_password,
    create_access_token
)
from app.services.google_auth import verify_google_token

router = APIRouter(prefix="/auth", tags=["auth"])


# ================= DB DEP =================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ================= SCHEMAS =================

class LoginRequest(BaseModel):
    email: str
    password: str


class GoogleRequest(BaseModel):
    token: str  # Google ID token


# ================= EMAIL LOGIN =================

@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email")

    if not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid password")

    token = create_access_token({
        "sub": str(user.id),
        "role": user.role
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role
    }


# ================= GOOGLE LOGIN =================

@router.post("/google")
def google_login(data: GoogleRequest, db: Session = Depends(get_db)):
    payload = verify_google_token(data.token)

    if not payload:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    email = payload.get("email")
    name = payload.get("name")

    if not email:
        raise HTTPException(status_code=400, detail="Email not provided by Google")

    # 🔍 check existing user
    user = db.query(User).filter(User.email == email).first()

    # 🆕 create user if not exists
    if not user:
        user = User(
            email=email,
            name=name,
            role="user"  # default role
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # 🔐 create JWT
    token = create_access_token({
        "sub": str(user.id),
        "role": user.role
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role
    }