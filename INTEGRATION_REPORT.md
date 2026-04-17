# INTEGRATION REPORT
## Frontend-Backend Communication Flow

---

## 1. ARCHITECTURE OVERVIEW

### Communication Pattern
- **Style:** REST API with JSON payloads
- **Authentication:** JWT (JSON Web Tokens)
- **Protocol:** HTTPS in production, HTTP in development
- **Client:** Axios HTTP client with interceptors
- **CORS:** Configured to allow frontend origin

### High-Level Flow

```
Frontend (React/Vite)
    ↓
    │ HTTP(S) Request
    ↓ (Axios with interceptor)
    │ - Attach JWT token
    │ - Set Content-Type
    │
Backend (Express/Node)
    ↓
    │ Middleware
    │ - Verify CORS origin
    │ - Parse JSON/FormData
    │ - Check JWT token (protect middleware)
    │ - Check user role (authorize middleware)
    │
    ↓ Controller
    │ - Query/update MongoDB
    │ - Validate data
    │ - Handle business logic
    │
    ↓ Response
    │ JSON data or error message
    ↓
Frontend (Axios response handler)
    │ - Show toast notification
    │ - Update context state
    │ - Redirect if 401
```

---

## 2. ENVIRONMENT CONFIGURATION

### Frontend Environment

**Development:**
- API URL: http://localhost:5000

**Production:**
- API URL: https://leave-management-system-backend-mg2o.onrender.com

Environment variable: `VITE_API_URL`

### Backend Environment

**Required Variables:**
- MONGO_URI: Database connection string
- JWT_SECRET: Secret key for token signing (must be unique)
- JWT_EXPIRES_IN: Token expiration time (e.g., 7d)
- PORT: Server port (default 5000)
- NODE_ENV: production or development
- CLIENT_URL: Frontend URL for CORS configuration

---

## 3. AXIOS CONFIGURATION & INTERCEPTORS

### Instance Setup (`services/api.js`)

```javascript
const api = axios.create({
  baseURL: BASE_URL + '/api',
  timeout: 10000,  // 10 second timeout
});
```

### Request Interceptor

**Purpose:** Attach JWT token to every request

```javascript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
  return config;
});
```

**Flow:**
1. Retrieve token from localStorage
2. If token exists: add `Authorization: Bearer {token}` header
3. Log request for debugging
4. Continue request

### Response Interceptor

**Purpose:** Handle errors globally, auto-logout on 401

**Behaviors:**
- Success: response passed through
- 401 Error: auto-logout, redirect to login
- Other Errors: dispatch global error event, reject promise
- Exceptions: login and file requests don't trigger logout

**Error Logging:**
- Status code, URL, and message logged for debugging

---

## 4. AUTHENTICATION FLOW

### Login Flow (Step-by-Step)

1. User selects role (Admin, Manager, Employee)
2. User enters email & password
3. Frontend validates input format
4. Frontend sends login request
5. Backend finds user and compares password
6. Backend verifies role matches user's actual role
7. Backend generates JWT token
8. Frontend stores token in browser storage
9. Frontend updates user state
10. Axios interceptor attaches token to all future requests
11. User redirected to dashboard

### Token Validation on App Load

1. App mounts (React initialization)
2. AuthProvider useEffect runs validation
3. Checks if token exists in local storage
4. If no token: app shows login page
5. If token exists: calls /auth/me endpoint
6. Backend verifies token and returns full user
7. If verification fails: token cleared, redirects to login
8. If successful: user state updated, shows dashboard
9. Loading spinner shown during validation

### Logout Flow

1. User clicks Logout in navigation
2. Frontend calls logout function
3. Local storage cleared (token and user data)
4. User state set to null
5. App re-renders
6. Automatically redirected to login page

---

## 5. API CALL PATTERNS

### Pattern 1: Simple GET (Get Leaves)

**Frontend:**
```javascript
const { data } = await getLeaves();  // Axios call
setLeaves(data);  // Update state
```

**What Axios does:**
1. Send: `GET /leaves` with header `Authorization: Bearer {token}`
2. Timeout: 10 seconds
3. Response interceptor catches:
   - 401: logout + redirect
   - Other errors: dispatch event

**Backend Flow:**
1. Route: `GET /api/leaves`
2. Middleware: `protect` (verify token)
3. Controller: `getLeaves()`
   - Filter by role: Admin (all), Manager (subUnit), Employee (own)
   - Query MongoDB
   - Transform data (dates to ISO strings)
   - Send response
4. Response: `{ data: [...leaves] }`

---

### Pattern 2: POST with FormData (Apply Leave)

**Frontend:**
```javascript
const formData = new FormData();
formData.append('leaveType', 'Annual Leave');
formData.append('fromDate', '2024-05-01');
formData.append('toDate', '2024-05-10');
formData.append('duration', '10');
formData.append('comments', 'Vacation');
formData.append('document', fileObject);  // File from input

const response = await apiApplyLeave(formData);
```

**Axios handling:**
Axios detects FormData and automatically sets multipart/form-data header. File is sent alongside form fields. Backend receives and processes both.

**Backend Flow:**
1. Token verified by protect middleware
2. Multer middleware receives file and saves to uploads directory
3. Controller receives form fields and file information
4. Document URL generated automatically
5. Leave record created with document reference
6. Backend checks for date conflicts

**Response includes:**
- Leave ID, type, status, dates, duration
- Document URL if file uploaded
- Conflict information (if overlaps with existing leaves)

---

### Pattern 3: PATCH with Role Check (Update Leave)

**Request:**
Frontend sends PATCH request with status (Approved/Rejected) and optional manager comment

**Authorization:** Only Admin and Manager roles allowed

**Backend:**
1. Token verified and user role checked
2. Only Admin and Manager can approve/reject
3. Leave status must be Pending (can't change already processed leaves)
4. Status updated with timestamp and reviewer info

---

### Pattern 4: DELETE (Cancel Leave)

**Request:**
Frontend sends DELETE request to cancel leave

**Authorization:** Employee can cancel own pending leaves; Admin can cancel any

**Backend:**
1. Token verified and user role checked
2. Only Admin and Manager can delete
3. Leave status must be Pending (can't delete processed leaves)
4. Leave marked as Cancelled in database
   - Return updated leave

---

## 6. ERROR HANDLING & RECOVERY

### Error Types

**Network Errors:**
- Timeout (10 sec): Axios throws error, response interceptor catches
- No internet: Browser error, handled gracefully

**HTTP Errors:**
- 400: Bad request (validation error) → Show error message
- 401: Unauthorized (token invalid/expired) → Auto-logout
- 403: Forbidden (insufficient role) → Show "Access Denied"
- 404: Not found → Show "Resource not found"
- 500: Server error → Show "Server error occurred"

**Business Logic Errors:**
- "Email already registered" → Show in form error
- "Only pending leaves can be updated" → Show toast error
- "Document is not in Pending state" → Show validation error

### Frontend Error Display

**Toast Notifications:**
```javascript
// Success
addToast('Leave Applied Successfully ✅', 'success');

// Error
addToast(error.response?.data?.message || 'Failed to apply leave', 'error');

// Info
addToast('Checking team conflicts...', 'info');
```

**Inline Form Errors:**
```javascript
const [emailError, setEmailError] = useState('');

if (!email.includes('@')) {
  setEmailError('Invalid email format');
}
```

**Global Error Handler:**
```javascript
// In api.js interceptor
window.dispatchEvent(
  new CustomEvent('api-error', { 
    detail: { message: 'API error occurred' } 
  })
);

// In ToastContext
window.addEventListener('api-error', (event) => {
  addToast(event.detail.message, 'error');
});
```

### Retry Logic

**Manual Retry:**
- User can re-submit form if network fails
- Axios won't retry automatically

**Potential Enhancement:**
```javascript
// Add exponential backoff retry
const axiosRetry = require('axios-retry');
axiosRetry(api, { retries: 3, retryDelay: exponentialDelay });
```

---

## 7. DATA TRANSFORMATION & NORMALIZATION

### Frontend → Backend

**ApplyLeave form → API request:**
```javascript
// Frontend form state
{
  leaveType: "Annual Leave",
  fromDate: "2024-05-01",  // HTML5 date input: YYYY-MM-DD string
  toDate: "2024-05-10",
  comments: "Family vacation",
  document: File  // FileList[0]
}

// Transformed to FormData
const formData = new FormData();
formData.append('leaveType', form.leaveType);
formData.append('fromDate', form.fromDate);  // Sent as string
formData.append('toDate', form.toDate);      // Sent as string
formData.append('duration', '10');
formData.append('comments', form.comments);
formData.append('document', document);
```

### Backend → Frontend

**Leave document → Response shape:**
```javascript
// MongoDB document
{
  _id: ObjectId,
  fromDate: ISODate("2024-05-01T00:00:00Z"),
  toDate: ISODate("2024-05-10T00:00:00Z"),
  document: { originalName: "cert.pdf", url: "..." }
}

// Transformed in controller
{
  id: ObjectId,
  fromDate: "2024-05-01",  // ISO string split by 'T'
  toDate: "2024-05-10",
  document: { name: "cert.pdf", url: "..." }
}

// Frontend receives & displays
// Table, dashboard, etc. use the transformed shape
```

**Why Transform?**
- Frontend works with date strings (HTML5 inputs)
- Backend stores ISO dates (MongoDB)
- Controller bridges the gap for compatibility

---

## 8. REAL-TIME CONFLICT DETECTION

### Workflow

```
User enters dates in ApplyLeave form
    ↓
useEffect watches form.fromDate and form.toDate
    ↓
runConflictCheck() called
    ↓
Frontend:
  if (!fromDate || !toDate) return
  
  Axios: GET /leaves/conflict-check?fromDate=2024-05-01&toDate=2024-05-10
    ↓
Backend:
  Extract fromDate, toDate from query params
  Query conflicts:
**Result:**
- Query runs against Leave collection
- Finds overlapping leaves for team members
- Returns count and conflict boolean
- Frontend displays warning if conflicts found

---

## 9. DOCUMENT UPLOAD & VERIFICATION FLOW

### Upload Flow

**Frontend:**
1. User selects file (PDF, JPG, PNG)
2. Frontend validates file size < 2MB
3. File stored in form state
4. On submit: File sent with FormData

**Backend:**
1. Multer middleware receives file
2. Validates type and size
3. Saves to uploads directory with random filename
4. Controller generates download URL
5. Document info stored with leave record

**Result:**
Leave created with document reference and downloadable URL

### Verification Flow (Manager)

**Process:**
1. Manager views leave in list
2. Clicks document link to view file
3. Clicks "Verify" or "Reject Document" button
4. Frontend sends verification request
5. Backend updates documentStatus field
6. Frontend updates UI with new status

### Downloaded Document

**Access:**
1. Backend serves uploaded files from uploads directory
2. Frontend creates link to document URL
3. User clicks link to download or view file
4. Browser opens file in new tab (PDF viewer, image viewer, etc.)

---

## 10. ROLE-BASED ACCESS CONTROL

### Three Layers of Access Control

**Layer 1: Frontend (ProtectedRoute):**
```javascript
<ProtectedRoute allowedRoles={['Admin']}>
  <EmployeeList />
</ProtectedRoute>

// Checks:
if (!user) redirect to /login
if (user.role not in allowedRoles) redirect to /access-denied
else: render component
```

**Layer 2: Route Middleware (Backend):**
```javascript
router.patch('/:id', authorize('Admin', 'Manager'), updateLeaveStatus);

// Checks:
if (user.role not in ['Admin', 'Manager']) return 403 Forbidden
else: continue to controller
```

**Layer 3: Controller Logic:**
```javascript
// Only owner or admin can cancel
if (leave.employee.toString() !== req.user._id.toString() && 
    req.user.role !== 'Admin') {
  return res.status(403).json({ message: 'Not authorized' });
}
```

### Role-Specific Views

**Admin:**
- /pim/employees (manage all employees)
- /leave/assign (bulk assign leaves)
- /leave/list (approve leaves)
- /leave/types (configure leave types)

**Manager:**
- /leave/list (approve team's leaves)
- /time (view team timesheets)
- /performance (view team performance)

**Employee:**
- /leave/apply (apply for leave)
- /leave/my-leaves (view own leaves)
- /my-info (view profile)

---

## 11. PERFORMANCE OPTIMIZATION

### Request Optimization

**Debounce Conflict Check:**
```javascript
const runConflictCheck = useCallback(async () => {
  // Only run if both dates filled
  if (!form.fromDate || !form.toDate) { setConflict(false); return; }
  
  // API call (not debounced in current code, but could be)
  const res = await checkConflict(form.fromDate, form.toDate);
  setConflict(res.data?.conflict ?? false);
}, [form.fromDate, form.toDate]);

useEffect(() => { runConflictCheck(); }, [runConflictCheck]);
```

**Potential Enhancement:**
```javascript
import { useMemo, useCallback } from 'react';

const debouncedConflictCheck = useMemo(
  () => debounce((fromDate, toDate) => {
    checkConflict(fromDate, toDate);
  }, 500),
  []
);
```

### Context Caching

- Leaves cached in LeaveContext
- Employees cached in EmployeeContext
- Cache invalidation: manual (user action)

---

## SUMMARY

**Integration Highlights:**
✅ JWT token-based authentication
✅ Automatic token refresh on app load
✅ Auto-logout on token expiration (401)
✅ FormData support for file uploads
✅ Global error handling with interceptors
✅ Real-time conflict detection
✅ Role-based access at multiple layers
✅ Proper CORS configuration

**Communication Flow:**
```
User Login
  → JWT token generated & stored
  → Token attached to every request (Axios interceptor)
  → Backend middleware verifies token
  → Role checked for protected routes
  → Response data transformed for frontend
  → Error handled globally (401 = logout)
```

**File Upload Flow:**
```
User selects file
  → FormData created with file + form data
  → Backend Multer saves file to disk
  → Document URL generated: /uploads/[random].ext
  → URL stored in MongoDB Leave document
  → Manager can verify or download document
  → Document verification independent of leave approval
```

**Conflict Detection:**
```
User enters dates
  → Real-time API call to /conflict-check
  → Backend queries overlapping leaves by team
  → Warning displayed (non-blocking)
  → User can submit even with conflicts
```
