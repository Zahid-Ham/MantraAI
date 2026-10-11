import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/mantraai"
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-120b"
    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_CLIENT_EMAIL: str = ""
    FIREBASE_PRIVATE_KEY: str = ""
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    ADMIN_API_KEY: str = ""
    ADMIN_EMAILS: str = ""

    # Rate Limiting & DoS Protection
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REDIS_URL: str = ""
    RATE_LIMIT_AI_PER_MINUTE: int = 20
    RATE_LIMIT_ASSESSMENT_PER_MINUTE: int = 10
    RATE_LIMIT_DEFAULT_PER_MINUTE: int = 60
    MAX_REQUEST_BODY_BYTES: int = 524288  # 512 KB
    # Privacy, Consent & Retention Settings
    CURRENT_PRIVACY_POLICY_VERSION: str = "1.0"
    ENFORCE_USER_CONSENT: bool = True
    MAX_AUTH_AGE_SECONDS_FOR_DELETION: int = 900  # 15 minutes recent auth window

    class Config:
        env_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
        env_file_encoding = 'utf-8'
        extra = 'ignore'

settings = Settings()
