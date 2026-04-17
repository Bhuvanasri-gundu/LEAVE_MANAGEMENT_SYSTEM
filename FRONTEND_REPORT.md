# FRONTEND REPORT
## React + Vite Leave Management System

---

## 1. ARCHITECTURE & TECHNOLOGY STACK

### Technologies
- **Framework:** React 19.2.4
- **Build Tool:** Vite 8.0.1
- **Routing:** React Router DOM 7.13.2
- **HTTP Client:** Axios 1.14.0
- **State Management:** Context API (custom contexts)
- **Styling:** CSS Modules + Global CSS
- **Icons:** React Icons 5.6.0
- **Charts:** Recharts 3.8.1

### Folder Structure
```
frontend/
├── src/
│   ├── App.jsx                 # Main app layout wrapper
│   ├── main.jsx                # React DOM entry point
│   ├── routes.jsx              # Route definitions
│   ├── App.css                 # Global app styles
│   ├── index.css               # Global index styles
│   ├── components/             # Reusable UI components
│   │   ├── Navbar.jsx          # Top navigation bar
│   │   ├── Sidebar.jsx         # Left navigation panel
│   │   ├── Table.jsx           # Data table component
│   │   ├── Card.jsx            # Card/panel wrapper
│   │   ├── FormInputs.jsx      # Form input components
│   │   └── ProtectedRoute.jsx  # Route protection wrapper
│   ├── pages/                  # Full-page components
│   │   ├── Login.jsx           # Role-based login
│   │   ├── Dashboard.jsx       # Main dashboard
│   │   ├── ApplyLeave.jsx      # Leave application form
│   │   ├── LeaveList.jsx       # Leave approval/management
│   │   ├── MyLeaves.jsx        # Employee's leave history
│   │   ├── EmployeeList.jsx    # Admin: employee list
│   │   ├── AddEmployee.jsx     # Admin: add/edit employee
│   │   ├── LeaveTypes.jsx      # Admin: leave type config
│   │   ├── Holidays.jsx        # Admin: holiday config
│   │   ├── Timesheets.jsx      # Manager: timesheet view
│   │   ├── Performance.jsx     # Manager: performance reviews
│   │   ├── MyInfo.jsx          # Employee profile page
│   │   └── AccessDenied.jsx    # 403 error page
│   ├── context/                # React Context providers
│   │   ├── AuthContext.jsx     # Authentication state
│   │   ├── LeaveContext.jsx    # Leave data state
│   │   ├── EmployeeContext.jsx # Employee data state
│   │   ├── ToastContext.jsx    # Toast notifications
│   │   └── NotificationContext.jsx # Alert notifications
│   ├── services/
│   │   └── api.js              # Axios instance & API calls
│   └── data/                   # Mock JSON data files
│       ├── departments.json
│       ├── employees.json
│       ├── holidays.json
│       ├── leaves.json
│       ├── leaveTypes.json
│       ├── performanceReviews.json
│       └── timesheets.json
├── index.html                  # HTML entry point
├── vite.config.js              # Vite configuration
├── eslint.config.js            # ESLint rules
├── package.json                # Dependencies
└── public/                     # Static assets
```

---

## 2. CORE COMPONENTS

### Login Component (`Login.jsx`)
**Purpose:** Multi-role authentication gateway

**Features:**
- Three role selection buttons (Admin, Manager, Employee)
- Email validation (format check)
- Password input with inline error messages
- Forgot password & reset password views
- Loading state during submission
- Toast notifications on success/error
- Auto-redirect based on user role

**Form Validation:**
- Email: required + regex format check
- Password: required (min 6 chars expected by backend)
- Role: required selection

**Data Flow:**
1. User selects role
2. Enters email/password
3. Submission to backend
4. Token + user stored in browser
5. Redirect to dashboard

---

### Dashboard Component (`Dashboard.jsx`)
**Purpose:** Role-specific main interface

**Features:**
- Dynamic layout based on user role:
  - **Admin:** Leave stats, recent applications, team overview
  - **Manager:** Pending approvals, team analytics, leaves to review
  - **Employee:** Leave balance, recent applications, upcoming leaves
- Charts and widgets using Recharts
- Real-time data from context providers
- Quick action buttons

---

### ApplyLeave Component (`ApplyLeave.jsx`)
**Purpose:** Leave application form with document upload

**Features:**
- Leave type selection (dropdown from API)
- Date range picker (start and end dates)
- Automatic duration calculation
- Optional document upload (required for Sick Leave)
- Real-time conflict detection (same team overlap)
- Leave balance display
- Comments/notes field

**File Upload:**
- Accepts: PDF, JPG, PNG
- Max size: 2MB
- Sent as multipart form data to backend

**Conflict Check:**
- Runs automatically when dates are entered
- Queries backend for overlapping leaves
- Alerts user if team member has overlapping leave
- Does not prevent submission, only warns

---

### LeaveList Component
**Purpose:** Leave approval & management (Admin/Manager)

**Features:**
- Filterable leave table
- Status badges (Pending, Approved, Rejected, Cancelled)
- Inline approval actions
- Document verification toggle
- Manager comments input
- Role-based visibility:
  - Admin: sees all leaves
  - Manager: sees team members' leaves only

---

### MyLeaves Component
**Purpose:** Employee's personal leave history

**Features:**
- List of user's own leaves
- Status indicators
- Document link (if uploaded)
- Cancel pending leaves
- View manager comments on rejected leaves

---

### Admin Components

**EmployeeList.jsx** - View all employees
- Add/Edit/Delete employees
- Employee fields:
  - First/Last name, email
  - Job title, department, employment status
  - Phone, team, supervisor
  - Salary (not stored), joinDate

**AddEmployee.jsx** - Add or edit employee
- Form validation
- Role assignment (Admin, Manager, Employee)
- Automatic employee ID generation
- Pre-populated for edit mode

**LeaveTypes.jsx** - Manage leave policies
- Add/Edit leave types
- Set days per year
- Toggle situational flag
- Delete leave types

**Holidays.jsx** - Manage company holidays
- Add holidays with dates
- Mark as recurring (annual)
- Full day or half day option

---

## 3. STATE MANAGEMENT (Context API)

### AuthContext (`context/AuthContext.jsx`)
**Purpose:** User authentication & authorization

**State Includes:**
- Current logged-in user (id, name, email, role)
- Loading status during authentication
- Login/logout functions
- Permission checking function

**Role-Based Permissions:**
- Admin: all permissions enabled
- Manager: dashboard, leave approvals, team management, time tracking
- Employee: dashboard, leave application, personal leave history, holidays

**Token Validation:**
- On app mount: calls `GET /api/auth/me` to validate token
- If invalid/expired: clears localStorage and redirects to login
- If valid: updates user state

---

### LeaveContext (`context/LeaveContext.jsx`)
**State:**
```javascript
{
  leaves: [],
  addLeave: (leave) => void,
  updateLeave: (id, updates) => void,
  deleteLeave: (id) => void,
  loading: boolean
}
```

**Data Syncing:**
- Fetches from `GET /api/leaves` on mount
- Local updates don't hit API immediately
- Used for optimistic UI updates

---

### EmployeeContext
**State:**
```javascript
{
  employees: [],
  addEmployee: (employee) => void,
  updateEmployee: (id, updates) => void,
  loading: boolean
}
```

---

### ToastContext & NotificationContext
- Toast: Temporary notifications (success, error, info)
- Notification: Persistent alerts and badges

---

## 4. ROUTING & PROTECTED ROUTES

### Route Structure

**Public Routes:**
- `/login` - Login page
- `/access-denied` - Permission denied page

**Authenticated Routes:**
- `/dashboard` - Main dashboard (all users)
- `/pim/employees` - Employee list (admin only)
- `/pim/add-employee` - Add employee (admin only)
- `/leave/list` - Leave approvals (admin/manager)
- `/leave/apply` - Apply for leave (all)
- `/leave/my-leaves` - Personal leave history (all)
- `/leave/types` - Configure leave types (admin)
- `/leave/holidays` - Holiday management (admin)
- `/time` - Timesheets (manager/admin)
- `/performance` - Performance reviews (manager/admin)
- `/my-info` - User profile (all)

### ProtectedRoute Component
**Purpose:** Wrapper for route access control

**Props:**
- `allowedRoles`: array of roles that can access
- `permission`: specific permission key from ROLE_PERMISSIONS
- `children`: component to render if authorized

**Behavior:**
- If user not authenticated: redirects to `/login`
- If user lacks required role/permission: redirects to `/access-denied`
- If authorized: renders children with protected data

---

## 5. API INTEGRATION (Axios)

### Axios Instance

**Base Configuration:**
- Base URL: Backend API endpoint
- Timeout: 10 seconds per request

**Request Interceptor:**
- Automatically attaches JWT token from local storage to every request
- Logs request details for debugging

**Response Interceptor:**
- Logs all errors with status code and message
- On 401 (Unauthorized): clears token, redirects to login
- Dispatches global error event for notification system

### API Endpoints

**Authentication:**
- POST /auth/login - User login
- POST /auth/register - Register new account
- GET /auth/me - Validate current token
- POST /auth/forgot-password - Reset password request
- POST /auth/reset-password - Complete password reset

**Leaves:**
- POST /leaves - Apply for leave
- GET /leaves - Get leaves (filtered by role)
- PATCH /leaves/:id - Approve/reject leave
- PATCH /leaves/:id/document-verify - Verify document
- DELETE /leaves/:id - Cancel leave
- GET /leaves/conflict-check - Check team conflicts

**Employees:**
- GET /employees - Get all employees
- GET /employees/:id - Get single employee
- POST /employees - Add employee
- PUT /employees/:id - Update employee
- DELETE /employees/:id - Delete employee

**Leave Types:**
- GET /leave-types - Get all leave types
- POST /leave-types - Add leave type

**Holidays:**
- GET /holidays - Get all holidays
- POST /holidays - Add holiday

---

## 6. FORM VALIDATION & ERROR HANDLING

### Frontend Validation

**Login Form:**
- Email: required + must match email format
- Password: required
- Role: required selection

**Leave Application:**
- Leave type: required
- Start date: required and must be before end date
- End date: required and must be after start date
- Document: required for Sick Leave only
- File size: maximum 2MB
- File type: PDF, JPG, PNG only

**Employee Form:**
- First/Last name: required, whitespace trimmed
- Email: required, checked for uniqueness on backend
- Role: required selection
- Department: optional
- Job title: optional

### Error Display

**Inline Errors:**
- Email validation messages displayed under email field
- File upload errors shown in dedicated message area
- Form errors prevent submission

**Toast Notifications:**
- Success: Confirmation message with checkmark
- Error: API error message displayed
- Info: Loading/processing messages shown

**Global Error Handler:**
- API errors trigger global notification event
- Consistent error messaging across application

---

## 7. STYLING & UI/UX

### CSS Architecture
- **Global Styles:** `index.css`, `App.css`
- **Component Styles:** `.jsx` paired with `.css` files
  - `Navbar.css`, `Sidebar.css`, `Table.css`, `Card.css`, `FormInputs.css`
  - `Pages.css` for page-specific styles

### Design System
- Color scheme: Blues, greens, oranges for roles
- Responsive grid layouts
- Mobile-first approach
- Flexbox & CSS Grid for layouts

### Key UI Features
- Collapsible sidebar
- Sticky navbar with page title
- Card-based layout system
- Data tables with sorting/filtering
- Modal/alert dialogs (via components)
- Loading spinners and skeleton screens

---

## 8. PERFORMANCE & OPTIMIZATION

### Lazy Loading
- Routes can be code-split (not implemented yet)
- Images lazy-loaded where applicable

### Caching
- Local Context caching of leave/employee data
- Token stored in localStorage for persistence

### Request Optimization
- Single API call per page load
- Conflict check debounced on date change
- Timesheets & performance reviews use mock data (no API)

---

## 9. BUILD & DEVELOPMENT

### Package Scripts
- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run preview` - Preview production build locally
- `npm run lint` - Check code quality

### Vite Configuration
- React plugin enabled
- Dev server proxies API calls to localhost:5000
- Proxies file uploads to backend

### Environment Variables
- `VITE_API_URL`: Backend API base URL (set per environment)

---

## 10. SECURITY CONSIDERATIONS

### Token Management
- JWT stored in browser local storage (accessible via JavaScript)
- Token automatically attached to every API request
- Token validated on app startup
- Auto-logout triggered on 401 response

### Protected Routes
- ProtectedRoute component checks user role/permission before rendering
- Unauthorized access redirects to permission denied page
- Token required for all protected API calls

### Input Validation
- Email format validation via regex pattern
- File type and size validation
- Form fields validated before submission

### CORS
- Backend allows frontend origin in CORS configuration
- Credentials included in cross-origin requests

---

## 11. BROWSER COMPATIBILITY

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ JavaScript features (no IE11 support)
- LocalStorage required for token persistence

---

## SUMMARY

The frontend is a **modern React + Vite SPA** with:
- ✅ Three-role access control system
- ✅ Comprehensive form validation
- ✅ Real-time conflict detection
- ✅ Document upload capability
- ✅ Context-based state management
- ✅ Responsive UI with Navbar & Sidebar
- ✅ Toast & notification system
- ✅ Protected routes with role checking
- ✅ Production-ready build pipeline

**Key Strength:** Clean separation of concerns with dedicated contexts for different data domains.

**Areas for Enhancement:**
- Implement code splitting for route-based chunks
- Add input debouncing for API calls
- Consider Zustand or Jotai for simpler state management
- Add offline mode caching
