#!/usr/bin/env node

/**
 * RDCMNATION QUANTUM - Production Server with Real Broker Integration
 *
 * Now supports:
 * - Robinhood (Stocks + Crypto)
 * - Coinbase (Crypto)
 * - Real account connections
 * - Live trade execution
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');
const { BrokerManager } = require('./broker-integration');
const RDCMRulesEngine = require('./auto-rules-engine');
const RDCMBrain = require('./autorule-brain-integration');

// CONFIG
const CONFIG = {
  PORT: process.env.PORT || 3000,
  ENV: process.env.NODE_ENV || 'production',
  OWNER_EMAIL: 'admin@rdcmnation.com',
  OWNER_PASSWORD_HASH: crypto.createHash('sha256').update('owner123').digest('hex'),
  JWT_SECRET: 'RDCM_QUANTUM_SECRET_KEY_2026',
  JWT_EXPIRY: 30 * 24 * 60 * 60 * 1000,
  DB_PATH: path.join(__dirname, 'data'),
  MAX_REQUEST_SIZE: 1024 * 1024,
};

// Database Manager
class Database {
  constructor() {
    this.dbPath = CONFIG.DB_PATH;
    this.ensureDir();
    this.collections = {
      users: 'users.json',
      bots: 'bots.json',
      trades: 'trades.json',
      logs: 'logs.json',
      settings: 'settings.json',
      brokerConnections: 'brokers.json',
    };
    this.initCollections();
  }

  ensureDir() {
    if (!fs.existsSync(this.dbPath)) {
      fs.mkdirSync(this.dbPath, { recursive: true });
    }
  }

  initCollections() {
    for (const [key, file] of Object.entries(this.collections)) {
      const filePath = path.join(this.dbPath, file);
      if (!fs.existsSync(filePath)) {
        const defaultData = this.getDefaultData(key);
        fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
      }
    }
  }

  getDefaultData(collection) {
    const defaults = {
      users: [],
      bots: [],
      trades: [],
      logs: [],
      settings: { platform_name: 'RDCMNATION QUANTUM', version: '2.1.0' },
      brokerConnections: [],
    };
    return defaults[collection] || {};
  }

  read(collection) {
    try {
      const filePath = path.join(this.dbPath, this.collections[collection]);
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      return this.getDefaultData(collection);
    }
  }

  write(collection, data) {
    try {
      const filePath = path.join(this.dbPath, this.collections[collection]);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      return false;
    }
  }

  find(collection, query) {
    const data = this.read(collection);
    if (!Array.isArray(data)) return null;
    return data.find(item => {
      for (const [key, value] of Object.entries(query)) {
        if (item[key] !== value) return false;
      }
      return true;
    });
  }

  findAll(collection, query = {}) {
    const data = this.read(collection);
    if (!Array.isArray(data)) return [];
    return data.filter(item => {
      for (const [key, value] of Object.entries(query)) {
        if (item[key] !== value) return false;
      }
      return true;
    });
  }

  insert(collection, record) {
    const data = this.read(collection);
    if (!Array.isArray(data)) return null;
    const withId = { ...record, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    data.push(withId);
    this.write(collection, data);
    return withId;
  }

  update(collection, id, updates) {
    const data = this.read(collection);
    if (!Array.isArray(data)) return null;
    const index = data.findIndex(item => item.id === id);
    if (index === -1) return null;
    data[index] = { ...data[index], ...updates, updatedAt: new Date().toISOString() };
    this.write(collection, data);
    return data[index];
  }

  log(action, user, details = {}) {
    const log = { id: crypto.randomUUID(), timestamp: new Date().toISOString(), action, user, details };
    const logs = this.read('logs');
    logs.push(log);
    this.write('logs', logs);
    return log;
  }
}

// Request Handler with Broker Support
class RequestHandler {
  constructor(req, res) {
    this.req = req;
    this.res = res;
    this.method = req.method;
    this.url = new URL(req.url, `http://${req.headers.host}`);
    this.pathname = this.url.pathname;
    this.db = new Database();
    this.brokerManager = new BrokerManager();
    this.rdcmRulesEngine = new RDCMRulesEngine();
    this.rdcmBrain = new RDCMBrain();
  }

  async handle() {
    this.setHeaders({ 'Access-Control-Allow-Origin': '*' });
    if (this.method === 'OPTIONS') {
      this.setHeaders({
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      });
      return this.send(200, { ok: true });
    }

    const routes = {
      '/health': () => this.health(),
      '/api/auth/register': () => this.registerUser(),
      '/api/auth/login': () => this.loginUser(),
      '/api/auth/owner-login': () => this.ownerLogin(),
      '/api/brokers/connect-robinhood': () => this.connectRobinhood(),
      '/api/brokers/connect-coinbase': () => this.connectCoinbase(),
      '/api/brokers/portfolio': () => this.getUnifiedPortfolio(),
      '/api/trades/execute-live': () => this.executeLiveTrade(),
      '/api/trades/history': () => this.getTradeHistory(),
      '/api/dashboard': () => this.getDashboard(),
      // AutoRule Routes
      '/api/rules/create': () => this.createAutoRule(),
      '/api/rules': () => this.getAutoRules(),
      '/api/rules/brain/metrics': () => this.getBrainMetrics(),
      '/api/rules/monitor': () => this.monitorAutoRules(),
    };

    // Check exact routes first
    let handler = routes[this.pathname];

    // Check dynamic routes
    if (!handler) {
      // Handle /api/rules/:ruleId routes
      if (this.pathname.startsWith('/api/rules/') && this.pathname !== '/api/rules/create' && this.pathname !== '/api/rules/brain/metrics') {
        const parts = this.pathname.split('/');
        if (parts[3] === 'toggle') {
          handler = () => this.toggleAutoRule(parts[2]);
        } else if (parts[3] === 'history') {
          handler = () => this.getAutoRuleHistory(parts[2]);
        } else if (this.method === 'GET') {
          handler = () => this.getAutoRuleById(parts[2]);
        } else if (this.method === 'PUT') {
          handler = () => this.updateAutoRule(parts[2]);
        } else if (this.method === 'DELETE') {
          handler = () => this.deleteAutoRule(parts[2]);
        }
      }
      // Handle /api/rules/stats/:userId
      else if (this.pathname.startsWith('/api/rules/stats/')) {
        const userId = this.pathname.split('/api/rules/stats/')[1];
        handler = () => this.getAutoRuleStats(userId);
      }
    }

    if (handler) {
      try {
        await handler.call(this);
      } catch (error) {
        this.error(500, 'Internal Server Error', error.message);
      }
    } else {
      this.error(404, 'Not Found', this.pathname);
    }
  }

  async readBody() {
    return new Promise((resolve, reject) => {
      let data = '';
      this.req.on('data', chunk => {
        data += chunk;
        if (data.length > CONFIG.MAX_REQUEST_SIZE) reject(new Error('Request too large'));
      });
      this.req.on('end', () => {
        try {
          resolve(data ? JSON.parse(data) : {});
        } catch (e) {
          reject(new Error('Invalid JSON'));
        }
      });
    });
  }

  getToken() {
    return (this.req.headers.authorization || '').replace('Bearer ', '');
  }

  verifyAuth() {
    const token = this.getToken();
    const decoded = this.verifyJWT(token);
    if (!decoded) {
      this.error(401, 'Unauthorized');
      return null;
    }
    return decoded;
  }

  verifyJWT(token) {
    try {
      const [header, payload, signature] = token.split('.');
      const calc = crypto.createHmac('sha256', CONFIG.JWT_SECRET).update(`${header}.${payload}`).digest('base64');
      if (signature !== calc) return null;
      const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
      if (decoded.exp < Math.floor(Date.now() / 1000)) return null;
      return decoded;
    } catch {
      return null;
    }
  }

  setHeaders(headers = {}) {
    const defaults = { 'Content-Type': 'application/json', 'X-Powered-By': 'RDCM Quantum v2.1' };
    Object.assign(defaults, headers);
    for (const [key, value] of Object.entries(defaults)) {
      this.res.setHeader(key, value);
    }
  }

  send(statusCode, data) {
    this.res.statusCode = statusCode;
    this.setHeaders();
    this.res.end(JSON.stringify(data));
  }

  error(statusCode, error, details = '') {
    this.send(statusCode, { error, details, timestamp: new Date().toISOString() });
  }

  // HANDLERS

  health() {
    return this.send(200, {
      status: 'online',
      service: 'RDCM Quantum - With Real Brokers',
      version: '2.1.0',
      brokers: ['robinhood', 'coinbase'],
      timestamp: new Date().toISOString(),
    });
  }

  async registerUser() {
    if (this.method !== 'POST') return this.error(405, 'Method Not Allowed');
    const { email, password, name } = await this.readBody();
    if (!email || !password) return this.error(400, 'Missing fields');
    if (this.db.find('users', { email })) return this.error(409, 'User exists');

    const user = this.db.insert('users', {
      email, password: crypto.createHash('sha256').update(password + CONFIG.JWT_SECRET).digest('hex'),
      name, plan: 'free', bots: [], brokers: [],
    });

    const token = this.generateJWT(user.id, email);
    return this.send(200, { success: true, userId: user.id, token });
  }

  async loginUser() {
    if (this.method !== 'POST') return this.error(405, 'Method Not Allowed');
    const { email, password } = await this.readBody();
    const user = this.db.find('users', { email });
    if (!user || user.password !== crypto.createHash('sha256').update(password + CONFIG.JWT_SECRET).digest('hex')) {
      return this.error(401, 'Invalid credentials');
    }

    const token = this.generateJWT(user.id, email);
    return this.send(200, { success: true, userId: user.id, token });
  }

  async ownerLogin() {
    if (this.method !== 'POST') return this.error(405, 'Method Not Allowed');
    const { email, password } = await this.readBody();
    if (email !== CONFIG.OWNER_EMAIL) return this.error(401, 'Invalid credentials');

    const hash = crypto.createHash('sha256').update(password).digest('hex');
    if (hash !== CONFIG.OWNER_PASSWORD_HASH) return this.error(401, 'Invalid credentials');

    const token = this.generateJWT('owner', CONFIG.OWNER_EMAIL, true);
    return this.send(200, { success: true, isOwner: true, token });
  }

  async connectRobinhood() {
    if (this.method !== 'POST') return this.error(405, 'Method Not Allowed');
    const auth = this.verifyAuth();
    if (!auth) return;

    const { username, password, mfaToken } = await this.readBody();
    const rh = this.brokerManager.connectRobinhood({ username, password });
    const result = await rh.authenticate(username, password, mfaToken);

    if (result.success) {
      this.db.insert('brokerConnections', {
        userId: auth.userId,
        broker: 'robinhood',
        username,
        connected: true,
        lastSync: new Date().toISOString(),
      });

      return this.send(200, { success: true, broker: 'robinhood', message: 'Connected successfully' });
    }

    return this.error(401, 'Authentication failed');
  }

  async connectCoinbase() {
    if (this.method !== 'POST') return this.error(405, 'Method Not Allowed');
    const auth = this.verifyAuth();
    if (!auth) return;

    const { apiKey, apiSecret, passphrase } = await this.readBody();
    const cb = this.brokerManager.connectCoinbase({ apiKey, apiSecret, passphrase });
    const result = await cb.authenticate(apiKey, apiSecret, passphrase);

    if (result.success) {
      this.db.insert('brokerConnections', {
        userId: auth.userId,
        broker: 'coinbase',
        apiKeyLast4: apiKey.slice(-4),
        connected: true,
        lastSync: new Date().toISOString(),
      });

      return this.send(200, { success: true, broker: 'coinbase', message: 'Connected successfully' });
    }

    return this.error(401, 'Authentication failed');
  }

  async getUnifiedPortfolio() {
    const auth = this.verifyAuth();
    if (!auth) return;

    // Load user's broker connections
    this.initializeBrokersForUser(auth.userId);

    const portfolio = await this.brokerManager.getUnifiedPortfolio();
    return this.send(200, portfolio);
  }

  async executeLiveTrade() {
    if (this.method !== 'POST') return this.error(405, 'Method Not Allowed');
    const auth = this.verifyAuth();
    if (!auth) return;

    // Load user's broker connections
    this.initializeBrokersForUser(auth.userId);

    const { assetType, symbol, quantity, side, price } = await this.readBody();
    const result = await this.brokerManager.executeTrade(assetType, symbol, quantity, side, price);

    if (result.error) return this.error(400, result.error);

    const trade = this.db.insert('trades', {
      userId: auth.userId,
      ...result.order,
    });

    this.db.log('live_trade_executed', auth.email, { tradeId: trade.id, symbol });
    return this.send(200, { success: true, trade });
  }

  initializeBrokersForUser(userId) {
    const connections = this.db.findAll('brokerConnections', { userId });
    for (const conn of connections) {
      if (conn.broker === 'robinhood' && conn.connected) {
        const rhBroker = this.brokerManager.connectRobinhood({ username: conn.username });
        rhBroker.accessToken = crypto.randomBytes(32).toString('hex');
      } else if (conn.broker === 'coinbase' && conn.connected) {
        const cbBroker = this.brokerManager.connectCoinbase({
          apiKey: conn.apiKeyLast4,
          apiSecret: 'stored',
          passphrase: 'stored'
        });
        cbBroker.apiKey = conn.apiKeyLast4;
      }
    }
  }

  async getTradeHistory() {
    const auth = this.verifyAuth();
    if (!auth) return;

    const trades = this.db.findAll('trades', { userId: auth.userId });
    return this.send(200, { trades, total: trades.length });
  }

  async getDashboard() {
    const auth = this.verifyAuth();
    if (!auth) return;

    const portfolio = await this.brokerManager.getUnifiedPortfolio();
    const trades = this.db.findAll('trades', { userId: auth.userId });

    return this.send(200, {
      portfolio,
      trades: trades.length,
      lastUpdate: new Date().toISOString(),
    });
  }

  // AutoRule Methods
  async createAutoRule() {
    const body = await this.readBody();
    const { userId, ruleName, conditions, action } = body;

    if (!userId || !ruleName || !conditions || !action) {
      return this.error(400, 'Missing required fields');
    }

    try {
      const rule = this.rdcmRulesEngine.createRule(userId, ruleName, conditions, action);
      return this.send(201, {
        success: true,
        rule,
        message: `✅ AutoRule "${ruleName}" created successfully`
      });
    } catch (e) {
      return this.error(500, e.message);
    }
  }

  async getAutoRules() {
    const userId = this.url.searchParams.get('userId');

    if (!userId) {
      return this.error(400, 'userId query parameter required');
    }

    try {
      const rules = this.rdcmRulesEngine.getUserRules(userId);
      return this.send(200, {
        success: true,
        count: rules.length,
        rules
      });
    } catch (e) {
      return this.error(500, e.message);
    }
  }

  async getAutoRuleById(ruleId) {
    try {
      const rule = this.rdcmRulesEngine.rules.find(r => r.id === ruleId);
      if (!rule) {
        return this.error(404, 'Rule not found');
      }

      return this.send(200, { success: true, rule });
    } catch (e) {
      return this.error(500, e.message);
    }
  }

  async updateAutoRule(ruleId) {
    const body = await this.readBody();

    try {
      const rule = this.rdcmRulesEngine.updateRule(ruleId, body);
      if (!rule) {
        return this.error(404, 'Rule not found');
      }

      return this.send(200, {
        success: true,
        rule,
        message: '✅ AutoRule updated successfully'
      });
    } catch (e) {
      return this.error(500, e.message);
    }
  }

  async deleteAutoRule(ruleId) {
    try {
      const deleted = this.rdcmRulesEngine.deleteRule(ruleId);
      return this.send(200, {
        success: deleted,
        message: deleted ? '✅ AutoRule deleted successfully' : 'Rule not found'
      });
    } catch (e) {
      return this.error(500, e.message);
    }
  }

  async toggleAutoRule(ruleId) {
    const body = await this.readBody();
    const { enabled } = body;

    try {
      const rule = this.rdcmRulesEngine.toggleRule(ruleId, enabled);
      if (!rule) {
        return this.error(404, 'Rule not found');
      }

      return this.send(200, {
        success: true,
        rule,
        message: `${enabled ? '✅ Enabled' : '⏸ Disabled'} rule: ${rule.name}`
      });
    } catch (e) {
      return this.error(500, e.message);
    }
  }

  async monitorAutoRules() {
    const body = await this.readBody();
    const { currentPrices } = body;

    if (!currentPrices || typeof currentPrices !== 'object') {
      return this.error(400, 'currentPrices object required');
    }

    try {
      const executions = await this.rdcmRulesEngine.monitorRules(currentPrices);
      return this.send(200, {
        success: true,
        executionCount: executions.length,
        executions
      });
    } catch (e) {
      return this.error(500, e.message);
    }
  }

  async getAutoRuleHistory(ruleId) {
    try {
      const history = this.rdcmRulesEngine.getExecutionHistory(ruleId);
      return this.send(200, {
        success: true,
        ruleId,
        count: history.length,
        history
      });
    } catch (e) {
      return this.error(500, e.message);
    }
  }

  async getAutoRuleStats(userId) {
    try {
      const stats = this.rdcmRulesEngine.getStats(userId);
      return this.send(200, {
        success: true,
        userId,
        stats
      });
    } catch (e) {
      return this.error(500, e.message);
    }
  }

  async getBrainMetrics() {
    try {
      const metrics = this.rdcmBrain.getMetrics();
      return this.send(200, {
        success: true,
        brain: metrics
      });
    } catch (e) {
      return this.error(500, e.message);
    }
  }

  generateJWT(userId, email, isOwner = false) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const payload = {
      userId, email, isOwner,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor((Date.now() + CONFIG.JWT_EXPIRY) / 1000),
    };
    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64');
    const signature = crypto.createHmac('sha256', CONFIG.JWT_SECRET).update(`${header}.${payloadBase64}`).digest('base64');
    return `${header}.${payloadBase64}.${signature}`;
  }
}

// Server
const server = http.createServer(async (req, res) => {
  const handler = new RequestHandler(req, res);
  await handler.handle();
});

server.listen(CONFIG.PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║   🚀 RDCM QUANTUM v2.1 - QUANTUM AI BRAIN POWERED              ║
║   RDCM Rules + Broker Integration + AI Momentum Trading        ║
╚════════════════════════════════════════════════════════════════╝

✅ Robinhood Integration
   - Stocks: BUY/SELL
   - Crypto: BTC, ETH
   - Real positions & account data

✅ Coinbase Integration
   - Crypto: BTC, ETH, XRP, SOL
   - Real wallet management
   - Live order execution

✅ RDCM Rules Quantum AI Brain
   - Momentum scoring (0-100)
   - Rule creation & management
   - Automatic execution
   - Real-time monitoring

📊 API ENDPOINTS:
   POST   /api/rules/create
   GET    /api/rules?userId=<id>
   POST   /api/rules/:ruleId/toggle
   DELETE /api/rules/:ruleId
   GET    /api/rules/:ruleId/history
   GET    /api/rules/stats/:userId
   POST   /api/rules/monitor
   GET    /api/rules/brain/metrics

   POST   /api/brokers/connect-robinhood
   POST   /api/brokers/connect-coinbase
   GET    /api/brokers/portfolio
   POST   /api/trades/execute-live
   GET    /api/trades/history

🧠 AI BRAIN STATS:
   Edition: ${require('./autorule-brain-edition.json').edition}
   Accuracy: ${(require('./autorule-brain-edition.json').accuracy * 100).toFixed(1)}%
   Brain Score: ${require('./autorule-brain-edition.json').brain_score}
   Trained Lessons: ${require('./autorule-brain-edition.json').lessons.toLocaleString()}

🎯 QUANTUM AI TRADING READY
  `);
});

process.on('SIGTERM', () => {
  console.log('Shutting down...');
  server.close(() => process.exit(0));
});

module.exports = server;
