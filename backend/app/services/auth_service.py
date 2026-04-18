from fastapi import HTTPException, status
from datetime import datetime, timedelta
from app.core.security import create_access_token, decode_access_token
from app.repositories.user_repository import create_user, get_user_by_email
from sqlalchemy.orm import Session

def register_user(
        db: Session, 
        username: str, 
        email: str, 
        full_name: str, 
        password: str,
        practice_name: str,
    ):
    existing_user = get_user_by_email(db, email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Email already registered",
        )
    
    token = create_access_token(data={"sub": email}, expires_delta=timedelta(minutes=60))
    hashed_password = create_access_token(data={"sub": password}, expires_delta=timedelta(minutes=60))
    user = create_user(db, username, email, full_name, hashed_password)
