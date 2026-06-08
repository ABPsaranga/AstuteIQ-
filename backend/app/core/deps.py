import jwt
import base64
from fastapi import HTTPException, Header
from app.core.config import settings

async def get_current_user(authorization: str = Header(...)) -> dict:
    token = authorization.removeprefix("Bearer ").strip()
    try:
        # FIX: Supabase JWT secret is base64 encoded — decode it first
        secret = base64.b64decode(settings.SUPABASE_JWT_SECRET)
        
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
        return payload
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {type(e).__name__}: {str(e)}")