# WIP QR Scanner - Registrations & Inventory System

Complete web application for scanning QR codes and organizing items into 4 sections: **GOOD**, **NOT GOOD**, **REPAIR**, **VALIDATION**.

## 📋 Overview

**New Workflow:**
1. **Main Page**: Search or create registrations by batch number
2. **Detail Page**: 4 columns (GOOD | NOT GOOD | REPAIR | VALIDATION)
   - Scan QR codes → items appear in GOOD section
   - Drag/click to move items to other sections
   - Save when done
3. **Archive**: View completed registrations with aggregated data by model

**QR Code Format:** `P00.558-00 900 250814-004`
- Part Number: `P00.558-00`
- Quantity: `900`
- Batch: `250814-004`

## 🗄️ Database Schema

### Tables
- **parts**: Master list of part numbers and models
- **registrations**: Batch/work order with date and status
- **registration_items**: Items in each registration (one per part per registration, stored in ONE section)
- **registration_summary**: Aggregated counts per model and part
- **audit_log**: Track all movements between sections

### Key Differences from Old Design
- No "scans" table → now use "registration_items"
- One registration per batch/work order
- Each part appears in ONLY ONE section
- Items move between sections as you sort them
- Save completes the registration

## 🚀 Setup Instructions

### Prerequisites
- Node.js 14+
- MySQL 5.7+
- QR code scanner or barcode scanner app

### 1. Database Setup

Create database:
```bash
mysql -u root
> CREATE DATABASE wip_scanner CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
> EXIT;
```

Run schema:
```bash
mysql -u root wip_scanner < backend/init.sql
```

### 2. Backend Setup

```bash
cd backend

# Copy and edit environment file
cp .env.example .env
# Edit .env with your database credentials

# Install dependencies
npm install

# Seed sample parts
npm run seed

# Start server
npm start
```

Server runs on `http://localhost:3000`

### 3. Frontend Setup

Open in browser:
```
file:///c:/Marcelo/wip/frontend/index.html
```

## 📱 Usage

### Main Page
1. **Search**: Find registrations by batch number or date
2. **+ New Registration**: Create new batch/work order
   - Enter Batch Number (e.g., `BATCH-2026-03-28-001`)
   - Select Registration Date
   - Click "Create"

### Detail Page
1. **Scan QR Code**: 
   - Focus on input field
   - Scan or type QR code
   - Press Enter
   - Item appears in GOOD section

2. **Move Items**:
   - Click buttons: GOOD | BAD | FIX | VALID
   - OR drag item between sections

3. **Save**:
   - Click "✓ Save & Complete"
   - Registration marked as completed
   - Back to main page

### Archive View
- Click any completed registration
- View 4 sections side-by-side with data by model
- Read-only (can't modify completed registration)

## 🔌 API Endpoints

### POST /api/registrations
Create new registration
```json
{
  "batch_number": "BATCH-001",
  "registration_date": "2026-03-28"
}
```

### GET /api/registrations
List registrations with search
```
GET /api/registrations?search=BATCH-001
```

### GET /api/registrations/:id
Get registration detail with items by section

### POST /api/registrations/:id/items
Scan & add item (goes to GOOD section by default)
```json
{
  "qr_code": "P00.558-00 900 250814-004"
}
```

### PATCH /api/registrations/:id/items/:item_id
Move item to different section
```json
{
  "new_section": "not_good"
}
```

### DELETE /api/registrations/:id/items/:item_id
Remove item from registration

### POST /api/registrations/:id/save
Mark registration as completed

### GET /api/registrations/:id/summary
Get summary by model (for archive view)

## 📊 Data Organization

### During Work
```
Registration: BATCH-2026-03-28-001
├─ GOOD Section
│  ├─ P00.558-00 (900 units) → Model: IDB Gen2.0
│  └─ P00.271-63 (2244 units) → Model: FCM-30 D
├─ NOT GOOD Section  
│  └─ P00.558-00 (50 units) → Model: IDB Gen2.0
├─ REPAIR Section
│  └─ (empty)
└─ VALIDATION Section
   └─ P00.271-55 (100 units) → Model: FCM-30 A
```

### After Saving (Archive)
View shows totals grouped by model:
```
Registration: BATCH-2026-03-28-001 [COMPLETED]

FCM-30 A TOP
├─ P00.271-55: GOOD=892, NOT_GOOD=0, REPAIR=0, VALIDATION=0
└─ P00.271-62: GOOD=0, NOT_GOOD=0, REPAIR=0, VALIDATION=0

IDB Gen2.0 (F Variant)
├─ P00.558-00: GOOD=900, NOT_GOOD=50, REPAIR=0, VALIDATION=0
└─ P00.558-01: GOOD=0, NOT_GOOD=0, REPAIR=0, VALIDATION=0
```

## 🛠️ Troubleshooting

**"Batch already exists for this date":**
- Batch numbers are unique per date
- Use different batch number or different date

**QR code scanner not working:**
- Ensure scanner sends Enter key after each code
- Check that input field has focus (click it)
- Test with manual typing

**Database connection error:**
- Verify MySQL is running
- Check credentials in .env file
- Ensure wip_scanner database exists

**API returns 400 "Part not found":**
- Add missing parts: Run `npm run seed` again
- Or manually: `INSERT INTO parts (part_number, model) VALUES (...)`

## 📁 File Structure

```
wip/
├── backend/
│   ├── index.js              # Express API
│   ├── db.js                 # Database functions
│   ├── init.sql              # Schema
│   ├── seed.js               # Sample data
│   ├── package.json
│   └── .env
├── frontend/
│   └── index.html            # Web interface
├── README.md
└── DATABASE_DESIGN.md        # Detailed schema
```

## 🎨 Features

- ✓ Main page with search/list registrations
- ✓ Create new registrations (batches)
- ✓ 4-section interface (GOOD | NOT GOOD | REPAIR | VALIDATION)
- ✓ Real-time QR scanning
- ✓ Drag & drop between sections
- ✓ Quick action buttons
- ✓ Auto-aggregate by model
- ✓ Completed registration archive
- ✓ Responsive UI
- ✓ Full audit trail

## 🔐 Security Notes

- Add authentication before production
- Use HTTPS in production
- Validate all QR inputs
- Keep audit logs for 2+ years
- Backup database daily

## 📝 Sample QR Codes for Testing

```
P00.271-55 2399 250814-001
P00.271-63 2244 250814-002
P00.271-67 892 250814-003
P00.558-00 900 250814-004
P00.558-01 10728 250814-005
```

---

**Ready to use!** Follow Setup Instructions above, then click "+ New Registration" on main page.