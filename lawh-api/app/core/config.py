from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str
    supabase_service_key: str
    device: str = "cpu"  # "cuda" on EC2 with GPU

    class Config:
        env_file = ".env"


settings = Settings()
