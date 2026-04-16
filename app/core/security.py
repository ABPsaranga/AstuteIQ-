from fastapi import Request, HTTPException
from jose import jwt

SUPABASE_JWT_SECRET = "cfb33afc-db2d-4dae-aea7-5e6fc7e1530d"  # from Supabase

def get_current_user(request: Request):
    auth = request.headers.get("Authorization")

    if not auth:
        raise HTTPException(status_code=401, detail="No token")

    token = auth.split(" ")[1]

    try:
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"])
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")