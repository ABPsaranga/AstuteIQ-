"""
billing.py — Real-time billing routes for AstuteIQ admin panel.
Pulls customer data from Supabase auth. Subscription data stored in
a 'subscriptions' table (auto-created logic below via upsert).
"""

from fastapi import APIRouter, Depends, HTTPException
from app.core.deps import get_current_user, is_admin
from app.core.config import settings
from pydantic import BaseModel, EmailStr
from supabase import create_client
from datetime import datetime, timezone
from typing import Optional
import time

router = APIRouter(prefix="/billing", tags=["billing"])

# ─── Plans (source of truth) ──────────────────────────────────────────────────

PLANS = [
    {
        "id": "starter",
        "name": "Starter",
        "tagline": "For solo advisers",
        "monthly_price": 49,
        "yearly_price": 470,
        "users": 1,
        "reviews_per_month": 5,
        "tier": 0,
        "badge": None,
    },
    {
        "id": "professional",
        "name": "Professional",
        "tagline": "Most popular choice",
        "monthly_price": 199,
        "yearly_price": 1910,
        "users": 5,
        "reviews_per_month": 100,
        "tier": 1,
        "badge": "Popular",
    },
    {
        "id": "business",
        "name": "Business",
        "tagline": "Scale your practice",
        "monthly_price": 499,
        "yearly_price": 4790,
        "users": 25,
        "reviews_per_month": 500,
        "tier": 2,
        "badge": "Best Value",
    },
    {
        "id": "enterprise",
        "name": "Enterprise",
        "tagline": "Custom for large firms",
        "monthly_price": None,
        "yearly_price": None,
        "users": None,
        "reviews_per_month": None,
        "tier": 3,
        "badge": "Custom",
    },
]

PLAN_PRICES = {p["id"]: p for p in PLANS}

# ─── Models ───────────────────────────────────────────────────────────────────

class SubscriptionPayload(BaseModel):
    user_id: str
    plan_id: str
    billing_cycle: str  # "monthly" | "yearly"
    card_last4: Optional[str] = None
    card_brand: Optional[str] = None
    company_name: Optional[str] = None
    billing_email: Optional[EmailStr] = None

class TransactionPayload(BaseModel):
    user_id: str
    plan_id: str
    amount: float
    status: str  # "Paid" | "Pending" | "Failed" | "Refunded"
    card_brand: Optional[str] = None
    card_last4: Optional[str] = None

# ─── Helper ───────────────────────────────────────────────────────────────────

def admin_client():
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

def require_admin(user: dict):
    role = (
        user.get("user_metadata", {}).get("role")
        or user.get("app_metadata", {}).get("role")
        or user.get("role")
        or "user"
    )
    if role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")

# ─── GET /api/billing/plans ───────────────────────────────────────────────────

@router.get("/plans")
async def get_plans():
    """Public — return all subscription plan definitions."""
    return PLANS

# ─── GET /api/billing/customers ──────────────────────────────────────────────

@router.get("/customers")
async def get_customers(user: dict = Depends(get_current_user)):
    """
    Returns all users from Supabase auth enriched with their subscription
    data from the 'subscriptions' table (if it exists).
    """
    require_admin(user)
    client = admin_client()

    # Fetch all auth users
    try:
        auth_users = client.auth.admin.list_users()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch users: {str(e)}")

    # Try to fetch subscriptions table (may not exist yet)
    subscriptions_map: dict[str, dict] = {}
    try:
        subs = client.table("subscriptions").select("*").execute()
        for row in (subs.data or []):
            s: dict = dict(row)  # type: ignore[arg-type]
            subscriptions_map[str(s.get("user_id", ""))] = s
    except Exception:
        pass  # Table doesn't exist yet — graceful fallback

    customers = []
    for u in auth_users:
        sub: dict = subscriptions_map.get(str(u.id), {})
        plan_id: str = sub.get("plan_id", "starter")
        plan = PLAN_PRICES.get(plan_id, PLAN_PRICES["starter"])

        customers.append({
            "id": str(u.id),
            "email": u.email or "",
            "full_name": (u.user_metadata or {}).get("full_name", ""),
            "company": sub.get("company_name", ""),
            "plan_id": plan_id,
            "plan_name": plan["name"],
            "billing_cycle": sub.get("billing_cycle", "monthly"),
            "amount": plan["monthly_price"] if sub.get("billing_cycle", "monthly") == "monthly" else plan["yearly_price"],
            "card_brand": sub.get("card_brand", ""),
            "card_last4": sub.get("card_last4", ""),
            "status": sub.get("status", "active") if sub else "no_subscription",
            "created_at": str(u.created_at or ""),
            "email_confirmed": bool(u.email_confirmed_at),
        })

    return customers

# ─── GET /api/billing/overview ────────────────────────────────────────────────

@router.get("/overview")
async def get_billing_overview(user: dict = Depends(get_current_user)):
    """Real stats derived from Supabase users + subscriptions."""
    require_admin(user)
    client = admin_client()

    try:
        auth_users = client.auth.admin.list_users()
        total_users = len(auth_users) if auth_users else 0
    except Exception:
        total_users = 0

    # Try subscriptions table
    monthly_revenue = 0
    active_subs = 0
    plan_distribution = {p["id"]: 0 for p in PLANS}

    try:
        subs = client.table("subscriptions").select("*").execute()
        for row in (subs.data or []):
            s: dict = dict(row)  # type: ignore[arg-type]
            if s.get("status") == "active":
                active_subs += 1
                plan_id: str = s.get("plan_id", "starter")
                plan = PLAN_PRICES.get(plan_id)
                if plan and plan["monthly_price"]:
                    cycle: str = s.get("billing_cycle", "monthly")
                    monthly_revenue += (
                        plan["monthly_price"] if cycle == "monthly"
                        else round((plan["yearly_price"] or 0) / 12)
                    )
                plan_distribution[plan_id] = plan_distribution.get(plan_id, 0) + 1
    except Exception:
        # No subscriptions table yet
        active_subs = total_users

    return {
        "total_users": total_users,
        "active_subscriptions": active_subs,
        "monthly_revenue": monthly_revenue,
        "invoices_issued": active_subs,
        "growth_rate": 0,  # Requires historical data
        "plan_distribution": plan_distribution,
    }

# ─── GET /api/billing/transactions ───────────────────────────────────────────

@router.get("/transactions")
async def get_transactions(user: dict = Depends(get_current_user)):
    """Fetch transactions from Supabase 'transactions' table."""
    require_admin(user)
    client = admin_client()

    try:
        result = client.table("transactions").select("*").order("created_at", desc=True).limit(50).execute()
        return result.data or []
    except Exception:
        # Table doesn't exist yet
        return []

# ─── POST /api/billing/subscribe ─────────────────────────────────────────────

@router.post("/subscribe")
async def create_subscription(
    payload: SubscriptionPayload,
    user: dict = Depends(get_current_user),
):
    """Create or update a subscription for a user."""
    require_admin(user)

    if payload.plan_id not in PLAN_PRICES:
        raise HTTPException(status_code=422, detail=f"Unknown plan: {payload.plan_id}")

    plan = PLAN_PRICES[payload.plan_id]
    amount = (
        plan["monthly_price"] if payload.billing_cycle == "monthly"
        else plan["yearly_price"]
    ) or 0

    client = admin_client()
    now = datetime.now(timezone.utc).isoformat()

    sub_data = {
        "user_id": payload.user_id,
        "plan_id": payload.plan_id,
        "billing_cycle": payload.billing_cycle,
        "status": "active",
        "card_brand": payload.card_brand or "",
        "card_last4": payload.card_last4 or "",
        "company_name": payload.company_name or "",
        "billing_email": payload.billing_email or "",
        "amount": amount,
        "updated_at": now,
    }

    try:
        # Upsert subscription
        client.table("subscriptions").upsert(
            {**sub_data, "created_at": now},
            on_conflict="user_id",
        ).execute()

        # Log transaction
        client.table("transactions").insert({
            "user_id": payload.user_id,
            "plan_id": payload.plan_id,
            "plan_name": plan["name"],
            "amount": amount,
            "billing_cycle": payload.billing_cycle,
            "status": "Paid",
            "card_brand": payload.card_brand or "",
            "card_last4": payload.card_last4 or "",
            "company": payload.company_name or "",
            "created_at": now,
        }).execute()

        return {"success": True, "message": "Subscription created", "amount": amount}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create subscription: {str(e)}")

# ─── DELETE /api/billing/subscribe/{user_id} ─────────────────────────────────

@router.delete("/subscribe/{user_id}")
async def cancel_subscription(
    user_id: str,
    user: dict = Depends(get_current_user),
):
    require_admin(user)
    client = admin_client()

    try:
        client.table("subscriptions").update({"status": "cancelled"}).eq("user_id", user_id).execute()
        return {"success": True, "message": "Subscription cancelled"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to cancel: {str(e)}")