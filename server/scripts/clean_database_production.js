const bcrypt = require('bcryptjs');
const db = require('../db/database');

console.log('====================================================');
console.log(' SETTL EXPERT — PRODUCTION DATABASE CLEANUP');
console.log('====================================================');

// 1. Inspect Before
const allTables = [
  'leads',
  'clients',
  'lenders',
  'agreements',
  'monthly_payment_records',
  'monthly_payment_history',
  'payments',
  'follow_ups',
  'advocate_assignment_history',
  'advocates',
  'payment_due_notifications',
  'lead_imports',
  'lead_distributions',
  'lead_assignment_history',
  'tasks',
  'staff_extended_profiles',
  'staff_kyc',
  'staff_advocate_details',
  'teams',
  'users',
  'audit_logs'
];

console.log('\n--- 1. Record Counts Before Cleanup ---');
const beforeCounts = {};
for (const t of allTables) {
  try {
    const r = db.prepare(`SELECT COUNT(*) as c FROM ${t}`).get();
    beforeCounts[t] = r.c;
    console.log(` ${t.padEnd(30)}: ${r.c}`);
  } catch (e) {
    console.log(` ${t.padEnd(30)}: [Error: ${e.message}]`);
  }
}

// 2. Perform Atomic Safe Cleanup
console.log('\n--- 2. Executing Safe Deletion ---');
const cleanupTx = db.transaction(() => {
  db.pragma('foreign_keys = OFF');

  // Clear CRM Transactional & Lifecycle Tables
  db.prepare('DELETE FROM leads').run();
  db.prepare('DELETE FROM clients').run();
  db.prepare('DELETE FROM lenders').run();
  db.prepare('DELETE FROM agreements').run();
  db.prepare('DELETE FROM monthly_payment_records').run();
  db.prepare('DELETE FROM monthly_payment_history').run();
  db.prepare('DELETE FROM payments').run();
  db.prepare('DELETE FROM follow_ups').run();
  db.prepare('DELETE FROM advocate_assignment_history').run();
  db.prepare('DELETE FROM advocates').run();
  db.prepare('DELETE FROM payment_due_notifications').run();

  // Clear Lead Import & Smart Distribution Records
  db.prepare('DELETE FROM lead_imports').run();
  db.prepare('DELETE FROM lead_distributions').run();
  db.prepare('DELETE FROM lead_assignment_history').run();

  // Clear Tasks & Staff Extended Profiles/KYC
  db.prepare('DELETE FROM tasks').run();
  db.prepare('DELETE FROM staff_extended_profiles').run();
  db.prepare('DELETE FROM staff_kyc').run();
  db.prepare('DELETE FROM staff_advocate_details').run();
  db.prepare('DELETE FROM teams').run();

  // Reset department head_manager_id references to null
  db.prepare('UPDATE departments SET head_manager_id = NULL').run();

  // Clean duplicate test departments, keep 6 standard ones
  const standardDeptCodes = ['HR', 'LEGAL', 'FIN', 'COLL', 'OPS', 'SALES'];
  db.prepare(`DELETE FROM departments WHERE code NOT IN (${standardDeptCodes.map(() => '?').join(',')})`).run(...standardDeptCodes);

  // Delete all non-admin users
  db.prepare("DELETE FROM users WHERE role != 'admin' OR email != 'settlexperts@gmail.com'").run();

  // Ensure super admin user exists
  const superAdmin = db.prepare("SELECT * FROM users WHERE email = 'settlexperts@gmail.com'").get();
  const adminHash = bcrypt.hashSync('settlexpert931075@Abc', 10);
  if (!superAdmin) {
    db.prepare(`
      INSERT INTO users (id, name, email, phone, password_hash, role, emp_or_mgr_id, status, joining_date)
      VALUES ('user-admin-01', 'Super Administrator', 'settlexperts@gmail.com', '+91 9876543210', ?, 'admin', 'ADM-001', 'active', '2025-01-01')
    `).run(adminHash);
  } else {
    db.prepare(`
      UPDATE users 
      SET password_hash = ?, status = 'active', role = 'admin', name = 'Super Administrator', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(adminHash, superAdmin.id);
  }

  // Clear old audit logs and insert clean production init log
  db.prepare('DELETE FROM audit_logs').run();
  db.prepare(`
    INSERT INTO audit_logs (id, user_name, role, action, module, record_id, details_json)
    VALUES ('aud-prod-init', 'Master Administrator', 'admin', 'Production Database Cleaned', 'System', 'SYS-PROD-01', 'All demo/test records cleared. Production dataset initialized.')
  `).run();

  db.pragma('foreign_keys = ON');
});

cleanupTx();

// VACUUM database to reclaim disk space & optimize indexes
try {
  db.pragma('optimize');
  db.exec('VACUUM;');
} catch (e) {
  console.warn('Vacuum notice:', e.message);
}

// 3. Inspect After Cleanup
console.log('\n--- 3. Record Counts After Cleanup (Verification) ---');
const afterCounts = {};
for (const t of allTables) {
  try {
    const r = db.prepare(`SELECT COUNT(*) as c FROM ${t}`).get();
    afterCounts[t] = r.c;
    console.log(` ${t.padEnd(30)}: ${r.c}`);
  } catch (e) {
    console.log(` ${t.padEnd(30)}: [Error: ${e.message}]`);
  }
}

// 4. Verify Super Admin Account
const finalAdmin = db.prepare("SELECT id, name, email, role, emp_or_mgr_id, status FROM users WHERE role = 'admin'").all();
console.log('\n====================================================');
console.log(' PRESERVED SUPER ADMIN ACCOUNT');
console.log('====================================================');
console.log(JSON.stringify(finalAdmin, null, 2));

console.log('\n====================================================');
console.log(' DATABASE CLEANUP COMPLETE — READY FOR PRODUCTION!');
console.log('====================================================');
