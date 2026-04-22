from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "AstuteIQ API"
    DATABASE_URL: str
    SUPABASE_JWT_SECRET: str
    OPENAI_API_KEY: str   

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings() # type: ignore