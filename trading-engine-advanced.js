/**
 * Advanced Trading Engine - Quantum Brain v2.0
 * Multi-strategy, multi-asset trading with adaptive algorithms
 */

class AdvancedTradingEngine {
  constructor(userId, config = {}) {
    this.userId = userId;
    this.config = {
      maxPositionSize: config.maxPositionSize || 0.05, // 5% per position
      maxDailyDrawdown: config.maxDailyDrawdown || 0.02, // 2%
      riskPerTrade: config.riskPerTrade || 0.01, // 1%
      minConfidence: config.minConfidence || 0.65,
      ...config
    };

    // Portfolio tracking
    this.portfolio = {
      cash: 100000,
      positions: {}, // { symbol: { shares, entryPrice, currentPrice, pnl } }
      trades: [],
      dailyPnL: 0,
      totalPnL: 0,
      winRate: 0,
      winCount: 0,
      lossCount: 0
    };

    // Strategy modules
    this.strategies = {
      momentum: new MomentumStrategy(),
      meanReversion: new MeanReversionStrategy(),
      breakout: new BreakoutStrategy(),
      technicalAnalysis: new TechnicalAnalysisStrategy(),
      macroEconomic: new MacroEconomicStrategy()
    };

    // Market data cache
    this.marketData = {};
  }

  /**
   * Analyze multiple assets and generate trading signals
   */
  async generateMultiAssetSignals(assets, marketData) {
    const signals = [];

    for (const asset of assets) {
      const data = marketData[asset.symbol];
      if (!data) continue;

      const signal = await this.generateSignal(asset, data);
      if (signal.confidence >= this.config.minConfidence) {
        signals.push(signal);
      }
    }

    // Rank signals by confidence and opportunity
    signals.sort((a, b) => b.confidence - a.confidence);
    return signals.slice(0, 5); // Top 5 signals
  }

  /**
   * Generate signal for single asset using ensemble of strategies
   */
  async generateSignal(asset, marketData) {
    const votes = {
      buy: 0,
      sell: 0,
      hold: 0
    };

    const signals = [];

    // Momentum strategy (30% weight)
    const momentum = this.strategies.momentum.analyze(marketData);
    if (momentum.action === 'buy') votes.buy += 0.3;
    else if (momentum.action === 'sell') votes.sell += 0.3;
    signals.push(momentum);

    // Mean reversion strategy (25% weight)
    const meanReversion = this.strategies.meanReversion.analyze(marketData);
    if (meanReversion.action === 'buy') votes.buy += 0.25;
    else if (meanReversion.action === 'sell') votes.sell += 0.25;
    signals.push(meanReversion);

    // Breakout strategy (20% weight)
    const breakout = this.strategies.breakout.analyze(marketData);
    if (breakout.action === 'buy') votes.buy += 0.2;
    else if (breakout.action === 'sell') votes.sell += 0.2;
    signals.push(breakout);

    // Technical analysis (15% weight)
    const technical = this.strategies.technicalAnalysis.analyze(marketData);
    if (technical.action === 'buy') votes.buy += 0.15;
    else if (technical.action === 'sell') votes.sell += 0.15;
    signals.push(technical);

    // Macro-economic factors (10% weight)
    const macro = this.strategies.macroEconomic.analyze(marketData);
    if (macro.action === 'buy') votes.buy += 0.1;
    else if (macro.action === 'sell') votes.sell += 0.1;
    signals.push(macro);

    // Determine final action and confidence
    const totalVotes = votes.buy + votes.sell;
    let action = 'hold';
    let confidence = 0;

    if (votes.buy > votes.sell) {
      action = 'buy';
      confidence = votes.buy / totalVotes;
    } else if (votes.sell > votes.buy) {
      action = 'sell';
      confidence = votes.sell / totalVotes;
    }

    // Calculate position sizing
    const positionSize = this.calculatePositionSize(asset.symbol, confidence);

    return {
      symbol: asset.symbol,
      action,
      confidence,
      positionSize,
      entryPrice: marketData.price,
      timestamp: new Date(),
      strategies: signals,
      riskReward: this.calculateRiskReward(marketData),
      support: this.calculateSupport(marketData),
      resistance: this.calculateResistance(marketData)
    };
  }

  /**
   * Calculate optimal position size based on Kelly Criterion
   */
  calculatePositionSize(symbol, confidence) {
    // Kelly Criterion: f = (bp - q) / b
    // f = fraction of capital to risk
    // b = odds, p = win probability, q = loss probability

    const winRate = this.portfolio.winRate || 0.5;
    const odds = 1.5; // Assume 1.5:1 reward/risk

    const f = ((odds * confidence) - (1 - confidence)) / odds;
    const maxSize = this.config.maxPositionSize;

    return Math.min(Math.max(f, 0), maxSize);
  }

  /**
   * Calculate risk/reward ratio
   */
  calculateRiskReward(marketData) {
    const support = this.calculateSupport(marketData);
    const resistance = this.calculateResistance(marketData);
    const price = marketData.price;

    const downside = price - support;
    const upside = resistance - price;

    return upside / downside;
  }

  /**
   * Calculate support level (50-day low)
   */
  calculateSupport(marketData) {
    if (!marketData.low50day) return marketData.price * 0.95;
    return marketData.low50day;
  }

  /**
   * Calculate resistance level (50-day high)
   */
  calculateResistance(marketData) {
    if (!marketData.high50day) return marketData.price * 1.05;
    return marketData.high50day;
  }

  /**
   * Execute trade with risk management
   */
  async executeTrade(signal) {
    // Check daily drawdown limit
    if (Math.abs(this.portfolio.dailyPnL) > this.portfolio.cash * this.config.maxDailyDrawdown) {
      return { success: false, reason: 'Daily drawdown limit exceeded' };
    }

    // Calculate position size in dollars
    const positionDollars = this.portfolio.cash * signal.positionSize;
    const shares = Math.floor(positionDollars / signal.entryPrice);

    if (shares === 0) {
      return { success: false, reason: 'Insufficient capital' };
    }

    // Create trade entry
    const trade = {
      id: `trade_${Date.now()}`,
      symbol: signal.symbol,
      action: signal.action,
      shares,
      entryPrice: signal.entryPrice,
      entryTime: new Date(),
      positionSize: signal.positionSize,
      confidence: signal.confidence,
      status: 'open',
      riskReward: signal.riskReward,
      exitPrice: null,
      exitTime: null,
      pnl: 0,
      returnPercent: 0
    };

    // Update portfolio
    this.portfolio.positions[signal.symbol] = {
      shares,
      entryPrice: signal.entryPrice,
      currentPrice: signal.entryPrice,
      pnl: 0
    };

    this.portfolio.cash -= positionDollars;
    this.portfolio.trades.push(trade);

    return {
      success: true,
      trade,
      positionSize: shares,
      invested: positionDollars,
      remainingCash: this.portfolio.cash
    };
  }

  /**
   * Update positions with current market prices
   */
  updatePositions(marketData) {
    let totalPnL = 0;

    for (const symbol in this.portfolio.positions) {
      const position = this.portfolio.positions[symbol];
      const current = marketData[symbol];

      if (!current) continue;

      position.currentPrice = current.price;
      position.pnl = (current.price - position.entryPrice) * position.shares;
      totalPnL += position.pnl;
    }

    this.portfolio.dailyPnL = totalPnL;
    return totalPnL;
  }

  /**
   * Close position with exit signal
   */
  closePosition(symbol, currentPrice) {
    const position = this.portfolio.positions[symbol];
    if (!position) return null;

    const pnl = (currentPrice - position.entryPrice) * position.shares;
    const returnPercent = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;

    // Update trade record
    const trade = this.portfolio.trades.find(t => t.symbol === symbol && t.status === 'open');
    if (trade) {
      trade.exitPrice = currentPrice;
      trade.exitTime = new Date();
      trade.pnl = pnl;
      trade.returnPercent = returnPercent;
      trade.status = 'closed';

      // Update win/loss count
      if (pnl > 0) {
        this.portfolio.winCount++;
      } else {
        this.portfolio.lossCount++;
      }

      this.portfolio.winRate = this.portfolio.winCount / (this.portfolio.winCount + this.portfolio.lossCount);
    }

    // Return cash to portfolio
    this.portfolio.cash += position.shares * currentPrice;
    delete this.portfolio.positions[symbol];
    this.portfolio.totalPnL += pnl;

    return {
      symbol,
      pnl,
      returnPercent,
      exitPrice: currentPrice
    };
  }

  /**
   * Get portfolio summary
   */
  getPortfolioSummary() {
    return {
      cash: this.portfolio.cash,
      positions: this.portfolio.positions,
      totalValue: this.portfolio.cash + Object.values(this.portfolio.positions).reduce((sum, p) => sum + (p.shares * p.currentPrice), 0),
      dailyPnL: this.portfolio.dailyPnL,
      totalPnL: this.portfolio.totalPnL,
      winRate: (this.portfolio.winRate * 100).toFixed(1) + '%',
      trades: this.portfolio.trades.length,
      winCount: this.portfolio.winCount,
      lossCount: this.portfolio.lossCount
    };
  }
}

// Strategy implementations
class MomentumStrategy {
  analyze(data) {
    const momentum = (data.price - data.price50day) / data.price50day;
    return {
      name: 'Momentum',
      action: momentum > 0.02 ? 'buy' : momentum < -0.02 ? 'sell' : 'hold',
      signal: momentum,
      threshold: 0.02
    };
  }
}

class MeanReversionStrategy {
  analyze(data) {
    const zScore = (data.price - data.mean20day) / data.std20day;
    return {
      name: 'Mean Reversion',
      action: zScore < -2 ? 'buy' : zScore > 2 ? 'sell' : 'hold',
      signal: zScore,
      threshold: 2
    };
  }
}

class BreakoutStrategy {
  analyze(data) {
    const breakoutUp = data.price > data.high52week * 0.99;
    const breakoutDown = data.price < data.low52week * 1.01;
    return {
      name: 'Breakout',
      action: breakoutUp ? 'buy' : breakoutDown ? 'sell' : 'hold',
      signal: breakoutUp ? 1 : breakoutDown ? -1 : 0,
      threshold: 0
    };
  }
}

class TechnicalAnalysisStrategy {
  analyze(data) {
    // RSI (14) calculation
    const rsi = data.rsi14 || 50;
    return {
      name: 'Technical Analysis',
      action: rsi < 30 ? 'buy' : rsi > 70 ? 'sell' : 'hold',
      signal: rsi,
      threshold: 30
    };
  }
}

class MacroEconomicStrategy {
  analyze(data) {
    const sectorMomentum = data.sectorMomentum || 0;
    const marketSentiment = data.marketSentiment || 0;
    const combined = (sectorMomentum + marketSentiment) / 2;

    return {
      name: 'Macro-Economic',
      action: combined > 0.1 ? 'buy' : combined < -0.1 ? 'sell' : 'hold',
      signal: combined,
      threshold: 0.1
    };
  }
}

module.exports = { AdvancedTradingEngine };
