"""Settings read from environment variables (and `.env` locally)."""

from functools import cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Rename the product here (and in frontend/src/brand.ts). Nowhere else.
APP_NAME = "ProteinCart"

BACKEND_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BACKEND_DIR / "data"
FRONTEND_DIST = BACKEND_DIR.parent / "frontend" / "dist"


class Settings(BaseSettings):
    """Runtime configuration. Secrets stay server-side and are never logged."""

    model_config = SettingsConfigDict(
        env_file=(BACKEND_DIR.parent / ".env", BACKEND_DIR / ".env"),
        extra="ignore",
    )

    kroger_client_id: str = ""
    kroger_client_secret: str = ""
    kroger_redirect_uri: str = ""
    session_secret: str = "dev-only-secret"
    demo_mode: bool = False
    kroger_timeout_seconds: float = 3.0


@cache
def get_settings() -> Settings:
    """Return the process-wide settings object."""
    return Settings()
