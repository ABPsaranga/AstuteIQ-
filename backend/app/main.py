from dotenv import load_dotenv
load_dotenv()

import os
print(f"[startup] ANTHROPIC_API_KEY loaded: {bool(os.getenv('ANTHROPIC_API_KEY'))}")
print(f"[startup] API key prefix: {os.getenv('ANTHROPIC_API_KEY', '')[:20] if os.getenv('ANTHROPIC_API_KEY') else 'None'}")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import reviews, soa, feedback, auth

app = FastAPI(
    title="AstuteIQ API",
    version="1.0.0",
)

# ── CORS ─────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "https://astute-iq-nsjv-oh0y0v37f-astuteiq.vercel.app",
        "https://astute-iq-nsjv.vercel.app",
        "https://astuteiq.io",
        "https://www.astuteiq.io",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# ── ROUTERS ──────────────────────────────────────────────────────────────────

app.include_router(auth.router,     prefix="/api", tags=["Auth"])
app.include_router(reviews.router,  prefix="/api/reviews", tags=["Reviews"])
app.include_router(soa.router,      prefix="/api", tags=["SOA"])
app.include_router(feedback.router, prefix="/api", tags=["Feedback"])

# ── HEALTH ───────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "ok", "service": "AstuteIQ API"}

@app.get("/api/health")
def health():
    return {
        "status":                    "ok",
        "anthropic_key_configured":  bool(os.getenv("ANTHROPIC_API_KEY")),
        "supabase_url_configured":   bool(os.getenv("SUPABASE_URL")),
    }