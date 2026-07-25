# Project File Structure

```
c:\Marcelo\wip\
│
├── README.md                          # Main documentation
├── DATABASE_DESIGN.md                 # Database schema & workflow
├── start.bat                          # Windows quick start script
│
├── backend/
│   ├── index.js                       # Express API server
│   │   └── Routes:
│   │       - POST   /api/scan              (Record QR scan)
│   │       - GET    /api/scans/:part      (Scan history)
│   │       - GET    /api/models           (List all models)
│   │       - GET    /api/inventory/model  (Inventory by model)
│   │       - PATCH  /api/scans/:id        (Update status)
│   │       - POST   /api/archive/:part    (Archive scans)
│   │
│   ├── db.js                          # Database functions
│   │   ├── parseQRCode()              (Parse QR format)
│   │   ├── recordScan()               (Insert scan)
│   │   ├── getInventoryByModel()      (Get summary)
│   │   ├── updateScanStatus()         (Change quality)
│   │   └── archiveScans()             (Archive records)
│   │
│   ├── init.sql                       # Database schema
│   │   ├── CREATE TABLE parts         (Part master data)
│   │   ├── CREATE TABLE scans         (Transaction log)
│   │   ├── CREATE TABLE inventory_summary (Aggregates)
│   │   └── CREATE TABLE audit_log     (Compliance)
│   │
│   ├── seed.js                        # Sample data loader
│   │
│   ├── package.json                   # Dependencies
│   │   ├── express ^4.18.2
│   │   ├── mysql2 ^3.6.0
│   │   ├── cors ^2.8.5
│   │   └── dotenv ^16.0.3
│   │
│   ├── .env.example                   # Environment template
│   └── .env (create after copying)    # Your database credentials
│
├── frontend/
│   ├── index.html                     # Complete web app
│   │   ├── Scanner Tab:
│   │   │   - QR code input field
│   │   │   - Good/Not Good buttons
│   │   │   - Real-time feedback
│   │   │
│   │   ├── History Tab:
│   │   │   - Part number search
│   │   │   - Scan history table
│   │   │   - Timestamps & status
│   │   │
│   │   └── Inventory Tab:
│   │       - Model selector
│   │       - Summary statistics
│   │       - Part breakdown
│   │
│   ├── package.json                   # Frontend scripts (optional)
│   └── src/                           # Ready for component expansion
│
└── node_modules/                      # Installed packages (after npm install)
```

## Setup Sequence

```bash
1. create database
   └─> mysql -u root -e "CREATE DATABASE wip_scanner"

2. install backend
   └─> cd backend && npm install

3. configure database
   └─> copy .env.example to .env
   └─> edit .env with DB credentials

4. initialize schema
   └─> mysql -u root wip_scanner < init.sql

5. seed sample data
   └─> npm run seed

6. start backend server
   └─> npm start
   └─> listens on http://localhost:3000

7. open frontend in browser
   └─> file:///c:/Marcelo/wip/frontend/index.html
   └─> or use http://localhost:8000 with local server
```

## File Purpose Summary

| File | Purpose | Important |
|------|---------|-----------|
| index.js | Express API | [x] Core server |
| db.js | Database logic | [x] Core queries |
| init.sql | Database schema | [x] Run once |
| seed.js | Sample parts | [x] Run once |
| index.html | Web interface | [x] Main UI |
| .env | Secrets | [x] Never commit |
| start.bat | Quick launch | Windows only |

## Key Configuration Files

### backend/.env
```
DB_HOST=localhost          # MySQL server
DB_USER=root               # DB username
DB_PASSWORD=               # DB password
DB_NAME=wip_scanner        # Database name
PORT=3000                  # API port
```

### frontend/index.html
- Change `API_URL` if backend on different server
- Modify styling in `<style>` tag
- Add more models in SAMPLE_PARTS

## Customization Points

### Add New Part
Edit `backend/seed.js`:
```javascript
{
  part_number: 'P00.999-99',
  model: 'Your Model',
  description: 'Your description'
}
```

### Change QR Format
Edit `backend/db.js` function `parseQRCode()`:
```javascript
// Default: "P00.558-00 900 250814-004"
// Regex pattern for split logic
```

### UI Styling
Edit `frontend/index.html` `<style>` section:
- Colors in CSS variables
- Layout with CSS Grid/Flexbox
- Responsive breakpoints

### API Response
All endpoints return JSON:
```javascript
{ 
  success: true/false,
  data: {...},
  error: "message if failed"
}
```

## Production Checklist

- [ ] Create proper .env with real credentials
- [ ] Change default MySQL password
- [ ] Add HTTPS/SSL certificates
- [ ] Setup authentication/login
- [ ] Enable CORS only for trusted domains
- [ ] Setup database backups
- [ ] Configure error logging
- [ ] Add rate limiting
- [ ] Test QR scanner hardware
- [ ] Train team on usage
