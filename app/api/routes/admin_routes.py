from fastapi import APIRouter, Depends
from uuid import uuid4
from app.api.deps import get_current_user
from app.core.security import verify_token
from app.db.session import SessionLocal
from sqlalchemy import text


router = APIRouter()

@router.post("/admin/invite")
def create_invite(role: str, email: str, user=Depends(verify_token)):
    if user.get("user_metadata", {}).get("role") != "admin":
        raise Exception("Not authorized")

    token = str(uuid4())

    db = SessionLocal()
    db.execute(
        text("""
        insert into invites (email, role, token)
        values (:email, :role, :token)
        """),
        {"email": email, "role": role, "token": token},
    )
    db.commit()

    return {
        "invite_link": f"http://localhost:5173/register?invite={token}"
    }

@router.get("/secure")
def secure_route(user = Depends(get_current_user)):
    return user