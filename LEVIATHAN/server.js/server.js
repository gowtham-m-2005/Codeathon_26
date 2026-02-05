const express = require('express')
const session = require('express-session')
const path = require('path')
const app = express()
const PORT = process.env.PORT || 5001
const db = require('./config.db/db');

// Routing algorithm utilities
const { dijkstra } = require('./utils/dijkstra');
const { aStar } = require('./utils/astar');
const { greedyProducerSelection } = require('./utils/greedyProducerSelection');
const { recalculatePriorities } = require('./utils/priorityCalculation');
const { haversineDistance } = require('./utils/haversine');

// ML Cost Prediction
const { costPredictor } = require('./utils/costPrediction');

// Blockchain utilities
const Blockchain = require('./blockchain/Blockchain');
const blockchain = new Blockchain();

// Initialize blockchain
blockchain.initialize().then(() => {
    console.log('✅ Blockchain initialized');
    console.log(`Blockchain length: ${blockchain.getChain().length}`);
    console.log(`Is valid: ${blockchain.isChainValid()}`);
}).catch(err => {
    console.error('❌ Blockchain initialization failed:', err);
});

// Load ML cost prediction model
(async () => {
    try {
        const [models] = await db.promise().query(
            'SELECT coefficients, normalization FROM ml_models WHERE model_name = ? AND is_active = 1',
            ['cost_predictor']
        );
        if (models && models.length > 0) {
            costPredictor.loadModel({
                coefficients: models[0].coefficients,
                normalization: models[0].normalization
            });
            console.log('✅ Cost prediction model loaded');
        } else {
            console.log('⚠️  No trained cost model found. Using default coefficients.');
        }
    } catch (err) {
        console.log('⚠️  Could not load cost model:', err.message);
    }
})();

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session configuration
app.use(session({
    secret: 'delivery-partner-secret-key-2026',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        secure: false // Set to true if using HTTPS
    }
}));

// Make user available in all templates
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});
// ==================== AUTHENTICATION MIDDLEWARE ====================
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).render('errors/401');
    }
    next();
};

const requireAdmin = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).render('errors/401');
    }
    // Admin can access everything, others need to be ADMIN
    if (req.session.user.user_type === 'ADMIN') {
        return next();
    }
    return res.status(403).render('errors/403', { userType: 'Admin' });
};

const requireDriver = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).render('errors/401');
    }
    // Admin can access everything
    if (req.session.user.user_type === 'ADMIN' || req.session.user.user_type === 'DRIVER') {
        return next();
    }
    return res.status(403).render('errors/403', { userType: 'Driver' });
};

const requireProducer = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).render('errors/401');
    }
    // Admin can access everything
    if (req.session.user.user_type === 'ADMIN' || req.session.user.user_type === 'PRODUCER') {
        return next();
    }
    return res.status(403).render('errors/403', { userType: 'Producer' });
};

const requireDriverOrAdmin = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).render('errors/401');
    }
    if (req.session.user.user_type === 'ADMIN' || req.session.user.user_type === 'DRIVER') {
        return next();
    }
    return res.status(403).render('errors/403', { userType: 'Driver/Admin' });
};

const requireProducerOrAdmin = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).render('errors/401');
    }
    if (req.session.user.user_type === 'ADMIN' || req.session.user.user_type === 'PRODUCER') {
        return next();
    }
    return res.status(403).render('errors/403', { userType: 'Producer/Admin' });
};

// ==================== AUTHENTICATION ROUTES ====================
app.get('/auth/login', (req, resp) => {
    if (req.session.user) {
        return resp.redirect('/');
    }
    resp.render('auth/login', { error: null });
});

app.post('/auth/login', async (req, resp) => {
    const { email, user_type, password } = req.body;
    
    try {
        const promisePool = db.promise();
        const [users] = await promisePool.query(
            'SELECT * FROM users WHERE email = ? AND user_type = ? AND is_active = 1',
            [email, user_type]
        );
        
        if (users.length === 0) {
            return resp.render('auth/login', { 
                error: 'Invalid credentials or user type. Please check your email and user type.' 
            });
        }
        
        const user = users[0];
        
        // Password validation based on user type
        let isPasswordValid = false;
        
        if (user.user_type === 'DRIVER') {
            // For drivers: password is "driver"
            isPasswordValid = password === 'driver';
        } else if (user.user_type === 'PRODUCER') {
            // For producers: password is "producer"
            isPasswordValid = password === 'producer';
        } else if (user.user_type === 'ADMIN') {
            // For admin: password is the email
            isPasswordValid = password === user.email;
        }
        
        if (!isPasswordValid) {
            return resp.render('auth/login', { 
                error: 'Invalid password. Please try again.' 
            });
        }
        
        // Update last login
        await promisePool.query(
            'UPDATE users SET last_login = NOW() WHERE user_id = ?',
            [user.user_id]
        );
        
        // Store user in session
        req.session.user = {
            user_id: user.user_id,
            name: user.name,
            email: user.email,
            user_type: user.user_type,
            reference_id: user.reference_id
        };
        
        // Redirect based on user type
        if (user.user_type === 'ADMIN') {
            return resp.redirect('/');
        } else if (user.user_type === 'DRIVER') {
            return resp.redirect(`/container/${user.reference_id}/routing`);
        } else if (user.user_type === 'PRODUCER') {
            return resp.redirect(`/producer/${user.reference_id}/inventory`);
        }
        
        resp.redirect('/');
    } catch (err) {
        console.error('Login error:', err);
        resp.render('auth/login', { error: 'An error occurred. Please try again.' });
    }
});

app.get('/auth/logout', (req, resp) => {
    req.session.destroy();
    resp.redirect('/');
});

app.get('/auth/register/driver', (req, resp) => {
    resp.render('auth/register-driver', { error: null, success: null });
});

app.post('/auth/register/driver', async (req, resp) => {
    const { driver_name, email, driver_phone, container_code, total_sections, cost_per_section, current_latitude, current_longitude } = req.body;
    
    try {
        const promisePool = db.promise();
        
        // Check if email already exists
        const [existing] = await promisePool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        
        if (existing.length > 0) {
            return resp.render('auth/register-driver', { 
                error: 'Email already registered. Please use a different email or login.', 
                success: null 
            });
        }
        
        // Insert container
        const [containerResult] = await promisePool.query(
            `INSERT INTO containers (driver_name, driver_phone, container_code, total_sections, available_sections, cost_per_section, current_latitude, current_longitude, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'IDLE')`,
            [driver_name, driver_phone, container_code, total_sections, total_sections, cost_per_section, current_latitude, current_longitude]
        );
        
        const container_id = containerResult.insertId;
        
        // Insert user
        await promisePool.query(
            'INSERT INTO users (name, email, user_type, reference_id) VALUES (?, ?, ?, ?)',
            [driver_name, email, 'DRIVER', container_id]
        );
        
        resp.render('auth/register-driver', { 
            error: null, 
            success: `Registration successful! You can now login with email: ${email}` 
        });
    } catch (err) {
        console.error('Driver registration error:', err);
        resp.render('auth/register-driver', { 
            error: 'Registration failed. Please try again.', 
            success: null 
        });
    }
});

app.get('/auth/register/producer', (req, resp) => {
    resp.render('auth/register-producer', { error: null, success: null });
});

app.post('/auth/register/producer', async (req, resp) => {
    const { producer_name, email, phone, inventory_latitude, inventory_longitude } = req.body;
    
    try {
        const promisePool = db.promise();
        
        // Check if email already exists
        const [existing] = await promisePool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        
        if (existing.length > 0) {
            return resp.render('auth/register-producer', { 
                error: 'Email already registered. Please use a different email or login.', 
                success: null 
            });
        }
        
        // Insert producer
        const [producerResult] = await promisePool.query(
            `INSERT INTO producers (producer_name, phone, inventory_latitude, inventory_longitude)
             VALUES (?, ?, ?, ?)`,
            [producer_name, phone, inventory_latitude, inventory_longitude]
        );
        
        const producer_id = producerResult.insertId;
        
        // Insert user
        await promisePool.query(
            'INSERT INTO users (name, email, user_type, reference_id) VALUES (?, ?, ?, ?)',
            [producer_name, email, 'PRODUCER', producer_id]
        );
        
        resp.render('auth/register-producer', { 
            error: null, 
            success: `Registration successful! You can now login with email: ${email}` 
        });
    } catch (err) {
        console.error('Producer registration error:', err);
        resp.render('auth/register-producer', { 
            error: 'Registration failed. Please try again.', 
            success: null 
        });
    }
});

// ==================== PUBLIC ROUTES ====================
app.get('/', (req, resp)=>{
    resp.render('index')
})
//producers
app.get('/allProducers', requireProducerOrAdmin, (req, resp)=>{
    const sql = `SELECT * FROM producers`;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('DB select error:', err);
            return resp.status(500).send('Database error');
        }
        // Render list view with producers data
        return resp.render('producer/listProducers', { producers: results });
    });
})

app.get('/addProducers', requireProducerOrAdmin, (req, resp)=>{
    resp.render('producer/addProducer')
})
// Form posts to /producer/register (see views/producer/addProducer.ejs)
app.post('/producer/register', requireProducerOrAdmin, (req, resp) => {
    const { producer_name, email, phone, inventory_latitude, inventory_longitude } = req.body;

    // Create producer and a matching inventory record in a transaction
    db.getConnection((connErr, connection) => {
        if (connErr) {
            console.error('DB connection error:', connErr);
            return resp.status(500).send('Database connection error');
        }

        connection.beginTransaction(txErr => {
            if (txErr) {
                connection.release();
                console.error('Transaction begin error:', txErr);
                return resp.status(500).send('Database transaction error');
            }

            const insertProducerSql = `INSERT INTO producers (producer_name, email, phone, inventory_latitude, inventory_longitude) VALUES (?, ?, ?, ?, ?)`;
            const producerValues = [producer_name, email, phone, inventory_latitude, inventory_longitude];

            connection.query(insertProducerSql, producerValues, (insErr, insResult) => {
                if (insErr) {
                    return connection.rollback(() => {
                        connection.release();
                        console.error('Insert producer error:', insErr);
                        return resp.status(500).send('Failed to create producer');
                    });
                }

                const producerId = insResult.insertId;

                // Insert an inventory record for this producer using same lat/lng
                const insertInventorySql = `INSERT INTO inventory (producer_id, item_name, available_quantity, inventory_latitude, inventory_longitude, destination_latitude, destination_longitude) VALUES (?, ?, ?, ?, ?, ?, ?)`;
                // set default destination same as producer location
                const inventoryValues = [producerId, 'Initial inventory', 0, inventory_latitude, inventory_longitude, inventory_latitude, inventory_longitude];

                connection.query(insertInventorySql, inventoryValues, (invErr) => {
                    if (invErr) {
                        return connection.rollback(() => {
                            connection.release();
                            console.error('Insert inventory error:', invErr);
                            return resp.status(500).send('Failed to create inventory');
                        });
                    }

                    connection.commit(commitErr => {
                        if (commitErr) {
                            return connection.rollback(() => {
                                connection.release();
                                console.error('Commit error:', commitErr);
                                return resp.status(500).send('Database commit error');
                            });
                        }

                        connection.release();
                        return resp.redirect('/allProducers');
                    });
                });
            });
        });
    });
});

// Backwards-compatible endpoint if you prefer posting to /addProducers
app.post('/addProducers', (req, resp) => {
    // Forward to the canonical handler
    req.url = '/producer/register';
    app.handle(req, resp);
});



// View inventory of a producer (lowercase route used by views)
app.get('/producer/:producer_id/inventory', requireProducerOrAdmin, (req, resp) => {
    const producerId = req.params.producer_id;

    const getProducerSql = `SELECT * FROM producers WHERE producer_id = ? LIMIT 1`;
    db.query(getProducerSql, [producerId], (pErr, pRows) => {
        if (pErr) {
            console.error('DB select producer error:', pErr);
            return resp.status(500).send('Database error');
        }

        if (!pRows || pRows.length === 0) {
            return resp.status(404).send('Producer not found');
        }

        const producer = pRows[0];

        const getInventorySql = `SELECT * FROM inventory WHERE producer_id = ?`;
        db.query(getInventorySql, [producerId], (iErr, iRows) => {
            if (iErr) {
                console.error('DB select inventory error:', iErr);
                return resp.status(500).send('Database error');
            }

            return resp.render('producer/inventory', { producer, inventory: iRows });
        });
    });
});

// Keep a case-insensitive fallback for older links (redirect to lowercase)
app.get('/producer/:producer_id/Inventory', (req, resp) => {
    resp.redirect(`/producer/${req.params.producer_id}/inventory`);
});

// Add package/item to a producer's inventory (lowercase route)
const addInventoryHandler = (req, resp) => {
    const producerId = req.params.producer_id;
    const { item_name, available_quantity, inventory_latitude, inventory_longitude, max_delivery_time } = req.body;

    if (!item_name) return resp.status(400).send('item_name is required');
    const qty = Number(available_quantity) || 0;

    // accept destination lat/lng if provided; otherwise keep NULL
    const { destination_latitude, destination_longitude } = req.body;
    const insertSql = `INSERT INTO inventory (producer_id, item_name, available_quantity, inventory_latitude, inventory_longitude, destination_latitude, destination_longitude, max_delivery_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [producerId, item_name, qty, inventory_latitude || null, inventory_longitude || null, destination_latitude || null, destination_longitude || null, max_delivery_time || null];

    db.query(insertSql, values, (err) => {
        if (err) {
            console.error('Insert inventory item error:', err);
            return resp.status(500).send('Database error');
        }
        return resp.redirect(`/producer/${producerId}/inventory`);
    });
};

app.post('/producer/:producer_id/inventory', addInventoryHandler);
// Keep uppercase variant for compatibility
app.post('/producer/:producer_id/Inventory', addInventoryHandler);

app.get('/allPackages', requireAdmin, (req, resp)=>{
    const sql = `SELECT i.inventory_id, i.producer_id, i.item_name, i.available_quantity,
        -- origin: inventory coordinates if present, otherwise producer coordinates
        COALESCE(i.inventory_latitude, p.inventory_latitude) AS origin_latitude,
        COALESCE(i.inventory_longitude, p.inventory_longitude) AS origin_longitude,
        i.destination_latitude, i.destination_longitude, i.last_updated, p.producer_name,
        p.inventory_latitude AS producer_latitude, p.inventory_longitude AS producer_longitude
        FROM inventory i
        JOIN producers p ON i.producer_id = p.producer_id
        ORDER BY i.inventory_id DESC`;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('DB select packages error:', err);
            return resp.status(500).send('Database error');
        }
        return resp.render('packages/listPackages', { packages: results });
    });
})

//containers
app.get('/addContainers', requireDriverOrAdmin, (req, resp) => {
    // Render a form to create a container
    return resp.render('containers/addContainer');
});

app.post('/addContainers', requireDriverOrAdmin, (req, resp) => {
    const {
        container_code,
        driver_name,
        driver_phone,
        section_storage_space,
        total_sections,
        available_sections,
        current_latitude,
        current_longitude
    } = req.body;

    /* ---------- Validation ---------- */

    if (!container_code || container_code.trim() === '') {
        return resp.status(400).send('container_code is required');
    }

    if (!driver_phone || driver_phone.trim() === '') {
        return resp.status(400).send('driver_phone is required');
    }

    const total = parseInt(total_sections, 10);
    const avail = parseInt(available_sections, 10);
    const lat = parseFloat(current_latitude);
    const lng = parseFloat(current_longitude);
    const sectionSpace = parseInt(section_storage_space, 10);

    if (isNaN(total) || total <= 0)
        return resp.status(400).send('total_sections must be > 0');

    if (isNaN(avail) || avail < 0)
        return resp.status(400).send('available_sections must be >= 0');

    if (avail > total)
        return resp.status(400).send('available_sections cannot exceed total_sections');

    if (isNaN(sectionSpace) || sectionSpace <= 0)
        return resp.status(400).send('section_storage_space must be > 0');

    if (isNaN(lat) || isNaN(lng))
        return resp.status(400).send('Valid latitude and longitude required');
    
    // Set default base cost (will be overridden by ML predictions for actual transactions)
    const cost = 0.00;

    /* ---------- INSERT (MATCHES SCHEMA) ---------- */

    const sql = `
        INSERT INTO containers
        (
            container_code,
            driver_name,
            driver_phone,
            section_storage_space,
            total_sections,
            available_sections,
            cost_per_section,
            current_latitude,
            current_longitude
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        container_code.trim(),
        driver_name || '',
        driver_phone.trim(),
        sectionSpace,
        total,
        avail,
        cost,
        lat,
        lng
    ];

    db.query(sql, values, (err) => {
        if (err) {
            console.error('Insert container error:', err);
            return resp.status(500).send(err.sqlMessage);
        }

        return resp.redirect('/');
    });
});

app.get('/allContainers', requireDriverOrAdmin, (req, resp)=>{
    const sql = `SELECT * FROM containers ORDER BY container_id DESC`;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('DB select containers error:', err);
            return resp.status(500).send('Database error');
        }

        // Render a list + map view for containers
        return resp.render('containers/listContainers', { containers: results });
    });
})


// Container dashboard view
app.get('/container/:container_id', requireDriverOrAdmin, (req, resp) => {
    const containerId = req.params.container_id;
    const sql = `SELECT * FROM containers WHERE container_id = ? LIMIT 1`;
    db.query(sql, [containerId], (err, rows) => {
        if (err) {
            console.error('DB select container error:', err);
            return resp.status(500).send('Database error');
        }

        if (!rows || rows.length === 0) {
            return resp.status(404).send('Container not found');
        }

        const container = rows[0];

        // Render dashboard view (shows details + map marker)
        return resp.render('containers/containerDashboard', { container });
    });
});













// ========== NEW ROUTING SYSTEM API ROUTES ==========

// 1. Container Routing Dashboard (priority queue view)
app.get('/container/:container_id/routing', requireDriverOrAdmin, async (req, resp) => {
    const containerId = req.params.container_id;
    
    try {
        // Get container details
        const [container] = await db.promise().query(
            'SELECT * FROM containers WHERE container_id = ?',
            [containerId]
        );
        
        if (!container || container.length === 0) {
            return resp.status(404).send('Container not found');
        }
        
        // Get active route for this container
        const [routes] = await db.promise().query(
            `SELECT * FROM routes 
             WHERE container_id = ? AND route_status IN ('PLANNED', 'ACTIVE') 
             ORDER BY created_at DESC LIMIT 1`,
            [containerId]
        );
        
        let tasks = [];
        let route = null;
        
        if (routes && routes.length > 0) {
            route = routes[0];
            
            // Get tasks for this route with node details
            const [taskRows] = await db.promise().query(
                `SELECT rt.*, ln.latitude, ln.longitude, ln.node_type, 
                        p.package_id, p.status as package_status,
                        CASE 
                            WHEN ln.node_type = 'PRODUCER' THEN prod.producer_name
                            WHEN ln.node_type = 'DESTINATION' THEN dest.destination_name
                            ELSE 'Depot'
                        END as location_name
                 FROM route_tasks rt
                 JOIN location_nodes ln ON rt.node_id = ln.node_id
                 LEFT JOIN packages p ON rt.package_id = p.package_id
                 LEFT JOIN producers prod ON (ln.node_type = 'PRODUCER' AND ln.reference_id = prod.producer_id)
                 LEFT JOIN destinations dest ON (ln.node_type = 'DESTINATION' AND ln.reference_id = dest.destination_id)
                 WHERE rt.route_id = ?
                 ORDER BY rt.priority_order ASC`,
                [route.route_id]
            );
            
            tasks = taskRows;
        }
        
        return resp.render('routing/containerRoutingDashboard', {
            container: container[0],
            route,
            tasks
        });
        
    } catch (err) {
        console.error('Error loading routing dashboard:', err);
        return resp.status(500).send('Database error');
    }
});

// 2. Create Route (using A* or Dijkstra)
app.post('/container/:container_id/create-route', requireDriverOrAdmin, async (req, resp) => {
    const containerId = req.params.container_id;
    const { algorithm } = req.body; // 'A_STAR' or 'DIJKSTRA'
    
    const conn = await db.promise().getConnection();
    
    try {
        await conn.beginTransaction();
        
        // Get container details
        const [containers] = await conn.query(
            'SELECT * FROM containers WHERE container_id = ?',
            [containerId]
        );
        
        if (!containers || containers.length === 0) {
            throw new Error('Container not found');
        }
        
        const container = containers[0];
        const availableSections = container.available_sections || 0;
        
        if (availableSections <= 0) {
            throw new Error('No available sections in container');
        }
        
        // Get available packages with producer info
        const [packages] = await conn.query(
            `SELECT p.*, pr.producer_id, pr.producer_name, pr.inventory_latitude as lat, pr.inventory_longitude as lng,
                    d.destination_id, d.latitude as dest_lat, d.longitude as dest_lng
             FROM packages p
             JOIN producers pr ON p.producer_id = pr.producer_id
             JOIN destinations d ON p.destination_id = d.destination_id
             WHERE p.status = 'AVAILABLE'`
        );
        
        if (!packages || packages.length === 0) {
            throw new Error('No available packages to route');
        }
        
        // Group packages by producer
        const producerMap = {};
        packages.forEach(pkg => {
            if (!producerMap[pkg.producer_id]) {
                producerMap[pkg.producer_id] = {
                    producer_id: pkg.producer_id,
                    lat: pkg.lat,
                    lng: pkg.lng,
                    package_count: 0,
                    required_sections: 0,
                    packages: []
                };
            }
            producerMap[pkg.producer_id].package_count++;
            producerMap[pkg.producer_id].required_sections += (pkg.required_sections || 1);
            producerMap[pkg.producer_id].packages.push(pkg);
        });
        
        const producers = Object.values(producerMap);
        
        // Greedy producer selection - but we'll select individual packages, not entire producers
        const containerLocation = {
            lat: container.current_latitude,
            lng: container.current_longitude
        };
        
        // Flatten all packages and calculate efficiency
        const allPackagesWithEfficiency = [];
        for (let producerId in producerMap) {
            const producer = producerMap[producerId];
            const distance = require('./utils/haversine').haversineDistance(
                containerLocation.lat,
                containerLocation.lng,
                producer.lat,
                producer.lng
            );
            
            for (let pkg of producer.packages) {
                allPackagesWithEfficiency.push({
                    ...pkg,
                    producer_lat: producer.lat,
                    producer_lng: producer.lng,
                    distance,
                    efficiency: distance > 0 ? 1 / distance : 1000 // closer = higher efficiency
                });
            }
        }
        
        // Sort by efficiency (higher is better - closer packages first)
        allPackagesWithEfficiency.sort((a, b) => b.efficiency - a.efficiency);
        
        // Greedy selection until capacity is full
        const selectedPackages = [];
        let usedSections = 0;
        
        for (let pkg of allPackagesWithEfficiency) {
            const pkgSections = pkg.required_sections || 1;
            if (usedSections + pkgSections <= availableSections) {
                selectedPackages.push(pkg);
                usedSections += pkgSections;
            }
            if (usedSections >= availableSections) break;
        }
        
        if (selectedPackages.length === 0) {
            throw new Error('No packages selected within capacity');
        }
        
        // Create route
        const [routeResult] = await conn.query(
            `INSERT INTO routes (container_id, algorithm_used, route_status) VALUES (?, ?, 'PLANNED')`,
            [containerId, algorithm || 'A_STAR']
        );
        
        const routeId = routeResult.insertId;
        
        // Collect all tasks (PICKUP and DELIVERY pairs) with location info
        const allTasks = [];
        let currentCapacity = 0;
        
        for (let pkg of selectedPackages) {
            // Ensure producer location node exists
            const [nodeCheck] = await conn.query(
                `SELECT node_id FROM location_nodes WHERE node_type = 'PRODUCER' AND reference_id = ?`,
                [pkg.producer_id]
            );
            
            let nodeId;
            if (nodeCheck.length === 0) {
                const [nodeResult] = await conn.query(
                    `INSERT INTO location_nodes (node_type, reference_id, latitude, longitude) VALUES ('PRODUCER', ?, ?, ?)`,
                    [pkg.producer_id, pkg.producer_lat, pkg.producer_lng]
                );
                nodeId = nodeResult.insertId;
            } else {
                nodeId = nodeCheck[0].node_id;
            }
            
            // Ensure destination node exists
            const [destNodeCheck] = await conn.query(
                `SELECT node_id FROM location_nodes WHERE node_type = 'DESTINATION' AND reference_id = ?`,
                [pkg.destination_id]
            );
            
            let destNodeId;
            if (destNodeCheck.length === 0) {
                const [destNodeResult] = await conn.query(
                    `INSERT INTO location_nodes (node_type, reference_id, latitude, longitude) VALUES ('DESTINATION', ?, ?, ?)`,
                    [pkg.destination_id, pkg.dest_lat, pkg.dest_lng]
                );
                destNodeId = destNodeResult.insertId;
            } else {
                destNodeId = destNodeCheck[0].node_id;
            }
            
            // Add PICKUP task
            allTasks.push({
                task_type: 'PICKUP',
                node_id: nodeId,
                package_id: pkg.package_id,
                latitude: pkg.producer_lat,
                longitude: pkg.producer_lng,
                required_sections: pkg.required_sections || 1,
                deadline: pkg.max_delivery_time
            });
            
            // Add DELIVERY task
            allTasks.push({
                task_type: 'DELIVERY',
                node_id: destNodeId,
                package_id: pkg.package_id,
                latitude: pkg.dest_lat,
                longitude: pkg.dest_lng,
                required_sections: pkg.required_sections || 1,
                deadline: pkg.max_delivery_time
            });
            
            // Update package status
            await conn.query(
                `UPDATE packages SET status = 'REQUESTED' WHERE package_id = ?`,
                [pkg.package_id]
            );
        }
        
        // Smart ordering: Use capacity-aware priority calculation
        const containerCapacity = {
            total_sections: container.total_sections || 0,
            used_sections: 0, // Starting empty
            available_sections: availableSections
        };
        
        const tasksWithCoords = allTasks.map(t => ({
            ...t,
            node_coords: { lat: t.latitude, lng: t.longitude }
        }));
        
        // Calculate priorities considering container will fill up
        const orderedTasks = [];
        const remainingTasks = [...tasksWithCoords];
        
        while (remainingTasks.length > 0) {
            // Recalculate priorities based on current capacity
            const prioritizedTasks = recalculatePriorities(remainingTasks, containerLocation, containerCapacity);
            
            // Take the highest priority task
            const nextTask = prioritizedTasks[0];
            orderedTasks.push(nextTask);
            
            // Update simulated capacity
            if (nextTask.task_type === 'PICKUP') {
                containerCapacity.used_sections += nextTask.required_sections;
                containerCapacity.available_sections -= nextTask.required_sections;
            } else if (nextTask.task_type === 'DELIVERY') {
                containerCapacity.used_sections -= nextTask.required_sections;
                containerCapacity.available_sections += nextTask.required_sections;
            }
            
            // Remove from remaining
            const taskIndex = remainingTasks.findIndex(t => 
                t.package_id === nextTask.package_id && t.task_type === nextTask.task_type
            );
            if (taskIndex >= 0) {
                remainingTasks.splice(taskIndex, 1);
            }
        }
        
        // Insert tasks in calculated priority order
        let priorityOrder = 1;
        for (let task of orderedTasks) {
            await conn.query(
                `INSERT INTO route_tasks (route_id, task_type, node_id, package_id, priority_order, task_status) 
                 VALUES (?, ?, ?, ?, ?, 'PENDING')`,
                [routeId, task.task_type, task.node_id, task.package_id, priorityOrder++]
            );
        }
        
        // Update container status
        await conn.query(
            `UPDATE containers SET status = 'ACTIVE' WHERE container_id = ?`,
            [containerId]
        );
        
        await conn.commit();
        
        return resp.redirect(`/container/${containerId}/routing`);
        
    } catch (err) {
        await conn.rollback();
        console.error('Error creating route:', err);
        return resp.status(500).send(err.message);
    } finally {
        conn.release();
    }
});

// 3. Start Task (GO button - only for top priority)
app.post('/task/:task_id/start', requireDriverOrAdmin, async (req, resp) => {
    const taskId = req.params.task_id;
    
    const conn = await db.promise().getConnection();
    
    try {
        await conn.beginTransaction();
        
        // Get task details
        const [tasks] = await conn.query(
            `SELECT rt.*, r.container_id, r.route_id
             FROM route_tasks rt
             JOIN routes r ON rt.route_id = r.route_id
             WHERE rt.task_id = ?`,
            [taskId]
        );
        
        if (!tasks || tasks.length === 0) {
            throw new Error('Task not found');
        }
        
        const task = tasks[0];
        
        // Verify this is the top priority pending task
        const [topTask] = await conn.query(
            `SELECT task_id FROM route_tasks 
             WHERE route_id = ? AND task_status = 'PENDING' 
             ORDER BY priority_order ASC LIMIT 1`,
            [task.route_id]
        );
        
        if (!topTask || topTask.length === 0 || topTask[0].task_id != taskId) {
            throw new Error('Only top priority task can be started');
        }
        
        // Update task status
        await conn.query(
            `UPDATE route_tasks SET task_status = 'IN_PROGRESS' WHERE task_id = ?`,
            [taskId]
        );
        
        // Get package and location details for cost calculation
        const [packageDetails] = await conn.query(
            `SELECT p.*, pr.producer_name, pr.inventory_latitude as producer_lat, pr.inventory_longitude as producer_lng,
                    d.latitude as dest_lat, d.longitude as dest_lng,
                    ln.latitude as node_lat, ln.longitude as node_lng,
                    c.current_latitude as container_lat, c.current_longitude as container_lng
             FROM packages p
             JOIN producers pr ON p.producer_id = pr.producer_id
             JOIN destinations d ON p.destination_id = d.destination_id
             JOIN route_tasks rt ON rt.package_id = p.package_id AND rt.task_id = ?
             JOIN location_nodes ln ON rt.node_id = ln.node_id
             JOIN routes r ON rt.route_id = r.route_id
             JOIN containers c ON r.container_id = c.container_id`,
            [taskId]
        );
        
        const pkg = packageDetails[0];
        const avgSpeed = 60; // km/h
        
        // Calculate distance from producer to destination (for total cost)
        const { haversineDistance } = require('./utils/haversine');
        const distanceKm = haversineDistance(
            pkg.producer_lat,
            pkg.producer_lng,
            pkg.dest_lat,
            pkg.dest_lng
        );
        
        // Get current demand (active routes)
        const [demandResult] = await conn.query(
            'SELECT COUNT(DISTINCT route_id) as demand FROM route_tasks WHERE task_status IN ("PENDING", "IN_PROGRESS")'
        );
        const currentDemand = demandResult[0]?.demand || 0;
        
        // Predict cost using ML model
        const costPerSection = costPredictor.predict({
            distance_km: distanceKm,
            deadline: pkg.deadline,
            current_demand: currentDemand
        });
        
        // Calculate estimated delivery time based on task type
        let estimatedDeliveryTime = new Date();
        
        if (task.task_type === 'PICKUP') {
            // For PICKUP: travel time from container's current location to producer
            const distanceToProducer = haversineDistance(
                pkg.container_lat,
                pkg.container_lng,
                pkg.producer_lat,
                pkg.producer_lng
            );
            const travelHours = distanceToProducer / avgSpeed;
            estimatedDeliveryTime.setHours(estimatedDeliveryTime.getHours() + travelHours);
        } else {
            // For DELIVERY: Get the PICKUP completion time and add travel from producer to destination
            const [pickupTx] = await conn.query(
                `SELECT t.completed_at FROM transactions t
                 JOIN route_tasks rt ON t.task_id = rt.task_id
                 WHERE rt.package_id = ? AND rt.task_type = 'PICKUP' AND t.transaction_status = 'COMPLETED'`,
                [pkg.package_id]
            );
            
            if (pickupTx && pickupTx.length > 0 && pickupTx[0].completed_at) {
                // Start from pickup completion time
                estimatedDeliveryTime = new Date(pickupTx[0].completed_at);
            }
            
            // Add travel time from producer to destination
            const travelHours = distanceKm / avgSpeed;
            estimatedDeliveryTime.setHours(estimatedDeliveryTime.getHours() + travelHours);
        }
        
        // Add buffer time (10% of travel time) to ensure estimated < actual
        const bufferHours = (estimatedDeliveryTime - new Date()) / (1000 * 60 * 60) * 0.1;
        estimatedDeliveryTime.setMinutes(estimatedDeliveryTime.getMinutes() + bufferHours * 60);
        
        // Create transaction request with cost details
        await conn.query(
            `INSERT INTO transactions (task_id, container_id, package_id, transaction_type, transaction_status, cost_per_section, distance_km, estimated_delivery_time) 
             VALUES (?, ?, ?, ?, 'REQUESTED', ?, ?, ?)`,
            [taskId, task.container_id, task.package_id, task.task_type === 'PICKUP' ? 'LOAD' : 'DELIVER', costPerSection, distanceKm, estimatedDeliveryTime]
        );
        
        await conn.commit();
        
        return resp.redirect(`/task/${taskId}/transaction`);
        
    } catch (err) {
        await conn.rollback();
        console.error('Error starting task:', err);
        return resp.status(500).send(err.message);
    } finally {
        conn.release();
    }
});

// 4. Transaction Form (LOAD or DELIVER)
app.get('/task/:task_id/transaction', requireDriverOrAdmin, async (req, resp) => {
    const taskId = req.params.task_id;
    
    try {
        const [tasks] = await db.promise().query(
            `SELECT rt.*, r.container_id, ln.latitude, ln.longitude, ln.node_type,
                    p.package_id, p.package_code, p.required_sections,
                    c.available_sections, c.used_sections,
                    t.transaction_id, t.transaction_type, t.transaction_status
             FROM route_tasks rt
             JOIN routes r ON rt.route_id = r.route_id
             JOIN location_nodes ln ON rt.node_id = ln.node_id
             JOIN containers c ON r.container_id = c.container_id
             LEFT JOIN packages p ON rt.package_id = p.package_id
             LEFT JOIN transactions t ON rt.task_id = t.task_id
             WHERE rt.task_id = ?`,
            [taskId]
        );
        
        if (!tasks || tasks.length === 0) {
            return resp.status(404).send('Task not found');
        }
        
        const task = tasks[0];
        
        return resp.render('routing/transactionForm', { task });
        
    } catch (err) {
        console.error('Error loading transaction form:', err);
        return resp.status(500).send('Database error');
    }
});

// 5. Complete Transaction (APPROVE & COMPLETE)
app.post('/transaction/:transaction_id/complete', requireDriverOrAdmin, async (req, resp) => {
    const transactionId = req.params.transaction_id;
    const { sections_used } = req.body;
    
    const conn = await db.promise().getConnection();
    
    try {
        await conn.beginTransaction();
        
        // Get transaction details
        const [transactions] = await conn.query(
            `SELECT t.*, rt.route_id, rt.task_id, rt.package_id, r.container_id
             FROM transactions t
             JOIN route_tasks rt ON t.task_id = rt.task_id
             JOIN routes r ON rt.route_id = r.route_id
             WHERE t.transaction_id = ?`,
            [transactionId]
        );
        
        if (!transactions || transactions.length === 0) {
            throw new Error('Transaction not found');
        }
        
        const transaction = transactions[0];
        
        if (transaction.transaction_type === 'LOAD') {
            // PICKUP: Update container capacity
            await conn.query(
                `UPDATE containers 
                 SET used_sections = used_sections + ?, 
                     available_sections = available_sections - ?
                 WHERE container_id = ?`,
                [sections_used || 1, sections_used || 1, transaction.container_id]
            );
            
            // Update package status
            await conn.query(
                `UPDATE packages SET status = 'LOADED' WHERE package_id = ?`,
                [transaction.package_id]
            );
            
            // Deduct inventory (if needed - assuming inventory table tracks this)
            
        } else if (transaction.transaction_type === 'DELIVER') {
            // DELIVERY: Free up container capacity
            await conn.query(
                `UPDATE containers 
                 SET used_sections = used_sections - ?, 
                     available_sections = available_sections + ?
                 WHERE container_id = ?`,
                [sections_used || 1, sections_used || 1, transaction.container_id]
            );
            
            // Update package status
            await conn.query(
                `UPDATE packages SET status = 'DELIVERED' WHERE package_id = ?`,
                [transaction.package_id]
            );
        }
        
        // Calculate total cost: cost_per_section * sections_used * (days_of_travel / 4)
        // Days of travel = distance_km / (60 km/h * 24 hours/day)
        const [transDetails] = await conn.query(
            `SELECT cost_per_section, distance_km, estimated_delivery_time, created_at FROM transactions WHERE transaction_id = ?`,
            [transactionId]
        );
        
        const costPerSection = transDetails[0].cost_per_section || 100;
        const distanceKm = transDetails[0].distance_km || 0;
        const daysOfTravel = distanceKm / (60 * 24); // 60 km/h * 24 hours
        const totalCost = costPerSection * (sections_used || 1) * (daysOfTravel / 4);
        
        // Update transaction with cost and completion time
        await conn.query(
            `UPDATE transactions 
             SET transaction_status = 'COMPLETED', 
                 sections_used = ?,
                 total_cost = ?,
                 actual_delivery_time = NOW(),
                 approved_at = NOW(),
                 completed_at = NOW()
             WHERE transaction_id = ?`,
            [sections_used || 1, totalCost, transactionId]
        );
        
        // BLOCKCHAIN VALIDATION: Add completed transaction to blockchain
        console.log('📦 Adding transaction to blockchain...');
        const transactionData = {
            transaction_id: transactionId,
            task_id: transaction.task_id,
            container_id: transaction.container_id,
            package_id: transaction.package_id,
            transaction_type: transaction.transaction_type,
            sections_used: sections_used || 1,
            total_cost: totalCost,
            distance_km: distanceKm,
            timestamp: new Date().toISOString()
        };
        
        const blockchainResult = await blockchain.addBlock(transactionData);
        
        // Log blockchain result but don't block transaction completion
        if (blockchainResult.success) {
            console.log(`✅ Transaction validated and stored in block #${blockchainResult.block.index}`);
            console.log(`⛏️  Mining completed in ${blockchainResult.miningTime}ms`);
            
            // Store blockchain hash reference in transaction
            await conn.query(
                `UPDATE transactions SET blockchain_hash = ? WHERE transaction_id = ?`,
                [blockchainResult.block.hash, transactionId]
            );
        } else {
            console.warn('⚠️  Blockchain validation failed but transaction continues:', blockchainResult.error);
        }
        
        // Update task status
        await conn.query(
            `UPDATE route_tasks SET task_status = 'COMPLETED', completed_at = NOW() WHERE task_id = ?`,
            [transaction.task_id]
        );
        
        // Re-calculate priorities for remaining tasks
        const [remainingTasks] = await conn.query(
            `SELECT rt.*, ln.latitude, ln.longitude
             FROM route_tasks rt
             JOIN location_nodes ln ON rt.node_id = ln.node_id
             WHERE rt.route_id = ? AND rt.task_status = 'PENDING'
             ORDER BY rt.priority_order`,
            [transaction.route_id]
        );
        
        if (remainingTasks.length > 0) {
            // Get current container location and capacity
            const [container] = await conn.query(
                `SELECT current_latitude, current_longitude, total_sections, used_sections, available_sections FROM containers WHERE container_id = ?`,
                [transaction.container_id]
            );
            
            const currentLocation = {
                lat: container[0].current_latitude,
                lng: container[0].current_longitude
            };
            
            // Get container capacity info
            const containerCapacity = {
                total_sections: container[0].total_sections || 0,
                used_sections: container[0].used_sections || 0,
                available_sections: container[0].available_sections || 0
            };
            
            // Recalculate priorities
            const tasksWithCoords = remainingTasks.map(t => ({
                ...t,
                node_coords: { lat: t.latitude, lng: t.longitude }
            }));
            
            const recalculatedTasks = recalculatePriorities(tasksWithCoords, currentLocation, containerCapacity);
            
            // Update priority_order in DB
            for (let task of recalculatedTasks) {
                await conn.query(
                    `UPDATE route_tasks SET priority_order = ? WHERE task_id = ?`,
                    [task.priority_order, task.task_id]
                );
            }
        } else {
            // No more tasks - complete route
            await conn.query(
                `UPDATE routes SET route_status = 'COMPLETED', completed_at = NOW() WHERE route_id = ?`,
                [transaction.route_id]
            );
            
            await conn.query(
                `UPDATE containers SET status = 'idle' WHERE container_id = ?`,
                [transaction.container_id]
            );
        }
        
        await conn.commit();
        
        return resp.redirect(`/container/${transaction.container_id}/routing`);
        
    } catch (err) {
        await conn.rollback();
        console.error('Error completing transaction:', err);
        return resp.status(500).send(err.message);
    } finally {
        conn.release();
    }
});

// 6. Route Planning Page (select algorithm & create route)
app.get('/container/:container_id/plan-route', requireDriverOrAdmin, async (req, resp) => {
    const containerId = req.params.container_id;
    
    try {
        const [container] = await db.promise().query(
            'SELECT * FROM containers WHERE container_id = ?',
            [containerId]
        );
        
        if (!container || container.length === 0) {
            return resp.status(404).send('Container not found');
        }
        
        // Count available packages
        const [packageCount] = await db.promise().query(
            `SELECT COUNT(*) as count FROM packages WHERE status = 'AVAILABLE'`
        );
        
        return resp.render('routing/planRoute', {
            container: container[0],
            availablePackages: packageCount[0].count
        });
        
    } catch (err) {
        console.error('Error loading route planning page:', err);
        return resp.status(500).send('Database error');
    }
});

// ========== END NEW ROUTING SYSTEM ==========

// Producer Transactions View
app.get('/producer/:producer_id/transactions', requireProducerOrAdmin, async (req, resp) => {
    const producerId = req.params.producer_id;
    
    try {
        // Get producer details
        const [producers] = await db.promise().query(
            'SELECT * FROM producers WHERE producer_id = ?',
            [producerId]
        );
        
        if (!producers || producers.length === 0) {
            return resp.status(404).send('Producer not found');
        }
        
        const producer = producers[0];
        
        // Get all transactions for packages from this producer
        const [transactions] = await db.promise().query(
            `SELECT t.*, c.container_code, p.package_code
             FROM transactions t
             JOIN packages p ON t.package_id = p.package_id
             LEFT JOIN containers c ON t.container_id = c.container_id
             WHERE p.producer_id = ?
             ORDER BY t.created_at DESC`,
            [producerId]
        );
        
        return resp.render('producer/transactions', { producer, transactions });
        
    } catch (err) {
        console.error('Error loading transactions:', err);
        return resp.status(500).send('Database error');
    }
});

// Blockchain Viewer
app.get('/blockchain', requireAuth, async (req, resp) => {
    try {
        const chain = blockchain.getChain();
        const validationDetails = blockchain.getChainValidationDetails();
        
        return resp.render('blockchain/viewer', { 
            chain, 
            isValid: validationDetails.isValid, 
            invalidBlocks: validationDetails.invalidBlocks 
        });
        
    } catch (err) {
        console.error('Error loading blockchain:', err);
        return resp.status(500).send('Database error');
    }
});

// ==================== ML MODEL MANAGEMENT ROUTES ====================

// Get current model status and metrics
app.get('/api/ml/cost-model/status', requireAdmin, async (req, resp) => {
    try {
        const [models] = await db.promise().query(
            `SELECT model_name, model_type, metrics, trained_at, is_active 
             FROM ml_models 
             WHERE model_name = 'cost_predictor'`
        );
        
        if (!models || models.length === 0) {
            return resp.json({
                status: 'not_trained',
                message: 'No model found. Please train the model first.'
            });
        }
        
        const model = models[0];
        
        return resp.json({
            status: 'active',
            model_type: model.model_type,
            trained_at: model.trained_at,
            is_active: model.is_active,
            metrics: model.metrics,
            coefficients: costPredictor.coefficients
        });
        
    } catch (err) {
        console.error('Error fetching model status:', err);
        return resp.status(500).json({ error: err.message });
    }
});

// Retrain the cost prediction model
app.post('/api/ml/cost-model/train', requireAdmin, async (req, resp) => {
    try {
        const promisePool = db.promise();
        
        // Get active demand helper function
        async function getActiveDemandAtTime(timestamp) {
            const [result] = await promisePool.query(
                `SELECT COUNT(DISTINCT route_id) as demand
                 FROM route_tasks 
                 WHERE created_at <= ? 
                 AND task_status IN ('PENDING', 'IN_PROGRESS')`,
                [timestamp]
            );
            return result[0]?.demand || 0;
        }
        
        // Fetch historical transaction data
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
            return resp.status(400).json({
                error: 'Insufficient training data',
                message: `Need at least 10 completed transactions. Current: ${transactions.length}`,
                required: 10,
                current: transactions.length
            });
        }
        
        // Prepare training data
        const trainingData = [];
        for (let tx of transactions) {
            const demand = await getActiveDemandAtTime(tx.created_at);
            trainingData.push({
                distance_km: tx.distance_km,
                deadline: tx.deadline,
                current_demand: demand,
                timestamp: tx.created_at,
                actual_cost: tx.cost_per_section
            });
        }
        
        // Split data
        const splitIndex = Math.floor(trainingData.length * 0.8);
        const trainSet = trainingData.slice(0, splitIndex);
        const testSet = trainingData.slice(splitIndex);
        
        // Train the model
        const startTime = Date.now();
        const trained = costPredictor.train(trainSet);
        const trainingDuration = Math.round((Date.now() - startTime) / 1000);
        
        if (!trained) {
            return resp.status(500).json({ error: 'Training failed' });
        }
        
        // Evaluate on test set
        const metrics = costPredictor.evaluate(testSet);
        
        // Save model to database
        const modelData = costPredictor.exportModel();
        
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
        
        // Save training history
        await promisePool.query(`
            INSERT INTO model_training_history 
            (model_name, training_samples, test_samples, mae, rmse, r_squared, training_duration_seconds)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            'cost_predictor',
            trainSet.length,
            testSet.length,
            metrics.mae,
            metrics.rmse,
            metrics.r_squared,
            trainingDuration
        ]);
        
        return resp.json({
            success: true,
            message: 'Model trained successfully',
            training_data: {
                training_samples: trainSet.length,
                test_samples: testSet.length
            },
            metrics: metrics,
            coefficients: modelData.coefficients,
            training_duration_seconds: trainingDuration
        });
        
    } catch (err) {
        console.error('Error training model:', err);
        return resp.status(500).json({ error: err.message });
    }
});

// Test prediction with custom inputs
app.post('/api/ml/cost-model/predict', requireAuth, async (req, resp) => {
    try {
        const { distance_km, deadline_hours, current_demand } = req.body;
        
        if (!distance_km) {
            return resp.status(400).json({ error: 'distance_km is required' });
        }
        
        const deadline = deadline_hours ? 
            new Date(Date.now() + deadline_hours * 60 * 60 * 1000) : 
            new Date(Date.now() + 24 * 60 * 60 * 1000);
        
        const prediction = costPredictor.predict({
            distance_km: parseFloat(distance_km),
            deadline: deadline,
            current_demand: parseInt(current_demand) || 0
        });
        
        return resp.json({
            predicted_cost_per_section: prediction,
            input: {
                distance_km: parseFloat(distance_km),
                deadline_hours: deadline_hours || 24,
                current_demand: parseInt(current_demand) || 0
            }
        });
        
    } catch (err) {
        console.error('Error predicting cost:', err);
        return resp.status(500).json({ error: err.message });
    }
});

// Get training history
app.get('/api/ml/training-history', requireAdmin, async (req, resp) => {
    try {
        const [history] = await db.promise().query(
            `SELECT * FROM model_training_history 
             WHERE model_name = 'cost_predictor'
             ORDER BY trained_at DESC
             LIMIT 20`
        );
        
        return resp.json({
            history: history,
            total_trainings: history.length
        });
        
    } catch (err) {
        console.error('Error fetching training history:', err);
        return resp.status(500).json({ error: err.message });
    }
});

app.listen(PORT, ()=>{
    console.log(`App is running on port ${PORT}`)
})