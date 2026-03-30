import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'wip_scanner',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Parse QR code format: "P00.558-00 900 250814-004"
export function parseQRCode(qrString) {
  const parts = qrString.trim().split(/\s+/);
  if (parts.length < 2) {
    throw new Error('Invalid QR code format');
  }
  
  return {
    part_number: parts[0],
    quantity: parseInt(parts[1]) || 0,
    batch_info: parts.slice(2).join('-') // "250814-004"
  };
}

// Create new registration (batch)
export async function createRegistration(batch_number, registration_date) {
  try {
    const [result] = await pool.query(
      `INSERT INTO registrations (batch_number, registration_date, status)
       VALUES (?, ?, 'in_progress')`,
      [batch_number, registration_date]
    );
    return {
      registration_id: result.insertId,
      batch_number,
      registration_date,
      status: 'in_progress'
    };
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error(`Registration ${batch_number} already exists for this date`);
    }
    throw error;
  }
}

// Get registrations with search
export async function getRegistrations(search = '', limit = 50) {
  let query = `
    SELECT 
      r.id,
      r.batch_number,
      r.registration_date,
      r.status,
      r.created_at,
      COUNT(DISTINCT i.part_number) as item_count,
      SUM(CASE WHEN i.section = 'good' THEN i.quantity ELSE 0 END) as good_qty,
      SUM(CASE WHEN i.section = 'not_good' THEN i.quantity ELSE 0 END) as not_good_qty,
      SUM(CASE WHEN i.section = 'repair' THEN i.quantity ELSE 0 END) as repair_qty,
      SUM(CASE WHEN i.section = 'validation' THEN i.quantity ELSE 0 END) as validation_qty
    FROM registrations r
    LEFT JOIN registration_items i ON r.id = i.registration_id
    WHERE r.batch_number LIKE ? OR DATE_FORMAT(r.registration_date, '%Y-%m-%d') LIKE ?
    GROUP BY r.id
    ORDER BY r.registration_date DESC
    LIMIT ?
  `;
  
  const searchTerm = `%${search}%`;
  const [rows] = await pool.query(query, [searchTerm, searchTerm, limit]);
  return rows;
}

// Get single registration with items by section
export async function getRegistrationDetail(registration_id) {
  const conn = await pool.getConnection();
  
  try {
    // Get registration info
    const [registrations] = await conn.query(
      `SELECT * FROM registrations WHERE id = ?`,
      [registration_id]
    );
    
    if (registrations.length === 0) {
      throw new Error('Registration not found');
    }
    
    const registration = registrations[0];
    
    // Get items organized by section
    const [items] = await conn.query(
      `SELECT 
        i.id,
        i.part_number,
        i.quantity,
        i.section,
        p.model,
        i.scanned_at,
        i.moved_at
       FROM registration_items i
       JOIN parts p ON i.part_number = p.part_number
       WHERE i.registration_id = ?
       ORDER BY i.section, i.scanned_at DESC`,
      [registration_id]
    );
    
    // Organize by section
    const bySection = {
      good: [],
      not_good: [],
      repair: [],
      validation: []
    };
    
    items.forEach(item => {
      bySection[item.section].push(item);
    });
    
    return {
      registration,
      items: bySection,
      totals: {
        good: bySection.good.reduce((sum, i) => sum + i.quantity, 0),
        not_good: bySection.not_good.reduce((sum, i) => sum + i.quantity, 0),
        repair: bySection.repair.reduce((sum, i) => sum + i.quantity, 0),
        validation: bySection.validation.reduce((sum, i) => sum + i.quantity, 0)
      }
    };
  } finally {
    conn.release();
  }
}

// Add scanned item to registration (goes to GOOD section by default)
export async function addItemToRegistration(registration_id, qr_code) {
  const conn = await pool.getConnection();
  
  try {
    await conn.beginTransaction();
    
    const { part_number, quantity, batch_info } = parseQRCode(qr_code);
    const [batch_date, batch_number] = batch_info.split('-');
    
    // Get part model
    const [parts] = await conn.query(
      'SELECT model FROM parts WHERE part_number = ?',
      [part_number]
    );
    
    if (parts.length === 0) {
      throw new Error(`Part ${part_number} not found`);
    }
    
    const model = parts[0].model;
    
    // Check if item already exists in this registration
    const [existing] = await conn.query(
      'SELECT id, section FROM registration_items WHERE registration_id = ? AND part_number = ?',
      [registration_id, part_number]
    );
    
    if (existing.length > 0) {
      throw new Error(`Part ${part_number} already added to this registration`);
    }
    
    // Insert item (defaults to GOOD section)
    const [result] = await conn.query(
      `INSERT INTO registration_items 
       (registration_id, part_number, quantity, section, batch_number_from_qr)
       VALUES (?, ?, ?, 'good', ?)`,
      [registration_id, part_number, quantity, batch_number]
    );
    
    const item_id = result.insertId;
    
    // Update summary
    await conn.query(
      `INSERT INTO registration_summary 
       (registration_id, model, part_number, good_qty)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE good_qty = good_qty + ?`,
      [registration_id, model, part_number, quantity, quantity]
    );
    
    // Audit log
    await conn.query(
      'INSERT INTO audit_log (registration_id, item_id, action, new_section) VALUES (?, ?, ?, ?)',
      [registration_id, item_id, 'item_added', 'good']
    );
    
    await conn.commit();
    
    return {
      item_id,
      part_number,
      model,
      quantity,
      section: 'good',
      batch_number
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

// Move item to different section
export async function moveItemToSection(item_id, new_section) {
  const conn = await pool.getConnection();
  
  try {
    await conn.beginTransaction();
    
    // Get current item
    const [items] = await conn.query(
      `SELECT i.*, p.model FROM registration_items i
       JOIN parts p ON i.part_number = p.part_number
       WHERE i.id = ?`,
      [item_id]
    );
    
    if (items.length === 0) {
      throw new Error('Item not found');
    }
    
    const item = items[0];
    const old_section = item.section;
    
    if (old_section === new_section) {
      return { message: 'Already in this section' };
    }
    
    // Update item section
    await conn.query(
      'UPDATE registration_items SET section = ?, moved_at = NOW() WHERE id = ?',
      [new_section, item_id]
    );
    
    // Update summary
    const updateOld = `${old_section}_qty`;
    const updateNew = `${new_section}_qty`;
    
    await conn.query(
      `UPDATE registration_summary 
       SET ${updateOld} = ${updateOld} - ?,
           ${updateNew} = ${updateNew} + ?
       WHERE registration_id = ? AND part_number = ?`,
      [item.quantity, item.quantity, item.registration_id, item.part_number]
    );
    
    // Audit log
    await conn.query(
      'INSERT INTO audit_log (registration_id, item_id, action, old_section, new_section) VALUES (?, ?, ?, ?, ?)',
      [item.registration_id, item_id, 'item_moved', old_section, new_section]
    );
    
    await conn.commit();
    
    return {
      item_id,
      part_number: item.part_number,
      old_section,
      new_section,
      quantity: item.quantity
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

// Remove item from registration
export async function removeItemFromRegistration(item_id) {
  const conn = await pool.getConnection();
  
  try {
    await conn.beginTransaction();
    
    const [items] = await conn.query(
      'SELECT * FROM registration_items WHERE id = ?',
      [item_id]
    );
    
    if (items.length === 0) {
      throw new Error('Item not found');
    }
    
    const item = items[0];
    const sectionField = `${item.section}_qty`;
    
    // Delete item
    await conn.query('DELETE FROM registration_items WHERE id = ?', [item_id]);
    
    // Update summary
    await conn.query(
      `UPDATE registration_summary 
       SET ${sectionField} = ${sectionField} - ?
       WHERE registration_id = ? AND part_number = ?`,
      [item.quantity, item.registration_id, item.part_number]
    );
    
    // Audit log
    await conn.query(
      'INSERT INTO audit_log (registration_id, item_id, action, old_section) VALUES (?, ?, ?, ?)',
      [item.registration_id, item_id, 'item_removed', item.section]
    );
    
    await conn.commit();
    
    return { message: 'Item removed' };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

// Save/complete registration
export async function completeRegistration(registration_id) {
  const [result] = await pool.query(
    `UPDATE registrations 
     SET status = 'completed', completed_at = NOW()
     WHERE id = ?`,
    [registration_id]
  );
  
  if (result.affectedRows === 0) {
    throw new Error('Registration not found');
  }
  
  return { message: 'Registration completed' };
}

// Get registration summary (view completed registration, grouped by model)
export async function getRegistrationSummary(registration_id) {
  const [rows] = await pool.query(
    `SELECT 
      model,
      part_number,
      good_qty,
      not_good_qty,
      repair_qty,
      validation_qty,
      (good_qty + not_good_qty + repair_qty + validation_qty) as total
     FROM registration_summary
     WHERE registration_id = ?
     ORDER BY model, part_number`,
    [registration_id]
  );
  
  // Group by model
  const byModel = {};
  rows.forEach(row => {
    if (!byModel[row.model]) {
      byModel[row.model] = [];
    }
    byModel[row.model].push(row);
  });
  
  return byModel;
}

export default pool;
