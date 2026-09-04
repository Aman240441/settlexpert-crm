const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'settl_expert.db');
const db = new Database(dbPath);

// Enable WAL mode & foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  // Schema creation
  db.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      head_manager_id TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS manager_types (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      permissions_json TEXT DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
      manager_id TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'manager', 'employee', 'advocate')),
      manager_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
      team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
      manager_type_id TEXT REFERENCES manager_types(id) ON DELETE SET NULL,
      emp_or_mgr_id TEXT UNIQUE,
      profile_image TEXT,
      joining_date TEXT,
      id_type TEXT,
      id_front TEXT,
      id_back TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_permissions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      module TEXT NOT NULL,
      can_view INTEGER NOT NULL DEFAULT 1,
      can_create INTEGER NOT NULL DEFAULT 0,
      can_edit INTEGER NOT NULL DEFAULT 0,
      can_delete INTEGER NOT NULL DEFAULT 0,
      can_assign INTEGER NOT NULL DEFAULT 0,
      can_verify INTEGER NOT NULL DEFAULT 0,
      UNIQUE(user_id, module)
    );

    CREATE TABLE IF NOT EXISTS advocates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      advocate_id TEXT NOT NULL UNIQUE,
      mobile TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      registration_number TEXT NOT NULL UNIQUE,
      specialization TEXT NOT NULL,
      address TEXT,
      profile_image TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fee_plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      duration TEXT NOT NULL,
      default_fee REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_name TEXT,
      role TEXT,
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      record_id TEXT,
      details_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Foundation CRM Tables for Steps 1-5
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      lead_number TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT NOT NULL,
      city TEXT,
      total_debt REAL DEFAULT 0,
      monthly_income REAL DEFAULT 0,
      service_needed TEXT,
      paying_emis TEXT DEFAULT 'Yes',
      harassment_calls TEXT DEFAULT 'No',
      employment_status TEXT DEFAULT 'Employed',
      employment_type TEXT DEFAULT 'Salaried',
      settlement_needed TEXT DEFAULT 'Yes',
      consultation_timing TEXT,
      credit_card_dues REAL DEFAULT 0,
      personal_loan_dues REAL DEFAULT 0,
      service_fee REAL DEFAULT 0,
      bank_name TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      manager_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      employee_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS follow_ups (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      user_name TEXT,
      call_status TEXT NOT NULL,
      interested_level TEXT,
      final_status TEXT NOT NULL,
      remark TEXT,
      next_follow_up_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      client_number TEXT UNIQUE NOT NULL,
      lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT NOT NULL,
      city TEXT,
      employment_status TEXT DEFAULT 'Employed',
      employment_type TEXT DEFAULT 'Salaried',
      total_debt REAL DEFAULT 0,
      monthly_income REAL DEFAULT 0,
      credit_card_dues REAL DEFAULT 0,
      personal_loan_dues REAL DEFAULT 0,
      loan_type TEXT DEFAULT 'Credit Card & Personal Loan',
      paying_emis TEXT DEFAULT 'Yes',
      harassment_calls TEXT DEFAULT 'No',
      settlement_needed TEXT DEFAULT 'Yes',
      consultation_timing TEXT,
      settlement_target REAL DEFAULT 0,
      fee_plan_id TEXT REFERENCES fee_plans(id) ON DELETE SET NULL,
      sx_fee REAL DEFAULT 0,
      fees_date TEXT,
      fees_status TEXT DEFAULT 'Pending',
      status TEXT NOT NULL DEFAULT 'active',
      case_status TEXT NOT NULL DEFAULT 'active',
      notes TEXT,
      manager_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      employee_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      advocate_id TEXT REFERENCES advocates(id) ON DELETE SET NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lenders (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      bank_name TEXT NOT NULL,
      loan_type TEXT,
      balance REAL DEFAULT 0,
      default_date TEXT,
      status TEXT DEFAULT 'Defaulted',
      lender_email TEXT,
      pdf_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS agreements (
      id TEXT PRIMARY KEY,
      agreement_number TEXT UNIQUE NOT NULL,
      client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
      fee_plan_id TEXT REFERENCES fee_plans(id) ON DELETE SET NULL,
      name TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      pin_number TEXT,
      dob TEXT,
      start_date TEXT,
      end_date TEXT,
      total_fee REAL NOT NULL,
      monthly_fee REAL DEFAULT 0,
      resolution_duration TEXT,
      prepared_by TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      agreement_body TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      receipt_number TEXT UNIQUE,
      client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
      agreement_id TEXT REFERENCES agreements(id) ON DELETE SET NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      transaction_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending_verification',
      verified_by TEXT,
      verified_at DATETIME,
      payment_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      module TEXT,
      priority TEXT DEFAULT 'medium',
      due_date TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS monthly_payment_records (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      agreement_id TEXT REFERENCES agreements(id) ON DELETE SET NULL,
      month_number INTEGER NOT NULL,
      due_date TEXT NOT NULL,
      expected_amount REAL NOT NULL DEFAULT 0,
      received_amount REAL NOT NULL DEFAULT 0,
      payment_date TEXT,
      payment_status TEXT NOT NULL DEFAULT 'Pending',
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS monthly_payment_history (
      id TEXT PRIMARY KEY,
      monthly_record_id TEXT NOT NULL REFERENCES monthly_payment_records(id) ON DELETE CASCADE,
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      agreement_id TEXT REFERENCES agreements(id) ON DELETE SET NULL,
      month_number INTEGER NOT NULL,
      payment_date TEXT NOT NULL,
      amount_received REAL NOT NULL,
      cumulative_received REAL NOT NULL,
      payment_status TEXT NOT NULL,
      remarks TEXT,
      updated_by_id TEXT,
      updated_by_name TEXT,
      updated_by_role TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS advocate_assignment_history (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      previous_advocate_id TEXT,
      previous_advocate_name TEXT,
      new_advocate_id TEXT,
      new_advocate_name TEXT,
      assigned_by_id TEXT,
      assigned_by_name TEXT,
      assigned_by_role TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payment_due_notifications (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      agreement_id TEXT REFERENCES agreements(id) ON DELETE SET NULL,
      monthly_record_id TEXT REFERENCES monthly_payment_records(id) ON DELETE CASCADE,
      month_number INTEGER NOT NULL,
      notification_type TEXT NOT NULL CHECK(notification_type IN ('PAYMENT_DUE_TODAY', 'PARTIAL_PAYMENT', 'PAYMENT_OVERDUE', 'PAYMENT_RECEIVED')),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      due_date TEXT NOT NULL,
      expected_amount REAL NOT NULL DEFAULT 8000,
      received_amount REAL NOT NULL DEFAULT 0,
      pending_amount REAL NOT NULL DEFAULT 0,
      days_overdue INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'resolved')),
      is_read INTEGER NOT NULL DEFAULT 0,
      employee_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(client_id, month_number, due_date, notification_type)
    );

    -- Lead Import & Smart Distribution Tables
    CREATE TABLE IF NOT EXISTS lead_imports (
      id TEXT PRIMARY KEY,
      import_number TEXT UNIQUE NOT NULL,
      file_name TEXT,
      uploaded_by TEXT REFERENCES users(id),
      uploaded_by_name TEXT,
      uploaded_by_role TEXT,
      total_rows INTEGER DEFAULT 0,
      valid_leads INTEGER DEFAULT 0,
      duplicate_leads INTEGER DEFAULT 0,
      invalid_rows INTEGER DEFAULT 0,
      imported_leads INTEGER DEFAULT 0,
      distribution_status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lead_distributions (
      id TEXT PRIMARY KEY,
      distribution_number TEXT UNIQUE NOT NULL,
      import_id TEXT REFERENCES lead_imports(id) ON DELETE SET NULL,
      distributed_by TEXT REFERENCES users(id),
      distributed_by_name TEXT,
      distributed_by_role TEXT,
      distribution_mode TEXT NOT NULL,
      assignment_method TEXT NOT NULL,
      total_leads INTEGER NOT NULL,
      employee_count INTEGER NOT NULL,
      summary_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lead_assignment_history (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      distribution_id TEXT REFERENCES lead_distributions(id) ON DELETE SET NULL,
      previous_employee_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      previous_employee_name TEXT,
      assigned_employee_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      assigned_employee_name TEXT,
      assigned_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      assigned_by_name TEXT,
      assigned_by_role TEXT,
      reassignment_reason TEXT,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- =====================================================
    -- ADVOCATE LEGAL & DEMAND NOTICES MANAGEMENT
    -- =====================================================
    CREATE TABLE IF NOT EXISTS legal_notices (
      id TEXT PRIMARY KEY,
      notice_number TEXT UNIQUE NOT NULL,
      client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
      client_name TEXT,
      bank_name TEXT NOT NULL,
      loan_account_no TEXT,
      notice_type TEXT NOT NULL DEFAULT 'Anti-Harassment Notice',
      notice_subject TEXT,
      notice_content TEXT,
      notice_date TEXT NOT NULL,
      dispatch_date TEXT,
      speed_post_number TEXT,
      tracking_url TEXT,
      status TEXT NOT NULL DEFAULT 'Draft',
      advocate_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      advocate_name TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS demand_notices (
      id TEXT PRIMARY KEY,
      demand_number TEXT UNIQUE NOT NULL,
      client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
      client_name TEXT,
      bank_name TEXT NOT NULL,
      loan_account_no TEXT,
      demand_type TEXT NOT NULL DEFAULT 'Incoming Loan Recall Demand',
      demand_amount REAL NOT NULL DEFAULT 0,
      settlement_offer_amount REAL DEFAULT 0,
      notice_date TEXT NOT NULL,
      reply_due_date TEXT,
      status TEXT NOT NULL DEFAULT 'Pending Review',
      remarks TEXT,
      file_attachment TEXT,
      advocate_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      advocate_name TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );


    -- =====================================================
    -- CENTRALIZED STAFF PROFILE TABLES
    -- =====================================================

    -- Extended personal + contact details for all staff
    CREATE TABLE IF NOT EXISTS staff_extended_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      date_of_birth TEXT,
      gender TEXT,
      father_name TEXT,
      mother_name TEXT,
      alt_phone TEXT,
      whatsapp_number TEXT,
      current_address TEXT,
      permanent_address TEXT,
      city TEXT,
      state TEXT,
      pin_code TEXT,
      designation TEXT,
      employment_status TEXT DEFAULT 'Active',
      staff_type TEXT DEFAULT 'Employee',
      reporting_manager_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Aadhaar KYC — NO PAN fields anywhere
    CREATE TABLE IF NOT EXISTS staff_kyc (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      aadhaar_number TEXT,
      aadhaar_front_doc TEXT,
      aadhaar_back_doc TEXT,
      kyc_status TEXT DEFAULT 'pending',
      verified_by TEXT,
      verified_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Advocate-specific legal / professional details
    CREATE TABLE IF NOT EXISTS staff_advocate_details (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      registration_number TEXT,
      bar_council_state TEXT,
      specialization TEXT,
      years_experience INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_staff_kyc_user ON staff_kyc(user_id);
    CREATE INDEX IF NOT EXISTS idx_staff_ext_user ON staff_extended_profiles(user_id);
    CREATE INDEX IF NOT EXISTS idx_staff_adv_user ON staff_advocate_details(user_id);

    CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
    CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);
    CREATE INDEX IF NOT EXISTS idx_agreements_created_at ON agreements(created_at);
    CREATE INDEX IF NOT EXISTS idx_follow_ups_date ON follow_ups(next_follow_up_date);
    CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_adv_assign_client ON advocate_assignment_history(client_id);
    CREATE INDEX IF NOT EXISTS idx_adv_assign_created ON advocate_assignment_history(created_at);
    CREATE INDEX IF NOT EXISTS idx_mph_client ON monthly_payment_history(client_id);
    CREATE INDEX IF NOT EXISTS idx_mph_record ON monthly_payment_history(monthly_record_id);
    CREATE INDEX IF NOT EXISTS idx_pdn_client ON payment_due_notifications(client_id);
    CREATE INDEX IF NOT EXISTS idx_pdn_employee ON payment_due_notifications(employee_id);
    CREATE INDEX IF NOT EXISTS idx_pdn_status ON payment_due_notifications(status);
    CREATE INDEX IF NOT EXISTS idx_pdn_type ON payment_due_notifications(notification_type);
  `);


  runMigrations();
  seedDefaultData();
  ensureAdvocateData();
  ensureMonthlyPaymentSchedules();
  runPaymentDueCheck();
}

function runMigrations() {
  // Migrate users table to allow 'advocate' role if needed
  try {
    const userTableSql = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='users'`).get();
    if (userTableSql && !userTableSql.sql.includes('advocate')) {
      db.exec(`
        PRAGMA foreign_keys=off;
        CREATE TABLE users_new (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          phone TEXT,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL CHECK(role IN ('admin', 'manager', 'employee', 'advocate')),
          manager_id TEXT REFERENCES users(id) ON DELETE SET NULL,
          department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
          team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
          manager_type_id TEXT REFERENCES manager_types(id) ON DELETE SET NULL,
          emp_or_mgr_id TEXT UNIQUE,
          profile_image TEXT,
          joining_date TEXT,
          id_type TEXT,
          id_front TEXT,
          id_back TEXT,
          status TEXT NOT NULL DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        INSERT INTO users_new SELECT * FROM users;
        DROP TABLE users;
        ALTER TABLE users_new RENAME TO users;
        PRAGMA foreign_keys=on;
      `);
    }
  } catch (e) {
    console.warn('Users role migration notice:', e.message);
  }

  // Helper to add missing column safely
  const addColumnIfNotExists = (table, column, colDef) => {
    try {
      const columns = db.prepare(`PRAGMA table_info(${table})`).all();
      const exists = columns.some((c) => c.name === column);
      if (!exists) {
        db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${colDef}`).run();
      }
    } catch (e) {
      console.warn(`Migration notice for ${table}.${column}:`, e.message);
    }
  };

  // Leads
  addColumnIfNotExists('leads', 'city', 'TEXT');
  addColumnIfNotExists('leads', 'total_debt', 'REAL DEFAULT 0');
  addColumnIfNotExists('leads', 'monthly_income', 'REAL DEFAULT 0');
  addColumnIfNotExists('leads', 'service_needed', 'TEXT');
  addColumnIfNotExists('leads', 'paying_emis', "TEXT DEFAULT 'Yes'");
  addColumnIfNotExists('leads', 'harassment_calls', "TEXT DEFAULT 'No'");
  addColumnIfNotExists('leads', 'employment_status', "TEXT DEFAULT 'Employed'");
  addColumnIfNotExists('leads', 'employment_type', "TEXT DEFAULT 'Salaried'");
  addColumnIfNotExists('leads', 'settlement_needed', "TEXT DEFAULT 'Yes'");
  addColumnIfNotExists('leads', 'consultation_timing', 'TEXT');
  addColumnIfNotExists('leads', 'credit_card_dues', 'REAL DEFAULT 0');
  addColumnIfNotExists('leads', 'personal_loan_dues', 'REAL DEFAULT 0');
  addColumnIfNotExists('leads', 'service_fee', 'REAL DEFAULT 0');
  addColumnIfNotExists('leads', 'updated_at', 'DATETIME');

  // Clients
  addColumnIfNotExists('clients', 'lead_id', 'TEXT REFERENCES leads(id) ON DELETE SET NULL');
  addColumnIfNotExists('clients', 'city', 'TEXT');
  addColumnIfNotExists('clients', 'employment_status', "TEXT DEFAULT 'Employed'");
  addColumnIfNotExists('clients', 'employment_type', "TEXT DEFAULT 'Salaried'");
  addColumnIfNotExists('clients', 'monthly_income', 'REAL DEFAULT 0');
  addColumnIfNotExists('clients', 'credit_card_dues', 'REAL DEFAULT 0');
  addColumnIfNotExists('clients', 'personal_loan_dues', 'REAL DEFAULT 0');
  addColumnIfNotExists('clients', 'loan_type', "TEXT DEFAULT 'Credit Card & Personal Loan'");
  addColumnIfNotExists('clients', 'paying_emis', "TEXT DEFAULT 'Yes'");
  addColumnIfNotExists('clients', 'harassment_calls', "TEXT DEFAULT 'No'");
  addColumnIfNotExists('clients', 'settlement_needed', "TEXT DEFAULT 'Yes'");
  addColumnIfNotExists('clients', 'consultation_timing', 'TEXT');
  addColumnIfNotExists('clients', 'sx_fee', 'REAL DEFAULT 0');
  addColumnIfNotExists('clients', 'fees_date', 'TEXT');
  addColumnIfNotExists('clients', 'fees_status', "TEXT DEFAULT 'Pending'");
  addColumnIfNotExists('clients', 'pending_amount', 'REAL DEFAULT 0');
  addColumnIfNotExists('clients', 'total_received', 'REAL DEFAULT 0');
  addColumnIfNotExists('clients', 'case_status', "TEXT DEFAULT 'active'");
  addColumnIfNotExists('clients', 'notes', 'TEXT');
  addColumnIfNotExists('clients', 'updated_at', 'DATETIME');

  // Agreements
  addColumnIfNotExists('agreements', 'name', 'TEXT');
  addColumnIfNotExists('agreements', 'phone', 'TEXT');
  addColumnIfNotExists('agreements', 'email', 'TEXT');
  addColumnIfNotExists('agreements', 'address', 'TEXT');
  addColumnIfNotExists('agreements', 'pin_number', 'TEXT');
  addColumnIfNotExists('agreements', 'dob', 'TEXT');
  addColumnIfNotExists('agreements', 'monthly_fee', 'REAL DEFAULT 0');
  addColumnIfNotExists('agreements', 'resolution_duration', 'TEXT');
  addColumnIfNotExists('agreements', 'prepared_by', 'TEXT');
  addColumnIfNotExists('agreements', 'agreement_body', 'TEXT');
  addColumnIfNotExists('agreements', 'updated_at', 'DATETIME');

  // Users Security & Lockout Fields (Super Admin Protection)
  addColumnIfNotExists('users', 'failed_login_attempts', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('users', 'locked_until', 'DATETIME');
  addColumnIfNotExists('users', 'last_failed_login_at', 'DATETIME');
  addColumnIfNotExists('users', 'last_login_at', 'DATETIME');

  // Audit Logs Security Metadata
  addColumnIfNotExists('audit_logs', 'ip_address', 'TEXT');
  addColumnIfNotExists('audit_logs', 'user_agent', 'TEXT');
}

function seedDefaultData() {
  const adminCheck = db.prepare(`SELECT id FROM users WHERE email = ?`).get('settlexperts@gmail.com');

  if (!adminCheck) {
    console.log('Seeding initial Settl Expert database data...');

    // 1. Departments
    const depts = [
      { id: 'dept-hr', name: 'Human Resources', code: 'HR', description: 'Talent acquisition, employee welfare & policy governance' },
      { id: 'dept-legal', name: 'Legal / Advocate', code: 'LEGAL', description: 'Legal compliance, notice management & advocate coordination' },
      { id: 'dept-fin', name: 'Finance', code: 'FIN', description: 'Fee billing, accounts, payment verification & collections' },
      { id: 'dept-coll', name: 'Collection', code: 'COLL', description: 'Debt negotiation, recovery resolution & collection pipelines' },
      { id: 'dept-ops', name: 'Operations', code: 'OPS', description: 'Case handling, documentation, agreement validation & task flow' },
      { id: 'dept-sales', name: 'Sales', code: 'SALES', description: 'Client onboarding, lead conversion & consultation' }
    ];

    const insertDept = db.prepare(`INSERT OR IGNORE INTO departments (id, name, code, description, status) VALUES (?, ?, ?, ?, 'active')`);
    for (const d of depts) {
      insertDept.run(d.id, d.name, d.code, d.description);
    }

    // 2. Manager Types
    const mgrTypes = [
      { id: 'mt-hr', name: 'HR', code: 'HR', desc: 'Human Resources Manager' },
      { id: 'mt-legal', name: 'Legal / Advocate', code: 'LEGAL', desc: 'Legal and Advocate Oversight Manager' },
      { id: 'mt-fin', name: 'Finance', code: 'FIN', desc: 'Financial & Payment Verification Manager' },
      { id: 'mt-coll', name: 'Collection', code: 'COLL', desc: 'Settlement & Collection Strategy Manager' },
      { id: 'mt-ops', name: 'Operations', code: 'OPS', desc: 'Operations & Workflow Process Manager' },
      { id: 'mt-sales', name: 'Sales', code: 'SALES', desc: 'Sales & Growth Acquisition Manager' },
      { id: 'mt-custom', name: 'Custom', code: 'CUSTOM', desc: 'Custom Tailored Role Manager' }
    ];

    const insertMgrType = db.prepare(`INSERT OR IGNORE INTO manager_types (id, name, code, description, permissions_json, status) VALUES (?, ?, ?, ?, ?, 'active')`);
    for (const mt of mgrTypes) {
      const defaultPerms = JSON.stringify({
        dashboard: { view: true },
        employees: { view: true, create: true, edit: true },
        leads: { view: true, edit: true, assign: true },
        clients: { view: true, edit: true },
        agreements: { view: true },
        advocates: { view: mt.code === 'LEGAL' },
        finance: { view: mt.code === 'FIN' },
        payments: { view: mt.code === 'FIN', verify: mt.code === 'FIN' },
        tasks: { view: true, create: true, edit: true },
        documents: { view: true, create: true },
        reports: { view: true },
        audit: { view: false }
      });
      insertMgrType.run(mt.id, mt.name, mt.code, mt.desc, defaultPerms);
    }

    // 3. Super Admin User
    const adminPasswordHash = bcrypt.hashSync('settlexpert931075@Abc', 10);
    db.prepare(`
      INSERT OR IGNORE INTO users (id, name, email, phone, password_hash, role, emp_or_mgr_id, status, joining_date)
      VALUES (?, ?, ?, ?, ?, 'admin', 'ADM-001', 'active', '2025-01-01')
    `).run('4', 'Admin User', 'settlexperts@gmail.com', '+91 9876543210', adminPasswordHash);

    // 4. Default Fee Plans
    const plans = [
      { id: 'plan-1m', name: '1 Month Accelerated Resolution', dur: '1 Month', fee: 15000 },
      { id: 'plan-2m', name: '2 Months Standard Settlement', dur: '2 Months', fee: 25000 },
      { id: 'plan-4m', name: '4 Months Structured Relief', dur: '4 Months', fee: 40000 },
      { id: 'plan-6m', name: '6 Months Comprehensive Protection', dur: '6 Months', fee: 55000 },
      { id: 'plan-12m', name: '12 Months Complete Shield', dur: '12 Months', fee: 85000 },
      { id: 'plan-life', name: 'Lifetime Advisory & Legal Shield', dur: 'Lifetime', fee: 120000 },
      { id: 'plan-cust', name: 'Custom Enterprise Portfolio', dur: 'Custom', fee: 50000 }
    ];

    const insertPlan = db.prepare(`INSERT OR IGNORE INTO fee_plans (id, name, duration, default_fee, status) VALUES (?, ?, ?, ?, 'active')`);
    for (const p of plans) {
      insertPlan.run(p.id, p.name, p.dur, p.fee);
    }

    // 5. Initial Clean System Audit Log
    db.prepare(`
      INSERT INTO audit_logs (id, user_name, role, action, module, record_id, details_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('aud-init', 'Master Administrator', 'admin', 'System Initialized', 'System', 'SYS-INIT', 'Clean Production Dataset Initialized with Super Admin Control');

    console.log('Production database schema ready with Super Admin account.');
  }
}

function ensureAdvocateData() {
  // No-op in clean production environment (Advocates created via Staff / Advocate Management)
}

function ensureMonthlyPaymentSchedules() {
  try {
    const agreements = db.prepare(`SELECT * FROM agreements`).all();
    for (const agr of agreements) {
      if (!agr.client_id) continue;

      const durStr = agr.resolution_duration || '6 Months';
      const durMatch = durStr.match(/(\d+)/);
      const durNum = durMatch ? parseInt(durMatch[1], 10) : 6;

      let monthlyFee = 8000;
      if (agr.monthly_fee && agr.monthly_fee > 0) {
        monthlyFee = agr.monthly_fee;
      } else if (agr.total_fee && agr.total_fee > 15000 && durNum > 0) {
        monthlyFee = agr.total_fee / durNum;
      } else if (agr.total_fee && agr.total_fee > 0) {
        monthlyFee = agr.total_fee;
      }

      const totalAgreementFee = monthlyFee * durNum;
      db.prepare(`UPDATE agreements SET monthly_fee = ?, total_fee = ? WHERE id = ?`).run(monthlyFee, totalAgreementFee, agr.id);
      db.prepare(`UPDATE clients SET sx_fee = ?, pending_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
        .run(totalAgreementFee, totalAgreementFee, agr.client_id);

      const existing = db.prepare(`SELECT * FROM monthly_payment_records WHERE client_id = ? ORDER BY month_number ASC`).all(agr.client_id);

      if (!existing || existing.length === 0) {
        const baseDate = new Date(agr.start_date || agr.created_at || '2026-08-01');
        const insertStmt = db.prepare(`
          INSERT INTO monthly_payment_records (
            id, client_id, agreement_id, month_number, due_date, expected_amount, received_amount, payment_status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, 0, 'Pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `);

        for (let i = 0; i < durNum; i++) {
          const d = new Date(baseDate);
          d.setMonth(baseDate.getMonth() + i);
          const dueDateStr = d.toISOString().split('T')[0];
          const recId = 'mpr-' + (agr.client_id ? agr.client_id.slice(-6) : 'cli') + '-m' + (i + 1);
          insertStmt.run(recId, agr.client_id, agr.id, i + 1, dueDateStr, monthlyFee);
        }
      } else {
        // Enforce that expected_amount = monthlyFee (e.g. 8000) for every month
        db.prepare(`UPDATE monthly_payment_records SET expected_amount = ? WHERE client_id = ?`).run(monthlyFee, agr.client_id);
      }
    }
  } catch (err) {
    console.warn('Notice in ensureMonthlyPaymentSchedules:', err.message);
  }
}

function runPaymentDueCheck(targetDateStr) {
  try {
    const todayStr = targetDateStr || new Date().toISOString().split('T')[0];
    const today = new Date(todayStr);

    const records = db.prepare(`
      SELECT 
        mpr.*,
        c.name as client_name,
        c.client_number,
        c.phone as client_phone,
        c.employee_id,
        u.name as employee_name
      FROM monthly_payment_records mpr
      JOIN clients c ON mpr.client_id = c.id
      LEFT JOIN users u ON c.employee_id = u.id
      ORDER BY mpr.due_date ASC
    `).all();

    const insertNotification = db.prepare(`
      INSERT INTO payment_due_notifications (
        id, client_id, agreement_id, monthly_record_id, month_number, notification_type,
        title, message, due_date, expected_amount, received_amount, pending_amount,
        days_overdue, status, is_read, employee_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(client_id, month_number, due_date, notification_type) DO UPDATE SET
        expected_amount = excluded.expected_amount,
        received_amount = excluded.received_amount,
        pending_amount = excluded.pending_amount,
        days_overdue = excluded.days_overdue,
        status = excluded.status,
        message = excluded.message,
        employee_id = excluded.employee_id,
        updated_at = CURRENT_TIMESTAMP
    `);

    const resolveNotifications = db.prepare(`
      UPDATE payment_due_notifications 
      SET status = 'resolved', updated_at = CURRENT_TIMESTAMP
      WHERE client_id = ? AND month_number = ? AND notification_type != 'PAYMENT_RECEIVED'
    `);

    for (const r of records) {
      const dueDate = new Date(r.due_date);
      // Day difference (today - dueDate) in whole days
      const diffTime = today.getTime() - dueDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      const expected = r.expected_amount || 8000;
      const received = r.received_amount || 0;
      const pending = Math.max(0, expected - received);
      const employeeId = r.employee_id || null;
      const clientName = r.client_name || 'Client';

      // 1. If fully paid
      if (received >= expected && expected > 0) {
        resolveNotifications.run(r.client_id, r.month_number);

        // Create/update PAYMENT_RECEIVED notification
        const notifId = `notif-rec-${r.id}`;
        const title = `Payment Received`;
        const msg = `Payment of ₹${received.toLocaleString('en-IN')} successfully received for Month ${r.month_number} (${r.due_date}) for ${clientName}. Status: Paid.`;
        insertNotification.run(
          notifId, r.client_id, r.agreement_id || null, r.id, r.month_number,
          'PAYMENT_RECEIVED', title, msg, r.due_date, expected, received, 0,
          0, 'resolved', employeeId
        );
        continue;
      }

      // 2. If due today (diffDays === 0)
      if (diffDays === 0) {
        if (received === 0) {
          const notifId = `notif-due-${r.id}`;
          const title = `Payment Due Today`;
          const msg = `Monthly SettleXpert fee of ₹${expected.toLocaleString('en-IN')} is due today (${r.due_date}) for ${clientName}. Payment not received.`;
          insertNotification.run(
            notifId, r.client_id, r.agreement_id || null, r.id, r.month_number,
            'PAYMENT_DUE_TODAY', title, msg, r.due_date, expected, 0, expected,
            0, 'active', employeeId
          );
        } else if (received > 0 && received < expected) {
          const notifId = `notif-part-${r.id}`;
          const title = `Partial Payment Due`;
          const msg = `₹${received.toLocaleString('en-IN')} received, ₹${pending.toLocaleString('en-IN')} pending for ${clientName}. Due today (${r.due_date}).`;
          insertNotification.run(
            notifId, r.client_id, r.agreement_id || null, r.id, r.month_number,
            'PARTIAL_PAYMENT', title, msg, r.due_date, expected, received, pending,
            0, 'active', employeeId
          );
        }
      }
      // 3. If overdue (diffDays > 0)
      else if (diffDays > 0) {
        // Resolve due today if it existed
        db.prepare(`
          UPDATE payment_due_notifications 
          SET status = 'resolved', updated_at = CURRENT_TIMESTAMP
          WHERE client_id = ? AND month_number = ? AND notification_type = 'PAYMENT_DUE_TODAY'
        `).run(r.client_id, r.month_number);

        if (received === 0) {
          const notifId = `notif-od-${r.id}`;
          const title = `Payment Overdue`;
          const msg = `Payment of ₹${pending.toLocaleString('en-IN')} for ${clientName} was due on ${r.due_date} and is overdue by ${diffDays} day(s).`;
          insertNotification.run(
            notifId, r.client_id, r.agreement_id || null, r.id, r.month_number,
            'PAYMENT_OVERDUE', title, msg, r.due_date, expected, 0, pending,
            diffDays, 'active', employeeId
          );
        } else if (received > 0 && received < expected) {
          const notifId = `notif-part-od-${r.id}`;
          const title = `Partial Payment Overdue`;
          const msg = `₹${received.toLocaleString('en-IN')} received, ₹${pending.toLocaleString('en-IN')} pending for ${clientName}. Overdue by ${diffDays} day(s).`;
          insertNotification.run(
            notifId, r.client_id, r.agreement_id || null, r.id, r.month_number,
            'PARTIAL_PAYMENT', title, msg, r.due_date, expected, received, pending,
            diffDays, 'active', employeeId
          );
        }
      }
    }
  } catch (err) {
    console.warn('Notice in runPaymentDueCheck:', err.message);
  }
}

// Call on startup
initDatabase();

module.exports = db;
module.exports.runPaymentDueCheck = runPaymentDueCheck;

