const pool = require('../config.db/db');

async function fixContainersStatus() {
  const conn = await pool.promise().getConnection();
  
  try {
    console.log('Fixing containers status enum...');

    // Add ACTIVE to existing enum values
    await conn.query(`
      ALTER TABLE containers 
      MODIFY COLUMN status ENUM('idle','in_transit','loading','unloading','maintenance','ACTIVE') DEFAULT 'idle'
    `);
    
    console.log('✓ containers status enum updated to support ACTIVE (keeping legacy values)');
    
  } catch (err) {
    console.error('❌ Error updating containers status:', err.message);
    throw err;
  } finally {
    conn.release();
  }
}

fixContainersStatus()
  .then(() => {
    console.log('\nContainers status fix complete.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Operation failed:', err);
    process.exit(1);
  });
