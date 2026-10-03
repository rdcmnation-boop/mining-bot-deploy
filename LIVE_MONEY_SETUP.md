# RDCM Nation - Live Money Platform Setup Guide

## Overview
Complete real-money integration for:
- **Crypto Trading** (Coinbase)
- **Stock Trading** (Robinhood)
- **Crypto Mining** (Unmineable)
- **Live Prices & News** (CoinGecko, NewsAPI, CryptoPanic)

---

## 1. Installation

```bash
npm install
```

---

## 2. API Keys Setup

### Coinbase
1. Go to https://www.coinbase.com/settings/api
2. Create API key with permissions:
   - `wallet:accounts:read`
   - `wallet:buys:create`
   - `wallet:sells:create`
3. Add to `.env`:
   ```
   COINBASE_API_KEY=your_key
   COINBASE_API_SECRET=your_secret
   COINBASE_PASSPHRASE=your_passphrase
   ```

### Robinhood
1. Get your Robinhood credentials (email + password)
2. Set up MFA (recommended)
3. Add to `.env`:
   ```
   ROBINHOOD_USERNAME=your_email@gmail.com
   ROBINHOOD_PASSWORD=your_password
   ROBINHOOD_MFA=your_mfa_code
   ```

### Unmineable
1. Go to https://unmineable.com
2. Create account & get API key
3. Add to `.env`:
   ```
   UNMINEABLE_API_KEY=your_key
   ```

### News APIs
1. **NewsAPI**: https://newsapi.org (free tier available)
   ```
   NEWS_API_KEY=your_key
   ```
2. **CryptoPanic**: https://cryptopanic.com (free with API key)
   ```
   CRYPTOPANIC_API_KEY=your_key
   ```

### Claude AI
1. Get API key from https://console.anthropic.com
2. Add to `.env`:
   ```
   CLAUDE_API_KEY=sk-ant-...
   ```

---

## 3. Start the Server

```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

The server will run on `http://localhost:3001`

---

## 4. API Endpoints

### Authentication
```
POST   /api/auth/register          # Create account
POST   /api/auth/login             # Login
```

### Coinbase Trading
```
GET    /api/accounts/coinbase/balance        # Get balance
POST   /api/trading/buy                      # Place buy order
```

### Robinhood Trading
```
GET    /api/trading/robinhood/account        # Account info
GET    /api/trading/robinhood/portfolio      # Your holdings
POST   /api/trading/robinhood/order          # Place order
```

### Mining (Unmineable)
```
POST   /api/accounts/link-unmineable         # Link mining account
GET    /api/mining/:coin/:wallet             # Mining stats
POST   /api/mining/withdraw                  # Withdraw earnings
```

### Live Prices & News
```
GET    /api/prices?coins=bitcoin,ethereum    # Real-time prices
GET    /api/news?query=bitcoin&limit=10      # Crypto news
GET    /api/news/trending                    # Trending news
GET    /api/coins/:coinId                    # Coin details
```

### Dashboard
```
GET    /api/dashboard                        # Full account overview
GET    /api/health                           # System status
```

---

## 5. Usage Examples

### Get Crypto Prices
```bash
curl "http://localhost:3001/api/prices?coins=bitcoin,ethereum,dogecoin"
```

Response:
```json
{
  "success": true,
  "prices": {
    "BTC": {
      "usd": 42500,
      "market_cap": 830000000000,
      "volume_24h": 25000000000,
      "change_24h": 2.5
    },
    "ETH": {
      "usd": 2250,
      "change_24h": 1.8
    }
  }
}
```

### Get Crypto News
```bash
curl "http://localhost:3001/api/news?query=bitcoin&limit=5"
```

### Register User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "username": "trader"
  }'
```

### Place Robinhood Order
```bash
curl -X POST http://localhost:3001/api/trading/robinhood/order \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "AAPL",
    "quantity": 10,
    "side": "buy"
  }'
```

### Buy Bitcoin on Coinbase
```bash
curl -X POST http://localhost:3001/api/trading/buy \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "BTC-USD",
    "amount": 100
  }'
```

---

## 6. Demo Mode

All endpoints work in **demo mode** if real API keys aren't provided. This is perfect for:
- Testing the UI
- Development
- Understanding the API flow

Real API keys activate live connections automatically.

---

## 7. Features

✅ Real-time crypto prices (1s updates)
✅ Live news feeds with sentiment
✅ Crypto trading on Coinbase
✅ Stock trading on Robinhood
✅ Crypto mining via Unmineable
✅ Complete transaction tracking
✅ Portfolio management
✅ WebSocket support for live updates
✅ Rate limiting (100 req/15min)
✅ JWT authentication
✅ Demo mode for testing

---

## 8. Deployment

### Local (Development)
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker
```bash
docker build -t rdcm-live-money .
docker run -e PORT=3001 -p 3001:3001 rdcm-live-money
```

### Netlify / Vercel
```bash
npm run build
npm start
```

---

## 9. Troubleshooting

**API connection fails?**
- Check your `.env` file has real API keys
- Verify API credentials are correct
- Check network connectivity

**Prices not updating?**
- CoinGecko API is free and rate-limited
- Add delays between requests if needed

**Mining stats empty?**
- Make sure wallet address is correct
- Mining must be active on Unmineable

**Robinhood orders fail?**
- Verify MFA is set up correctly
- Check account has sufficient funds
- Verify trading hours (9 AM - 5 PM EST)

---

## 10. Security Notes

⚠️ **Never commit `.env` to git**
- Add `.env` to `.gitignore`
- Use environment variables in production
- Rotate API keys regularly
- Use read-only API keys where possible

---

## Support

For issues, check:
1. `.env` configuration
2. API key validity
3. Network connectivity
4. Rate limits (100 req/15 min)

---

**Version:** 3.0 (Live Money)
**Last Updated:** 2026-10-03
