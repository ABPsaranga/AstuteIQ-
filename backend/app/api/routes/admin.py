from fastapi import APIRouter, Depends, HTTPException
from app.core.deps import get_current_user, is_admin
from app.core.config import settings
from pydantic import BaseModel, EmailStr
from supabase import create_client
import time
import psutil


START_TIME = time.time()

router = APIRouter(prefix="/admin", tags=["Admin"])
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)


# ─── MODELS ──────────────────────────────────────────────────────────────────

class InvitePayload(BaseModel):
    email: EmailStr
    role: str = "user"

class InvitationSendPayload(BaseModel):
    email: EmailStr
    role: str = "user"


# ─── INVITE (legacy) ─────────────────────────────────────────────────────────

@router.post("/invite")
async def invite_user(
    payload: InvitePayload,
    user: dict = Depends(get_current_user),
):
    if not is_admin(user):
        raise HTTPException(
            status_code=403,
            detail="Admin access required."
        )

    admin_client = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY,
    )

    response = admin_client.auth.admin.invite_user_by_email(
        payload.email
    )

    return {
        "message": f"Invite sent to {payload.email}",
        "user_id": str(response.user.id),
    }
# ─── USERS ───────────────────────────────────────────────────────────────────


@router.get("/users")
async def list_users(
    user: dict = Depends(get_current_user)
):
    if not is_admin(user):
        raise HTTPException(
            status_code=403,
            detail="Admin access required."
        )

    admin_client = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY,
    )

    response = admin_client.auth.admin.list_users()

    users = []

    for u in response:
        users.append({
            "id": str(u.id),
            "email": u.email,
            "full_name": (
                u.user_metadata.get("full_name")
                if u.user_metadata
                else ""
            ),
            "role": "user",
            "reviews_count": 0,
            "created_at": str(u.created_at),
            "active": True,
        })

    return users

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    user: dict = Depends(get_current_user),
):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")

    try:
        admin_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY,
        )
        admin_client.auth.admin.delete_user(user_id)
        return {"success": True, "message": f"User {user_id} deleted successfully."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")
    
def get_user_role(user: dict) -> str:
    return (
        user.get("user_metadata", {}).get("role")
        or user.get("app_metadata", {}).get("role")
        or user.get("role")
        or "user"
    )


# ─── STATS ───────────────────────────────────────────────────────────────────

@router.get("/stats")
async def get_stats(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")

    try:
        admin_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY,
        )
        users     = admin_client.auth.admin.list_users()
        total     = len(users) if users else 0
        confirmed = sum(1 for u in users if u.email_confirmed_at) if users else 0
    except Exception:
        total     = 0
        confirmed = 0

    return {
        "total_users":     total,
        "active_users":    confirmed,
        "monthly_revenue": 0,
        "growth_rate":     0,
    }


# ─── PERMISSIONS ─────────────────────────────────────────────────────────────

@router.get("/permissions")
async def get_permissions():
    return {
        "roles": ["admin", "paraplanner", "user"],
        "permissions": {
            "admin":       ["manage_users", "manage_billing", "view_logs", "run_reviews", "view_reviews", "view_dashboard"],
            "paraplanner": ["run_reviews", "view_reviews", "view_dashboard"],
            "user":        ["view_dashboard"],
        },
        "available_permissions": [
            "manage_users",
            "manage_billing",
            "view_logs",
            "run_reviews",
            "view_reviews",
            "view_dashboard",
        ],
    }


@router.put("/permissions/{role_name}")
async def update_permissions(
    role_name: str,
    payload: dict,
    user: dict = Depends(get_current_user),
):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")

    return {
        "message":     f"Permissions for '{role_name}' updated.",
        "role":        role_name,
        "permissions": payload.get("permissions", []),
    }


# ─── INVITATIONS ─────────────────────────────────────────────────────────────

@router.get("/invitations")
async def list_invitations(user: dict = Depends(get_current_user)):  # FIX: added missing user param
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")

    try:
        admin_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY,
        )

        users = admin_client.auth.admin.list_users()

        invitations = []
        for u in users:
            invitations.append({
                "id":         u.id,
                "email":      u.email,
                "role":       u.user_metadata.get("role", "user") if u.user_metadata else "user",
                "status":     "accepted" if u.email_confirmed_at else "pending",
                "created_at": u.created_at.isoformat() if u.created_at else "",
            })

        return {"invitations": invitations}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch invitations: {str(e)}")


@router.post("/invitations/send")
async def send_invitation(
    payload: InvitationSendPayload,
    user: dict = Depends(get_current_user),
):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")

    if payload.role not in ("user", "paraplanner", "admin"):
        raise HTTPException(status_code=422, detail="Invalid role.")

    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured.")

    try:
        admin_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY,
        )

        response = admin_client.auth.admin.invite_user_by_email(
            payload.email,
            options={"data": {"role": payload.role}},
        )

        return {
            "message": f"Invitation sent to {payload.email}",
            "user_id": str(response.user.id),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send invitation: {str(e)}")


# ─── LIVE MONITORING ─────────────────────────────────────────────────────────

@router.get("/live-monitoring")
async def get_live_monitoring(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")

    uptime_seconds = int(time.time() - START_TIME)
    hours, remainder = divmod(uptime_seconds, 3600)
    minutes, seconds = divmod(remainder, 60)

    cpu = psutil.cpu_percent(interval=0.1)
    mem = psutil.virtual_memory().percent

    try:
        admin_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY,
        )
        users        = admin_client.auth.admin.list_users()
        active_users = len(users) if users else 0
    except Exception:
        active_users = 0

    return {
        "status":         "healthy",
        "system_health":  "healthy",
        "serverStatus":   "online",
        "active_users":   active_users,
        "active_reviews": 0,
        "cpuUsage":       round(cpu, 1),
        "memoryUsage":    round(mem, 1),
        "uptime":         f"{hours}h {minutes}m {seconds}s",
    }