# RDCM Trading Bots
## Autonomous AI-Powered Trading Platform

**Platform:** Autonomous trading with 5 AI bot strategies  
**Status:** Live & Ready  
**URL:** https://mining-bot-deploy.onrender.com

---

## What's Included

### Backend
- **Node.js + Express** server
- **JWT authentication** (secure login/signup)
- **Bot management API** (create, enable, disable bots)
- **Trading signals API** (real-time AI analysis)
- **Performance tracking API** (trades, win rate, profits)
- **Dashboard data** endpoints

### Frontend
- **Bot management dashboard**
- **Strategy creation interface** (5 bot types)
- **Real-time signals display** (with confidence scores)
- **Performance analytics** (trades, profits, win rate)
- **Sign up / Login** forms
- **Responsive design** (mobile + desktop)

### Trading Strategies
- **🚀 Momentum Bot** - Trend chasing (buy up, sell down)
- **↔️ Mean Reversion Bot** - Buy dips, sell peaks
- **📈 Trend Following Bot** - Long-term trend holding
- **⚡ Scalper Bot** - Rapid micro-trades
- **🤖 AI Smart Bot** - Claude API-powered analysis

---

## Quick Start

### 1. Local Development
```bash
npm install
npm start
# Server runs on http://localhost:3000
```

### 2. Deploy to Netlify
```bash
# Create new Netlify site
netlify deploy --prod

# Or connect GitHub:
# 1. Push to GitHub repo
# 2. Go to https://app.netlify.com/
# 3. Click "New site from Git"
# 4. Select your repo
# 5. Deploy!
```

### 3. Deploy to Railway
```bash
railway link
railway up
```

### 4. Deploy to Heroku
```bash
heroku create rdcm-saas-live
git push heroku master
heroku config:set STRIPE_SECRET=sk_live_xxx
heroku config:set UNMINEABLE_API_KEY=xxx
heroku config:set CLAUDE_API_KEY=xxx
heroku logs --tail
```

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login

### Bots
- `POST /api/bots/create` - Create new bot
- `GET /api/bots` - Get all user bots
- `GET /api/bots/:botId` - Get bot details
- `POST /api/bots/:botId/toggle` - Enable/disable bot
- `DELETE /api/bots/:botId` - Delete bot

### Trading
- `POST /api/bots/:botId/signals` - Get trading signals
- `POST /api/bots/:botId/trade` - Execute trade
- `GET /api/bots/:botId/trades` - Get trade history
- `GET /api/bots/:botId/performance` - Get performance metrics
- `GET /api/trading/dashboard` - Overall dashboard

### Health
- `GET /api/health` - Health check & market hours

---

## Features

✅ **5 Autonomous Bot Strategies**
- Create unlimited bots per strategy
- Custom stock lists per bot
- Real-time signal generation
- Automatic trade execution

✅ **Performance Tracking**
- Win rate calculations
- Profit/loss tracking
- Trade history
- Performance analytics

✅ **Bot Management**
- Enable/disable individual bots
- Adjust risk levels (low/medium/high)
- Monitor real-time signals
- Track historical performance

---

## Setup

### Environment Variables
```bash
JWT_SECRET=your_secret_key
CLAUDE_API_KEY=your_claude_api_key
PORT=3001
```

### Local Development
```bash
npm install
npm start
# App runs on http://localhost:3001
```

### Deployment (Render)
```bash
git push origin main
# Auto-deploys to Render
```

---

## Trading Bot Setup

1. **Create Account** - Sign up on the app
2. **Create Bot** - Choose a strategy (Momentum, Mean Reversion, etc.)
3. **Add Stocks** - Enter stock symbols (AAPL, MSFT, TSLA, etc.)
4. **Configure Risk** - Set risk level (low/medium/high)
5. **Enable Bot** - Bots start running during market hours (9 AM - 5 PM EST)
6. **Monitor** - Track signals and trades on the dashboard

---

## Production Checklist

- [ ] JWT secret configured
- [ ] Claude API key added (for AI Smart Bot)
- [ ] SSL/TLS enabled (Render handles this)
- [ ] Database set up (optional, for persistent trades)
- [ ] Error logging configured
- [ ] Robinhood API credentials (for real trading)
- [ ] Market hours timezone correct (EST)
- [ ] Bot signal accuracy tested
- [ ] Terms of Service & Privacy Policy
- [ ] Legal review (automated trading)

---

## Tech Stack

**Backend:** Node.js, Express, JWT  
**Frontend:** HTML5, CSS3, JavaScript (Vanilla)  
**Deployment:** Render (auto-deploy on git push)  
**AI:** Claude API (for AI Smart Bot strategy)  
**Authentication:** JWT tokens (30-day expiry)  

---

## Support

For questions or help, check the code or reach out.

**Status:** Live & Production Ready  
**Version:** 1.0.0 - Trading Bots Only  
**URL:** https://mining-bot-deploy.onrender.com
