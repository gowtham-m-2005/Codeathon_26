const db = require('../config.db/db');

(async () => {
    try {
        const promisePool = db.promise();
        
        console.log('\n🕐 Setting all estimated delivery times to NOW...\n');
        
        const currentTime = new Date();
        console.log(`Current time: ${currentTime.toLocaleString()}\n`);
        
        // Update all transactions - set estimated time to NOW so they can be completed immediately
        const [result] = await promisePool.query(
            `UPDATE transactions 
             SET estimated_delivery_time = NOW()`
        );
        
        console.log(`✅ Updated ${result.affectedRows} transactions (ALL transactions)\n`);
        
        // Show updated transactions
        const [transactions] = await promisePool.query(
            `SELECT transaction_id, transaction_type, transaction_status, 
                    estimated_delivery_time, created_at
             FROM transactions 
             ORDER BY transaction_id DESC
             LIMIT 15`
        );
        
        if (transactions.length > 0) {
            console.log('Latest 15 transactions:');
            console.log('ID   | Type    | Status    | Estimated Time           | Can Complete?');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
            transactions.forEach(t => {
                const id = String(t.transaction_id).padEnd(4);
                const type = String(t.transaction_type).padEnd(7);
                const status = String(t.transaction_status).padEnd(9);
                const estTime = t.estimated_delivery_time ? new Date(t.estimated_delivery_time).toLocaleString() : 'NULL';
                const canComplete = new Date(t.estimated_delivery_time) <= new Date() ? '✅ YES' : '❌ NO';
                
                console.log(`${id} | ${type} | ${status} | ${estTime.padEnd(24)} | ${canComplete}`);
            });
        } else {
            console.log('✅ No transactions found');
        }
        
        console.log('\n✅ ALL transactions can now be completed immediately!\n');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
})();
