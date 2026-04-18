from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Config
from app.core.config import settings

# DB
from app.db.session import engine
from app.db.base import Base

# Routers
from app.api.routes.auth_routes import router as auth_router
from app.api.routes.reviews_routes import router as review_router
from app.api.routes.dashboard import router as dashboard_router


# ================= APP INIT ================= #

app = FastAPI(
    title=settings.app_name,
    version="1.0.0"
)


# ================= CORS ================= #

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  #  restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ================= STARTUP ================= #

@app.on_event("startup")
def on_startup():
    print("🚀 Starting AstuteIQ API...")

    Base.metadata.create_all(bind=engine)

    print(" Database tables ready")


# ================= ROUTES ================= #

app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(review_router, prefix="/api/reviews", tags=["Reviews"])
app.include_router(dashboard_router, prefix="/api/dashboard", tags=["Dashboard"])


# ================= HEALTH CHECK ================= #

@app.get("/")
def root():
    return {"message": "AstuteIQ API is running!"}