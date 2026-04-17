# Deployment Guide - Leave Management System

## Overview
This guide ensures your Leave Management System frontend (React + Vite + Vercel) correctly communicates with the backend (Node.js + Render).

---

## **PART 1: Backend Deployment on Render**

### Prerequisites
- Node.js application deployed on Render
- MongoDB Atlas database configured
- Environment variables set in Render dashboard

### Required Environment Variables on Render
Set these in your Render service environment variables:

```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/leave_management_system?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRES_IN=7d
PORT=5000
CLIENT_URL=https://your-vercel-frontend-url.vercel.app
NODE_ENV=production
```

### Critical: CLIENT_URL Variable
**This is the most important setting for CORS to work!**
- Set `CLIENT_URL` to your **exact** Vercel frontend URL
- Example: `https://leave-management-system.vercel.app`
- Without this, the frontend will be blocked by CORS

### Verify Backend is Working
```bash
curl https://leave-management-system-backend-mg2o.onrender.com/api/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "🚀 SmartLeave API is running!",
  "timestamp": "2026-04-12T..."
}
```

---

## **PART 2: Frontend Deployment on Vercel**

### Prerequisites
- Frontend built with Vite
- Vercel account connected to GitHub repository

### Required Environment Variables on Vercel
Set these in your Vercel project settings → Environment Variables:

```
VITE_API_URL=https://leave-management-system-backend-mg2o.onrender.com
```

### Do NOT include `/api` suffix
- ❌ WRONG: `VITE_API_URL=https://leave-management-system-backend-mg2o.onrender.com/api`
- ✅ CORRECT: `VITE_API_URL=https://leave-management-system-backend-mg2o.onrender.com`
- The frontend code appends `/api` automatically

### Deployment Steps on Vercel
1. Push code to GitHub
2. Connect Vercel to your repository
3. Set environment variables in Vercel dashboard
4. Vercel will auto-build and deploy

---

## **PART 3: Login Flow - What Happens**

### Frontend → Backend Request Flow

1. **User enters credentials + selects role (Admin/Manager/Employee)**
   - Email: admin@company.com
   - Password: password
   - Role: Admin

2. **Frontend sends POST request to:**
   ```
   https://leave-management-system-backend-mg2o.onrender.com/api/auth/login
   ```
   
   With body:
   ```json
   {
     "email": "admin@company.com",
     "password": "password",
     "role": "Admin"
   }
   ```

3. **Backend validates:**
   - Email exists in database ✓
   - Password matches ✓
   - Role matches user's role in database ✓

4. **Backend returns:**
   ```json
   {
     "token": "eyJhbGciOiJIUzI1NiIs...",
     "user": {
       "id": "EMP001",
       "_id": "507f1f77bcf86cd799439011",
       "name": "Admin User",
       "email": "admin@company.com",
       "role": "Admin",
       "avatar": null
     }
   }
   ```

5. **Frontend stores:**
   - `localStorage.token` = JWT token
   - `localStorage.user` = User object
   - Redirects to `/dashboard`

---

## **PART 4: Troubleshooting**

### Issue: "Email not found" or "Login failed"

#### Step 1: Check Frontend Console Logs
Open browser DevTools (F12) → Console tab

Look for messages like:
```
🔌 API BASE_URL: https://leave-management-system-backend-mg2o.onrender.com
🔌 Environment VITE_API_URL: https://leave-management-system-backend-mg2o.onrender.com
📤 API Request: POST https://leave-management-system-backend-mg2o.onrender.com/api/auth/login
```

**If you see `undefined` for BASE_URL:**
- ❌ `VITE_API_URL` environment variable is not set in Vercel
- Fix: Add `VITE_API_URL` to Vercel → Settings → Environment Variables

#### Step 2: Check Network Tab
In DevTools → Network tab, click on the login request:
- **Status should be:** 200 (success) or 401 (auth failed)
- **If you see CORS error (status 0):**
  - Backend `CLIENT_URL` is not set correctly
  - Backend needs to know the frontend's Vercel URL

#### Step 3: Check Backend Logs
On Render dashboard, view your service logs:
```
GET /api/health - 200 (backend is running)
POST /api/auth/login - Check for errors
```

#### Step 4: Verify Database Connection
- Ensure MongoDB is accessible from Render
- Check IP whitelist in MongoDB Atlas (should allow Render's IP)

#### Step 5: Verify User Exists
Use Postman or curl to check:
```bash
curl -X POST https://leave-management-system-backend-mg2o.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "password": "password",
    "role": "Admin"
  }'
```

---

## **PART 5: Common Errors & Solutions**

| Error | Cause | Solution |
|-------|-------|----------|
| "Email not found" | User doesn't exist in DB | Check database has user with that email |
| "Invalid role for this user" | Role doesn't match | Ensure role (Admin/Manager/Employee) matches user's role in DB |
| CORS error | Backend doesn't know frontend URL | Set `CLIENT_URL` in backend env vars |
| "undefined/api" in console | `VITE_API_URL` not set | Add `VITE_API_URL` to Vercel env vars |
| Network timeout | Backend unreachable | Check Render service is running, check API URL |
| 500 error from backend | Server error | Check backend logs on Render dashboard |

---

## **PART 6: Checklist Before Going Live**

### Backend (Render)
- [ ] MongoDB URI set correctly
- [ ] JWT_SECRET set (secure, strong value)
- [ ] CLIENT_URL set to your actual Vercel domain
- [ ] NODE_ENV set to "production"
- [ ] Render service is running and healthy

### Frontend (Vercel)  
- [ ] VITE_API_URL set to backend URL (without /api)
- [ ] No hardcoded URLs in code
- [ ] Environment variables are synced
- [ ] Build and deployment successful

### Testing
- [ ] Backend health check returns 200
- [ ] Test login with correct credentials in Postman
- [ ] Test login in frontend browser
- [ ] Check console logs for correct API URL
- [ ] Verify token is stored in localStorage
- [ ] Redirect to dashboard works

---

## **PART 7: API Endpoints Reference**

### Authentication
- **Login:** `POST /api/auth/login`
  ```json
  {
    "email": "user@example.com",
    "password": "password",
    "role": "Admin"
  }
  ```
  
- **Get Current User:** `GET /api/auth/me`
  - Requires: `Authorization: Bearer <token>`

---

## **Contact & Support**

If issues persist:
1. Check all environment variables are set correctly
2. Review backend logs on Render
3. Use browser DevTools to inspect network requests
4. Verify CORS configuration matches frontend URL
5. Test API directly with Postman before debugging frontend

