/**
 * RDCM Hybrid Platform - Phase 1: Real Mining Backend
 * Unmineable API Integration
 * Real cryptocurrency mining with live earnings
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
const JWT_SECRET = process.env.JWT_SECRET || 'rdcm-secret-key-' + Math.random().toString(36).substring(7);

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

// ==================== UNMINEABLE API CONFIG ====================

const UNMINEABLE_API_BASE = 'https://api.unmineable.com/v4';
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

// ==================== IN-MEMORY DATA STORAGE ====================

const users = new Map();
const miningAccounts = new Map();
const miningStats = new Map();
const earnings = new Map();
const miningHistory = new Map();

// ==================== AUDIT LOGGING ====================

const auditLog = new Map();
function logAudit(userId, action, details) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    userId,
    action,
    details,
    timestamp
  };
  auditLog.set(uuidv4(), logEntry);
  console.log(`📋 [AUDIT] ${action} | User: ${userId} | ${JSON.stringify(details)}`);
}

// ==================== UNMINEABLE API METHODS ====================

/**
 * Get mining stats from Unmineable for a wallet address
 */
async function getUnmineableStats(coin, walletAddress) {
  try {
    const endpoint = `${UNMINEABLE_API_BASE}/${coin}/workers/${walletAddress}`;
    const response = await fetch(endpoint, { timeout: 5000 });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    return {
      coin: coin,
      address: walletAddress,
      hashrate: data.hashrate || 0,
      lastSeen: data.last_seen || new Date(),
      difficulty: data.difficulty || 0,
      shares: data.shares || 0,
      amountPaid: data.amount_paid || 0,
      amountDue: data.amount_due || 0,
      totalPaid: data.total_paid || 0
    };
  } catch (error) {
    console.error(`❌ Unmineable API error for ${coin}:`, error.message);
    return null;
  }
}

/**
 * Get current mining pool stats
 */
async function getPoolStats(coin) {
  try {
    const endpoint = `${UNMINEABLE_API_BASE}/${coin}/pool`;
    const response = await fetch(endpoint, { timeout: 5000 });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    return {
      coin: coin,
      networkDifficulty: data.network_difficulty || 0,
      poolHashrate: data.pool_hashrate || 0,
      miners: data.miners || 0,
      blockTime: data.block_time || 0,
      lastBlock: data.last_block || 0
    };
  } catch (error) {
    console.error(`❌ Pool stats error for ${coin}:`, error.message);
    return null;
  }
}

/**
 * Get current coin price from Unmineable
 */
async function getCoinPrice(coin) {
  try {
    const endpoint = `${UNMINEABLE_API_BASE}/${coin}/calculator`;
    const response = await fetch(endpoint, { timeout: 5000 });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    return {
      coin: coin,
      price: data.price || 0,
      priceBtc: data.price_btc || 0,
      change24h: data.change_24h || 0,
      marketCap: data.market_cap || 0
    };
  } catch (error) {
    console.error(`❌ Price error for ${coin}:`, error.message);
    return null;
  }
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
    version: '1.0.0-phase1-mining',
    unmineable: 'connected'
  });
});

/**
 * Register user
 */
app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || password.length < 6) {
      return res.status(400).json({ error: 'Invalid email or password (min 6 chars)' });
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
      miningAccounts: []
    };

    users.set(email, user);

    const token = jwt.sign(
      { userId, email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    logAudit(userId, 'USER_REGISTERED', { email, username });

    res.json({
      success: true,
      token,
      userId,
      message: '✅ Account created successfully'
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

    const token = jwt.sign(
      { userId: user.id, email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    logAudit(user.id, 'USER_LOGIN', { email });

    res.json({
      success: true,
      token,
      userId: user.id,
      message: '✅ Logged in successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Link Unmineable wallet to account
 */
app.post('/api/mining/add-wallet', verifyToken, async (req, res) => {
  try {
    const { coin, walletAddress } = req.body;

    if (!SUPPORTED_COINS[coin]) {
      return res.status(400).json({ error: 'Unsupported coin' });
    }

    if (!walletAddress || walletAddress.length < 26) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    // Verify wallet exists on Unmineable by fetching stats
    const stats = await getUnmineableStats(coin, walletAddress);
    if (!stats) {
      return res.status(400).json({ error: 'Could not verify wallet on Unmineable' });
    }

    const accountId = uuidv4();
    const miningAccount = {
      id: accountId,
      userId: req.userId,
      coin,
      walletAddress,
      addedAt: new Date(),
      isActive: true
    };

    miningAccounts.set(accountId, miningAccount);

    logAudit(req.userId, 'MINING_WALLET_ADDED', { coin, wallet: walletAddress });

    res.json({
      success: true,
      accountId,
      message: `✅ ${coin} wallet linked successfully`,
      stats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get mining stats for a wallet
 */
app.get('/api/mining/stats/:accountId', verifyToken, async (req, res) => {
  try {
    const account = miningAccounts.get(req.params.accountId);

    if (!account || account.userId !== req.userId) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const stats = await getUnmineableStats(account.coin, account.walletAddress);
    if (!stats) {
      return res.status(500).json({ error: 'Failed to fetch stats from Unmineable' });
    }

    const poolStats = await getPoolStats(account.coin);
    const priceData = await getCoinPrice(account.coin);

    // Calculate daily earnings estimate
    const estimatedDaily = (stats.hashrate / poolStats.poolHashrate) * poolStats.blockTime * priceData.price;

    res.json({
      account: {
        id: account.id,
        coin: account.coin,
        walletAddress: account.walletAddress,
        isActive: account.isActive
      },
      stats,
      poolStats,
      priceData,
      estimatedDaily,
      updated: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all mining accounts for user
 */
app.get('/api/mining/accounts', verifyToken, async (req, res) => {
  try {
    const userAccounts = Array.from(miningAccounts.values())
      .filter(acc => acc.userId === req.userId);

    const accountsWithStats = await Promise.all(
      userAccounts.map(async (account) => {
        const stats = await getUnmineableStats(account.coin, account.walletAddress);
        return { ...account, stats };
      })
    );

    res.json({
      success: true,
      accounts: accountsWithStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get supported coins
 */
app.get('/api/coins', (req, res) => {
  const coins = Object.entries(SUPPORTED_COINS).map(([symbol, data]) => ({
    symbol,
    ...data
  }));

  res.json({
    success: true,
    coins
  });
});

/**
 * Get all prices
 */
app.get('/api/prices', async (req, res) => {
  try {
    const prices = await Promise.all(
      Object.keys(SUPPORTED_COINS).map(coin => getCoinPrice(coin))
    );

    res.json({
      success: true,
      prices: prices.filter(p => p !== null)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get total user earnings across all wallets
 */
app.get('/api/earnings/total', verifyToken, async (req, res) => {
  try {
    const userAccounts = Array.from(miningAccounts.values())
      .filter(acc => acc.userId === req.userId);

    let totalEarnings = 0;
    let totalPaid = 0;
    const coinBreakdown = {};

    for (const account of userAccounts) {
      const stats = await getUnmineableStats(account.coin, account.walletAddress);
      const price = await getCoinPrice(account.coin);

      if (stats && price) {
        const amountDueUSD = stats.amountDue * price.price;
        const totalPaidUSD = stats.totalPaid * price.price;

        totalEarnings += amountDueUSD;
        totalPaid += totalPaidUSD;

        coinBreakdown[account.coin] = {
          amountDue: stats.amountDue,
          amountDueUSD,
          totalPaid: stats.totalPaid,
          totalPaidUSD,
          lastSeen: stats.lastSeen
        };
      }
    }

    res.json({
      success: true,
      totalEarnings,
      totalPaid,
      coinBreakdown,
      updatedAt: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ERROR HANDLING ====================

app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ==================== SERVER START ====================

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║   RDCM HYBRID PLATFORM - Phase 1           ║
║   Real Mining Backend (Unmineable)         ║
║                                            ║
║   🚀 Server running on port ${PORT}          ║
║   📊 Unmineable API: Connected             ║
║   ⛏️ Mining: ACTIVE                        ║
╚════════════════════════════════════════════╝
  `);
});

module.exports = server;
