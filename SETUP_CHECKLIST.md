# Registration System - Complete Setup Guide

## What Was Created

You now have a complete web app for QR code scanning inventory tracking with good/not good status categorization by model.

### 📁 Files Created

```
wip/
├── README.md                          ← START HERE - Full documentation
├── DATABASE_DESIGN.md                 ← How database works
├── PROJECT_STRUCTURE.md               ← File organization
├── SETUP_CHECKLIST.md                 ← This file
│
├── backend/
│   ├── index.js                       ← Express API server (main)
│   ├── db.js                          ← Database functions (main)
│   ├── init.sql                       ← Database schema (run once)
│   ├── seed.js                        ← Sample data (run once)
│   ├── package.json                   ← Dependencies
│   └── .env.example                   ← Copy to .env
│
├── frontend/
│   ├── index.html                     ← Complete web interface (only file!)
│   └── package.json                   ← Optional for build tools
```

## Quick Start (5 Steps)

### Step 1: Database Setup
```bash
# Create database (run once)
mysql -u root
> CREATE DATABASE wip_scanner;
> EXIT;
```

### Step 2: Backend Setup
```bash
cd c:\Marcelo\wip\backend

# Copy environment file
copy .env.example .env

# Edit .env with your MySQL credentials
# (notepad .env)

# Install packages
npm install

# Initialize database
mysql -u root wip_scanner < init.sql

# Load sample parts
npm run seed
```

### Step 3: Start Backend
```bash
npm start
# Should see: QR Scanner API running on http://localhost:3000
```

### Step 4: Open Frontend
Open in browser:
```
file:///c:/Marcelo/wip/frontend/index.html
```

### Step 5: Start Scanning!
1. Click "Scanner" tab
2. Scan QR code: `P00.558-00 900 250814-004`
3. Click **GOOD** or **NOT GOOD**
4. Done!

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│          FRONTEND (index.html)                          │
│  - Scanner Tab (scan QR codes)                          │
│  - History Tab (search scans)                           │
│  - Inventory Tab (view by model)                        │
└────────────────┬────────────────────────────────────────┘
                 │ JSON via HTTP
┌────────────────v────────────────────────────────────────┐
│          BACKEND (Node.js/Express)                      │
│  - POST /api/scan                                       │
│  - GET /api/scans, /api/models, /api/inventory         │
│  - PATCH /api/scans (update status)                    │
│  - POST /api/archive                                    │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────v────────────────────────────────────────┐
│          DATABASE (MySQL)                               │
│  ├─ parts (master list)                                │
│  ├─ scans (transaction log)                            │
│  ├─ inventory_summary (aggregates)                     │
│  └─ audit_log (compliance)                             │
└─────────────────────────────────────────────────────────┘
```

## Key Features Implemented

| Feature | Where | How It Works |
|---------|-------|------------|
| QR Parsing | db.js::parseQRCode() | Splits "P00.558-00 900 250814-004" |
| Scan Recording | db.js::recordScan() | INSERT to scans table |
| Good/Not Good | frontend buttons | POST to /api/scan |
| Model Grouping | inventory_summary | Auto-group by model |
| Audit Trail | audit_log table | Track all changes |
| History Search | /api/scans/:part | List all scans for part |
| Archive | /api/archive/:part | Mark as archived |

## Frontend Workflow

```
┌─────────────────────────────────────────────────────┐
│  1. SCANNER TAB                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ [Scan QR code here...________________]       │  │
│  │ [GOOD] [NOT GOOD]                       │  │
│  │                                              │  │
│  │ Scan Recorded Successfully!               │  │
│  │ GOOD                                       │  │
│  │ Part: P00.558-00                             │  │
│  │ Model: IDB Gen2.0 (F Variant)                │  │
│  │ Quantity: 900                                │  │
│  │ Batch: 250814-004                            │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  2. HISTORY TAB                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ [P00.558-00________________] [Load History]  │  │
│  │                                              │  │
│  │ | Date/Time | Qty | Status | Batch |        │  │
│  │ | 14:30 | 900 | ✓ GOOD | 250814-004 |      │  │
│  │ | 14:35 | 50  | ✗ NOT GOOD | 250814-004 |  │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  3. INVENTORY TAB                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │ [-- Select a Model --v]                     │  │
│  │                                              │  │
│  │ 900 Good | 50 Not Good | 9 Parts            │  │
│  │                                              │  │
│  │ | Part | Good | Not Good | Total |          │  │
│  │ | P00.558-00 | 900 | 50 | 950 |            │  │
│  │ | P00.558-01 | 500 | 0 | 500 |             │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Database Tables

### parts (Master Reference)
- part_number (unique key)
- model (for grouping)
- description

### scans (Main Transaction Log)
- part_number (foreign key)
- quantity (units scanned)
- quality_status ('good' or 'not_good')
- batch_date, batch_number
- scanned_at (timestamp)
- archived_at (optional)

### inventory_summary (Fast Aggregates)
- model, part_number
- total_good, total_not_good
- wip_qty, sap_qty, delta (for comparison)

### audit_log (Compliance)
- scan_id, action, old_status, new_status
- created_at, user_notes

## Configuration Files

### backend/.env (REQUIRED - create by copying .env.example)
```
DB_HOST=localhost          # Your MySQL server
DB_USER=root               # MySQL username
DB_PASSWORD=yourpassword   # MySQL password
DB_NAME=wip_scanner        # Database name
PORT=3000                  # API port
```

### frontend/index.html
- Line 11: API_URL = 'http://localhost:3000/api'
  → Change if backend on different machine
- Customize colors/styling in <style> tag
- Add more parts to seed.js

## 🧪 Test It

### 1. Test API directly
```bash
# In PowerShell after starting npm start:
curl -X POST http://localhost:3000/api/scan `
  -H "Content-Type: application/json" `
  -d '{"qr_code":"P00.558-00 900 250814-004","quality_status":"good"}'

# Expected response:
{
  "success": true,
  "data": {
    "scan_id": 1,
    "part_number": "P00.558-00",
    "quantity": 900,
    "quality_status": "good",
    "model": "IDB Gen2.0 (F Variant)"
  }
}
```

### 2. Test Frontend
- Open index.html in browser
- Type or paste: P00.558-00 900 250814-004
- Click "GOOD" or "NOT GOOD"
- See confirmation with details

### 3. View in Database
```bash
mysql -u root wip_scanner
> SELECT * FROM scans;
> SELECT * FROM inventory_summary;
```

## Common Issues

| Issue | Solution |
|-------|----------|
| "DB_HOST not found" | Create backend/.env from .env.example |
| "Connection refused" | Start MySQL service |
| "Part not found" | Run `npm run seed` to add parts |
| QR scanner not working | Make sure input field has focus (click it) |
| API returns 400 | Check QR format: "PART QTY DATE-BATCH" |
| Can't connect API | Check backend is running on port 3000 |

## Next Steps

### Phase 1: Get Working
- [x] Database schema created
- [x] Backend API built
- [x] Frontend interface ready
- [ ] Test with your QR scanner hardware
- [ ] Add your actual part numbers to seed.js

### Phase 2: Customize
- [ ] Add more parts to database
- [ ] Customize UI colors/branding
- [ ] Setup automatic backups
- [ ] Create export reports

### Phase 3: Production
- [ ] Add user authentication
- [ ] Setup HTTPS/SSL
- [ ] Filter CORS by domain
- [ ] Setup monitoring/logging
- [ ] Train team on system

### Phase 4: Integration
- [ ] Connect to SAP system
- [ ] Sync with WIP system
- [ ] Automated email reports
- [ ] Mobile app version

## Support

1. Check documentation:
   - README.md - Overview & usage
   - DATABASE_DESIGN.md - Schema & workflows
   - PROJECT_STRUCTURE.md - File organization

2. Check error messages:
   - Browser console: F12 → Console tab
   - Backend terminal: Check logs
   - Database: Check MySQL errors

3. Test endpoints:
   - Use curl or Postman
   - Check API response format
   - Verify database has data

## Example QR Codes for Testing

```
P00.271-55 2399 250814-004
P00.271-63 2244 250814-005
P00.271-67 892 250814-006
P00.271-70 732 250814-007
P00.558-00 900 250814-008
P00.558-01 10728 250814-009
```

---

**Status:** Ready to use!

**Next:** Follow the Quick Start 5 Steps above, then click "Scanner" tab and start scanning.

Good luck!
