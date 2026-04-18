from fastapi import APIRouter, HTTPException
router = APIRouter()


# ⚠️ Replace with real DB validation later
fake_user = {
    "email": "test@example.com",
    "password": "123456"
}


@router.post("/login")
def login(data: dict):
    email = data.get("email")
    password = data.get("password")

    if email != fake_user["email"] or password != fake_user["password"]:
        raise HTTPException(status_code=401, detail="Invalid credentials")
