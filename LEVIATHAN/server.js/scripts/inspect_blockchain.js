const db = require('../config.db/db');

(async () => {
    try {
        const promisePool = db.promise();
        
        const [blocks] = await promisePool.query('SELECT * FROM blockchain ORDER BY block_index');
        
        console.log('\n⛓️  BLOCKCHAIN DATA:\n');
        blocks.forEach(block => {
            console.log(`Block #${block.block_index}`);
            console.log(`  Previous Hash: ${block.previous_hash}`);
            console.log(`  Hash:          ${block.hash}`);
            console.log(`  Nonce:         ${block.nonce}`);
            console.log(`  Data:          ${block.data.substring(0, 50)}...`);
            console.log('');
        });
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
})();
