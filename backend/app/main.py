from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ✅ IMPORTANT: correct imports
from app.api.routes import reviews, soa, auth, feedback

app = FastAPI(
    title="AstuteIQ API",
    version="1.0.0"
)

# ── CORS ─────────────────────────────

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
    # allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.hostinger\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── ROUTERS ─────────────────────────

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])   # 👈 ADD TAG
app.include_router(reviews.router, prefix="/api/reviews", tags=["Reviews"])
app.include_router(soa.router, prefix="/api", tags=["SOA"])
app.include_router(feedback.router, prefix="/api", tags=["Feedback"])

# ── ROOT ────────────────────────────

@app.get("/")
def root():
    return {"message": "AstuteIQ API running"}

@app.get("/api/health")
def health():
    return {"status": "ok"}