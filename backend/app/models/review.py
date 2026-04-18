from sqlalchemy import Column, String, Integer, ForeignKey
from app.db.base import Base


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    filename = Column(String)
    score = Column(Integer)
    status = Column(String)