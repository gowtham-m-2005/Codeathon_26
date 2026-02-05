const pool = require('../config.db/db');

(async () => {
    try {
        const promisePool = pool.promise();
        const [cols] = await promisePool.query('SHOW COLUMNS FROM containers');
        console.table(cols);
        process.exit(0);
    } catch (err) {
        console.error('Error checking containers schema:', err);
        process.exit(1);
    }
})();
