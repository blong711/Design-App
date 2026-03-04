import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Design Manager"
    API_V1_STR: str = "/api/v1"
    BACKEND_URL: str = "http://localhost:8000"
    
    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017" # Update with Atlas URL if needed
    MONGODB_DB: str = "design_manager"

    # JWT Security
    SECRET_KEY: str = "YOUR_SUPER_SECRET_KEY_PLEASE_CHANGE_IN_PRODUCTION"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    ALGORITHM: str = "HS256"

    # AWS S3 (or R2/Minio)
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"
    S3_BUCKET_NAME: str = "design-manager-uploads"

    # Email Settings (SMTP)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@designmanager.com"
    SMTP_FROM_NAME: str = "Design Manager"
    FRONTEND_URL: str = "http://localhost:3000"

    # External API Keys (Simplistic approach: comma separated keys or valid key)
    # In production, this should be verified against the DB (`api_keys` collection).
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
