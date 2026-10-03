# 🚀 RDCMNATION QUANTUM - Production Backend API Docs

**Server**: `server-production.js` (Pure Node.js, Zero Dependencies)  
**Version**: 2.0.0  
**Owner**: Admin Account Only  
**Database**: File-based JSON (`/data` directory)

---

## 🔐 Authentication

All endpoints (except `/health`, `/api/auth/*`) require a Bearer token.

### Get Token

```bash
# User Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Response:
{
  "success": true,
  "userId": "uuid",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

# Owner Login (admin only)
curl -X POST http://localhost:3000/api/auth/owner-login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@rdcmnation.com","password":"owner123"}'
```

### Use Token

```bash
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/users/me
```

---

## 📋 API Endpoints

### 🏥 Health & Status

#### GET `/health`
```bash
curl http://localhost:3000/health

# Response: 200 OK
{
  "status": "online",
  "service": "RDCM Quantum Backend",
  "version": "2.0.0",
  "timestamp": "2026-10-03T20:47:02.457Z",
  "uptime": 1.959
}
```

---

### 🔐 Authentication Endpoints

#### POST `/api/auth/register`
Create a new user account.

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "securePassword123",
    "name": "John Trader"
  }'

# Response: 200 OK
{
  "success": true,
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

# Response: 409 Conflict (if user exists)
{
  "error": "User already exists",
  "details": ""
}
```

#### POST `/api/auth/login`
Login with email and password.

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Response: 200 OK
{
  "success": true,
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

# Response: 401 Unauthorized
{
  "error": "Invalid credentials"
}
```

#### POST `/api/auth/owner-login`
Owner/admin login (restricted).

```bash
curl -X POST http://localhost:3000/api/auth/owner-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@rdcmnation.com",
    "password": "owner123"
  }'

# Response: 200 OK
{
  "success": true,
  "isOwner": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 👤 User Endpoints

#### GET `/api/users/me`
Get current logged-in user profile.

```bash
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer <token>"

# Response: 200 OK
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "John Trader",
  "plan": "free",
  "bots": [],
  "totalTrades": 0,
  "totalPnL": 0,
  "isOwner": false,
  "createdAt": "2026-10-03T20:47:02.457Z"
}
```

#### GET `/api/users`
List all users (own data only, unless owner).

```bash
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer <token>"

# Response: 200 OK
{
  "users": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "John Trader",
      "plan": "free"
    }
  ],
  "total": 1
}
```

---

### 🤖 Bot Endpoints

#### POST `/api/bots/create`
Create a new trading bot.

```bash
curl -X POST http://localhost:3000/api/bots/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Quantum Bot 1",
    "type": "quantum",
    "config": {
      "accuracy": "99%+",
      "interval": 5,
      "confidence": 75
    }
  }'

# Response: 200 OK
{
  "success": true,
  "bot": {
    "id": "bot-uuid-123",
    "userId": "user-uuid",
    "name": "Quantum Bot 1",
    "type": "quantum",
    "status": "idle",
    "signals": 0,
    "trades": 0,
    "winRate": 0,
    "pnl": 0,
    "createdAt": "2026-10-03T20:47:02.457Z"
  }
}
```

#### GET `/api/bots`
List all bots for current user.

```bash
curl http://localhost:3000/api/bots \
  -H "Authorization: Bearer <token>"

# Response: 200 OK
{
  "bots": [
    {
      "id": "bot-uuid-123",
      "name": "Quantum Bot 1",
      "type": "quantum",
      "status": "idle",
      "signals": 0,
      "trades": 0
    }
  ],
  "total": 1
}
```

#### POST `/api/bots/start`
Start a bot.

```bash
curl -X POST http://localhost:3000/api/bots/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"botId": "bot-uuid-123"}'

# Response: 200 OK
{
  "success": true,
  "bot": {
    "id": "bot-uuid-123",
    "status": "running",
    "startedAt": "2026-10-03T20:47:02.457Z"
  }
}
```

#### POST `/api/bots/stop`
Stop a bot.

```bash
curl -X POST http://localhost:3000/api/bots/stop \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"botId": "bot-uuid-123"}'

# Response: 200 OK
{
  "success": true,
  "bot": {
    "id": "bot-uuid-123",
    "status": "idle",
    "stoppedAt": "2026-10-03T20:47:02.457Z"
  }
}
```

---

### 💰 Trading Endpoints

#### POST `/api/trades/execute`
Execute a trade.

```bash
curl -X POST http://localhost:3000/api/trades/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "botId": "bot-uuid-123",
    "symbol": "AAPL",
    "action": "BUY",
    "price": 150.25,
    "amount": 10
  }'

# Response: 200 OK
{
  "success": true,
  "trade": {
    "id": "trade-uuid",
    "botId": "bot-uuid-123",
    "symbol": "AAPL",
    "action": "BUY",
    "price": 150.25,
    "amount": 10,
    "status": "filled",
    "pnl": 0,
    "createdAt": "2026-10-03T20:47:02.457Z"
  }
}
```

#### GET `/api/trades`
Get all trades for current user.

```bash
curl http://localhost:3000/api/trades \
  -H "Authorization: Bearer <token>"

# Response: 200 OK
{
  "trades": [
    {
      "id": "trade-uuid",
      "botId": "bot-uuid",
      "symbol": "AAPL",
      "action": "BUY",
      "price": 150.25,
      "amount": 10,
      "status": "filled",
      "pnl": 150
    }
  ],
  "total": 1
}
```

---

### 📊 Dashboard Endpoints

#### GET `/api/dashboard`
Get user dashboard metrics.

```bash
curl http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer <token>"

# Response: 200 OK
{
  "user": {
    "name": "John Trader",
    "email": "user@example.com",
    "plan": "free"
  },
  "stats": {
    "activeBots": 1,
    "totalBots": 2,
    "totalTrades": 15,
    "totalPnL": 1250.50
  }
}
```

---

### 👑 Owner/Admin Endpoints (Owner Only)

#### GET `/api/owner/stats`
Platform statistics (owner only).

```bash
curl http://localhost:3000/api/owner/stats \
  -H "Authorization: Bearer <owner-token>"

# Response: 200 OK
{
  "totalUsers": 47,
  "activeBots": 128,
  "totalBots": 245,
  "totalTrades": 12847,
  "avgWinRate": "73.2%"
}
```

#### GET `/api/owner/users`
List all platform users (owner only).

```bash
curl http://localhost:3000/api/owner/users \
  -H "Authorization: Bearer <owner-token>"

# Response: 200 OK
{
  "users": [
    {
      "id": "user-uuid",
      "email": "user1@example.com",
      "name": "Trader 1",
      "plan": "pro",
      "totalTrades": 123,
      "totalPnL": 5230
    },
    {
      "id": "user-uuid-2",
      "email": "user2@example.com",
      "name": "Trader 2",
      "plan": "free",
      "totalTrades": 45,
      "totalPnL": 1200
    }
  ],
  "total": 2
}
```

#### GET `/api/owner/system`
System information and logs (owner only).

```bash
curl http://localhost:3000/api/owner/system \
  -H "Authorization: Bearer <owner-token>"

# Response: 200 OK
{
  "settings": {
    "platform_name": "RDCMNATION QUANTUM",
    "version": "2.0.0",
    "uptime_start": "2026-10-03T20:47:02.457Z",
    "total_trades": 12847,
    "total_revenue": 84500
  },
  "recentLogs": [
    {
      "timestamp": "2026-10-03T20:47:15.123Z",
      "action": "user_registered",
      "user": "newuser@example.com",
      "details": { "userId": "uuid" }
    }
  ],
  "nodeVersion": "v18.0.0",
  "uptime": 3600
}
```

---

## 🔑 Test Credentials

### User Account
```
Email: test@example.com
Password: test123
```

### Owner Account
```
Email: admin@rdcmnation.com
Password: owner123
```

---

## 🗄️ Database Structure

```
/data/
├── users.json       # User accounts, plans, bots list
├── bots.json        # Bot configurations & status
├── trades.json      # Trade history & P&L
├── logs.json        # Audit trail of all actions
└── settings.json    # Platform settings & stats
```

---

## 🔒 Security Features

✅ **JWT Tokens** - 30-day expiration  
✅ **Password Hashing** - SHA256 with salt  
✅ **Owner Verification** - Admin endpoints protected  
✅ **Input Validation** - All endpoints validate input  
✅ **Audit Logging** - All actions logged  
✅ **CORS Headers** - Cross-origin support  
✅ **Request Size Limits** - 1MB max  

---

## ⚠️ Error Responses

All errors follow this format:

```json
{
  "error": "Error Type",
  "details": "Detailed explanation",
  "timestamp": "2026-10-03T20:47:02.457Z"
}
```

### Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden (Owner Only)
- `404` - Not Found
- `409` - Conflict (Duplicate User)
- `500` - Server Error

---

## 🚀 Deployment

Start the production server:

```bash
node server-production.js
```

Or with environment variables:

```bash
NODE_ENV=production PORT=3000 node server-production.js
```

Deploy to Railway.app, Vercel, or any Node.js hosting:

```bash
git push origin main  # Triggers CI/CD
```

---

## 📞 Support

For issues, check:
1. `/health` endpoint for server status
2. `/data/logs.json` for audit trail
3. Console output for error messages

---

**Built with ❤️ using Node.js | RDCMNATION QUANTUM v2.0.0**
