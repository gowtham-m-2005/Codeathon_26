const db = require('../config.db/db');

// Sample data arrays
const producerNames = [
    'WeGrow Farms', 'GreenHarvest Co', 'EcoYield Agriculture', 'FreshFields Ltd', 'OrganicEarth Farms',
    'NaturesPick Gardens', 'SunnyAcres Farm', 'GoldenValley Produce', 'PureHarvest Organics', 'VerdantFields Co',
    'BountifulCrops Ltd', 'EarthFresh Farms', 'GreenLeaf Agriculture', 'RichSoil Produce', 'CrystalClear Farms',
    'MeadowGreen Gardens', 'HarvestGold Co', 'NaturalBounty Farms', 'FreshStart Agriculture', 'GreenValley Organics',
    'SunriseFarms Ltd', 'PureNature Produce', 'EcoHarvest Gardens', 'FertileFields Co', 'GreenThumb Farms',
    'OrganicRoots Agriculture', 'FreshAir Farms', 'NaturesWay Produce', 'GoldenHarvest Ltd', 'EarthCare Farms',
    'GreenPlanet Agriculture', 'CleanCrop Organics', 'HealthyHarvest Co', 'PureFarm Produce', 'EcoFriendly Gardens',
    'SustainableYield Farms', 'GreenGold Agriculture', 'NaturalGrowth Ltd', 'FreshCrop Organics', 'EarthBound Farms',
    'GreenHorizon Co', 'OrganicPurity Farms', 'NatureFirst Agriculture', 'CleanEarth Produce', 'GreenWave Farms',
    'EcoVillage Gardens', 'FreshField Organics', 'PureGreen Agriculture', 'NatureBest Farms', 'GoldenGreen Ltd',
    'EarthGreen Co', 'OrganicLife Farms', 'GreenPath Agriculture', 'CleanHarvest Produce', 'EcoChoice Farms',
    'NaturePure Gardens', 'FreshGreen Organics', 'GreenZone Agriculture', 'PureLife Farms', 'EarthFirst Ltd'
];

const driverNames = [
    'R. Kumar', 'S. Arjun', 'M. Prakash', 'K. Senthil', 'Joel', 
    'A. Ravi', 'B. Suresh', 'C. Ramesh', 'D. Ganesh', 'E. Mahesh',
    'F. Dinesh', 'G. Rajesh', 'H. Naresh', 'I. Karthik', 'J. Vijay',
    'K. Arun', 'L. Deepak', 'M. Ashok', 'N. Sanjay', 'O. Manoj',
    'P. Vishal', 'Q. Nikhil', 'R. Rohan', 'S. Rahul', 'T. Ankit',
    'U. Sumit', 'V. Amit', 'W. Rohit', 'X. Sachin', 'Y. Praveen',
    'Z. Naveen', 'AA. Venkat', 'AB. Surya', 'AC. Aditya', 'AD. Arjun',
    'AE. Bharat', 'AF. Charan', 'AG. Dhruv', 'AH. Eshan', 'AI. Farhan',
    'AJ. Gopal', 'AK. Hari', 'AL. Irfan', 'AM. Jatin', 'AN. Karan',
    'AO. Lalit', 'AP. Mohan', 'AQ. Nitin', 'AR. Om', 'AS. Pawan',
    'AT. Qamar', 'AU. Rajan', 'AV. Salman', 'AW. Tarun', 'AX. Uday',
    'AY. Vinod', 'AZ. Wasim', 'BA. Xavier', 'BB. Yash', 'BC. Zahir'
];

const packageTypes = [
    'Vegetables', 'Fruits', 'Grains', 'Dairy', 'Organic Produce',
    'Fresh Herbs', 'Root Vegetables', 'Leafy Greens', 'Berries', 'Citrus Fruits',
    'Nuts', 'Seeds', 'Pulses', 'Rice', 'Wheat',
    'Corn', 'Barley', 'Oats', 'Millet', 'Sorghum',
    'Tomatoes', 'Potatoes', 'Onions', 'Carrots', 'Cabbage',
    'Cauliflower', 'Broccoli', 'Spinach', 'Lettuce', 'Cucumber',
    'Bell Peppers', 'Eggplant', 'Zucchini', 'Squash', 'Pumpkin',
    'Apples', 'Oranges', 'Bananas', 'Grapes', 'Mangoes',
    'Strawberries', 'Blueberries', 'Raspberries', 'Watermelon', 'Pineapple',
    'Papaya', 'Guava', 'Pomegranate', 'Kiwi', 'Dragon Fruit'
];

// Tamil Nadu locations (lat/lng)
const locations = [
    { lat: 11.016844, lng: 76.955833, name: 'Coimbatore' },
    { lat: 11.664325, lng: 78.146014, name: 'Salem' },
    { lat: 10.790483, lng: 78.704673, name: 'Trichy' },
    { lat: 9.925201, lng: 78.119775, name: 'Madurai' },
    { lat: 10.283032, lng: 78.333574, name: 'Dindigul' },
    { lat: 11.344291, lng: 77.728165, name: 'Erode' },
    { lat: 11.107482, lng: 77.347375, name: 'Tiruppur' },
    { lat: 10.525282, lng: 76.214395, name: 'Palakkad' },
    { lat: 11.751264, lng: 78.758816, name: 'Namakkal' },
    { lat: 10.360392, lng: 77.958008, name: 'Karur' },
    { lat: 12.972442, lng: 77.580643, name: 'Bangalore' },
    { lat: 13.082680, lng: 80.270721, name: 'Chennai' },
    { lat: 11.127123, lng: 78.656891, name: 'Perambalur' },
    { lat: 10.787932, lng: 79.137268, name: 'Thanjavur' },
    { lat: 10.962016, lng: 79.392696, name: 'Kumbakonam' },
    { lat: 11.940277, lng: 79.482841, name: 'Cuddalore' },
    { lat: 12.234913, lng: 79.086647, name: 'Vellore' },
    { lat: 11.936110, lng: 79.830460, name: 'Pondicherry' },
    { lat: 12.820047, lng: 80.043652, name: 'Kanchipuram' },
    { lat: 12.918294, lng: 79.132065, name: 'Tiruvannamalai' }
];

function getRandomLocation() {
    return locations[Math.floor(Math.random() * locations.length)];
}

function getRandomFromArray(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomEmail(name) {
    const domain = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'][Math.floor(Math.random() * 4)];
    return name.toLowerCase().replace(/[^a-z]/g, '') + '@' + domain;
}

function getRandomPhone() {
    return '9' + Math.floor(Math.random() * 900000000 + 100000000);
}

async function populateData() {
    const promisePool = db.promise();
    
    try {
        console.log('🚀 Starting bulk data population...\n');
        
        // ========== POPULATE PRODUCERS (60 producers) ==========
        console.log('📦 Creating 60 producers...');
        const producerIds = [];
        
        for (let i = 0; i < 60; i++) {
            const producerName = producerNames[i % producerNames.length] + ` #${i + 1}`;
            const location = getRandomLocation();
            const email = getRandomEmail(producerName);
            const phone = getRandomPhone();
            
            const [result] = await promisePool.query(
                `INSERT INTO producers (producer_name, email, phone, inventory_latitude, inventory_longitude) 
                 VALUES (?, ?, ?, ?, ?)`,
                [producerName, email, phone, location.lat, location.lng]
            );
            
            producerIds.push(result.insertId);
            
            if ((i + 1) % 10 === 0) {
                console.log(`   ✓ Created ${i + 1} producers...`);
            }
        }
        
        console.log(`✅ Created ${producerIds.length} producers\n`);
        
        // ========== POPULATE DESTINATIONS (20 destinations) ==========
        console.log('🎯 Creating 20 destinations...');
        const destinationIds = [];
        
        for (let i = 0; i < 20; i++) {
            const location = getRandomLocation();
            const destName = `${location.name} Hub #${i + 1}`;
            
            // Check if destinations table exists
            const [tableCheck] = await promisePool.query(
                `SHOW TABLES LIKE 'destinations'`
            );
            
            if (tableCheck.length === 0) {
                // Create destinations table if it doesn't exist
                await promisePool.query(`
                    CREATE TABLE IF NOT EXISTS destinations (
                        destination_id INT AUTO_INCREMENT PRIMARY KEY,
                        destination_name VARCHAR(255) NOT NULL,
                        latitude DECIMAL(10,7),
                        longitude DECIMAL(10,7),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB
                `);
                console.log('   ✓ Created destinations table');
            }
            
            const [result] = await promisePool.query(
                `INSERT INTO destinations (destination_name, latitude, longitude) 
                 VALUES (?, ?, ?)`,
                [destName, location.lat, location.lng]
            );
            
            destinationIds.push(result.insertId);
        }
        
        console.log(`✅ Created ${destinationIds.length} destinations\n`);
        
        // ========== POPULATE PACKAGES (100 packages) ==========
        console.log('📦 Creating 100 packages...');
        
        // Check if packages table exists
        const [packageTableCheck] = await promisePool.query(
            `SHOW TABLES LIKE 'packages'`
        );
        
        if (packageTableCheck.length === 0) {
            // Create packages table
            await promisePool.query(`
                CREATE TABLE IF NOT EXISTS packages (
                    package_id INT AUTO_INCREMENT PRIMARY KEY,
                    package_code VARCHAR(255) NOT NULL,
                    producer_id INT NOT NULL,
                    destination_id INT NOT NULL,
                    required_sections INT DEFAULT 1,
                    max_delivery_time DATETIME,
                    status ENUM('AVAILABLE', 'REQUESTED', 'APPROVED', 'LOADED', 'IN_TRANSIT', 'DELIVERED') DEFAULT 'AVAILABLE',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (producer_id) REFERENCES producers(producer_id) ON DELETE CASCADE,
                    FOREIGN KEY (destination_id) REFERENCES destinations(destination_id) ON DELETE CASCADE
                ) ENGINE=InnoDB
            `);
            console.log('   ✓ Created packages table');
        }
        
        for (let i = 0; i < 100; i++) {
            const packageCode = `PKG-${String(i + 1).padStart(4, '0')}`;
            const producerId = getRandomFromArray(producerIds);
            const destinationId = getRandomFromArray(destinationIds);
            const requiredSections = getRandomInt(1, 5);
            const packageType = getRandomFromArray(packageTypes);
            const size = getRandomInt(5, 50); // Package size in kg
            
            // Get producer and destination locations
            const [producerData] = await promisePool.query(
                `SELECT inventory_latitude, inventory_longitude FROM producers WHERE producer_id = ?`,
                [producerId]
            );
            
            const [destData] = await promisePool.query(
                `SELECT latitude, longitude FROM destinations WHERE destination_id = ?`,
                [destinationId]
            );
            
            // Random delivery deadline (1-10 days from now)
            const maxDeliveryTime = new Date();
            maxDeliveryTime.setDate(maxDeliveryTime.getDate() + getRandomInt(1, 10));
            
            const status = ['AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'REQUESTED'][Math.floor(Math.random() * 4)];
            
            await promisePool.query(
                `INSERT INTO packages (package_code, producer_id, destination_id, size, destination_latitude, destination_longitude, required_sections, max_delivery_time, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [packageCode, producerId, destinationId, size, destData[0].latitude, destData[0].longitude, requiredSections, maxDeliveryTime, status]
            );
            
            if ((i + 1) % 20 === 0) {
                console.log(`   ✓ Created ${i + 1} packages...`);
            }
        }
        
        console.log(`✅ Created 100 packages\n`);
        
        // ========== POPULATE CONTAINERS (60 containers) ==========
        console.log('🚚 Creating 60 containers...');
        
        for (let i = 0; i < 60; i++) {
            const containerCode = `C-${String(i + 1).padStart(3, '0')}`;
            const driverName = driverNames[i % driverNames.length];
            const driverPhone = getRandomPhone();
            const location = getRandomLocation();
            
            const totalSections = getRandomInt(10, 30);
            const usedSections = getRandomInt(0, Math.floor(totalSections * 0.3)); // 0-30% used
            const availableSections = totalSections - usedSections;
            const sectionStorageSpace = 1; // Standard
            const costPerSection = getRandomInt(80, 150);
            
            // Check if used_sections and status columns exist
            const [columnsCheck] = await promisePool.query(
                `SHOW COLUMNS FROM containers LIKE 'used_sections'`
            );
            
            if (columnsCheck.length === 0) {
                // Add used_sections column if missing
                await promisePool.query(
                    `ALTER TABLE containers ADD COLUMN used_sections INT DEFAULT 0 AFTER total_sections`
                );
                console.log('   ✓ Added used_sections column');
            }
            
            const [statusCheck] = await promisePool.query(
                `SHOW COLUMNS FROM containers LIKE 'status'`
            );
            
            if (statusCheck.length === 0) {
                // Add status column if missing
                await promisePool.query(
                    `ALTER TABLE containers ADD COLUMN status ENUM('idle', 'ACTIVE', 'in_transit', 'maintenance') DEFAULT 'idle' AFTER available_sections`
                );
                console.log('   ✓ Added status column');
            }
            
            const status = ['idle', 'idle', 'idle', 'ACTIVE'][Math.floor(Math.random() * 4)];
            
            await promisePool.query(
                `INSERT INTO containers 
                (container_code, driver_name, driver_phone, section_storage_space, total_sections, used_sections, available_sections, cost_per_section, current_latitude, current_longitude, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [containerCode, driverName, driverPhone, sectionStorageSpace, totalSections, usedSections, availableSections, costPerSection, location.lat, location.lng, status]
            );
            
            if ((i + 1) % 10 === 0) {
                console.log(`   ✓ Created ${i + 1} containers...`);
            }
        }
        
        console.log(`✅ Created 60 containers\n`);
        
        // ========== POPULATE INVENTORY (100 inventory items) ==========
        console.log('📋 Creating 100 inventory items...');
        
        // First, check if max_delivery_time column exists in inventory
        const [inventoryColumnsCheck] = await promisePool.query(
            `SHOW COLUMNS FROM inventory LIKE 'max_delivery_time'`
        );
        
        if (inventoryColumnsCheck.length === 0) {
            await promisePool.query(
                `ALTER TABLE inventory ADD COLUMN max_delivery_time DATETIME AFTER destination_longitude`
            );
            console.log('   ✓ Added max_delivery_time column to inventory');
        }
        
        for (let i = 0; i < 100; i++) {
            const producerId = getRandomFromArray(producerIds);
            const itemName = getRandomFromArray(packageTypes);
            const availableQuantity = getRandomInt(10, 500);
            
            // Get producer location
            const [producerData] = await promisePool.query(
                `SELECT inventory_latitude, inventory_longitude FROM producers WHERE producer_id = ?`,
                [producerId]
            );
            
            const destinationLocation = getRandomLocation();
            
            // Random delivery deadline
            const maxDeliveryTime = new Date();
            maxDeliveryTime.setDate(maxDeliveryTime.getDate() + getRandomInt(2, 15));
            
            await promisePool.query(
                `INSERT INTO inventory 
                (producer_id, item_name, available_quantity, inventory_latitude, inventory_longitude, destination_latitude, destination_longitude, max_delivery_time) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    producerId, 
                    itemName, 
                    availableQuantity, 
                    producerData[0].inventory_latitude, 
                    producerData[0].inventory_longitude,
                    destinationLocation.lat,
                    destinationLocation.lng,
                    maxDeliveryTime
                ]
            );
            
            if ((i + 1) % 20 === 0) {
                console.log(`   ✓ Created ${i + 1} inventory items...`);
            }
        }
        
        console.log(`✅ Created 100 inventory items\n`);
        
        // ========== SUMMARY ==========
        console.log('\n🎉 BULK DATA POPULATION COMPLETE!\n');
        console.log('Summary:');
        console.log('  📦 Producers: 60');
        console.log('  🎯 Destinations: 20');
        console.log('  📦 Packages: 100');
        console.log('  🚚 Containers: 60');
        console.log('  📋 Inventory Items: 100');
        console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('  TOTAL RECORDS: 340\n');
        
        process.exit(0);
        
    } catch (err) {
        console.error('❌ Error populating data:', err);
        process.exit(1);
    }
}

populateData();
