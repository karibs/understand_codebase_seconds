import os
from pathlib import Path

class Config:
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    DEBUG = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'

    # Project Root - SECURITY: All file operations confined to this directory
    PROJECT_ROOT = Path(os.getenv('PROJECT_ROOT', './workspace')).resolve()

    # Allowed file extensions for reading
    ALLOWED_EXTENSIONS = {'.vue', '.js', '.ts', '.py', '.md', '.json', '.css', '.html'}

    # AI API Keys
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')

    # Default AI Provider: 'openai' or 'gemini'
    AI_PROVIDER = os.getenv('AI_PROVIDER', 'gemini')

    # Artifact paths (relative to PROJECT_ROOT)
    ARTIFACTS_DIR = 'docs'

    @classmethod
    def ensure_workspace(cls):
        """Ensure workspace and artifacts directory exist."""
        cls.PROJECT_ROOT.mkdir(parents=True, exist_ok=True)
        artifacts_path = cls.PROJECT_ROOT / cls.ARTIFACTS_DIR
        artifacts_path.mkdir(parents=True, exist_ok=True)
        return cls.PROJECT_ROOT
