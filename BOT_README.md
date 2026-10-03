# 🤖 RDCM Trading Bot

AI-powered trading assistant integrated into your live trading platform.

## Features

### Chat Commands
- 💬 Natural language processing
- 📊 Real-time price queries
- 💰 Balance and portfolio checks
- 📈 Trading execution
- 📰 Market news updates
- 💳 Deposit assistance

### Trading Commands

**Buy Crypto**
```
"Buy 0.5 BTC"
"Buy 2 ETH"
"Purchase 1000 DOGE"
```

**Sell Crypto**
```
"Sell 0.25 BTC"
"Sell 1 ETH"
```

**Check Prices**
```
"What's the price of Bitcoin?"
"How much is ETH?"
"Show crypto prices"
```

**Manage Account**
```
"What's my balance?"
"Show my portfolio"
"How do I deposit?"
```

**Market Info**
```
"Latest news"
"Market updates"
"Crypto market trends"
```

**Auto Trading**
```
"Enable auto trading (conservative|balanced|aggressive)"
"Start auto trading with balanced strategy"
```

## How It Works

### 1. **Chat Interface**
- Fixed widget in bottom-right corner
- Click 🤖 to open/close
- Type commands naturally
- Real-time responses

### 2. **Command Processing**
- Parse natural language
- Extract intent and parameters
- Execute API calls
- Return formatted responses

### 3. **Trading Execution**
- Buy/Sell orders
- Balance checks
- Portfolio management
- Transaction tracking

### 4. **Market Data**
- Live crypto prices (CoinGecko)
- Market news feeds
- Sentiment analysis
- 24h change tracking

## Usage Examples

### Example 1: Buy Bitcoin
```
User: "Buy 0.5 BTC"
Bot: ✅ Buy order executed!
     • Asset: BTC
     • Amount: 0.5
     • Status: Pending
```

### Example 2: Check Balance
```
User: "What's my balance?"
Bot: 💰 Your Balance:
     • Total: $5,000.00
     • Available: $3,500.00
     • Crypto Holdings: $1,200.00
```

### Example 3: Get Prices
```
User: "Show crypto prices"
Bot: 📊 Current Prices:
     📈 BTC: $42,500 (↑2.5%)
     📈 ETH: $2,250 (↑1.8%)
```

## Files

- **bot.js** - Core bot logic and command processing
- **bot-widget.html** - Chat UI and styling
- **dashboard.html** - Integration into dashboard

## Configuration

### Trading Strategies

Three built-in strategies for auto-trading:

**Conservative**
- Risk Level: 30%
- Buy dips: ✅
- Stop loss: ✅

**Balanced**
- Risk Level: 50%
- Buy dips: ✅
- Stop loss: ✅

**Aggressive**
- Risk Level: 80%
- Buy dips: ✅
- Stop loss: ❌

### API Integration

Bot connects to:
- `/api/prices` - Live crypto prices
- `/api/news` - Market news
- `/api/trading/buy` - Place buy orders
- `/api/trading/sell` - Place sell orders
- `/api/dashboard` - User balance & portfolio
- `/api/funding` - Deposit management

## Console Access

Access bot directly from browser console:

```javascript
// Process a command
await bot.processCommand("Buy 0.5 BTC")

// Get conversation history
bot.getConversationHistory()

// Clear chat
bot.clearHistory()

// Get help
bot.getHelpText()
```

## Error Handling

- Network timeouts → Demo mode fallback
- Invalid commands → Friendly help prompt
- API errors → Error message with guidance
- Auth issues → Prompt to login

## Future Enhancements

- [ ] Voice commands
- [ ] Machine learning price predictions
- [ ] Automated portfolio rebalancing
- [ ] Risk alerts and notifications
- [ ] Multi-language support
- [ ] Custom trading strategies
- [ ] Integration with Claude AI API
- [ ] Advanced technical analysis

## Demo Mode

Works without backend APIs! The bot includes:
- Simulated price data
- Demo trading responses
- Mock portfolio data
- Sample news feeds

**Connect real APIs in `bot.js`:**
```javascript
const response = await fetch(`${this.apiBase}/api/trading/buy`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${this.token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ asset, amount, action: 'buy' })
});
```

## Support

For issues or questions:
1. Check bot help: `"Help"` command
2. View console logs: `F12 → Console`
3. Check API endpoints: `/api/health`
4. Contact: support@rdcmnation.com

---

**Version:** 1.0  
**Status:** Active Development  
**Platform:** RDCM Nation Live Money Platform
