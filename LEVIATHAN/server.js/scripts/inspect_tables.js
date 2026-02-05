const pool = require('../config.db/db');

(async () => {
    try {
        const promisePool = pool.promise();

        console.log('Showing columns for inventory:');
        const [invCols] = await promisePool.query('SHOW COLUMNS FROM inventory');
        console.table(invCols);

        console.log('\nShowing columns for producers:');
        const [prodCols] = await promisePool.query('SHOW COLUMNS FROM producers');
        console.table(prodCols);

        console.log('\nSample producers rows:');
        const [prods] = await promisePool.query('SELECT * FROM producers LIMIT 5');
        console.table(prods);

        console.log('\nSample inventory rows:');
        const [invs] = await promisePool.query('SELECT * FROM inventory LIMIT 5');
        console.table(invs);

        process.exit(0);
    } catch (err) {
        console.error('Inspect error:', err);
        process.exit(1);
    }
})();
