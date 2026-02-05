// Create complete routing schema for priority-based container system
const pool = require('../config.db/db');

async function createRoutingSchema() {
  const conn = await pool.promise().getConnection();
  
  try {
    console.log('Creating routing schema tables...');

    // 1. location_nodes (graph nodes)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS location_nodes (
        node_id INT PRIMARY KEY AUTO_INCREMENT,
        node_type ENUM('PRODUCER','DESTINATION','DEPOT') NOT NULL,
        reference_id INT NOT NULL,
        latitude DECIMAL(10, 7) NOT NULL,
        longitude DECIMAL(10, 7) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_node_type (node_type),
        INDEX idx_reference (reference_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✓ location_nodes table created');

    // 2. distance_time_matrix (graph edges)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS distance_time_matrix (
        from_node_id INT NOT NULL,
        to_node_id INT NOT NULL,
        distance_km DECIMAL(8, 2) NOT NULL,
        travel_time_minutes INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (from_node_id, to_node_id),
        FOREIGN KEY (from_node_id) REFERENCES location_nodes(node_id),
        FOREIGN KEY (to_node_id) REFERENCES location_nodes(node_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✓ distance_time_matrix table created');

    // 3. routes
    await conn.query(`
      CREATE TABLE IF NOT EXISTS routes (
        route_id INT PRIMARY KEY AUTO_INCREMENT,
        container_id INT NOT NULL,
        algorithm_used ENUM('A_STAR','DIJKSTRA') NOT NULL,
        route_status ENUM('PLANNED','ACTIVE','COMPLETED') DEFAULT 'PLANNED',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        FOREIGN KEY (container_id) REFERENCES containers(container_id),
        INDEX idx_status (route_status),
        INDEX idx_container (container_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✓ routes table created');

    // 4. route_tasks (THE CORE PRIORITY QUEUE TABLE)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS route_tasks (
        task_id INT PRIMARY KEY AUTO_INCREMENT,
        route_id INT NOT NULL,
        task_type ENUM('PICKUP','DELIVERY') NOT NULL,
        node_id INT NOT NULL,
        package_id INT NULL,
        priority_order INT NOT NULL,
        task_status ENUM('PENDING','IN_PROGRESS','COMPLETED') DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        FOREIGN KEY (route_id) REFERENCES routes(route_id) ON DELETE CASCADE,
        FOREIGN KEY (node_id) REFERENCES location_nodes(node_id),
        FOREIGN KEY (package_id) REFERENCES packages(package_id),
        INDEX idx_route_priority (route_id, priority_order),
        INDEX idx_status (task_status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✓ route_tasks table created');

    // 5. transactions
    await conn.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        transaction_id INT PRIMARY KEY AUTO_INCREMENT,
        task_id INT NOT NULL,
        container_id INT NOT NULL,
        package_id INT NULL,
        transaction_type ENUM('LOAD','DELIVER') NOT NULL,
        transaction_status ENUM('REQUESTED','APPROVED','COMPLETED') DEFAULT 'REQUESTED',
        sections_used INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved_at TIMESTAMP NULL,
        completed_at TIMESTAMP NULL,
        FOREIGN KEY (task_id) REFERENCES route_tasks(task_id),
        FOREIGN KEY (container_id) REFERENCES containers(container_id),
        FOREIGN KEY (package_id) REFERENCES packages(package_id),
        INDEX idx_status (transaction_status),
        INDEX idx_container (container_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✓ transactions table created');

    // 6. Update packages table with new status enum
    await conn.query(`
      ALTER TABLE packages 
      MODIFY COLUMN status ENUM(
        'AVAILABLE','REQUESTED','APPROVED',
        'LOADED','IN_TRANSIT','DELIVERED'
      ) DEFAULT 'AVAILABLE';
    `);
    console.log('✓ packages status enum updated');

    // 7. Update containers table with status and current_node_id
    try {
      await conn.query(`
        ALTER TABLE containers 
        ADD COLUMN status ENUM('IDLE','ACTIVE') DEFAULT 'IDLE';
      `);
      console.log('✓ containers status column added');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ containers status column already exists');
      } else throw err;
    }
    
    try {
      await conn.query(`
        ALTER TABLE containers 
        ADD COLUMN current_node_id INT NULL;
      `);
      console.log('✓ containers current_node_id column added');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ containers current_node_id column already exists');
      } else throw err;
    }
    
    try {
      await conn.query(`
        ALTER TABLE containers 
        ADD COLUMN used_sections INT DEFAULT 0;
      `);
      console.log('✓ containers used_sections column added');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ containers used_sections column already exists');
      } else throw err;
    }

    console.log('\n✅ All routing schema tables created successfully!');
  } catch (err) {
    console.error('❌ Error creating routing schema:', err.message);
    throw err;
  } finally {
    conn.release();
  }
}

createRoutingSchema()
  .then(() => {
    console.log('\nRouting schema initialization complete.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Schema creation failed:', err);
    process.exit(1);
  });
