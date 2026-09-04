import {
  User,
  Department,
  Team,
  ManagerType,
  PermissionRow,
  Advocate,
  FeePlan,
  AuditLog,
  DashboardStats,
  Lead,
  Client,
  Agreement,
  Payment,
  TaskItem,
  StaffProfile
} from '../types';

const rawApiUrl = (import.meta as any).env?.VITE_API_URL || 
  ((import.meta as any).env?.PROD ? 'https://settlexpertcrm-api.onrender.com' : '');
const API_BASE = rawApiUrl ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api`) : '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('settl_expert_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

function toQueryString(params?: Record<string, any>): string {
  if (!params) return '';
  const cleanParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'undefined' && value !== 'null') {
      cleanParams.append(key, String(value));
    }
  });
  const str = cleanParams.toString();
  return str ? `?${str}` : '';
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ token: string; user: User; message: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  getMe: () => request<{ user: User }>('/auth/me'),
  updateProfile: (data: any) =>
    request<{ message: string }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Dashboard
  getDashboardStats: () => request<DashboardStats>('/dashboard/stats'),

  // Managers
  getManagers: (params?: { search?: string; department?: string; type?: string; status?: string }) => {
    return request<{ managers: User[] }>(`/managers${toQueryString(params)}`);
  },
  getManager: (id: string) =>
    request<{ manager: User; permissions: any[]; assignedEmployees: User[] }>(`/managers/${id}`),
  createManager: (data: any) =>
    request<{ message: string; id: string }>('/managers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateManager: (id: string, data: any) =>
    request<{ message: string }>(`/managers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  toggleManagerStatus: (id: string) =>
    request<{ message: string; status: 'active' | 'inactive' }>(`/managers/${id}/toggle-status`, {
      method: 'PATCH',
    }),
  resetManagerPassword: (id: string, new_password: string) =>
    request<{ message: string }>(`/managers/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ new_password }),
    }),

  // Employees
  getEmployees: (params?: { search?: string; department?: string; manager?: string; status?: string; team?: string }) => {
    return request<{ employees: User[] }>(`/employees${toQueryString(params)}`);
  },
  getEmployee: (id: string) => request<{ employee: User }>(`/employees/${id}`),
  createEmployee: (data: any) =>
    request<{ message: string; id: string }>('/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateEmployee: (id: string, data: any) =>
    request<{ message: string }>(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  assignEmployeeManager: (id: string, manager_id: string) =>
    request<{ message: string }>(`/employees/${id}/assign-manager`, {
      method: 'POST',
      body: JSON.stringify({ manager_id }),
    }),
  transferEmployeeManager: (id: string, data: { new_manager_id: string; new_department_id?: string; new_team_id?: string; transfer_reason?: string }) =>
    request<{ message: string }>(`/employees/${id}/transfer-manager`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  toggleEmployeeStatus: (id: string) =>
    request<{ message: string; status: 'active' | 'inactive' }>(`/employees/${id}/toggle-status`, {
      method: 'PATCH',
    }),
  resetEmployeePassword: (id: string, new_password: string) =>
    request<{ message: string }>(`/employees/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ new_password }),
    }),

  // Advocates
  getAdvocates: (params?: { search?: string; status?: string }) => {
    return request<{ advocates: Advocate[] }>(`/advocates${toQueryString(params)}`);
  },
  getAdvocate: (id: string) =>
    request<{ advocate: Advocate; assignedClients: Client[] }>(`/advocates/${id}`),
  createAdvocate: (data: any) =>
    request<{ message: string; id: string }>('/advocates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAdvocate: (id: string, data: any) =>
    request<{ message: string }>(`/advocates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  toggleAdvocateStatus: (id: string) =>
    request<{ message: string; status: 'active' | 'inactive' }>(`/advocates/${id}/toggle-status`, {
      method: 'PATCH',
    }),

  // Departments
  getDepartments: () => request<{ departments: Department[] }>('/departments'),
  createDepartment: (data: any) =>
    request<{ message: string; id: string }>('/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateDepartment: (id: string, data: any) =>
    request<{ message: string }>(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteDepartment: (id: string) =>
    request<{ message: string }>(`/departments/${id}`, {
      method: 'DELETE',
    }),

  // Teams
  getTeams: () => request<{ teams: Team[] }>('/teams'),
  createTeam: (data: any) =>
    request<{ message: string; id: string }>('/teams', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTeam: (id: string, data: any) =>
    request<{ message: string }>(`/teams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteTeam: (id: string) =>
    request<{ message: string }>(`/teams/${id}`, {
      method: 'DELETE',
    }),

  // Manager Types
  getManagerTypes: () => request<{ types: ManagerType[] }>('/manager-types'),
  createManagerType: (data: any) =>
    request<{ message: string; id: string }>('/manager-types', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateManagerType: (id: string, data: any) =>
    request<{ message: string }>(`/manager-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteManagerType: (id: string) =>
    request<{ message: string }>(`/manager-types/${id}`, {
      method: 'DELETE',
    }),

  // Permissions
  getPermissionModules: () => request<{ modules: string[] }>('/permissions/modules'),
  getUserPermissions: (userId: string) =>
    request<{ user: User; matrix: PermissionRow[] }>(`/permissions/${userId}`),
  updateUserPermissions: (userId: string, permissions: PermissionRow[]) =>
    request<{ message: string }>(`/permissions/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    }),

  // Fee Plans
  getFeePlans: () => request<{ plans: FeePlan[] }>('/fee-plans'),
  createFeePlan: (data: any) =>
    request<{ message: string; id: string }>('/fee-plans', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateFeePlan: (id: string, data: any) =>
    request<{ message: string }>(`/fee-plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  toggleFeePlanStatus: (id: string) =>
    request<{ message: string; status: 'active' | 'inactive' }>(`/fee-plans/${id}/toggle-status`, {
      method: 'PATCH',
    }),

  // Audit Logs
  getAuditLogs: (params?: { search?: string; module?: string; role?: string; date?: string; from_date?: string; to_date?: string; limit?: number; offset?: number }) => {
    return request<{ logs: AuditLog[]; total: number }>(`/audit-logs${toQueryString(params)}`);
  },

  // CRM Foundation & Operations
  getLeads: (params?: { search?: string; status?: string; date?: string; from_date?: string; to_date?: string }) => {
    return request<any>(`/crm/leads${toQueryString(params)}`);
  },
  createLead: (data: any) => request<any>('/crm/leads', { method: 'POST', body: JSON.stringify(data) }),
  getClients: (params?: { search?: string; status?: string; date?: string; from_date?: string; to_date?: string }) => {
    return request<any>(`/crm/clients${toQueryString(params)}`);
  },
  createClient: (data: any) => request<any>('/crm/clients', { method: 'POST', body: JSON.stringify(data) }),
  getAgreements: (params?: { search?: string; status?: string; date?: string; from_date?: string; to_date?: string }) => {
    return request<any>(`/crm/agreements${toQueryString(params)}`);
  },
  createAgreement: (data: any) => request<any>('/crm/agreements', { method: 'POST', body: JSON.stringify(data) }),
  createPayment: (data: any) => request<any>('/crm/payments', { method: 'POST', body: JSON.stringify(data) }),
  getPayments: (params?: { search?: string; status?: string; date?: string }) => {
    return request<any>(`/crm/payments${toQueryString(params)}`);
  },
  verifyPayment: (id: string, status: string = 'verified', notes?: string) =>
    request<any>(`/crm/payments/${id}/verify`, { method: 'PATCH', body: JSON.stringify({ status, notes }) }),
  getTasks: (params?: { status?: string }) => {
    return request<any>(`/crm/tasks${toQueryString(params)}`);
  },
  createTask: (data: any) => request<any>('/crm/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTaskStatus: (id: string, status: string) => request<any>(`/crm/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getReportsSummary: () => request<any>('/crm/reports-summary'),

  // Step 2 Employee CRM Dedicated APIs
  getCRMDashboardSummary: (params?: { date?: string; from_date?: string; to_date?: string; month?: string; year?: string }) =>
    request<any>(`/crm/dashboard/summary${toQueryString(params)}`),
  getCRMLeads: (params?: { search?: string; status?: string; date?: string; calendar_date?: string; from_date?: string; to_date?: string; page?: number; limit?: number }) => {
    return request<any>(`/crm/leads${toQueryString(params)}`);
  },
  getCRMLead: (id: string) => request<any>(`/crm/leads/${id}`),
  createCRMLead: (data: any) => request<any>('/crm/leads', { method: 'POST', body: JSON.stringify(data) }),
  updateCRMLead: (id: string, data: any) => request<any>(`/crm/leads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  createCRMFollowUp: (id: string, data: any) => request<any>(`/crm/leads/${id}/follow-up`, { method: 'POST', body: JSON.stringify(data) }),
  convertCRMLead: (id: string) => request<any>(`/crm/leads/${id}/convert`, { method: 'POST' }),
  getCRMClients: (params?: { search?: string; case_status?: string; month?: string; date?: string; calendar_date?: string; from_date?: string; to_date?: string; page?: number; limit?: number }) => {
    return request<any>(`/crm/clients${toQueryString(params)}`);
  },
  getCRMClient: (id: string) => request<any>(`/crm/clients/${id}`),
  createCRMClient: (data: any) => request<any>('/crm/clients', { method: 'POST', body: JSON.stringify(data) }),
  updateCRMClient: (id: string, data: any) => request<any>(`/crm/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  addCRMLender: (clientId: string, data: any) => request<any>(`/crm/clients/${clientId}/lenders`, { method: 'POST', body: JSON.stringify(data) }),
  deleteCRMLender: (clientId: string, lenderId: string) => request<any>(`/crm/clients/${clientId}/lenders/${lenderId}`, { method: 'DELETE' }),
  getCRMAgreements: (params?: { search?: string; status?: string; date?: string; calendar_date?: string; from_date?: string; to_date?: string; page?: number; limit?: number }) => {
    return request<any>(`/crm/agreements${toQueryString(params)}`);
  },
  createCRMAgreement: (data: any) => request<any>('/crm/agreements', { method: 'POST', body: JSON.stringify(data) }),
  updateCRMAgreement: (id: string, data: any) => request<any>(`/crm/agreements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCRMAgreement: (id: string) => request<any>(`/crm/agreements/${id}`, { method: 'DELETE' }),
  createCRMPayment: (data: any) => request<any>('/crm/payments', { method: 'POST', body: JSON.stringify(data) }),
  getCRMClientMonthlyPayments: (clientId: string) => request<any>(`/crm/clients/${clientId}/monthly-payments`),
  generateCRMMonthlyPaymentSchedule: (clientId: string, data: any) => request<any>(`/crm/clients/${clientId}/monthly-payments/generate`, { method: 'POST', body: JSON.stringify(data) }),
  updateCRMMonthlyPaymentRecord: (recordId: string, data: any) => request<any>(`/crm/monthly-payments/${recordId}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Step 3 Manager Panel APIs
  getManagerContext: () => request<any>('/manager/context'),
  getManagerDashboard: () => request<any>('/manager/dashboard'),
  getManagerTeam: () => request<any>('/manager/team'),
  resetTeamEmployeePassword: (employeeId: string, new_password: string) =>
    request<any>(`/manager/team/${employeeId}/reset-password`, { method: 'POST', body: JSON.stringify({ new_password }) }),
  getManagerLeads: (params?: { search?: string; status?: string; employee_id?: string; date?: string; from_date?: string; to_date?: string; page?: number; limit?: number }) => {
    return request<any>(`/manager/leads${toQueryString(params)}`);
  },
  assignManagerLead: (leadId: string, new_employee_id: string, reason?: string) =>
    request<any>(`/manager/leads/${leadId}/assign`, { method: 'POST', body: JSON.stringify({ new_employee_id, reason }) }),
  getManagerClients: (params?: { search?: string; case_status?: string; date?: string; from_date?: string; to_date?: string; page?: number; limit?: number }) => {
    return request<any>(`/manager/clients${toQueryString(params)}`);
  },
  assignClientAdvocate: (clientId: string, advocate_id: string) =>
    request<any>(`/manager/clients/${clientId}/advocate`, { method: 'PATCH', body: JSON.stringify({ advocate_id }) }),
  updateClientFee: (clientId: string, data: { sx_fee?: number; fees_date?: string; fees_status?: string }) =>
    request<any>(`/manager/clients/${clientId}/fee`, { method: 'PATCH', body: JSON.stringify(data) }),
  getPaymentVerificationQueue: () => request<any>('/manager/payments/verification-queue'),
  verifyManagerPayment: (paymentId: string, status: 'verified' | 'rejected', notes?: string) =>
    request<any>(`/manager/payments/${paymentId}/verify`, { method: 'PATCH', body: JSON.stringify({ status, notes }) }),
  getManagerPaymentsClients: () => request<any>('/manager/payments/clients'),
  getManagerClientMonthlyPayments: (clientId: string) => request<any>(`/manager/clients/${clientId}/monthly-payments`),
  getCRMClientPaymentHistory: (clientId: string) => request<any>(`/crm/clients/${clientId}/monthly-payments/history`),
  getManagerAdvocates: () => request<any>('/manager/advocates'),

  getManagerFollowUps: (params?: { filter?: string; employee_id?: string; date?: string }) => {
    return request<any>(`/manager/follow-ups${toQueryString(params)}`);
  },
  getManagerTasks: () => request<any>('/manager/tasks'),
  createManagerTask: (data: any) => request<any>('/manager/tasks', { method: 'POST', body: JSON.stringify(data) }),
  getManagerActivity: () => request<any>('/manager/activity'),

  // Advocate Portal Dedicated APIs
  getClientAdvocateHistory: (clientId: string) => request<any>(`/manager/clients/${clientId}/advocate-history`),
  getAdvocateDashboardSummary: () => request<any>('/advocate-portal/dashboard'),
  getAdvocateCases: (params?: { search?: string; case_status?: string; date?: string; from_date?: string; to_date?: string; page?: number; limit?: number }) => {
    return request<any>(`/advocate-portal/cases${toQueryString(params)}`);
  },
  getAdvocateCaseById: (caseId: string) => request<any>(`/advocate-portal/cases/${caseId}`),
  createAdvocateCaseTask: (caseId: string, data: { title: string; description?: string; priority?: string; due_date?: string }) =>
    request<any>(`/advocate-portal/cases/${caseId}/tasks`, { method: 'POST', body: JSON.stringify(data) }),
  getAdvocateProfile: () => request<any>('/advocate-portal/profile'),

  // Advocate Legal Notices APIs
  getAdvocateLegalNotices: (params?: { search?: string; status?: string; notice_type?: string; client_id?: string; date?: string; from_date?: string; to_date?: string; page?: number; limit?: number }) =>
    request<any>(`/advocate-portal/legal-notices${toQueryString(params)}`),
  createAdvocateLegalNotice: (data: any) =>
    request<any>('/advocate-portal/legal-notices', { method: 'POST', body: JSON.stringify(data) }),
  updateAdvocateLegalNotice: (id: string, data: any) =>
    request<any>(`/advocate-portal/legal-notices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAdvocateLegalNotice: (id: string) =>
    request<any>(`/advocate-portal/legal-notices/${id}`, { method: 'DELETE' }),

  // Advocate Demand Notices APIs
  getAdvocateDemandNotices: (params?: { search?: string; status?: string; demand_type?: string; client_id?: string; page?: number; limit?: number }) =>
    request<any>(`/advocate-portal/demand-notices${toQueryString(params)}`),
  createAdvocateDemandNotice: (data: any) =>
    request<any>('/advocate-portal/demand-notices', { method: 'POST', body: JSON.stringify(data) }),
  updateAdvocateDemandNotice: (id: string, data: any) =>
    request<any>(`/advocate-portal/demand-notices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAdvocateDemandNotice: (id: string) =>
    request<any>(`/advocate-portal/demand-notices/${id}`, { method: 'DELETE' }),

  // Payment Due Date Notifications APIs
  getCRMNotifications: (params?: { status?: string; type?: string; is_read?: number }) => {
    return request<any>(`/crm/notifications${toQueryString(params)}`);
  },
  runPaymentDueCheck: (targetDate?: string) =>
    request<any>('/crm/notifications/run-due-check', { method: 'POST', body: JSON.stringify({ target_date: targetDate }) }),
  markNotificationRead: (id: string) =>
    request<any>(`/crm/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () =>
    request<any>('/crm/notifications/mark-all-read', { method: 'POST' }),

  // CRM Lead Follow-up History
  getCRMFollowUps: async (leadId: string) => {
    const res = await request<any>(`/crm/leads/${leadId}`);
    return { followUps: res.followUps || [] };
  },

  // ─── Staff Profile & Aadhaar KYC APIs ─────────────────────────────────────
  getStaffDirectory: (params?: { search?: string; role?: string; department?: string; status?: string; staff_type?: string }) =>
    request<{ staff: StaffProfile[] }>(`/staff${toQueryString(params)}`),
  getStaffProfile: (id: string) =>
    request<{ staff: StaffProfile }>(`/staff/${id}`),
  createStaff: (data: Record<string, any>) =>
    request<{ message: string; id: string; emp_or_mgr_id: string }>('/staff', { method: 'POST', body: JSON.stringify(data) }),
  updateStaff: (id: string, data: Record<string, any>) =>
    request<{ message: string }>(`/staff/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateStaffKYC: (id: string, data: { aadhaar_number?: string; aadhaar_front_doc?: string; aadhaar_back_doc?: string }) =>
    request<{ message: string }>(`/staff/${id}/kyc`, { method: 'POST', body: JSON.stringify(data) }),
  revealAadhaar: (id: string) =>
    request<{ aadhaar_number: string }>(`/staff/${id}/aadhaar-reveal`),
  getAadhaarDocument: (id: string, type: 'front' | 'back') =>
    request<{ doc_data: string; type: string }>(`/staff/${id}/document/${type}`),
  updateStaffStatus: (id: string, status: string) =>
    request<{ message: string; status: string }>(`/staff/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  resetStaffPassword: (id: string, new_password: string) =>
    request<{ message: string }>(`/staff/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ new_password }) }),

  // ─── Lead Import & Smart Distribution APIs ─────────────────────────────────
  previewLeadImport: (data: { rows?: any[]; fileData?: string }) =>
    request<any>('/crm/lead-import/preview', { method: 'POST', body: JSON.stringify(data) }),
  executeLeadImport: (data: { validRows: any[]; fileName?: string; totalRows?: number; duplicateCount?: number; invalidCount?: number }) =>
    request<any>('/crm/lead-import/execute', { method: 'POST', body: JSON.stringify(data) }),
  getEmployeeWorkload: () =>
    request<{ employees: any[] }>('/crm/lead-import/employees-workload'),
  distributeLeads: (data: {
    lead_ids: string[];
    mode: 'equal' | 'custom';
    assignment_method: 'sequential' | 'random';
    assignments: Array<{ employee_id: string; count: number }>;
    import_id?: string | null;
  }) => request<any>('/crm/lead-import/distribute', { method: 'POST', body: JSON.stringify(data) }),
  reassignLead: (data: { lead_id?: string; lead_ids?: string[]; new_employee_id: string; reason?: string }) =>
    request<any>('/crm/lead-import/reassign', { method: 'POST', body: JSON.stringify(data) }),
  getLeadDistributionHistory: () =>
    request<{ distributions: any[] }>('/crm/lead-import/history'),
  getLeadAssignmentHistory: (leadId: string) =>
    request<{ history: any[] }>(`/crm/lead-import/lead-history/${leadId}`),
  getUnassignedLeads: () =>
    request<{ leads: any[] }>('/crm/lead-import/unassigned-leads'),

  // ─── RBI & Social Complaints APIs ──────────────────────────────────────────
  getComplaints: (params?: { client_id?: string; status?: string; complaint_type?: string; search?: string }) =>
    request<{ complaints: import('../types').ClientComplaint[] }>(`/crm/complaints${toQueryString(params)}`),
  createComplaint: (data: {
    client_id: string;
    complaint_type?: string;
    bank_name: string;
    loan_account_no?: string;
    tweet_url?: string;
    complaint_ref_no?: string;
    screenshot_url?: string;
    file_name?: string;
    description?: string;
    status?: string;
  }) => request<{ message: string; complaint: import('../types').ClientComplaint }>('/crm/complaints', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateComplaintStatus: (id: string, status: string) =>
    request<{ message: string; complaint: import('../types').ClientComplaint }>(`/crm/complaints/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  deleteComplaint: (id: string) =>
    request<{ message: string }>(`/crm/complaints/${id}`, {
      method: 'DELETE',
    }),
};

