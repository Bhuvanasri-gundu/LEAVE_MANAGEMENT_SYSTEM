# 🧪 Document Upload - Testing Guide

**Quick Reference for Testing Document Uploads**

---

## 🚀 Quick Start Test

### Step 1: Start Server
```bash
cd backend
npm install  # Install uuid dependency
npm run dev
```

### Step 2: Login (Get Token)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "emp@smartleave.com",
    "password": "pass123",
    "role": "Employee"
  }'

# Save the token from response
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI..."
```

### Step 3: Test Upload - Valid PDF (Sick Leave)
```bash
curl -X POST http://localhost:5000/api/leaves \
  -H "Authorization: Bearer $TOKEN" \
  -F "leaveType=Sick Leave" \
  -F "fromDate=2026-04-20" \
  -F "toDate=2026-04-22" \
  -F "duration=2" \
  -F "comments=Medical appointment" \
  -F "document=@test.pdf"

# Expected: 201 (Created)
# Response includes: document.url like "/uploads/550e8400-e29b-41d4-a716-446655440000.pdf"
```

### Step 4: Test Invalid Upload - Wrong Leave Type
```bash
curl -X POST http://localhost:5000/api/leaves \
  -H "Authorization: Bearer $TOKEN" \
  -F "leaveType=Annual Leave" \
  -F "fromDate=2026-04-20" \
  -F "toDate=2026-04-22" \
  -F "duration=2" \
  -F "comments=Vacation" \
  -F "document=@test.pdf"

# Expected: 400 (Bad Request)
# Response: "Documents can only be uploaded for Sick Leave requests"
```

---

## 📝 Test Cases

### ✅ Valid Tests (Should Succeed)

#### Test 1: PDF Upload for Sick Leave
```bash
COMMAND:
curl -X POST http://localhost:5000/api/leaves \
  -H "Authorization: Bearer $TOKEN" \
  -F "leaveType=Sick Leave" \
  -F "fromDate=2026-04-20" \
  -F "toDate=2026-04-20" \
  -F "duration=1" \
  -F "document=@document.pdf"

EXPECTED:
Status: 201
documentStatus: "Pending"
document.url: "/uploads/<uuid>.pdf"
```

#### Test 2: JPG Upload for Sick Leave
```bash
COMMAND:
curl -X POST http://localhost:5000/api/leaves \
  -H "Authorization: Bearer $TOKEN" \
  -F "leaveType=Sick Leave" \
  -F "fromDate=2026-04-20" \
  -F "toDate=2026-04-20" \
  -F "duration=1" \
  -F "document=@prescription.jpg"

EXPECTED:
Status: 201
document.url: "/uploads/<uuid>.jpg"
```

#### Test 3: PNG Upload for Sick Leave
```bash
COMMAND:
curl -X POST http://localhost:5000/api/leaves \
  -H "Authorization: Bearer $TOKEN" \
  -F "leaveType=Sick Leave" \
  -F "fromDate=2026-04-20" \
  -F "toDate=2026-04-20" \
  -F "duration=1" \
  -F "document=@scan.png"

EXPECTED:
Status: 201
document.url: "/uploads/<uuid>.png"
```

#### Test 4: Sick Leave Without Document
```bash
COMMAND:
curl -X POST http://localhost:5000/api/leaves \
  -H "Authorization: Bearer $TOKEN" \
  -F "leaveType=Sick Leave" \
  -F "fromDate=2026-04-20" \
  -F "toDate=2026-04-20" \
  -F "duration=1"

EXPECTED:
Status: 201
documentStatus: "None"
document: null
```

---

### ❌ Invalid Tests (Should Fail)

#### Test 5: Document Upload for Annual Leave
```bash
COMMAND:
curl -X POST http://localhost:5000/api/leaves \
  -H "Authorization: Bearer $TOKEN" \
  -F "leaveType=Annual Leave" \
  -F "fromDate=2026-04-20" \
  -F "toDate=2026-04-22" \
  -F "duration=2" \
  -F "document=@document.pdf"

EXPECTED:
Status: 400
Message: "Documents can only be uploaded for Sick Leave requests"
```

#### Test 6: Wrong File Type (ZIP)
```bash
COMMAND:
curl -X POST http://localhost:5000/api/leaves \
  -H "Authorization: Bearer $TOKEN" \
  -F "leaveType=Sick Leave" \
  -F "fromDate=2026-04-20" \
  -F "toDate=2026-04-20" \
  -F "duration=1" \
  -F "document=@archive.zip"

EXPECTED:
Status: 400
Message: "Invalid file type. Only PDF, JPG, PNG files are allowed..."
```

#### Test 7: File Size Exceeds 5MB
```bash
COMMAND:
curl -X POST http://localhost:5000/api/leaves \
  -H "Authorization: Bearer $TOKEN" \
  -F "leaveType=Sick Leave" \
  -F "fromDate=2026-04-20" \
  -F "toDate=2026-04-20" \
  -F "duration=1" \
  -F "document=@huge_file.pdf"  # 10MB file

EXPECTED:
Status: 400
Message: "File size exceeds 5MB limit"
```

#### Test 8: Wrong Extension with PDF Content
```bash
COMMAND:
# Rename PDF to .txt but keep PDF content
curl -X POST http://localhost:5000/api/leaves \
  -H "Authorization: Bearer $TOKEN" \
  -F "leaveType=Sick Leave" \
  -F "fromDate=2026-04-20" \
  -F "toDate=2026-04-20" \
  -F "duration=1" \
  -F "document=@document.txt"  # PDF content, wrong extension

EXPECTED:
Status: 400
Message: "Invalid file type..."
```

---

## 🧪 Browser Testing

### Upload via Frontend

1. **Open Frontend**
   ```
   http://localhost:5173
   ```

2. **Login as Employee**
   - Email: emp@smartleave.com
   - Password: pass123

3. **Go to Apply Leave**
   - Select: Sick Leave
   - Dates: Any dates
   - Click: "Add Document"
   - Choose: PDF/JPG/PNG file
   - Submit

4. **Verify**
   - Should see success message
   - Go to Dashboard → Leave List
   - Click "View" on document
   - Should see document preview modal

---

## 📊 Expected Behaviors

### File Saved Correctly
```bash
# Check file exists
ls -la backend/uploads/

# Should show UUID-named files
# Example: 550e8400-e29b-41d4-a716-446655440000.pdf
```

### Database Entry
```bash
# Query MongoDB
db.leaves.findOne({"document.url": {$ne: null}})

# Should show
{
  ...
  document: {
    originalName: "medical_cert.pdf",
    url: "/uploads/550e8400-e29b-41d4-a716-446655440000.pdf"
  },
  documentStatus: "Pending"
}
```

### File Accessible
```bash
# File should be accessible at
curl http://localhost:5000/uploads/550e8400-e29b-41d4-a716-446655440000.pdf

# Should return file content with proper headers
# Content-Type: application/pdf
# Content-Length: <file-size>
```

---

## 🔍 Debugging

### Check Uploads Folder Created
```bash
# Should exist after first upload
ls -la backend/uploads/

# If not, create manually
mkdir backend/uploads
```

### Check File Permissions
```bash
# Files should be readable
stat backend/uploads/550e8400-e29b-41d4-a716-446655440000.pdf

# Should show readable permissions (644)
```

### Check Backend Logs
```bash
# Look for upload logs
npm run dev 2>&1 | grep -i "document\|uploaded"

# Should show
✅ Document uploaded for Sick Leave: { originalName: ..., uploadedFile: ..., ... }
```

### Check Browser Console
```javascript
// After uploading, check frontend console
console.log(leaveData.document) // Should show {name: "...", url: "/uploads/..."}
```

---

## 📋 Test Coverage Checklist

- [ ] ✅ Valid PDF upload → 201, saved
- [ ] ✅ Valid JPG upload → 201, saved
- [ ] ✅ Valid PNG upload → 201, saved
- [ ] ✅ No document upload → 201, documentStatus: "None"
- [ ] ❌ ZIP file upload → 400, rejected
- [ ] ❌ Annual Leave + PDF → 400, rejected
- [ ] ❌ 10MB file → 400, too large
- [ ] ✅ File accessible via URL
- [ ] ✅ UUID prevents overwrites
- [ ] ✅ Database stores correct metadata

---

## 🚀 Load Testing (Optional)

### Test Multiple Uploads
```bash
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/leaves \
    -H "Authorization: Bearer $TOKEN" \
    -F "leaveType=Sick Leave" \
    -F "fromDate=2026-04-20" \
    -F "toDate=2026-04-20" \
    -F "duration=1" \
    -F "document=@test_$i.pdf"
  echo "Upload $i completed"
done

# All should have different UUIDs in /uploads/
```

---

## 📞 Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | No token or expired | Get new token from /auth/login |
| 400 Bad Request | Invalid file type | Use PDF, JPG, or PNG |
| 413 Payload Too Large | File >5MB | Reduce file size |
| 404 Not Found | Leave not found | Check leave ID |
| 500 Server Error | Server issue | Check backend logs |
| File not accessible | Wrong path | Check document.url in DB |

---

**Status:** ✅ Ready for Testing
