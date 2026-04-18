from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    app_name: str = "AstuteIQ API"

    # ✅ required from .env
    database_url: str
    openai_api_key: str

    # ✅ optional (avoid Pylance error)
    secret_key: Optional[str] = None
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="allow"
    )


# ✅ FIX: explicitly ignore constructor warning
settings = Settings()  # type: ignore