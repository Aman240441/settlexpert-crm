-- ============================================================================
-- SETTLEXPERT — CENTRALIZED PRODUCTION POSTGRESQL SCHEMA FOR SUPABASE
-- ============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  head_manager_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Manager Types Table
CREATE TABLE IF NOT EXISTS manager_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions_json TEXT DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Users Table (Admin, Managers, Employees, Advocates)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'employee', 'advocate')),
  manager_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
  team_id TEXT,
  manager_type_id TEXT REFERENCES manager_types(id) ON DELETE SET NULL,
  emp_or_mgr_id TEXT UNIQUE,
  profile_image TEXT,
  joining_date TEXT,
  id_type TEXT,
  id_front TEXT,
  id_back TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_failed_login_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for departments.head_manager_id
ALTER TABLE departments 
DROP CONSTRAINT IF EXISTS fk_departments_head_manager;
ALTER TABLE departments 
ADD CONSTRAINT fk_departments_head_manager FOREIGN KEY (head_manager_id) REFERENCES users(id) ON DELETE SET NULL;

-- 4. Teams Table
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
  manager_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for users.team_id
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS fk_users_team;
ALTER TABLE users 
ADD CONSTRAINT fk_users_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;

-- 5. User Permissions Table
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

-- 6. Advocates Table
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
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Fee Plans Table
CREATE TABLE IF NOT EXISTS fee_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  duration TEXT NOT NULL,
  default_fee NUMERIC(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_name TEXT,
  role TEXT,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  record_id TEXT,
  details_json TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Leads Table
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  lead_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  city TEXT,
  state TEXT,
  total_debt NUMERIC(12, 2) DEFAULT 0,
  monthly_income NUMERIC(12, 2) DEFAULT 0,
  service_needed TEXT,
  paying_emis TEXT DEFAULT 'Yes',
  harassment_calls TEXT DEFAULT 'No',
  employment_status TEXT DEFAULT 'Employed',
  employment_type TEXT DEFAULT 'Salaried',
  settlement_needed TEXT DEFAULT 'Yes',
  consultation_timing TEXT,
  credit_card_dues NUMERIC(12, 2) DEFAULT 0,
  personal_loan_dues NUMERIC(12, 2) DEFAULT 0,
  service_fee NUMERIC(12, 2) DEFAULT 0,
  bank_name TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'interested', 'in_progress', 'converted', 'dropped', 'unassigned')),
  manager_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  employee_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Follow-ups Table
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Clients Table
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
  total_debt NUMERIC(12, 2) DEFAULT 0,
  monthly_income NUMERIC(12, 2) DEFAULT 0,
  credit_card_dues NUMERIC(12, 2) DEFAULT 0,
  personal_loan_dues NUMERIC(12, 2) DEFAULT 0,
  loan_type TEXT DEFAULT 'Credit Card & Personal Loan',
  paying_emis TEXT DEFAULT 'Yes',
  harassment_calls TEXT DEFAULT 'No',
  settlement_needed TEXT DEFAULT 'Yes',
  consultation_timing TEXT,
  settlement_target NUMERIC(12, 2) DEFAULT 0,
  sx_fee NUMERIC(12, 2) DEFAULT 0,
  fees_date TEXT,
  fees_status TEXT DEFAULT 'Pending',
  pending_amount NUMERIC(12, 2) DEFAULT 0,
  total_received NUMERIC(12, 2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'dropped', 'closed')),
  case_status TEXT DEFAULT 'active' CHECK (case_status IN ('active', 'closed', 'on_hold', 'dropped')),
  notes TEXT,
  employee_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  manager_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  advocate_id TEXT REFERENCES advocates(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Lenders Table (Multiple Lenders per Client)
CREATE TABLE IF NOT EXISTS lenders (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  loan_type TEXT,
  balance NUMERIC(12, 2) DEFAULT 0,
  default_date TEXT,
  status TEXT DEFAULT 'Defaulted',
  lender_email TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Agreements Table
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
  total_fee NUMERIC(12, 2) NOT NULL,
  monthly_fee NUMERIC(12, 2) DEFAULT 0,
  resolution_duration TEXT,
  prepared_by TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed', 'active', 'completed', 'cancelled')),
  agreement_body TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Monthly Payment Records Table
CREATE TABLE IF NOT EXISTS monthly_payment_records (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  agreement_id TEXT REFERENCES agreements(id) ON DELETE SET NULL,
  month_number INTEGER NOT NULL,
  due_date TEXT NOT NULL,
  expected_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  received_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_date TEXT,
  payment_status TEXT NOT NULL DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Partially Paid', 'Paid', 'Overdue')),
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Monthly Payment History Table
CREATE TABLE IF NOT EXISTS monthly_payment_history (
  id TEXT PRIMARY KEY,
  monthly_record_id TEXT NOT NULL REFERENCES monthly_payment_records(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  agreement_id TEXT REFERENCES agreements(id) ON DELETE SET NULL,
  month_number INTEGER NOT NULL,
  payment_date TEXT NOT NULL,
  amount_received NUMERIC(12, 2) NOT NULL,
  cumulative_received NUMERIC(12, 2) NOT NULL,
  payment_status TEXT NOT NULL,
  remarks TEXT,
  updated_by_id TEXT,
  updated_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Payments Table (Receipts)
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  receipt_number TEXT UNIQUE,
  client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
  agreement_id TEXT REFERENCES agreements(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending_verification' CHECK (status IN ('pending_verification', 'verified', 'rejected')),
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  payment_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  module TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Advocate Assignment History Table
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Payment Due Notifications Table
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
  expected_amount NUMERIC(12, 2) NOT NULL DEFAULT 8000,
  received_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  pending_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  days_overdue INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'resolved')),
  is_read INTEGER NOT NULL DEFAULT 0,
  employee_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, month_number, due_date, notification_type)
);

-- 20. Lead Imports & Distributions Tables
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
  created_at TIMESTAMPTZ DEFAULT NOW()
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. Staff Profiles, KYC & Advocate Details
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_kyc (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  aadhaar_number TEXT,
  aadhaar_front_doc TEXT,
  aadhaar_back_doc TEXT,
  kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_advocate_details (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  registration_number TEXT,
  bar_council_state TEXT,
  specialization TEXT,
  years_experience INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_manager ON users(manager_id);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_employee ON leads(employee_id);
CREATE INDEX IF NOT EXISTS idx_leads_manager ON leads(manager_id);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);
CREATE INDEX IF NOT EXISTS idx_clients_employee ON clients(employee_id);
CREATE INDEX IF NOT EXISTS idx_clients_manager ON clients(manager_id);
CREATE INDEX IF NOT EXISTS idx_clients_advocate ON clients(advocate_id);
CREATE INDEX IF NOT EXISTS idx_lenders_client ON lenders(client_id);
CREATE INDEX IF NOT EXISTS idx_agreements_created_at ON agreements(created_at);
CREATE INDEX IF NOT EXISTS idx_agreements_client ON agreements(client_id);
CREATE INDEX IF NOT EXISTS idx_mpr_client ON monthly_payment_records(client_id);
CREATE INDEX IF NOT EXISTS idx_mph_client ON monthly_payment_history(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_client ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_pdn_client ON payment_due_notifications(client_id);
CREATE INDEX IF NOT EXISTS idx_pdn_status ON payment_due_notifications(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
