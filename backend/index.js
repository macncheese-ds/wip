import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {
  createRegistration,
  getRegistrations,
  getRegistrationDetail,
  addItemToRegistration,
  moveItemToSection,
  removeItemFromRegistration,
  completeRegistration,
  getRegistrationSummary
} from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Create new registration (batch)
app.post('/api/registrations', async (req, res) => {
  try {
    const { batch_number, registration_date } = req.body;
    
    if (!batch_number || !registration_date) {
      return res.status(400).json({ error: 'batch_number and registration_date required' });
    }
    
    const result = await createRegistration(batch_number, registration_date);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get registrations (search/list)
app.get('/api/registrations', async (req, res) => {
  try {
    const search = req.query.search || '';
    const limit = req.query.limit || 50;
    const registrations = await getRegistrations(search, parseInt(limit));
    
    res.json({
      registrations,
      count: registrations.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get registration detail (with items by section)
app.get('/api/registrations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const detail = await getRegistrationDetail(parseInt(id));
    res.json(detail);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add scanned item to registration (goes to GOOD by default)
app.post('/api/registrations/:id/items', async (req, res) => {
  try {
    const { id } = req.params;
    const { qr_code } = req.body;
    
    if (!qr_code) {
      return res.status(400).json({ error: 'qr_code required' });
    }
    
    const result = await addItemToRegistration(parseInt(id), qr_code);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Move item to different section
app.patch('/api/registrations/:reg_id/items/:item_id', async (req, res) => {
  try {
    const { item_id } = req.params;
    const { new_section } = req.body;
    
    if (!new_section || !['good', 'not_good', 'repair', 'validation'].includes(new_section)) {
      return res.status(400).json({ error: 'Invalid section' });
    }
    
    const result = await moveItemToSection(parseInt(item_id), new_section);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Remove item from registration
app.delete('/api/registrations/:reg_id/items/:item_id', async (req, res) => {
  try {
    const { item_id } = req.params;
    const result = await removeItemFromRegistration(parseInt(item_id));
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Save/complete registration
app.post('/api/registrations/:id/save', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await completeRegistration(parseInt(id));
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get registration summary (view by model, grouped)
app.get('/api/registrations/:id/summary', async (req, res) => {
  try {
    const { id } = req.params;
    const summary = await getRegistrationSummary(parseInt(id));
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`QR Scanner API running on http://localhost:${PORT}`);
  console.log(`- POST   /api/registrations              (create new batch)`);
  console.log(`- GET    /api/registrations              (list/search)`);
  console.log(`- GET    /api/registrations/:id          (get detail)`);
  console.log(`- POST   /api/registrations/:id/items    (scan & add)`);
  console.log(`- PATCH  /api/registrations/:id/items/:id (move section)`);
  console.log(`- DELETE /api/registrations/:id/items/:id (remove)`);
  console.log(`- POST   /api/registrations/:id/save     (complete)`);
  console.log(`- GET    /api/registrations/:id/summary  (view archive)`);
});
