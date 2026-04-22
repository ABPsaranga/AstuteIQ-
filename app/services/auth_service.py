from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.user_profile import UserProfile
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
)


# ================= REGISTER =================
def register_user(db: Session, email: str, password: str, role: str):
    existing = db.query(UserProfile).filter(
        UserProfile.email == email
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    user = UserProfile(
        email=email,
        password=hash_password(password),
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


# ================= LOGIN =================
def login_user(db: Session, email: str, password: str):
    user = db.query(UserProfile).filter(
        UserProfile.email == email
    ).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # ⚠️ IMPORTANT: cast to str to fix Column[str] error
    if not verify_password(password, str(user.password)):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "role": user.role
    })

    return {
        "access_token": token,
        "id": str(user.id),
        "email": user.email,
        "role": user.role,
    }


# ================= GET USER FROM TOKEN =================
def get_user_from_token(db: Session, user_id: str):
    user = db.query(UserProfile).filter(
        UserProfile.id == user_id
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": str(user.id),
        "email": user.email,
        "role": user.role,
    }