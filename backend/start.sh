#!/usr/bin/env bash
set -e

echo "============================================"
echo "  Architect - AI Workflow Builder (Agent)"
echo "============================================"
echo

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 is not installed."
    echo "Please install Python 3.10+ from https://www.python.org/downloads/"
    exit 1
fi

# Create venv if missing
if [ ! -d "venv" ]; then
    echo "[*] Creating virtual environment..."
    python3 -m venv venv
fi

# Activate venv
source venv/bin/activate

# Install dependencies
echo "[*] Installing dependencies..."
pip install -r requirements.txt --quiet

# Copy .env.example if .env missing
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    echo "[*] Creating .env from .env.example..."
    cp .env.example .env
    echo "[!] Please edit .env and add your API keys before continuing."
    read -p "Press Enter to continue..."
fi

# Start server
echo
echo "[*] Starting server on http://localhost:5000"
echo

if python3 -c "import gunicorn" 2>/dev/null; then
    echo "[*] Running with Gunicorn production server..."
    gunicorn app:app --bind 0.0.0.0:5000 --workers 2
else
    echo "[*] Running with Flask development server..."
    python3 app.py
fi
