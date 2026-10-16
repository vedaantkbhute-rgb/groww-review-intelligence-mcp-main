import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    APP_NAME: str = "Groww Review Intelligence & MCP Workflow"
    APP_VERSION: str = "1.0.0"
    GROQ_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    LLM_MODEL: str = "openai/gpt-oss-20b"
    LLM_BASE_URL: Optional[str] = None
    
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    DATA_DIR: str = os.path.join(BASE_DIR, "data")
    REVIEWS_CSV: str = os.path.join(DATA_DIR, "reviews_sample.csv")
    SOURCES_JSON: str = os.path.join(DATA_DIR, "sources.json")
    NOTES_LOG_JSON: str = os.path.join(DATA_DIR, "internal_product_notes.json")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
