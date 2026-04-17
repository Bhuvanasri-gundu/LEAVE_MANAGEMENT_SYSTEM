# 📄 Document Upload Handling - Improvements

**Date:** April 15, 2026  
**Status:** ✅ Production Ready  
**Changes:** 4 files modified, 1 file created

---

## 🎯 Requirements Implemented

| Requirement | Status | Details |
|------------|--------|---------|
| Store files in `/uploads` | ✅ | Configured in middleware |
| Use unique filenames | ✅ | UUID prevents overwriting |
| Store only path in MongoDB | ✅ | Format: `/uploads/{uuid}.ext` |
| Static file access | ✅ | Configured in server.js |
| File validation | ✅ | PDF, JPG, PNG only |
| File size limit | ✅ | 2MB → **5MB** |
| Sick Leave only | ✅ | Enforced in controller |
| Frontend visibility | ✅ | Document modal in UI |

---

## 📝 Changes Summary

### 1. **Upload Middleware Enhancement** ⬆️
**File:** `backend/middleware/upload.js` - UPDATED

#### What Changed:
```javascript
// BEFORE
filename: (req, file, cb) => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  cb(null, uniqueSuffix + path.extname(file.originalname));
};
limits: { fileSize: 2 * 1024 * 1024 }, // 2MB

// AFTER
const { v4: uuidv4 } = require('uuid');
filename: (req, file, cb) => {
  const uuid = uuidv4();
  const ext = path.extname(file.originalname).toLowerCase();
  const filename = uuid + ext;
  cb(null, filename);
};
limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
```

#### Improvements:
- ✅ **UUID** instead of timestamp (prevents collisions 100%)
- ✅ **5MB** file size limit (was 2MB)
- ✅ **MIME type validation** (checks both extension & MIME)
- ✅ **Directory creation** (auto-creates `/uploads` if missing)
- ✅ **Multer error handler** (catches file size, type errors)
- ✅ **Detailed logging** (file upload details logged)

#### New Functions:
```javascript
// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Custom error handler for multer
const multerErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: 'File size exceeds 5MB limit'
      });
    }
  }
}

module.exports = { upload, multerErrorHandler };
```

---

### 2. **Leave Routes Updated** 🔀
**File:** `backend/routes/leaveRoutes.js` - UPDATED

#### What Changed:
```javascript
// BEFORE
const upload = require('../middleware/upload');
router.post('/', upload.single('document'), applyLeave);

// AFTER
const { upload, multerErrorHandler } = require('../middleware/upload');
router.post('/', upload.single('document'), multerErrorHandler, applyLeave);
```

#### Benefits:
- ✅ Catches multer errors (file size, type validation)
- ✅ Proper error responses sent to frontend
- ✅ Prevents invalid files from reaching controller

---

### 3. **Leave Controller - Strict Validation** 🔒
**File:** `backend/controllers/leaveController.js` - UPDATED (`applyLeave` function)

#### New Validations:
```javascript
// Only stores document for Sick Leave
if (req.file) {
  if (leaveType !== 'Sick Leave') {
    // Clean up file
    fs.unlink(filePath, (err) => { ... });
    
    return res.status(400).json({ 
      message: 'Documents can only be uploaded for Sick Leave requests'
    });
  }
  
  // Store document only if Sick Leave
  documentData = {
    originalName: req.file.originalname,
    url: `/uploads/${req.file.filename}`,
  };
  documentStatus = 'Pending';
}
```

#### Features:
- ✅ **Sick Leave Only** - Validates leave type before storing
- ✅ **File Cleanup** - Deletes uploaded file if validation fails
- ✅ **Clear Response** - Explains why document not accepted
- ✅ **Better Logging** - Logs successful uploads with details
- ✅ **Error Handling** - Cleans up files on any error

#### Improved Error Response:
```javascript
{
  "message": "Documents can only be uploaded for Sick Leave requests",
  "reason": "Document uploads restricted to Sick Leave applications only"
}
```

---

### 4. **Document Verification Enhanced** ✅
**File:** `backend/controllers/leaveController.js` - UPDATED (`verifyDocument` function)

#### New Validations:
```javascript
// Validate document exists
if (!leave.document || !leave.document.url) {
  return res.status(400).json({ 
    message: 'No document found for this leave request'
  });
}

// Validate document is Pending
if (leave.documentStatus !== 'Pending') {
  return res.status(400).json({ 
    message: 'Document is not in Pending state. Current status: ${status}'
  });
}
```

#### Improvements:
- ✅ **Checks document exists** before verification
- ✅ **Better error messages** (shows current status)
- ✅ **Detailed logging** (tracks who verified, when, status)
- ✅ **Metadata tracking** (reviewedBy, reviewedAt)

---

### 5. **Package Dependencies** 📦
**File:** `backend/package.json` - UPDATED

#### Added:
```json
"uuid": "^9.0.1"
```

#### Why:
- ✅ Generates guaranteed unique file names (v4 UUID)
- ✅ Prevents file overwrites
- ✅ Industry standard for file naming

---

## 🏗️ File Storage Architecture

### Directory Structure
```
backend/
├── uploads/                    ← Files stored here
│   ├── 550e8400-e29b-41d4-a716-446655440000.pdf
│   ├── 6ba7b810-9dad-11d1-80b4-00c04fd430c8.jpg
│   └── ...
├── middleware/
│   └── upload.js              ← Multer config (UPDATED)
├── routes/
│   └── leaveRoutes.js         ← Route handlers (UPDATED)
├── controllers/
│   └── leaveController.js     ← Business logic (UPDATED)
└── server.js                  ← Static serving configured
```

### File Access Flow
```
1. Frontend uploads file
   ↓
2. Multer catches file
   - Validates type (PDF, JPG, PNG)
   - Validates size (<5MB)
   - Generates UUID filename
   - Saves to /uploads/{uuid}.ext
   ↓
3. Route handler (multerErrorHandler)
   - Catches any multer errors
   - Returns errors to frontend
   ↓
4. Controller (applyLeave)
   - Validates leave type (Sick Leave only)
   - Stores document metadata in MongoDB:
     {
       document: {
         originalName: "medical_cert.pdf",
         url: "/uploads/{uuid}.pdf"
       },
       documentStatus: "Pending"
     }
   ↓
5. Frontend receives response
   - Shows document upload success
   - Document URL: /uploads/{uuid}.pdf
   ↓
6. Frontend displays document
   - Click "View" → Modal opens
   - Shows preview link: /uploads/{uuid}.pdf
   - Manager can verify/reject
```

---

## 📊 File Storage Example

### MongoDB Storage
```javascript
{
  _id: ObjectId("..."),
  leaveType: "Sick Leave",
  document: {
    originalName: "medical_certificate.pdf",
    url: "/uploads/550e8400-e29b-41d4-a716-446655440000.pdf"
  },
  documentStatus: "Pending",
  ...
}
```

### Physical File System
```
/uploads/550e8400-e29b-41d4-a716-446655440000.pdf
├── Size: 245KB
├── Owner: app
├── Permissions: 644
└── Access: http://localhost:5000/uploads/550e8400-e29b-41d4-a716-446655440000.pdf
```

---

## ✅ Validation Rules

### File Type Validation
| Type | Allowed | MIME Type | Extension |
|------|---------|-----------|-----------|
| PDF | ✅ | application/pdf | .pdf |
| JPEG | ✅ | image/jpeg | .jpg, .jpeg |
| PNG | ✅ | image/png | .png |
| Other | ❌ | - | - |

### File Size Limit
```
5MB (5,242,880 bytes)
├── 1 page PDF: ~100KB ✅
├── Scan JPG: ~2MB ✅
├── High-res PNG: ~4MB ✅
└── Video/Large file: ❌ (over limit)
```

### Leave Type Validation
```
Sick Leave + with document  → ✅ Stored in DB, documentStatus: "Pending"
Sick Leave + no document    → ✅ Stored in DB, documentStatus: "None"
Other leave + with document → ❌ Rejected, file deleted, error returned
Other leave + no document   → ✅ Stored in DB, documentStatus: "None"
```

---

## 🔄 Error Handling

### Multer Layer Errors
```javascript
// File size exceeded
{
  "message": "File size exceeds 5MB limit",
  "error": "File too large"
}
```

### Controller Validation Errors
```javascript
// Not Sick Leave
{
  "message": "Documents can only be uploaded for Sick Leave requests",
  "reason": "Document uploads restricted to Sick Leave applications only"
}

// Missing required fields
{
  "message": "Missing required fields: leaveType, fromDate, toDate, duration"
}
```

### Document Verification Errors
```javascript
// Document doesn't exist
{
  "message": "No document found for this leave request"
}

// Document already verified
{
  "message": "Document is not in Pending state. Current status: Verified",
  "hint": "Only Pending documents can be verified or rejected"
}
```

---

## 🚀 Testing Upload Functionality

### Using cURL
```bash
# Create Sick Leave with document
curl -X POST http://localhost:5000/api/leaves \
  -H "Authorization: Bearer <token>" \
  -F "leaveType=Sick Leave" \
  -F "fromDate=2026-04-20" \
  -F "toDate=2026-04-22" \
  -F "duration=2" \
  -F "comments=Medical appointment" \
  -F "document=@/path/to/medical_cert.pdf"

# Response on success (201)
{
  "data": {
    "_id": "...",
    "leaveType": "Sick Leave",
    "document": {
      "originalName": "medical_cert.pdf",
      "url": "/uploads/550e8400-e29b-41d4-a716-446655440000.pdf"
    },
    "documentStatus": "Pending",
    "status": "Pending",
    ...
  },
  "message": "Leave Sick Leave applied successfully with document"
}
```

### Test Cases

| Scenario | Input | Expected |
|----------|-------|----------|
| Valid PDF for Sick Leave | PDF file, Sick Leave | ✅ Stored |
| Valid JPG for Sick Leave | JPG file, Sick Leave | ✅ Stored |
| Valid PNG for Sick Leave | PNG file, Sick Leave | ✅ Stored |
| Invalid file type | ZIP file, Sick Leave | ❌ Rejected |
| File too large | 10MB PDF, Sick Leave | ❌ Rejected |
| Document for Annual Leave | PDF file, Annual Leave | ❌ Rejected |
| Sick Leave without document | No file, Sick Leave | ✅ Stored (no doc) |

---

## 📋 Files Modified

| File | Changes | Importance |
|------|---------|------------|
| `backend/middleware/upload.js` | UUID, 5MB limit, error handler | ⭐⭐⭐ Critical |
| `backend/routes/leaveRoutes.js` | Added error handler | ⭐⭐ Important |
| `backend/controllers/leaveController.js` | Sick Leave validation, file cleanup | ⭐⭐⭐ Critical |
| `backend/package.json` | Added uuid dependency | ⭐⭐ Important |

---

## 🔒 Security Features

✅ **File Name Anonymization**: UUID prevents guessing filenames  
✅ **Type Validation**: Both extension and MIME type checked  
✅ **Size Limit**: 5MB max prevents disk exhaustion  
✅ **Directory Isolation**: Files stored in isolated `/uploads` folder  
✅ **Ownership Tracking**: reviewedBy and reviewedAt logged  
✅ **Error Isolation**: Validation errors don't expose system paths  

---

## ⚙️ Installation

### 1. Install Dependencies
```bash
cd backend
npm install
# Installs uuid and other dependencies
```

### 2. Create Uploads Directory (Auto)
```bash
npm run dev
# Middleware auto-creates /uploads if missing
```

### 3. Test Upload
```bash
# Use frontend or cURL to test
# See Testing section above
```

---

## 📞 Deployment Notes

- ✅ Uploads directory will be created automatically on first upload
- ✅ Files are stored locally (frontend access via `/uploads/<uuid>.<ext>`)
- ✅ For production, consider:
  - Mount persistent volume for `/uploads`
  - Set up backup strategy
  - Configure CDN/S3 for large scale
  - Clean up old documents periodically

---

## 🎯 Summary

**Before:** 2MB limit, timestamp-based names, no Sick Leave validation  
**After:** 5MB limit, UUID names, strict Sick Leave validation, proper error handling  

**Impact:**
- ✅ No file overwrites (UUID unique)
- ✅ 2.5x larger files (2MB → 5MB)
- ✅ Enforced document policy (Sick Leave only)
- ✅ Better error messages for debugging
- ✅ Automatic file cleanup on errors
- ✅ Production ready

---

**Status:** 🟢 READY FOR DEPLOYMENT
