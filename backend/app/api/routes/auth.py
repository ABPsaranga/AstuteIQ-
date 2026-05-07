from fastapi import APIRouter

router = APIRouter()

@router.get("/me")
def me():
    return {"message": "Use Supabase client for authentication"}
