from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "RAGBOOK API"
    environment: str = "development"
    api_prefix: str = "/api/v1"
    database_url: str = "postgresql+asyncpg://ragbook:ragbook@localhost:5432/ragbook"
    uploads_dir: Path = Path("uploads")
    max_upload_bytes: int = 100 * 1024 * 1024
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])
    embedding_dimensions: int = 1536
    rag_mode: Literal["fts", "hybrid"] = "fts"
    gemini_api_key: SecretStr | None = Field(default=None, validation_alias="GEMINI_API_KEY")
    embedding_model: str = "gemini-embedding-001"
    llm_model: str = "gemini-2.5-flash"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
