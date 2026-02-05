const pool = require('../config.db/db');

(async () => {
    try {
        const promisePool = pool.promise();
        const [cols] = await promisePool.query('SHOW COLUMNS FROM producers');
        const latCol = cols.find(c => c.Field === 'latitude');
        const lngCol = cols.find(c => c.Field === 'longitude');

        const alterParts = [];
        if (latCol && latCol.Null === 'NO') alterParts.push('MODIFY COLUMN latitude DECIMAL(10,7) NULL');
        if (lngCol && lngCol.Null === 'NO') alterParts.push('MODIFY COLUMN longitude DECIMAL(10,7) NULL');

        if (alterParts.length === 0) {
            console.log('No changes needed; latitude/longitude already nullable.');
            process.exit(0);
        }

        const sql = `ALTER TABLE producers ${alterParts.join(', ')}`;
        console.log('Altering producers table:', sql);
        await promisePool.query(sql);
        console.log('Producers latitude/longitude made nullable.');
        process.exit(0);
    } catch (err) {
        console.error('Error making lat/lng nullable:', err);
        process.exit(1);
    }
})();
