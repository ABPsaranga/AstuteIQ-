from fastapi import APIRouter

router = APIRouter(prefix="/billing", tags=["billing"])

@router.get("/overview")
async def get_billing_overview():
    return {
        "monthly_revenue": 12480,
        "active_subscriptions": 84,
        "invoices": 241,
        "growth": 18
    }

@router.get("/plans")
async def get_plans():
    return [
        {
            "id": 1,
            "name": "Starter",
            "monthly_price": 49,
            "yearly_price": 470,
            "users": 1,
            "reviews": 5
        },
        {
            "id": 2,
            "name": "Professional",
            "monthly_price": 199,
            "yearly_price": 1910,
            "users": 5,
            "reviews": 100
        }
    ]

@router.get("/transactions")
async def get_transactions():
    return [
        {
            "customer": "ABC Financial",
            "plan": "Business",
            "amount": 499,
            "status": "Paid",
            "method": "Visa"
        }
    ]