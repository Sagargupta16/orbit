"""Application settings and configuration.

Loaded from environment variables with the ORBIT_ prefix. A local .env file
(gitignored) can supply these in development.

Critical for production:
- ORBIT_JWT_SECRET_KEY: strong random string, min 32 chars
- ORBIT_DATABASE_URL: Neon PostgreSQL connection string
- ORBIT_GITHUB_CLIENT_ID / _SECRET: enables GitHub OAuth
"""

import secrets
import warnings

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings (env prefix ORBIT_)."""

    model_config = SettingsConfigDict(
        env_prefix="ORBIT_",
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Environment
    environment: str = "development"  # development, staging, production

    # Database
    database_url: str = "sqlite:///./orbit.db"
    database_echo: bool = False

    # Logging
    log_level: str = "INFO"

    # JWT authentication
    jwt_secret_key: str = ""
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30
    jwt_refresh_token_expire_days: int = 7
    # Flip true after refresh TTL has lapsed post-rollout to hard-reject any
    # token lacking a `tv` claim. Irrelevant for a fresh DB but preserved.
    jwt_strict_tv: bool = False

    # Database pool (PostgreSQL only; sized for Neon free tier)
    db_pool_size: int = 5
    db_max_overflow: int = 3
    db_pool_recycle_seconds: int = 300
    db_connect_timeout_seconds: int = 10
    db_statement_timeout_seconds: int = 30
    db_idle_transaction_timeout_seconds: int = 60

    # OAuth -- set client id + secret per provider to enable it.
    # GitHub: https://github.com/settings/developers
    github_client_id: str = ""
    github_client_secret: str = ""
    # Google: https://console.cloud.google.com/apis/credentials
    google_client_id: str = ""
    google_client_secret: str = ""

    # Frontend URL for OAuth redirect callbacks and CORS.
    # Dev: http://localhost:5173 | Prod: the GitHub Pages origin.
    frontend_url: str = "http://localhost:5173"

    # CORS allowlist (frontend_url origin is appended automatically in main.py).
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
    ]

    def validate_production_settings(self) -> list[str]:
        """Return a list of critical/warning issues for non-dev deployment."""
        issues: list[str] = []
        if not self.jwt_secret_key and self.environment != "development":
            issues.append(
                "CRITICAL: jwt_secret_key is not configured. "
                "Set ORBIT_JWT_SECRET_KEY environment variable!"
            )
        if self.jwt_secret_key and len(self.jwt_secret_key) < 32:
            issues.append("CRITICAL: jwt_secret_key must be at least 32 characters")
        if self.environment in ("staging", "production") and self.database_url.startswith("sqlite"):
            issues.append(
                "CRITICAL: SQLite is not suitable for production. "
                "Use PostgreSQL: set ORBIT_DATABASE_URL."
            )
        return issues


settings = Settings()

# In development, auto-generate a random secret so tokens work without config.
# Never used in non-dev: the validator below blocks a missing secret there.
if settings.environment == "development" and not settings.jwt_secret_key:
    settings.jwt_secret_key = secrets.token_urlsafe(48)

if settings.environment != "development":
    for _issue in settings.validate_production_settings():
        if _issue.startswith("CRITICAL"):
            raise RuntimeError(_issue)
        warnings.warn(_issue, UserWarning, stacklevel=1)
