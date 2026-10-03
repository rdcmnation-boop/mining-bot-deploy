# 🚀 RDCM Trading Platform - Production Deployment Guide

## System Overview

**Frontend:** HTML5/CSS3/JavaScript (Static)  
**Backend:** Node.js (server-minimal.js)  
**Database:** In-memory (ready for PostgreSQL/MongoDB upgrade)  
**AI Engine:** Quantum Brain (built-in)  
**Authentication:** JWT tokens

---

## Option 1: Deploy Frontend to Vercel (Recommended)

### Step 1: Prepare Frontend Files
```bash
# All files are in /public/
# No build step needed - pure static HTML/CSS/JS
```

### Step 2: Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from project root
vercel --prod

# Select:
# - Project name: rdcm-trading
# - Framework: Other
# - Root directory: ./public
```

**Frontend URL:** `https://rdcm-trading.vercel.app`

---

## Option 2: Deploy Backend to Heroku (Node.js)

### Step 1: Create Heroku App
```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create rdcm-trading-api

# Set buildpack (Node.js)
heroku buildpacks:set heroku/nodejs
```

### Step 2: Configure Environment Variables
```bash
heroku config:set NODE_ENV=production
```

### Step 3: Deploy
```bash
git push heroku main
```

**Backend URL:** `https://rdcm-trading-api.herokuapp.com`

---

## Option 3: Deploy Both to Railway (All-in-One)

### Step 1: Connect Repository
1. Go to railway.app
2. Create new project
3. Connect GitHub repository (rdcmnation-boop/rdcm-saas-live)

### Step 2: Configure Services

**Frontend Service:**
- Build Command: `echo "No build needed"`
- Start Command: `npx serve -s public -l 3000`

**Backend Service:**
- Build Command: `npm install`
- Start Command: `node server-minimal.js`

### Step 3: Deploy
- Railway auto-deploys on push to main

**URLs:**
- Frontend: `https://rdcm-trading-frontend.railway.app`
- Backend: `https://rdcm-trading-api.railway.app`

---

## Option 4: Deploy to AWS (Production)

### Frontend to S3 + CloudFront

```bash
# Upload public folder to S3
aws s3 sync public/ s3://rdcm-trading-frontend/ --delete

# Set CloudFront distribution
# URL: https://d123.cloudfront.net
```

### Backend to EC2 + PM2

```bash
# On EC2 instance:
git clone https://github.com/rdcmnation-boop/rdcm-saas-live.git
cd rdcm-saas-live
npm install -g pm2
pm2 start server-minimal.js --name "rdcm-api"
pm2 save
pm2 startup
```

---

## Post-Deployment Configuration

### 1. Update Frontend API Base URL

In each HTML file, update the API endpoint:

```javascript
// OLD (localhost)
const API_BASE = 'http://localhost:3000';

// NEW (production)
const API_BASE = 'https://rdcm-trading-api.herokuapp.com';
```

Files to update:
- `public/index.html`
- `public/bot-control.html`
- `public/hub.html`

### 2. Enable CORS on Backend

In `server-minimal.js`, update:

```javascript
// Add CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};
```

### 3. Update Database (Optional)

For production data persistence:

**PostgreSQL:**
```bash
# Create connection string
DATABASE_URL=postgresql://user:password@host:5432/rdcm_db

# Update server-minimal.js to use pg
npm install pg
```

**MongoDB:**
```bash
# Create connection string
MONGODB_URL=mongodb+srv://user:password@cluster.mongodb.net/rdcm

# Update server-minimal.js to use mongoose
npm install mongoose
```

---

## Deployment Checklist

- [ ] Create GitHub repository (rdcm-saas-live)
- [ ] Push code to main branch
- [ ] Update API endpoints in HTML files
- [ ] Add environment variables
- [ ] Test all endpoints
- [ ] Enable CORS headers
- [ ] Set up SSL/HTTPS
- [ ] Configure domain (rdcm.com)
- [ ] Set up monitoring/logging
- [ ] Enable analytics
- [ ] Configure email notifications
- [ ] Set up automated backups
- [ ] Create CI/CD pipeline

---

## Domain Setup

### Point Domain to Vercel (Frontend)
```
CNAME: cname.vercel-dns.com
```

### Point Domain to Heroku (Backend)
```
DNS Record: api.rdcm.com → rdcm-trading-api.herokuapp.com
```

---

## Monitoring & Health Checks

**Health Check Endpoint:**
```
GET /health
Response: { status, version, features }
```

**Monitor URLs:**
- Frontend: `https://rdcm-trading.vercel.app`
- Backend: `https://rdcm-trading-api.herokuapp.com/health`

---

## Cost Estimates (Monthly)

| Service | Cost | Notes |
|---------|------|-------|
| Vercel Frontend | Free | (Up to 100GB bandwidth) |
| Heroku Backend | $7-50 | (Depending on dyno type) |
| Railway | $5-50 | (Pay-as-you-go) |
| AWS EC2 | $10-100 | (Depends on instance type) |
| PostgreSQL | $15+ | (Add-on to Heroku) |
| Domain | $12/yr | (AWS Route 53 or Namecheap) |

---

## Quick Start (5 Minutes)

### Fastest Deployment: Vercel + Heroku

```bash
# 1. Deploy frontend to Vercel
vercel --prod

# 2. Deploy backend to Heroku
heroku create rdcm-trading-api
git push heroku main

# 3. Update API endpoints in HTML

# 4. Done! 🚀
```

---

## Troubleshooting

**CORS Errors:**
- Add CORS headers to server-minimal.js
- Allow frontend domain in Access-Control-Allow-Origin

**API 404 Errors:**
- Verify backend is running
- Check API_BASE URL in HTML files
- Test endpoints: `curl https://api.rdcm.com/health`

**SSL/HTTPS Issues:**
- Vercel handles SSL automatically
- Heroku provides free SSL via certificate add-on
- Enable Automatic Certificate Management (ACM)

---

## Production Security Checklist

- [ ] Enable HTTPS/SSL everywhere
- [ ] Add rate limiting to APIs
- [ ] Implement JWT expiration (1 hour)
- [ ] Add request logging
- [ ] Enable CORS restrictions
- [ ] Hash passwords (if storing users)
- [ ] Add brute-force protection
- [ ] Enable audit logging
- [ ] Set up DDoS protection (Cloudflare)
- [ ] Regular security audits

---

## Next Steps After Deployment

1. **Monitor Performance**
   - Set up error tracking (Sentry)
   - Add analytics (Mixpanel)
   - Monitor API latency

2. **Scale Backend**
   - Add load balancer
   - Enable caching (Redis)
   - Optimize database queries

3. **Add Features**
   - Real broker API integration
   - WebSocket real-time updates
   - Database persistence
   - User authentication improvements

4. **Marketing**
   - SEO optimization
   - Social media presence
   - Email newsletter
   - Affiliate program

---

## Support

For issues during deployment, check:
- Logs: `vercel logs` or `heroku logs --tail`
- Health endpoint: `/health`
- CORS configuration
- Environment variables
- API endpoint URLs
