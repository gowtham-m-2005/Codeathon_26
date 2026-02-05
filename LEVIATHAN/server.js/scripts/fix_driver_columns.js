const pool = require('../config.db/db');
(async () => {
  try {
    const p = pool.promise();
    console.log('Altering driver_name and driver_phone to be nullable with default empty string...');
    await p.query("ALTER TABLE containers MODIFY driver_name VARCHAR(200) NULL DEFAULT ''");
    await p.query("ALTER TABLE containers MODIFY driver_phone VARCHAR(15) NULL DEFAULT ''");
    const [cols] = await p.query('SHOW COLUMNS FROM containers');
    console.table(cols);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
