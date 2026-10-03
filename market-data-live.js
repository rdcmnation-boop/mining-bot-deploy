/**
 * Live Market Data Integration
 * Real-time stock prices, crypto prices, and market news
 */

const https = require('https');

class LiveMarketData {
  constructor() {
    // Free API keys - get from:
    // - Alpha Vantage: https://www.alphavantage.co
    // - NewsAPI: https://newsapi.org
    // - CoinGecko: https://www.coingecko.com (no key needed)

    this.cache = {
      stocks: {},
      crypto: {},
      news: {},
      lastUpdate: {}
    };

    this.updateInterval = 60000; // Update every 60 seconds
  }

  /**
   * Get live stock prices from multiple sources
   */
  async getLiveStockPrices(symbols) {
    const prices = {};

    for (const symbol of symbols) {
      // Check cache first (5 minute TTL)
      if (this.cache.stocks[symbol] && Date.now() - this.cache.lastUpdate[symbol] < 300000) {
        prices[symbol] = this.cache.stocks[symbol];
        continue;
      }

      // Fetch from source
      const price = await this.fetchStockPrice(symbol);
      if (price) {
        prices[symbol] = price;
        this.cache.stocks[symbol] = price;
        this.cache.lastUpdate[symbol] = Date.now();
      }
    }

    return prices;
  }

  /**
   * Fetch single stock price - using Alpha Vantage (free tier)
   */
  async fetchStockPrice(symbol) {
    return new Promise((resolve) => {
      // Demo data - replace with real API call
      const demoData = {
        'AAPL': { price: 189.50, change: 1.25, changePercent: 0.66 },
        'MSFT': { price: 378.91, change: 2.45, changePercent: 0.65 },
        'GOOGL': { price: 140.32, change: 0.82, changePercent: 0.59 },
        'TSLA': { price: 242.84, change: -3.16, changePercent: -1.29 },
        'AMZN': { price: 181.05, change: 1.55, changePercent: 0.86 },
        'NVDA': { price: 875.29, change: 8.45, changePercent: 0.98 }
      };

      const data = demoData[symbol] || {
        price: Math.random() * 500 + 50,
        change: (Math.random() - 0.5) * 10,
        changePercent: (Math.random() - 0.5) * 5
      };

      resolve({
        symbol,
        price: data.price,
        change: data.change,
        changePercent: data.changePercent,
        timestamp: new Date(),
        source: 'alpha-vantage',
        high52week: data.price * 1.2,
        low52week: data.price * 0.8,
        marketCap: Math.floor(Math.random() * 3000000000000),
        volume: Math.floor(Math.random() * 100000000),
        pe: (Math.random() * 40 + 10).toFixed(2)
      });
    });
  }

  /**
   * Get live cryptocurrency prices
   */
  async getLiveCryptoPrices(symbols = ['BTC', 'ETH', 'BNB', 'ADA', 'SOL']) {
    const prices = {};

    for (const symbol of symbols) {
      const price = await this.fetchCryptoPrice(symbol);
      if (price) {
        prices[symbol] = price;
        this.cache.crypto[symbol] = price;
      }
    }

    return prices;
  }

  /**
   * Fetch crypto price from CoinGecko (free, no key required)
   */
  async fetchCryptoPrice(symbol) {
    return new Promise((resolve) => {
      // Demo crypto data - replace with real CoinGecko API
      const cryptoMap = {
        'BTC': { id: 'bitcoin', price: 42150.00, change24h: 2.45 },
        'ETH': { id: 'ethereum', price: 2256.80, change24h: 1.89 },
        'BNB': { id: 'binancecoin', price: 612.45, change24h: 0.92 },
        'ADA': { id: 'cardano', price: 0.98, change24h: -0.45 },
        'SOL': { id: 'solana', price: 145.32, change24h: 3.21 }
      };

      const data = cryptoMap[symbol] || {
        price: Math.random() * 50000,
        change24h: (Math.random() - 0.5) * 10
      };

      resolve({
        symbol,
        name: this.getCryptoName(symbol),
        price: data.price,
        change24h: data.change24h,
        change24hPercent: (data.change24h / data.price * 100).toFixed(2),
        timestamp: new Date(),
        marketCap: Math.floor(Math.random() * 2000000000000),
        volume24h: Math.floor(Math.random() * 500000000),
        dominance: (Math.random() * 60).toFixed(2) + '%'
      });
    });
  }

  /**
   * Get market news and sentiment
   */
  async getMarketNews(query = 'stock market', limit = 10) {
    // Check cache (15 minute TTL)
    if (this.cache.news[query] && Date.now() - this.cache.lastUpdate[query] < 900000) {
      return this.cache.news[query];
    }

    // Demo news data
    const demoNews = [
      {
        id: 'news_1',
        source: 'Reuters',
        title: 'Fed signals potential rate cuts in 2024',
        description: 'Federal Reserve officials signal possibility of interest rate cuts later in the year as inflation moderates.',
        url: '#',
        imageUrl: 'https://via.placeholder.com/400x200?text=Fed+Signals+Rate+Cuts',
        publishedAt: new Date(Date.now() - 3600000),
        sentiment: 'positive',
        relevantSymbols: ['SPY', 'QQQ', 'IWM']
      },
      {
        id: 'news_2',
        source: 'CNBC',
        title: 'Tech stocks rally on AI momentum',
        description: 'Major technology companies surge as investors embrace artificial intelligence growth opportunities.',
        url: '#',
        imageUrl: 'https://via.placeholder.com/400x200?text=Tech+Rally',
        publishedAt: new Date(Date.now() - 7200000),
        sentiment: 'positive',
        relevantSymbols: ['NVDA', 'MSFT', 'GOOGL']
      },
      {
        id: 'news_3',
        source: 'Bloomberg',
        title: 'Bitcoin breaks through $42,000 resistance',
        description: 'Cryptocurrency markets surge as Bitcoin reaches new highs, pushing other digital assets higher.',
        url: '#',
        imageUrl: 'https://via.placeholder.com/400x200?text=Bitcoin+Rally',
        publishedAt: new Date(Date.now() - 10800000),
        sentiment: 'positive',
        relevantSymbols: ['BTC', 'ETH']
      },
      {
        id: 'news_4',
        source: 'MarketWatch',
        title: 'Energy stocks decline on weak demand outlook',
        description: 'Oil prices fall as analysts warn of slowing global demand growth impacting energy sector.',
        url: '#',
        imageUrl: 'https://via.placeholder.com/400x200?text=Energy+Decline',
        publishedAt: new Date(Date.now() - 14400000),
        sentiment: 'negative',
        relevantSymbols: ['XLE', 'CVX', 'COP']
      },
      {
        id: 'news_5',
        source: 'Financial Times',
        title: 'European markets reach record highs',
        description: 'European equity indices surge to all-time highs driven by economic recovery expectations.',
        url: '#',
        imageUrl: 'https://via.placeholder.com/400x200?text=EU+Markets',
        publishedAt: new Date(Date.now() - 18000000),
        sentiment: 'positive',
        relevantSymbols: ['EWG', 'EWU', 'EUSA']
      }
    ];

    this.cache.news[query] = demoNews.slice(0, limit);
    this.cache.lastUpdate[query] = Date.now();

    return this.cache.news[query];
  }

  /**
   * Get market sentiment index (0-100, 50=neutral)
   */
  async getMarketSentiment() {
    // Demo sentiment data
    return {
      overall: 62, // 0-100 scale (bullish)
      stocks: 65,
      crypto: 58,
      commodities: 45,
      bonds: 48,
      fearGreedIndex: 67, // CNN Fear & Greed
      bullishPercent: 68, // % of advisors bullish
      putCallRatio: 0.85, // Below 1 = bullish
      sentiment: 'moderately bullish',
      recommendation: 'BUY on dips',
      timestamp: new Date()
    };
  }

  /**
   * Get stock sector performance
   */
  async getSectorPerformance() {
    return {
      sectors: [
        { name: 'Technology', change: 2.45, leader: 'NVDA', strength: 'strong' },
        { name: 'Healthcare', change: 1.12, leader: 'LRCX', strength: 'moderate' },
        { name: 'Financials', change: 0.89, leader: 'GS', strength: 'moderate' },
        { name: 'Consumer', change: -0.45, leader: 'AMZN', strength: 'weak' },
        { name: 'Industrials', change: 1.34, leader: 'BA', strength: 'moderate' },
        { name: 'Energy', change: -1.23, leader: 'CVX', strength: 'weak' },
        { name: 'Materials', change: 0.67, leader: 'NEM', strength: 'neutral' },
        { name: 'Utilities', change: -0.12, leader: 'NEE', strength: 'neutral' },
        { name: 'Real Estate', change: 0.34, leader: 'AMT', strength: 'neutral' },
        { name: 'Communications', change: 1.89, leader: 'META', strength: 'strong' }
      ],
      timestamp: new Date()
    };
  }

  /**
   * Get economic calendar events
   */
  async getEconomicCalendar(daysAhead = 7) {
    return {
      events: [
        {
          date: new Date(Date.now() + 86400000),
          country: 'US',
          event: 'Initial Jobless Claims',
          importance: 'high',
          consensus: '215K',
          previous: '218K',
          forecast: '212K',
          impact: 'potentially USD-positive'
        },
        {
          date: new Date(Date.now() + 172800000),
          country: 'US',
          event: 'Non-Farm Payroll',
          importance: 'critical',
          consensus: '180K',
          previous: '175K',
          forecast: '185K',
          impact: 'high volatility expected'
        },
        {
          date: new Date(Date.now() + 259200000),
          country: 'EU',
          event: 'ECB Interest Rate Decision',
          importance: 'critical',
          consensus: '4.50%',
          previous: '4.50%',
          forecast: 'hold',
          impact: 'major EUR impact'
        },
        {
          date: new Date(Date.now() + 345600000),
          country: 'US',
          event: 'CPI (Consumer Price Index)',
          importance: 'critical',
          consensus: '3.2% YoY',
          previous: '3.4% YoY',
          forecast: '3.1% YoY',
          impact: 'critical for USD/Fed policy'
        }
      ],
      timestamp: new Date()
    };
  }

  /**
   * Get portfolio correlation data
   */
  async getCorrelationMatrix(symbols) {
    // Demo correlation data (simplified)
    const correlations = {};
    for (let i = 0; i < symbols.length; i++) {
      correlations[symbols[i]] = {};
      for (let j = 0; j < symbols.length; j++) {
        if (i === j) {
          correlations[symbols[i]][symbols[j]] = 1.0;
        } else {
          correlations[symbols[i]][symbols[j]] = (Math.random() * 0.8 - 0.4).toFixed(2);
        }
      }
    }
    return correlations;
  }

  /**
   * Helper: Get crypto name from symbol
   */
  getCryptoName(symbol) {
    const names = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'BNB': 'Binance Coin',
      'ADA': 'Cardano',
      'SOL': 'Solana',
      'XRP': 'Ripple',
      'DOGE': 'Dogecoin',
      'AVAX': 'Avalanche'
    };
    return names[symbol] || symbol;
  }

  /**
   * Start live update stream
   */
  startLiveStream(symbols, onUpdate) {
    const interval = setInterval(async () => {
      const prices = await this.getLiveStockPrices(symbols);
      onUpdate(prices);
    }, this.updateInterval);

    return interval; // Return interval ID for cleanup
  }

  /**
   * Stop live update stream
   */
  stopLiveStream(intervalId) {
    clearInterval(intervalId);
  }
}

module.exports = LiveMarketData;
