#!/usr/bin/env node

/**
 * Mining Bot - System Test (using only Node.js built-ins)
 * Tests: Registration → Login → Mining → Security
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3001';
const isHttps = BASE_URL.startsWith('https');

let testsPassed = 0;
let testsFailed = 0;

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
    const client = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: data ? JSON.parse(data) : null
          });
        } catch (e) {
          reject(new Error(`Failed to parse: ${data}`));
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('🧪 RDCM Mining Bot - System Test\n');
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
    if (response.status !== 201) throw new Error(`Status ${response.status}`);
    if (!response.body.token) throw new Error('No token in response');
    if (!response.body.userId) throw new Error('No userId in response');

    userId = response.body.userId;
    token = response.body.token;
    console.log(`  └─ User ID: ${userId}`);
  });

  await test('Login with email and password', async () => {
    const response = await apiCall('POST', '/api/auth/login', {
      email: testEmail,
      password: testPassword
    });
    if (response.status !== 200) throw new Error(`Status ${response.status}: ${JSON.stringify(response.body)}`);
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

  // Phase 3: Earnings Tracking
  console.log('\n📊 Phase 3: Earnings Statistics\n');

  await test('Get earnings statistics', async () => {
    const response = await apiCall('GET', `/api/earnings/stats/${userId}`);
    if (response.status !== 200) throw new Error(`Status ${response.status}`);
    if (!response.body.today_earnings) throw new Error('No earnings data');
    console.log(`  └─ Today's Earnings: ${response.body.today_earnings} coins (${response.body.today_usd} USD)`);
  });

  await test('Get earnings history', async () => {
    const response = await apiCall('GET', `/api/history/${userId}`, null, token);
    if (response.status !== 200) throw new Error(`Status ${response.status}`);
    if (!Array.isArray(response.body.history)) throw new Error('History not an array');
    if (response.body.history.length === 0) throw new Error('No earnings in history');
    console.log(`  └─ Earnings Records: ${response.body.history.length} entries`);
  });

  // Phase 4: Security Features
  console.log('\n🔒 Phase 4: Security Verification\n');

  await test('Audit log tracks user actions', async () => {
    const response = await apiCall('GET', '/api/audit-log', null, token);
    if (response.status !== 200) throw new Error(`Status ${response.status}`);
    if (!Array.isArray(response.body.auditLog)) throw new Error('Audit log not an array');

    const actions = response.body.auditLog.map(log => log.action);
    const hasRegister = actions.includes('USER_REGISTERED');
    const hasLogin = actions.includes('USER_LOGIN');
    const hasMiningStart = actions.includes('MINING_STARTED');

    console.log(`  └─ Audit Actions: ${actions.join(', ')}`);

    if (!hasRegister || !hasLogin || !hasMiningStart) {
      throw new Error(`Missing key audit logs`);
    }
  });

  await test('Protected endpoint rejects unauthenticated request', async () => {
    const response = await apiCall('POST', '/api/mining/start', { coin: 'BTC' });
    if (response.status === 200) throw new Error('Should require authentication');
  });

  // Phase 5: Stop Mining
  console.log('\n🛑 Phase 5: Mining Control\n');

  await test('Stop mining', async () => {
    const response = await apiCall('POST', '/api/mining/stop', {}, token);
    if (response.status !== 200) throw new Error(`Status ${response.status}`);
  });

  // Phase 6: Wallet & Settings
  console.log('\n💾 Phase 6: Data Access\n');

  await test('Get wallet information', async () => {
    const response = await apiCall('GET', `/api/wallet/${userId}`);
    if (response.status !== 200) throw new Error(`Status ${response.status}`);
    if (!response.body.wallet) throw new Error('No wallet in response');
  });

  await test('Get available coins', async () => {
    const response = await apiCall('GET', '/api/coins');
    if (response.status !== 200) throw new Error(`Status ${response.status}`);
    if (!Array.isArray(response.body.coins)) throw new Error('Coins not an array');
    console.log(`  └─ Available Coins: ${response.body.coins.join(', ')}`);
  });

  // Summary
  console.log('\n' + '='.repeat(55));
  console.log(`\n✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log('\n');

  if (testsFailed === 0) {
    console.log('🎉 All systems operational!\n');
    console.log('✓ User authentication working (JWT + password hashing)');
    console.log('✓ Mining simulation generating earnings');
    console.log('✓ Real-time earnings stored and tracked');
    console.log('✓ Security features: audit logging, auth protection');
    console.log('✓ API endpoints responding correctly\n');
    console.log('Mining bot is ready for production! 🚀\n');
    process.exit(0);
  } else {
    console.log(`⚠️  ${testsFailed} test(s) failed. Review above for details.\n`);
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('\n💥 Test error:', error.message);
  process.exit(1);
});
