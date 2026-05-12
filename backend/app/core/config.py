"""
Central config — all environment variables loaded via pydantic-settings.
Add new env vars here; never read os.getenv() directly in route files.
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Anthropic
    ANTHROPIC_API_KEY: str = ""

    # Supabase
    SUPABASE_URL:              str = ""
    SUPABASE_ANON_KEY:         str = ""
    SUPABASE_JWT_SECRET:       str = ""

    # Required for server-side admin operations (invite, user management).
    # Never expose this key to the frontend.
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # App
    SECRET_KEY:  str = "change-me-in-production"
    ENVIRONMENT: str = "development"

    class Config:
        env_file        = ".env"
        env_file_encoding = "utf-8"
        extra           = "ignore"


settings = Settings()