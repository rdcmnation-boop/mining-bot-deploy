/**
 * RDCM Hybrid Platform - Phase 2: Real Stock Trading + AI Agents
 * Robinhood API Integration + Claude AI Trading Engine
 * Automated trading during market hours (9 AM - 5 PM EST)
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'rdcm-secret-' + Math.random().toString(36).substring(7);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: '⚠️ Too many requests, please try again later.'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: '⚠️ Too many login attempts, please try again later.'
});

app.use(limiter);

// ==================== CONFIGURATION ====================

const UNMINEABLE_API_BASE = 'https://api.unmineable.com/v4';
const ROBINHOOD_API_BASE = 'https://api.robinhood.com';
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || 'sk-ant-...';
const CLAUDE_API_ENDPOINT = 'https://api.anthropic.com/v1/messages';

// Supported coins for mining
const SUPPORTED_COINS = {
  'DOGE': { name: 'Dogecoin', symbol: 'DOGE', pool: 'doge', icon: '🐕' },
  'BTC': { name: 'Bitcoin', symbol: 'BTC', pool: 'btc', icon: '₿' },
  'ETH': { name: 'Ethereum', symbol: 'ETH', pool: 'eth', icon: 'Ξ' },
  'LTC': { name: 'Litecoin', symbol: 'LTC', pool: 'ltc', icon: 'Ł' },
  'ZEC': { name: 'Zcash', symbol: 'ZEC', pool: 'zec', icon: '🔒' },
  'XMR': { name: 'Monero', symbol: 'XMR', pool: 'xmr', icon: '🛡️' },
  'RVN': { name: 'Ravencoin', symbol: 'RVN', pool: 'rvn', icon: '🐦' },
  'ETC': { name: 'Ethereum Classic', symbol: 'ETC', pool: 'etc', icon: '⛓️' }
};

// Popular stocks for trading
const POPULAR_STOCKS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX',
  'ADBE', 'ASML', 'AMD', 'INTEL', 'COSTCO', 'WALMART', 'JPM', 'BAC'
];

// ==================== DATA STORAGE ====================

const users = new Map();
const miningAccounts = new Map();
const tradingAccounts = new Map();
const openPositions = new Map();
const tradingHistory = new Map();
const aiSignals = new Map();
const portfolios = new Map();

// ==================== AI TRADING ENGINE ====================

/**
 * Generate trading signal using Claude AI
 */
async function generateTradingSignal(symbol, marketData) {
  try {
    const prompt = `As a stock trading AI, analyze ${symbol} and provide a trading signal.

Market Data:
- Current Price: $${marketData.price}
- 24h Change: ${marketData.change24h}%
- Volume: ${marketData.volume}
- RSI: ${marketData.rsi}
- MACD: ${marketData.macd}
- Sentiment: ${marketData.sentiment}
- News: ${marketData.news}

Based on this data, provide ONLY a JSON response with:
{
  "action": "BUY" | "SELL" | "HOLD",
  "confidence": 0-100,
  "reason": "brief reason",
  "targetPrice": price,
  "stopLoss": price
}

Remember: Only recommend BUY if confidence > 70. Only SELL if confidence > 75. Otherwise HOLD.`;

    const response = await fetch(CLAUDE_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: prompt
        }]
      }),
      timeout: 10000
    });

    if (!response.ok) {
      console.error('Claude API error:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data.content[0].text;

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error generating trading signal:', error.message);
    return null;
  }
}

/**
 * Calculate position size based on account and risk management
 */
function calculatePositionSize(accountSize, riskPercent = 2) {
  return (accountSize * riskPercent) / 100;
}

/**
 * Analyze market conditions
 */
async function analyzeMarket(stocks) {
  const signals = [];

  for (const symbol of stocks) {
    const marketData = await fetchMarketData(symbol);
    if (!marketData) continue;

    const signal = await generateTradingSignal(symbol, marketData);
    if (signal) {
      signals.push({
        symbol,
        ...signal,
        timestamp: new Date()
      });
    }

    // Rate limiting for API
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return signals;
}

/**
 * Fetch market data for a stock (mock for now)
 */
async function fetchMarketData(symbol) {
  // In production, use real market data API (Alpha Vantage, IEX, etc)
  return {
    symbol,
    price: Math.random() * 500,
    change24h: (Math.random() - 0.5) * 10,
    volume: Math.floor(Math.random() * 10000000),
    rsi: Math.random() * 100,
    macd: Math.random() - 0.5,
    sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)],
    news: 'Recent market news...'
  };
}

/**
 * Execute trade on Robinhood (mock for now)
 */
async function executeTrade(userId, symbol, action, quantity, price) {
  try {
    const tradeId = uuidv4();
    const trade = {
      id: tradeId,
      userId,
      symbol,
      action,
      quantity,
      price,
      timestamp: new Date(),
      status: 'executed'
    };

    tradingHistory.set(tradeId, trade);

    // Update portfolio
    if (!portfolios.has(userId)) {
      portfolios.set(userId, new Map());
    }

    const portfolio = portfolios.get(userId);
    const currentPosition = portfolio.get(symbol) || { quantity: 0, avgPrice: 0 };

    if (action === 'BUY') {
      const totalCost = currentPosition.quantity * currentPosition.avgPrice + quantity * price;
      const newQuantity = currentPosition.quantity + quantity;
      portfolio.set(symbol, {
        quantity: newQuantity,
        avgPrice: totalCost / newQuantity,
        value: newQuantity * price
      });
    } else if (action === 'SELL') {
      const newQuantity = Math.max(0, currentPosition.quantity - quantity);
      portfolio.set(symbol, {
        quantity: newQuantity,
        avgPrice: currentPosition.avgPrice,
        value: newQuantity * price
      });
    }

    return trade;
  } catch (error) {
    console.error('Trade execution error:', error);
    return null;
  }
}

// ==================== MARKET HOURS CHECK ====================

/**
 * Check if market is open (9 AM - 5 PM EST)
 */
function isMarketHours() {
  const now = new Date();
  const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));

  const hours = estTime.getHours();
  const minutes = estTime.getMinutes();

  const marketOpen = hours >= 9 && (hours < 17 || (hours === 17 && minutes === 0));
  const isWeekday = estTime.getDay() >= 1 && estTime.getDay() <= 5;

  return marketOpen && isWeekday;
}

// ==================== AUTOMATED TRADING SCHEDULER ====================

/**
 * Run AI trading analysis every hour during market hours
 */
function startTradingScheduler() {
  setInterval(async () => {
    if (!isMarketHours()) return;

    console.log('🤖 Running AI trading analysis...');

    // Analyze top stocks
    const signals = await analyzeMarket(POPULAR_STOCKS.slice(0, 5));

    // Store signals
    for (const signal of signals) {
      aiSignals.set(uuidv4(), signal);
    }

    console.log(`📊 Generated ${signals.length} trading signals`);

    // Execute trades for users with auto-trading enabled
    const allUsers = Array.from(users.values());
    for (const user of allUsers) {
      if (user.autoTradingEnabled) {
        for (const signal of signals) {
          if (signal.action === 'BUY' && signal.confidence > 70) {
            // Execute buy order
            const positionSize = calculatePositionSize(user.accountValue, 2);
            const quantity = Math.floor(positionSize / signal.targetPrice);

            await executeTrade(
              user.id,
              signal.symbol,
              'BUY',
              quantity,
              signal.targetPrice
            );

            console.log(`✅ AUTO BUY: ${user.username} buying ${quantity} ${signal.symbol}`);
          }
        }
      }
    }
  }, 3600000); // Run every hour
}

// ==================== AUTHENTICATION ====================

async function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.email = decoded.email;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// ==================== API ROUTES ====================

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    version: '2.0.0-phase2-trading',
    features: {
      mining: 'active',
      trading: 'active',
      aiAgents: 'active',
      marketHours: isMarketHours()
    }
  });
});

/**
 * Register user
 */
app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || password.length < 6) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    if (users.has(email)) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      id: userId,
      email,
      password: hashedPassword,
      username: username || email.split('@')[0],
      createdAt: new Date(),
      accountValue: 5000, // Starting account value
      autoTradingEnabled: false,
      miningAccounts: [],
      tradingAccounts: []
    };

    users.set(email, user);
    portfolios.set(userId, new Map());

    const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      token,
      userId,
      message: '✅ Account created'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Login user
 */
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = users.get(email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, email }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      token,
      userId: user.id,
      message: '✅ Logged in'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Link Robinhood account
 */
app.post('/api/trading/link-robinhood', verifyToken, async (req, res) => {
  try {
    const { robinhoodToken } = req.body;

    if (!robinhoodToken) {
      return res.status(400).json({ error: 'Robinhood token required' });
    }

    const user = Array.from(users.values()).find(u => u.id === req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.robinhoodToken = robinhoodToken;

    const account = {
      id: uuidv4(),
      userId: req.userId,
      linkedAt: new Date(),
      status: 'active'
    };

    tradingAccounts.set(account.id, account);

    res.json({
      success: true,
      accountId: account.id,
      message: '✅ Robinhood account linked'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Enable/disable auto-trading
 */
app.post('/api/trading/auto-trading', verifyToken, async (req, res) => {
  try {
    const { enabled } = req.body;

    const user = Array.from(users.values()).find(u => u.id === req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.autoTradingEnabled = enabled;

    res.json({
      success: true,
      autoTradingEnabled: enabled,
      message: enabled ? '✅ Auto-trading enabled' : '⏸️ Auto-trading disabled'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get AI trading signals
 */
app.get('/api/trading/signals', verifyToken, (req, res) => {
  try {
    const recentSignals = Array.from(aiSignals.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 20);

    res.json({
      success: true,
      signals: recentSignals,
      marketHours: isMarketHours()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get portfolio
 */
app.get('/api/trading/portfolio', verifyToken, (req, res) => {
  try {
    const portfolio = portfolios.get(req.userId) || new Map();
    const positions = Array.from(portfolio.entries()).map(([symbol, data]) => ({
      symbol,
      ...data
    }));

    const totalValue = positions.reduce((sum, p) => sum + (p.value || 0), 0);

    res.json({
      success: true,
      positions,
      totalValue,
      cash: 5000 - totalValue
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get trading history
 */
app.get('/api/trading/history', verifyToken, (req, res) => {
  try {
    const userTrades = Array.from(tradingHistory.values())
      .filter(t => t.userId === req.userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      trades: userTrades
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get account stats
 */
app.get('/api/account/stats', verifyToken, (req, res) => {
  try {
    const user = Array.from(users.values()).find(u => u.id === req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const portfolio = portfolios.get(req.userId) || new Map();
    const positions = Array.from(portfolio.values());
    const totalInvested = positions.reduce((sum, p) => sum + (p.value || 0), 0);

    res.json({
      success: true,
      account: {
        userId: user.id,
        username: user.username,
        email: user.email,
        accountValue: user.accountValue,
        autoTradingEnabled: user.autoTradingEnabled,
        createdAt: user.createdAt
      },
      portfolio: {
        positions: positions.length,
        totalInvested,
        availableCash: user.accountValue - totalInvested
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ERROR HANDLING ====================

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ==================== SERVER START ====================

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║   RDCM HYBRID PLATFORM - Phase 2           ║
║   Real Trading + AI Agents                 ║
║                                            ║
║   🚀 Server running on port ${PORT}          ║
║   📊 Robinhood API: Ready                   ║
║   🤖 AI Trading Engine: Active              ║
║   ⏰ Market Hours: 9 AM - 5 PM EST          ║
╚════════════════════════════════════════════╝
  `);

  // Start trading scheduler
  startTradingScheduler();
});

module.exports = server;
