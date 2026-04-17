# Full-Stack Integration Fix - Quick Reference

## 🎯 Key Changes Summary

### 1. **Manager Filtering (Frontend)**
- **File**: `frontend/src/pages/LeaveList.jsx`
- **What Changed**: Removed hardcoded `MANAGER_TEAM` array
- **Result**: Managers now see all leaves from their department via backend filtering

### 2. **Document UI (Frontend)**
- **File**: `frontend/src/pages/LeaveList.jsx`
- **What Changed**: 
  - Added `viewingDocumentId` state
  - Document column now shows "View Document" button
  - After clicking, "Verify/Reject" buttons appear
  - Removed duplicate buttons from actions section
- **Result**: Cleaner UI, better user flow

### 3. **Backend CORS (Security)**
- **File**: `backend/server.js`
- **What Changed**: Made CORS environment-aware
- **Result**: Production uses whitelist, development is flexible

### 4. **Configuration Files**
- **Files**:
  - `backend/.env` - Updated with production notes
  - `frontend/.env.production` - Created new file
  - `frontend/.env.local` - Development configuration

### 5. **Database**
- **File**: `backend/.env`
- **Status**: ✅ Using MongoDB Atlas (smartleave database)
- **Same DB**: Yes, all environments use same database

---

## 🚀 Deployment URLs

| Environment | Frontend | Backend |
|---|---|---|
| Development | http://localhost:5173 | http://localhost:5000 |
| Production | https://leave-management-system-topaz.vercel.app | https://leave-management-system-backend-mg2o.onrender.com |

---

## ✅ Verification

### API Health Check
```
curl http://localhost:5000/api/health
→ 200 OK
```

### Frontend Dev Server
```
npm run dev
→ Running at http://localhost:5173
```

### Backend Dev Server
```
npm start
→ Running at http://localhost:5000
→ MongoDB Connected to smartleave
```

---

## 📝 Role-Based Access

| Role | Sees | Can Do |
|---|---|---|
| **Employee** | Own leaves only | Apply leave, cancel pending |
| **Manager** | Team leaves (subUnit filter) | Approve/reject, verify documents |
| **Admin** | All leaves | All actions, create employees |

---

## 🔗 Important Endpoints

### Authentication
- `POST /api/auth/register` - Public
- `POST /api/auth/login` - Public
- `GET /api/auth/me` - Protected

### Leaves
- `GET /api/leaves` - Protected (role-filtered)
- `POST /api/leaves` - Protected (with document upload)
- `PATCH /api/leaves/:id` - Protected (Manager/Admin only)
- `PATCH /api/leaves/:id/document-verify` - Protected (Manager/Admin only)

### Employees
- `GET /api/employees` - Protected
- `POST /api/employees` - Protected (Admin only)
- `PUT /api/employees/:id` - Protected (Admin only)

---

## 🐛 Debugging Tips

### Check Backend Connection
```
Frontend Console:
🔌 API BASE_URL: https://leave-management-system-backend-mg2o.onrender.com
🔌 Environment VITE_API_URL: ...
```

### Check Manager Filtering
- Manager should see leaves filtered by `subUnit`
- Verify `user.subUnit` is set correctly in database

### Check Document UI
- Click "View Document" button
- Should open file and show Verify/Reject buttons

### Check Admin User Creation
- Admin creates employee with `subUnit` specified
- Check database: should have new User document
- New employee can login with created credentials

---

## ⚠️ Common Issues & Solutions

### Issue: Manager sees all leaves
**Solution**: Backend filtering by `subUnit` - check if user's `subUnit` is set in database

### Issue: Document buttons always visible
**Solution**: Frontend updated - clear browser cache and reload

### Issue: Localhost error in production
**Solution**: Check `frontend/.env.production` has correct API URL

### Issue: Admin cannot create users
**Solution**: Verify `subUnit` field is provided in form

---

## 📊 Testing Checklist

- [ ] Backend running on port 5000
- [ ] Frontend running on port 5173
- [ ] API health check returns 200 OK
- [ ] Manager sees only department leaves
- [ ] Admin can create new employees
- [ ] Employee can apply and see leaves
- [ ] Document UI shows single button initially
- [ ] After clicking "View", Approve/Reject buttons appear
- [ ] No console errors in frontend
- [ ] MongoDB connection successful

---

**Status**: ✅ All fixes implemented and verified
**Date**: 2026-04-17
