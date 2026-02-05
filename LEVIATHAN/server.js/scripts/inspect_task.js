const db = require('../config.db/db');

const taskId = process.argv[2] || 44;

(async () => {
    try {
        const promisePool = db.promise();
        
        // Get task details
        const [tasks] = await promisePool.query(
            `SELECT rt.*, r.container_id, r.route_status,
                    p.package_code, p.producer_id,
                    c.container_code
             FROM route_tasks rt
             JOIN routes r ON rt.route_id = r.route_id
             LEFT JOIN packages p ON rt.package_id = p.package_id
             LEFT JOIN containers c ON r.container_id = c.container_id
             WHERE rt.task_id = ?`,
            [taskId]
        );
        
        if (tasks.length === 0) {
            console.log(`\n❌ Task ${taskId} not found\n`);
            process.exit(0);
        }
        
        const task = tasks[0];
        
        console.log(`\n📋 TASK #${taskId} DETAILS:\n`);
        console.log(`Container:      ${task.container_code} (ID: ${task.container_id})`);
        console.log(`Route:          #${task.route_id} (${task.route_status})`);
        console.log(`Task Type:      ${task.task_type}`);
        console.log(`Package:        ${task.package_code || 'N/A'}`);
        console.log(`Priority Order: ${task.priority_order}`);
        console.log(`Status:         ${task.task_status}`);
        
        // Get all tasks in this route
        console.log(`\n📊 ALL TASKS IN ROUTE #${task.route_id}:\n`);
        
        const [allTasks] = await promisePool.query(
            `SELECT rt.task_id, rt.task_type, rt.priority_order, rt.task_status,
                    p.package_code,
                    CASE 
                        WHEN ln.node_type = 'PRODUCER' THEN prod.producer_name
                        WHEN ln.node_type = 'DESTINATION' THEN dest.destination_name
                        ELSE 'Depot'
                    END as location_name
             FROM route_tasks rt
             LEFT JOIN packages p ON rt.package_id = p.package_id
             LEFT JOIN location_nodes ln ON rt.node_id = ln.node_id
             LEFT JOIN producers prod ON (ln.node_type = 'PRODUCER' AND ln.reference_id = prod.producer_id)
             LEFT JOIN destinations dest ON (ln.node_type = 'DESTINATION' AND ln.reference_id = dest.destination_id)
             WHERE rt.route_id = ?
             ORDER BY rt.priority_order ASC`,
            [task.route_id]
        );
        
        console.log('Priority | Task ID | Type     | Package     | Location              | Status');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        allTasks.forEach(t => {
            const marker = t.task_id == taskId ? '→' : ' ';
            const priority = String(t.priority_order).padStart(8);
            const taskIdStr = String(t.task_id).padEnd(7);
            const type = t.task_type.padEnd(8);
            const pkg = (t.package_code || 'N/A').padEnd(11);
            const loc = (t.location_name || 'N/A').substring(0, 20).padEnd(21);
            const status = t.task_status;
            
            console.log(`${marker}${priority} | ${taskIdStr} | ${type} | ${pkg} | ${loc} | ${status}`);
        });
        
        // Find top priority PENDING task
        const [topPending] = await promisePool.query(
            `SELECT task_id, priority_order FROM route_tasks 
             WHERE route_id = ? AND task_status = 'PENDING' 
             ORDER BY priority_order ASC LIMIT 1`,
            [task.route_id]
        );
        
        if (topPending.length > 0) {
            console.log(`\n✅ TOP PRIORITY PENDING TASK: #${topPending[0].task_id} (Priority: ${topPending[0].priority_order})`);
            
            if (topPending[0].task_id == taskId) {
                console.log(`   ✓ Task ${taskId} IS the top priority - ready to start!`);
            } else {
                console.log(`   ✗ Task ${taskId} is NOT the top priority`);
                console.log(`   → You should start task #${topPending[0].task_id} first`);
                console.log(`   → URL: http://localhost:5001/task/${topPending[0].task_id}/start`);
            }
        } else {
            console.log(`\n✅ NO PENDING TASKS - Route may be complete or all tasks in progress`);
        }
        
        console.log('\n');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
})();
