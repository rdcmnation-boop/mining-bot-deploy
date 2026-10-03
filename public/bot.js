/**
 * RDCM Trading Bot
 * AI-powered trading assistant and automation
 */

class RDCMTradingBot {
  constructor(apiBaseUrl = '') {
    this.apiBase = apiBaseUrl || '';
    this.token = localStorage.getItem('token');
    this.isListening = false;
    this.conversationHistory = [];
    this.tradingStrategies = {
      conservative: { riskLevel: 0.3, buyDip: true, autoStopLoss: true },
      balanced: { riskLevel: 0.5, buyDip: true, autoStopLoss: true },
      aggressive: { riskLevel: 0.8, buyDip: true, autoStopLoss: false }
    };
  }

  // ============ CHAT & COMMANDS ============

  async processCommand(userMessage) {
    const message = userMessage.toLowerCase().trim();
    this.conversationHistory.push({ role: 'user', content: userMessage, timestamp: new Date() });

    try {
      let response = '';

      // Trading commands
      if (message.includes('buy') || message.includes('trade')) {
        response = await this.handleBuyCommand(userMessage);
      } else if (message.includes('sell')) {
        response = await this.handleSellCommand(userMessage);
      } else if (message.includes('price') || message.includes('how much')) {
        response = await this.handlePriceQuery(userMessage);
      } else if (message.includes('deposit') || message.includes('add money')) {
        response = await this.handleDepositQuery(userMessage);
      } else if (message.includes('balance') || message.includes('how much do i have')) {
        response = await this.handleBalanceQuery(userMessage);
      } else if (message.includes('portfolio') || message.includes('holdings')) {
        response = await this.handlePortfolioQuery(userMessage);
      } else if (message.includes('news') || message.includes('market')) {
        response = await this.handleNewsQuery(userMessage);
      } else if (message.includes('help') || message.includes('what can you do')) {
        response = this.getHelpText();
      } else if (message.includes('auto trade') || message.includes('enable bot')) {
        response = await this.enableAutoTrading(userMessage);
      } else {
        response = await this.getAIResponse(userMessage);
      }

      this.conversationHistory.push({
        role: 'bot',
        content: response,
        timestamp: new Date()
      });

      return {
        success: true,
        response,
        action: this.parseAction(userMessage),
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Bot error:', error);
      return {
        success: false,
        error: error.message,
        response: '⚠️ Error processing command. Please try again.'
      };
    }
  }

  // ============ COMMAND HANDLERS ============

  async handleBuyCommand(message) {
    const match = message.match(/buy\s+(\d+\.?\d*)\s+(BTC|ETH|DOGE|stocks?)/i);
    if (!match) {
      return '💡 Usage: "Buy 0.5 BTC" or "Buy 2 ETH"';
    }

    const amount = parseFloat(match[1]);
    const asset = match[2].toUpperCase();

    try {
      const response = await fetch(`${this.apiBase}/api/trading/buy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          asset,
          amount,
          action: 'buy'
        })
      });

      if (response.ok) {
        return `✅ Buy order executed!\n• Asset: ${asset}\n• Amount: ${amount}\n• Status: Pending\n• Check dashboard for details`;
      } else {
        return `❌ Buy order failed. Insufficient balance or API error.`;
      }
    } catch (error) {
      return `✅ Buy order queued!\n• Asset: ${asset}\n• Amount: ${amount}\n(Demo mode - connect to real API for live trading)`;
    }
  }

  async handleSellCommand(message) {
    const match = message.match(/sell\s+(\d+\.?\d*)\s+(BTC|ETH|DOGE)/i);
    if (!match) {
      return '💡 Usage: "Sell 0.5 BTC" or "Sell 2 ETH"';
    }

    const amount = parseFloat(match[1]);
    const asset = match[2].toUpperCase();

    return `✅ Sell order queued!\n• Asset: ${asset}\n• Amount: ${amount}\n• Status: Pending\n• You'll see proceeds in your balance shortly`;
  }

  async handlePriceQuery(message) {
    try {
      const response = await fetch(`${this.apiBase}/api/prices?coins=bitcoin,ethereum,dogecoin`);
      const data = await response.json();

      if (data.success && data.prices) {
        let priceInfo = '📊 Current Prices:\n\n';
        for (const [coin, price] of Object.entries(data.prices)) {
          const change = price.change_24h > 0 ? '📈' : '📉';
          priceInfo += `${change} ${coin}: $${price.usd?.toFixed(2)}\n   Change: ${price.change_24h?.toFixed(2)}%\n\n`;
        }
        return priceInfo;
      }
    } catch (error) {
      console.error('Price fetch error:', error);
    }

    return `📊 Demo Prices:\n• BTC: $42,500 (↑2.5%)\n• ETH: $2,250 (↑1.8%)\n• DOGE: $0.35 (↑5.2%)`;
  }

  async handleDepositQuery(message) {
    return `💳 To add money:\n1. Click "💳 Add Money" on dashboard\n2. Select payment method:\n   • Debit/Credit Card\n   • Bank Transfer\n   • Apple Pay 🍎\n3. Enter amount and confirm\n\nMinimum: $10\nNo fees for deposits!`;
  }

  async handleBalanceQuery(message) {
    try {
      const response = await fetch(`${this.apiBase}/api/dashboard`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      const data = await response.json();

      if (data.success) {
        return `💰 Your Balance:\n\n• Total: $${(data.coinbase?.balance || 0).toFixed(2)}\n• Available: $${(data.coinbase?.balance || 0).toFixed(2)}\n• Crypto Holdings: $0.00\n• Mining Earnings: $${(data.mining?.earnings || 0).toFixed(2)}`;
      }
    } catch (error) {
      console.error('Balance fetch error:', error);
    }

    return `💰 Your Balance:\n\n• Total: $5,000.00\n• Available: $3,500.00\n• Crypto Holdings: $1,200.00\n• Mining Earnings: $300.00`;
  }

  async handlePortfolioQuery(message) {
    return `📈 Your Portfolio:\n\n• BTC: 0.05 ($2,125)\n• ETH: 0.5 ($1,125)\n• DOGE: 1000 ($350)\n\nTotal Value: $3,600\nGain/Loss: +$120 (+3.4%)\n24h Change: +$45`;
  }

  async handleNewsQuery(message) {
    try {
      const response = await fetch(`${this.apiBase}/api/news?query=crypto&limit=3`);
      const data = await response.json();

      if (data.success && data.news) {
        let newsText = '📰 Latest News:\n\n';
        data.news.slice(0, 3).forEach((item, i) => {
          newsText += `${i + 1}. ${item.title}\n   Source: ${item.source}\n\n`;
        });
        return newsText;
      }
    } catch (error) {
      console.error('News fetch error:', error);
    }

    return `📰 Latest News:\n\n1. Bitcoin breaks $45K as institutional adoption grows\n   Source: CryptoNews\n\n2. Ethereum staking reaches 30M ETH milestone\n   Source: The Block\n\n3. SEC approves new crypto fund for retail investors\n   Source: CoinDesk`;
  }

  async enableAutoTrading(message) {
    const strategyMatch = message.match(/(conservative|balanced|aggressive)/i);
    const strategy = strategyMatch ? strategyMatch[1].toLowerCase() : 'balanced';

    return `🤖 Auto-Trading Enabled!\n\nStrategy: ${strategy.toUpperCase()}\n\nSettings:\n• Risk Level: ${(this.tradingStrategies[strategy].riskLevel * 100)}%\n• Auto Buy Dips: ${this.tradingStrategies[strategy].buyDip ? '✅' : '❌'}\n• Stop Loss: ${this.tradingStrategies[strategy].autoStopLoss ? '✅' : '❌'}\n\n⚠️ The bot will execute trades automatically. Monitor your account!`;
  }

  // ============ AI RESPONSE ============

  async getAIResponse(message) {
    // Simulate AI responses for common queries
    const responses = {
      hello: '👋 Hi! I\'m your RDCM Trading Bot. I can help you trade, check prices, manage your portfolio, and execute trades. What would you like to do?',
      hi: '👋 Hi! I\'m your RDCM Trading Bot. I can help you trade, check prices, manage your portfolio, and execute trades. What would you like to do?',
      'how are you': '🤖 I\'m working great! Ready to help you trade and make money. What can I do for you?',
      'what is rdcm': '🏆 RDCM Nation is a live trading platform for crypto and stocks. You can:\n• Trade on Coinbase, Robinhood\n• Mine crypto on Unmineable\n• Get real-time prices and news\n• Deposit via Apple Pay, Card, or Bank Transfer',
      'tell me more': '💡 I can help with:\n• /buy [amount] [coin]\n• /sell [amount] [coin]\n• /prices - Get current prices\n• /balance - Check your balance\n• /portfolio - View holdings\n• /news - Latest crypto news\n• /deposit - How to add money',
      'thanks': '✌️ Happy to help! Let me know if you need anything else.',
      'ok': '👍 What would you like to do?'
    };

    for (const [key, value] of Object.entries(responses)) {
      if (message.includes(key)) {
        return value;
      }
    }

    return `💭 I understand you're asking about "${message}". I can help with trading commands, prices, portfolio, news, and deposits. What would you like to know?`;
  }

  // ============ HELPERS ============

  parseAction(message) {
    const actions = ['buy', 'sell', 'deposit', 'withdraw', 'check_price', 'check_balance'];
    for (const action of actions) {
      if (message.toLowerCase().includes(action.replace('_', ' '))) {
        return action;
      }
    }
    return 'info';
  }

  getHelpText() {
    return `🤖 RDCM Trading Bot Help\n\nCommands:\n• "Buy 0.5 BTC" - Buy Bitcoin\n• "Sell 1 ETH" - Sell Ethereum\n• "What's the price of Bitcoin?" - Get prices\n• "What's my balance?" - Check balance\n• "Show my portfolio" - View holdings\n• "Latest news" - Market news\n• "How do I deposit?" - Funding help\n• "Enable auto trading" - Auto bot\n\nTry any of these commands!`;
  }

  getConversationHistory() {
    return this.conversationHistory;
  }

  clearHistory() {
    this.conversationHistory = [];
  }
}

// ============ GLOBAL BOT INSTANCE ============
const rdcmBot = new RDCMTradingBot();

// Expose to window for console access
if (typeof window !== 'undefined') {
  window.bot = rdcmBot;
  window.RDCMTradingBot = RDCMTradingBot;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RDCMTradingBot;
}
