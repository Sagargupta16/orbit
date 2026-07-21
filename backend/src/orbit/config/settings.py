from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="ORBIT_", env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./orbit.db"
    frontend_origin: str = "http://localhost:5173"


settings = Settings()
