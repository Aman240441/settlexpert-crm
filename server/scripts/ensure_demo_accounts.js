const db = require('../db/database');
const bcrypt = require('bcryptjs');

// 1. Ensure Employee user
const emp = db.prepare("SELECT * FROM users WHERE role = 'employee'").get();
if (!emp) {
  const hash = bcrypt.hashSync('Employee@123', 10);
  db.prepare(`
    INSERT INTO users (id, name, email, phone, password_hash, role, emp_or_mgr_id, status, joining_date)
    VALUES ('usr-emp-01', 'Dhruv Consultant', 'consultant@settlexpert.com', '+91 9876543211', ?, 'employee', 'EMP-001', 'active', '2025-01-15')
  `).run(hash);
  console.log('Created standard consultant/employee user: consultant@settlexpert.com');
} else {
  console.log('Existing employee found:', emp.email);
}

// 2. Ensure Manager user
const mgr = db.prepare("SELECT * FROM users WHERE role = 'manager'").get();
if (!mgr) {
  const hash = bcrypt.hashSync('Manager@123', 10);
  db.prepare(`
    INSERT INTO users (id, name, email, phone, password_hash, role, emp_or_mgr_id, manager_type_id, status, joining_date)
    VALUES ('usr-mgr-01', 'Vikram HR Manager', 'manager@settlexpert.com', '+91 9876543212', ?, 'manager', 'MGR-001', 'mt-hr', 'active', '2025-01-10')
  `).run(hash);
  console.log('Created standard manager user: manager@settlexpert.com');
} else {
  console.log('Existing manager found:', mgr.email);
}

// 3. Ensure Advocate user
const adv = db.prepare("SELECT * FROM users WHERE role = 'advocate'").get();
if (!adv) {
  const hash = bcrypt.hashSync('Advocate@123', 10);
  db.prepare(`
    INSERT INTO users (id, name, email, phone, password_hash, role, emp_or_mgr_id, status, joining_date)
    VALUES ('usr-adv-01', 'Adv. Rajesh Sharma', 'advocate@settlexpert.com', '+91 9876543213', ?, 'advocate', 'ADV-001', 'active', '2025-01-05')
  `).run(hash);
  console.log('Created standard advocate user: advocate@settlexpert.com');
} else {
  console.log('Existing advocate found:', adv.email);
}
