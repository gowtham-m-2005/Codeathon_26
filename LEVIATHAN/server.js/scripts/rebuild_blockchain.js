const db = require('../config.db/db');
const Block = require('../blockchain/Block');

(async () => {
    try {
        const promisePool = db.promise();
        
        console.log('🔧 Rebuilding blockchain...\n');
        
        // Clear existing blockchain
        await promisePool.query('DELETE FROM blockchain');
        console.log('✓ Cleared existing blockchain data');
        
        // Create genesis block manually
        const genesisBlock = new Block(0, new Date(), {
            type: 'GENESIS',
            message: 'Genesis Block - Delivery Partner System'
        }, '0');
        genesisBlock.mineBlock(2);
        
        // Save to database
        await promisePool.query(
            `INSERT INTO blockchain (block_index, timestamp, data, previous_hash, hash, nonce) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                genesisBlock.index,
                genesisBlock.timestamp,
                JSON.stringify(genesisBlock.data),
                genesisBlock.previousHash,
                genesisBlock.hash,
                genesisBlock.nonce
            ]
        );
        
        console.log('✓ Created genesis block');
        console.log(`  Hash: ${genesisBlock.hash}`);
        console.log(`  Nonce: ${genesisBlock.nonce}`);
        
        console.log('\n✅ Blockchain rebuilt successfully!\n');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error rebuilding blockchain:', err);
        process.exit(1);
    }
})();
