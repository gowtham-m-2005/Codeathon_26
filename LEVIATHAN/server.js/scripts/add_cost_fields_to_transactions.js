const pool = require('../config.db/db');

async function addCostFields() {
    try {
        console.log('Adding cost and time fields to transactions table...');
        
        // Add columns one by one to avoid syntax issues
        const columns = [
            'cost_per_section DECIMAL(10,2) DEFAULT 0',
            'total_cost DECIMAL(10,2) NULL',
            'distance_km DECIMAL(10,2) NULL',
            'estimated_delivery_time DATETIME NULL',
            'actual_delivery_time DATETIME NULL'
        ];
        
        for (let col of columns) {
            try {
                await pool.promise().query(`ALTER TABLE transactions ADD COLUMN ${col}`);
                console.log(`✓ Added ${col.split(' ')[0]}`);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`- ${col.split(' ')[0]} already exists`);
                } else {
                    throw err;
                }
            }
        }
        
        console.log('✓ All cost and time fields processed');
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

addCostFields();
