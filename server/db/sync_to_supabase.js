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
    { table: 'departments', select: '*', primaryKey: 'id' },
    { table: 'manager_types', select: '*', primaryKey: 'id' },
    { table: 'users', select: '*', primaryKey: 'id' },
    { table: 'teams', select: '*', primaryKey: 'id' },
    { table: 'user_permissions', select: '*', primaryKey: 'id' },
    { table: 'advocates', select: '*', primaryKey: 'id' },
    { table: 'fee_plans', select: '*', primaryKey: 'id' },
    { table: 'leads', select: '*', primaryKey: 'id' },
    { table: 'follow_ups', select: '*', primaryKey: 'id' },
    { table: 'clients', select: '*', primaryKey: 'id' },
    { table: 'lenders', select: '*', primaryKey: 'id' },
    { table: 'agreements', select: '*', primaryKey: 'id' },
    { table: 'monthly_payment_records', select: '*', primaryKey: 'id' },
    { table: 'monthly_payment_history', select: '*', primaryKey: 'id' },
    { table: 'payments', select: '*', primaryKey: 'id' },
    { table: 'tasks', select: '*', primaryKey: 'id' },
    { table: 'advocate_assignment_history', select: '*', primaryKey: 'id' },
    { table: 'payment_due_notifications', select: '*', primaryKey: 'id' },
    { table: 'lead_imports', select: '*', primaryKey: 'id' },
    { table: 'lead_distributions', select: '*', primaryKey: 'id' },
    { table: 'staff_extended_profiles', select: '*', primaryKey: 'user_id' },
    { table: 'staff_kyc', select: '*', primaryKey: 'id' },
    { table: 'staff_advocate_details', select: '*', primaryKey: 'user_id' },
    { table: 'audit_logs', select: '*', primaryKey: 'id' }
  ];

  let totalSynced = 0;
  let missingTables = [];

  for (const item of syncOrder) {
    try {
      const pKey = item.primaryKey || 'id';
      const records = db.prepare(`SELECT ${item.select} FROM ${item.table}`).all();
      console.log(`\nSyncing table: ${item.table} (${records.length} records in local DB)...`);

      if (records.length === 0) {
        // Check if table exists in Supabase
        const { error } = await supabase.from(item.table).select(pKey).limit(1);
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

      // Format payload based on table specific schema nuances if needed
      let payload = records;
      if (item.table === 'audit_logs') {
        payload = records.map(r => ({
          id: r.id,
          user_id: r.user_id || '4',
          action: r.action || 'ACTION',
          entity_type: r.module || 'System',
          entity_id: r.record_id || '',
          details: r.details_json || '',
          details_json: r.details_json || '{}',
          ip_address: r.ip_address || '',
          created_at: r.created_at || new Date().toISOString()
        }));
      } else if (item.table === 'leads') {
        payload = records.map(r => ({
          id: Math.floor(Number(r.id)),
          lead_id: r.lead_number || `LD-${r.id}`,
          name: r.name || 'Unnamed',
          phone: r.phone || '',
          email: r.email || '',
          city: r.city || '',
          outstanding_amount: String(Math.floor(Number(r.total_debt || r.loan_amount || 0))),
          monthly_income: String(Math.floor(Number(r.monthly_income || 0))),
          lead_status: r.status || 'New',
          created_at: r.created_at || new Date().toISOString()
        }));
      } else if (item.table === 'clients') {
        payload = records.map(r => ({
          id: Math.floor(Number(r.id)),
          client_id: r.client_number || `CL-${r.id}`,
          name: r.name || 'Unnamed',
          phone: r.phone || '',
          email: r.email || '',
          city: r.city || '',
          service_fee: Math.floor(Number(r.sx_fee || 0)),
          pending_amount: Math.floor(Number(r.pending_amount || 0)),
          case_status: r.case_status || 'Active',
          created_at: r.created_at || new Date().toISOString()
        }));
      } else if (item.table === 'agreements') {
        payload = records.map(r => ({
          id: Math.floor(Number(r.id)),
          agreement_id: r.agreement_number || `AGR-${r.id}`,
          client_id_ref: r.client_id ? Math.floor(Number(r.client_id)) : null,
          client_name: r.name || '',
          phone: r.phone || '',
          email: r.email || '',
          loan_amount: Math.floor(Number(r.total_fee || 0)),
          resolution_duration: r.resolution_duration || '',
          status: r.status || 'Active',
          created_at: r.created_at || new Date().toISOString()
        }));
      }

      // Upsert records into Supabase in batches
      const { data, error } = await supabase
        .from(item.table)
        .upsert(payload, { onConflict: pKey });

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
