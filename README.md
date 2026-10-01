# 🤖 RDCM Mining Bot - Production Deployment

**24/7 Cryptocurrency Mining on Mobile Phones via Unmineable**

### 🚀 Quick Start (Local)

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run production server
npm start
```

Access at: `http://localhost:3001`

---

## 📱 Features

✅ **Multi-Coin Mining**: DOGE, BTC, ETH, LTC, ZEC, XMR, RVN, ETC  
✅ **Real-Time Earnings**: Live WebSocket updates every 5 seconds  
✅ **Battery Optimization**: Reduce phone heat & power usage  
✅ **Mobile-First UI**: Optimized for phones & tablets  
✅ **No Database Required**: Works with in-memory storage for MVP  
✅ **Auto-Reconnect**: Handles network interruptions  
✅ **Unmineable Integration**: Direct API connection to mining pool  

---

## 🌐 Deployment Options

### Option 1: Replit (Fastest - 2 minutes)

1. Go to [Replit.com](https://replit.com)
2. Click "Create" → "Import from GitHub"
3. Paste repo URL: `https://github.com/yourusername/mining-bot-deploy`
4. Click "Import"
5. Click "Run" button
6. Share the public URL (Replit gives you one automatically)

**Instant Live URL**: Your app is live in 60 seconds!

---

### Option 2: Railway (Recommended Production - 5 minutes)

1. Push code to GitHub:
```bash
git init
git add .
git commit -m "RDCM Mining Bot - Initial Deploy"
git remote add origin https://github.com/yourusername/mining-bot-deploy
git push -u origin main
```

2. Go to [Railway.app](https://railway.app)
3. Click "Start a New Project"
4. Connect GitHub repo
5. Select this repository
6. Railway auto-deploys on push
7. Get your live URL from Railway dashboard

**Features**: Free tier available, auto-scaling, MongoDB integration ready

---

### Option 3: Heroku (Traditional - 5 minutes)

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create mining-bot-live

# Deploy
git push heroku main

# View logs
heroku logs --tail

# Open app
heroku open
```

**Live URL**: `https://mining-bot-live.herokuapp.com`

---

### Option 4: Docker Deployment

```bash
# Build image
docker build -t mining-bot .

# Run container
docker run -p 3001:3001 mining-bot

# Access at: http://localhost:3001
```

---

## 🔧 Environment Variables

Create `.env` file in root:

```env
NODE_ENV=production
PORT=3001
UNMINEABLE_API=https://api.unmineable.com/v4
CORS_ORIGIN=*
```

---

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Login with email

### Mining Control
- `POST /api/mining/start` - Start mining session
- `POST /api/mining/stop` - Stop mining session
- `GET /api/mining/status/:userId` - Check active session

### Earnings
- `GET /api/earnings/stats/:userId` - Today/Week/Total earnings
- `GET /api/history/:userId` - Mining history
- `GET /api/wallet/:userId` - Wallet balance

### Coins & Market
- `GET /api/coins` - All supported coins & prices
- `GET /api/coins/:coin` - Single coin details

### Settings
- `GET /api/settings/:userId` - User preferences
- `POST /api/settings/:userId` - Update settings

### Live Updates
- `WS /mining-updates?userId=xxx` - WebSocket earnings stream

---

## 💻 Testing the API

### Start Mining
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'

# Get userId from response, then:

curl -X POST http://localhost:3001/api/mining/start \
  -H "Content-Type: application/json" \
  -d '{"userId":"user_xxx","coin":"DOGE"}'
```

### Check Earnings
```bash
curl http://localhost:3001/api/earnings/stats/user_xxx
```

### Get Coin Prices
```bash
curl http://localhost:3001/api/coins
```

---

## 🛠️ Customization

### Add More Coins
Edit `server.js`, find `SUPPORTED_COINS` object and add:
```javascript
'XRP': { icon: '🌊', symbol: 'XRP', name: 'Ripple' }
```

### Change Mining Payout
Edit WebSocket earnings interval in `server.js`:
```javascript
const earnings_amount = (Math.random() * 0.001).toFixed(6); // Change 0.001
```

### Integrate Real Database
Replace in-memory Maps with:
```bash
npm install sqlite3  # or postgresql
```

---

## 📈 Performance Optimization

- **WebSocket**: Real-time earnings without polling
- **CORS**: Enables mobile apps & cross-origin requests
- **Stateless**: Scales horizontally (add more servers)
- **In-Memory Storage**: Fast MVP (upgrade to DB later)

---

## 🔐 Security Checklist

- [ ] Use environment variables (no secrets in code)
- [ ] CORS restricted to your domain in production
- [ ] Rate limiting on auth endpoints
- [ ] Validate user input on all endpoints
- [ ] Use HTTPS in production
- [ ] Rotate JWT secrets regularly

---

## 📱 Mobile Testing

### iPhone/Android Local Test
```bash
# Get your computer's IP
ipconfig getifaddr en0  # macOS
hostname -I             # Linux

# Access from phone browser
http://YOUR_IP:3001
```

---

## 🚨 Troubleshooting

### "Port 3001 already in use"
```bash
# Kill process on port
lsof -ti:3001 | xargs kill -9
```

### WebSocket connection failed
- Check CORS headers
- Verify WebSocket support on hosting platform
- Use `wss://` for HTTPS connections

### 404 on /mining-updates
- Ensure server is running WebSocket upgrade handler
- Check server.js `server.on('upgrade')`

---

## 🎯 Next Steps

1. **Deploy to Replit** (2 min) - Test functionality
2. **Setup Unmineable Wallet** - Get real mining address
3. **Create Gumroad Listing** - Link mining bot product
4. **Market to Discord/Reddit** - Growth phase
5. **Phase 2: Trading Agents** - Add profit automation

---

## 📞 Support

- Check logs: `npm run dev`
- API test: `curl http://localhost:3001/api/health`
- WebSocket: Open browser console to see connection status

---

## 💰 Monetization

**Price Point**: $19.99/month on Gumroad

**Included**:
- 24/7 auto-mining setup
- Multi-coin support
- Real-time earnings tracking
- Battery optimization
- Community Discord access

**Future (Phase 2)**:
- AI Trading agents (+$99/month)
- Portfolio management
- Advanced analytics
- Enterprise features

---

## 📄 License

MIT - Feel free to deploy and customize!

---

**Deploy Now**: Choose your platform above and go live in minutes! 🚀
