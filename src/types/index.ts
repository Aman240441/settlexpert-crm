export type Role = 'admin' | 'manager' | 'employee' | 'advocate';

export type StaffType = 'Employee' | 'Manager' | 'Advocate' | 'Consultant' | 'Other Staff';
export type EmploymentStatus = 'Active' | 'Inactive' | 'Suspended' | 'Resigned';
export type KYCStatus = 'pending' | 'uploaded' | 'verified';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  emp_or_mgr_id?: string;
  profile_image?: string;
  department_id?: string;
  department_name?: string;
  department_code?: string;
  manager_id?: string;
  manager_name?: string;
  manager_code?: string;
  team_id?: string;
  team_name?: string;
  manager_type_id?: string;
  manager_type_name?: string;
  manager_type_code?: string;
  designation?: string;
  joining_date?: string;
  id_type?: string;
  id_front?: string;
  id_back?: string;
  status: 'active' | 'inactive';
  employee_count?: number;
  lead_count?: number;
  client_count?: number;
  created_at?: string;
}

export interface StaffProfile extends User {
  // Extended personal
  date_of_birth?: string;
  gender?: string;
  father_name?: string;
  mother_name?: string;
  // Extended contact
  alt_phone?: string;
  whatsapp_number?: string;
  current_address?: string;
  permanent_address?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  // Professional
  designation?: string;
  employment_status?: EmploymentStatus;
  staff_type?: StaffType;
  reporting_manager_id?: string;
  reporting_manager_name?: string;
  // Advocate-specific
  registration_number?: string;
  bar_council_state?: string;
  specialization?: string;
  years_experience?: number;
  // Aadhaar (always masked in normal responses)
  aadhaar_masked?: string;   // "XXXX XXXX 1234"
  kyc_id?: string;
  kyc_status?: KYCStatus;
  kyc_meta?: {
    kyc_status: KYCStatus;
    has_front: number;
    has_back: number;
  };
}


export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  head_manager_id?: string;
  head_manager_name?: string;
  head_manager_email?: string;
  status: 'active' | 'inactive';
  manager_count?: number;
  employee_count?: number;
  team_count?: number;
  created_at?: string;
}

export interface Team {
  id: string;
  name: string;
  department_id?: string;
  department_name?: string;
  department_code?: string;
  manager_id?: string;
  manager_name?: string;
  manager_code?: string;
  status: 'active' | 'inactive';
  member_count?: number;
  members?: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string;
    emp_or_mgr_id?: string;
    status: string;
  }>;
  created_at?: string;
}

export interface ManagerType {
  id: string;
  name: string;
  code: string;
  description?: string;
  permissions_json?: string;
  status: 'active' | 'inactive';
  manager_count?: number;
  created_at?: string;
}

export interface PermissionRow {
  module: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_assign: boolean;
  can_verify: boolean;
}

export interface Advocate {
  id: string;
  name: string;
  advocate_id: string;
  mobile: string;
  email: string;
  registration_number: string;
  specialization: string;
  address?: string;
  profile_image?: string;
  status: 'active' | 'inactive';
  notes?: string;
  assigned_clients_count?: number;
  created_at?: string;
}

export interface FeePlan {
  id: string;
  name: string;
  duration: string;
  default_fee: number;
  status: 'active' | 'inactive';
  active_clients_count?: number;
  agreements_count?: number;
  created_at?: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_name: string;
  role: string;
  action: string;
  module: string;
  record_id?: string;
  details_json?: string;
  created_at: string;
}

export interface Lead {
  id: string;
  lead_number: string;
  name: string;
  email?: string;
  phone: string;
  loan_amount: number;
  bank_name?: string;
  status: string;
  manager_id?: string;
  manager_name?: string;
  employee_id?: string;
  employee_name?: string;
  department_id?: string;
  department_name?: string;
  created_by?: string;
  created_at: string;
}

export interface Client {
  id: string;
  client_number: string;
  name: string;
  email?: string;
  phone: string;
  total_debt: number;
  settlement_target: number;
  fee_plan_id?: string;
  fee_plan_name?: string;
  status: string;
  manager_id?: string;
  manager_name?: string;
  employee_id?: string;
  employee_name?: string;
  advocate_id?: string;
  advocate_name?: string;
  created_at: string;
}

export interface Agreement {
  id: string;
  agreement_number: string;
  client_id: string;
  client_name?: string;
  client_number?: string;
  client_phone?: string;
  fee_plan_id?: string;
  fee_plan_name?: string;
  fee_plan_duration?: string;
  total_fee: number;
  status: string;
  start_date?: string;
  end_date?: string;
  created_by?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  receipt_number: string;
  client_id: string;
  client_name?: string;
  client_number?: string;
  agreement_id?: string;
  agreement_number?: string;
  amount: number;
  payment_method: string;
  transaction_id?: string;
  status: string;
  verified_by?: string;
  verified_at?: string;
  payment_date: string;
  created_at: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  module?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to?: string;
  assigned_to_name?: string;
  assigned_to_code?: string;
  created_by?: string;
  created_at: string;
}

export interface DashboardStats {
  counts: {
    totalManagers: number;
    totalEmployees: number;
    totalAdvocates: number;
    totalLeads: number;
    totalClients: number;
    totalAgreements: number;
  };
  finance: {
    totalFees: number;
    totalReceived: number;
    totalPending: number;
    pendingVerificationCount: number;
    pendingVerificationAmt: number;
  };
  operations: {
    todayFollowups: number;
    pendingTasks: number;
    pendingAgreements: number;
  };
  managerOverview: Array<{
    id: string;
    name: string;
    emp_or_mgr_id: string;
    status: string;
    manager_type: string;
    department_name: string;
    employee_count: number;
    lead_count: number;
    client_count: number;
  }>;
  recentLeads: Lead[];
  recentClients: Client[];
  recentPayments: Payment[];
  recentActivity: AuditLog[];
}

export interface ClientComplaint {
  id: string;
  complaint_number: string;
  client_id: string;
  client_name: string;
  client_phone?: string;
  client_email?: string;
  complaint_type: string;
  bank_name: string;
  loan_account_no?: string;
  tweet_url?: string;
  complaint_ref_no?: string;
  screenshot_url?: string;
  file_name?: string;
  description?: string;
  status: 'Filed' | 'Under Review' | 'Resolved' | 'Closed';
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

