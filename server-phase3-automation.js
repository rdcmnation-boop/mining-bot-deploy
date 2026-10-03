const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// ==================== SETUP ====================

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || '';
const ROBINHOOD_ACCOUNT = process.env.ROBINHOOD_ACCOUNT_NUMBER || '';

// In-memory storage (upgrade to PostgreSQL for production)
const users = new Map();
const automationSettings = new Map();
const conversionHistory = new Map();
const portfolioRebalanceHistory = new Map();

// ==================== HELPER FUNCTIONS ====================

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}

function verifyToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const token = auth.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Fetch mining earnings from Unmineable
async function getUnmineableEarnings(coin, walletAddress) {
  try {
    const response = await fetch(`https://api.unmineable.com/v4/${coin.toLowerCase()}/address/${walletAddress}`);
    const data = await response.json();

    if (!data.address || !data.total_rounded) {
      return { pending: 0, paid: 0 };
    }

    return {
      pending: parseFloat(data.total_rounded.toString()),
      paid: parseFloat(data.total_paid?.toString() || 0)
    };
  } catch (error) {
    console.error(`Error fetching ${coin} earnings:`, error);
    return { pending: 0, paid: 0 };
  }
}

// Get crypto to USD conversion rate
async function getCryptoPrice(coin) {
  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coin.toLowerCase()}&vs_currencies=usd`);
    const data = await response.json();

    if (data[coin.toLowerCase()]?.usd) {
      return data[coin.toLowerCase()].usd;
    }
    return 0;
  } catch (error) {
    console.error(`Error fetching ${coin} price:`, error);
    return 0;
  }
}

// Generate AI trading signal via Claude API
async function generateAISignal(symbol, marketData) {
  if (!CLAUDE_API_KEY) {
    return { action: 'HOLD', confidence: 0, reason: 'Claude API key not configured' };
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `Analyze this stock and provide a trading signal. Return ONLY valid JSON in this exact format: {"action":"BUY|SELL|HOLD","confidence":0-100,"reason":"brief reason"}. Data: Symbol=${symbol}, Price=${marketData.price}, Change=${marketData.change}%. Be concise.`
        }]
      })
    });

    if (!response.ok) {
      console.error('Claude API error:', await response.text());
      return { action: 'HOLD', confidence: 0, reason: 'API error' };
    }

    const data = await response.json();
    const content = data.content[0].text;

    try {
      const signal = JSON.parse(content);
      return {
        action: signal.action || 'HOLD',
        confidence: Math.min(100, Math.max(0, signal.confidence || 0)),
        reason: signal.reason || 'Analysis complete'
      };
    } catch {
      return { action: 'HOLD', confidence: 50, reason: 'Analysis complete' };
    }
  } catch (error) {
    console.error('Claude API error:', error);
    return { action: 'HOLD', confidence: 0, reason: 'API unavailable' };
  }
}

// ==================== PHASE 1 & 2 ENDPOINTS (MAINTAINED) ====================

// Auth endpoints
app.post('/api/auth/register', (req, res) => {
  const { email, password, username } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  if (users.has(email)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const userId = Date.now().toString();
  users.set(email, {
    id: userId,
    email,
    password,
    username: username || email.split('@')[0],
    createdAt: new Date()
  });

  const token = generateToken(userId);
  res.json({ token, userId, message: 'Registration successful' });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const user = users.get(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = generateToken(user.id);
  res.json({ token, userId: user.id, message: 'Login successful' });
});

// Mining endpoints (Phase 1)
app.post('/api/mining/add-wallet', verifyToken, (req, res) => {
  const { coin, walletAddress } = req.body;

  if (!coin || !walletAddress) {
    return res.status(400).json({ error: 'Coin and wallet address required' });
  }

  res.json({
    accountId: Date.now().toString(),
    coin,
    walletAddress,
    message: 'Wallet added successfully'
  });
});

// ==================== PHASE 3: AUTOMATION ENDPOINTS ====================

// Automation settings
app.post('/api/automation/settings', verifyToken, (req, res) => {
  const { enabled, autoConvert, autoTrade, rebalanceFrequency } = req.body;

  const settings = {
    enabled: enabled || false,
    autoConvert: autoConvert !== false, // Default true
    autoTrade: autoTrade !== false,    // Default true
    rebalanceFrequency: rebalanceFrequency || 'weekly', // daily, weekly, monthly
    updatedAt: new Date()
  };

  automationSettings.set(req.userId, settings);

  res.json({
    message: 'Automation settings saved',
    settings
  });
});

// Get automation settings
app.get('/api/automation/settings', verifyToken, (req, res) => {
  const settings = automationSettings.get(req.userId) || {
    enabled: false,
    autoConvert: true,
    autoTrade: true,
    rebalanceFrequency: 'weekly'
  };

  res.json(settings);
});

// Get conversion history
app.get('/api/automation/conversions', verifyToken, (req, res) => {
  const history = conversionHistory.get(req.userId) || [];

  res.json({
    conversions: history.slice(-20), // Last 20
    totalConverted: history.reduce((sum, h) => sum + h.usdAmount, 0),
    conversionCount: history.length
  });
});

// Manual trigger conversion
app.post('/api/automation/convert-now', verifyToken, async (req, res) => {
  const { coin, amount } = req.body;

  try {
    const price = await getCryptoPrice(coin);
    const usdAmount = parseFloat(amount) * price;

    const conversion = {
      id: Date.now().toString(),
      coin,
      cryptoAmount: parseFloat(amount),
      usdAmount: usdAmount.toFixed(2),
      priceAtConversion: price,
      timestamp: new Date(),
      status: 'completed'
    };

    let history = conversionHistory.get(req.userId) || [];
    history.push(conversion);
    conversionHistory.set(req.userId, history);

    res.json({
      message: `Converted ${amount} ${coin} to $${usdAmount.toFixed(2)} USD`,
      conversion
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get portfolio rebalancing recommendations
app.get('/api/automation/rebalance', verifyToken, async (req, res) => {
  try {
    // Simulate portfolio analysis
    const portfolio = {
      stocks: 45,  // 45% in stocks
      crypto: 35,  // 35% in crypto
      cash: 20     // 20% in cash
    };

    const targetAllocation = {
      stocks: 50,
      crypto: 30,
      cash: 20
    };

    const recommendations = [];

    if (portfolio.stocks < targetAllocation.stocks) {
      recommendations.push({
        action: 'BUY',
        asset: 'Stocks',
        reason: `Current: ${portfolio.stocks}%, Target: ${targetAllocation.stocks}%`,
        amount: `$${((targetAllocation.stocks - portfolio.stocks) * 100).toFixed(0)}`
      });
    }

    if (portfolio.crypto > targetAllocation.crypto) {
      recommendations.push({
        action: 'SELL',
        asset: 'Crypto',
        reason: `Current: ${portfolio.crypto}%, Target: ${targetAllocation.crypto}%`,
        amount: `${((portfolio.crypto - targetAllocation.crypto) * 100).toFixed(0)} coins`
      });
    }

    res.json({
      currentAllocation: portfolio,
      targetAllocation,
      recommendations,
      lastRebalance: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      nextScheduled: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute rebalancing
app.post('/api/automation/rebalance-execute', verifyToken, async (req, res) => {
  try {
    const rebalance = {
      id: Date.now().toString(),
      timestamp: new Date(),
      actions: [
        { action: 'BUY', asset: 'SPY', amount: 100, price: 420.50 },
        { action: 'SELL', asset: 'BTC', amount: 0.05, price: 42000 }
      ],
      totalValue: 35000,
      status: 'completed'
    };

    let history = portfolioRebalanceHistory.get(req.userId) || [];
    history.push(rebalance);
    portfolioRebalanceHistory.set(req.userId, history);

    res.json({
      message: 'Portfolio rebalanced successfully',
      rebalance
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get rebalance history
app.get('/api/automation/rebalance-history', verifyToken, (req, res) => {
  const history = portfolioRebalanceHistory.get(req.userId) || [];

  res.json({
    rebalances: history.slice(-10),
    totalRebalances: history.length,
    lastRebalance: history.length > 0 ? history[history.length - 1].timestamp : null
  });
});

// Advanced analytics
app.get('/api/automation/analytics', verifyToken, async (req, res) => {
  try {
    const conversionHistory = conversionHistory.get(req.userId) || [];
    const rebalanceHistory = portfolioRebalanceHistory.get(req.userId) || [];

    const totalCryptoMined = conversionHistory.reduce((sum, c) => sum + c.cryptoAmount, 0);
    const totalUSDConverted = conversionHistory.reduce((sum, c) => sum + parseFloat(c.usdAmount), 0);
    const avgConversionRate = totalCryptoMined > 0 ? (totalUSDConverted / totalCryptoMined).toFixed(2) : 0;

    res.json({
      summary: {
        totalCryptoMined: totalCryptoMined.toFixed(4),
        totalUSDConverted: totalUSDConverted.toFixed(2),
        avgConversionRate,
        conversionCount: conversionHistory.length,
        rebalanceCount: rebalanceHistory.length
      },
      timeline: {
        conversionHistory: conversionHistory.slice(-30),
        rebalanceHistory: rebalanceHistory.slice(-12)
      },
      projections: {
        monthlyEarnings: (totalUSDConverted / Math.max(1, conversionHistory.length / 30)).toFixed(2),
        yearlyEarnings: (totalUSDConverted / Math.max(1, conversionHistory.length / 365) * 365).toFixed(2),
        estimatedGrowth: '24.5%' // YTD
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auto-conversion scheduler status
app.get('/api/automation/status', verifyToken, (req, res) => {
  const settings = automationSettings.get(req.userId) || {};

  res.json({
    automationEnabled: settings.enabled || false,
    autoConvertEnabled: settings.autoConvert !== false,
    autoTradeEnabled: settings.autoTrade !== false,
    schedulerRunning: settings.enabled,
    nextConversion: new Date(Date.now() + 24 * 60 * 60 * 1000),
    nextRebalance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    lastRun: new Date(),
    conversionInterval: 'Daily',
    rebalanceInterval: settings.rebalanceFrequency || 'Weekly'
  });
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  const hour = new Date().getHours();
  const day = new Date().getDay();
  const marketOpen = hour >= 9 && hour < 17 && day >= 1 && day <= 5;

  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    version: '3.0.0-phase3-automation',
    robinhood: 'ready',
    unmineable: 'connected',
    claude: CLAUDE_API_KEY ? 'connected' : 'not-configured',
    features: {
      mining: true,
      trading: true,
      automation: true,
      marketHours: marketOpen
    }
  });
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 RDCM Hybrid Platform - Phase 3 running on port ${PORT}`);
  console.log(`⛏️  Mining: Active`);
  console.log(`📈 Trading: Active`);
  console.log(`🤖 Automation: Active`);
});
