#!/bin/bash
echo "🚀 Starting Python Microservice..."

cd "$(dirname "$0")/python-service" || exit 1

if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate

echo "📥 Installing dependencies..."
pip install -r requirements.txt > /dev/null 2>&1

echo "✅ Python Service is starting on http://localhost:5002"
echo "📚 API Documentation: http://localhost:5002/docs"
echo ""
python main.py
