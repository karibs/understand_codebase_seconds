@echo off
echo ============================================
echo   Architect - AI Workflow Builder (Agent)
echo ============================================
echo.

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH.
    echo Please install Python 3.10+ from https://www.python.org/downloads/
    pause
    exit /b 1
)

:: Create venv if missing
if not exist "venv" (
    echo [*] Creating virtual environment...
    python -m venv venv
)

:: Activate venv
call venv\Scripts\activate.bat

:: Install dependencies
echo [*] Installing dependencies...
pip install -r requirements.txt --quiet

:: Copy .env.example if .env missing
if not exist ".env" (
    if exist ".env.example" (
        echo [*] Creating .env from .env.example...
        copy .env.example .env
        echo [!] Please edit .env and add your API keys before continuing.
        pause
    )
)

:: Start server
echo.
echo [*] Starting server on http://localhost:5000
echo.

python -c "import waitress" >nul 2>&1
if errorlevel 1 (
    echo [*] Running with Flask development server...
    python app.py
) else (
    echo [*] Running with Waitress production server...
    python -c "from waitress import serve; from app import app; print('Serving on http://localhost:5000'); serve(app, host='0.0.0.0', port=5000)"
)

pause
