const db = require('../config.db/db');

(async () => {
    try {
        const promisePool = db.promise();
        
        // Calculate date 4 days from now
        const fourDaysFromNow = new Date();
        fourDaysFromNow.setDate(fourDaysFromNow.getDate() + 4);
        
        console.log('\n🕐 Updating max_delivery_time for all packages...\n');
        console.log(`Current time: ${new Date().toLocaleString()}`);
        console.log(`New max_delivery_time: ${fourDaysFromNow.toLocaleString()}\n`);
        
        // Update all packages
        const [result] = await promisePool.query(
            `UPDATE packages SET max_delivery_time = ?`,
            [fourDaysFromNow]
        );
        
        console.log(`✅ Updated ${result.affectedRows} packages\n`);
        
        // Verify update
        const [sample] = await promisePool.query(
            `SELECT package_code, max_delivery_time FROM packages LIMIT 5`
        );
        
        console.log('Sample packages after update:');
        sample.forEach(p => {
            console.log(`  ${p.package_code}: ${new Date(p.max_delivery_time).toLocaleString()}`);
        });
        
        console.log('\n');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
})();
