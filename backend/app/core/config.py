from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "RAVY Backend"
    VERSION: str = "0.1.0"

    # Base PostgreSQL (docker-compose -> service "db")
    POSTGRES_USER: str = "ravy"
    POSTGRES_PASSWORD: str = "ravy"
    POSTGRES_DB: str = "ravy_db"
    POSTGRES_HOST: str = "db"
    POSTGRES_PORT: int = 5432

    # Clés Supabase (on remplira plus tard)
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
