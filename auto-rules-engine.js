// RDCM QUANTUM - Auto-Trading Rules Engine
// Automatically execute trades based on user-defined rules

const fs = require('fs');
const path = require('path');

class AutoRulesEngine {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.rulesFile = path.join(this.dataDir, 'autoRules.json');
        this.ruleHistoryFile = path.join(this.dataDir, 'ruleHistory.json');
        this.activeRules = {};
        this.loadRules();
    }

    // Load rules from database
    loadRules() {
        try {
            if (fs.existsSync(this.rulesFile)) {
                const data = fs.readFileSync(this.rulesFile, 'utf8');
                this.rules = JSON.parse(data);
            } else {
                this.rules = [];
                this.saveRules();
            }
        } catch (e) {
            console.error('Error loading rules:', e);
            this.rules = [];
        }
    }

    // Save rules to database
    saveRules() {
        try {
            fs.writeFileSync(this.rulesFile, JSON.stringify(this.rules, null, 2));
        } catch (e) {
            console.error('Error saving rules:', e);
        }
    }

    // Create a new auto-trading rule
    createRule(userId, ruleName, conditions, action) {
        const rule = {
            id: `rule_${Date.now()}`,
            userId,
            name: ruleName,
            conditions: conditions, // { symbol, type: 'price', operator: '>', value: 50000 }
            action: action, // { type: 'buy'/'sell', quantity, limitPrice }
            enabled: true,
            createdAt: new Date().toISOString(),
            executionCount: 0,
            lastExecution: null
        };

        this.rules.push(rule);
        this.saveRules();

        console.log(`✅ Auto-rule created: ${ruleName} for user ${userId}`);
        return rule;
    }

    // Get all rules for a user
    getUserRules(userId) {
        return this.rules.filter(r => r.userId === userId);
    }

    // Update a rule
    updateRule(ruleId, updates) {
        const rule = this.rules.find(r => r.id === ruleId);
        if (rule) {
            Object.assign(rule, updates);
            this.saveRules();
            return rule;
        }
        return null;
    }

    // Delete a rule
    deleteRule(ruleId) {
        this.rules = this.rules.filter(r => r.id !== ruleId);
        this.saveRules();
        console.log(`✅ Auto-rule deleted: ${ruleId}`);
        return true;
    }

    // Enable/disable a rule
    toggleRule(ruleId, enabled) {
        const rule = this.updateRule(ruleId, { enabled });
        console.log(`${enabled ? '✅ Enabled' : '⏸ Disabled'} rule: ${rule?.name}`);
        return rule;
    }

    // Check if a condition is met
    evaluateCondition(currentPrice, condition) {
        const { operator, value } = condition;

        switch (operator) {
            case '>': return currentPrice > value;
            case '<': return currentPrice < value;
            case '>=': return currentPrice >= value;
            case '<=': return currentPrice <= value;
            case '==': return currentPrice === value;
            case '!=': return currentPrice !== value;
            case 'crosses_above': return currentPrice > value; // Simplified
            case 'crosses_below': return currentPrice < value; // Simplified
            default: return false;
        }
    }

    // Execute a rule (simulate trade execution)
    executeRule(rule, currentPrice, marketConditions = {}) {
        if (!rule.enabled) return null;

        // Check if condition is met
        if (!this.evaluateCondition(currentPrice, rule.conditions)) {
            return null;
        }

        // Execute the action
        const execution = {
            ruleId: rule.id,
            executedAt: new Date().toISOString(),
            symbol: rule.conditions.symbol,
            action: rule.action.type,
            quantity: rule.action.quantity,
            executionPrice: currentPrice,
            executionTotal: currentPrice * rule.action.quantity,
            status: 'EXECUTED',
            conditions: rule.conditions
        };

        // Record execution
        rule.executionCount += 1;
        rule.lastExecution = execution.executedAt;
        this.saveRules();

        // Log to history
        this.logExecution(execution);

        console.log(`✅ Rule executed: ${rule.name} - ${rule.action.type} ${rule.action.quantity} ${rule.conditions.symbol} @ $${currentPrice}`);
        return execution;
    }

    // Log rule execution
    logExecution(execution) {
        try {
            let history = [];
            if (fs.existsSync(this.ruleHistoryFile)) {
                history = JSON.parse(fs.readFileSync(this.ruleHistoryFile, 'utf8'));
            }
            history.push(execution);
            fs.writeFileSync(this.ruleHistoryFile, JSON.stringify(history, null, 2));
        } catch (e) {
            console.error('Error logging execution:', e);
        }
    }

    // Get rule execution history
    getExecutionHistory(ruleId = null) {
        try {
            if (!fs.existsSync(this.ruleHistoryFile)) return [];
            const history = JSON.parse(fs.readFileSync(this.ruleHistoryFile, 'utf8'));
            return ruleId ? history.filter(h => h.ruleId === ruleId) : history;
        } catch (e) {
            console.error('Error reading history:', e);
            return [];
        }
    }

    // Monitor all active rules (would run periodically)
    async monitorRules(currentPrices) {
        const executions = [];

        for (const rule of this.rules.filter(r => r.enabled)) {
            const currentPrice = currentPrices[rule.conditions.symbol];
            if (currentPrice !== undefined) {
                const execution = this.executeRule(rule, currentPrice);
                if (execution) {
                    executions.push(execution);
                }
            }
        }

        return executions;
    }

    // Get rule statistics
    getStats(userId) {
        const userRules = this.getUserRules(userId);
        const totalRules = userRules.length;
        const enabledRules = userRules.filter(r => r.enabled).length;
        const totalExecutions = userRules.reduce((sum, r) => sum + r.executionCount, 0);

        return {
            totalRules,
            enabledRules,
            disabledRules: totalRules - enabledRules,
            totalExecutions,
            rules: userRules
        };
    }
}

module.exports = AutoRulesEngine;
