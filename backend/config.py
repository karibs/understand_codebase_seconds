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
