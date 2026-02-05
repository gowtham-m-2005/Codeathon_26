const pool = require('../config.db/db');

(async () => {
    try {
        const promisePool = pool.promise();

        // Create producers table
        const createProducers = `
            CREATE TABLE IF NOT EXISTS producers (
                producer_id INT AUTO_INCREMENT PRIMARY KEY,
                producer_name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                phone VARCHAR(100),
                inventory_latitude DECIMAL(10,7),
                inventory_longitude DECIMAL(10,7),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB;
        `;

        // Create inventory table
        const createInventory = `
            CREATE TABLE IF NOT EXISTS inventory (
                inventory_id INT AUTO_INCREMENT PRIMARY KEY,
                producer_id INT NOT NULL,
                item_name VARCHAR(255) DEFAULT 'Initial inventory',
                available_quantity INT DEFAULT 0,
                inventory_latitude DECIMAL(10,7),
                inventory_longitude DECIMAL(10,7),
                destination_latitude DECIMAL(10,7),
                destination_longitude DECIMAL(10,7),
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (producer_id) REFERENCES producers(producer_id) ON DELETE CASCADE
            ) ENGINE=InnoDB;
        `;

        // Create containers table (matches server.js insert fields)
        const createContainers = `
            CREATE TABLE IF NOT EXISTS containers (
                container_id INT AUTO_INCREMENT PRIMARY KEY,
                container_code VARCHAR(255) NOT NULL,
                driver_name VARCHAR(255),
                driver_phone VARCHAR(100),
                section_storage_space INT,
                total_sections INT,
                available_sections INT,
                cost_per_section DECIMAL(10,2),
                current_latitude DECIMAL(10,7),
                current_longitude DECIMAL(10,7),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB;
        `;

        console.log('Creating producers table if missing...');
        await promisePool.query(createProducers);

        console.log('Creating inventory table if missing...');
        await promisePool.query(createInventory);

        console.log('Creating containers table if missing...');
        await promisePool.query(createContainers);

        console.log('Schema creation complete.');
        process.exit(0);
    } catch (err) {
        console.error('Schema creation error:', err);
        process.exit(1);
    }
})();
