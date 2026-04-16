from sqlalchemy import Column, Integer, String, JSON, ForeignKey
from app.db.base import Base

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True)
    filename = Column(String)
    results = Column(JSON)

    user_id = Column(Integer, ForeignKey("users.id"))