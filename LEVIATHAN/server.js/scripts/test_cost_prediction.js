/**
 * Quick Test for Cost Prediction Model
 * Tests the ML model with sample inputs
 */

const { CostPredictor } = require('../utils/costPrediction');

// Create a new predictor instance
const predictor = new CostPredictor();

console.log('🧪 Testing Cost Prediction Model\n');
console.log('=' .repeat(60));

// Sample training data (simulated)
const sampleTrainingData = [
    { distance_km: 10, deadline: new Date(Date.now() + 24 * 3600000), current_demand: 2, actual_cost: 5.5 },
    { distance_km: 20, deadline: new Date(Date.now() + 12 * 3600000), current_demand: 5, actual_cost: 8.2 },
    { distance_km: 50, deadline: new Date(Date.now() + 6 * 3600000), current_demand: 8, actual_cost: 15.4 },
    { distance_km: 100, deadline: new Date(Date.now() + 2 * 3600000), current_demand: 10, actual_cost: 28.5 },
    { distance_km: 30, deadline: new Date(Date.now() + 48 * 3600000), current_demand: 3, actual_cost: 7.8 },
    { distance_km: 15, deadline: new Date(Date.now() + 8 * 3600000), current_demand: 6, actual_cost: 6.9 },
    { distance_km: 70, deadline: new Date(Date.now() + 4 * 3600000), current_demand: 12, actual_cost: 22.3 },
    { distance_km: 40, deadline: new Date(Date.now() + 24 * 3600000), current_demand: 4, actual_cost: 10.1 },
    { distance_km: 25, deadline: new Date(Date.now() + 16 * 3600000), current_demand: 5, actual_cost: 8.7 },
    { distance_km: 80, deadline: new Date(Date.now() + 10 * 3600000), current_demand: 7, actual_cost: 19.2 },
    { distance_km: 12, deadline: new Date(Date.now() + 20 * 3600000), current_demand: 3, actual_cost: 6.2 },
    { distance_km: 35, deadline: new Date(Date.now() + 14 * 3600000), current_demand: 6, actual_cost: 11.5 },
];

console.log('\n1️⃣  Training model with sample data...\n');
predictor.train(sampleTrainingData);

console.log('\n' + '='.repeat(60));
console.log('\n2️⃣  Testing predictions with different scenarios:\n');

// Test scenarios
const testScenarios = [
    {
        name: 'Short Distance, Normal Urgency',
        distance_km: 15,
        deadline_hours: 24,
        current_demand: 3
    },
    {
        name: 'Long Distance, High Urgency',
        distance_km: 80,
        deadline_hours: 2,
        current_demand: 10
    },
    {
        name: 'Medium Distance, Low Demand',
        distance_km: 40,
        deadline_hours: 48,
        current_demand: 1
    },
    {
        name: 'Peak Hour Rush (Evening)',
        distance_km: 30,
        deadline_hours: 3,
        current_demand: 8
    },
    {
        name: 'Weekend Delivery',
        distance_km: 50,
        deadline_hours: 12,
        current_demand: 5
    }
];

testScenarios.forEach((scenario, index) => {
    const deadline = new Date(Date.now() + scenario.deadline_hours * 3600000);
    
    const prediction = predictor.predict({
        distance_km: scenario.distance_km,
        deadline: deadline,
        current_demand: scenario.current_demand
    });
    
    console.log(`${index + 1}. ${scenario.name}`);
    console.log(`   Distance: ${scenario.distance_km} km`);
    console.log(`   Deadline: ${scenario.deadline_hours} hours`);
    console.log(`   Demand: ${scenario.current_demand} active routes`);
    console.log(`   💰 Predicted Cost: $${prediction}/section`);
    console.log('');
});

console.log('='.repeat(60));
console.log('\n3️⃣  Model Coefficients:\n');
console.log('   Intercept (Base Cost):', predictor.coefficients.intercept.toFixed(2));
console.log('   Distance Factor:', predictor.coefficients.distance.toFixed(2));
console.log('   Urgency Factor:', predictor.coefficients.urgency.toFixed(2));
console.log('   Demand Factor:', predictor.coefficients.demand.toFixed(2));
console.log('   Peak Hour Premium:', predictor.coefficients.hour_peak.toFixed(2));
console.log('   Weekend Premium:', predictor.coefficients.weekend.toFixed(2));

console.log('\n' + '='.repeat(60));
console.log('\n4️⃣  Evaluating model performance:\n');

const testData = [
    { distance_km: 45, deadline: new Date(Date.now() + 10 * 3600000), current_demand: 6, actual_cost: 12.8 },
    { distance_km: 60, deadline: new Date(Date.now() + 5 * 3600000), current_demand: 9, actual_cost: 18.5 },
    { distance_km: 22, deadline: new Date(Date.now() + 18 * 3600000), current_demand: 4, actual_cost: 7.9 },
];

const metrics = predictor.evaluate(testData);

if (metrics) {
    console.log('   📊 MAE (Mean Absolute Error):', `$${metrics.mae}`);
    console.log('   📊 RMSE (Root Mean Squared Error):', `$${metrics.rmse}`);
    console.log('   📊 R² Score:', metrics.r_squared);
    console.log('   📊 Test Samples:', metrics.sample_size);
    
    console.log('\n   Performance Rating:');
    if (metrics.r_squared > 0.7) {
        console.log('   ✅ EXCELLENT (R² > 0.7)');
    } else if (metrics.r_squared > 0.5) {
        console.log('   ✅ GOOD (R² > 0.5)');
    } else if (metrics.r_squared > 0.3) {
        console.log('   ⚠️  MODERATE (R² > 0.3)');
    } else {
        console.log('   ⚠️  NEEDS IMPROVEMENT (R² < 0.3)');
    }
}

console.log('\n' + '='.repeat(60));
console.log('\n5️⃣  Model Export (for database storage):\n');

const exportedModel = predictor.exportModel();
console.log(JSON.stringify(exportedModel, null, 2));

console.log('\n' + '='.repeat(60));
console.log('\n✅ Test Complete!\n');
console.log('Next Steps:');
console.log('1. Run: node server.js/scripts/create_ml_models_table.js');
console.log('2. Run: node server.js/scripts/train_cost_model.js');
console.log('3. Start server: node server.js/server.js');
console.log('');
