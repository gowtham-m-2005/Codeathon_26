const pool = require('../config.db/db');

(async () => {
    try {
        const promisePool = pool.promise();
        const [cols] = await promisePool.query('SHOW COLUMNS FROM containers');
        const existing = cols.map(c => c.Field);

        const alterParts = [];
        if (!existing.includes('driver_name')) alterParts.push('ADD COLUMN driver_name VARCHAR(255)');
        if (!existing.includes('driver_phone')) alterParts.push('ADD COLUMN driver_phone VARCHAR(100)');
        if (!existing.includes('section_storage_space')) alterParts.push('ADD COLUMN section_storage_space INT');

        if (alterParts.length === 0) {
            console.log('No changes needed; containers table has all required columns.');
            process.exit(0);
        }

        const sql = `ALTER TABLE containers ${alterParts.join(', ')}`;
        console.log('Altering containers table:', sql);
        await promisePool.query(sql);
        console.log('Containers table updated.');
        process.exit(0);
    } catch (err) {
        console.error('Error altering containers table:', err);
        process.exit(1);
    }
})();
