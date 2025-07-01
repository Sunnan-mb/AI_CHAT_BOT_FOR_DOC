import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    # Flask settings
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-key-123')
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
    ALLOWED_EXTENSIONS = {'pdf', 'txt', 'docx'}
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    
    # DeepSeek AI via OpenRouter
    OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')
    DEEPSEEK_MODEL = "deepseek/deepseek-r1-0528:free"
    OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
    CONVERT_ENGLISH = {
                "role": "system",
                "content": "Please respond only in English."
            }
    
    # Ensure upload directory exists
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize config
config = Config()
