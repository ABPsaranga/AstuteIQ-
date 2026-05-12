"""
Auth routes.

/api/auth/invite  — admin-only, sends Supabase invite email via service-role key
/api/auth/me      — returns the current authenticated user's profile
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr

from app.core.config import settings
from app.core.deps import get_current_user

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class InvitePayload(BaseModel):
    email: EmailStr
    role:  str = "user"   # "user" | "admin"


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/auth/invite")
async def invite_user(
    payload: InvitePayload,
    user: dict = Depends(get_current_user),
):
    """
    Send a Supabase invite email to a new user.
    Restricted to admin role only.
    The service-role key is never exposed to the frontend.
    """
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

    try:
        from supabase import create_client

        # Service-role client — bypasses RLS, required for admin.invite_user_by_email
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

    except Exception as exc:
        # Surface the Supabase error message directly — useful for duplicate emails etc.
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    """Return the current user's JWT claims."""
    return user