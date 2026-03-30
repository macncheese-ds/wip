-- QR Scanner Inventory Database Schema - REDESIGNED
-- Registrations with 4 sections: GOOD, NOT_GOOD, REPAIR, VALIDATION

-- Part master reference
CREATE TABLE IF NOT EXISTS parts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  part_number VARCHAR(50) UNIQUE NOT NULL,
  model VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Registrations (batches/work orders)
CREATE TABLE IF NOT EXISTS registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  batch_number VARCHAR(50) UNIQUE NOT NULL,
  registration_date DATE NOT NULL,
  status ENUM('in_progress', 'completed', 'archived') DEFAULT 'in_progress',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  INDEX idx_batch (batch_number),
  INDEX idx_date (registration_date),
  INDEX idx_status (status)
);

-- Items in each registration - once per part per registration (stored in ONE section only)
CREATE TABLE IF NOT EXISTS registration_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  registration_id INT NOT NULL,
  part_number VARCHAR(50) NOT NULL,
  quantity INT NOT NULL,
  section ENUM('good', 'not_good', 'repair', 'validation') DEFAULT 'good',
  batch_number_from_qr VARCHAR(50),
  scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  moved_at TIMESTAMP NULL,
  FOREIGN KEY (registration_id) REFERENCES registrations(id),
  FOREIGN KEY (part_number) REFERENCES parts(part_number),
  UNIQUE KEY unique_reg_part (registration_id, part_number),
  INDEX idx_section (section),
  INDEX idx_part (part_number)
);

-- Summary per registration (for quick views)
CREATE TABLE IF NOT EXISTS registration_summary (
  id INT AUTO_INCREMENT PRIMARY KEY,
  registration_id INT NOT NULL,
  model VARCHAR(100) NOT NULL,
  part_number VARCHAR(50) NOT NULL,
  good_qty INT DEFAULT 0,
  not_good_qty INT DEFAULT 0,
  repair_qty INT DEFAULT 0,
  validation_qty INT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (registration_id) REFERENCES registrations(id),
  FOREIGN KEY (part_number) REFERENCES parts(part_number),
  UNIQUE KEY unique_reg_model_part (registration_id, model, part_number),
  INDEX idx_model (model)
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  registration_id INT,
  item_id INT,
  action VARCHAR(50),
  old_section VARCHAR(50),
  new_section VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (registration_id) REFERENCES registrations(id),
  FOREIGN KEY (item_id) REFERENCES registration_items(id)
);
