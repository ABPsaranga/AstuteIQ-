from fastapi import Header, HTTPException
import jwt


async def get_current_user(
    authorization: str = Header(...)
):
    try:
        token = authorization.replace("Bearer ", "").strip()

        payload = jwt.decode(
            token,
            options={"verify_signature": False}
        )

        # Supabase stores the role in app_metadata — surface it at top level
        # so all route guards can simply do user.get("role")
        role = (
            payload.get("app_metadata", {}).get("role")
            or payload.get("user_metadata", {}).get("role")
            or payload.get("role")
            or "user"
        )
        payload["role"] = role

        return payload

    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid token: {str(e)}"
        )


def is_admin(user: dict) -> bool:
    return user.get("role") == "admin"