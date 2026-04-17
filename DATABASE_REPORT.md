# DATABASE REPORT
## MongoDB Schema Design & Data Flow

---

## 1. DATABASE OVERVIEW

### Technology
- **Database System:** MongoDB (NoSQL, document-based)
- **ODM:** Mongoose 9.4.1
- **Hosting:** MongoDB Atlas (cloud-hosted)
- **Connection:** Mongoose with connection pooling

### Collections
1. **users** - Employees and system users
2. **leaves** - Leave applications and history
3. **leavetypes** - Configurable leave policies
4. **holidays** - Company holidays
5. **system indexes** - Mongoose-managed

---

## 2. DATA SCHEMA DESIGN

### Users Collection

**Core Data:**
- Employee ID: Unique identifier ("EMP-001", auto-generated)
- Name fields: First, middle, last name
- Email: Unique email address
- Password: Bcrypt-hashed password
- Role: Admin, Manager, or Employee
- Job Title: Position name
- Employment Status: Full-time, contract, part-time, etc.
- Department: Organizational unit
- Supervisor: Manager's name
- Phone: Contact number
- Team: Team assignment (for conflict detection)
- SubUnit: Department identifier (for filtering)
- Profile Image: Avatar URL or null
- Timestamps: Created and updated dates

**Indexes:**
- Email (unique)
- Employee ID (unique)

---

### Leaves Collection

**Core Data:**
- Employee: Reference to User document
- Employee Name: Denormalized for display
- Employee ID: Denormalized for frontend
- Leave Type: Type of leave
- From Date: Start date
- To Date: End date
- Duration: Days approved
- Status: Pending, Approved, Rejected, Cancelled, Taken, or Scheduled
- Comments: Employee's reason
- Manager Comment: Approval note
- Applied Date: Request timestamp

**Document Fields:**
- Original File Name: Uploaded document name
- Document URL: Link in /uploads folder
- Document Status: None, Pending, Verified, or Rejected (independent)

**Audit Trail:**
- Reviewed By: Manager who acted
- Reviewed At: When action taken
- SubUnit: Department (denormalized)

**Timestamps:** Created and updated dates

**Indexes:**
- Employee (filter by user)
- SubUnit (filter by department)
- From/To Dates (conflict detection)
- Status (filter by status)

---

### LeaveTypes Collection

**Data:**
- Name: Unique leave type name
- Days Per Year: Annual entitlement
- Situational: If true, doesn't count against yearly limit
- Description: Optional details

**Examples:**
- Annual Leave: 20 days/year
- Sick Leave: 12 days/year (situational)
- Personal Leave: 5 days/year

---

### Holidays Collection

**Data:**
- Name: Holiday name (Christmas, New Year, etc.)
- Date: Holiday date
- Recurring: If true, happens every year
- Length: Full Day or Half Day designation

**Timestamps:** Created and updated dates

---

## 3. RELATIONSHIPS & DATA FLOW

### Entity Relationships

```
┌─────────────────────────────────────────────────────┐
│                       User                          │
├─────────────────────────────────────────────────────┤
│ _id (PK)                                            │
│ email (unique)                                      │
│ employeeId (unique)                                 │
│ firstName, lastName                                 │
│ role: Admin | Manager | Employee                   │
│ team, subUnit, department                          │
└──────────────┬──────────────────────────────────────┘
               │ 1:N (one user has many leaves)
               │
┌──────────────┴──────────────────────────────────────┐
│                       Leave                         │
├─────────────────────────────────────────────────────┤
│ _id (PK)                                            │
│ employee (FK → User._id)                            │
│ leaveType                                           │
│ status: Pending | Approved | Rejected | Cancelled  │
│ document: { url, originalName }                     │
│ reviewedBy (FK → User._id, nullable)               │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                     LeaveType                       │
├─────────────────────────────────────────────────────┤
│ _id (PK)                                            │
│ name: String (unique)                               │
│ daysPerYear: Number                                 │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                      Holiday                        │
├─────────────────────────────────────────────────────┤
│ _id (PK)                                            │
│ name: String                                        │
│ date: Date                                          │
│ recurring: Boolean                                  │
└─────────────────────────────────────────────────────┘
```

### Denormalization Strategy

**Denormalized Fields on Leave:**
- `employeeName`: Avoids join to User for display
- `employeeId`: Frontend compatibility, faster queries
- `subUnit`: Enables manager to filter team's leaves without joining Users

**Why:** MongoDB lacks efficient JOINs; denormalization improves query performance at the cost of data redundancy.

---

## 4. DATA FLOW SCENARIOS

### Scenario 1: Employee Applies for Leave

1. User fills application form (dates, comments, optional document)
2. Frontend sends request with leave data
3. Backend receives and validates data
4. Saves leave record with employee details
5. Checks for team conflicts (overlapping leaves)
6. Returns confirmation with conflict information
7. Frontend displays success and updates leave list

### Scenario 2: Manager Reviews Leave

1. Manager navigates to leave approval page
2. Backend retrieves leaves for their department
3. Leaves displayed with employee info, dates, type
4. Manager clicks Approve or Reject
5. Backend updates leave status
6. Records who made decision and when
7. Frontend displays updated leave list with new status

### Scenario 3: Document Verification

**Important:** Document verification is independent from leave approval

1. Manager views leave with attached document
2. Manager clicks Verify or Reject Document
3. Backend updates document status only
4. Leave status unchanged (stays Approved, Pending, etc.)
5. Frontend shows document status separately

**Possible Combinations:**
- Leave Approved + Document Verified ✅
- Leave Approved + Document Rejected ⚠️
- Leave Rejected + Document Verified (edge case)

### Scenario 4: Conflict Detection

1. User enters leave dates in application form
2. Frontend queries backend for overlapping leaves
3. Backend finds leaves with date overlap by team
4. Returns list of conflicting leaves
5. Frontend displays warning about team members on leave
6. User can see who else is on leave same dates
7. Submission still allowed (warning only, not blocking)

---

## 5. CRUD OPERATIONS

**Create (C):**
- User registration: Create user with hashed password
- Leave application: Create leave record with employee details
- Document upload: Save file and store reference in leave
- Leave type creation: Add new configurable leave type

**Read (R):**
- Get user by email: For login authentication
- Get user by ID: For profile display
- Get leaves: Filtered by role (admin sees all, manager sees department, employee sees own)
- Find conflicts: Query overlapping leaves by team and date

**Update (U):**
- Update leave status: Change to Approved or Rejected
- Verify document: Update document status
- Update user profile: Change employee information

**Delete (D):**
- Cancel leave: Soft delete by changing status to Cancelled
- Hard delete: Rarely used, preserves audit trail better with soft delete

---

## 6. VALIDATION & CONSISTENCY

**User Fields:**
- First/Last name: Required, non-empty
- Email: Required, unique, lowercase
- Password: Required, minimum 6 characters (hashed before storage)
- Role: Must be Admin, Manager, or Employee
- SubUnit: Required, default provided

**Leave Fields:**
- Employee: Required reference to User
- Leave Type: Required string
- Dates: Both required, valid date objects
- Duration: Required number, must be positive
- Status: Must be valid status enum
- Document Status: Must be valid document status enum

**Leave Type:**
- Name: Required, unique
- Days Per Year: Required, positive number

**Holiday:**
- Name: Required
- Date: Required
- Length: Must be Full Day or Half Day

**Application-Level Validation:**
- Login: Checks email/password exist, role matches user's actual role
- Leave Update: Validates status change only allowed from Pending
- Document Verify: Validates document is in Pending state before approval

---

## 7. BACKUP & RECOVERY

### MongoDB Atlas Features
- Automated daily backups (30-day retention)
- Point-in-time recovery (for paid tiers)
- Replica set redundancy

### Data Export
```bash
mongodump --uri "mongodb+srv://user:pass@cluster.mongodb.net/db_name"
mongorestore --uri "mongodb+srv://user:pass@cluster.mongodb.net/db_name" ./dump/
```

---

## 8. PERFORMANCE CHARACTERISTICS

### Query Performance

**Fast Queries:**
- `User.findById()` - indexed by _id (default)
- `User.findOne({ email })` - unique index exists
- `Leave.find({ employee: userId })` - indexed
- `Leave.find({ subUnit: dept })` - indexed

**Potentially Slow Queries:**
- `Leave.find({ status: 'Pending' })` - could add index if frequent
- `Holiday.find()` - small collection, acceptable

### Data Volume Expectations

**Typical Company (500 employees):**
- Users: 500 documents (~2KB each) = 1MB
- Leaves/year: 500 × 20 days = 10,000 documents (~5KB each) = 50MB
- LeaveTypes: 5 documents
- Holidays: 50 documents
- **Total: ~60MB** - well within MongoDB free tier

---

## 9. SCALABILITY CONSIDERATIONS

### As Company Grows

**If 5,000+ employees:**
- Enable sharding by `employeeId`
- Add index on `status` for faster filters
- Consider archiving old leaves (> 2 years)

**If leaves/month increases:**
- Add compound index: `{ employee: 1, appliedDate: -1 }`
- Enable connection pooling (already in Mongoose)
- Consider read replicas for reporting

---

## SUMMARY

The database design uses **MongoDB with intentional denormalization:**

✅ **Strengths:**
- Flexible schema for evolving requirements
- Denormalized data improves query speed
- Referential integrity via ObjectId references
- Automatic timestamps (createdAt, updatedAt)
- Built-in audit trail (reviewedBy, reviewedAt)

⚠️ **Trade-offs:**
- Denormalization requires careful updates
- No built-in JOINs (must handle in application)
- Consistency relies on application logic, not database constraints

**Key Design Decisions:**
1. **Denormalization** of `employeeName`, `employeeId`, `subUnit` on Leave for query efficiency
2. **Soft deletes** using `status: 'Cancelled'` to preserve audit trail
3. **Independent document workflow** allows verification separate from leave approval
4. **Enum constraints** for status fields to prevent invalid states
5. **Indexes on** frequently queried fields (employee, subUnit, dates)

**Data Integrity:**
- Password hashing enforced via pre-save hook
- No explicit foreign key constraints (MongoDB limitation)
- Application must ensure referential integrity
