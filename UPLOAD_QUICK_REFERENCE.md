# 📄 Document Upload - Quick Reference

**Fast lookup for document upload implementation**

---

## ✅ All 8 Requirements - Status

| # | Requirement | Status | Details |
|---|-------------|--------|---------|
| 1 | Store files in `/uploads` | ✅ | Local folder storage, auto-created |
| 2 | Unique filenames | ✅ | UUID v4 prevents overwrites |
| 3 | Store only path in DB | ✅ | Format: `/uploads/{uuid}.ext` |
| 4 | Static file access | ✅ | URL: `http://localhost:5000/uploads/...` |
| 5 | File validation | ✅ | PDF, JPG, PNG only (dual validation) |
| 6 | File size limit | ✅ | 5MB (increased from 2MB) |
| 7 | Sick Leave only | ✅ | Enforced, other leaves rejected |
| 8 | Frontend visibility | ✅ | Document modal in manager view |

---

## 🔧 Files Modified

```
backend/middleware/upload.js          ← UUID, 5MB, MIME validation
backend/routes/leaveRoutes.js         ← Error handler added
backend/controllers/leaveController.js ← Sick Leave validation, cleanup
backend/package.json                  ← Added uuid dependency
```

---

## 📦 Installation

```bash
cd backend
npm install
npm run dev
```

---

## 📝 Key Code Changes

### Upload Middleware
```javascript
// UUID for unique names
const { v4: uuidv4 } = require('uuid');
filename: (req, file, cb) => {
  cb(null, uuidv4() + path.extname(file.originalname).toLowerCase());
};

// 5MB limit
limits: { fileSize: 5 * 1024 * 1024 }
```

### Controller (Sick Leave Validation)
```javascript
// Only Sick Leave accepts documents
if (leaveType !== 'Sick Leave') {
  fs.unlink(req.file.path, ...);  // Clean up
  return res.status(400).json({ 
    message: 'Documents can only be uploaded for Sick Leave requests'
  });
}
```

---

## 🧪 Test Upload

```bash
curl -X POST http://localhost:5000/api/leaves \
  -H "Authorization: Bearer $TOKEN" \
  -F "leaveType=Sick Leave" \
  -F "fromDate=2026-04-20" \
  -F "toDate=2026-04-20" \
  -F "duration=1" \
  -F "document=@file.pdf"
```

---

## ✅ Validation Rules

| Rule | Value |
|------|-------|
| Allowed Types | PDF, JPG, PNG |
| Max Size | 5MB |
| Accepted for | Sick Leave only |
| Filename Format | `{uuid}.{ext}` |
| Storage | `/uploads/` |
| DB Entry | `/uploads/{uuid}.{ext}` |

---

## 🎯 File Flow

```
1. Upload PDF → 2. Multer validates → 3. UUID filename
   ↓
4. Store in /uploads/ → 5. Save path to DB → 6. Response to frontend
   ↓
7. Manager clicks View → 8. Modal opens → 9. Display document
   ↓
10. Click Open → 11. Download/View → 12. Verify/Reject
```

---

## 🔒 Security

✅ UUID prevents guessing  
✅ Dual validation (MIME + ext)  
✅ Size limit prevents attacks  
✅ File cleanup on errors  
✅ Isolated directory  

---

## 📊 Before → After

| Feature | Before | After |
|---------|--------|-------|
| Filename | Timestamp | UUID |
| Size | 2MB | 5MB |
| Validation | Extension | MIME + Ext |
| Sick Leave Check | No | Yes |
| Auto Cleanup | No | Yes |

---

## 📚 Documentation

```
DOCUMENT_UPLOAD_IMPROVEMENTS.md    ← Technical details
DOCUMENT_UPLOAD_TESTING.md         ← Test cases & cURL
UPLOAD_REQUIREMENTS_SUMMARY.md     ← Quick checklist
DOCUMENT_UPLOAD_COMPLETE.md        ← Complete reference
```

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| `/uploads` not found | Auto-created on first upload |
| File not saved | Check NODE_ENV, permissions |
| Can't access file | Verify URL path in DB |
| Upload rejected | Check file type & size |

---

## ✨ Success Indicators

✅ Backend runs without errors  
✅ `/uploads` created automatically  
✅ Files save with UUID names  
✅ Manager sees "View" button  
✅ Document modal displays  
✅ Non-Sick Leave rejects docs  

---

**Status:** 🟢 PRODUCTION READY
