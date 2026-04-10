from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.repositories.user_repository import create_user, get_user_by_email


def register_user(
    db: Session,
    full_name: str,
    email: str,
    password: str,
    practice_name: str | None,
):
    existing_user = get_user_by_email(db, email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    return create_user(
        db=db,
        full_name=full_name,
        email=email,
        password_hash=hash_password(password),
        practice_name=practice_name,
    )


def login_user(db: Session, email: str, password: str) -> str:
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    return create_access_token({"sub": user.email, "user_id": user.id})
