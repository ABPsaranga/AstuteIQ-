from pydantic_settings import BaseSettings
import os 

class Settings(BaseSettings):
    app_name: str = "AstuteIQ API"

    database_url: str = "postgresql://postgres:astute123@localhost:5432/astuteiq"

    secret_key: str = "supersecret"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60


    google_client_id: str | None = None
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
    class Config:
        env_file = ".env"

settings = Settings()