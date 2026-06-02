import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    XAI_API_KEY = os.getenv("XAI_API_KEY")
    ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "password123")
    default_db_path = "/tmp/chroma_db" if os.getenv("VERCEL") else "./chroma_db"
    DATABASE_PATH = os.getenv("DATABASE_PATH", default_db_path)
    
    # Generic OpenAI-compatible config
    AI_BASE_URL = os.getenv("AI_BASE_URL", "https://api.groq.com/openai/v1")
    AI_MODEL = os.getenv("AI_MODEL", "llama-3.3-70b-versatile")

config = Config()
