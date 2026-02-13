#!/usr/bin/env bash
set -e

echo "============================================"
echo "  Architect - Project Analyzer"
echo "============================================"
echo
echo "  This backend runs a LOCAL-ONLY server on"
echo "  your computer (localhost:5000). It reads"
echo "  project files for analysis. No data is"
echo "  sent to any external server."
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
fi

# Start server
echo
echo "[*] Starting server on http://localhost:5000"
echo "[*] Open the Architect website and click \"Start Analyzing\""
echo "[*] Press Ctrl+C to stop the server"
echo
python3 app.py
