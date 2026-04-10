from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func

from app.core.database import Base


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    client_name = Column(String(150), nullable=True)
    adviser_name = Column(String(150), nullable=True)
    practice_name = Column(String(150), nullable=True)
    advice_type = Column(String(100), nullable=True)
    review_mode = Column(String(20), nullable=False)
    risk_level = Column(String(20), nullable=True)
    result_json = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
