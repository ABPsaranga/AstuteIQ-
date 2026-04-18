from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./test.db"

    # ✅ add default to satisfy Pylance
    SUPABASE_JWT_SECRET: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()


# ✅ runtime safety check
if not settings.SUPABASE_JWT_SECRET:
    raise ValueError(" SUPABASE_JWT_SECRET is not set in .env")