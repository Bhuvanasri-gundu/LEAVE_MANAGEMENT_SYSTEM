# BACKEND REPORT
## Node.js + Express Leave Management System

---

## 1. ARCHITECTURE & TECHNOLOGY STACK

### Technologies
- **Runtime:** Node.js
- **Framework:** Express 5.2.1
- **Database:** MongoDB with Mongoose 9.4.1
- **Authentication:** JWT (jsonwebtoken 9.0.3)
- **Password Security:** Bcryptjs 3.0.3
- **File Upload:** Multer 2.1.1
- **CORS:** CORS 2.8.6
- **Environment:** Dotenv 17.4.0
- **ID Generation:** UUID 13.0.0
- **Development:** Nodemon 3.1.14

### Folder Structure
```
backend/
├── server.js                  # Express app initialization
├── config/
│   └── db.js                  # MongoDB connection
├── models/                    # Mongoose schemas
│   ├── User.js                # User/Employee schema
│   ├── Leave.js               # Leave application schema
│   ├── LeaveType.js           # Configurable leave types
│   └── Holiday.js             # Company holidays
├── routes/                    # Express routers
│   ├── authRoutes.js          # Authentication endpoints
│   ├── leaveRoutes.js         # Leave endpoints
│   ├── employeeRoutes.js      # Employee management
│   ├── leaveTypeRoutes.js     # Leave type management
│   └── holidayRoutes.js       # Holiday management
├── controllers/               # Route handlers/business logic
│   ├── authController.js      # Auth logic
│   ├── leaveController.js     # Leave logic
│   ├── employeeController.js  # Employee logic
│   ├── leaveTypeController.js # Leave type logic
│   └── holidayController.js   # Holiday logic
├── middleware/                # Express middleware
│   ├── auth.js                # JWT token protection
│   ├── roleAuth.js            # Role authorization
│   ├── upload.js              # File upload handling
│   └── errorHandler.js        # Global error handling
├── seeders/                   # Database seeders
│   └── seed.js                # Populate test data
├── uploads/                   # Uploaded document storage
├── package.json               # Dependencies & scripts
└── .env                       # Environment variables
```

---

## 2. MODELS & SCHEMAS

### User Schema

**Core Fields:**
- Employee ID: Unique identifier (auto-generated as "EMP-001", etc.)
- First/Last/Middle Name: User's full name
- Email: Unique email address (lowercase)
- Password: Bcrypt-hashed password
- Role: Admin, Manager, or Employee
- Job Title: Position name
- Employment Status: Full-time, contract, part-time, etc.
- Department: Organizational unit
- Supervisor: Manager's name
- Phone: Contact number
- Team: Team assignment (for conflict detection)
- SubUnit: Department identifier (for manager filtering)
- Profile Image: Avatar URL or null

**Pre-save Hooks:**
- Password automatically hashed
- Employee ID auto-generated if not provided

**Methods:**
- Password comparison for login verification

**Indexes:**
- Email (unique)
- Employee ID (unique)

---

### Leave Schema

**Core Fields:**
- Employee: Reference to User document
- Employee Name: Denormalized name for faster queries
- Employee ID: Denormalized ID for frontend compatibility
- Leave Type: Type of leave (Annual, Sick, etc.)
- From Date: Leave start date
- To Date: Leave end date
- Duration: Number of days
- Status: Pending, Approved, Rejected, Cancelled, Taken, or Scheduled
- Comments: Employee's reason for leave
- Manager Comment: Manager's approval note
- Applied Date: When request was submitted

**Document Fields:**
- Original File Name: Uploaded document filename
- Document URL: Link to uploaded file in /uploads
- Document Status: None, Pending, Verified, or Rejected (independent of leave status)

**Audit Trail:**
- Reviewed By: Manager who approved/rejected
- Reviewed At: When action was taken
- SubUnit: Department (denormalized for manager filtering)

**Indexes:**
- Employee (for user's leaves)
- SubUnit (for manager filtering)
- From/To Dates (for conflict detection)
- Status (for filtering)

---

### LeaveType Schema

**Fields:**
- Name: Unique leave type name (Annual Leave, Sick Leave, etc.)
- Days Per Year: Annual entitlement
- Situational: Boolean (true if doesn't count against yearly limit)
- Description: Optional details about the leave type

---

### Holiday Schema

**Fields:**
- Name: Holiday name (Christmas, New Year, etc.)
- Date: Holiday date
- Recurring: Boolean (true for annual holidays)
- Length: Full Day or Half Day designation

---

## 3. AUTHENTICATION FLOW

### Registration

**Process:**
1. Receive registration data (name, email, password, role, department)
2. Validate email not already registered
3. Validate employee ID not already exists
4. Hash password with bcrypt
5. Create user in database
6. Generate JWT token
7. Return token + user data

**Data Required:**
- First/Last name
- Email (must be unique)
- Password
- Role selection
- Optional: department, job title, supervisor, team

---

### Login

**Process:**
1. Receive email, password, and role
2. Find user by email
3. Compare provided password with stored hash
4. Verify role matches user's actual role (security check)
5. Generate JWT token
6. Return token + user data

**Data Required:**
- Email
- Password
- Role (must match user's actual role)

**Error Cases:**
- Email not found: 401 Invalid credentials
- Password incorrect: 401 Invalid credentials
- Role mismatch: 403 Invalid role for this user

---

### Token Validation

**Endpoint:** GET /auth/me

**Process:**
1. Extract JWT token from Authorization header
2. Verify token using JWT_SECRET
3. Find user by ID from token
4. Return full user object

**Requirements:**
- Valid Authorization header with Bearer token
- Token not expired
- User still exists in database

---

### Password Reset

**Forgot Password (`POST /api/auth/forgot-password`):**
- Accepts email
- Generates reset token (implementation specific)
- Sends email with reset link

**Reset Password (`POST /api/auth/reset-password`):**
- Accepts email + new password
- Validates reset token
- Updates password in database

---

## 4. LEAVE MANAGEMENT API

### Apply Leave (`POST /api/leaves`)

**Request (multipart/form-data):**
```javascript
{
  leaveType: String,              // e.g., "Annual Leave"
  fromDate: Date,                 // YYYY-MM-DD
  toDate: Date,                   // YYYY-MM-DD
  duration: Number,               // Calculated on frontend
  comments: String (optional),    // Reason for leave
  document: File (optional)       // PDF, JPG, PNG, max 2MB
}
```

**Process:**
1. Extract authenticated user from `req.user` (via `protect` middleware)
2. Generate document URL if file uploaded via multer
3. Set status:
   - Admin: auto-approved
   - Others: pending
4. Detect team conflicts:
   - Find leaves with overlapping dates
   - Filter by same team
   - Return conflict count
5. Save leave to database

**Response:**
```javascript
{
  data: {
    _id: ObjectId,
    employee: ObjectId,
    employeeName: "John Doe",
    employeeId: "EMP-001",
    leaveType: "Annual Leave",
    fromDate: "2024-05-01",
    toDate: "2024-05-10",
    duration: 10,
    status: "Pending",
    document: {
      originalName: "medical_cert.pdf",
      url: "https://backend/uploads/abc123.pdf"
    },
    documentStatus: "Pending"
  },
  conflict: Boolean,
  conflictCount: Number
}
```

---

### Get Leaves

**Endpoint:** GET /api/leaves

**Role-Based Filtering:**
- Admin: sees all leaves in system
- Manager: sees only their department's leaves
- Employee: sees only their own leaves

**Response:**
- Sorted by application date (newest first)
- Includes employee name, leave type, dates, status
- Shows document information if attached
- Includes manager comments if reviewed

---

### Update Leave Status

**Endpoint:** PATCH /api/leaves/:id

**Requires:** Admin or Manager role

**Data Sent:**
- Status: Approved or Rejected
- Manager comment (optional)

**Validation:**
- Leave must exist
- Leave status must be Pending (can't change already processed leaves)
- User must be Admin or Manager

**Process:**
1. Update status and comment
2. Record who made the decision
3. Record when decision was made
4. Save to database

---

### Verify Document

**Endpoint:** PATCH /api/leaves/:id/document-verify

**Requires:** Admin or Manager role

**Data Sent:**
- Document status: Verified or Rejected

**Important:** Document verification is independent from leave approval
- Can verify a rejected leave's documents
- Can approve a leave with rejected documents
- Allows separate workflows for documents and approval

---

### Cancel Leave

**Endpoint:** DELETE /api/leaves/:id

**Requires:**
- User is the leave owner (employee who applied), OR user is Admin
- Leave status is Pending

**Process:**
1. Find leave
2. Check authorization
3. Check status is Pending
4. Update status to Cancelled

**Note:** Original data preserved in database (soft delete)

---

### Check Conflicts

**Endpoint:** GET /api/leaves/conflict-check?fromDate=...&toDate=...

**Process:**
1. Find leaves with overlapping dates
2. Filter by same team as requesting user
3. Exclude rejected/cancelled leaves
4. Return list of conflicting leaves

**Result:** Informs user if team members have leave during same period

---

## 5. EMPLOYEE MANAGEMENT

### Get Employees (`GET /api/employees`)
- Returns all employees
- Used by admin employee list

### Get Employee by ID (`GET /api/employees/:id`)
- Single employee details

### Add Employee (`POST /api/employees`)
- Create new employee record
- Auto-generate employee ID
- Email must be unique

### Update Employee (`PUT /api/employees/:id`)
- Update employee details
- Validate unique email (if changed)

### Delete Employee (`DELETE /api/employees/:id`)
- Remove employee (soft delete recommended)

---

## 6. MIDDLEWARE

### Auth Middleware

**Purpose:** Protect routes and extract user from token

**Process:**
1. Extract token from Authorization header
2. Verify token signature using JWT secret
3. Find user by ID from token
4. Attach user to request object
5. Continue to next handler

**Error Responses:**
- No token: 401 Not authorized, no token provided
- Invalid token: 401 Not authorized, token invalid
- User not found: 401 User not found

**Usage:** Applied to all protected routes

---

### Role Authorization Middleware

**Purpose:** Check user role for specific actions

**Process:**
1. Check that user exists (should run after auth middleware)
2. Check user's role is in allowed list
3. Proceed if authorized, return 403 if not

**Usage Examples:**
- Admin-only routes: authorize('Admin')
- Manager and Admin: authorize('Admin', 'Manager')
- All authenticated users: no role check needed

---

### Upload Middleware

**Purpose:** Handle file uploads with validation

**Configuration:**
- Storage: Disk storage in /uploads directory
- Filename: Unique timestamp + random suffix + original extension
- Allowed Types: PDF, JPG, JPEG, PNG
- Max Size: 2MB per file

**Error Handling:**
- Unsupported type: Error message returned
- Oversized file: Error message returned
- File info (originalname, filename, size) attached to request

**Available Methods:**
- Single file: upload.single('fieldName')
- Multiple files: upload.array('fieldName', maxCount)

---

### Error Handler Middleware

**Purpose:** Catch all errors and return consistent JSON response

**Process:**
1. Extract HTTP status code from response
2. Return JSON with error message
3. Include stack trace only in development mode

**Must be placed last in middleware stack**

---

## 7. CORS & SECURITY

### CORS Configuration

**Allowed Origins:**
```javascript
[
  'http://localhost:5173',
  'https://leave-management-system-topaz.vercel.app'
]
```

**Behavior:**
- Requests from allowed origins: permitted
- Requests without origin (Postman): permitted
- Other origins: currently allowed (temporary)

**Production Note:** Restrict disallowed origins to reject instead of allowing.

### Security Practices

1. **Password Security:** Hashed with bcryptjs (10 salt rounds)
2. **JWT Secret:** Environment variable, not hardcoded
3. **Token Expiration:** Configurable via `JWT_EXPIRES_IN` (default: 7 days)
4. **Role Checking:** Every sensitive endpoint checks role
5. **Input Validation:** Required fields validated in controllers
6. **File Upload:** Type and size restrictions enforced

---

## 8. DATABASE QUERIES

### Common Patterns

**Find leaves by employee:**
```javascript
Leave.find({ employee: userId })
  .populate('employee', 'name email team')
  .sort({ appliedDate: -1 })
```

**Find leaves by department (manager view):**
```javascript
Leave.find({ subUnit: managerSubUnit })
  .sort({ appliedDate: -1 })
```

**Check leave conflicts:**
```javascript
Leave.find({
  employee: { $ne: userId },  // Not this user
  status: { $nin: ['Rejected', 'Cancelled'] },
  fromDate: { $lte: toDate },
  toDate: { $gte: fromDate }
})
```

**Find user by email:**
```javascript
User.findOne({ email }).select('+password')  // Include password for login
```

---

## 9. DATA VALIDATION

### Server-Side Validation

**Leave Application:**
- `leaveType`: required, must exist in LeaveType collection
- `fromDate`, `toDate`: required, valid dates
- `duration`: required, must be positive
- `document`: optional, validated by multer (type, size)

**Login:**
- `email`: required, valid email format (frontend sends regex-validated)
- `password`: required, min 6 chars (should be server-checked)
- `role`: required, must be valid role

**Employee:**
- `firstName`, `lastName`: required, trimmed
- `email`: required, unique
- `subUnit`: required, default provided

---

## 10. ERROR RESPONSES

### Standard Error Format

```javascript
{
  message: "Descriptive error message",
  stack: "..." // Only in development
}
```

### Common Status Codes

| Code | Scenario |
|------|----------|
| 201 | Resource created successfully |
| 400 | Bad request (validation error) |
| 401 | Unauthorized (no token / invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Resource not found |
| 500 | Server error |

---

## 11. DEVELOPMENT SCRIPTS

### Package Scripts
```bash
npm start           # Run in production mode
npm run dev         # Run with nodemon (watches files)
npm run seed        # Populate database with test data
```

### Environment Variables
```
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development|production
CLIENT_URL=http://localhost:5173
```

---

## 12. PERFORMANCE OPTIMIZATION

### Query Optimization
- **Denormalization:** `employeeName`, `employeeId` stored on Leave for faster queries
- **Selective projections:** Use `.select()` to exclude unnecessary fields
- **Indexes:** On frequently queried fields (`employee`, `subUnit`, `fromDate`, `toDate`)

### Response Optimization
- **Shape transformation:** Leave documents transformed to frontend-friendly format
- **Data mapping:** Dates converted to ISO strings
- **Minimal data:** Only necessary fields returned

### Caching
- Leaves cached in frontend context (can be invalidated)
- No server-side caching implemented (stateless design)

---

## 13. DATABASE CONNECTION

### MongoDB Connection (`config/db.js`)

**Configuration:**
```javascript
serverSelectionTimeoutMS: 5000,
socketTimeoutMS: 45000
```

**Error Handling:**
- Connection errors: detailed error logging
- Auth errors: specific message for credentials
- Network errors: helpful message for connectivity

**Verification:**
- Logs successful connection with host and database name
- Health check endpoint: `GET /api/health`

---

## SUMMARY

The backend is a **robust Express.js REST API** with:
- ✅ JWT-based authentication with role-based access
- ✅ Three-tier role system (Admin, Manager, Employee)
- ✅ Leave management with approval workflow
- ✅ Document upload capability with validation
- ✅ Team conflict detection
- ✅ CORS configured for frontend communication
- ✅ Global error handling
- ✅ MongoDB with Mongoose ORM
- ✅ Input validation & security checks
- ✅ Environment variable configuration

**Key Strength:** Clear separation between routes, controllers, and models with consistent error handling.

**Areas for Enhancement:**
- Add input sanitization (express-validator)
- Implement pagination for large datasets
- Add request rate limiting
- Enable response compression (gzip)
- Add API versioning (/v1/api/...)
- Implement audit logging
- Add soft deletes instead of hard deletes
