// Add max_delivery_time column to inventory table
const pool = require('../config.db/db');

async function addMaxDeliveryTime() {
  const conn = await pool.promise().getConnection();
  
  try {
    console.log('Adding max_delivery_time column to inventory table...');

    await conn.query(`
      ALTER TABLE inventory 
      ADD COLUMN max_delivery_time DATETIME NULL
    `);
    
    console.log('✓ max_delivery_time column added successfully');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('✓ max_delivery_time column already exists');
    } else {
      console.error('❌ Error adding column:', err.message);
      throw err;
    }
  } finally {
    conn.release();
  }
}

addMaxDeliveryTime()
  .then(() => {
    console.log('\nColumn addition complete.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Operation failed:', err);
    process.exit(1);
  });
