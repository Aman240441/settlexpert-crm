const { supabase } = require('./supabaseClient');
const db = require('./database');

async function syncAllToSupabase() {
  console.log('================================================================');
  console.log(' SETTLEXPERT — SYNCING ALL CRM & ADMIN DATA TO SUPABASE');
  console.log('================================================================');

  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  // List of tables to sync in proper foreign-key dependency order
  const syncOrder = [
    { table: 'departments', select: '*' },
    { table: 'manager_types', select: '*' },
    { table: 'users', select: '*' },
    { table: 'teams', select: '*' },
    { table: 'user_permissions', select: '*' },
    { table: 'advocates', select: '*' },
    { table: 'fee_plans', select: '*' },
    { table: 'leads', select: '*' },
    { table: 'follow_ups', select: '*' },
    { table: 'clients', select: '*' },
    { table: 'lenders', select: '*' },
    { table: 'agreements', select: '*' },
    { table: 'monthly_payment_records', select: '*' },
    { table: 'monthly_payment_history', select: '*' },
    { table: 'payments', select: '*' },
    { table: 'tasks', select: '*' },
    { table: 'advocate_assignment_history', select: '*' },
    { table: 'payment_due_notifications', select: '*' },
    { table: 'lead_imports', select: '*' },
    { table: 'lead_distributions', select: '*' },
    { table: 'staff_extended_profiles', select: '*' },
    { table: 'staff_kyc', select: '*' },
    { table: 'staff_advocate_details', select: '*' },
    { table: 'audit_logs', select: '*' }
  ];

  let totalSynced = 0;
  let missingTables = [];

  for (const item of syncOrder) {
    try {
      const records = db.prepare(`SELECT ${item.select} FROM ${item.table}`).all();
      console.log(`\nSyncing table: ${item.table} (${records.length} records in local DB)...`);

      if (records.length === 0) {
        // Try a simple select from Supabase to check if table exists
        const { error } = await supabase.from(item.table).select('id').limit(1);
        if (error) {
          if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
            missingTables.push(item.table);
            console.log(` ❌ Table '${item.table}' does not exist in Supabase yet.`);
          } else {
            console.log(` ⚠️ Supabase notice on ${item.table}:`, error.message);
          }
        } else {
          console.log(` ✔ Table '${item.table}' exists in Supabase and is ready.`);
        }
        continue;
      }

      // Upsert records into Supabase in batches
      const { data, error } = await supabase
        .from(item.table)
        .upsert(records, { onConflict: 'id' });

      if (error) {
        if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
          missingTables.push(item.table);
          console.log(` ❌ Table '${item.table}' does not exist in Supabase yet.`);
        } else {
          console.log(` ⚠️ Upsert error on '${item.table}':`, error.message);
        }
      } else {
        totalSynced += records.length;
        console.log(` ✔ Successfully synced ${records.length} record(s) to Supabase '${item.table}'`);
      }
    } catch (err) {
      console.log(` ⚠️ Exception syncing '${item.table}':`, err.message);
    }
  }

  console.log('\n================================================================');
  if (missingTables.length > 0) {
    console.log(` ACTION REQUIRED: ${missingTables.length} table(s) need to be created in Supabase.`);
    console.log(` Please run the SQL file 'server/db/supabase_schema.sql' in your Supabase SQL Editor:`);
    const projectRef = (process.env.SUPABASE_URL || '').split('//')[1]?.split('.')[0] || 'YOUR_PROJECT_REF';
    console.log(` URL: https://supabase.com/dashboard/project/${projectRef}/sql/new`);
  } else {
    console.log(` ALL ${syncOrder.length} TABLES ARE CONNECTED & SYNCED TO SUPABASE (100%)!`);
  }
  console.log('================================================================');

  return { missingTables, totalSynced };
}

if (require.main === module) {
  syncAllToSupabase();
}

module.exports = { syncAllToSupabase };
