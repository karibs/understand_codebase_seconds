@echo off
echo ============================================
echo   Architect - Project Analyzer
echo ============================================
echo.
echo   This backend runs a LOCAL-ONLY server on
echo   your computer (localhost:5000). It reads
echo   project files for analysis. No data is
echo   sent to any external server.
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
    )
)

:: Start server
echo.
echo [*] Starting server on http://localhost:5000
echo [*] Open the Architect website and click "Start Analyzing"
echo [*] Press Ctrl+C to stop the server
echo.
python app.py

pause
