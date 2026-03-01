from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Drona LMS AI Service"
    cors_origins: list[str] = ["http://localhost:4200", "http://localhost:8080"]
    default_question_count: int = 5

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")
