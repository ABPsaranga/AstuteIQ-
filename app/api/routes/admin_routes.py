from fastapi import APIRouter, Depends, HTTPException
from uuid import uuid4
from app.core.deps import get_current_user
from app.db.session import SessionLocal
from sqlalchemy import text

router = APIRouter()


@router.post("/admin/invite")
def create_invite(
    role: str,
    email: str,
    user=Depends(get_current_user),  # ✅ FIXED
):
    # 🔐 check admin role
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    token = str(uuid4())

    db = SessionLocal()
    try:
        db.execute(
            text("""
            INSERT INTO invites (email, role, token)
            VALUES (:email, :role, :token)
            """),
            {"email": email, "role": role, "token": token},
        )
        db.commit()
    finally:
        db.close()

    return {
        "invite_link": f"http://localhost:5173/register?invite={token}"
    }


@router.get("/secure")
def secure_route(user=Depends(get_current_user)):
    return user