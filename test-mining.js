#!/usr/bin/env node

/**
 * Mining Bot - Comprehensive System Test
 * Tests: Registration → Login → Mining Start → Earnings Broadcasting → Security
 */

const http = require('http');
const WebSocket = require('ws');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3001';
const WS_URL = BASE_URL.replace('http', 'ws');

let testsPassed = 0;
let testsFailed = 0;

// Test utilities
function test(name, fn) {
  return fn()
    .then(() => {
      console.log(`✓ ${name}`);
      testsPassed++;
    })
    .catch((error) => {
      console.error(`✗ ${name}`);
      console.error(`  Error: ${error.message}`);
      testsFailed++;
    });
}

async function apiCall(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            body: data ? JSON.parse(data) : null,
            headers: res.headers
          };
          resolve(response);
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function connectWebSocket(userId, token) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('WebSocket connection timeout'));
    }, 5000);

    const url = `${WS_URL}/mining-updates?userId=${userId}`;
    const ws = new WebSocket(url, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });

    ws.on('open', () => {
      clearTimeout(timeout);
      resolve(ws);
    });

    ws.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

// Main test suite
async function runTests() {
  console.log('🧪 RDCM Mining Bot - Comprehensive System Test\n');
  console.log(`Testing: ${BASE_URL}\n`);

  let userId, token;
  const testEmail = `test-${Date.now()}@rdcm.bot`;
  const testPassword = 'TestPassword123';

  // Phase 1: Authentication
  console.log('📝 Phase 1: Authentication\n');

  await test('Register new user', async () => {
    const response = await apiCall('POST', '/api/auth/register', {
      email: testEmail,
      password: testPassword
    });
    if (response.status !== 201) throw new Error(`Status ${response.status}: ${JSON.stringify(response.body)}`);
    if (!response.body.token) throw new Error('No token in response');
    if (!response.body.userId) throw new Error('No userId in response');

    userId = response.body.userId;
    token = response.body.token;
  });

  await test('Login with email and password', async () => {
    const response = await apiCall('POST', '/api/auth/login', {
      email: testEmail,
      password: testPassword
    });
    if (response.status !== 200) throw new Error(`Status ${response.status}`);
    if (!response.body.token) throw new Error('No token in response');

    token = response.body.token;
  });

  await test('Reject login with wrong password', async () => {
    const response = await apiCall('POST', '/api/auth/login', {
      email: testEmail,
      password: 'WrongPassword'
    });
    if (response.status === 200) throw new Error('Should reject wrong password');
  });

  // Phase 2: Mining Control
  console.log('\n⛏️  Phase 2: Mining Control\n');

  await test('Start mining (requires auth)', async () => {
    const response = await apiCall('POST', '/api/mining/start',
      { coin: 'DOGE' },
      token
    );
    if (response.status !== 200) throw new Error(`Status ${response.status}: ${JSON.stringify(response.body)}`);
    if (response.body.status !== 'active') throw new Error('Mining not marked as active');
  });

  await test('Get mining status', async () => {
    const response = await apiCall('GET', `/api/mining/status/${userId}`);
    if (response.status !== 200) throw new Error(`Status ${response.status}`);
    if (!response.body.status) throw new Error('No status in response');
  });

  // Phase 3: Real-time Earnings Broadcast
  console.log('\n💰 Phase 3: Real-time Earnings Broadcasting\n');

  let earningsReceived = 0;
  let totalEarnings = 0;

  await test('Receive earnings via WebSocket (wait 15 seconds)', async () => {
    const ws = await connectWebSocket(userId, token);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close();
        if (earningsReceived < 2) {
          reject(new Error(`Expected at least 2 earnings updates, got ${earningsReceived}`));
        } else {
          resolve();
        }
      }, 15000);

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);

          if (message.type === 'connected') {
            console.log(`  └─ Connected: ${message.message}`);
          }

          if (message.type === 'earnings_update') {
            earningsReceived++;
            const earnings = parseFloat(message.earnings);
            totalEarnings += earnings;
            console.log(`  └─ Earnings #${earningsReceived}: ${message.earnings} coins (${message.usdValue} USD)`);

            if (earningsReceived >= 2) {
              clearTimeout(timeout);
              ws.close();
              resolve();
            }
          }
        } catch (e) {
          console.error('Message parse error:', e);
        }
      });

      ws.on('error', reject);
    });
  });

  // Phase 4: Earnings Tracking
  console.log('\n📊 Phase 4: Earnings Statistics\n');

  await test('Get earnings statistics', async () => {
    const response = await apiCall('GET', `/api/earnings/stats/${userId}`);
    if (response.status !== 200) throw new Error(`Status ${response.status}`);
    if (!response.body.today_earnings) throw new Error('No earnings data');
  });

  await test('Get earnings history', async () => {
    const response = await apiCall('GET', `/api/history/${userId}`, null, token);
    if (response.status !== 200) throw new Error(`Status ${response.status}`);
    if (!Array.isArray(response.body.history)) throw new Error('History not an array');
    if (response.body.history.length === 0) throw new Error('No earnings in history');
  });

  // Phase 5: Security Features
  console.log('\n🔒 Phase 5: Security Verification\n');

  await test('Audit log tracks user actions', async () => {
    const response = await apiCall('GET', '/api/audit-log', null, token);
    if (response.status !== 200) throw new Error(`Status ${response.status}`);
    if (!Array.isArray(response.body.auditLog)) throw new Error('Audit log not an array');

    const actions = response.body.auditLog.map(log => log.action);
    const hasRegister = actions.includes('USER_REGISTERED');
    const hasLogin = actions.includes('USER_LOGIN');
    const hasMiningStart = actions.includes('MINING_STARTED');

    if (!hasRegister || !hasLogin || !hasMiningStart) {
      throw new Error(`Missing audit logs. Found: ${actions.join(', ')}`);
    }
  });

  await test('Protected endpoint rejects unauthenticated request', async () => {
    const response = await apiCall('POST', '/api/mining/start', { coin: 'BTC' });
    if (response.status === 200) throw new Error('Should require authentication');
  });

  // Phase 6: Stop Mining
  console.log('\n🛑 Phase 6: Mining Control\n');

  await test('Stop mining', async () => {
    const response = await apiCall('POST', '/api/mining/stop', {}, token);
    if (response.status !== 200) throw new Error(`Status ${response.status}`);
  });

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`\n✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`\n💰 Total Earnings Received: ${totalEarnings.toFixed(6)} coins`);
  console.log(`📈 Average Earnings Per Update: ${(totalEarnings / earningsReceived).toFixed(6)} coins\n`);

  if (testsFailed === 0) {
    console.log('🎉 All systems operational! Mining bot is ready for production.\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please review above.\n');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('\n💥 Test suite error:', error.message);
  process.exit(1);
});
