/**
 * Training Script for Cost Prediction Model
 * 
 * This script:
 * 1. Fetches historical transaction data
 * 2. Prepares training data with features
 * 3. Trains the cost prediction model
 * 4. Saves model coefficients to database
 * 5. Evaluates model performance
 */

const db = require('../config.db/db');
const { costPredictor } = require('../utils/costPrediction');

async function getActiveDemandAtTime(timestamp, connection) {
    const [result] = await connection.query(
        `SELECT COUNT(DISTINCT route_id) as demand
         FROM route_tasks 
         WHERE created_at <= ? 
         AND task_status IN ('PENDING', 'IN_PROGRESS')`,
        [timestamp]
    );
    return result[0]?.demand || 0;
}

async function trainCostModel() {
    const promisePool = db.promise();
    
    try {
        console.log('📚 Fetching historical transaction data...\n');
        
        // Fetch completed transactions with relevant data
        const [transactions] = await promisePool.query(`
            SELECT 
                t.transaction_id,
                t.cost_per_section,
                t.distance_km,
                t.estimated_delivery_time,
                t.created_at,
                t.completed_at,
                p.deadline,
                rt.container_id
            FROM transactions t
            JOIN route_tasks rt ON t.task_id = rt.task_id
            JOIN packages p ON t.package_id = p.package_id
            WHERE t.transaction_status = 'COMPLETED'
            AND t.cost_per_section IS NOT NULL
            AND t.distance_km IS NOT NULL
            AND t.completed_at IS NOT NULL
            ORDER BY t.created_at DESC
            LIMIT 1000
        `);
        
        if (transactions.length < 10) {
            console.log('❌ Insufficient data for training. Need at least 10 completed transactions.');
            console.log(`   Current count: ${transactions.length}`);
            console.log('\n💡 Tip: Create more transactions and complete them to train the model.');
            return;
        }
        
        console.log(`✅ Found ${transactions.length} completed transactions\n`);
        
        // Prepare training data
        console.log('🔧 Preparing training data...\n');
        const trainingData = [];
        
        for (let tx of transactions) {
            // Get demand at the time of transaction
            const demand = await getActiveDemandAtTime(tx.created_at, promisePool);
            
            trainingData.push({
                distance_km: tx.distance_km,
                deadline: tx.deadline,
                current_demand: demand,
                timestamp: tx.created_at,
                actual_cost: tx.cost_per_section
            });
        }
        
        // Split data: 80% training, 20% testing
        const splitIndex = Math.floor(trainingData.length * 0.8);
        const trainSet = trainingData.slice(0, splitIndex);
        const testSet = trainingData.slice(splitIndex);
        
        console.log(`📊 Training set: ${trainSet.length} samples`);
        console.log(`📊 Test set: ${testSet.length} samples\n`);
        
        // Train the model
        console.log('🎓 Starting model training...\n');
        const trained = costPredictor.train(trainSet);
        
        if (!trained) {
            console.log('❌ Training failed');
            return;
        }
        
        // Evaluate on test set
        console.log('\n📈 Evaluating model performance...\n');
        const metrics = costPredictor.evaluate(testSet);
        
        if (metrics) {
            console.log('📊 Model Performance Metrics:');
            console.log(`   MAE (Mean Absolute Error): $${metrics.mae}`);
            console.log(`   RMSE (Root Mean Squared Error): $${metrics.rmse}`);
            console.log(`   R² Score: ${metrics.r_squared}`);
            console.log(`   Test Samples: ${metrics.sample_size}\n`);
            
            // Interpretation
            if (metrics.r_squared > 0.7) {
                console.log('✅ Excellent model performance! (R² > 0.7)');
            } else if (metrics.r_squared > 0.5) {
                console.log('✅ Good model performance! (R² > 0.5)');
            } else if (metrics.r_squared > 0.3) {
                console.log('⚠️  Moderate model performance (R² > 0.3)');
            } else {
                console.log('⚠️  Low model performance - consider collecting more diverse data');
            }
        }
        
        // Save model to database
        console.log('\n💾 Saving model to database...\n');
        const modelData = costPredictor.exportModel();
        
        // Create or update model in database
        await promisePool.query(`
            CREATE TABLE IF NOT EXISTS ml_models (
                model_id INT PRIMARY KEY AUTO_INCREMENT,
                model_name VARCHAR(100) UNIQUE NOT NULL,
                model_type VARCHAR(50),
                coefficients JSON,
                normalization JSON,
                metrics JSON,
                trained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1
            )
        `);
        
        // Insert or update the cost prediction model
        await promisePool.query(`
            INSERT INTO ml_models (model_name, model_type, coefficients, normalization, metrics, trained_at, is_active)
            VALUES ('cost_predictor', 'linear_regression', ?, ?, ?, NOW(), 1)
            ON DUPLICATE KEY UPDATE
                coefficients = VALUES(coefficients),
                normalization = VALUES(normalization),
                metrics = VALUES(metrics),
                trained_at = VALUES(trained_at),
                is_active = 1
        `, [
            JSON.stringify(modelData.coefficients),
            JSON.stringify(modelData.normalization),
            JSON.stringify(metrics)
        ]);
        
        console.log('✅ Model saved to database successfully!\n');
        
        // Show sample predictions
        console.log('🔮 Sample Predictions:\n');
        const sampleInputs = [
            { distance_km: 10, deadline: new Date(Date.now() + 2 * 60 * 60 * 1000), current_demand: 3 },
            { distance_km: 50, deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), current_demand: 5 },
            { distance_km: 100, deadline: new Date(Date.now() + 1 * 60 * 60 * 1000), current_demand: 10 }
        ];
        
        for (let input of sampleInputs) {
            const prediction = costPredictor.predict(input);
            const urgency = (input.deadline - new Date()) / (1000 * 60 * 60);
            console.log(`   Distance: ${input.distance_km}km, Urgency: ${urgency.toFixed(1)}h, Demand: ${input.current_demand}`);
            console.log(`   → Predicted Cost: $${prediction}/section\n`);
        }
        
        console.log('✅ Training complete! Model is ready for use.\n');
        
    } catch (error) {
        console.error('❌ Error during training:', error.message);
        console.error(error);
    } finally {
        await promisePool.end();
    }
}

// Run training
trainCostModel();
