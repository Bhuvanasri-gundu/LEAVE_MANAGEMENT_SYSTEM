# ⚡ Quick Reference - Timeout Fixes

## 🚀 Start Here

### 1. Create Frontend Env File (First Time Only)
```bash
# Frontend needs local API URL
# File: frontend/.env.local
VITE_API_URL=http://localhost:5000
```

### 2. Start Backend First
```bash
cd backend
npm install  # First time only
npm run dev
# ✅ Wait for: "✅ MongoDB Connected Successfully"
```

### 3. Start Frontend (After Backend is Ready)
```bash
cd frontend
npm install  # First time only
npm run dev
# ✅ Wait for: "VITE v8.0.1 ready"
```

---

## 📊 What Changed

| Component | Timeout | Why |
|-----------|---------|-----|
| API Requests | 30s (was 10s) | Handle slower networks |
| MongoDB Connection | 10s (was 5s) | More reliable Atlas connection |
| MongoDB Socket | 60s (was 45s) | Prevent query timeouts |
| Connection Pool | 5-10 (was 1) | Better concurrency |

---

## ✅ Common Issues & Fixes

### "Cannot reach backend" / "ECONNREFUSED"
```bash
# Make sure backend is running on port 5000
curl http://localhost:5000/api/health
# Should return: {"status": "OK", ...}
```

### "MongoDB Connection Error"
- Check MongoDB URI in `backend/.env`
- Go to MongoDB Atlas → Network Access → Add IP: 0.0.0.0/0
- Wait 10 seconds for changes to apply

### "Frontend build fails"
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### "Port 5000 already in use"
```bash
# Windows - Find process on port 5000
netstat -ano | findstr :5000

# Kill it (Windows)
taskkill /PID <PID> /F

# Or just use different port in .env
PORT=5001
```

---

## 🔍 Verify Setup Works

```bash
# Option 1: Run verification script
node verify.js

# Option 2: Manual checks
curl http://localhost:5000/api/health  # Backend health
curl http://localhost:5173/            # Frontend running

# Option 3: Browser
# Open: http://localhost:5173
# Should show login page
# Check console for API calls (should work)
```

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `frontend/.env.local` | Frontend API URL config |
| `backend/.env` | MongoDB URI, JWT, PORT |
| `frontend/src/services/api.js` | API timeout: 30s |
| `backend/config/db.js` | MongoDB timeout: 60s |
| `frontend/vite.config.js` | Proxy timeout: 60s |

---

## 🆘 If Everything Fails

1. Check internet connection
2. Verify MongoDB Atlas cluster is running
3. Check MongoDB user credentials in `.env`
4. Look for error messages in console/terminal
5. Manual restart: Kill both servers, start fresh
6. Still stuck? Read `STARTUP_GUIDE.md`

---

## 📞 Console Commands to Remember

```bash
# Backend health check
curl http://localhost:5000/api/health

# Login test (if backend running)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@smartleave.com","password":"pass123","role":"Manager"}'

# Kill process on port
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Check if ports are available
netstat -tln | grep -E '5000|5173'
```

---

## ✅ Success Indicators

**Backend Terminal:**
```
✅ MongoDB Connected Successfully
   Host: ...
   Database: ...

🚀 SmartLeave API Server
   Environment : development
   Port        : 5000
   Health Check: http://localhost:5000/api/health
```

**Frontend Terminal:**
```
  VITE v8.0.1  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  press h + enter to show help
```

**Browser Console:**
```
🔌 API BASE_URL: http://localhost:5000
🔌 Environment VITE_API_URL: http://localhost:5000
📤 API Request: POST /api/auth/login
```

---

## 🎯 Quick Checklist

- [ ] `.env.local` created in frontend folder
- [ ] Backend running on http://localhost:5000
- [ ] Frontend running on http://localhost:5173
- [ ] MongoDB connection successful (check backend logs)
- [ ] Browser shows login page
- [ ] Can login successfully
- [ ] Leave list loads without timeout

---

**Last Updated:** April 15, 2026  
**Status:** ✅ All timeout issues resolved  
**Next:** See `STARTUP_GUIDE.md` for detailed setup
