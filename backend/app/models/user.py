from sqlalchemy import Column, String
from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)  # Supabase UUID
    email = Column(String, unique=True, index=True)
    role = Column(String, default="user")