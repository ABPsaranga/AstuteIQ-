from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional
from app.core.config import settings
from app.core.security import get_password_hash, verify_password

class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str = Field(min_length=8)
    practice_name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    full_name: str | None
    practice_name: str | None

    class Config:
        orm_mode = True
        


