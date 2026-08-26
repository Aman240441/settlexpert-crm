const db = require('../db/database');

const tables = [
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
  'audit_logs',
  'departments',
  'manager_types',
  'fee_plans'
];

console.log('====================================================');
console.log(' CURRENT DATABASE RECORD COUNTS (BEFORE CLEANUP)');
console.log('====================================================');

const countsBefore = {};
tables.forEach(t => {
  try {
    const row = db.prepare(`SELECT COUNT(*) as count FROM ${t}`).get();
    countsBefore[t] = row.count;
    console.log(`${t.padEnd(30)}: ${row.count}`);
  } catch (e) {
    console.log(`${t.padEnd(30)}: [Table not found or error: ${e.message}]`);
  }
});

const admins = db.prepare("SELECT id, name, email, role, status FROM users WHERE role = 'admin'").all();
console.log('\n====================================================');
console.log(' PRESERVED SUPER ADMIN ACCOUNT(S)');
console.log('====================================================');
console.log(JSON.stringify(admins, null, 2));

const nonAdmins = db.prepare("SELECT role, COUNT(*) as count FROM users WHERE role != 'admin' GROUP BY role").all();
console.log('\n====================================================');
console.log(' NON-ADMIN USERS (TO BE DELETED)');
console.log('====================================================');
console.log(JSON.stringify(nonAdmins, null, 2));
