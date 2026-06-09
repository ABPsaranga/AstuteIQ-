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

        return payload

    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid token: {str(e)}"
        )


def is_admin(user: dict) -> bool:
    admin_emails = {
        "rasindu@astutebusinesspartners.com.au",
        "admin@astutebusinesspartners.com.au",
    }

    return (
        user.get("email", "").lower()
        in admin_emails
    )