# app/models/models.py
 
from __future__ import annotations
 
import enum
import uuid
from datetime import date, datetime
from typing import List, Optional
 
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
 
 
# =========================================================
# BASE
# =========================================================
 
class Base(DeclarativeBase):
    pass
 
 
# =========================================================
# ENUMS
# =========================================================
 
class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    PRACTICE_ADMIN = "practice_admin"
    REVIEWER = "reviewer"
 
 
class PracticeStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
 
 
class ReviewMode(str, enum.Enum):
    QUICK = "quick"
    FULL = "full"
 
 
class ReviewStatus(str, enum.Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
 
 
class RiskLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
 
 
class DocumentType(str, enum.Enum):
    NEW_SOA = "new_soa"
    REFERENCE_SOA = "reference_soa"
    SUPPORTING = "supporting"
 
 
class ReviewArea(str, enum.Enum):
    CONSISTENCY = "consistency"
    STRUCTURE = "structure"
    COMPLIANCE = "compliance"
    PERSONALISATION = "personalisation"
 
 
class CheckStatus(str, enum.Enum):
    PASS = "pass"
    WARNING = "warning"
    FAIL = "fail"
    NA = "na"
 
 
class SubscriptionStatus(str, enum.Enum):
    TRIAL = "trial"
    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELLED = "cancelled"
    EXPIRED = "expired"
 
 
class BillingType(str, enum.Enum):
    PER_REVIEW = "per_review"
    MONTHLY = "monthly"
 
 
class UsageActionType(str, enum.Enum):
    QUICK_REVIEW = "quick_review"
    FULL_REVIEW = "full_review"
    REOPEN_REVIEW = "reopen_review"
    EXPORT_WORD = "export_word"
    LOGIN = "login"
    LOGOUT = "logout"
 
 
# =========================================================
# MODELS
# =========================================================
 
class Practice(Base):
    __tablename__ = "practices"
 
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    licensee_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    afsl_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    billing_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[PracticeStatus] = mapped_column(
        Enum(PracticeStatus, name="practice_status"),
        default=PracticeStatus.ACTIVE,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
 
    users: Mapped[List["User"]] = relationship(back_populates="practice")
    memberships: Mapped[List["PracticeMembership"]] = relationship(
        back_populates="practice", cascade="all, delete-orphan"
    )
    reviews: Mapped[List["Review"]] = relationship(back_populates="practice")
    usage_logs: Mapped[List["UsageLog"]] = relationship(back_populates="practice")
    subscriptions: Mapped[List["PracticeSubscription"]] = relationship(
        back_populates="practice", cascade="all, delete-orphan"
    )
 
    __table_args__ = (
        Index("idx_practices_name_unique", func.lower(name), unique=True),
    )
 
 
class User(Base):
    __tablename__ = "users"
 
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    practice_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("practices.id", ondelete="RESTRICT"),
        nullable=False,
    )
    supabase_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), unique=True, nullable=True
    )
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role"),
        default=UserRole.REVIEWER,
        nullable=False,
    )
    job_title: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
 
    practice: Mapped["Practice"] = relationship(back_populates="users")
    memberships: Mapped[List["PracticeMembership"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    reviews: Mapped[List["Review"]] = relationship(back_populates="user")
    feedback_entries: Mapped[List["ReviewFeedback"]] = relationship(
        back_populates="user"
    )
    usage_logs: Mapped[List["UsageLog"]] = relationship(back_populates="user")
    api_audit_logs: Mapped[List["ApiAuditLog"]] = relationship(back_populates="user")
 
    __table_args__ = (
        Index("idx_users_practice_id", "practice_id"),
        Index("idx_users_role", "role"),
        Index("idx_users_email_lower", func.lower(email)),
    )
 
 
class PracticeMembership(Base):
    __tablename__ = "practice_memberships"
 
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    practice_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("practices.id", ondelete="CASCADE"),
        nullable=False,
    )
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role", create_type=False),
        default=UserRole.REVIEWER,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
 
    user: Mapped["User"] = relationship(back_populates="memberships")
    practice: Mapped["Practice"] = relationship(back_populates="memberships")
 
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "practice_id",
            name="uq_practice_memberships_user_practice",
        ),
        Index("idx_practice_memberships_user_id", "user_id"),
        Index("idx_practice_memberships_practice_id", "practice_id"),
    )
 
 
class Review(Base):
    __tablename__ = "reviews"
 
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    practice_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("practices.id", ondelete="RESTRICT"),
        nullable=False,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
 
    review_mode: Mapped[ReviewMode] = mapped_column(
        Enum(ReviewMode, name="review_mode"), nullable=False
    )
    status: Mapped[ReviewStatus] = mapped_column(
        Enum(ReviewStatus, name="review_status"),
        default=ReviewStatus.QUEUED,
        nullable=False,
    )
 
    client_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    adviser_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    practice_name_extracted: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )
    advice_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    soa_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    risk_level: Mapped[Optional[RiskLevel]] = mapped_column(
        Enum(RiskLevel, name="risk_level"), nullable=True
    )
 
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    docs_reviewed_json: Mapped[list] = mapped_column(
        JSONB, default=list, nullable=False
    )
    results_json: Mapped[dict] = mapped_column(
        JSONB, default=dict, nullable=False
    )
 
    pass_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    warning_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    fail_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    na_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
 
    processing_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    stage1_tokens_in: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    stage1_tokens_out: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    stage2_tokens_in: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    stage2_tokens_out: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
 
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
 
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    started_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
 
    practice: Mapped["Practice"] = relationship(back_populates="reviews")
    user: Mapped["User"] = relationship(back_populates="reviews")
    documents: Mapped[List["ReviewDocument"]] = relationship(
        back_populates="review", cascade="all, delete-orphan"
    )
    checks: Mapped[List["ReviewCheck"]] = relationship(
        back_populates="review", cascade="all, delete-orphan"
    )
    feedback_entries: Mapped[List["ReviewFeedback"]] = relationship(
        back_populates="review", cascade="all, delete-orphan"
    )
    usage_logs: Mapped[List["UsageLog"]] = relationship(back_populates="review")
    api_audit_logs: Mapped[List["ApiAuditLog"]] = relationship(back_populates="review")
 
    __table_args__ = (
        Index("idx_reviews_practice_id", "practice_id"),
        Index("idx_reviews_user_id", "user_id"),
        Index("idx_reviews_status", "status"),
        Index("idx_reviews_mode", "review_mode"),
        Index("idx_reviews_created_at", "created_at"),
        Index("idx_reviews_client_name", func.lower(client_name)),
    )
 
 
class ReviewDocument(Base):
    __tablename__ = "review_documents"
 
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    review_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("reviews.id", ondelete="CASCADE"),
        nullable=False,
    )
    document_type: Mapped[DocumentType] = mapped_column(
        Enum(DocumentType, name="document_type"),
        nullable=False,
    )
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    mime_type: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    file_size_bytes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    token_estimate: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    included_in_stage1: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    included_in_stage2: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
 
    review: Mapped["Review"] = relationship(back_populates="documents")
 
    __table_args__ = (
        Index("idx_review_documents_review_id", "review_id"),
        Index("idx_review_documents_type", "document_type"),
    )
 
 
class ReviewCheck(Base):
    __tablename__ = "review_checks"
 
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    review_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("reviews.id", ondelete="CASCADE"),
        nullable=False,
    )
    check_code: Mapped[str] = mapped_column(String(20), nullable=False)
    area: Mapped[ReviewArea] = mapped_column(
        Enum(ReviewArea, name="review_area"), nullable=False
    )
    label: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[CheckStatus] = mapped_column(
        Enum(CheckStatus, name="check_status"), nullable=False
    )
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    page_references: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
 
    review: Mapped["Review"] = relationship(back_populates="checks")
    feedback_entries: Mapped[List["ReviewFeedback"]] = relationship(
        back_populates="review_check", cascade="all, delete-orphan"
    )
 
    __table_args__ = (
        UniqueConstraint(
            "review_id",
            "check_code",
            name="uq_review_checks_review_check_code",
        ),
        Index("idx_review_checks_review_id", "review_id"),
        Index("idx_review_checks_area", "area"),
        Index("idx_review_checks_status", "status"),
        Index("idx_review_checks_check_code", "check_code"),
    )
 
 
class ReviewFeedback(Base):
    __tablename__ = "review_feedback"
 
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    review_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("reviews.id", ondelete="CASCADE"),
        nullable=False,
    )
    review_check_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("review_checks.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
 
    is_flagged_incorrect: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    original_status: Mapped[CheckStatus] = mapped_column(
        Enum(CheckStatus, name="check_status", create_type=False),
        nullable=False,
    )
    override_status: Mapped[CheckStatus] = mapped_column(
        Enum(CheckStatus, name="check_status", create_type=False),
        nullable=False,
    )
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
 
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
 
    review: Mapped["Review"] = relationship(back_populates="feedback_entries")
    review_check: Mapped["ReviewCheck"] = relationship(back_populates="feedback_entries")
    user: Mapped["User"] = relationship(back_populates="feedback_entries")
 
    __table_args__ = (
        UniqueConstraint(
            "review_check_id",
            "user_id",
            name="uq_review_feedback_review_check_user",
        ),
        Index("idx_review_feedback_review_id", "review_id"),
        Index("idx_review_feedback_review_check_id", "review_check_id"),
        Index("idx_review_feedback_user_id", "user_id"),
    )
 
 
class UsageLog(Base):
    __tablename__ = "usage_logs"
 
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    practice_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("practices.id", ondelete="RESTRICT"),
        nullable=False,
    )
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    review_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("reviews.id", ondelete="SET NULL"),
        nullable=True,
    )
 
    action_type: Mapped[UsageActionType] = mapped_column(
        Enum(UsageActionType, name="usage_action_type"),
        nullable=False,
    )
    billable_units: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    meta_json: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
 
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
 
    practice: Mapped["Practice"] = relationship(back_populates="usage_logs")
    user: Mapped[Optional["User"]] = relationship(back_populates="usage_logs")
    review: Mapped[Optional["Review"]] = relationship(back_populates="usage_logs")
 
    __table_args__ = (
        CheckConstraint("billable_units >= 0", name="ck_usage_logs_billable_units"),
        Index("idx_usage_logs_practice_id", "practice_id"),
        Index("idx_usage_logs_user_id", "user_id"),
        Index("idx_usage_logs_review_id", "review_id"),
        Index("idx_usage_logs_action_type", "action_type"),
        Index("idx_usage_logs_created_at", "created_at"),
    )
 
 
class BillingPlan(Base):
    __tablename__ = "billing_plans"
 
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    plan_name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    billing_type: Mapped[BillingType] = mapped_column(
        Enum(BillingType, name="billing_type"), nullable=False
    )
    monthly_review_limit: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    price_amount: Mapped[float] = mapped_column(
        Numeric(10, 2), default=0.00, nullable=False
    )
    currency: Mapped[str] = mapped_column(String(10), default="AUD", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
 
    subscriptions: Mapped[List["PracticeSubscription"]] = relationship(
        back_populates="billing_plan", cascade="all, delete-orphan"
    )
 
 
class PracticeSubscription(Base):
    __tablename__ = "practice_subscriptions"
 
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    practice_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("practices.id", ondelete="CASCADE"),
        nullable=False,
    )
    billing_plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("billing_plans.id", ondelete="RESTRICT"),
        nullable=False,
    )
    status: Mapped[SubscriptionStatus] = mapped_column(
        Enum(SubscriptionStatus, name="subscription_status"),
        default=SubscriptionStatus.TRIAL,
        nullable=False,
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
 
    practice: Mapped["Practice"] = relationship(back_populates="subscriptions")
    billing_plan: Mapped["BillingPlan"] = relationship(back_populates="subscriptions")
 
    __table_args__ = (
        Index("idx_practice_subscriptions_practice_id", "practice_id"),
        Index("idx_practice_subscriptions_billing_plan_id", "billing_plan_id"),
        Index("idx_practice_subscriptions_status", "status"),
    )
 
 
class ApiAuditLog(Base):
    __tablename__ = "api_audit_logs"
 
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    review_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("reviews.id", ondelete="SET NULL"),
        nullable=True,
    )
    endpoint: Mapped[str] = mapped_column(String(255), nullable=False)
    request_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    status_code: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    duration_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
 
    user: Mapped[Optional["User"]] = relationship(back_populates="api_audit_logs")
    review: Mapped[Optional["Review"]] = relationship(back_populates="api_audit_logs")
 
    __table_args__ = (
        Index("idx_api_audit_logs_user_id", "user_id"),
        Index("idx_api_audit_logs_review_id", "review_id"),
        Index("idx_api_audit_logs_endpoint", "endpoint"),
        Index("idx_api_audit_logs_created_at", "created_at"),
    )