const { supabase } = require('../db/supabaseClient');
const db = require('../db/database');

async function wipeAllData() {
  console.log('================================================================');
  console.log(' WIPING ALL CRM TRANSACTIONAL DATA (LOCAL & SUPABASE CLOUD)');
  console.log('================================================================');

  // 1. Wipe local SQLite tables
  console.log('\n[1/2] Wiping local SQLite CRM tables...');
  const localTx = db.transaction(() => {
    db.pragma('foreign_keys = OFF');
    db.prepare('DELETE FROM payments').run();
    db.prepare('DELETE FROM monthly_payment_history').run();
    db.prepare('DELETE FROM monthly_payment_records').run();
    db.prepare('DELETE FROM agreements').run();
    db.prepare('DELETE FROM lenders').run();
    db.prepare('DELETE FROM follow_ups').run();
    db.prepare('DELETE FROM tasks').run();
    db.prepare('DELETE FROM payment_due_notifications').run();
    db.prepare('DELETE FROM advocate_assignment_history').run();
    db.prepare('DELETE FROM lead_distributions').run();
    db.prepare('DELETE FROM lead_imports').run();
    try { db.prepare('DELETE FROM lead_assignment_history').run(); } catch(e) {}
    db.prepare('DELETE FROM clients').run();
    db.prepare('DELETE FROM leads').run();
    db.prepare('DELETE FROM audit_logs').run();
    db.pragma('foreign_keys = ON');
  });
  localTx();
  console.log(' ✔ Local SQLite CRM tables wiped successfully.');

  // 2. Wipe Supabase tables
  if (!supabase) {
    console.error(' ❌ Supabase client not initialized.');
    return;
  }

  console.log('\n[2/2] Wiping Supabase Cloud tables...');
  
  // Bigint primary key tables
  const bigintTables = ['payments', 'agreements', 'clients', 'leads'];
  for (const table of bigintTables) {
    try {
      const { error } = await supabase.from(table).delete().gt('id', 0);
      if (error) {
        console.warn(` ⚠️ Supabase notice on '${table}':`, error.message);
      } else {
        console.log(` ✔ Supabase '${table}' wiped successfully.`);
      }
    } catch (e) {
      console.warn(` ⚠️ Exception wiping '${table}':`, e.message);
    }
  }

  // UUID/String primary key tables
  const stringIdTables = [
    'monthly_payment_history',
    'monthly_payment_records',
    'lenders',
    'follow_ups',
    'tasks',
    'payment_due_notifications',
    'advocate_assignment_history',
    'lead_distributions',
    'lead_imports',
    'audit_logs'
  ];

  for (const table of stringIdTables) {
    try {
      const { error } = await supabase.from(table).delete().neq('id', 'placeholder-id-never-exists');
      if (error) {
        console.warn(` ⚠️ Supabase notice on '${table}':`, error.message);
      } else {
        console.log(` ✔ Supabase '${table}' wiped successfully.`);
      }
    } catch (e) {
      console.warn(` ⚠️ Exception wiping '${table}':`, e.message);
    }
  }

  console.log('\n================================================================');
  console.log(' ALL CRM DATA WIPED CLEAN FROM BOTH LOCAL & SUPABASE CLOUD!');
  console.log(' User accounts (Admins, Managers, Employees) were preserved.');
  console.log('================================================================\n');
}

async function wipeAllStaff() {
  console.log('================================================================');
  console.log(' WIPING ALL STAFF (Managers & Employees) FROM LOCAL & SUPABASE');
  console.log('================================================================');

  // Wipe from local SQLite
  console.log('\n[1/2] Wiping staff from local SQLite...');
  const localTx = db.transaction(() => {
    db.pragma('foreign_keys = OFF');
    // Remove all non-admin users
    db.prepare("DELETE FROM users WHERE role != 'admin'").run();
    db.pragma('foreign_keys = ON');
  });
  localTx();
  console.log(' ✔ Local SQLite: All managers & employees deleted.');

  // Wipe from Supabase
  if (!supabase) {
    console.error(' ❌ Supabase client not initialized.');
    return;
  }
  console.log('\n[2/2] Wiping staff from Supabase...');
  try {
    const { data, error } = await supabase
      .from('users')
      .delete()
      .neq('role', 'admin')
      .select('id, name, role');
    if (error) {
      console.warn(' ⚠️ Supabase notice:', error.message);
    } else {
      console.log(` ✔ Supabase: Deleted ${data?.length || 0} staff user(s).`);
      data?.forEach(u => console.log(`   - ${u.role}: ${u.name}`));
    }
  } catch (e) {
    console.warn(' ⚠️ Exception wiping staff from Supabase:', e.message);
  }

  console.log('\n================================================================');
  console.log(' ALL STAFF WIPED! Only Admin account remains.');
  console.log('================================================================\n');
}

if (require.main === module) {
  // Check CLI arg: node wipe_all_data.js --staff to wipe staff too
  const args = process.argv.slice(2);
  if (args.includes('--staff')) {
    wipeAllStaff();
  } else {
    wipeAllData();
  }
}

module.exports = { wipeAllData, wipeAllStaff };
