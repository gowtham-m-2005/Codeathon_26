const db = require('../config.db/db');

(async () => {
    try {
        const promisePool = db.promise();
        
        console.log('\n🕐 Updating all estimated delivery times...\n');
        
        // Set estimated_delivery_time to current time for all incomplete transactions
        // This ensures they can be completed immediately
        const currentTime = new Date();
        
        console.log(`Current time: ${currentTime.toLocaleString()}\n`);
        
        // Update all transactions that haven't been completed yet
        const [result] = await promisePool.query(
            `UPDATE transactions 
             SET estimated_delivery_time = NOW()
             WHERE transaction_status != 'COMPLETED'`
        );
        
        console.log(`✅ Updated ${result.affectedRows} pending transactions to current time\n`);
        
        // Show current transactions with their times
        const [transactions] = await promisePool.query(
            `SELECT transaction_id, transaction_type, transaction_status, 
                    estimated_delivery_time, created_at
             FROM transactions 
             WHERE transaction_status != 'COMPLETED'
             ORDER BY transaction_id DESC
             LIMIT 10`
        );
        
        console.log('Latest pending transactions:');
        console.log('ID   | Type    | Status    | Estimated Time           | Created Time');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        transactions.forEach(t => {
            const id = String(t.transaction_id).padEnd(4);
            const type = String(t.transaction_type).padEnd(7);
            const status = String(t.transaction_status).padEnd(9);
            const estTime = t.estimated_delivery_time ? new Date(t.estimated_delivery_time).toLocaleString() : 'NULL';
            const createTime = new Date(t.created_at).toLocaleString();
            
            console.log(`${id} | ${type} | ${status} | ${estTime.padEnd(24)} | ${createTime}`);
        });
        
        console.log('\n✅ All pending transactions can now be completed immediately!\n');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
})();
