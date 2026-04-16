from fastapi import APIRouter
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

router = APIRouter()

@router.get("/")
def get_users():
    return {"users": []}

@router.post("/")
def create_user(user: dict):
    return {"message": "User created successfully", "user": user}

@router.get("/{user_id}")
def get_user(user_id: int):
    return {"user": {"id": user_id, "username": f"user{user_id}", "email": f"user{user_id}@example.com"}}

@router.put("/{user_id}")
def update_user(user_id: int, user: dict):
    return {"message": "User updated successfully", "user": {"id": user_id, **user}}    

@router.delete("/{user_id}")
def delete_user(user_id: int):
    return {"message": "User deleted successfully", "user_id": user_id}

@router.get("/search")
def search_users(query: str):
    return {"query": query, "results": []}