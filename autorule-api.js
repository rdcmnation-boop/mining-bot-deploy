/**
 * AutoRule Trading API Endpoints
 * Integrates AutoRulesEngine with server for rule management and execution
 */

const AutoRulesEngine = require('./auto-rules-engine');
const AutoRuleBrain = require('./autorule-brain-integration');

class AutoRuleAPI {
    constructor(server) {
        this.engine = new AutoRulesEngine();
        this.brain = new AutoRuleBrain();
        this.server = server;
        this.setupRoutes();
    }

    setupRoutes() {
        // Create a new AutoRule
        this.server.post('/api/rules/create', (req, res) => {
            const { userId, ruleName, conditions, action } = req.body;

            if (!userId || !ruleName || !conditions || !action) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            try {
                const rule = this.engine.createRule(userId, ruleName, conditions, action);
                res.status(201).json({
                    success: true,
                    rule,
                    message: `✅ AutoRule "${ruleName}" created successfully`
                });
            } catch (e) {
                res.status(500).json({ error: e.message });
            }
        });

        // Get all rules for a user
        this.server.get('/api/rules', (req, res) => {
            const userId = req.query.userId;

            if (!userId) {
                return res.status(400).json({ error: 'userId query parameter required' });
            }

            try {
                const rules = this.engine.getUserRules(userId);
                res.json({
                    success: true,
                    count: rules.length,
                    rules
                });
            } catch (e) {
                res.status(500).json({ error: e.message });
            }
        });

        // Get specific rule by ID
        this.server.get('/api/rules/:ruleId', (req, res) => {
            const { ruleId } = req.params;

            try {
                const rule = this.engine.rules.find(r => r.id === ruleId);
                if (!rule) {
                    return res.status(404).json({ error: 'Rule not found' });
                }

                res.json({
                    success: true,
                    rule
                });
            } catch (e) {
                res.status(500).json({ error: e.message });
            }
        });

        // Update a rule
        this.server.put('/api/rules/:ruleId', (req, res) => {
            const { ruleId } = req.params;
            const updates = req.body;

            try {
                const rule = this.engine.updateRule(ruleId, updates);
                if (!rule) {
                    return res.status(404).json({ error: 'Rule not found' });
                }

                res.json({
                    success: true,
                    rule,
                    message: '✅ AutoRule updated successfully'
                });
            } catch (e) {
                res.status(500).json({ error: e.message });
            }
        });

        // Delete a rule
        this.server.delete('/api/rules/:ruleId', (req, res) => {
            const { ruleId } = req.params;

            try {
                const deleted = this.engine.deleteRule(ruleId);
                res.json({
                    success: deleted,
                    message: deleted ? '✅ AutoRule deleted successfully' : 'Rule not found'
                });
            } catch (e) {
                res.status(500).json({ error: e.message });
            }
        });

        // Toggle a rule on/off
        this.server.post('/api/rules/:ruleId/toggle', (req, res) => {
            const { ruleId } = req.params;
            const { enabled } = req.body;

            try {
                const rule = this.engine.toggleRule(ruleId, enabled);
                if (!rule) {
                    return res.status(404).json({ error: 'Rule not found' });
                }

                res.json({
                    success: true,
                    rule,
                    message: `${enabled ? '✅ Enabled' : '⏸ Disabled'} rule: ${rule.name}`
                });
            } catch (e) {
                res.status(500).json({ error: e.message });
            }
        });

        // Monitor and execute rules (batch evaluation)
        this.server.post('/api/rules/monitor', (req, res) => {
            const { currentPrices } = req.body;

            if (!currentPrices || typeof currentPrices !== 'object') {
                return res.status(400).json({ error: 'currentPrices object required' });
            }

            try {
                this.engine.monitorRules(currentPrices).then(executions => {
                    res.json({
                        success: true,
                        executionCount: executions.length,
                        executions
                    });
                });
            } catch (e) {
                res.status(500).json({ error: e.message });
            }
        });

        // Get execution history for a rule
        this.server.get('/api/rules/:ruleId/history', (req, res) => {
            const { ruleId } = req.params;

            try {
                const history = this.engine.getExecutionHistory(ruleId);
                res.json({
                    success: true,
                    ruleId,
                    count: history.length,
                    history
                });
            } catch (e) {
                res.status(500).json({ error: e.message });
            }
        });

        // Get rule statistics for a user
        this.server.get('/api/rules/stats/:userId', (req, res) => {
            const { userId } = req.params;

            try {
                const stats = this.engine.getStats(userId);
                res.json({
                    success: true,
                    userId,
                    stats
                });
            } catch (e) {
                res.status(500).json({ error: e.message });
            }
        });

        // Get AutoRule Brain metrics
        this.server.get('/api/rules/brain/metrics', (req, res) => {
            try {
                const metrics = this.brain.getMetrics();
                res.json({
                    success: true,
                    brain: metrics
                });
            } catch (e) {
                res.status(500).json({ error: e.message });
            }
        });

        console.log('✅ AutoRule API endpoints initialized');
    }
}

module.exports = AutoRuleAPI;
