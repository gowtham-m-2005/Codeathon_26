const pool = require('../config.db/db');

(async () => {
    try {
        const promisePool = pool.promise();

        const createSql = `
        CREATE TABLE IF NOT EXISTS containers (
          container_id INT AUTO_INCREMENT PRIMARY KEY,
          container_code VARCHAR(50) UNIQUE,
          total_sections INT DEFAULT 0,
          available_sections INT DEFAULT 0,
          cost_per_section DECIMAL(10,2) DEFAULT 0,
          current_latitude DECIMAL(10,7),
          current_longitude DECIMAL(10,7),
          status ENUM('IDLE','LOADING','EN_ROUTE','COMPLETED') DEFAULT 'IDLE',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`;

        console.log('Ensuring containers table exists...');
        await promisePool.query(createSql);

        // Ensure required columns exist and add if missing
        const [cols] = await promisePool.query('SHOW COLUMNS FROM containers');
        const colNames = cols.map(c => c.Field);

        const alterations = [];
        if (!colNames.includes('container_code')) alterations.push('ADD COLUMN container_code VARCHAR(50)');
        if (!colNames.includes('total_sections')) alterations.push('ADD COLUMN total_sections INT DEFAULT 0');
        if (!colNames.includes('available_sections')) alterations.push('ADD COLUMN available_sections INT DEFAULT 0');
        if (!colNames.includes('cost_per_section')) alterations.push('ADD COLUMN cost_per_section DECIMAL(10,2) DEFAULT 0');
        if (!colNames.includes('current_latitude')) alterations.push('ADD COLUMN current_latitude DECIMAL(10,7)');
        if (!colNames.includes('current_longitude')) alterations.push('ADD COLUMN current_longitude DECIMAL(10,7)');
        if (!colNames.includes('status')) alterations.push("ADD COLUMN status ENUM('IDLE','LOADING','EN_ROUTE','COMPLETED') DEFAULT 'IDLE'");
        if (!colNames.includes('created_at')) alterations.push('ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

        if (alterations.length > 0) {
            const alterSql = `ALTER TABLE containers ${alterations.join(', ')}`;
            console.log('Altering containers table:', alterSql);
            await promisePool.query(alterSql);
        }

        // If an old `driver_name` column exists and is NOT NULL without default,
        // modify it to allow NULL and set default empty string so legacy inserts don't fail.
        if (colNames.includes('driver_name')) {
            try {
                await promisePool.query("ALTER TABLE containers MODIFY driver_name VARCHAR(200) NULL DEFAULT ''");
                console.log('Modified driver_name to be nullable with default');
            } catch (e) {
                // ignore
            }
        }
        // If an old `driver_phone` column exists and is NOT NULL without default,
        // modify it to allow NULL and set default empty string so legacy inserts don't fail.
        if (colNames.includes('driver_phone')) {
            try {
                await promisePool.query("ALTER TABLE containers MODIFY driver_phone VARCHAR(15) NULL DEFAULT ''");
                console.log('Modified driver_phone to be nullable with default');
            } catch (e) {
                // ignore
            }
        }

        // Ensure unique index on container_code
        const [indexes] = await promisePool.query("SHOW INDEX FROM containers WHERE Column_name = 'container_code'");
        if (!indexes || indexes.length === 0) {
            try {
                await promisePool.query('ALTER TABLE containers ADD UNIQUE (container_code)');
                console.log('Added UNIQUE index on container_code');
            } catch (e) {
                // ignore duplicate key errors if any
            }
        }

        console.log('Containers table is ready.');
        process.exit(0);
    } catch (err) {
        console.error('Error ensuring containers table:', err);
        process.exit(1);
    }
})();
