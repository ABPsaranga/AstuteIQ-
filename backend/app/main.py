import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import (
    auth,
    reviews,
    soa,
    feedback,
    admin,
    billing,
    assistant,
)

# ──────────────────────────────────────────────────────────────
# Startup Diagnostics
# ──────────────────────────────────────────────────────────────

print(
    f"[startup] ANTHROPIC_API_KEY loaded: "
    f"{bool(os.getenv('ANTHROPIC_API_KEY'))}"
)

print(
    f"[startup] API key prefix: "
    f"{os.getenv('ANTHROPIC_API_KEY', '')[:20] if os.getenv('ANTHROPIC_API_KEY') else 'None'}"
)

# ──────────────────────────────────────────────────────────────
# FastAPI App
# ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="AstuteIQ API",
    version="1.0.0",
)

# ──────────────────────────────────────────────────────────────
# Allowed Origins
# ──────────────────────────────────────────────────────────────

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",

    # Vercel deployments
    "https://astuteiq.vercel.app",
    "https://astute-iq-nsjv.vercel.app",
    "https://astute-iq-nsjv-4nplg0hlp-astuteiq.vercel.app",
    "https://astuteiq-oh8d9qf5n-astuteiq.vercel.app",
    "https://astuteiq-bd54uetp2-astuteiq.vercel.app",

    # Custom domains
    "https://www.astuteiq.io",
    "https://astuteiq.io",
]

# ──────────────────────────────────────────────────────────────
# CORS
# ──────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ──────────────────────────────────────────────────────────────
# Global OPTIONS preflight handler
# ──────────────────────────────────────────────────────────────

@app.options("/{rest_of_path:path}")
async def preflight_handler(rest_of_path: str):
    return JSONResponse(content={}, status_code=200)

# ──────────────────────────────────────────────────────────────
# API Routes
# ──────────────────────────────────────────────────────────────

app.include_router(auth.router,      prefix="/api",          tags=["Auth"])
app.include_router(reviews.router,   prefix="/api/reviews",  tags=["Reviews"])
app.include_router(soa.router,       prefix="/api",          tags=["SOA"])
app.include_router(feedback.router,  prefix="/api",          tags=["Feedback"])
app.include_router(admin.router,     prefix="/api",          tags=["Admin"])
app.include_router(billing.router,   prefix="/api",          tags=["Billing"])
app.include_router(assistant.router, prefix="/api",          tags=["Assistant"])

# Route reference:
# /api/admin/users
# /api/admin/stats
# /api/admin/permissions
# /api/admin/invite
# /api/assistant/chat

# ──────────────────────────────────────────────────────────────
# Health Endpoints
# ──────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "AstuteIQ API",
    }


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "anthropic_key_configured":        bool(os.getenv("ANTHROPIC_API_KEY")),
        "supabase_url_configured":         bool(os.getenv("SUPABASE_URL")),
        "supabase_service_role_configured": bool(os.getenv("SUPABASE_SERVICE_ROLE_KEY")),
        "supabase_anon_key_configured":    bool(os.getenv("SUPABASE_ANON_KEY")),
    }