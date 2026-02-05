const pool = require('../config.db/db');

(async () => {
    try {
        const promisePool = pool.promise();

        const sql = 'INSERT INTO producers (producer_name, email, phone, inventory_latitude, inventory_longitude) VALUES (?, ?, ?, ?, ?)';
        const vals = ['TestProducer', 'test@example.com', '9999999999', '11.0000000', '77.0000000'];

        const [res] = await promisePool.query(sql, vals);
        console.log('Insert OK, insertId =', res.insertId);
        process.exit(0);
    } catch (err) {
        console.error('Insert test error:', err);
        process.exit(1);
    }
})();
