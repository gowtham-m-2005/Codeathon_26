/**
 * Cost Prediction using Linear Regression
 * Predicts optimal cost_per_section based on:
 * - Distance (km)
 * - Urgency (deadline in hours)
 * - Demand (current active routes)
 * - Time of day
 * - Day of week
 */

class CostPredictor {
    constructor() {
        // Initialize with default coefficients (will be trained)
        this.coefficients = {
            intercept: 5.0,
            distance: 0.5,
            urgency: 0.3,
            demand: 0.2,
            hour_peak: 1.5,
            weekend: 2.0
        };
        
        // Normalization parameters (for feature scaling)
        this.normalization = {
            distance: { mean: 50, std: 30 },
            urgency: { mean: 12, std: 6 },
            demand: { mean: 5, std: 3 }
        };
        
        this.isModelTrained = false;
    }
    
    /**
     * Normalize a feature using z-score normalization
     */
    normalize(value, featureName) {
        const { mean, std } = this.normalization[featureName];
        if (std === 0) return 0;
        return (value - mean) / std;
    }
    
    /**
     * Extract features from input data
     */
    extractFeatures(inputData) {
        const {
            distance_km,
            deadline,
            current_demand = 0
        } = inputData;
        
        // Calculate urgency in hours
        let urgency = 24; // default 24 hours
        if (deadline) {
            const now = new Date();
            const deadlineDate = new Date(deadline);
            urgency = Math.max((deadlineDate - now) / (1000 * 60 * 60), 0.5);
        }
        
        // Time-based features
        const now = new Date();
        const hour = now.getHours();
        const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
        
        // Peak hour indicator (7-9 AM, 5-7 PM)
        const isPeakHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19) ? 1 : 0;
        
        // Weekend indicator
        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6) ? 1 : 0;
        
        return {
            distance: this.normalize(distance_km, 'distance'),
            urgency: this.normalize(urgency, 'urgency'),
            demand: this.normalize(current_demand, 'demand'),
            hour_peak: isPeakHour,
            weekend: isWeekend
        };
    }
    
    /**
     * Predict cost using linear regression
     * cost = intercept + Σ(coefficient_i * feature_i)
     */
    predict(inputData) {
        const features = this.extractFeatures(inputData);
        
        let cost = this.coefficients.intercept;
        cost += this.coefficients.distance * features.distance;
        cost += this.coefficients.urgency * features.urgency;
        cost += this.coefficients.demand * features.demand;
        cost += this.coefficients.hour_peak * features.hour_peak;
        cost += this.coefficients.weekend * features.weekend;
        
        // Apply 100x multiplier
        cost = cost * 100;
        
        // Ensure minimum cost of $200 and maximum of $5000 (after 100x multiplier)
        cost = Math.max(200.0, Math.min(5000.0, cost));
        
        // Round to 2 decimal places
        return Math.round(cost * 100) / 100;
    }
    
    /**
     * Train the model using historical transaction data
     * Simple Linear Regression using Normal Equation:
     * θ = (X^T X)^(-1) X^T y
     */
    train(trainingData) {
        if (!trainingData || trainingData.length < 10) {
            console.warn('⚠️ Insufficient training data. Need at least 10 samples.');
            return false;
        }
        
        console.log(`🎓 Training cost prediction model with ${trainingData.length} samples...`);
        
        // Update normalization parameters first
        this.updateNormalizationParams(trainingData);
        
        // Prepare feature matrix X and target vector y
        const X = [];
        const y = [];
        
        for (let data of trainingData) {
            const features = this.extractFeatures(data);
            X.push([
                1, // intercept
                features.distance,
                features.urgency,
                features.demand,
                features.hour_peak,
                features.weekend
            ]);
            y.push(data.actual_cost);
        }
        
        // Use gradient descent for simplicity (easier than matrix inversion)
        this.trainGradientDescent(X, y);
        
        this.isModelTrained = true;
        console.log('✅ Model trained successfully!');
        console.log('Coefficients:', this.coefficients);
        
        return true;
    }
    
    /**
     * Update normalization parameters based on training data
     */
    updateNormalizationParams(data) {
        // Calculate mean and std for each feature
        const features = {
            distance: [],
            urgency: [],
            demand: []
        };
        
        for (let item of data) {
            features.distance.push(item.distance_km);
            
            let urgency = 24;
            if (item.deadline) {
                const now = new Date(item.timestamp || new Date());
                const deadlineDate = new Date(item.deadline);
                urgency = Math.max((deadlineDate - now) / (1000 * 60 * 60), 0.5);
            }
            features.urgency.push(urgency);
            features.demand.push(item.current_demand || 0);
        }
        
        // Calculate mean and std for each feature
        for (let featureName in features) {
            const values = features[featureName];
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
            const std = Math.sqrt(variance) || 1; // prevent division by zero
            
            this.normalization[featureName] = { mean, std };
        }
        
        console.log('📊 Normalization parameters updated:', this.normalization);
    }
    
    /**
     * Train using gradient descent
     */
    trainGradientDescent(X, y, learningRate = 0.01, iterations = 1000) {
        const m = X.length; // number of samples
        const n = X[0].length; // number of features
        
        // Initialize coefficients
        let theta = new Array(n).fill(0);
        theta[0] = 5.0; // intercept
        
        // Gradient descent
        for (let iter = 0; iter < iterations; iter++) {
            const predictions = X.map(row => 
                row.reduce((sum, xi, i) => sum + xi * theta[i], 0)
            );
            
            const errors = predictions.map((pred, i) => pred - y[i]);
            
            // Update each coefficient
            for (let j = 0; j < n; j++) {
                const gradient = errors.reduce((sum, error, i) => 
                    sum + error * X[i][j], 0
                ) / m;
                
                theta[j] -= learningRate * gradient;
            }
            
            // Calculate cost (MSE) every 100 iterations
            if (iter % 100 === 0) {
                const mse = errors.reduce((sum, e) => sum + e * e, 0) / m;
                console.log(`Iteration ${iter}, MSE: ${mse.toFixed(4)}`);
            }
        }
        
        // Store trained coefficients
        this.coefficients = {
            intercept: theta[0],
            distance: theta[1],
            urgency: theta[2],
            demand: theta[3],
            hour_peak: theta[4],
            weekend: theta[5]
        };
    }
    
    /**
     * Load model coefficients from stored data
     */
    loadModel(modelData) {
        if (modelData.coefficients) {
            this.coefficients = modelData.coefficients;
        }
        if (modelData.normalization) {
            this.normalization = modelData.normalization;
        }
        this.isModelTrained = true;
        console.log('✅ Model loaded from saved data');
    }
    
    /**
     * Export model for storage
     */
    exportModel() {
        return {
            coefficients: this.coefficients,
            normalization: this.normalization,
            trained_at: new Date().toISOString(),
            version: '1.0'
        };
    }
    
    /**
     * Get model performance metrics
     */
    evaluate(testData) {
        if (!testData || testData.length === 0) {
            return null;
        }
        
        const predictions = testData.map(data => this.predict(data));
        const actual = testData.map(data => data.actual_cost);
        
        // Calculate metrics
        const errors = predictions.map((pred, i) => pred - actual[i]);
        const mae = errors.reduce((sum, e) => sum + Math.abs(e), 0) / errors.length;
        const mse = errors.reduce((sum, e) => sum + e * e, 0) / errors.length;
        const rmse = Math.sqrt(mse);
        
        // R-squared
        const meanActual = actual.reduce((a, b) => a + b, 0) / actual.length;
        const ssTotal = actual.reduce((sum, y) => sum + Math.pow(y - meanActual, 2), 0);
        const ssResidual = errors.reduce((sum, e) => sum + e * e, 0);
        const rSquared = 1 - (ssResidual / ssTotal);
        
        return {
            mae: Math.round(mae * 100) / 100,
            rmse: Math.round(rmse * 100) / 100,
            r_squared: Math.round(rSquared * 1000) / 1000,
            sample_size: testData.length
        };
    }
}

// Singleton instance
const costPredictor = new CostPredictor();

module.exports = { CostPredictor, costPredictor };
