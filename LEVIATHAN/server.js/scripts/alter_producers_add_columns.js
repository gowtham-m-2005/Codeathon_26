const pool = require('../config.db/db');

(async () => {
    try {
        const promisePool = pool.promise();

        const [cols] = await promisePool.query('SHOW COLUMNS FROM producers');
        const existing = cols.map(c => c.Field);

        const alterParts = [];
        if (!existing.includes('email')) alterParts.push('ADD COLUMN email VARCHAR(255)');
        if (!existing.includes('phone')) alterParts.push('ADD COLUMN phone VARCHAR(100)');
        if (!existing.includes('inventory_latitude')) alterParts.push('ADD COLUMN inventory_latitude DECIMAL(10,7)');
        if (!existing.includes('inventory_longitude')) alterParts.push('ADD COLUMN inventory_longitude DECIMAL(10,7)');

        if (alterParts.length === 0) {
            console.log('No changes needed; producers table already has the required columns.');
            process.exit(0);
        }

        const alterSql = `ALTER TABLE producers ${alterParts.join(', ')}`;
        console.log('Altering producers table:', alterSql);
        await promisePool.query(alterSql);
        console.log('Producers table updated.');
        process.exit(0);
    } catch (err) {
        console.error('Error altering producers table:', err);
        process.exit(1);
    }
})();
