import uuid
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID

from app.db.database import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    email: Mapped[str] = mapped_column(String, unique=True, index=True)

    password: Mapped[str] = mapped_column(String, nullable=True)

    full_name: Mapped[str] = mapped_column(String, nullable=True)

    practice_name: Mapped[str] = mapped_column(String, nullable=True)

    role: Mapped[str] = mapped_column(String, default="paraplanner")