const pool = require('../config.db/db');

async function checkPackages() {
    try {
        const [packages] = await pool.promise().query(`
            SELECT p.package_id, p.producer_id, p.destination_id, p.status, p.required_sections,
                   pr.producer_name, pr.inventory_latitude as lat, pr.inventory_longitude as lng
            FROM packages p
            JOIN producers pr ON p.producer_id = pr.producer_id
            WHERE p.status = 'AVAILABLE'
        `);
        
        console.log('Available packages:', packages.length);
        console.log(JSON.stringify(packages, null, 2));
        
        const withoutDest = packages.filter(p => !p.destination_id);
        console.log('\nPackages without destination_id:', withoutDest.length);
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

checkPackages();
