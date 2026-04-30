from app.core.security import get_current_user

# Development bypass — remove before production
async def get_current_user_dev():
    """Returns a mock user — bypasses JWT verification for local dev."""
    return {"id": "dev_user_001", "email": "user@astuteiq.com.au", "role": "user"}

# Switch between real and dev auth here:
# get_current_user = get_current_user        # ← production (Supabase JWT)
get_current_user = get_current_user_dev      # ← development (no auth required)

__all__ = ["get_current_user"]