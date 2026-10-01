/**
 * RDCM Mining Bot - Client-Side API Handler
 * Handles frontend communication with backend
 */

class MiningBotAPI {
  constructor(baseURL = '') {
    // Auto-detect base URL if running on same host
    if (!baseURL) {
      const protocol = window.location.protocol;
      const host = window.location.host;
      baseURL = `${protocol}//${host}`;
    }

    this.baseURL = baseURL;
    this.userId = localStorage.getItem('userId');
    this.sessionId = localStorage.getItem('sessionId');
    this.currentCoin = localStorage.getItem('selectedCoin') || 'DOGE';
    this.isMining = false;
    this.ws = null;
  }

  // ============ AUTHENTICATION ============

  async register(username, email, walletAddress) {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username || 'Miner',
          email,
          wallet_address: walletAddress || ''
        })
      });
      const data = await response.json();

      if (data.userId) {
        this.userId = data.userId;
        localStorage.setItem('userId', data.userId);
      }

      return data;
    } catch (error) {
      console.error('Registration failed:', error);
      return { error: 'Registration failed', details: error.message };
    }
  }

  async login(email) {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();

      if (data.userId) {
        this.userId = data.userId;
        localStorage.setItem('userId', data.userId);
      }

      return data;
    } catch (error) {
      console.error('Login failed:', error);
      return { error: 'Login failed', details: error.message };
    }
  }

  // ============ MINING CONTROL ============

  async startMining(coin = 'DOGE') {
    try {
      const response = await fetch(`${this.baseURL}/api/mining/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: this.userId, coin })
      });
      const data = await response.json();

      if (data.sessionId) {
        this.sessionId = data.sessionId;
        this.currentCoin = coin;
        this.isMining = true;
        localStorage.setItem('sessionId', data.sessionId);
        localStorage.setItem('selectedCoin', coin);
      }

      return data;
    } catch (error) {
      console.error('Failed to start mining:', error);
      return { error: 'Failed to start mining', details: error.message };
    }
  }

  async stopMining() {
    try {
      const response = await fetch(`${this.baseURL}/api/mining/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: this.sessionId })
      });
      const data = await response.json();

      if (data.success) {
        this.isMining = false;
      }

      return data;
    } catch (error) {
      console.error('Failed to stop mining:', error);
      return { error: 'Failed to stop mining', details: error.message };
    }
  }

  async getMiningStatus() {
    try {
      const response = await fetch(`${this.baseURL}/api/mining/status/${this.userId}`);
      const data = await response.json();
      this.isMining = data.isMining;
      return data;
    } catch (error) {
      console.error('Failed to get mining status:', error);
      return { error: 'Failed to get status', details: error.message };
    }
  }

  // ============ EARNINGS & STATS ============

  async getEarningsStats() {
    try {
      const response = await fetch(`${this.baseURL}/api/earnings/stats/${this.userId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to get earnings stats:', error);
      return { error: 'Failed to get stats', details: error.message };
    }
  }

  async getHistory(limit = 50) {
    try {
      const response = await fetch(`${this.baseURL}/api/history/${this.userId}?limit=${limit}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to get history:', error);
      return { error: 'Failed to get history', details: error.message };
    }
  }

  // ============ WALLET ============

  async getWallet() {
    try {
      const response = await fetch(`${this.baseURL}/api/wallet/${this.userId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to get wallet:', error);
      return { error: 'Failed to get wallet', details: error.message };
    }
  }

  // ============ COINS ============

  async getSupportedCoins() {
    try {
      const response = await fetch(`${this.baseURL}/api/coins`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to get coins:', error);
      return { error: 'Failed to get coins', details: error.message };
    }
  }

  async getCoinPrice(coin) {
    try {
      const response = await fetch(`${this.baseURL}/api/coins/${coin}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Failed to get ${coin} price:`, error);
      return { error: 'Failed to get price', details: error.message };
    }
  }

  // ============ SETTINGS ============

  async getSettings() {
    try {
      const response = await fetch(`${this.baseURL}/api/settings/${this.userId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to get settings:', error);
      return { error: 'Failed to get settings', details: error.message };
    }
  }

  async updateSettings(settings) {
    try {
      const response = await fetch(`${this.baseURL}/api/settings/${this.userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to update settings:', error);
      return { error: 'Failed to update settings', details: error.message };
    }
  }

  // ============ WEBSOCKET LIVE UPDATES ============

  connectLiveUpdates(onUpdate) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsURL = `${protocol}//${host}`;

    this.ws = new WebSocket(`${wsURL}/mining-updates?userId=${this.userId}`);

    this.ws.onopen = () => {
      console.log('📡 Connected to live updates');
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onUpdate(data);
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('📡 Disconnected from live updates');
      setTimeout(() => this.connectLiveUpdates(onUpdate), 5000);
    };
  }

  disconnectLiveUpdates() {
    if (this.ws) {
      this.ws.close();
    }
  }

  // ============ LOCAL STORAGE HELPERS ============

  saveUserData(userData) {
    localStorage.setItem('userData', JSON.stringify(userData));
  }

  getUserData() {
    const data = localStorage.getItem('userData');
    return data ? JSON.parse(data) : null;
  }

  clearSession() {
    localStorage.removeItem('userId');
    localStorage.removeItem('sessionId');
    localStorage.removeItem('selectedCoin');
    localStorage.removeItem('userData');
    this.userId = null;
    this.sessionId = null;
    this.disconnectLiveUpdates();
  }
}

// Make API globally available
window.MiningBotAPI = MiningBotAPI;
