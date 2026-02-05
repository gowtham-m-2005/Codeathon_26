const pool = require('../config.db/db');

async function createBlockchainTable() {
    try {
        console.log('Creating blockchain table...');
        
        await pool.promise().query(`
            CREATE TABLE IF NOT EXISTS blockchain (
                block_index INT PRIMARY KEY,
                timestamp DATETIME NOT NULL,
                data TEXT NOT NULL,
                previous_hash VARCHAR(64) NOT NULL,
                hash VARCHAR(64) NOT NULL UNIQUE,
                nonce INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        console.log('✓ Blockchain table created');
        
        // Create peer nodes table for P2P mining
        await pool.promise().query(`
            CREATE TABLE IF NOT EXISTS peer_nodes (
                node_id INT AUTO_INCREMENT PRIMARY KEY,
                node_address VARCHAR(255) NOT NULL UNIQUE,
                last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE
            )
        `);
        
        console.log('✓ Peer nodes table created');
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

createBlockchainTable();
