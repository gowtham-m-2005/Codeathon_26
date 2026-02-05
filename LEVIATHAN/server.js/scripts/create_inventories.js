const pool = require('../config.db/db');

(async () => {
    try {
        const promisePool = pool.promise();

        const [producers] = await promisePool.query('SELECT * FROM producers');
        if (!producers || producers.length === 0) {
            console.log('No producers found.');
            process.exit(0);
        }

        let created = 0;
        let skipped = 0;

        // Ensure inventory table has columns for latitude/longitude; if not, add them
        const [invCols] = await promisePool.query("SHOW COLUMNS FROM inventory");
        const colNames = invCols.map(c => c.Field);
        const needsLat = !colNames.includes('inventory_latitude');
        const needsLng = !colNames.includes('inventory_longitude');
        const needsDestLat = !colNames.includes('destination_latitude');
        const needsDestLng = !colNames.includes('destination_longitude');
        if (needsLat || needsLng || needsDestLat || needsDestLng) {
            const alterParts = [];
            if (needsLat) alterParts.push('ADD COLUMN inventory_latitude DECIMAL(10,7)');
            if (needsLng) alterParts.push('ADD COLUMN inventory_longitude DECIMAL(10,7)');
            if (needsDestLat) alterParts.push('ADD COLUMN destination_latitude DECIMAL(10,7)');
            if (needsDestLng) alterParts.push('ADD COLUMN destination_longitude DECIMAL(10,7)');
            const alterSql = `ALTER TABLE inventory ${alterParts.join(', ')}`;
            console.log('Altering inventory table:', alterSql);
            await promisePool.query(alterSql);
        }

        for (const p of producers) {
            const producerId = p.producer_id ?? p.id;
            if (!producerId) {
                console.warn('Skipping producer without id:', p);
                skipped++;
                continue;
            }

            const [countRows] = await promisePool.query('SELECT COUNT(*) AS cnt FROM inventory WHERE producer_id = ?', [producerId]);
            const cnt = countRows && countRows[0] ? countRows[0].cnt : 0;
            if (cnt > 0) {
                skipped++;
                continue;
            }

            // Prefer inventory_latitude/longitude on producer, fallback to latitude/longitude fields if present
            const lat = p.inventory_latitude ?? p.latitude ?? null;
            const lng = p.inventory_longitude ?? p.longitude ?? null;

            // Generate a random destination in Tamil Nadu if not provided
            const randLat = (Math.random() * (13.5 - 8.0) + 8.0).toFixed(7);
            const randLng = (Math.random() * (80.5 - 76.0) + 76.0).toFixed(7);

            // Insert a default inventory row with required fields and destination
            await promisePool.query(
                'INSERT INTO inventory (producer_id, item_name, available_quantity, inventory_latitude, inventory_longitude, destination_latitude, destination_longitude) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [producerId, 'Initial inventory', 0, lat, lng, randLat, randLng]
            );

            created++;
            console.log(`Created inventory for producer ${producerId}`);
        }

        console.log(`Finished. Created: ${created}, Skipped: ${skipped}`);
        process.exit(0);
    } catch (err) {
        console.error('Error creating inventories:', err);
        process.exit(1);
    }
})();
