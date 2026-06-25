import os

from dotenv import load_dotenv

load_dotenv()


class Settings:
    def __init__(self) -> None:
        database_url = os.getenv(
            "DATABASE_URL",
            "postgresql+psycopg://postgres:postgres@localhost:5432/template_db",
        )
        if database_url.startswith("postgres://"):
            database_url = "postgresql+psycopg://" + database_url[len("postgres://") :]
        self.database_url = database_url
        self.port = int(os.getenv("PORT", "3000"))
        self.cors_origin = os.getenv("CORS_ORIGIN", "http://localhost:5173")
        self.app_env = os.getenv("APP_ENV", "development")

        # Gemini — powers the cooking assistant (voice → oven program)
        self.gemini_api_key = os.getenv("GEMINI_API_KEY", "")


settings = Settings()
