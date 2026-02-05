const pool = require('../config.db/db');

(async () => {
    try {
        const promisePool = pool.promise();

        const [rows] = await promisePool.query('SELECT inventory_id FROM inventory WHERE destination_latitude IS NULL OR destination_longitude IS NULL');
        if (!rows || rows.length === 0) {
            console.log('No inventory rows need destinations.');
            process.exit(0);
        }

        let updated = 0;
        for (const r of rows) {
            const invId = r.inventory_id;
            const randLat = (Math.random() * (13.5 - 8.0) + 8.0).toFixed(7);
            const randLng = (Math.random() * (80.5 - 76.0) + 76.0).toFixed(7);
            await promisePool.query('UPDATE inventory SET destination_latitude = ?, destination_longitude = ? WHERE inventory_id = ?', [randLat, randLng, invId]);
            updated++;
            console.log(`Set destination for inventory ${invId} -> ${randLat}, ${randLng}`);
        }

        console.log(`Done. Updated ${updated} rows.`);
        process.exit(0);
    } catch (err) {
        console.error('Error populating destinations:', err);
        process.exit(1);
    }
})();
