from fastapi import FastAPI

from app.api.routes.auth_routes import router as auth_router
from app.api.routes.health_routes import router as health_router
from app.api.routes.review_routes import router as review_router
from app.core.config import settings
from app.core.database import Base, engine

from app.models.review import Review  # noqa: F401
from app.models.user import User  # noqa: F401

app = FastAPI(title=settings.app_name)


@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


app.include_router(health_router)
app.include_router(auth_router)
app.include_router(review_router)


@app.get("/")
def root():
    return {"message": f"{settings.app_name} is running"}