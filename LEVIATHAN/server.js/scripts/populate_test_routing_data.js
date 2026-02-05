// Populate sample destinations and packages for testing routing system
const pool = require('../config.db/db');

async function populateTestData() {
  const conn = await pool.promise().getConnection();
  
  try {
    console.log('Populating test data...');

    // 1. Create destinations table if it doesn't exist
    await conn.query(`
      CREATE TABLE IF NOT EXISTS destinations (
        destination_id INT PRIMARY KEY AUTO_INCREMENT,
        destination_name VARCHAR(255) NOT NULL,
        latitude DECIMAL(10, 7) NOT NULL,
        longitude DECIMAL(10, 7) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✓ destinations table created');
    
    // 1b. Add destination_id and required_sections to packages if needed
    try {
      await conn.query(`ALTER TABLE packages ADD COLUMN destination_id INT NULL`);
      console.log('✓ packages.destination_id column added');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ packages.destination_id column already exists');
      } else throw err;
    }
    
    try {
      await conn.query(`ALTER TABLE packages ADD COLUMN required_sections INT DEFAULT 1`);
      console.log('✓ packages.required_sections column added');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ packages.required_sections column already exists');
      } else throw err;
    }

    // 2. Insert sample destinations
    const destinations = [
      ['Chennai Central', 13.0827, 80.2707],
      ['Bangalore Hub', 12.9716, 77.5946],
      ['Mumbai Warehouse', 19.0760, 72.8777],
      ['Delhi Distribution Center', 28.7041, 77.1025],
      ['Hyderabad Depot', 17.3850, 78.4867]
    ];

    for (let dest of destinations) {
      const [existing] = await conn.query(
        'SELECT destination_id FROM destinations WHERE destination_name = ?',
        [dest[0]]
      );
      
      if (existing.length === 0) {
        await conn.query(
          'INSERT INTO destinations (destination_name, latitude, longitude) VALUES (?, ?, ?)',
          dest
        );
        console.log(`✓ Added destination: ${dest[0]}`);
      }
    }

    // 3. Verify we have producers
    const [producers] = await conn.query('SELECT producer_id FROM producers LIMIT 5');
    const [dests] = await conn.query('SELECT destination_id FROM destinations LIMIT 5');

    if (producers.length === 0) {
      console.log('⚠ No producers found. Please add producers first.');
    } else if (dests.length === 0) {
      console.log('⚠ No destinations found.');
    } else {
      // 4. Create sample packages (only if none exist)
      const [packageCount] = await conn.query('SELECT COUNT(*) as count FROM packages');
      
      if (packageCount[0].count === 0) {
        console.log('Creating sample packages...');
        
        for (let i = 0; i < 10; i++) {
          const producerId = producers[i % producers.length].producer_id;
          const destId = dests[i % dests.length].destination_id;
          
          // Get destination coordinates
          const [destData] = await conn.query(
            'SELECT latitude, longitude FROM destinations WHERE destination_id = ?',
            [destId]
          );
          
          await conn.query(
            `INSERT INTO packages 
             (package_code, producer_id, destination_id, destination_latitude, destination_longitude, size, required_sections, max_delivery_time, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 2 DAY), 'AVAILABLE')`,
            [`PKG-${Date.now()}-${i}`, producerId, destId, destData[0].latitude, destData[0].longitude, 10, Math.floor(Math.random() * 2) + 1]
          );
        }
        console.log('✓ Created 10 sample packages');
      } else {
        console.log(`✓ Packages table already has ${packageCount[0].count} records`);
      }
    }

    console.log('\n✅ Test data population complete!');
  } catch (err) {
    console.error('❌ Error populating test data:', err.message);
    throw err;
  } finally {
    conn.release();
  }
}

populateTestData()
  .then(() => {
    console.log('\nTest data initialization complete.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Test data population failed:', err);
    process.exit(1);
  });
