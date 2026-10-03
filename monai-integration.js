/**
 * Monai.live Integration
 * Connect personal finance tracking with trading portfolio
 * Voice-based expense logging with AI-powered budget optimization
 */

class MonaiIntegration {
  constructor(userId, config = {}) {
    this.userId = userId;
    this.apiEndpoint = 'https://monai.live/api';
    this.config = {
      autoSync: config.autoSync || true,
      syncInterval: config.syncInterval || 300000, // 5 minutes
      ...config
    };

    this.expenses = [];
    this.balances = {};
    this.categories = {};
    this.insights = {};
  }

  /**
   * Sync expense data from Monai
   */
  async syncExpenses() {
    try {
      // Note: This would connect to real Monai API in production
      const expenses = await this.fetchExpensesFromMonai();
      this.expenses = expenses;
      return {
        success: true,
        recordsSync: expenses.length,
        lastSync: new Date(),
        totalExpenses: this.calculateTotalExpenses(expenses)
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Fetch expenses from Monai API
   */
  async fetchExpensesFromMonai() {
    // Demo expense data - replace with real API call
    return [
      {
        id: 'exp_1',
        date: new Date(Date.now() - 86400000),
        category: 'Groceries',
        amount: 65.50,
        description: 'Weekly grocery shopping',
        voiceLogged: true
      },
      {
        id: 'exp_2',
        date: new Date(Date.now() - 172800000),
        category: 'Dining Out',
        amount: 45.00,
        description: 'Lunch with team',
        voiceLogged: true
      },
      {
        id: 'exp_3',
        date: new Date(Date.now() - 259200000),
        category: 'Transportation',
        amount: 12.50,
        description: 'Uber ride',
        voiceLogged: true
      },
      {
        id: 'exp_4',
        date: new Date(Date.now() - 345600000),
        category: 'Entertainment',
        amount: 29.99,
        description: 'Netflix subscription',
        voiceLogged: false
      },
      {
        id: 'exp_5',
        date: new Date(Date.now() - 432000000),
        category: 'Utilities',
        amount: 89.75,
        description: 'Monthly internet',
        voiceLogged: false
      }
    ];
  }

  /**
   * Get expense breakdown by category
   */
  getExpensesByCategory() {
    const byCategory = {};

    this.expenses.forEach(expense => {
      if (!byCategory[expense.category]) {
        byCategory[expense.category] = {
          total: 0,
          count: 0,
          average: 0,
          transactions: []
        };
      }

      byCategory[expense.category].total += expense.amount;
      byCategory[expense.category].count++;
      byCategory[expense.category].transactions.push(expense);
    });

    // Calculate averages
    Object.keys(byCategory).forEach(category => {
      byCategory[category].average = byCategory[category].total / byCategory[category].count;
    });

    return byCategory;
  }

  /**
   * Get monthly spending trend
   */
  getMonthlySpending() {
    const months = {};
    const today = new Date();

    for (let i = 0; i < 12; i++) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = month.toISOString().slice(0, 7); // YYYY-MM

      months[monthKey] = {
        total: 0,
        transactions: [],
        budget: 1500 // Default monthly budget
      };
    }

    this.expenses.forEach(expense => {
      const monthKey = expense.date.toISOString().slice(0, 7);
      if (months[monthKey]) {
        months[monthKey].total += expense.amount;
        months[monthKey].transactions.push(expense);
      }
    });

    return months;
  }

  /**
   * Calculate total expenses
   */
  calculateTotalExpenses(expenses) {
    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
  }

  /**
   * Get budget recommendations based on trading portfolio
   */
  getBudgetOptimization(portfolio) {
    const monthlyExpenses = this.getMonthlySpending();
    const currentMonth = new Date().toISOString().slice(0, 7);
    const thisMonth = monthlyExpenses[currentMonth];

    const portfolioValue = portfolio.totalValue || 100000;
    const recommendedMonthlyExpenses = portfolioValue * 0.02; // 2% per month
    const tradingIncome = portfolio.monthlyProfit || 0;

    return {
      currentMonthlyExpenses: thisMonth.total,
      recommendedMonthlyExpenses: recommendedMonthlyExpenses.toFixed(2),
      tradingIncomeThisMonth: tradingIncome,
      remainingBudget: (recommendedMonthlyExpenses - thisMonth.total).toFixed(2),
      budgetUtilization: ((thisMonth.total / recommendedMonthlyExpenses) * 100).toFixed(1) + '%',
      optimization: {
        groceries: 'On target - continue current spending',
        dining: 'Opportunity to reduce by $20-30/month',
        entertainment: 'Flexible - can increase if trading profits grow',
        transportation: 'Consider weekly budget of $3/day'
      },
      alerts: [
        thisMonth.total > recommendedMonthlyExpenses ? '⚠️ Over budget this month' : '✅ Within budget',
        tradingIncome > thisMonth.total ? '💰 Trading profits exceed expenses' : '⚠️ Need to increase trading profits'
      ]
    };
  }

  /**
   * Integrate expense tracking with investment allocation
   */
  getFinancialHealth(portfolio) {
    const categories = this.getExpensesByCategory();
    const monthlySpend = Object.values(categories).reduce((sum, cat) => sum + cat.total, 0);

    return {
      portfolioHealth: {
        value: portfolio.totalValue,
        dailyChange: portfolio.dailyPnL,
        winRate: portfolio.winRate,
        riskLevel: this.calculateRiskLevel(portfolio)
      },
      expenseHealth: {
        monthlyExpenses: monthlySpend,
        topCategories: Object.entries(categories)
          .sort((a, b) => b[1].total - a[1].total)
          .slice(0, 3)
          .map(([cat, data]) => ({ category: cat, amount: data.total.toFixed(2) })),
        spendingTrend: this.calculateSpendingTrend()
      },
      integration: {
        expenseCoverageRatio: (portfolio.dailyPnL / (monthlySpend / 30)).toFixed(2),
        financialFreedomScore: this.calculateFinancialFreedom(portfolio, monthlySpend),
        recommendation: this.getFinancialRecommendation(portfolio, monthlySpend)
      },
      voiceLoggingStats: {
        totalLogged: this.expenses.filter(e => e.voiceLogged).length,
        voicePercentage: ((this.expenses.filter(e => e.voiceLogged).length / this.expenses.length) * 100).toFixed(1) + '%'
      }
    };
  }

  /**
   * Calculate financial freedom score (0-100)
   */
  calculateFinancialFreedom(portfolio, monthlyExpenses) {
    const passiveIncome = portfolio.totalPnL / 12; // Annualized to monthly
    const expensesCovered = passiveIncome / monthlyExpenses;

    if (expensesCovered >= 1) return 100;
    if (expensesCovered >= 0.75) return 80;
    if (expensesCovered >= 0.5) return 60;
    if (expensesCovered >= 0.25) return 40;
    return 20;
  }

  /**
   * Calculate risk level
   */
  calculateRiskLevel(portfolio) {
    const drawdownPercent = Math.abs(portfolio.dailyPnL / portfolio.totalValue) * 100;

    if (drawdownPercent > 5) return 'HIGH';
    if (drawdownPercent > 2) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Calculate spending trend
   */
  calculateSpendingTrend() {
    const months = this.getMonthlySpending();
    const monthValues = Object.values(months);

    if (monthValues.length < 2) return 'insufficient data';

    const recent = monthValues[0].total;
    const previous = monthValues[1].total;
    const change = ((recent - previous) / previous) * 100;

    if (change > 10) return 'increasing ⬆️';
    if (change < -10) return 'decreasing ⬇️';
    return 'stable →';
  }

  /**
   * Get financial recommendation
   */
  getFinancialRecommendation(portfolio, monthlyExpenses) {
    const ratio = portfolio.dailyPnL * 30 / monthlyExpenses;

    if (ratio >= 2) {
      return '🎯 Excellent! Trading profits significantly exceed expenses. Consider increasing investment allocation.';
    } else if (ratio >= 1) {
      return '✅ Good! Trading profits cover all expenses. Continue current strategy.';
    } else if (ratio >= 0.5) {
      return '⚠️ Fair. Trading profits cover ~50% of expenses. Focus on increasing win rate or reducing expenses.';
    } else {
      return '❌ Trading profits insufficient. Reduce expenses or improve trading accuracy.';
    }
  }

  /**
   * Export integrated financial report (CSV)
   */
  exportFinancialReport(portfolio) {
    const report = {
      timestamp: new Date().toISOString(),
      portfolio: portfolio,
      expenses: this.expenses,
      categories: this.getExpensesByCategory(),
      health: this.getFinancialHealth(portfolio)
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * Start auto-sync with Monai
   */
  startAutoSync() {
    if (!this.config.autoSync) return null;

    return setInterval(() => {
      this.syncExpenses();
    }, this.config.syncInterval);
  }

  /**
   * Stop auto-sync
   */
  stopAutoSync(intervalId) {
    clearInterval(intervalId);
  }
}

module.exports = MonaiIntegration;
