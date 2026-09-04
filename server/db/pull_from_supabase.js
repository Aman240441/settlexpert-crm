const { supabase } = require('./supabaseClient');
const db = require('./database');

/**
 * Hydrates local SQLite database from Supabase cloud on server startup.
 * Ensures that if Render spins up a fresh container, local cache is immediately populated with cloud data.
 */
async function pullFromSupabase() {
  if (!supabase) {
    console.log('[Supabase Pull] Supabase client not active. Skipping pull.');
    return;
  }

  console.log('================================================================');
  console.log(' SETTLEXPERT — PULLING LATEST DATA FROM SUPABASE CLOUD');
  console.log('================================================================');

  try {
    // 1. Departments
    const { data: depts } = await supabase.from('departments').select('*');
    if (depts && depts.length > 0) {
      const stmt = db.prepare('INSERT OR REPLACE INTO departments (id, name, code, description, head_manager_id, status) VALUES (?, ?, ?, ?, ?, ?)');
      for (const d of depts) {
        stmt.run(d.id, d.name, d.code, d.description || null, d.head_manager_id || null, d.status || 'active');
      }
      console.log(` ✔ [Supabase Pull] Hydrated ${depts.length} records into 'departments'`);
    }

    // 2. Manager Types
    const { data: mgTypes } = await supabase.from('manager_types').select('*');
    if (mgTypes && mgTypes.length > 0) {
      const stmt = db.prepare('INSERT OR REPLACE INTO manager_types (id, name, code, description, permissions_json, status) VALUES (?, ?, ?, ?, ?, ?)');
      for (const m of mgTypes) {
        stmt.run(m.id, m.name, m.code, m.description || null, typeof m.permissions_json === 'string' ? m.permissions_json : JSON.stringify(m.permissions_json || {}), m.status || 'active');
      }
      console.log(` ✔ [Supabase Pull] Hydrated ${mgTypes.length} records into 'manager_types'`);
    }

    // 3. Users
    const { data: users } = await supabase.from('users').select('*');
    if (users && users.length > 0) {
      const stmt = db.prepare('INSERT OR REPLACE INTO users (id, name, email, phone, password_hash, role, manager_id, department_id, team_id, manager_type_id, emp_or_mgr_id, profile_image, joining_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      for (const u of users) {
        stmt.run(
          u.id,
          u.name,
          u.email,
          u.phone || '',
          u.password_hash,
          (u.role || 'employee').toLowerCase(),
          u.manager_id || null,
          u.department_id || null,
          u.team_id || null,
          u.manager_type_id || null,
          u.emp_or_mgr_id || u.employee_id || '',
          u.profile_image || u.profile_photo || '',
          u.joining_date || '',
          u.status || 'active'
        );
      }
      console.log(` ✔ [Supabase Pull] Hydrated ${users.length} records into 'users'`);
    }

    // 4. Fee Plans
    const { data: feePlans } = await supabase.from('fee_plans').select('*');
    if (feePlans && feePlans.length > 0) {
      const stmt = db.prepare('INSERT OR REPLACE INTO fee_plans (id, name, duration, default_fee, status) VALUES (?, ?, ?, ?, ?)');
      for (const f of feePlans) {
        stmt.run(f.id, f.name, f.duration || '', f.default_fee || 0, f.status || 'active');
      }
      console.log(` ✔ [Supabase Pull] Hydrated ${feePlans.length} records into 'fee_plans'`);
    }

    // 5. Leads
    const { data: leads } = await supabase.from('leads').select('*');
    db.prepare('DELETE FROM leads').run();
    if (leads && leads.length > 0) {
      const stmt = db.prepare('INSERT OR REPLACE INTO leads (id, lead_number, name, phone, email, city, total_debt, monthly_income, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      for (const l of leads) {
        stmt.run(
          l.id,
          l.lead_number || l.lead_id || `LD-${l.id}`,
          l.name || 'Unnamed',
          l.phone || '',
          l.email || '',
          l.city || '',
          parseFloat(l.total_debt || l.outstanding_amount || 0),
          parseFloat(l.monthly_income || 0),
          (l.status || l.lead_status || 'New').toLowerCase(),
          l.created_at || new Date().toISOString()
        );
      }
      console.log(` ✔ [Supabase Pull] Hydrated ${leads.length} records into 'leads'`);
    } else {
      console.log(` ✔ [Supabase Pull] 'leads' table is clean (0 records).`);
    }

    // 6. Clients
    const { data: clients } = await supabase.from('clients').select('*');
    db.prepare('DELETE FROM clients').run();
    if (clients && clients.length > 0) {
      const stmt = db.prepare('INSERT OR REPLACE INTO clients (id, client_number, name, phone, email, city, total_debt, sx_fee, pending_amount, status, case_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      for (const c of clients) {
        stmt.run(
          c.id,
          c.client_number || `CL-${c.id}`,
          c.name || 'Unnamed',
          c.phone || '',
          c.email || '',
          c.city || '',
          parseFloat(c.total_debt || 0),
          parseFloat(c.sx_fee || c.service_fee || 0),
          parseFloat(c.pending_amount || 0),
          (c.status || 'Active').toLowerCase(),
          c.case_status || 'Active',
          c.created_at || new Date().toISOString()
        );
      }
      console.log(` ✔ [Supabase Pull] Hydrated ${clients.length} records into 'clients'`);
    } else {
      console.log(` ✔ [Supabase Pull] 'clients' table is clean (0 records).`);
    }

    // 7. Agreements
    const { data: agreements } = await supabase.from('agreements').select('*');
    db.prepare('DELETE FROM agreements').run();
    if (agreements && agreements.length > 0) {
      const stmt = db.prepare('INSERT OR REPLACE INTO agreements (id, agreement_number, client_id, name, phone, email, total_fee, monthly_fee, resolution_duration, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      for (const a of agreements) {
        stmt.run(
          a.id,
          a.agreement_number || a.agreement_id || `AGR-${a.id}`,
          a.client_id || a.client_id_ref || null,
          a.name || a.client_name || '',
          a.phone || '',
          a.email || '',
          parseFloat(a.total_fee || a.settlement_amount || a.loan_amount || a.consultancy_fee || 0),
          parseFloat(a.monthly_fee || 0),
          a.resolution_duration || a.agreement_duration || '',
          (a.status || 'Active').toLowerCase(),
          a.created_at || new Date().toISOString()
        );
      }
      console.log(` ✔ [Supabase Pull] Hydrated ${agreements.length} records into 'agreements'`);
    } else {
      console.log(` ✔ [Supabase Pull] 'agreements' table is clean (0 records).`);
    }

  } catch (err) {
    console.warn('[Supabase Pull] Exception during hydration:', err.message);
  }

  console.log('================================================================');
  console.log(' SUPABASE CLOUD DATA HYDRATION COMPLETE');
  console.log('================================================================');
}

if (require.main === module) {
  pullFromSupabase();
}

module.exports = { pullFromSupabase };
