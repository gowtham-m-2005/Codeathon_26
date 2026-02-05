/**
 * Initialize ML Models Database Table
 * Creates the table structure for storing trained ML models
 */

const db = require('../config.db/db');

async function createMLModelsTable() {
    const promisePool = db.promise();
    
    try {
        console.log('📋 Creating ML models table...\n');
        
        // Create ml_models table
        await promisePool.query(`
            CREATE TABLE IF NOT EXISTS ml_models (
                model_id INT PRIMARY KEY AUTO_INCREMENT,
                model_name VARCHAR(100) UNIQUE NOT NULL,
                model_type VARCHAR(50) NOT NULL,
                coefficients JSON NOT NULL,
                normalization JSON NOT NULL,
                metrics JSON,
                version VARCHAR(20) DEFAULT '1.0',
                trained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_model_name (model_name),
                INDEX idx_is_active (is_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        console.log('✅ ml_models table created successfully!');
        
        // Create model_training_history table for tracking
        await promisePool.query(`
            CREATE TABLE IF NOT EXISTS model_training_history (
                history_id INT PRIMARY KEY AUTO_INCREMENT,
                model_name VARCHAR(100) NOT NULL,
                training_samples INT,
                test_samples INT,
                mae DECIMAL(10, 2),
                rmse DECIMAL(10, 2),
                r_squared DECIMAL(5, 4),
                training_duration_seconds INT,
                trained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_model_name (model_name),
                INDEX idx_trained_at (trained_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        console.log('✅ model_training_history table created successfully!');
        
        // Insert default cost predictor model with baseline coefficients
        const defaultCoefficients = {
            intercept: 5.0,
            distance: 0.5,
            urgency: 0.3,
            demand: 0.2,
            hour_peak: 1.5,
            weekend: 2.0
        };
        
        const defaultNormalization = {
            distance: { mean: 50, std: 30 },
            urgency: { mean: 12, std: 6 },
            demand: { mean: 5, std: 3 }
        };
        
        await promisePool.query(`
            INSERT INTO ml_models (model_name, model_type, coefficients, normalization, version, is_active)
            VALUES ('cost_predictor', 'linear_regression', ?, ?, '1.0', 1)
            ON DUPLICATE KEY UPDATE
                model_id = model_id
        `, [
            JSON.stringify(defaultCoefficients),
            JSON.stringify(defaultNormalization)
        ]);
        
        console.log('✅ Default cost predictor model initialized!');
        
        // Show table structure
        const [columns] = await promisePool.query('DESCRIBE ml_models');
        console.log('\n📊 ML Models Table Structure:');
        columns.forEach(col => {
            console.log(`   ${col.Field}: ${col.Type}`);
        });
        
        console.log('\n✅ ML Models database setup complete!\n');
        
    } catch (error) {
        console.error('❌ Error creating ML models table:', error.message);
        throw error;
    } finally {
        await promisePool.end();
    }
}

// Run the script
createMLModelsTable();
