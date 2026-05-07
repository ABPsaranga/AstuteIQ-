from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)

    # 🔥 IMPORTANT: this is now a real string (not Column[str])
    password: Mapped[str] = mapped_column(String, nullable=False)

    role: Mapped[str] = mapped_column(String, default="paraplanner")