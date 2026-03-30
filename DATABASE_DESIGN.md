# Database Design & Data Flow - Registration System

## QR Code Format
```
P00.558-00 900 250814-004
├─ Part Number: P00.558-00
├─ Quantity: 900 units
└─ Batch Info: 250814-004 (date + serial)
```

## Database Tables

### parts
Master reference for all part numbers
```
id | part_number | model | description | created_at
1  | P00.558-00  | IDB Gen2.0 (F Variant) | ... | 2026-03-28
```

### registrations (NEW)
Batch/work order level tracking
```
id | batch_number | registration_date | status | created_at | completed_at
1  | BATCH-2026-03-28-001 | 2026-03-28 | in_progress | ... | NULL
2  | BATCH-2026-03-28-002 | 2026-03-28 | completed | ... | 2026-03-28 15:30:00
```

### registration_items (REPLACED scans)
Items in each registration - **ONE entry per part per registration**
```
id | registration_id | part_number | quantity | section | scanned_at | moved_at
1  | 1 | P00.558-00 | 900 | good | 2026-03-28 14:30:00 | NULL
2  | 1 | P00.271-63 | 50 | not_good | 2026-03-28 14:35:00 | 2026-03-28 14:40:00
```

**Key Point**: Each part appears in ONLY ONE section per registration.

### registration_summary
Aggregated counts per model and part
```
registration_id | model | part_number | good_qty | not_good_qty | repair_qty | validation_qty
1 | IDB Gen2.0 | P00.558-00 | 900 | 50 | 0 | 0
1 | FCM-30 D | P00.271-63 | 0 | 50 | 0 | 0
```

### audit_log
Compliance tracking of all movements
```
registration_id | item_id | action | old_section | new_section | created_at
1 | 1 | item_added | NULL | good | 2026-03-28 14:30:00
1 | 1 | item_moved | good | not_good | 2026-03-28 14:37:00
```

## Data Flow Diagram

```
    ┌─────────────────┐
    │   QR Scanner    │
    └────────┬────────┘
             │
             v
    ┌─────────────────────────────┐
    │  Frontend Web App            │  (index.html)
    │  - Main Page (search/create) │
    │  - Detail Page (4 sections)  │
    └────────┬────────────────────┘
             │
             │ JSON API
             v
    ┌─────────────────────────────┐
    │  Backend API (Node.js)      │
    │  - POST   /registrations    │
    │  - GET    /registrations    │
    │  - POST   /items (scan)     │
    │  - PATCH  /items (move)     │
    │  - DELETE /items (remove)   │
    │  - POST   /save (complete)  │
    └────────┬────────────────────┘
             │
             v
    ┌─────────────────────────────┐
    │   MySQL Database            │
    │  ┌─────────────────────┐    │
    │  │ parts               │    │
    │  ├─────────────────────┤    │
    │  │ registrations       │    │ Registration
    │  ├─────────────────────┤    │ System
    │  │ registration_items  │    │
    │  ├─────────────────────┤    │
    │  │ registration_summary│    │
    │  ├─────────────────────┤    │
    │  │ audit_log           │    │
    │  └─────────────────────┘    │
    └─────────────────────────────┘
```

## Workflow Steps

### 1. Create Registration
```
Step 1: Click "+ New Registration"
Step 2: Enter Batch Number: BATCH-2026-03-28-001
Step 3: Select Date: 2026-03-28
Step 4: POST /api/registrations
Step 5: INSERT registrations { status: 'in_progress' }
Result: New registration created, redirected to detail page
```

### 2. Scan Items (Start in GOOD)
```
Step 1: Scan QR → P00.558-00 900 250814-004
Step 2: Press Enter
Step 3: POST /api/registrations/:id/items
Step 4: INSERT registration_items { section: 'good' }
Step 5: UPDATE registration_summary { good_qty += 900 }
Step 6: INSERT audit_log { action: 'item_added' }
Result: Item appears in GOOD section (900 units)
```

### 3. Move Item to Different Section
```
Step 1: Click item or drag to REPAIR section
Step 2: PATCH /api/registrations/:id/items/:item_id
       { new_section: 'repair' }
Step 3: UPDATE registration_items { section: 'repair' }
Step 4: UPDATE registration_summary:
          - good_qty -= 900
          - repair_qty += 900
Step 5: INSERT audit_log { old_section: 'good', new_section: 'repair' }
Result: Item moved to REPAIR (yellow section)
```

### 4. Remove Item
```
Step 1: Click × button on item
Step 2: DELETE /api/registrations/:id/items/:item_id
Step 3: DELETE registration_items
Step 4: UPDATE registration_summary (reduce counts)
Step 5: INSERT audit_log { action: 'item_removed' }
Result: Item removed from registration
```

### 5. Save Registration (Complete)
```
Step 1: Click "✓ Save & Complete"
Step 2: POST /api/registrations/:id/save
Step 3: UPDATE registrations { status: 'completed', completed_at: NOW() }
Step 4: Final state snapshot created
Result: Registration locked, goes to archive
```

### 6. View Completed Registration (Archive)
```
Step 1: From main page, click completed registration card
Step 2: GET /api/registrations/:id/summary
Step 3: Query registration_summary grouped by model
Step 4: Return read-only view with 4 sections side-by-side
Result: View shows final distribution across all 4 sections
```

## Key Design Changes from Old System

| Old (Scan-based) | New (Registration-based) |
|---|---|
| POST /api/scan | POST /registrations, POST /items |
| Multiple scans per part | One item per part per registration |
| Immediate good/not_good choice | Start in GOOD, move as needed |
| Quick recording | Work in progress, then save |
| Global inventory table | Per-registration tracking |
| "scans" table | "registration_items" table |

## Unique Constraints

```sql
-- Each part appears only once per registration
UNIQUE KEY unique_reg_part (registration_id, part_number)

-- Batch numbers are unique
UNIQUE KEY (batch_number)

-- Each model/part combo per registration
UNIQUE KEY unique_reg_model_part (registration_id, model, part_number)
```

## Performance Queries

### Get Registration Summary by Model
```sql
SELECT 
  model,
  part_number,
  good_qty,
  not_good_qty,
  repair_qty,
  validation_qty
FROM registration_summary
WHERE registration_id = ?
ORDER BY model, part_number;
```

### Get All Items in Specific Section
```sql
SELECT i.*, p.model
FROM registration_items i
JOIN parts p ON i.part_number = p.part_number
WHERE i.registration_id = ? AND i.section = 'good'
ORDER BY i.scanned_at;
```

### Get Count of Items Moved Today
```sql
SELECT COUNT(*) as moved_count
FROM audit_log
WHERE DATE(created_at) = CURDATE()
  AND action = 'item_moved';
```

### Get Completed Registrations Summary
```sql
SELECT 
  r.id,
  r.batch_number,
  r.registration_date,
  COUNT(DISTINCT i.part_number) as total_parts,
  SUM(i.quantity) as total_quantity,
  SUM(CASE WHEN i.section = 'good' THEN i.quantity ELSE 0 END) as good_total,
  SUM(CASE WHEN i.section = 'not_good' THEN i.quantity ELSE 0 END) as bad_total
FROM registrations r
LEFT JOIN registration_items i ON r.id = i.registration_id
WHERE r.status = 'completed'
GROUP BY r.id
ORDER BY r.completed_at DESC;
```

## Advantages of Registration Model

✓ **Clear Work Sessions**: Each batch is a distinct work session  
✓ **Flexible Sorting**: Move items between sections before committing  
✓ **Non-Destructive**: Can review and modify before saving  
✓ **Aggregated View**: Summary auto-updates as you move items  
✓ **Audit Trail**: Every action logged with timestamp  
✓ **Batch Reporting**: Easy to report on completed batches  
✓ **Model Grouping**: Auto-organized data by model on save
