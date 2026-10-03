# RDCM QUANTUM - Replit Deployment Guide

**Version**: 2.1.0  
**Platform**: Replit (Free)  
**Server**: server-with-brokers.js  
**Status**: ✅ Ready to Deploy

---

## 🚀 Quick Start (5 minutes)

### Step 1: Create Replit Project
1. Go to https://replit.com
2. Click "Create Repl"
3. Select "Node.js"
4. Name it `rdcmnation-quantum`
5. Click "Create repl"

### Step 2: Clone Repository
In the Replit shell (bottom terminal), run:
```bash
git clone https://github.com/rdcmnation-boop/mining-bot-deploy.git
cd mining-bot-deploy
```

### Step 3: Install Dependencies
Since we use zero npm dependencies, just verify Node is installed:
```bash
node --version  # Should show v18.x or higher
```

### Step 4: Start the Server
```bash
npm start
```

Or directly:
```bash
node server-with-brokers.js
```

You should see:
```
╔════════════════════════════════════════════════════════════════╗
║   🚀 RDCM QUANTUM v2.1 - WITH REAL BROKER INTEGRATION          ║
║   Live Trading: Robinhood + Coinbase                           ║
╚════════════════════════════════════════════════════════════════╝
```

---

## 🔗 Access Your API

Once running, your API will be available at:
```
https://[replit-username]-rdcmnation-quantum.replit.dev
```

Example:
```
https://yourname-rdcmnation-quantum.replit.dev/health
```

---

## 📋 Available Endpoints

### Health Check
```bash
curl https://[your-replit-url]/health
```

### Authentication
```bash
# Register
curl -X POST https://[your-replit-url]/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "Trader Name"
  }'

# Login
curl -X POST https://[your-replit-url]/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Broker Integration
```bash
# Connect Robinhood
curl -X POST https://[your-replit-url]/api/brokers/connect-robinhood \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "username": "your_robinhood_user",
    "password": "your_robinhood_pass",
    "mfaToken": "123456"
  }'

# Connect Coinbase
curl -X POST https://[your-replit-url]/api/brokers/connect-coinbase \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "apiKey": "your_api_key",
    "apiSecret": "your_api_secret",
    "passphrase": "your_passphrase"
  }'

# Get Unified Portfolio
curl https://[your-replit-url]/api/brokers/portfolio \
  -H "Authorization: Bearer $TOKEN"

# Execute Live Trade
curl -X POST https://[your-replit-url]/api/trades/execute-live \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "assetType": "stock",
    "symbol": "AAPL",
    "quantity": 5,
    "side": "buy",
    "price": 150.25
  }'
```

---

## 🔐 Test Credentials

For testing without real broker accounts:
```
User Email: test@example.com
User Password: test123

Owner Email: admin@rdcmnation.com
Owner Password: owner123
```

---

## 🌐 Frontend Setup

Update your frontend HTML files to point to your Replit URL:

In `public/index.html`, `public/bot-control.html`, `public/owner-dashboard.html`:

```javascript
// Change this:
const API_BASE = 'https://rdcmnation-quantum-api.herokuapp.com';

// To this:
const API_BASE = 'https://[your-replit-url]';
```

---

## 💾 Database

The application uses file-based JSON storage in the `/data` directory:
- `users.json` - User accounts
- `bots.json` - Trading bots
- `trades.json` - Trade history
- `brokers.json` - Broker connections
- `logs.json` - Audit trail
- `settings.json` - Platform settings

**Note**: Replit's file storage is ephemeral. For production, consider:
- Supabase (free PostgreSQL)
- MongoDB Atlas (free tier)
- Firebase Firestore (free tier)

---

## ⚙️ Environment Variables

Optional environment variables (in `.env`):
```bash
PORT=3000
NODE_ENV=production
ROBINHOOD_CLIENT_ID=your_robinhood_client_id
COINBASE_API_URL=https://api.coinbase.com/v2
```

---

## 🔄 Keep Server Running

By default, Replit keeps free projects running for ~1 hour without activity. To keep it running:

### Option 1: Use Replit Deployments
1. Click "Deploy" button in Replit
2. Select "Deploy"
3. Your project gets a permanent URL

### Option 2: Use UptimeRobot (Free)
1. Go to https://uptimerobot.com
2. Create a free account
3. Add monitor: `https://[your-replit-url]/health`
4. Set interval to 5 minutes
5. Your server will ping every 5 min to stay alive

---

## 🚨 Troubleshooting

### Server won't start
```bash
# Check Node version
node --version

# Clear cache and restart
rm -rf node_modules
npm install
npm start
```

### Port already in use
```bash
# Change port in server-with-brokers.js
# Line 22: const PORT = process.env.PORT || 3000;
```

### Database errors
```bash
# Replit file system might be read-only
# Restart the repl and try again
```

### CORS errors in frontend
The server has CORS enabled for all origins. If still issues:
```javascript
// Add to browser console to test API directly:
fetch('https://[your-url]/health').then(r => r.json()).then(console.log)
```

---

## 📊 Monitoring

Check logs in Replit console for:
- API request traces
- Authentication flows
- Broker connection status
- Trade execution logs

Example log:
```
✅ User registered: user@example.com
✅ Robinhood connected: test_robinhood_user
✅ Live trade executed: AAPL BUY 5 @ $155.75
```

---

## 🔄 Updates

To get latest updates from GitHub:
```bash
git pull origin main
npm restart
```

---

## 📞 Support

1. Check `/data/logs.json` for error details
2. Review API_DOCS.md for endpoint specs
3. Review BROKER_INTEGRATION_TESTS.md for test examples

---

## 🎯 Next Steps After Deployment

1. **Test Endpoints**: Use curl or Postman to test all endpoints
2. **Update Frontend**: Point HTML files to your Replit URL
3. **Add Real Credentials**: Update with actual Robinhood/Coinbase API keys
4. **Custom Domain**: Add custom domain to Replit
5. **Database Upgrade**: Move to persistent database for production

---

**Deployed**: Ready for live trading!  
**Support**: RDCMNATION QUANTUM v2.1.0

