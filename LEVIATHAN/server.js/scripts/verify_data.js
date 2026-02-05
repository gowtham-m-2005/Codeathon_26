const db = require('../config.db/db');

(async () => {
    try {
        const promisePool = db.promise();
        
        console.log('\n📊 DATABASE SUMMARY\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        // Count producers
        const [producers] = await promisePool.query('SELECT COUNT(*) as count FROM producers');
        console.log(`📦 Producers:          ${producers[0].count.toString().padStart(4)} records`);
        
        // Count destinations
        const [destinations] = await promisePool.query('SELECT COUNT(*) as count FROM destinations');
        console.log(`🎯 Destinations:       ${destinations[0].count.toString().padStart(4)} records`);
        
        // Count packages
        const [packages] = await promisePool.query('SELECT COUNT(*) as count FROM packages');
        console.log(`📦 Packages:           ${packages[0].count.toString().padStart(4)} records`);
        
        // Count containers
        const [containers] = await promisePool.query('SELECT COUNT(*) as count FROM containers');
        console.log(`🚚 Containers:         ${containers[0].count.toString().padStart(4)} records`);
        
        // Count inventory items
        const [inventory] = await promisePool.query('SELECT COUNT(*) as count FROM inventory');
        console.log(`📋 Inventory Items:    ${inventory[0].count.toString().padStart(4)} records`);
        
        // Count routes
        const [routes] = await promisePool.query('SELECT COUNT(*) as count FROM routes');
        console.log(`🗺️  Routes:             ${routes[0].count.toString().padStart(4)} records`);
        
        // Count transactions
        const [transactions] = await promisePool.query('SELECT COUNT(*) as count FROM transactions');
        console.log(`💰 Transactions:       ${transactions[0].count.toString().padStart(4)} records`);
        
        // Count blockchain blocks
        const [blockchain] = await promisePool.query('SELECT COUNT(*) as count FROM blockchain');
        console.log(`⛓️  Blockchain Blocks:  ${blockchain[0].count.toString().padStart(4)} records`);
        
        const total = producers[0].count + destinations[0].count + packages[0].count + 
                     containers[0].count + inventory[0].count;
        
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`TOTAL CORE RECORDS:    ${total.toString().padStart(4)}\n`);
        
        // Package status breakdown
        console.log('📦 Package Status Breakdown:');
        const [statusBreakdown] = await promisePool.query(
            `SELECT status, COUNT(*) as count FROM packages GROUP BY status ORDER BY count DESC`
        );
        statusBreakdown.forEach(row => {
            console.log(`   ${row.status.padEnd(15)} ${row.count.toString().padStart(4)} packages`);
        });
        
        // Container status breakdown
        console.log('\n🚚 Container Status Breakdown:');
        const [containerStatus] = await promisePool.query(
            `SELECT status, COUNT(*) as count FROM containers GROUP BY status ORDER BY count DESC`
        );
        containerStatus.forEach(row => {
            console.log(`   ${row.status.padEnd(15)} ${row.count.toString().padStart(4)} containers`);
        });
        
        // Availability summary
        console.log('\n📊 Availability Summary:');
        const [availablePackages] = await promisePool.query(
            `SELECT COUNT(*) as count FROM packages WHERE status = 'AVAILABLE'`
        );
        const [idleContainers] = await promisePool.query(
            `SELECT COUNT(*) as count FROM containers WHERE status = 'idle'`
        );
        console.log(`   ✅ Available Packages:  ${availablePackages[0].count}`);
        console.log(`   ✅ Idle Containers:     ${idleContainers[0].count}`);
        
        console.log('\n');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
})();
