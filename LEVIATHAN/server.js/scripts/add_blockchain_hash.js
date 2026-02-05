const pool = require('../config.db/db');

async function addBlockchainHash() {
    try {
        console.log('Adding blockchain_hash to transactions...');
        
        await pool.promise().query(`
            ALTER TABLE transactions
            ADD COLUMN blockchain_hash VARCHAR(64) NULL
        `);
        
        console.log('✓ blockchain_hash column added');
        process.exit(0);
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('- blockchain_hash already exists');
            process.exit(0);
        } else {
            console.error('Error:', err.message);
            process.exit(1);
        }
    }
}

addBlockchainHash();
