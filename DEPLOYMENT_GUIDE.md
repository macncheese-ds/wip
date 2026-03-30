# Registration System - Deployment & Setup Guide

## Quick Reference

**What's New:** This is a completely redesigned system using a **registration-based workflow** where items can be moved between 4 sections (GOOD, NOT GOOD, REPAIR, VALIDATION) before saving.

**Old System:** Simple scan→categorize→record workflow  
**New System:** Batch registration → scan to GOOD → drag between sections → save when complete

---

## Prerequisites

✓ MySQL 5.7+ (running and accessible)  
✓ Node.js 14+ (for backend server)  
✓ npm (for dependency management)  
✓ Port 3000 available (or configured in .env)  
✓ Web browser (Chrome, Firefox, or Edge)

---

## Step 1: Database Setup (One-Time)

### 1.1 Drop Old Database (if exists)
```powershell
# Connect to MySQL and drop old database
mysql -u root -e "DROP DATABASE IF EXISTS wip_scanner;"
```

### 1.2 Create New Database
```powershell
mysql -u root -e "CREATE DATABASE wip_scanner CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 1.3 Apply New Schema
```powershell
mysql -u root wip_scanner < C:\Marcelo\wip\backend\init.sql
```

### 1.4 Verify Tables Created
```powershell
mysql -u root wip_scanner -e "SHOW TABLES;"
```

**Expected Output:**
```
+-----------------------------+
| Tables_in_wip_scanner       |
+-----------------------------+
| audit_log                   |
| parts                       |
| registration_items          |
| registration_summary        |
| registrations               |
+-----------------------------+
```

✓ If you see 5 tables, database is ready!

---

## Step 2: Backend Setup

### 2.1 Navigate to Backend Directory
```powershell
cd C:\Marcelo\wip\backend
```

### 2.2 Create Environment File
```powershell
# Copy the example file
Copy-Item .env.example -Destination .env

# Open and edit (or use default values)
notepad .env
```

**Default .env (should work if MySQL uses default root with no password):**
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=wip_scanner
PORT=3000
```

### 2.3 Install Dependencies
```powershell
npm install
```

**Expected Output:**
```
added XX packages in X.XXs
```

### 2.4 Seed Sample Data
```powershell
npm run seed
```

**Expected Output:**
```
✓ Connected to database
✓ Inserted 9 sample parts
✓ Seed completed successfully
```

✓ Database now has 9 test parts ready for scanning

---

## Step 3: Start Backend Server

### 3.1 Start the Server
```powershell
npm start
```

**Expected Output:**
```
QR Scanner API running on http://localhost:3000
Database connected to wip_scanner
```

### 3.2 Keep Terminal Open
⚠️ **DO NOT CLOSE THIS TERMINAL** - your backend is running here!

### 3.3 Test API (Open NEW Terminal)
```powershell
Invoke-WebRequest http://localhost:3000/api/health
```

**Expected Response:**
```
OK
```

✓ Backend is running and responding!

---

## Step 4: Open Frontend

### In Browser Address Bar:
```
file:///c:/Marcelo/wip/frontend/index.html
```

Or navigate to: `C:\Marcelo\wip\frontend\index.html` and open with browser

**Expected:** Web page loads with title "QR Code Scanner - Registration System"

---

## Step 5: Test the Workflow

### 5.1 Main Page (Search & Create)

You should see:
- Search box at top
- "+ New Registration" button
- Empty registrations list (no registrations yet)

✓ **Action:**
1. Click "+ New Registration"
2. Modal appears with:
   - Batch Number: `BATCH-TEST-001`
   - Date: Pick today's date
3. Click "Create"
4. You're redirected to Detail Page

### 5.2 Detail Page (4 Sections)

You should see:
- Header showing your batch number and date
- QR Input field
- 4 sections: GOOD (green) | NOT GOOD (red) | REPAIR (yellow) | VALIDATION (blue)

✓ **Action - Scan Items:**
1. Click QR Input field
2. Paste: `P00.271-55 2399 250814-001`
3. Press Enter
4. Item appears in GOOD section:
   - **P00.271-55** (Model: FCM-30 A TOP) - Qty: 2399

✓ **Action - Scan Second Item:**
1. In QR Input: `P00.271-63 120 250814-001`
2. Press Enter
3. Item appears in GOOD section:
   - **P00.271-63** (Model: FCM-30 D) - Qty: 120

### 5.3 Move Items Between Sections

✓ **Option 1 - Use Action Buttons:**
1. Hover over item in GOOD section
2. Click red "BAD" button → moves to NOT GOOD
3. Click yellow "FIX" button → moves to REPAIR
4. Click blue "VALID" button → moves to VALIDATION

✓ **Option 2 - Drag & Drop:**
1. Click and hold item
2. Drag to different section
3. Release to drop

✓ **To Remove:**
- Click × button on item

### 5.4 Save Registration

✓ **Action:**
1. With items in different sections, click "✓ Save & Complete"
2. Backend confirms save
3. Status changes to "completed"
4. Returns to main page

✓ **On Main Page:**
- Your registration card appears
- Shows 4 section summary:
  - Green badge: count in GOOD
  - Red badge: count in NOT GOOD
  - Yellow badge: count in REPAIR
  - Blue badge: count in VALIDATION

### 5.5 View Archived Registration

✓ **Action:**
1. Click completed registration card on main page
2. Opens Detail Page in view-only mode
3. Shows all 4 sections with their final distribution
4. No QR input field (read-only)
5. No Save button

---

## Database Verification

After testing, verify data was saved correctly:

### Check Registrations Created
```powershell
mysql -u root wip_scanner -e "SELECT * FROM registrations;"
```

**Sample Output:**
```
+----+--------------------+-------------------+-------------+---------------------+-----------+
| id | batch_number       | registration_date | status      | created_at          | comp_time |
+----+--------------------+-------------------+-------------+---------------------+-----------+
| 1  | BATCH-TEST-001     | 2026-03-28        | completed   | 2026-03-28 14:30:00 |    ...    |
+----+--------------------+-------------------+-------------+---------------------+-----------+
```

### Check Items Were Recorded
```powershell
mysql -u root wip_scanner -e "SELECT registration_id, part_number, quantity, section FROM registration_items;"
```

**Sample Output:**
```
+------------------+----------------+----------+-----------+
| registration_id  | part_number    | quantity | section   |
+------------------+----------------+----------+-----------+
| 1                | P00.271-55     | 2399     | good      |
| 1                | P00.271-63     | 120      | repair    |
+------------------+----------------+----------+-----------+
```

### Check Summary Aggregated
```powershell
mysql -u root wip_scanner -e "SELECT * FROM registration_summary WHERE registration_id = 1;"
```

**Sample Output:**
```
+------------------+------------+----------------+----------+---------------+----------+-----------+
| registration_id  | model      | part_number    | good_qty | not_good_qty  | rep_qty  | valid_qty |
+------------------+------------+----------------+----------+---------------+----------+-----------+
| 1                | FCM-30 A   | P00.271-55     | 2399     | 0             | 0        | 0         |
| 1                | FCM-30 D   | P00.271-63     | 0        | 0             | 120      | 0         |
+------------------+------------+----------------+----------+---------------+----------+-----------+
```

✓ All data is persisted correctly!

---

## API Endpoints Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/registrations` | Create new batch |
| GET | `/api/registrations` | List all/search registrations |
| GET | `/api/registrations/:id` | Get registration details |
| POST | `/api/registrations/:id/items` | Add scanned item (to GOOD) |
| PATCH | `/api/registrations/:id/items/:item_id` | Move item to different section |
| DELETE | `/api/registrations/:id/items/:item_id` | Remove item |
| POST | `/api/registrations/:id/save` | Complete registration |
| GET | `/api/registrations/:id/summary` | Get summary by model |

---

## Troubleshooting

### ❌ "Cannot connect to database"

**Error in backend console:**
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Solutions:**
1. **Check MySQL is running:**
   ```powershell
   Get-Service MySQL57 | Select Status
   # If "Stopped", start it:
   Start-Service MySQL57
   ```

2. **Verify credentials in .env:**
   ```powershell
   mysql -u root -p  # Try connecting manually
   # If it asks for password but you left it blank, your password is wrong
   ```

3. **Check database exists:**
   ```powershell
   mysql -u root -e "SHOW DATABASES;"
   # Should see: wip_scanner
   ```

---

### ❌ "Port 3000 already in use"

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions:**
1. **Kill existing process:**
   ```powershell
   Get-Process node | Stop-Process
   # Or find which process uses port 3000:
   Get-NetTCPConnection -LocalPort 3000 | Select OwningProcess
   ```

2. **Use different port:**
   - Edit `.env` and change `PORT=3000` to `PORT=3001`
   - Update frontend: line 11 in `index.html`
   - Change `API_URL = 'http://localhost:3000/api'` to port 3001

---

### ❌ "Frontend shows errors in console"

**Open browser DevTools (F12):**
1. Console tab - shows JavaScript errors
2. Network tab - shows API calls
3. Check:
   - Is backend running? (`npm start` still open?)
   - Are API responses 200 OK?
   - Are CORS errors? (backend must allow origin)

---

### ❌ "Drag and drop not working"

**Verify:**
1. Browser supports drag-drop (Chrome/Firefox/Edge all do)
2. Refresh page (F5)
3. Check console for errors (F12)
4. Try action buttons instead (click "BAD", "FIX", "VALID")

---

### ❌ "Duplicate item error when scanning"

**This is intentional!** The system prevents duplicate parts in the same registration.

**Solution:**
- Use unique batch number
- Or scan into new registration

---

## Production Checklist

Before going live:

- [ ] Database backups configured
- [ ] MySQL password set (change root password)
- [ ] Backend runs on dedicated user account
- [ ] SSL/TLS certificates installed (if HTTPS needed)
- [ ] API authentication added (if exposed to network)
- [ ] Frontend API_URL points to production server
- [ ] Real parts loaded into database (edit seed.js)
- [ ] Performance tested with expected scan volume
- [ ] Audit logs reviewed for compliance

---

## Next Steps

1. **Customize Sample Data**
   - Edit `backend/seed.js` with your actual parts
   - Run `npm run seed` again

2. **Connect Real Scanner**
   - Configure scanner to output: `P00.558-00 900 250814-004`
   - Test with actual hardware

3. **Add Backup Strategy**
   ```powershell
   # Backup database
   mysqldump -u root wip_scanner > backup.sql
   ```

4. **Production Deployment**
   - Deploy backend to server
   - Use process manager (PM2, Windows Service, etc.)
   - Configure upstream database

---

## Quick Commands Reference

```powershell
# Stop backend
# Press Ctrl+C in backend terminal

# Restart backend (after fixes)
npm start

# Rebuild database from scratch
mysql -u root -e "DROP DATABASE IF EXISTS wip_scanner; CREATE DATABASE wip_scanner;"
mysql -u root wip_scanner < backend/init.sql
npm run seed

# View backend logs
# Check backend terminal console output

# Test API endpoint
Invoke-WebRequest http://localhost:3000/api/registrations

# Restart MySQL (if needed)
Restart-Service MySQL57
```

---

## Support & Questions

If you encounter issues:

1. **Check README.md** - Full system documentation
2. **Check DATABASE_DESIGN.md** - Schema and flow diagrams
3. **Check PROJECT_STRUCTURE.md** - File organization
4. **Review backend logs** - Terminal where `npm start` runs
5. **Check browser console** - F12 → Console tab

---

**System ready! 🚀**
