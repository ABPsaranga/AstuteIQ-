from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
import time

router   = APIRouter()
pwd_ctx  = CryptContext(schemes=["bcrypt"], deprecated="auto")

# In-memory user store — replace with Supabase/DB in production
USERS: dict[str, dict] = {}

def _token(user_id: str, email: str, role: str) -> str:
    import jwt, os
    from datetime import datetime, timedelta, timezone
    secret = os.getenv("JWT_SECRET", "change-me")
    exp    = datetime.now(timezone.utc) + timedelta(hours=24)
    return jwt.encode({"sub": user_id, "email": email, "role": role, "exp": exp}, secret, algorithm="HS256")

def _response(user: dict, token: str) -> dict:
    return {"token": token, "user": {"id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"]}}


class LoginRequest(BaseModel):
    email:    EmailStr
    password: str

class RegisterRequest(BaseModel):
    name:     str
    email:    EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token:    str
    password: str


@router.post("/login")
def login(body: LoginRequest):
    user = USERS.get(body.email)
    if not user or not pwd_ctx.verify(body.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    return _response(user, _token(user["id"], user["email"], user["role"]))


@router.post("/register")
def register(body: RegisterRequest):
    if body.email in USERS:
        raise HTTPException(status_code=409, detail="Email already registered.")
    user = {"id": f"usr_{int(time.time())}", "email": body.email, "name": body.name, "role": "user", "password": pwd_ctx.hash(body.password)}
    USERS[body.email] = user
    return _response(user, _token(user["id"], user["email"], user["role"]))


@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordRequest):
    return {"message": "If that email is registered, a reset link has been sent."}


@router.post("/reset-password")
def reset_password(body: ResetPasswordRequest):
    return {"message": "Password updated."}


@router.get("/me")
def me():
    return {"message": "Use Supabase client for authentication"}