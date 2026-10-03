# 🧠 AutoRule Quantum AI Brain - Complete Guide

## Overview

**AutoRule Quantum AI Brain** is an advanced automated trading system powered by machine learning (85.1% accuracy). It enables you to create, manage, and execute momentum-based trading rules with zero manual intervention.

- **Edition**: 2026-H2.2
- **Brain Score**: 52.75
- **Accuracy**: 85.1%
- **Trained Lessons**: 20,000
- **Model Lessons**: 60,000

## Features

✅ **Momentum Scoring (0-100)** - AI-driven price action analysis
✅ **Condition Evaluation** - Support for price comparisons and crossing patterns
✅ **Automatic Execution** - Execute trades when conditions are met
✅ **Real-time Monitoring** - Continuous rule evaluation
✅ **Execution History** - Track all rule executions
✅ **Rule Statistics** - Analyze rule performance

## Quick Start

### 1. Access the Dashboard

Open your browser and navigate to:
```
http://localhost:3000/public/autorule-dashboard.html
```

### 2. Create Your First AutoRule

1. **Rule Name**: Give your rule a name (e.g., "Bitcoin Momentum Buy")
2. **Asset Symbol**: Enter the asset (BTC, ETH, AAPL, etc.)
3. **Condition Type**: Select how to trigger the rule
4. **Operator**: Choose comparison operator (>, <, >=, <=, ==, !=)
5. **Target Price**: Set the trigger price
6. **Action Type**: BUY or SELL
7. **Quantity**: Amount to trade
8. **Limit Price**: Optional maximum price

Click **Create AutoRule** to activate.

### 3. Monitor Your Rules

The dashboard shows:
- **Total Rules**: All rules you've created
- **Enabled Rules**: Currently active rules
- **Total Executions**: How many times rules have fired
- **Disabled Rules**: Inactive rules

### 4. Manage Rules

For each rule:
- **View History** - See all executions with timestamps and prices
- **Enable/Disable** - Toggle rule on/off without deleting
- **Delete** - Permanently remove the rule

## API Reference

### Authentication
All API calls include a Bearer token (optional for demo):
```
Authorization: Bearer <token>
```

### Endpoints

#### 1. Create AutoRule
**POST** `/api/rules/create`

```json
{
  "userId": "user_123",
  "ruleName": "BTC Momentum Buy",
  "conditions": {
    "symbol": "BTC",
    "type": "price",
    "operator": ">",
    "value": 40000
  },
  "action": {
    "type": "buy",
    "quantity": 0.5,
    "limitPrice": 41000
  }
}
```

**Response:**
```json
{
  "success": true,
  "rule": {
    "id": "rule_1791062747829",
    "userId": "user_123",
    "name": "BTC Momentum Buy",
    "conditions": {...},
    "action": {...},
    "enabled": true,
    "createdAt": "2026-10-03T21:24:00.000Z",
    "executionCount": 0,
    "lastExecution": null
  }
}
```

#### 2. Get All User Rules
**GET** `/api/rules?userId=user_123`

Returns all rules for a user with counts and details.

#### 3. Get Specific Rule
**GET** `/api/rules/:ruleId`

```json
{
  "success": true,
  "rule": {...}
}
```

#### 4. Update Rule
**PUT** `/api/rules/:ruleId`

```json
{
  "conditions": {
    "value": 45000
  }
}
```

#### 5. Delete Rule
**DELETE** `/api/rules/:ruleId`

#### 6. Toggle Rule Enable/Disable
**POST** `/api/rules/:ruleId/toggle`

```json
{
  "enabled": false
}
```

#### 7. Get Execution History
**GET** `/api/rules/:ruleId/history`

Returns all executions for a rule:
```json
{
  "success": true,
  "ruleId": "rule_123",
  "count": 5,
  "history": [
    {
      "ruleId": "rule_123",
      "executedAt": "2026-10-03T21:30:00.000Z",
      "symbol": "BTC",
      "action": "buy",
      "quantity": 0.5,
      "executionPrice": 41500,
      "executionTotal": 20750,
      "status": "EXECUTED"
    }
  ]
}
```

#### 8. Get Rule Statistics
**GET** `/api/rules/stats/:userId`

```json
{
  "success": true,
  "userId": "user_123",
  "stats": {
    "totalRules": 3,
    "enabledRules": 2,
    "disabledRules": 1,
    "totalExecutions": 12,
    "rules": [...]
  }
}
```

#### 9. Monitor All Rules
**POST** `/api/rules/monitor`

Execute a price monitoring pass for all active rules:
```json
{
  "currentPrices": {
    "BTC": 45000,
    "ETH": 2800,
    "AAPL": 150
  }
}
```

**Response:**
```json
{
  "success": true,
  "executionCount": 2,
  "executions": [...]
}
```

#### 10. Get AI Brain Metrics
**GET** `/api/rules/brain/metrics`

```json
{
  "success": true,
  "brain": {
    "product": "AutoRule AI Brain",
    "edition": "2026-H2.2",
    "brain_score": 52.75,
    "accuracy": 0.851,
    "lessons_trained": 20000,
    "created": "2026-09-30T16:41:03.373Z",
    "next_edition": "2027-H1"
  }
}
```

## Condition Types

### Price-Based Conditions
```javascript
operator: '>'   // Greater than
operator: '<'   // Less than
operator: '>='  // Greater than or equal
operator: '<='  // Less than or equal
operator: '=='  // Exactly equal
operator: '!='  // Not equal
```

### Crossing Conditions
```javascript
type: 'crosses_above'  // Price crosses above value
type: 'crosses_below'  // Price crosses below value
```

## Action Types

```javascript
action: {
  type: 'buy',           // BUY order
  quantity: 1.5,         // Amount to trade
  limitPrice: 50000      // Optional limit price
}

action: {
  type: 'sell',          // SELL order
  quantity: 0.5,         // Amount to trade
  limitPrice: 42000      // Optional limit price
}
```

## Advanced Usage

### Momentum Scoring

The AI Brain scores momentum on a scale of 0-100:
- **0-30**: Bearish momentum
- **30-65**: Neutral momentum
- **65-100**: Bullish momentum

Use this for intelligent filtering of trade opportunities.

### Backtesting Strategy

1. Create a test rule with conservative settings
2. Monitor execution history for win rate
3. Adjust conditions based on performance
4. Scale up successful patterns

### Multi-Asset Trading

Create rules for different assets independently:
```
BTC Rule → Buy when > 45000
ETH Rule → Sell when < 2500
SPY Rule → Buy when crosses above 400
```

## Best Practices

1. **Start Small** - Begin with 1-2 rules
2. **Test First** - Use demo/paper trading mode
3. **Monitor History** - Review execution history weekly
4. **Adjust Gradually** - Small condition tweaks over time
5. **Diversify** - Spread across multiple assets/strategies
6. **Set Limits** - Use quantity limits to control risk

## Troubleshooting

### Rule Not Executing
- ✅ Check if rule is **Enabled**
- ✅ Verify current price meets **Condition**
- ✅ Ensure sufficient **Quantity** for action

### No Execution History
- ✅ Rule may not have triggered yet
- ✅ Check condition parameters
- ✅ Verify asset symbol is correct

### High Execution Count
- ✅ Condition may be too broad
- ✅ Tighten price range
- ✅ Consider adding time delays between executions

## Examples

### Bitcoin Dollar-Cost Averaging
```
Rule Name: BTC DCA Weekly
Symbol: BTC
Condition: < 50000
Action: BUY 0.1 BTC
Result: Buy when price dips below $50k
```

### Ethereum Profit Taking
```
Rule Name: ETH Profit at 3000
Symbol: ETH
Condition: >= 3000
Action: SELL 1.0 ETH
Result: Sell entire position at $3k
```

### Support/Resistance Bounce
```
Rule Name: SPY Support Bounce
Symbol: SPY
Condition: crosses_above 400
Action: BUY 10 shares
Result: Buy on support level breakout
```

## Performance Metrics

Check your performance:
```
Average Executions per Rule: (Total Executions / Total Rules)
Win Rate: (Profitable Trades / Total Trades)
Most Active Rule: (Highest Execution Count)
```

## Support

For issues or feature requests:
- Check `/data/autoRules.json` for rule storage
- Review `/data/ruleHistory.json` for execution logs
- Verify server is running: `curl http://localhost:3000/health`

## Version History

- **v2.1** (Current) - Quantum AI Brain Integration
  - 85.1% accuracy
  - 20,000 trained lessons
  - Real-time monitoring
  - Full API support

- **v2.0** - Initial AutoRule Release
- **v1.0** - Basic trading functionality

---

**Ready to trade with AI?** Open the dashboard and create your first AutoRule! 🚀
