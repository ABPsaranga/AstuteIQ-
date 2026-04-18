from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ================= CONFIG ================= #
from app.core.config import settings

# ================= DB ================= #
from app.db.session import engine
from app.db.base import Base

# ================= ROUTERS ================= #
from app.api.routes.auth_routes import router as auth_router
from app.api.routes.reviews_routes import router as review_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.admin_routes import router as admin_router  # ✅ FIXED

from app.api.explain import router as explain_router


# ================= APP INIT ================= #

from app.api.routes.analyze import router as analyze_router

app = FastAPI(
    title=settings.app_name,
    version="1.0.0"
)


# ================= CORS ================= #

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ⚠️ restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ================= STARTUP ================= #

@app.on_event("startup")
def on_startup():
    print("🚀 Starting AstuteIQ API...")

    Base.metadata.create_all(bind=engine)

    print("✅ Database tables ready")


# ================= ROUTES ================= #

# 🔐 Auth
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])

# 📄 Reviews
app.include_router(review_router, prefix="/api/reviews", tags=["Reviews"])

# 📊 User Dashboard
app.include_router(dashboard_router, prefix="/api/dashboard", tags=["Dashboard"])

# 🛠 Admin
app.include_router(admin_router, prefix="/api/admin", tags=["Admin"])  #  FIXED


# ================= HEALTH CHECK ================= #

@app.get("/")
def root():
    return {
        "message": "AstuteIQ API is running!",
        "version": "1.0.0"
    }

# ============== explain================

app.include_router(explain_router)

app.include_router(analyze_router)