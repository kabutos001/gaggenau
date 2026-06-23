import os

from dotenv import load_dotenv


load_dotenv()


class Settings:
  def __init__(self) -> None:
    self.database_url = os.getenv(
      'DATABASE_URL',
      'postgresql+psycopg://postgres:postgres@localhost:5432/template_db',
    )
    self.port = int(os.getenv('PORT', '3000'))
    self.cors_origin = os.getenv('CORS_ORIGIN', 'http://localhost:5173')
    self.app_env = os.getenv('APP_ENV', 'development')
    
    # Optional: Supabase credentials
    self.supabase_url = os.getenv('SUPABASE_URL')
    self.supabase_key = os.getenv('SUPABASE_KEY')
    
    # Optional: Anthropic API key
    self.anthropic_api_key = os.getenv('ANTHROPIC_API_KEY')

    # Gemini — powers the cooking assistant (voice → oven program)
    self.gemini_api_key = os.getenv('GEMINI_API_KEY', '')


settings = Settings()
