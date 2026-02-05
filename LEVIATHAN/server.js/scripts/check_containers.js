const pool = require('../config.db/db');
(async () => {
  try {
    const promisePool = pool.promise();
    const [cols] = await promisePool.query('SHOW COLUMNS FROM containers');
    console.log('Columns:');
    console.table(cols);
    const [rows] = await promisePool.query('SELECT * FROM containers LIMIT 10');
    console.log('Sample rows:');
    console.table(rows);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
