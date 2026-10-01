#!/bin/bash

echo "🚀 RDCM Mining Bot - Quick Start"
echo "================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed"
else
    echo "❌ npm install failed"
    exit 1
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the server:"
echo "  npm start       (production)"
echo "  npm run dev     (development with auto-reload)"
echo ""
echo "Access at: http://localhost:3001"
echo ""
echo "📚 For Replit deployment, see: DEPLOY_TO_REPLIT.md"
echo "💰 To sell on Gumroad, see: GUMROAD_SETUP.md"
