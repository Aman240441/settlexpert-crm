const db = require('../db/database');

console.log('Cleaning CRM data...');

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

  // Clear Tasks
  db.prepare('DELETE FROM tasks').run();
  
  // Clear old audit logs and insert clean production init log
  db.prepare('DELETE FROM audit_logs').run();
  db.prepare(`
    INSERT INTO audit_logs (id, user_name, role, action, module, record_id, details_json)
    VALUES ('aud-prod-init-2', 'System Administrator', 'admin', 'CRM Data Reset', 'System', 'SYS-PROD-02', 'All transactional CRM data (leads, clients) cleared while keeping user accounts intact.')
  `).run();

  db.pragma('foreign_keys = ON');
});

cleanupTx();
console.log('CRM Data cleaned successfully. User accounts were preserved.');
