const db = require('../config.db/db');

(async () => {
    try {
        const promisePool = db.promise();
        
        console.log('📋 Creating users table...\n');
        
        // Create users table
        await promisePool.query(`
            CREATE TABLE IF NOT EXISTS users (
                user_id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                user_type ENUM('ADMIN', 'DRIVER', 'PRODUCER') NOT NULL,
                reference_id INT DEFAULT NULL COMMENT 'container_id for drivers, producer_id for producers',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP NULL,
                INDEX idx_email (email),
                INDEX idx_type (user_type)
            ) ENGINE=InnoDB
        `);
        
        console.log('✓ Users table created');
        
        // Insert admin user
        await promisePool.query(`
            INSERT IGNORE INTO users (name, email, user_type)
            VALUES ('me', 'me@gmail.com', 'ADMIN')
        `);
        
        console.log('✓ Admin user created (me@gmail.com)');
        
        console.log('\n✅ Authentication tables ready!\n');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
})();
