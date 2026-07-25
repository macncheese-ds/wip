import pool from './db.js';

const SAMPLE_PARTS = [
  { part_number: 'P00.271-55', model: 'FCM-30 A TOP', description: 'Module FCM-30 Variant A TOP' },
  { part_number: 'P00.271-62', model: 'FCM-30 C TOP', description: 'Module FCM-30 Variant C TOP' },
  { part_number: 'P00.271-63', model: 'FCM-30 D TOP', description: 'Module FCM-30 Variant D TOP' },
  { part_number: 'P00.271-67', model: 'FCM-30 F TOP', description: 'Module FCM-30 Variant F TOP' },
  { part_number: 'P00.271-70', model: 'FCM-30 H TOP', description: 'Module FCM-30 Variant H TOP' },
  { part_number: 'P00.457-00', model: 'IDB Main B Variant TOP', description: 'IDB Main B Variant TOP' },
  { part_number: 'P00.558-00', model: 'IDB Gen2.0 (F Variant)', description: 'IDB Gen2.0 Variant F' },
  { part_number: 'P00.533-00', model: 'IAMM', description: 'Intelligent Automation Module' },
  { part_number: 'P00.479-00', model: 'MRR35 TOP', description: 'Mobile Reading Unit 35' }
];

async function seedDatabase() {
  const conn = await pool.getConnection();
  
  try {
    console.log('Seeding database with sample parts...');
    
    for (const part of SAMPLE_PARTS) {
      try {
        await conn.query(
          'INSERT INTO parts (part_number, model, description) VALUES (?, ?, ?)',
          [part.part_number, part.model, part.description]
        );
        console.log(`Added ${part.part_number}`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`- ${part.part_number} already exists`);
        } else {
          throw error;
        }
      }
    }
    
    console.log('Database seeding complete!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    conn.release();
    process.exit(0);
  }
}

seedDatabase();
