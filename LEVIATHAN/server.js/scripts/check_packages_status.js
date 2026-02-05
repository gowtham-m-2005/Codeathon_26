const pool = require('../config.db/db');

pool.promise().query('SHOW COLUMNS FROM packages WHERE Field = "status"')
  .then(([rows]) => {
    console.log('Current packages.status enum:');
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error(err.message);
    process.exit(1);
  });
