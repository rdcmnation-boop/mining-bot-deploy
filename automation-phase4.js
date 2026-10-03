/**
 * Phase 4: Full Automation
 * - Auto-convert mining earnings to USD
 * - Auto-invest USD in stocks
 * - Portfolio rebalancing
 * - Advanced analytics
 */

const fetch = require('node-fetch');

// Config
const UNMINEABLE_API_BASE = 'https://api.unmineable.com/v4';
const COINBASE_API_BASE = 'https://api.exchange.coinbase.com';
const ROBINHOOD_API_BASE = 'https://api.robinhood.com';

// User configs
const users = new Map();

/**
 * Fetch mining earnings from Unmineable
 */
async function getMiningEarnings(userId, unmiineableId) {
  try {
    const response = await fetch(`${UNMINEABLE_API_BASE}/me`, {
      headers: {
        'Authorization': unmiineableId
      }
    });

    if (!response.ok) throw new Error('Failed to fetch earnings');

    const data = await response.json();
    return {
      totalEarnings: data.balance,
      coin: data.main_coin,
      lastUpdate: new Date()
    };
  } catch (error) {
    console.error('Mining earnings error:', error.message);
    return null;
  }
}

/**
 * Convert crypto to USD (sell on Coinbase)
 */
async function convertToUSD(userId, coinType, amount, coinbaseApiKey, coinbaseSecret) {
  try {
    const productId = `${coinType}-USD`;

    const response = await fetch(`${COINBASE_API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'CB-ACCESS-KEY': coinbaseApiKey,
        'CB-ACCESS-TIMESTAMP': Date.now() / 1000,
        'CB-ACCESS-SIGN': '', // Implement signature if needed
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        side: 'sell',
        product_id: productId,
        size: amount,
        type: 'market'
      })
    });

    if (!response.ok) throw new Error(`Conversion failed: ${response.status}`);

    const order = await response.json();
    return {
      orderId: order.id,
      usdAmount: order.executed_value,
      status: order.status
    };
  } catch (error) {
    console.error('Conversion error:', error.message);
    return null;
  }
}

/**
 * Get USD balance from Coinbase
 */
async function getUSDBalance(coinbaseApiKey, coinbaseSecret) {
  try {
    const response = await fetch(`${COINBASE_API_BASE}/accounts`, {
      headers: {
        'CB-ACCESS-KEY': coinbaseApiKey,
        'CB-ACCESS-TIMESTAMP': Date.now() / 1000,
        'CB-ACCESS-SIGN': '',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Failed to get balance');

    const accounts = await response.json();
    const usdAccount = accounts.find(a => a.currency === 'USD');

    return usdAccount ? parseFloat(usdAccount.balance) : 0;
  } catch (error) {
    console.error('Balance error:', error.message);
    return 0;
  }
}

/**
 * Auto-invest USD in stocks (Robinhood)
 */
async function autoInvestInStocks(userId, usdAmount, robinhoodToken, strategy = 'balanced') {
  try {
    if (!robinhoodToken) throw new Error('No Robinhood token');

    // Get account
    const accountRes = await fetch(`${ROBINHOOD_API_BASE}/accounts/`, {
      headers: { 'Authorization': `Bearer ${robinhoodToken}` }
    });

    if (!accountRes.ok) throw new Error('Failed to get account');

    const accountData = await accountRes.json();
    const account = accountData.results?.[0];
    if (!account) throw new Error('No account found');

    // Strategy-based allocation
    const allocations = {
      conservative: { AAPL: 0.4, JNJ: 0.3, KO: 0.3 },
      balanced: { AAPL: 0.3, MSFT: 0.3, AMZN: 0.2, TSLA: 0.2 },
      aggressive: { TSLA: 0.3, NVDA: 0.3, AAPL: 0.2, AMD: 0.2 }
    };

    const allocation = allocations[strategy] || allocations.balanced;
    const orders = [];

    for (const [symbol, percentage] of Object.entries(allocation)) {
      const investAmount = usdAmount * percentage;

      // Get stock price (mock - use real API in production)
      const price = await getStockPrice(symbol);
      const quantity = Math.floor(investAmount / price);

      if (quantity > 0) {
        // Get instrument
        const instrumentRes = await fetch(`${ROBINHOOD_API_BASE}/instruments/?symbol=${symbol}`, {
          headers: { 'Authorization': `Bearer ${robinhoodToken}` }
        });

        if (instrumentRes.ok) {
          const instrumentData = await instrumentRes.json();
          const instrument = instrumentData.results?.[0];

          if (instrument) {
            // Place order
            const orderRes = await fetch(`${ROBINHOOD_API_BASE}/orders/`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${robinhoodToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                account: account.url,
                instrument: instrument.url,
                symbol: symbol,
                quantity: quantity,
                side: 'buy',
                type: 'market',
                time_in_force: 'gfd'
              })
            });

            if (orderRes.ok) {
              const order = await orderRes.json();
              orders.push({
                symbol,
                quantity,
                orderId: order.id,
                status: order.state
              });
            }
          }
        }
      }
    }

    return {
      totalInvested: usdAmount,
      orders,
      strategy,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Auto-invest error:', error.message);
    return null;
  }
}

/**
 * Get stock price (mock - replace with real API)
 */
async function getStockPrice(symbol) {
  // Mock prices - replace with real API call
  const prices = {
    'AAPL': 180,
    'MSFT': 380,
    'AMZN': 170,
    'TSLA': 260,
    'NVDA': 850,
    'AMD': 180,
    'JNJ': 160,
    'KO': 65
  };

  return prices[symbol] || 100;
}

/**
 * Rebalance portfolio
 */
async function rebalancePortfolio(userId, robinhoodToken, targetAllocation) {
  try {
    if (!robinhoodToken) throw new Error('No Robinhood token');

    // Get current positions
    const posRes = await fetch(`${ROBINHOOD_API_BASE}/positions/`, {
      headers: { 'Authorization': `Bearer ${robinhoodToken}` }
    });

    if (!posRes.ok) throw new Error('Failed to get positions');

    const data = await posRes.json();
    const positions = data.results || [];

    // Calculate rebalancing trades
    const trades = [];
    for (const position of positions) {
      const symbol = position.symbol;
      const currentQty = position.quantity;
      const targetQty = targetAllocation[symbol] || 0;
      const diff = targetQty - currentQty;

      if (diff !== 0) {
        trades.push({
          symbol,
          side: diff > 0 ? 'buy' : 'sell',
          quantity: Math.abs(diff)
        });
      }
    }

    return {
      symbol: 'portfolio',
      trades,
      timestamp: new Date(),
      rebalanced: trades.length > 0
    };
  } catch (error) {
    console.error('Rebalance error:', error.message);
    return null;
  }
}

/**
 * Get portfolio analytics
 */
async function getPortfolioAnalytics(userId, robinhoodToken) {
  try {
    if (!robinhoodToken) throw new Error('No Robinhood token');

    const posRes = await fetch(`${ROBINHOOD_API_BASE}/positions/`, {
      headers: { 'Authorization': `Bearer ${robinhoodToken}` }
    });

    if (!posRes.ok) throw new Error('Failed to get positions');

    const data = await posRes.json();
    const positions = data.results || [];

    let totalValue = 0;
    let totalCost = 0;

    for (const pos of positions) {
      const currentValue = pos.quantity * (await getStockPrice(pos.symbol));
      const costBasis = pos.quantity * parseFloat(pos.average_buy_price);
      totalValue += currentValue;
      totalCost += costBasis;
    }

    const gain = totalValue - totalCost;
    const gainPercent = totalCost > 0 ? (gain / totalCost) * 100 : 0;

    return {
      totalValue,
      totalCost,
      gain,
      gainPercent: gainPercent.toFixed(2),
      positions: positions.length,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Analytics error:', error.message);
    return null;
  }
}

/**
 * Run full automation cycle
 */
async function runAutomationCycle(userId, config) {
  try {
    console.log(`🚀 Starting automation cycle for ${userId}`);

    // 1. Get mining earnings
    const earnings = await getMiningEarnings(userId, config.unmiineableId);
    console.log('📊 Mining earnings:', earnings);

    if (!earnings) return { success: false, error: 'Failed to get earnings' };

    // 2. Convert to USD
    const conversion = await convertToUSD(
      userId,
      earnings.coin,
      earnings.totalEarnings,
      config.coinbaseApiKey,
      config.coinbaseSecret
    );
    console.log('💵 Conversion:', conversion);

    // 3. Get USD balance
    const usdBalance = await getUSDBalance(config.coinbaseApiKey, config.coinbaseSecret);
    console.log('💰 USD Balance:', usdBalance);

    // 4. Auto-invest in stocks
    const investment = await autoInvestInStocks(
      userId,
      usdBalance,
      config.robinhoodToken,
      config.strategy || 'balanced'
    );
    console.log('📈 Investment:', investment);

    // 5. Get portfolio analytics
    const analytics = await getPortfolioAnalytics(userId, config.robinhoodToken);
    console.log('📊 Analytics:', analytics);

    return {
      success: true,
      earnings,
      conversion,
      usdBalance,
      investment,
      analytics,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Automation cycle error:', error.message);
    return { success: false, error: error.message };
  }
}

// Export functions
module.exports = {
  getMiningEarnings,
  convertToUSD,
  getUSDBalance,
  autoInvestInStocks,
  rebalancePortfolio,
  getPortfolioAnalytics,
  runAutomationCycle
};
