/**
 * AI Trading Signal Generator
 * Uses Claude AI to generate BUY/SELL signals based on technical analysis
 */

const fetch = require('node-fetch');

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || 'YOUR_CLAUDE_API_KEY';
const CLAUDE_API = 'https://api.anthropic.com/v1/messages';

/**
 * Get technical indicators for a stock
 */
async function getTechnicalIndicators(symbol) {
  try {
    // Mock technical data - replace with real API (Alpha Vantage, Finnhub, etc)
    const mockData = {
      symbol,
      price: 100 + Math.random() * 50,
      rsi: 35 + Math.random() * 30,
      macd: Math.random() > 0.5 ? 'positive' : 'negative',
      bollinger: Math.random() > 0.5 ? 'overbought' : 'oversold',
      volume: Math.floor(Math.random() * 10000000),
      movingAvg50: 98 + Math.random() * 5,
      movingAvg200: 95 + Math.random() * 10,
      change24h: (Math.random() - 0.5) * 5,
      timestamp: new Date().toISOString()
    };

    return mockData;
  } catch (error) {
    console.error('Technical indicators error:', error.message);
    return null;
  }
}

/**
 * Generate AI trading signal using Claude
 */
async function generateTradingSignal(symbol, indicators) {
  try {
    if (CLAUDE_API_KEY.includes('YOUR_')) {
      // Demo mode - random signals
      const signals = ['BUY', 'SELL', 'HOLD'];
      return {
        signal: signals[Math.floor(Math.random() * signals.length)],
        confidence: Math.floor(Math.random() * 100) + 1,
        reasoning: 'Demo mode - configure CLAUDE_API_KEY for AI signals',
        analysis: indicators
      };
    }

    const analysisPrompt = `
Based on these technical indicators for ${symbol}, generate a trading signal (BUY, SELL, or HOLD):

Current Price: $${indicators.price.toFixed(2)}
RSI (14): ${indicators.rsi.toFixed(2)}
MACD: ${indicators.macd}
Bollinger Bands: ${indicators.bollinger}
Volume: ${indicators.volume.toLocaleString()}
50-day MA: $${indicators.movingAvg50.toFixed(2)}
200-day MA: $${indicators.movingAvg200.toFixed(2)}
24h Change: ${indicators.change24h.toFixed(2)}%

Respond with JSON: {"signal": "BUY|SELL|HOLD", "confidence": 1-100, "reasoning": "brief explanation"}
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
        max_tokens: 200,
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
        reasoning: parsed.reasoning,
        analysis: indicators,
        timestamp: new Date()
      };
    }

    return {
      signal: 'HOLD',
      confidence: 50,
      reasoning: 'Unable to parse signal',
      analysis: indicators
    };
  } catch (error) {
    console.error('Signal generation error:', error.message);
    return {
      signal: 'HOLD',
      confidence: 0,
      reasoning: `Error: ${error.message}`,
      analysis: indicators
    };
  }
}

/**
 * Get signals for multiple stocks
 */
async function getPortfolioSignals(symbols) {
  try {
    const signals = {};

    for (const symbol of symbols) {
      const indicators = await getTechnicalIndicators(symbol);
      const signal = await generateTradingSignal(symbol, indicators);
      signals[symbol] = signal;
    }

    return signals;
  } catch (error) {
    console.error('Portfolio signals error:', error.message);
    return null;
  }
}

/**
 * Execute trades based on signals
 */
async function executeSignalTrades(signals, portfolio, robinhoodToken) {
  try {
    const trades = [];

    for (const [symbol, signalData] of Object.entries(signals)) {
      const { signal, confidence } = signalData;

      // Only trade if confidence > 60%
      if (confidence < 60) continue;

      if (signal === 'BUY') {
        // Buy if cash available
        trades.push({
          symbol,
          side: 'buy',
          quantity: 1,
          signal: 'BUY',
          confidence
        });
      } else if (signal === 'SELL') {
        // Sell if holding
        const position = portfolio.positions?.find(p => p.symbol === symbol);
        if (position && position.quantity > 0) {
          trades.push({
            symbol,
            side: 'sell',
            quantity: position.quantity,
            signal: 'SELL',
            confidence
          });
        }
      }
    }

    return {
      totalTrades: trades.length,
      trades,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Trade execution error:', error.message);
    return null;
  }
}

/**
 * Calculate trading metrics
 */
async function calculateTradingMetrics(trades, portfolio) {
  try {
    const buyTrades = trades.filter(t => t.side === 'buy').length;
    const sellTrades = trades.filter(t => t.side === 'sell').length;
    const avgConfidence = trades.length > 0
      ? trades.reduce((sum, t) => sum + t.confidence, 0) / trades.length
      : 0;

    const positions = portfolio.positions?.length || 0;

    return {
      totalTrades: trades.length,
      buyTrades,
      sellTrades,
      avgConfidence: avgConfidence.toFixed(2),
      positions,
      profitability: 'pending',
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Metrics error:', error.message);
    return null;
  }
}

module.exports = {
  getTechnicalIndicators,
  generateTradingSignal,
  getPortfolioSignals,
  executeSignalTrades,
  calculateTradingMetrics
};
