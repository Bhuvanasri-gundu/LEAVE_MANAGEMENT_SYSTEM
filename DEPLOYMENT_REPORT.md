# DEPLOYMENT REPORT
## Backend (Render) + Frontend (Vercel) Configuration

---

## 1. DEPLOYMENT ARCHITECTURE

### Infrastructure Overview

```
┌─────────────────────────────────────┐
│   Frontend (React + Vite)           │
│   Hosted on: Vercel                 │
│   URL: leave-management-system...   │
│   Branch: main (auto-deploy)        │
└──────────────┬──────────────────────┘
               │ HTTPS
               │ Axios with JWT
               │
┌──────────────┴──────────────────────┐
│   Backend (Node.js + Express)       │
│   Hosted on: Render                 │
│   URL: leave-management-system-     │
│         backend-mg2o.onrender.com   │
│   Port: 5000                        │
│   Environment: production           │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│   Database (MongoDB Atlas)          │
│   Cluster: cloud-hosted             │
│   Region: US (optimized)            │
│   Backups: daily automated          │
└─────────────────────────────────────┘
```

---

## 2. BACKEND DEPLOYMENT (RENDER)

### Prerequisites

- Node.js application ready
- MongoDB Atlas database configured
- Environment variables prepared
- GitHub repository connected

### Render Deployment Steps

**1. Create New Service:**
- Visit render.com/dashboard
- Click "New +" → "Web Service"
- Connect GitHub repository
- Select Leave Management System repo

**2. Configure Service:**

| Setting | Value |
|---------|-------|
| **Name** | leave-management-system-backend |
| **Environment** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` (or `node server.js`) |
| **Plan** | Starter (free) or Pro |
| **Auto-deploy** | ✅ Enabled on main branch |

### Set Environment Variables

Open Render dashboard → Environment → Add variables:

**Critical Variables:**
- MONGO_URI: Database connection string
- JWT_SECRET: Secret key for token signing
- JWT_EXPIRES_IN: Token expiration time (e.g., 7d)
- PORT: Server port (typically 5000)
- NODE_ENV: Set to "production"
- CLIENT_URL: Frontend URL (CRITICAL for CORS)

### Critical: CLIENT_URL Variable

**⚠️ MOST IMPORTANT FOR CORS:**

This variable must match your exact Vercel frontend URL.

**Correct Examples:**
- https://leave-management-system-topaz.vercel.app
- https://leave-management-system.vercel.app

**Incorrect Examples:**
- https://vercel.app (too broad)
- leave-management-system.vercel.app (missing https)
- Missing entirely (CORS will fail)

**Why:** CORS configuration on backend checks this URL to allow requests from frontend

### Deployment Checklist

- [ ] MONGO_URI set and tested
- [ ] JWT_SECRET changed from default
- [ ] CLIENT_URL matches Vercel frontend URL exactly
- [ ] Node version compatible (Node 18+)
- [ ] package.json has all dependencies
- [ ] server.js or npm start command correct
- [ ] Health check endpoint works: `/api/health`

### Verify Backend is Running

**Render Dashboard:**
1. Visit your service in Render
2. Check "Events" tab for deployment status
3. Wait for "Deploy successful" message
4. Copy the service URL

**Via API:**
```bash
curl https://leave-management-system-backend-mg2o.onrender.com/api/health

# Expected response:
{
  "status": "OK",
  "message": "🚀 SmartLeave API is running!",
  "timestamp": "2026-04-17T..."
}
```

**Via Browser:**
```
https://leave-management-system-backend-mg2o.onrender.com/api/health
```

### Auto-Deploy on Push

Once connected:
1. Push to main branch: `git push origin main`
2. Render automatically detects push
3. Triggers build and deployment
4. Logs visible in "Logs" tab
5. ~2-5 minutes for deployment

---

## 3. FRONTEND DEPLOYMENT (VERCEL)

### Prerequisites

- React + Vite application ready
- `.env.production` configured
- GitHub repository connected
- Build tested locally

### Vercel Deployment Steps

**1. Import Project:**
- Visit vercel.com/dashboard
- Click "Add New..." → "Project"
- Select GitHub repo "LEAVE_MANAGEMENT_SYSTEM"
- Vercel auto-detects Vite framework

**2. Configure Build:**

| Setting | Value |
|---------|-------|
| **Framework** | Vite (auto-detected) |
| **Root Directory** | `./frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

**3. Set Environment Variables:**

```
VITE_API_URL = https://leave-management-system-backend-mg2o.onrender.com
```

**4. Deploy:**
- Click "Deploy"
- Wait for build (30 seconds - 2 minutes)
- See "Congratulations! Your site is live"

### Build Process

```
git push → GitHub webhook → Vercel detected
    ↓
Vercel clone repo
    ↓
npm install (install dependencies)
    ↓
npm run build (Vite build)
  - Transpile React JSX to JS
  - Bundle and minify
  - Output to dist/
    ↓
dist/ deployed to Vercel edge network
    ↓
Auto-generated URL or custom domain assigned
```

### Vite Build Configuration

**Build Tool:** Vite
- React plugin enabled
- Development proxy: Handles API calls to localhost:5000
- Production: Uses VITE_API_URL environment variable

**Note:** Proxy only works in development. In production, frontend uses environment variable URL.

### Deployment Checklist

- [ ] VITE_API_URL set to backend URL
- [ ] Backend URL verified accessible (test /api/health)
- [ ] React build tested locally
- [ ] dist/ folder contains index.html
- [ ] No hardcoded localhost URLs in code
- [ ] Environment variables not committed to git
- [ ] GitHub branch auto-deploy enabled

### Verify Frontend is Running

**Vercel Dashboard:**
1. Visit vercel.com/dashboard
2. Click your project
3. Check "Deployments" tab
4. Latest deployment should show "READY"

**Via Browser:**
```
https://leave-management-system-topaz.vercel.app
```

Should load login page without errors in console.

### Check API Connection

**In Browser Console:**
```javascript
// Open DevTools (F12)
console.log(import.meta.env.VITE_API_URL)
// Should output: https://leave-management-system-backend-mg2o.onrender.com
```

**Test API Call:**
```javascript
fetch('https://leave-management-system-backend-mg2o.onrender.com/api/health')
  .then(res => res.json())
  .then(data => console.log(data))
```

---

## 4. ENVIRONMENT VARIABLES

### Frontend (.env.production)

**Location:** `frontend/.env.production`

```
VITE_API_URL=https://leave-management-system-backend-mg2o.onrender.com
```

**Accessed in Code:**
```javascript
const BASE_URL = import.meta.env.VITE_API_URL || 'fallback-url';
```

**Build-time Replacement:**
- Vite replaces `import.meta.env.VITE_API_URL` at build time
- Value hardcoded into dist/index.html
- No runtime lookup

### Backend (Render Environment)

**Set in Render Dashboard:**

1. Go to Service Settings
2. Scroll to "Environment"
3. Add variables:

```
MONGO_URI = mongodb+srv://username:password@cluster.mongodb.net/leave_management_system?retryWrites=true&w=majority
JWT_SECRET = change_this_to_a_random_secure_string_in_production
JWT_EXPIRES_IN = 7d
PORT = 5000
NODE_ENV = production
CLIENT_URL = https://leave-management-system-topaz.vercel.app
```

**Security Notes:**
- Never commit .env files to git
- JWT_SECRET should be random & long (32+ chars)
- Change default secrets in production
- Use strong database credentials

---

## 5. CORS ISSUES & FIXES

### Common CORS Error

```
Access to XMLHttpRequest at 'https://backend...' from origin 
'https://frontend...' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### Root Causes

1. **Backend CORS not configured** → Not allowing frontend origin
2. **CLIENT_URL wrong** → Doesn't match Vercel URL exactly
3. **Typo in origin** → Extra space, different protocol, etc.
4. **Backend not running** → Cannot respond

### Troubleshooting Steps

**1. Check Backend Health:**
```bash
curl https://leave-management-system-backend-mg2o.onrender.com/api/health
```
Should return JSON (not 404 or timeout).

**2. Check CLIENT_URL in Render:**
- Render Dashboard
- Service Settings
- Environment variables
- Verify CLIENT_URL = exact Vercel frontend URL
- Copy-paste from Vercel to avoid typos

**3. Verify Allowed Origins in server.js:**
```javascript
const allowedOrigins = [
  'http://localhost:5173',
  'https://leave-management-system-topaz.vercel.app'  // Verify this matches
];
```

**4. Test CORS Headers (Dev Tools):**
- Open browser DevTools → Network tab
- Make API request
- Check response headers:
  - `access-control-allow-origin: https://your-frontend...` ✅
  - If missing or different origin → CORS error

**5. Temporary CORS Fix (NOT FOR PRODUCTION):**
```javascript
app.use(cors({
  origin: '*',  // Allow all origins (INSECURE!)
  credentials: true,
}));
```

**Production-safe Fix:**
```javascript
const allowedOrigins = [
  'http://localhost:5173',
  'https://leave-management-system-topaz.vercel.app',
  'https://yourdomain.com'  // Add your domain
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));  // Reject others
    }
  },
  credentials: true,
}));
```

---

## 6. DATABASE CONNECTION (MongoDB Atlas)

### Setup MongoDB Atlas

**1. Create Cluster:**
- Visit mongodb.com/cloud/atlas
- Sign up / Login
- Create free M0 cluster
- Choose region (US recommended)

**2. Create Database User:**
- Database Access → Add User
- Username: your_username
- Password: strong_password (save it!)
- Database User Privileges: "Read and write to any database"

**3. Get Connection String:**
- Clusters → Connect button
- Choose "Drivers" → Node.js
- Copy connection string:
```
mongodb+srv://username:password@cluster0.mongodb.net/leave_management_system?retryWrites=true&w=majority
```

**4. IP Whitelist:**
- Network Access → IP Whitelist
- Add IP Address: "0.0.0.0/0" (allow all)
- Or add specific IPs (Render server IP)

### MongoDB Connection String Format

```
mongodb+srv://username:password@cluster.mongodb.net/database_name
?retryWrites=true&w=majority
```

**Components:**
- username & password: Database user credentials
- cluster: Your Atlas cluster name
- database_name: leave_management_system
- retryWrites=true: Ensure writes complete
- w=majority: Write acknowledgment level

### Test Connection

**From Render Terminal:**
```bash
# SSH into Render service, then:
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log('✅ Connected to MongoDB');
  process.exit(0);
}).catch(err => {
  console.log('❌ Connection error:', err.message);
  process.exit(1);
});
"
```

### Verify Deployment Connection

**In Backend Logs (Render):**
```
✅ MongoDB Connected Successfully
   Host: cluster0.mongodb.net
   Database: leave_management_system
```

If you see this, database connection is working.

---

## 7. DEPLOYMENT WORKFLOW (CD/CI)

### Git Workflow

```
Developer pushes to main branch
    ↓ Git webhook
Vercel receives push (frontend)
    ↓
Vercel:
  1. npm install
  2. npm run build
  3. dist/ deployed to Vercel
  4. URL: leave-management-system-topaz.vercel.app
    ↓
Frontend now uses new code

Render receives push (backend)
    ↓
Render:
  1. npm install
  2. npm start
  3. Service restart
  4. New API version available
    ↓
Backend now uses new code

Both deployed independently!
```

### Deployment Status Checks

**Frontend (Vercel):**
1. vercel.com/dashboard
2. Click project
3. Deployments tab
4. Latest should be "READY"
5. Click to view deployment logs

**Backend (Render):**
1. render.com/dashboard
2. Select service
3. Events tab
4. Latest should be "Deploy succeeded"
5. Click to view deployment logs

### Rollback Strategy

**If Frontend Breaks:**
1. Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "Redeploy"
4. ~1 min later: old version live

**If Backend Breaks:**
1. Render Dashboard → Events
2. Find previous working deployment
3. Click "Redeploy"
4. ~1 min later: old version live

---

## 8. MONITORING & LOGGING

### Backend Logs

**Access:** Render Dashboard → Select service → Logs tab

**What to Watch:**
- MongoDB connection success message
- Server startup confirmation
- Port information

**Error Examples:**
- Connection error: Check MONGO_URI and credentials
- CORS error: Check CLIENT_URL matches frontend
- Database timeout: Check MongoDB Atlas IP whitelist

### Frontend Logs

**Access:** Vercel Dashboard → Select project → Deployments → Latest → Logs

**What to Watch:**
- npm install completion
- Vite build success
- No build errors

**Error Examples:**
- Missing module: Check package.json for dependency
- Missing env variable: Set VITE_API_URL in Vercel
- Build failed: Check logs for specific error

### Browser Console (Frontend)

**Open DevTools (F12) → Console:**

**Good Signs:**
```
🔌 API BASE_URL: https://leave-management-system-backend-mg2o.onrender.com
📤 API Request: POST /api/auth/login
✅ MongoDB Connected Successfully
```

**Bad Signs:**
```
Access to XMLHttpRequest at '...' blocked by CORS
Uncaught TypeError: Cannot read property 'token' of undefined
404 Not Found: /api/auth/login
ECONNREFUSED: Connection refused
```

---

## 9. PRODUCTION CHECKLIST

### Pre-Deployment

- [ ] All tests passing locally
- [ ] Environment variables not in code
- [ ] API base URL uses env variable
- [ ] Error messages user-friendly
- [ ] No console.logs left for debugging
- [ ] No hardcoded credentials
- [ ] CORS whitelist finalized
- [ ] JWT_SECRET changed from default
- [ ] Database backups enabled

### After Deployment

- [ ] Frontend loads without errors
- [ ] Login works with test credentials
- [ ] Apply leave form submits
- [ ] Leave approvals work
- [ ] Document uploads successful
- [ ] 404 errors handled gracefully
- [ ] Performance acceptable (< 3s page load)
- [ ] Mobile responsive
- [ ] No CORS errors in console

### Ongoing Monitoring

- [ ] Check logs daily for errors
- [ ] Monitor database storage usage
- [ ] Verify backups running
- [ ] Test critical user flows
- [ ] Track error rates
- [ ] Review API response times

---

## 10. TROUBLESHOOTING COMMON ISSUES

### 404 Frontend Not Loading

**Problem:** Vercel shows "Not Found" page

**Causes:**
- Build failed during deploy
- dist/ folder missing
- Wrong root directory

**Solution:**
1. Check Vercel deployment logs
2. Run locally: `npm run build`
3. Verify dist/ contains index.html
4. Check root directory setting in Vercel

### Backend 503 Service Unavailable

**Problem:** Backend returns 503 error

**Causes:**
- Server crashing (error in code)
- Out of memory
- Database connection lost

**Solution:**
1. Check Render logs for error
2. Restart service: Render Dashboard → Restart
3. Check MongoDB connection
4. Verify environment variables

### CORS "No Access-Control-Allow-Origin"

**Problem:** Frontend blocked from calling backend

**Solution (Step-by-step):**
1. Test backend directly: curl /api/health
2. Check CLIENT_URL in Render env vars
3. Verify URL matches exactly (spaces, https, domain)
4. Restart Render service (environment change requires restart)
5. Check server.js CORS config
6. Clear browser cache (Ctrl+Shift+Del)

### Login Returns 401 Immediately

**Problem:** Can't login even with correct credentials

**Causes:**
- MongoDB empty (no users created)
- Seed script not run
- Database connection broken

**Solution:**
1. Verify MongoDB has test users: use seed.js
2. Check MONGO_URI connection
3. View Render logs for database errors

### Uploaded Documents Not Accessible

**Problem:** Document link returns 404

**Causes:**
- File not saved to /uploads
- Wrong URL format
- Permissions issue on Render disk

**Solution:**
1. Check /uploads directory exists
2. Verify Multer saves files
3. Check document URL in Leave document
4. View server logs for multer errors

---

## 11. CUSTOM DOMAIN (OPTIONAL)

### Point Domain to Vercel

**1. Get Vercel Nameservers:**
- Vercel Dashboard → Project Settings
- Domains section
- Add custom domain
- Vercel shows nameservers

**2. Update Domain DNS:**
- Go to domain registrar (GoDaddy, Namecheap, etc.)
- Change nameservers to Vercel's
- Wait 24-48 hours for propagation

**3. Verify:**
```bash
nslookup yourdomain.com
# Should resolve to Vercel IP
```

### Custom Domain for Backend

Less common, but if you have a custom domain:
1. Render Dashboard → Custom Domain
2. Add your domain
3. Follow DNS update instructions
4. Update frontend VITE_API_URL to custom domain

---

## SUMMARY

**Deployment Architecture:**

| Component | Platform | URL | Auto-Deploy |
|-----------|----------|-----|-------------|
| **Frontend** | Vercel | leave-management-system-topaz.vercel.app | ✅ GitHub push |
| **Backend** | Render | leave-management-system-backend-mg2o.onrender.com | ✅ GitHub push |
| **Database** | MongoDB Atlas | Cloud-hosted | N/A |

**Critical Configuration:**
- ✅ Backend: `CLIENT_URL` must match frontend exactly
- ✅ Frontend: `VITE_API_URL` must point to backend
- ✅ Database: `MONGO_URI` must be valid and accessible
- ✅ JWT_SECRET: must be strong and unique

**Deployment Process:**
1. Push to GitHub main branch
2. Vercel & Render auto-deploy
3. Frontend built with Vite
4. Backend restarted with new code
5. ~5 min total deployment time

**Monitoring:**
- Frontend: Vercel dashboard
- Backend: Render logs & /api/health
- Database: MongoDB Atlas cluster metrics

**Common Issues & Fixes:**
- CORS → verify CLIENT_URL
- 404 → check frontend build
- 503 → check backend logs & restart
- 401 → seed test users
- MongoDB → whitelist IPs

**Production Readiness:**
- Change all default secrets
- Enable database backups
- Set up error monitoring (Sentry optional)
- Test all critical flows
- Document runbook for operations team
