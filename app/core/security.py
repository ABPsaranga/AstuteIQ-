from jose import jwt
import requests
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

SUPABASE_URL = "https://mkkloznbfdxvqwebcpkw.supabase.co"
JWKS_URL = f"{SUPABASE_URL}/auth/v1/keys"


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    token = credentials.credentials

    try:
        # 1. Get public keys from Supabase
        jwks = requests.get(JWKS_URL).json()

        # 2. Read token header
        header = jwt.get_unverified_header(token)

        # 3. Find matching key
        key = next(
            k for k in jwks["keys"]
            if k["kid"] == header["kid"]
        )

        # 4. Verify token
        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience="authenticated",
        )

        return payload

    except Exception as e:
        print("JWT ERROR:", str(e))  # 👈 THIS WILL TELL US EXACT ISSUE
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )
    
