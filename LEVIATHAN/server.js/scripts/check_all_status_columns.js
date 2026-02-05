const pool = require('../config.db/db');

async function checkSchema() {
  try {
    console.log('=== CONTAINERS TABLE ===');
    const [containers] = await pool.promise().query('SHOW COLUMNS FROM containers WHERE Field = "status"');
    console.log(JSON.stringify(containers, null, 2));
    
    console.log('\n=== PACKAGES TABLE ===');
    const [packages] = await pool.promise().query('SHOW COLUMNS FROM packages WHERE Field = "status"');
    console.log(JSON.stringify(packages, null, 2));
    
    console.log('\n=== ROUTES TABLE ===');
    const [routes] = await pool.promise().query('SHOW COLUMNS FROM routes WHERE Field = "route_status"');
    console.log(JSON.stringify(routes, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkSchema();
