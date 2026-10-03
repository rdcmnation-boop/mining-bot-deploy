# RDCM Hybrid Platform - Production Deployment

## Phase 4: Full Automation with AI Trading

### What's Working Now ✅

**Mining → Trading → Profit Pipeline:**
1. **Real Mining** - Unmineable API earns crypto 24/7
2. **Auto Conversion** - Crypto → USD via Coinbase
3. **AI Trading** - Claude AI generates BUY/SELL signals
4. **Auto Execute** - Robinhood trades execute signals
5. **Analytics** - Portfolio tracking & metrics

### Setup Steps

#### 1. Environment Variables
Create `.env` file:
```
# Mining
UNMINEABLE_API_KEY=your_unmineable_id

# Crypto Exchange
COINBASE_API_KEY=your_coinbase_key
COINBASE_API_SECRET=your_coinbase_secret
COINBASE_PASSPHRASE=your_coinbase_passphrase

# Stock Trading
ROBINHOOD_USERNAME=your_robinhood_email
ROBINHOOD_PASSWORD=your_robinhood_password
ROBINHOOD_MFA=your_mfa_device_id

# AI Signals
CLAUDE_API_KEY=your_claude_api_key

# News & Market Data
NEWS_API_KEY=your_newsapi_key
```

#### 2. Install & Test
```bash
npm install
npm test  # Run test suite
node test-trading-bot.js  # Full automation test
```

#### 3. Run Server
```bash
npm start
```

Server runs on port 3001 (or $PORT env var)

#### 4. Deploy
Deploy to Render/Railway/Heroku:
```bash
git push heroku main
# or Railway/Render auto-deploys on git push
```

### API Endpoints

#### Mining & Conversion
- `GET /api/automation/earnings` - Get mining balance
- `POST /api/automation/convert` - Sell crypto for USD
- `GET /api/automation/analytics` - Portfolio metrics

#### AI Trading
- `POST /api/trading/signals` - Get BUY/SELL signals (array of symbols)
- `GET /api/trading/signal/:symbol` - Signal for one stock
- `POST /api/trading/execute-signals` - Execute AI trades
- `GET /api/trading/metrics` - Trading performance

#### Full Automation
- `POST /api/automation/run` - Full cycle: earn → convert → trade

### Trading Flow

**Automated Daily:**
1. **9:00 AM EST** - Check mining earnings
2. **10:00 AM EST** - Convert earnings to USD
3. **10:30 AM EST** - Generate signals for top 10 holdings
4. **11:00 AM EST** - Execute high-confidence trades (>60%)
5. **3:00 PM EST** - Rebalance portfolio
6. **4:00 PM EST** - Calculate daily metrics

### How It Makes Money

1. **Mining Revenue** - Earn crypto 24/7 from Unmineable
2. **Trading Gains** - AI signals capture profitable moves
3. **Portfolio Growth** - Automated rebalancing
4. **Diversification** - Balanced/Conservative/Aggressive strategies

### Monitoring

**Real-time Dashboard:**
- Navigate to https://rdcmnation14.netlify.app/
- Login with your credentials
- View: Mining, Trades, Portfolio, Earnings

**API Health:**
```bash
curl http://localhost:3001/health
```

**Trading Signals:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/trading/signal/AAPL
```

### Risk Management

**Built-in Protections:**
- ✅ 2% position sizing on each trade
- ✅ Only trades with >60% AI confidence
- ✅ Market hours only (9 AM - 5 PM EST weekdays)
- ✅ Portfolio diversification by strategy
- ✅ Rate limiting on API calls

### Troubleshooting

**Mining not working:**
- Check UNMINEABLE_API_KEY is valid
- Verify account is active on Unmineable

**Trading not executing:**
- Verify Robinhood credentials
- Ensure MFA device ID is correct
- Check market hours (9 AM - 5 PM EST)
- Verify cash balance in Robinhood

**AI signals not generating:**
- Check CLAUDE_API_KEY is valid
- Verify Claude API has credits
- Check network connectivity

### Next Features

- [ ] Advanced LSTM price prediction
- [ ] Options trading support
- [ ] Multi-account management
- [ ] Webhook notifications
- [ ] Performance analytics dashboard
- [ ] Discord/Slack alerts

### Support

For issues, check logs:
```bash
# Render logs
heroku logs --tail

# Local logs
npm start > trading-bot.log 2>&1
```

---

**Ready to trade?** Deploy now! 🚀
