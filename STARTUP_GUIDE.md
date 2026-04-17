# 🚀 Leave Management System - Startup Guide

> **Last Updated:** April 15, 2026
> **Purpose:** Ensure both frontend and backend run without timeout errors

## ✅ Prerequisites

- **Node.js** v18+ installed
- **npm** installed
- **MongoDB Atlas** credentials configured in `.env`
- **Internet connection** (for MongoDB Atlas)

---

## 📋 Step 1: Environment Setup

### Backend (.env)
File: `backend/.env`

```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://bhuvana:gIgbKDHwtRdmp7OP@ac-rtqxl1t-shard-00-00.mzzojmc.mongodb.net:27017,...
JWT_SECRET=smartleave_jwt_secret_dev_2026
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

✅ Verify the file exists and is properly configured.

### Frontend (.env.local)
File: `frontend/.env.local`

```
VITE_API_URL=http://localhost:5000
```

✅ **IMPORTANT:** Create this file if it doesn't exist!

---

## 🔧 Step 2: Install Dependencies

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

---

## 🎯 Step 3: Start Services in Correct Order

### **Terminal 1: Start Backend Server**

```bash
cd backend
npm run dev
```

**Expected Output:**
```
✅ MongoDB Connected Successfully
   Host: ac-rtqxl1t-shard-00-00.mzzojmc.mongodb.net
   Database: admin

🚀 SmartLeave API Server
   Environment : development
   Port        : 5000
   Health Check: http://localhost:5000/api/health
```

⏱️ **Wait 5-10 seconds** for MongoDB to connect.

### **Terminal 2: Start Frontend Server** (After backend is ready)

```bash
cd frontend
npm run dev
```

**Expected Output:**
```
  VITE v8.0.1  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  press h + enter to show help
```

---

## ✅ Step 4: Verification

### Check Backend Health
```bash
curl http://localhost:5000/api/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "message": "🚀 SmartLeave API is running!",
  "timestamp": "2026-04-15T10:30:00.000Z"
}
```

### Check Frontend
- Open browser: http://localhost:5173
- Should load login page
- MongoDB connection status displayed in browser console

---

## 🔴 Troubleshooting

### **Error: ECONNREFUSED (Cannot reach backend)**

**Cause:** Backend server not running or not on port 5000

**Solution:**
```bash
# Terminal 1
cd backend
npm run dev
# Wait for "MongoDB Connected Successfully" message
```

---

### **Error: Timeout waiting for MongoDB**

**Cause:** MongoDB Atlas connection issue

**Solution:**
1. Check MONGO_URI in `backend/.env`
2. Verify MongoDB Atlas cluster is active
3. Check IP whitelist in MongoDB Atlas:
   - Go to: https://cloud.mongodb.com
   - Network Access → Add IP address: Allow access from anywhere (0.0.0.0/0)
4. Test connection:
   ```bash
   cd backend
   npm run dev
   ```

---

### **Error: "Request timeout - server not responding"**

**Cause:** Frontend cannot reach backend at http://localhost:5000

**Solution:**
1. Verify `.env.local` in frontend:
   ```
   VITE_API_URL=http://localhost:5000
   ```
2. Check CORS configuration in `backend/server.js` allows `http://localhost:5173`
3. Restart frontend:
   ```bash
   cd frontend
   npm run dev
   ```

---

### **Error: npm run dev fails with exit code 1**

**Cause:** Dependencies not installed or Vite configuration issue

**Solution:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

### **Error: "Cannot read property 'toISOString' of undefined"**

**Cause:** Database query returning null or undefined

**Solution:**
1. Reseed database:
   ```bash
   cd backend
   npm run seed
   ```
2. Check MongoDB connection:
   ```bash
   cd backend
   npm run dev
   ```

---

## ⚙️ Timeout Configuration Summary

### Frontend (`src/services/api.js`)
- **API Timeout:** 30 seconds (30000ms)
- **Connect Timeout:** 10 seconds (10000ms)
- **Base URL:** http://localhost:5000

### Backend (`config/db.js`)
- **Server Selection Timeout:** 10 seconds (10000ms)
- **Socket Timeout:** 60 seconds (60000ms)
- **Connection Timeout:** 10 seconds (10000ms)
- **Pool Size:** 5-10 connections

### Server (`server.js`)
- **Keep Alive Timeout:** 65 seconds
- **Headers Timeout:** 66 seconds
- **Request Body Limit:** 50MB

---

## 📊 Performance Optimization

### For Slow Connections
1. Increase frontend timeout in `src/services/api.js`:
   ```javascript
   timeout: 60000, // 60 seconds instead of 30
   ```

2. Increase MongoDB timeout in `backend/config/db.js`:
   ```javascript
   serverSelectionTimeoutMS: 20000, // 20 seconds instead of 10
   ```

### For Development
- Use `npm run dev` (development mode with hot reload)
- Keep browser DevTools open to monitor console errors
- Check `Sources` tab for API response timing

---

## 🚀 Quick Start Command (One-liner)

**Terminal 1 (Backend):**
```bash
cd backend && npm install && npm run dev
```

**Terminal 2 (Frontend - after backend is ready):**
```bash
cd frontend && npm install && npm run dev
```

---

## ✅ Checklist Before Deployment

- [ ] Backend running without MongoDB errors
- [ ] Frontend connects to `http://localhost:5000`
- [ ] Login page loads
- [ ] Can login with credentials
- [ ] Leave list loads without timeout
- [ ] Document upload works
- [ ] Manager actions work without timeout

---

## 📞 Support

If issues persist:
1. Check all console logs (frontend DevTools + backend terminal)
2. Verify MongoDB Atlas status
3. Check IP whitelist in MongoDB Atlas
4. Ensure ports 5000 and 5173 are not in use:
   ```bash
   # Windows
   netstat -ano | findstr :5000
   netstat -ano | findstr :5173
   ```

---

**🎉 Once everything is working, you'll see:**
- Backend: "✅ MongoDB Connected Successfully"
- Frontend: "VITE v8.0.1 ready in XXX ms"
- Login page at http://localhost:5173
