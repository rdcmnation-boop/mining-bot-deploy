/**
 * Autonomous Trading Agent
 * Powered by AutoRule AI Brain (Edition 2026-H2.2, Accuracy: 85.1%)
 *
 * Responsibilities:
 * - Generate trading signals with confidence scores
 * - Monitor market conditions
 * - Execute trades based on AI recommendations
 * - Track performance and adapt strategy
 */

const AutoRuleBrain = require('../autorule-brain-integration');

class TradingAgent {
  constructor() {
    this.brain = new AutoRuleBrain();
    this.portfolio = {};
    this.tradeHistory = [];
    this.confidenceThreshold = 0.65;
    this.maxPositionSize = 0.1; // 10% of portfolio per trade
    this.performanceMetrics = {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      avgReturn: 0,
      winRate: 0
    };
  }

  /**
   * Generate trading signals using AI Brain
   * @param {Array} marketData - Current market data for symbols
   * @returns {Array} Array of trading signals with confidence scores
   */
  generateSignals(marketData) {
    const brainMetrics = this.brain.getMetrics();
    const signals = [];

    // Use AI Brain accuracy as base confidence multiplier
    const brainAccuracy = brainMetrics.accuracy || 0.851;

    marketData.forEach(market => {
      // AI-powered signal generation
      const signal = this.analyzeMarket(market, brainAccuracy);

      if (signal.confidence >= this.confidenceThreshold) {
        signals.push({
          symbol: market.symbol,
          action: signal.action,
          confidence: signal.confidence,
          target: signal.target,
          stopLoss: signal.stopLoss,
          reasoning: signal.reasoning,
          brainVersion: brainMetrics.edition,
          timestamp: new Date().toISOString()
        });
      }
    });

    return signals.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Analyze market using AI Brain insights
   * @private
   */
  analyzeMarket(market, brainAccuracy) {
    const { price, change24h, volume, momentum } = market;

    // Multi-factor AI analysis
    let score = 0;
    let reasoning = [];

    // Price momentum analysis
    if (change24h > 2) {
      score += 15;
      reasoning.push('Positive 24h momentum');
    } else if (change24h < -2) {
      score -= 15;
      reasoning.push('Negative 24h momentum');
    }

    // Volume analysis
    if (volume > 1000000) {
      score += 10;
      reasoning.push('High trading volume');
    }

    // Momentum strength
    if (momentum > 0.6) {
      score += 20;
      reasoning.push('Strong uptrend');
    } else if (momentum < -0.6) {
      score -= 20;
      reasoning.push('Strong downtrend');
    }

    // AI Brain's accuracy confidence boost
    score = score * brainAccuracy;

    // Determine action and confidence
    let action, confidence;
    if (score > 50) {
      action = 'BUY';
      confidence = Math.min(0.95, 0.5 + (score / 200));
    } else if (score < -50) {
      action = 'SELL';
      confidence = Math.min(0.95, 0.5 + (Math.abs(score) / 200));
    } else {
      action = 'HOLD';
      confidence = 0.4;
    }

    // Calculate price targets
    const target = action === 'BUY'
      ? price * (1 + confidence * 0.05)
      : price * (1 - confidence * 0.05);

    const stopLoss = action === 'BUY'
      ? price * (1 - 0.02)
      : price * (1 + 0.02);

    return {
      action,
      confidence,
      target,
      stopLoss,
      reasoning: reasoning.join('; ')
    };
  }

  /**
   * Execute trade with risk management
   */
  executeTrade(signal, portfolioValue) {
    const tradeSize = portfolioValue * this.maxPositionSize;
    const shares = Math.floor(tradeSize / signal.target);

    if (shares <= 0) {
      return {
        success: false,
        message: 'Insufficient portfolio size for trade'
      };
    }

    const trade = {
      id: `trade_${Date.now()}`,
      symbol: signal.symbol,
      action: signal.action,
      shares,
      entryPrice: signal.target,
      target: signal.target,
      stopLoss: signal.stopLoss,
      confidence: signal.confidence,
      executedAt: new Date().toISOString(),
      status: 'open'
    };

    this.tradeHistory.push(trade);
    this.portfolio[signal.symbol] = trade;
    this.performanceMetrics.totalTrades++;

    return {
      success: true,
      trade,
      message: `${signal.action} ${shares} shares of ${signal.symbol} at $${signal.target.toFixed(2)}`
    };
  }

  /**
   * Update trade performance
   */
  updateTradePerformance(tradeId, exitPrice) {
    const trade = this.tradeHistory.find(t => t.id === tradeId);
    if (!trade) return null;

    const return_ = ((exitPrice - trade.entryPrice) / trade.entryPrice) * 100;
    trade.exitPrice = exitPrice;
    trade.return = return_;
    trade.status = 'closed';

    if (return_ > 0) {
      this.performanceMetrics.winningTrades++;
    } else {
      this.performanceMetrics.losingTrades++;
    }

    this.updateStats();
    return trade;
  }

  /**
   * Get current portfolio status
   */
  getPortfolioStatus() {
    return {
      openPositions: Object.values(this.portfolio).filter(t => t.status === 'open'),
      performance: this.performanceMetrics,
      brainMetrics: this.brain.getMetrics()
    };
  }

  /**
   * Update performance statistics
   * @private
   */
  updateStats() {
    const { totalTrades, winningTrades } = this.performanceMetrics;

    if (totalTrades > 0) {
      this.performanceMetrics.winRate = (winningTrades / totalTrades) * 100;

      const closedTrades = this.tradeHistory.filter(t => t.status === 'closed');
      if (closedTrades.length > 0) {
        const avgReturn_ = closedTrades.reduce((sum, t) => sum + (t.return || 0), 0) / closedTrades.length;
        this.performanceMetrics.avgReturn = avgReturn_;
      }
    }
  }
}

module.exports = TradingAgent;
