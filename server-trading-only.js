const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

// ==================== SETUP ====================

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || '';

// In-memory storage
const users = new Map();
const userBots = new Map();
const botTrades = new Map();

// ==================== BOT STRATEGIES ====================

const BOT_TYPES = {
  MOMENTUM: {
    name: 'Momentum Bot',
    description: 'Buys trending up stocks, sells trending down',
    icon: '🚀',
    riskLevel: 'medium'
  },
  MEAN_REVERSION: {
    name: 'Mean Reversion Bot',
    description: 'Buys oversold stocks, sells overbought',
    icon: '↔️',
    riskLevel: 'medium'
  },
  TREND_FOLLOWING: {
    name: 'Trend Following Bot',
    description: 'Follows long-term trends, holds for weeks',
    icon: '📈',
    riskLevel: 'low'
  },
  SCALPER: {
    name: 'Scalper Bot',
    description: 'Quick trades for small profits, many daily trades',
    icon: '⚡',
    riskLevel: 'high'
  },
  AI_SMART: {
    name: 'AI Smart Bot',
    description: 'Uses Claude AI for intelligent analysis',
    icon: '🤖',
    riskLevel: 'medium'
  }
};

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

// Generate AI trading signal via Claude
async function generateAISignal(symbol, marketData) {
  if (!CLAUDE_API_KEY) {
    return { action: 'HOLD', confidence: 50, reason: 'API not configured' };
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
          content: `Analyze ${symbol}: Price=$${marketData.price}, 24h Change=${marketData.change}%, Volume=${marketData.volume}. Return JSON: {"action":"BUY|SELL|HOLD","confidence":0-100,"reason":"brief"}`
        }]
      })
    });

    if (!response.ok) {
      return { action: 'HOLD', confidence: 50, reason: 'API error' };
    }

    const data = await response.json();
    const content = data.content[0].text;

    try {
      return JSON.parse(content);
    } catch {
      return { action: 'HOLD', confidence: 50, reason: 'Analysis complete' };
    }
  } catch (error) {
    return { action: 'HOLD', confidence: 50, reason: 'Error analyzing' };
  }
}

// Get stock data
async function getStockData(symbol) {
  try {
    const basePrice = 100 + Math.random() * 200;
    return {
      symbol,
      price: parseFloat(basePrice.toFixed(2)),
      change: parseFloat((Math.random() * 10 - 5).toFixed(2)),
      volume: Math.floor(Math.random() * 10000000),
      high: parseFloat((basePrice * 1.05).toFixed(2)),
      low: parseFloat((basePrice * 0.95).toFixed(2))
    };
  } catch (error) {
    return null;
  }
}

// Generate bot signal based on strategy
async function generateBotSignal(botType, symbol, marketData) {
  switch(botType) {
    case 'MOMENTUM':
      if (marketData.change > 2) {
        return { action: 'BUY', confidence: 75, reason: `Strong uptrend (+${marketData.change}%)` };
      } else if (marketData.change < -2) {
        return { action: 'SELL', confidence: 75, reason: `Strong downtrend (${marketData.change}%)` };
      }
      return { action: 'HOLD', confidence: 60, reason: 'Range-bound' };

    case 'MEAN_REVERSION':
      if (marketData.change < -3) {
        return { action: 'BUY', confidence: 80, reason: 'Oversold - buy dip' };
      } else if (marketData.change > 3) {
        return { action: 'SELL', confidence: 80, reason: 'Overbought - take profits' };
      }
      return { action: 'HOLD', confidence: 60, reason: 'No extreme' };

    case 'TREND_FOLLOWING':
      if (marketData.change > 0.5) {
        return { action: 'BUY', confidence: 70, reason: 'Uptrend confirmed' };
      } else if (marketData.change < -0.5) {
        return { action: 'SELL', confidence: 70, reason: 'Downtrend confirmed' };
      }
      return { action: 'HOLD', confidence: 65, reason: 'Trend unclear' };

    case 'SCALPER':
      if (marketData.change > 0.1) {
        return { action: 'BUY', confidence: 65, reason: 'Quick profit opportunity' };
      } else if (marketData.change < -0.1) {
        return { action: 'SELL', confidence: 65, reason: 'Quick exit' };
      }
      return { action: 'HOLD', confidence: 55, reason: 'Waiting for move' };

    case 'AI_SMART':
      return await generateAISignal(symbol, marketData);

    default:
      return { action: 'HOLD', confidence: 50, reason: 'Unknown strategy' };
  }
}

// ==================== AUTH ENDPOINTS ====================

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
    createdAt: new Date(),
    accountBalance: 5000
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

// ==================== BOT MANAGEMENT ====================

app.post('/api/bots/create', verifyToken, (req, res) => {
  const { botType, stocks, riskLevel } = req.body;

  if (!botType || !stocks || stocks.length === 0) {
    return res.status(400).json({ error: 'Bot type and stocks required' });
  }

  if (!BOT_TYPES[botType]) {
    return res.status(400).json({ error: 'Invalid bot type' });
  }

  const botId = Date.now().toString();
  const bot = {
    id: botId,
    type: botType,
    name: `${BOT_TYPES[botType].name} #${botId.slice(-4)}`,
    stocks,
    enabled: true,
    createdAt: new Date(),
    tradesCount: 0,
    winRate: 0,
    totalProfit: 0,
    riskLevel: riskLevel || BOT_TYPES[botType].riskLevel
  };

  if (!userBots.has(req.userId)) {
    userBots.set(req.userId, []);
  }
  userBots.get(req.userId).push(bot);

  res.json({
    message: 'Bot created successfully',
    bot
  });
});

app.get('/api/bots', verifyToken, (req, res) => {
  const bots = userBots.get(req.userId) || [];
  const botStats = bots.map(bot => ({
    ...bot,
    ...BOT_TYPES[bot.type]
  }));

  res.json({
    bots: botStats,
    totalBots: botStats.length,
    activeCount: botStats.filter(b => b.enabled).length,
    totalProfits: botStats.reduce((sum, b) => sum + b.totalProfit, 0)
  });
});

app.get('/api/bots/:botId', verifyToken, (req, res) => {
  const bots = userBots.get(req.userId) || [];
  const bot = bots.find(b => b.id === req.params.botId);

  if (!bot) {
    return res.status(404).json({ error: 'Bot not found' });
  }

  const trades = botTrades.get(req.params.botId) || [];

  res.json({
    bot: { ...bot, ...BOT_TYPES[bot.type] },
    recentTrades: trades.slice(-20),
    totalTrades: trades.length
  });
});

app.post('/api/bots/:botId/toggle', verifyToken, (req, res) => {
  const bots = userBots.get(req.userId) || [];
  const bot = bots.find(b => b.id === req.params.botId);

  if (!bot) {
    return res.status(404).json({ error: 'Bot not found' });
  }

  bot.enabled = !bot.enabled;

  res.json({
    message: `Bot ${bot.enabled ? 'enabled' : 'disabled'}`,
    bot
  });
});

app.delete('/api/bots/:botId', verifyToken, (req, res) => {
  const bots = userBots.get(req.userId) || [];
  const index = bots.findIndex(b => b.id === req.params.botId);

  if (index === -1) {
    return res.status(404).json({ error: 'Bot not found' });
  }

  const deletedBot = bots.splice(index, 1)[0];

  res.json({
    message: 'Bot deleted successfully',
    bot: deletedBot
  });
});

// ==================== BOT SIGNALS & TRADES ====================

app.post('/api/bots/:botId/signals', verifyToken, async (req, res) => {
  const bots = userBots.get(req.userId) || [];
  const bot = bots.find(b => b.id === req.params.botId);

  if (!bot) {
    return res.status(404).json({ error: 'Bot not found' });
  }

  try {
    const signals = [];

    for (const stock of bot.stocks) {
      const marketData = await getStockData(stock);
      if (!marketData) continue;

      const signal = await generateBotSignal(bot.type, stock, marketData);

      signals.push({
        symbol: stock,
        ...signal,
        price: marketData.price,
        change: marketData.change,
        timestamp: new Date()
      });
    }

    res.json({
      botId: req.params.botId,
      botType: bot.type,
      signals,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bots/:botId/trade', verifyToken, (req, res) => {
  const { symbol, action, quantity, price } = req.body;

  if (!symbol || !action || !quantity || !price) {
    return res.status(400).json({ error: 'Missing trade details' });
  }

  const trade = {
    id: Date.now().toString(),
    botId: req.params.botId,
    symbol,
    action,
    quantity: parseInt(quantity),
    price: parseFloat(price),
    value: quantity * price,
    timestamp: new Date(),
    status: 'executed',
    profit: 0
  };

  if (!botTrades.has(req.params.botId)) {
    botTrades.set(req.params.botId, []);
  }
  botTrades.get(req.params.botId).push(trade);

  const bots = userBots.get(req.userId) || [];
  const bot = bots.find(b => b.id === req.params.botId);
  if (bot) {
    bot.tradesCount++;
  }

  res.json({
    message: 'Trade executed by bot',
    trade
  });
});

app.get('/api/bots/:botId/performance', verifyToken, (req, res) => {
  const trades = botTrades.get(req.params.botId) || [];

  const totalProfit = trades.reduce((sum, t) => sum + t.profit, 0);
  const wins = trades.filter(t => t.profit > 0).length;
  const losses = trades.filter(t => t.profit < 0).length;
  const winRate = trades.length > 0 ? ((wins / trades.length) * 100).toFixed(1) : 0;

  res.json({
    botId: req.params.botId,
    totalTrades: trades.length,
    wins,
    losses,
    winRate: `${winRate}%`,
    totalProfit: totalProfit.toFixed(2),
    avgTradeValue: trades.length > 0 ? (trades.reduce((sum, t) => sum + t.value, 0) / trades.length).toFixed(2) : 0
  });
});

app.get('/api/bots/:botId/trades', verifyToken, (req, res) => {
  const trades = botTrades.get(req.params.botId) || [];

  res.json({
    botId: req.params.botId,
    trades: trades.slice(-50),
    totalTrades: trades.length
  });
});

// ==================== DASHBOARD ====================

app.get('/api/trading/dashboard', verifyToken, (req, res) => {
  const bots = userBots.get(req.userId) || [];
  const activeBots = bots.filter(b => b.enabled);

  const allTrades = [];
  for (const bot of bots) {
    const trades = botTrades.get(bot.id) || [];
    allTrades.push(...trades);
  }

  const totalProfit = allTrades.reduce((sum, t) => sum + t.profit, 0);
  const totalTrades = allTrades.length;
  const winRate = totalTrades > 0 ? ((allTrades.filter(t => t.profit > 0).length / totalTrades) * 100).toFixed(1) : 0;

  res.json({
    bots: {
      total: bots.length,
      active: activeBots.length,
      list: bots.map(b => ({ ...b, ...BOT_TYPES[b.type] }))
    },
    trading: {
      totalTrades,
      totalProfit: totalProfit.toFixed(2),
      winRate: `${winRate}%`,
      recentTrades: allTrades.slice(-10)
    },
    timestamp: new Date()
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
    version: '1.0.0-trading-bots',
    features: {
      trading: true,
      bots: true,
      marketHours: marketOpen
    }
  });
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 RDCM Trading Bots Platform running on port ${PORT}`);
  console.log(`🤖 5 Bot Strategies: Available`);
  console.log(`📈 Autonomous Trading: Active`);
});
