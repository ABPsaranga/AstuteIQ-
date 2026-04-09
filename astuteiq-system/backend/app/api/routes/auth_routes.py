from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.auth_schema import AuthResponse, LoginRequest, RegisterRequest
from app.services.auth_service import login_user, register_user

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register")
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    register_user(
        db=db,
        full_name=payload.full_name,
        email=payload.email,
        password=payload.password,
        practice_name=payload.practice_name,
    )
    return {"message": "User registered successfully"}


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    token = login_user(db=db, email=payload.email, password=payload.password)
    return AuthResponse(access_token=token)
