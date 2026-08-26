const db = require('../db/database');

try {
  const admin = db.prepare(`SELECT * FROM users WHERE email = 'admin@settlexpert.com'`).get();
  console.log('Admin user:', admin);

  const emp1 = db.prepare(`SELECT * FROM users WHERE role = 'employee' LIMIT 1`).get();
  console.log('Emp1:', emp1);

  const lead = db.prepare(`SELECT * FROM leads LIMIT 1`).get();
  console.log('Lead:', lead);

  const distId = 'dist-test-1';
  db.prepare(`
    INSERT INTO lead_distributions (
      id, distribution_number, import_id, distributed_by,
      distributed_by_name, distributed_by_role, distribution_mode,
      assignment_method, total_leads, employee_count, summary_json
    ) VALUES (?, 'DIST-9999', NULL, ?, 'Admin', 'admin', 'equal', 'sequential', 1, 1, '[]')
  `).run(distId, admin.id);
  console.log('lead_distributions inserted OK');

  const historyId = 'ah-test-1';
  db.prepare(`
    INSERT INTO lead_assignment_history (
      id, lead_id, distribution_id, previous_employee_id,
      previous_employee_name, assigned_employee_id, assigned_employee_name,
      assigned_by, assigned_by_name, assigned_by_role, reassignment_reason
    ) VALUES (?, ?, ?, NULL, NULL, ?, ?, ?, 'Admin', 'admin', 'test')
  `).run(historyId, lead.id, distId, emp1.id, emp1.name, admin.id);
  console.log('lead_assignment_history inserted OK');

  db.prepare(`
    UPDATE leads SET employee_id = ?, manager_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(emp1.id, emp1.manager_id || null, lead.id);
  console.log('leads updated OK');

} catch (e) {
  console.error('DEBUG ERROR:', e);
}
