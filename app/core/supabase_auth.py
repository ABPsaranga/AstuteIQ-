import requests
from jose import jwt
from fastapi import HTTPException

SUPABASE_URL = "https://ceookheyjkhduwxnzrng.supabase.co"

#https://mkkloznbfdxvqwebcpkw.supabase.co

JWKS_URL = f"{SUPABASE_URL}/auth/v1/keys"

# cache keys (avoid hitting Supabase every request)
_jwks_cache = None


def get_jwks():
    global _jwks_cache
    if _jwks_cache is None:
        res = requests.get(JWKS_URL)
        if res.status_code != 200:
            raise Exception("Failed to fetch JWKS")
        _jwks_cache = res.json()
    return _jwks_cache


def verify_supabase_token(token: str):
    try:
        jwks = get_jwks()

        # get unverified header to find key id (kid)
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")

        key = next(
            (k for k in jwks["keys"] if k["kid"] == kid),
            None
        )

        if not key:
            raise HTTPException(401, "Invalid token (kid not found)")

        payload = jwt.decode(
            token,
            key,
            algorithms=["ES256"],
            audience="authenticated",
        )

        return payload

    except Exception as e:
        print("JWT VERIFY ERROR:", str(e))
        raise HTTPException(status_code=401, detail="Invalid or expired token")