const db = require('../config.db/db');

const samples = [
  { id: 5, container_code: 'C5', driver_name: 'Joel', driver_phone: '3456789', total_sections: 12, available_sections: 12, cost_per_section: 0.00, current_latitude: 10.2830320, current_longitude: 78.3335747 },
  { id: 4, container_code: 'C4', driver_name: 'K. Senthil', driver_phone: '9000011114', total_sections: 16, available_sections: 16, cost_per_section: 0.00, current_latitude: 9.9252010, current_longitude: 78.1197750 },
  { id: 3, container_code: 'C3', driver_name: 'M. Prakash', driver_phone: '9000011113', total_sections: 22, available_sections: 22, cost_per_section: 0.00, current_latitude: 10.7904830, current_longitude: 78.7046730 },
  { id: 2, container_code: 'C2', driver_name: 'S. Arjun', driver_phone: '9000011112', total_sections: 18, available_sections: 18, cost_per_section: 0.00, current_latitude: 11.6643250, current_longitude: 78.1460140 },
  { id: 1, container_code: 'C1', driver_name: 'R. Kumar', driver_phone: '9000011111', total_sections: 20, available_sections: 20, cost_per_section: 0.00, current_latitude: 11.0168440, current_longitude: 76.9558330 }
];

function upsertSample(idx) {
  if (idx >= samples.length) {
    console.log('Done inserting/updating samples.');
    // allow pool to close naturally
    return setTimeout(() => process.exit(0), 200);
  }

  const s = samples[idx];

  // Try to find an existing container by driver_phone
  const findSql = 'SELECT * FROM containers WHERE driver_phone = ? LIMIT 1';
  db.query(findSql, [s.driver_phone], (fErr, rows) => {
    if (fErr) {
      console.error('Find error', fErr);
      return upsertSample(idx + 1);
    }

    if (rows && rows.length > 0) {
      const existing = rows[0];
      const updateSql = `UPDATE containers SET container_code = ?, driver_name = ?, total_sections = ?, available_sections = ?, cost_per_section = ?, current_latitude = ?, current_longitude = ? WHERE container_id = ?`;
      const uvals = [s.container_code, s.driver_name, s.total_sections, s.available_sections, s.cost_per_section, s.current_latitude, s.current_longitude, existing.container_id];
      db.query(updateSql, uvals, (uErr) => {
        if (uErr) console.error('Update error', uErr);
        else console.log(`Updated container (phone=${s.driver_phone}) -> container_id=${existing.container_id}`);
        upsertSample(idx + 1);
      });
    } else {
      const insertSql = `INSERT INTO containers (container_code, driver_name, driver_phone, section_storage_space, total_sections, available_sections, cost_per_section, current_latitude, current_longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const ivals = [s.container_code, s.driver_name, s.driver_phone, 1, s.total_sections, s.available_sections, s.cost_per_section, s.current_latitude, s.current_longitude];
      db.query(insertSql, ivals, (iErr, result) => {
        if (iErr) console.error('Insert error', iErr);
        else console.log(`Inserted container id=${result.insertId} phone=${s.driver_phone}`);
        upsertSample(idx + 1);
      });
    }
  });
}

upsertSample(0);
