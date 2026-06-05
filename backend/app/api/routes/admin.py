from fastapi import APIRouter
from app.core.deps import get_current_user
from fastapi import Depends, HTTPException
from app.core.config import settings
from pydantic import BaseModel, EmailStr
from supabase import create_client

router = APIRouter(prefix="/admin", tags=["Admin"])
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)

class InvitePayload(BaseModel):
    email: EmailStr
    role:  str = "user"   # "user" | "admin"

@router.post("/invite")
async def invite_user(
    payload: InvitePayload,
    user: dict = Depends(get_current_user),
):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")

    if payload.role not in ("user", "admin"):
        raise HTTPException(status_code=422, detail="Role must be 'user' or 'admin'.")

    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(
            status_code=500,
            detail="Supabase is not configured on this server. "
                   "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.",
        )

    admin_client = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY,
    )

    response = admin_client.auth.admin.invite_user_by_email(
        payload.email,
        options={"data": {"role": payload.role}},
    )

    return {
        "message": f"Invite sent to {payload.email}",
        "user_id": str(response.user.id),
    }

@router.get("/users")
async def list_users(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")

    admin_client = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY,
    )

    users = admin_client.auth.admin.list_users()
    return {"users": users}

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    user: dict = Depends(get_current_user)
):
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required."
        )

    try:
        admin_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY,
        )

        admin_client.auth.admin.delete_user(user_id)

        return {
            "success": True,
            "message": f"User {user_id} deleted successfully."
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete user: {str(e)}"
        )

@router.get("/stats")
async def get_stats(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")

    # Placeholder stats - replace with real data as needed
    return {
        "total_users": 150,
        "active_users": 120,
        "monthly_revenue": 12480,
        "growth_rate": 18
    }

@router.get("/permissions")
async def get_permissions():
    return {
        "roles": [
            "admin",
            "paraplanner",
            "user"
        ],
        "permissions": {
            "admin": [
                "manage_users",
                "manage_billing",
                "view_logs"
            ],
            "paraplanner": [
                "run_reviews",
                "view_reviews"
            ],
            "user": [
                "view_dashboard"
            ]
        },
        "available_permissions": [
            "manage_users",
            "manage_billing",
            "view_logs",
            "run_reviews",
            "view_reviews",
            "view_dashboard"
        ]
    }
