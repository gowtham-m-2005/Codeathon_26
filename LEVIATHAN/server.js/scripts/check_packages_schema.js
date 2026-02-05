const db = require('../config.db/db');

(async () => {
    try {
        const promisePool = db.promise();
        
        // Get packages table structure
        const [columns] = await promisePool.query('DESCRIBE packages');
        
        console.log('\n📋 PACKAGES TABLE STRUCTURE:\n');
        console.log('Field                | Type                    | Null | Key | Default');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        columns.forEach(col => {
            console.log(
                `${col.Field.padEnd(20)} | ${col.Type.padEnd(23)} | ${col.Null.padEnd(4)} | ${col.Key.padEnd(3)} | ${col.Default || 'NULL'}`
            );
        });
        
        console.log('\n');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
})();
