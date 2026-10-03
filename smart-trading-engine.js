/**
 * Smart Trading Engine
 * Advanced AI-driven trading logic with:
 * - Multi-factor technical analysis
 * - Risk/reward optimization
 * - Portfolio correlation analysis
 * - Dynamic position sizing
 * - Momentum and trend detection
 * - Market regime identification
 */

const fetch = require('node-fetch');

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || 'YOUR_CLAUDE_API_KEY';
const CLAUDE_API = 'https://api.anthropic.com/v1/messages';

/**
 * Analyze market conditions and regime
 */
async function analyzeMarketRegime(symbols, indicators) {
  try {
    // Calculate market breadth
    const upTrend = symbols.filter(s => indicators[s]?.change24h > 0).length;
    const downTrend = symbols.filter(s => indicators[s]?.change24h < 0).length;
    const breadth = upTrend / (upTrend + downTrend);

    // Volatility index (simplified)
    const volatilities = symbols.map(s => {
      const rsi = indicators[s]?.rsi || 50;
      return Math.abs(rsi - 50); // Higher = more volatile
    });
    const avgVolatility = volatilities.reduce((a, b) => a + b, 0) / volatilities.length;

    return {
      breadth,
      trend: breadth > 0.6 ? 'bullish' : breadth < 0.4 ? 'bearish' : 'neutral',
      volatility: avgVolatility / 50, // Normalize to 0-1
      riskEnvironment: avgVolatility > 25 ? 'high' : avgVolatility > 15 ? 'medium' : 'low'
    };
  } catch (error) {
    console.error('Market regime analysis error:', error.message);
    return null;
  }
}

/**
 * Calculate dynamic position sizing based on risk
 */
function calculatePositionSize(confidence, volatility, riskEnvironment, portfolio) {
  try {
    let baseSize = 0.02; // 2% default

    // Adjust for confidence
    const confidenceFactor = confidence / 100; // 0-1
    baseSize *= confidenceFactor;

    // Adjust for volatility (reduce in high volatility)
    const volatilityFactor = 1 - (volatility * 0.5); // 0.5-1.0
    baseSize *= volatilityFactor;

    // Adjust for market regime
    const regimeFactor = {
      high: 0.5,
      medium: 0.75,
      low: 1.0
    }[riskEnvironment] || 1.0;
    baseSize *= regimeFactor;

    // Cap maximum position size
    const maxPosition = Math.min(baseSize, 0.05); // Never exceed 5%

    return {
      size: parseFloat(maxPosition.toFixed(4)),
      confidenceFactor: parseFloat(confidenceFactor.toFixed(2)),
      volatilityFactor: parseFloat(volatilityFactor.toFixed(2)),
      regimeFactor: parseFloat(regimeFactor.toFixed(2))
    };
  } catch (error) {
    console.error('Position sizing error:', error.message);
    return { size: 0.02 };
  }
}

/**
 * Score technical indicators strength
 */
function scoreTechnicalStrength(indicators) {
  try {
    let score = 0;
    let maxScore = 0;

    // RSI analysis (30-70 range is neutral, <30 is oversold, >70 is overbought)
    const rsi = indicators.rsi || 50;
    if (rsi < 30) {
      score += 2; // Strong oversold = BUY signal
      maxScore += 2;
    } else if (rsi > 70) {
      score -= 2; // Strong overbought = SELL signal
      maxScore += 2;
    } else if (rsi < 50) {
      score += 1; // Slightly weak
      maxScore += 2;
    }

    // MACD analysis
    if (indicators.macd === 'positive') {
      score += 1.5;
    } else {
      score -= 1.5;
    }
    maxScore += 1.5;

    // Bollinger Bands
    if (indicators.bollinger === 'oversold') {
      score += 1;
    } else if (indicators.bollinger === 'overbought') {
      score -= 1;
    }
    maxScore += 1;

    // Moving Average crossover
    const ma50 = indicators.movingAvg50 || 100;
    const ma200 = indicators.movingAvg200 || 100;
    const price = indicators.price || 100;

    if (price > ma50 && ma50 > ma200) {
      score += 2; // Golden cross bullish
    } else if (price < ma50 && ma50 < ma200) {
      score -= 2; // Death cross bearish
    }
    maxScore += 2;

    // Normalize to 0-100
    const normalizedScore = ((score / maxScore) * 50) + 50;
    return Math.max(0, Math.min(100, normalizedScore));
  } catch (error) {
    console.error('Technical scoring error:', error.message);
    return 50;
  }
}

/**
 * Detect trend using moving averages
 */
function detectTrend(indicators) {
  try {
    const price = indicators.price || 100;
    const ma50 = indicators.movingAvg50 || 100;
    const ma200 = indicators.movingAvg200 || 100;

    if (price > ma50 && ma50 > ma200) {
      return { direction: 'strong_uptrend', score: 0.9 };
    } else if (price > ma50 && ma50 <= ma200) {
      return { direction: 'weak_uptrend', score: 0.6 };
    } else if (price < ma50 && ma50 < ma200) {
      return { direction: 'strong_downtrend', score: 0.9 };
    } else if (price < ma50 && ma50 >= ma200) {
      return { direction: 'weak_downtrend', score: 0.6 };
    } else {
      return { direction: 'ranging', score: 0.3 };
    }
  } catch (error) {
    console.error('Trend detection error:', error.message);
    return { direction: 'unknown', score: 0.5 };
  }
}

/**
 * Generate advanced AI trading signal using Claude
 */
async function generateSmartSignal(symbol, indicators, marketRegime, portfolio) {
  try {
    // Score technical indicators
    const technicalScore = scoreTechnicalStrength(indicators);
    const trend = detectTrend(indicators);

    if (CLAUDE_API_KEY.includes('YOUR_')) {
      // Demo mode
      return {
        signal: technicalScore > 60 ? 'BUY' : technicalScore < 40 ? 'SELL' : 'HOLD',
        confidence: Math.abs(technicalScore - 50),
        reasoning: 'Demo mode - technical analysis only',
        analysis: indicators,
        technicalScore,
        trend,
        riskAssessment: { level: 'medium', action: 'proceed_with_caution' }
      };
    }

    // Build comprehensive analysis prompt
    const analysisPrompt = `
You are an expert day trading AI analyzing ${symbol} for optimal trade execution.

CURRENT MARKET DATA:
- Price: $${indicators.price?.toFixed(2) || 'N/A'}
- 24h Change: ${indicators.change24h?.toFixed(2) || '0'}%
- RSI(14): ${indicators.rsi?.toFixed(2) || 'N/A'}
- MACD: ${indicators.macd || 'neutral'}
- Bollinger Bands: ${indicators.bollinger || 'neutral'}
- 50-day MA: $${indicators.movingAvg50?.toFixed(2) || 'N/A'}
- 200-day MA: $${indicators.movingAvg200?.toFixed(2) || 'N/A'}
- Volume: ${indicators.volume?.toLocaleString() || '0'}
- Technical Score: ${technicalScore.toFixed(0)}/100
- Trend: ${trend.direction} (strength: ${(trend.score * 100).toFixed(0)}%)

MARKET REGIME:
- Breadth: ${(marketRegime.breadth * 100).toFixed(0)}% stocks up
- Overall Trend: ${marketRegime.trend}
- Volatility Level: ${marketRegime.riskEnvironment}

TRADING RULES:
- Only generate high-conviction trades (confidence > 65%)
- Avoid trading against the trend unless RSI is extreme
- Scale position size with market volatility
- Never SELL if price is making new highs on high volume
- Never BUY if price is making new lows on high volume

Generate a trading decision with these requirements:
1. Signal: BUY, SELL, or HOLD only
2. Confidence: 0-100 score based on conviction strength
3. Position Size: 0.01-0.05 (1-5% of portfolio)
4. Stop Loss: Price level to exit if trade goes wrong
5. Take Profit: Price target for closing profitable trade
6. Risk Reason: Brief explanation of what could go wrong
7. Reward Reason: What makes this high probability

Respond ONLY with valid JSON matching this exact structure:
{
  "signal": "BUY|SELL|HOLD",
  "confidence": <0-100>,
  "positionSize": <0.01-0.05>,
  "stopLoss": <price>,
  "takeProfit": <price>,
  "riskReason": "brief description of risk",
  "rewardReason": "brief description of upside",
  "rationale": "2-3 sentence trading thesis"
}
`;

    const response = await fetch(CLAUDE_API, {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: analysisPrompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content[0].text;

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        signal: parsed.signal,
        confidence: parsed.confidence,
        positionSize: parsed.positionSize,
        stopLoss: parsed.stopLoss,
        takeProfit: parsed.takeProfit,
        riskReason: parsed.riskReason,
        rewardReason: parsed.rewardReason,
        rationale: parsed.rationale,
        analysis: indicators,
        technicalScore: parseFloat(technicalScore.toFixed(0)),
        trend,
        timestamp: new Date()
      };
    }

    return {
      signal: 'HOLD',
      confidence: 0,
      reasoning: 'Unable to parse signal',
      analysis: indicators
    };
  } catch (error) {
    console.error('Smart signal generation error:', error.message);
    return {
      signal: 'HOLD',
      confidence: 0,
      reasoning: `Error: ${error.message}`,
      analysis: indicators
    };
  }
}

/**
 * Execute smart trades with risk management
 */
async function executeSmartTrades(signals, portfolio, robinhoodToken, marketRegime) {
  try {
    const trades = [];
    const portfolioValue = portfolio.totalValue || 100000;

    for (const [symbol, signalData] of Object.entries(signals)) {
      const { signal, confidence, positionSize, stopLoss, takeProfit } = signalData;

      // Only trade if confidence > 65%
      if (confidence < 65) continue;

      // Verify trade makes sense with current trend
      if (signal === 'BUY' && marketRegime.trend === 'bearish') {
        console.log(`⚠️  Skipping BUY ${symbol} - bearish market regime`);
        continue;
      }

      if (signal === 'SELL' && marketRegime.trend === 'bullish') {
        console.log(`⚠️  Skipping SELL ${symbol} - bullish market regime`);
        continue;
      }

      const tradeSize = portfolioValue * positionSize;

      if (signal === 'BUY') {
        trades.push({
          symbol,
          side: 'buy',
          confidence,
          amount: tradeSize,
          stopLoss,
          takeProfit,
          positionSize,
          status: 'pending',
          riskReason: signalData.riskReason,
          rewardReason: signalData.rewardReason
        });
      } else if (signal === 'SELL') {
        const position = portfolio.positions?.find(p => p.symbol === symbol);
        if (position && position.quantity > 0) {
          trades.push({
            symbol,
            side: 'sell',
            confidence,
            quantity: position.quantity,
            stopLoss,
            takeProfit,
            status: 'pending',
            riskReason: signalData.riskReason,
            rewardReason: signalData.rewardReason
          });
        }
      }
    }

    return {
      totalTrades: trades.length,
      trades,
      marketRegime,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Smart trade execution error:', error.message);
    return null;
  }
}

/**
 * Calculate risk-adjusted returns
 */
function calculateRiskMetrics(trades, portfolio) {
  try {
    const totalRisk = trades
      .filter(t => t.status === 'pending')
      .reduce((sum, t) => {
        if (t.side === 'buy' && t.stopLoss) {
          const riskPerShare = t.amount / 100 - t.stopLoss; // Rough estimate
          return sum + (riskPerShare * (t.amount / 100));
        }
        return sum;
      }, 0);

    const totalReward = trades
      .filter(t => t.status === 'pending')
      .reduce((sum, t) => {
        if (t.side === 'buy' && t.takeProfit) {
          const rewardPerShare = t.takeProfit - (t.amount / 100);
          return sum + (rewardPerShare * (t.amount / 100));
        }
        return sum;
      }, 0);

    const riskRewardRatio = totalRisk > 0 ? totalReward / totalRisk : 0;

    return {
      totalRisk: parseFloat(totalRisk.toFixed(2)),
      totalReward: parseFloat(totalReward.toFixed(2)),
      riskRewardRatio: parseFloat(riskRewardRatio.toFixed(2)),
      expectancy: totalReward > 0 ? 'positive' : 'negative'
    };
  } catch (error) {
    console.error('Risk metrics error:', error.message);
    return null;
  }
}

/**
 * Full smart trading cycle
 */
async function runSmartTradingCycle(symbols, indicators, portfolio, robinhoodToken) {
  try {
    console.log('🤖 Starting smart trading cycle...');

    // 1. Analyze market regime
    const marketRegime = await analyzeMarketRegime(symbols, indicators);
    console.log('📊 Market Regime:', marketRegime);

    // 2. Generate smart signals
    const signals = {};
    for (const symbol of symbols) {
      const signal = await generateSmartSignal(symbol, indicators[symbol], marketRegime, portfolio);
      signals[symbol] = signal;
    }
    console.log('🎯 Trading Signals Generated');

    // 3. Execute smart trades with risk management
    const trades = await executeSmartTrades(signals, portfolio, robinhoodToken, marketRegime);
    console.log('📈 Trades Planned:', trades?.totalTrades);

    // 4. Calculate risk metrics
    const riskMetrics = calculateRiskMetrics(trades?.trades || [], portfolio);
    console.log('⚖️  Risk/Reward:', riskMetrics?.riskRewardRatio);

    return {
      success: true,
      marketRegime,
      signals,
      trades,
      riskMetrics,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Smart trading cycle error:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  analyzeMarketRegime,
  calculatePositionSize,
  scoreTechnicalStrength,
  detectTrend,
  generateSmartSignal,
  executeSmartTrades,
  calculateRiskMetrics,
  runSmartTradingCycle
};
