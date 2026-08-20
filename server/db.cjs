const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_FILE = path.join(__dirname, 'crm.sqlite');

let db = null;

async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();
  if (fs.existsSync(DB_FILE)) {
    const fileBuffer = fs.readFileSync(DB_FILE);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Initialize tables
  initSchema(db);
  migrateSchema(db);
  seedInitialData(db);
  saveDb();

  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_FILE, buffer);
}

function initSchema(database) {
  database.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      employee_id TEXT DEFAULT '',
      email TEXT UNIQUE NOT NULL,
      phone TEXT DEFAULT '',
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'EMPLOYEE',
      department TEXT DEFAULT '',
      designation TEXT DEFAULT '',
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id TEXT UNIQUE,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      city TEXT,
      outstanding_amount TEXT,
      monthly_income REAL DEFAULT 0,
      loan_type TEXT,
      default_status TEXT DEFAULT 'yes',
      harassment_calls TEXT DEFAULT 'yes',
      assigned_to INTEGER DEFAULT NULL,
      assigned_consultant TEXT DEFAULT 'Dhruv',
      source TEXT DEFAULT 'Website',
      lead_status TEXT DEFAULT 'New',
      notes TEXT,
      import_batch_id TEXT DEFAULT NULL,
      imported_at DATETIME DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id TEXT UNIQUE,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      city TEXT,
      pan TEXT,
      dob TEXT DEFAULT '',
      address TEXT,
      service_fee REAL DEFAULT 0,
      fees_date TEXT,
      fees_status TEXT DEFAULT 'Pending',
      pending_amount REAL DEFAULT 0,
      received_amount REAL DEFAULT 0,
      this_month_received REAL DEFAULT 0,
      case_status TEXT DEFAULT 'Active',
      assigned_consultant TEXT DEFAULT 'Dhruv',
      assigned_advocate TEXT DEFAULT 'Adv Sparsh Gupta',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS agreements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id_ref INTEGER,
      client_name TEXT,
      email TEXT,
      phone TEXT,
      pan TEXT,
      dob TEXT DEFAULT '',
      agreement_duration TEXT DEFAULT '6 Months',
      resolution_duration TEXT DEFAULT '6 Months',
      consultancy_fee REAL DEFAULT 0,
      lender TEXT,
      loan_account_number TEXT,
      loan_amount REAL DEFAULT 0,
      loan_type TEXT,
      agreement_date TEXT,
      status TEXT DEFAULT 'Active',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      payment_status TEXT DEFAULT 'Completed',
      payment_method TEXT DEFAULT 'Bank Transfer',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_name TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lead_import_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id TEXT UNIQUE NOT NULL,
      filename TEXT NOT NULL,
      employee_id INTEGER,
      employee_name TEXT,
      distribution_mode TEXT DEFAULT 'single',
      total_rows INTEGER DEFAULT 0,
      imported_count INTEGER DEFAULT 0,
      skipped_count INTEGER DEFAULT 0,
      error_count INTEGER DEFAULT 0,
      admin_id INTEGER,
      admin_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lead_assignment_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      previous_employee_id INTEGER,
      previous_employee_name TEXT,
      new_employee_id INTEGER,
      new_employee_name TEXT,
      changed_by_id INTEGER,
      changed_by_name TEXT,
      action_type TEXT DEFAULT 'ASSIGN',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employee_targets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      month TEXT NOT NULL,
      lead_target INTEGER DEFAULT 0,
      conversion_target INTEGER DEFAULT 0,
      client_target INTEGER DEFAULT 0,
      agreement_target INTEGER DEFAULT 0,
      followup_target INTEGER DEFAULT 0,
      collection_target REAL DEFAULT 0,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(employee_id, month)
    );

    CREATE INDEX IF NOT EXISTS idx_employee_targets_emp_month ON employee_targets(employee_id, month);
    CREATE INDEX IF NOT EXISTS idx_leads_import_batch_id ON leads(import_batch_id);
  `);
}

// Migration: Add new columns to existing users table if they don't exist
function migrateSchema(database) {
  const columnsToAdd = [
    { name: 'employee_id', def: "TEXT DEFAULT ''" },
    { name: 'phone', def: "TEXT DEFAULT ''" },
    { name: 'department', def: "TEXT DEFAULT ''" },
    { name: 'designation', def: "TEXT DEFAULT ''" },
    { name: 'profile_photo', def: "TEXT DEFAULT ''" },
    { name: 'joining_date', def: "TEXT DEFAULT ''" },
    { name: 'aadhaar_number', def: "TEXT DEFAULT ''" },
    { name: 'aadhaar_front_document', def: "TEXT DEFAULT ''" },
    { name: 'aadhaar_back_document', def: "TEXT DEFAULT ''" },
    { name: 'employment_status', def: "TEXT DEFAULT 'active'" }
  ];

  // Get existing columns
  const tableInfo = database.exec("PRAGMA table_info(users)");
  const existingCols = tableInfo.length > 0 ? tableInfo[0].values.map(row => row[1]) : [];

  for (const col of columnsToAdd) {
    if (!existingCols.includes(col.name)) {
      try {
        database.run(`ALTER TABLE users ADD COLUMN ${col.name} ${col.def}`);
      } catch (e) {
        // Column may already exist
      }
    }
  }

  // Migrate old roles to new uppercase format
  database.run("UPDATE users SET role = 'ADMIN' WHERE role = 'admin'");
  database.run("UPDATE users SET role = 'EMPLOYEE' WHERE role = 'consultant' OR role = 'employee'");

  // Migrate leads table for assigned_to, source, import_batch_id, imported_at
  const leadsInfo = database.exec("PRAGMA table_info(leads)");
  const existingLeadCols = leadsInfo.length > 0 ? leadsInfo[0].values.map(row => row[1]) : [];
  if (!existingLeadCols.includes('assigned_to')) {
    try { database.run("ALTER TABLE leads ADD COLUMN assigned_to INTEGER DEFAULT NULL"); } catch (e) { }
  }
  if (!existingLeadCols.includes('source')) {
    try { database.run("ALTER TABLE leads ADD COLUMN source TEXT DEFAULT 'Website'"); } catch (e) { }
  }
  if (!existingLeadCols.includes('imported_at')) {
    try { database.run("ALTER TABLE leads ADD COLUMN imported_at DATETIME DEFAULT NULL"); } catch (e) { }
  }
  if (!existingLeadCols.includes('import_batch_id')) {
    try { database.run("ALTER TABLE leads ADD COLUMN import_batch_id TEXT DEFAULT NULL"); } catch (e) { }
  }

  // Migrate clients table for dob
  try { database.run("ALTER TABLE clients ADD COLUMN dob TEXT DEFAULT ''"); } catch (e) { }

  // Migrate agreements table for dob, agreement_duration, resolution_duration, consultancy_fee
  try { database.run("ALTER TABLE agreements ADD COLUMN dob TEXT DEFAULT ''"); } catch (e) { }
  try { database.run("ALTER TABLE agreements ADD COLUMN agreement_duration TEXT DEFAULT '6 Months'"); } catch (e) { }
  try { database.run("ALTER TABLE agreements ADD COLUMN resolution_duration TEXT DEFAULT '6 Months'"); } catch (e) { }
  try { database.run("ALTER TABLE agreements ADD COLUMN consultancy_fee REAL DEFAULT 0"); } catch (e) { }

  // Create lead_import_history if not exists
  database.run(`
    CREATE TABLE IF NOT EXISTS lead_import_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id TEXT UNIQUE NOT NULL,
      filename TEXT NOT NULL,
      employee_id INTEGER,
      employee_name TEXT,
      distribution_mode TEXT DEFAULT 'single',
      total_rows INTEGER DEFAULT 0,
      imported_count INTEGER DEFAULT 0,
      skipped_count INTEGER DEFAULT 0,
      error_count INTEGER DEFAULT 0,
      admin_id INTEGER,
      admin_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add distribution_mode column to lead_import_history if missing
  const importHistInfo = database.exec("PRAGMA table_info(lead_import_history)");
  const importHistCols = importHistInfo.length > 0 ? importHistInfo[0].values.map(row => row[1]) : [];
  if (!importHistCols.includes('distribution_mode')) {
    try { database.run("ALTER TABLE lead_import_history ADD COLUMN distribution_mode TEXT DEFAULT 'single'"); } catch (e) { }
  }

  // Create lead_assignment_history if not exists
  database.run(`
    CREATE TABLE IF NOT EXISTS lead_assignment_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      previous_employee_id INTEGER,
      previous_employee_name TEXT,
      new_employee_id INTEGER,
      new_employee_name TEXT,
      changed_by_id INTEGER,
      changed_by_name TEXT,
      action_type TEXT DEFAULT 'ASSIGN',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create employee_targets if not exists
  database.run(`
    CREATE TABLE IF NOT EXISTS employee_targets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      month TEXT NOT NULL,
      lead_target INTEGER DEFAULT 0,
      conversion_target INTEGER DEFAULT 0,
      client_target INTEGER DEFAULT 0,
      agreement_target INTEGER DEFAULT 0,
      followup_target INTEGER DEFAULT 0,
      collection_target REAL DEFAULT 0,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(employee_id, month)
    );
  `);
  try {
    database.run("CREATE INDEX IF NOT EXISTS idx_employee_targets_emp_month ON employee_targets(employee_id, month)");
  } catch (e) { }
  try {
    database.run("CREATE INDEX IF NOT EXISTS idx_leads_import_batch_id ON leads(import_batch_id)");
  } catch (e) { }

  // Migrate clients table for assigned_to
  const clientsInfo = database.exec("PRAGMA table_info(clients)");
  const existingClientCols = clientsInfo.length > 0 ? clientsInfo[0].values.map(row => row[1]) : [];
  if (!existingClientCols.includes('assigned_to')) {
    try { database.run("ALTER TABLE clients ADD COLUMN assigned_to INTEGER DEFAULT NULL"); } catch (e) { }
  }

  // Migrate agreements table for assigned_to
  const agreementsInfo = database.exec("PRAGMA table_info(agreements)");
  const existingAgreementCols = agreementsInfo.length > 0 ? agreementsInfo[0].values.map(row => row[1]) : [];
  if (!existingAgreementCols.includes('assigned_to')) {
    try { database.run("ALTER TABLE agreements ADD COLUMN assigned_to INTEGER DEFAULT NULL"); } catch (e) { }
  }

  // Link any existing assigned_consultant to users.id if matching
  try {
    database.run("UPDATE leads SET assigned_to = (SELECT id FROM users WHERE users.name = leads.assigned_consultant LIMIT 1) WHERE assigned_to IS NULL AND assigned_consultant IS NOT NULL AND assigned_consultant != ''");
  } catch (e) { }
  try {
    database.run("UPDATE clients SET assigned_to = (SELECT id FROM users WHERE users.name = clients.assigned_consultant LIMIT 1) WHERE assigned_to IS NULL AND assigned_consultant IS NOT NULL AND assigned_consultant != ''");
  } catch (e) { }
  try {
    database.run("UPDATE agreements SET assigned_to = (SELECT assigned_to FROM clients WHERE clients.name = agreements.client_name LIMIT 1) WHERE assigned_to IS NULL AND client_name IS NOT NULL");
  } catch (e) { }
}

function seedInitialData(database) {
  // Check and create/update admin account
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync('settlexpert931075@Abc', salt);

  const resAdmin = database.exec("SELECT id FROM users WHERE role = 'ADMIN' OR email = 'settlexperts@gmail.com' OR email = 'admin@settlexpert.com' OR email = 'admin@reduceddebts.in'");
  if (resAdmin && resAdmin[0] && resAdmin[0].values.length > 0) {
    const adminId = resAdmin[0].values[0][0];
    database.run(
      "UPDATE users SET email = 'settlexperts@gmail.com', password_hash = ?, role = 'ADMIN', status = 'active' WHERE id = ?",
      [hash, adminId]
    );
  } else {
    database.run(
      "INSERT OR IGNORE INTO users (name, employee_id, email, phone, password_hash, role, department, designation, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      ['Admin User', 'ADMIN-001', 'settlexperts@gmail.com', '', hash, 'ADMIN', 'Management', 'Administrator', 'active']
    );
  }

  // CRM tables remain empty by default (no dummy data seeded)
  // Admin and employees will create their own clients, leads, agreements, etc.
}

function queryAll(database, sql, params = []) {
  const stmt = database.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function queryOne(database, sql, params = []) {
  const rows = queryAll(database, sql, params);
  return rows.length > 0 ? rows[0] : null;
}

function executeRun(database, sql, params = []) {
  database.run(sql, params);
  const res = database.exec("SELECT last_insert_rowid() as id");
  const id = res[0]?.values[0][0] || 0;
  saveDb();
  return id;
}

module.exports = {
  getDb,
  saveDb,
  queryAll,
  queryOne,
  executeRun
};
