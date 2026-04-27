from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Text, Integer, Float, ForeignKey, DateTime, JSON
from sqlalchemy.sql import func
from app.db.database import Base


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Owner
    user_id: Mapped[str] = mapped_column(
        String,
        ForeignKey("user_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Document info
    client_name: Mapped[str] = mapped_column(String, default="")
    filename: Mapped[str] = mapped_column(String, default="")
    practice: Mapped[str] = mapped_column(String, default="")
    mode: Mapped[str] = mapped_column(String, default="full")  # "quick" | "full"

    # Scores
    score: Mapped[int] = mapped_column(Integer, default=0)
    risk_rating: Mapped[str] = mapped_column(String, default="Low")  # Low | Moderate | High | Critical
    issue_count: Mapped[int] = mapped_column(Integer, default=0)
    high_count: Mapped[int] = mapped_column(Integer, default=0)
    medium_count: Mapped[int] = mapped_column(Integer, default=0)
    low_count: Mapped[int] = mapped_column(Integer, default=0)

    # Summary fields
    summary_headline: Mapped[str] = mapped_column(Text, default="")
    summary_key_findings: Mapped[list] = mapped_column(JSON, default=list)
    client_impact: Mapped[str] = mapped_column(Text, default="")
    executive_summary: Mapped[str] = mapped_column(Text, default="")

    # Full JSON blobs
    issues: Mapped[list] = mapped_column(JSON, default=list)
    plan_steps: Mapped[list] = mapped_column(JSON, default=list)
    plan_priority: Mapped[str] = mapped_column(String, default="")

    created_at: Mapped[str] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    # Relationship
    user = relationship("UserProfile", backref="reviews")