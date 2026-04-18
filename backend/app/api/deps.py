from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import verify_token
from app.repositories.user_repository import get_user_by_id, create_user


# ✅ MAIN USER DEP
def get_current_user(
    payload=Depends(verify_token),
    db: Session = Depends(get_db),
):
    user_id = payload.get("sub")
    email = payload.get("email")

    user = get_user_by_id(db, user_id)

    if not user:
        user = create_user(db, user_id, email, role="user")

    return user


# ✅ ADMIN GUARD (NO IMPORT NEEDED)
def require_admin(user=Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user