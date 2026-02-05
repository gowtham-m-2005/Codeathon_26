const db = require('../config.db/db');

(async () => {
    try {
        const promisePool = db.promise();
        
        console.log('🔗 Linking existing containers and producers to users...\n');
        
        // Get all containers without linked users
        const [containers] = await promisePool.query(`
            SELECT c.container_id, c.driver_name 
            FROM containers c
            LEFT JOIN users u ON u.reference_id = c.container_id AND u.user_type = 'DRIVER'
            WHERE u.user_id IS NULL
            LIMIT 10
        `);
        
        console.log(`Found ${containers.length} containers without user accounts\n`);
        
        for (const container of containers) {
            const email = `driver${container.container_id}@delivery.com`;
            
            await promisePool.query(
                'INSERT INTO users (name, email, user_type, reference_id) VALUES (?, ?, ?, ?)',
                [container.driver_name, email, 'DRIVER', container.container_id]
            );
            
            console.log(`✓ Created user for container ${container.container_id} (${container.driver_name})`);
            console.log(`  Email: ${email}`);
        }
        
        // Get all producers without linked users
        const [producers] = await promisePool.query(`
            SELECT p.producer_id, p.producer_name 
            FROM producers p
            LEFT JOIN users u ON u.reference_id = p.producer_id AND u.user_type = 'PRODUCER'
            WHERE u.user_id IS NULL
            LIMIT 10
        `);
        
        console.log(`\nFound ${producers.length} producers without user accounts\n`);
        
        for (const producer of producers) {
            const email = `producer${producer.producer_id}@delivery.com`;
            
            await promisePool.query(
                'INSERT INTO users (name, email, user_type, reference_id) VALUES (?, ?, ?, ?)',
                [producer.producer_name, email, 'PRODUCER', producer.producer_id]
            );
            
            console.log(`✓ Created user for producer ${producer.producer_id} (${producer.producer_name})`);
            console.log(`  Email: ${email}`);
        }
        
        console.log('\n✅ User linking complete!');
        console.log('\n📋 Login Instructions:');
        console.log('   - Drivers: Use email driver{ID}@delivery.com (e.g., driver1@delivery.com)');
        console.log('   - Producers: Use email producer{ID}@delivery.com (e.g., producer1@delivery.com)');
        console.log('   - Admin: Use email me@gmail.com');
        console.log('   - Password = Email (for all users)\n');
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
})();
