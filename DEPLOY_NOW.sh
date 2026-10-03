#!/bin/bash

# RDCM QUANTUM - One-Click Replit Deployment Script
# This script prepares everything for instant Replit deployment

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   RDCM QUANTUM v2.1 - Deployment Prep                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"

# Verify Node.js
echo -e "\n✓ Checking Node.js..."
node --version

# Verify files exist
echo -e "\n✓ Checking critical files..."
files=("server-with-brokers.js" "broker-integration.js" "package.json")
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✓ $file"
  else
    echo "  ✗ $file (MISSING!)"
    exit 1
  fi
done

# Create data directory if it doesn't exist
if [ ! -d "data" ]; then
  echo -e "\n✓ Creating data directory..."
  mkdir -p data
fi

# Initialize database files
echo -e "\n✓ Initializing database..."
cat > data/users.json << 'EOF'
[]
EOF

cat > data/bots.json << 'EOF'
[]
EOF

cat > data/trades.json << 'EOF'
[]
EOF

cat > data/brokerConnections.json << 'EOF'
[]
EOF

cat > data/logs.json << 'EOF'
[]
EOF

cat > data/settings.json << 'EOF'
{"platform_name": "RDCMNATION QUANTUM", "version": "2.1.0"}
EOF

echo "  ✓ Database initialized"

# Verify package.json
echo -e "\n✓ Verifying package.json..."
if grep -q '"main": "server-with-brokers.js"' package.json; then
  echo "  ✓ Main entry point correct"
else
  echo "  ✗ Main entry point not set to server-with-brokers.js"
  exit 1
fi

# Test server startup
echo -e "\n✓ Testing server startup..."
timeout 3 node server-with-brokers.js &
sleep 2
HEALTH=$(curl -s http://localhost:3000/health 2>/dev/null | grep -o '"status":"online"')

if [ -n "$HEALTH" ]; then
  echo "  ✓ Server starts successfully"
  pkill -f "node server-with-brokers" 2>/dev/null
else
  echo "  ✗ Server failed to start"
  pkill -f "node server-with-brokers" 2>/dev/null
  exit 1
fi

# Summary
echo -e "\n╔════════════════════════════════════════════════════════════════╗"
echo "║           ✅ ALL CHECKS PASSED - READY TO DEPLOY              ║"
echo "╚════════════════════════════════════════════════════════════════╝"

echo -e "\n📋 DEPLOYMENT CHECKLIST"
echo "✓ Node.js installed"
echo "✓ All files present"
echo "✓ Database initialized"
echo "✓ Server starts correctly"
echo "✓ Health endpoint responds"

echo -e "\n🚀 NEXT STEPS:"
echo "1. Go to https://replit.com"
echo "2. Click 'Create Repl' → Select 'Node.js'"
echo "3. Name it: rdcmnation-quantum"
echo "4. Paste this in Replit terminal:"
echo ""
echo "   git clone https://github.com/rdcmnation-boop/mining-bot-deploy.git && cd mining-bot-deploy && npm start"
echo ""
echo "5. Your API will be live at: https://[username]-rdcmnation-quantum.replit.dev"

echo -e "\n💾 TEST CREDENTIALS:"
echo "User Email: test@example.com"
echo "User Password: test123"
echo "Owner Email: admin@rdcmnation.com"
echo "Owner Password: owner123"

echo -e "\n✨ Ready to go live! 🚀\n"
