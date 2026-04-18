from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_user
from app.services.user_service import get_or_create_user

router = APIRouter()

@router.get("/history")
def history(
    db: Session = Depends(get_db),
    token=Depends(get_current_user)
):
    user = get_or_create_user(db, token)

    return {
        "user_id": user.id,
        "email": user.email
    }