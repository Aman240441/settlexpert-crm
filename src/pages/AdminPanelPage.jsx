import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  Users, UserCheck, TrendingUp, FileText, DollarSign, BarChart3,
  UserPlus, Search, MoreVertical, CheckCircle2, XCircle, KeyRound,
  Eye, ToggleLeft, ToggleRight, Activity, AlertCircle, Radio,
  ArrowUpRight, ArrowDownRight, RefreshCw, UserCheck2, UserX,
  Filter, CheckSquare, Square, ChevronLeft, ChevronRight, Sparkles,
  Download, History, ShieldCheck, Clock, Layers, Award, Calendar,
  FileSpreadsheet, Target, ExternalLink, Edit3, Shield, Lock, FileCheck
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import CreateEmployeeModal from '../components/CreateEmployeeModal';
import AssignLeadModal from '../components/AssignLeadModal';
import ImportLeadsModal from '../components/ImportLeadsModal';
import AdminAddLeadModal from '../components/AdminAddLeadModal';

const TOKEN = () => localStorage.getItem('crm_token');
const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TOKEN()}`
});

export default function AdminPanelPage({ user, onLogout, onViewEmployee, onOpenCRM }) {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [dashData, setDashData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [empStatusFilter, setEmpStatusFilter] = useState('All');
  const [empDeptFilter, setEmpDeptFilter] = useState('All');
  const [aadhaarDocModal, setAadhaarDocModal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);
  const [actionMenu, setActionMenu] = useState(null);
  const [resetModal, setResetModal] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  // Leads section state
  const [adminLeads, setAdminLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsSearch, setLeadsSearch] = useState('');
  const [leadsStatus, setLeadsStatus] = useState('All');
  const [leadsAssignment, setLeadsAssignment] = useState('all');
  const [leadsSource, setLeadsSource] = useState('All');
  const [leadsDateFilter, setLeadsDateFilter] = useState('all');
  const [leadsBatchFilter, setLeadsBatchFilter] = useState('');
  const [leadsPage, setLeadsPage] = useState(1);
  const [leadsPagination, setLeadsPagination] = useState({ total: 0, totalPages: 1 });
  const [leadsCounts, setLeadsCounts] = useState({ total: 0, assigned: 0, unassigned: 0 });
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [assignModal, setAssignModal] = useState({ isOpen: false, lead: null, isBulk: false });
  const [leadHistoryModal, setLeadHistoryModal] = useState({ isOpen: false, lead: null, history: [] });

  // Import Leads state
  const [showImportModal, setShowImportModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [importHistory, setImportHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditAction, setAuditAction] = useState('ALL');
  const [auditPage, setAuditPage] = useState(1);
  const [auditPagination, setAuditPagination] = useState({ total: 0, totalPages: 1 });
  const [auditLoading, setAuditLoading] = useState(false);

  // Target & Month state
  const now = new Date();
  const defaultMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [adminMonth, setAdminMonth] = useState(defaultMonthKey);
  const [teamTargets, setTeamTargets] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetchDashboard();
    fetchEmployees();
    fetchTeamTargets(adminMonth);
  }, []);

  useEffect(() => {
    fetchTeamTargets(adminMonth);
  }, [adminMonth]);

  useEffect(() => {
    if (currentPage === 'leads') {
      fetchAdminLeads();
    } else if (currentPage === 'audit') {
      fetchAuditLogs();
    }
  }, [currentPage, leadsPage, leadsStatus, leadsAssignment, leadsSource, leadsDateFilter, leadsBatchFilter, auditPage, auditAction]);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/admin/dashboard', { headers: authHeaders() });
      if (res.ok) setDashData(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchTeamTargets = async (m) => {
    try {
      const monthToFetch = m || adminMonth;
      const res = await fetch(`/api/admin/targets?month=${monthToFetch}`, { headers: authHeaders() });
      if (res.ok) {
        setTeamTargets(await res.json());
      }
    } catch (err) { console.error(err); }
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/employees', { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.data || []);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchAdminLeads = async () => {
    setLeadsLoading(true);
    try {
      const params = new URLSearchParams();
      if (leadsSearch) params.append('search', leadsSearch);
      if (leadsStatus && leadsStatus !== 'All') params.append('status', leadsStatus);
      if (leadsAssignment && leadsAssignment !== 'all') params.append('assignment', leadsAssignment);
      if (leadsSource && leadsSource !== 'All') params.append('source', leadsSource);
      if (leadsDateFilter && leadsDateFilter !== 'all') params.append('date_filter', leadsDateFilter);
      if (leadsBatchFilter) params.append('batch_id', leadsBatchFilter);
      params.append('page', leadsPage);
      params.append('limit', 25);

      const res = await fetch(`/api/admin/leads?${params.toString()}`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAdminLeads(data.data || []);
        setLeadsPagination(data.pagination || { total: 0, totalPages: 1 });
        setLeadsCounts(data.counts || { total: 0, assigned: 0, unassigned: 0 });
      }
    } catch (err) { console.error(err); }
    setLeadsLoading(false);
  };

  const fetchImportHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/admin/leads/import-history', { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setImportHistory(data.data || []);
      }
    } catch (err) { console.error(err); }
    setHistoryLoading(false);
  };

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const params = new URLSearchParams();
      if (auditSearch) params.append('search', auditSearch);
      if (auditAction && auditAction !== 'ALL') params.append('action', auditAction);
      params.append('page', auditPage);
      params.append('limit', 25);

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.data || []);
        setAuditPagination(data.pagination || { total: 0, totalPages: 1 });
      }
    } catch (err) { console.error(err); }
    setAuditLoading(false);
  };

  const fetchLeadAssignmentHistory = async (lead) => {
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}/history`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setLeadHistoryModal({ isOpen: true, lead, history: data.history || [] });
      }
    } catch (err) { console.error(err); }
  };

  const handleExportLeads = () => {
    if (adminLeads.length === 0) {
      showToast('No leads available to export', 'error');
      return;
    }

    const exportData = adminLeads.map(l => ({
      'Lead ID': l.lead_id || `LD-${l.id}`,
      'Lead Name': l.name,
      'Phone': l.phone,
      'Email': l.email || '',
      'City': l.city || '',
      'Loan Type': l.loan_type?.replace(/_/g, ' ') || 'Personal Loan',
      'Outstanding Amount': l.outstanding_amount || '',
      'Status': l.lead_status || 'New',
      'Assigned Employee': l.employee_name || l.assigned_consultant || 'Unassigned',
      'Source': l.source || 'Website',
      'Import Batch': l.import_batch_id || '',
      'Created Date': l.created_at ? new Date(l.created_at).toLocaleDateString('en-IN') : ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CRM Leads');
    XLSX.writeFile(wb, `SettleXpert_Leads_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast(`Exported ${adminLeads.length} leads successfully!`);
  };

  const handleToggleStatus = async (emp) => {
    const newStatus = emp.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`/api/admin/employees/${emp.id}/status`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showToast(`${emp.name} ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
        fetchEmployees();
        fetchDashboard();
      }
    } catch (err) { showToast('Failed to update status', 'error'); }
    setActionMenu(null);
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    try {
      const res = await fetch(`/api/admin/employees/${resetModal.id}/password`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ password: newPassword })
      });
      if (res.ok) {
        showToast(`Password reset for ${resetModal.name}`);
        setResetModal(null);
        setNewPassword('');
      }
    } catch (err) { showToast('Failed to reset password', 'error'); }
  };

  const handleSelectAllLeads = (e) => {
    if (e.target.checked) {
      setSelectedLeads(adminLeads.map(l => l.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleToggleLeadSelect = (id) => {
    setSelectedLeads(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleOpenAadhaarModal = async (emp) => {
    setAadhaarDocModal({ isOpen: true, employee: emp, loading: true, aadhaarNumber: '', frontDoc: '', backDoc: '' });
    try {
      const res = await fetch(`/api/admin/employees/${emp.id}/aadhaar`, { headers: authHeaders() });
      if (res.ok) {
        const d = await res.json();
        setAadhaarDocModal({
          isOpen: true,
          employee: emp,
          loading: false,
          aadhaarNumber: d.aadhaar_number || emp.aadhaar_number || '—',
          frontDoc: d.aadhaar_front_document,
          backDoc: d.aadhaar_back_document
        });
      } else {
        setAadhaarDocModal(prev => ({ ...prev, loading: false }));
        showToast('Failed to load secure Aadhaar document', 'error');
      }
    } catch (err) {
      setAadhaarDocModal(prev => ({ ...prev, loading: false }));
      showToast('Error loading Aadhaar documents', 'error');
    }
  };

  const departmentsList = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));

  const filteredEmployees = employees.filter(e => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch = !q || (
      e.name?.toLowerCase().includes(q) ||
      e.employee_id?.toLowerCase().includes(q) ||
      e.email?.toLowerCase().includes(q) ||
      e.department?.toLowerCase().includes(q) ||
      e.designation?.toLowerCase().includes(q) ||
      e.phone?.toLowerCase().includes(q) ||
      e.aadhaar_number?.toLowerCase().includes(q)
    );
    const matchesStatus = empStatusFilter === 'All' || (e.employment_status === empStatusFilter || e.status === empStatusFilter);
    const matchesDept = empDeptFilter === 'All' || (e.department?.toLowerCase() === empDeptFilter.toLowerCase());
    return matchesSearch && matchesStatus && matchesDept;
  });

  const formatCurrency = (n) => {
    if (!n) return '₹0';
    return '₹' + Number(n).toLocaleString('en-IN');
  };

  // ==================== DASHBOARD VIEW ====================
  const renderDashboard = () => {
    const d = dashData || {};
    const cards = [
      { label: 'Total Employees', value: d.totalEmployees || 0, icon: Users, color: '#818cf8', bg: 'rgba(129,140,248,0.12)' },
      { label: 'Active Employees', value: d.activeEmployees || 0, icon: UserCheck, color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
      { label: 'Total Leads', value: d.totalLeads || 0, icon: Radio, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
      { label: 'Assigned Leads', value: d.assignedLeads || 0, icon: UserCheck2, color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
      { label: 'Unassigned Leads', value: d.unassignedLeads || 0, icon: UserX, color: '#fb923c', bg: 'rgba(251,146,60,0.12)' },
      { label: 'Imported Leads', value: d.importedLeads || 0, icon: FileSpreadsheet, color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
      { label: 'Total Clients', value: d.totalClients || 0, icon: Users, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
      { label: 'Total Agreements', value: d.totalAgreements || 0, icon: FileText, color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
      { label: 'Total Collections', value: formatCurrency(d.totalCollections), icon: DollarSign, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
      { label: 'Avg Performance', value: `${d.avgPerformance || 0}%`, icon: BarChart3, color: '#f472b6', bg: 'rgba(244,114,182,0.12)' },
    ];

    const workloads = d.employeeWorkload || [];
    const topPerformers = d.topPerformers || [];

    return (
      <div className="admin-page-content">
        <div className="admin-page-header">
          <div>
            <h1>Executive Dashboard</h1>
            <p>Real-time team performance, live workload distribution, and CRM overview</p>
          </div>
          <button className="admin-btn-secondary" onClick={() => { fetchDashboard(); fetchEmployees(); }}>
            <RefreshCw size={14} /> <span>Refresh</span>
          </button>
        </div>

        {/* 10-KPI Summary Grid */}
        <div className="admin-kpi-grid">
          {cards.map((c, i) => (
            <div key={i} className="admin-kpi-card">
              <div className="admin-kpi-icon" style={{ background: c.bg }}>
                <c.icon size={20} color={c.color} />
              </div>
              <div className="admin-kpi-info">
                <span className="admin-kpi-value">{c.value}</span>
                <span className="admin-kpi-label">{c.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* TEAM TARGET & MONTHLY PERFORMANCE HUB */}
        <div className="admin-section-card" style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(56,189,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Target size={18} color="#38bdf8" />
              </div>
              <div>
                <h3 className="admin-section-title" style={{ margin: 0 }}>Team Target & Performance Hub</h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                  Aggregated team targets vs actual output for {new Date(adminMonth + '-01').toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Month Filter & Export */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={14} color="#38bdf8" />
                <select
                  className="admin-select-filter"
                  style={{ background: 'transparent', border: 'none', color: '#e2e8f0', fontSize: '12px', fontWeight: 600, padding: 0 }}
                  value={adminMonth}
                  onChange={(e) => setAdminMonth(e.target.value)}
                >
                  {[
                    '2026-01', '2026-02', '2026-03', '2026-04',
                    '2026-05', '2026-06', '2026-07', '2026-08',
                    '2026-09', '2026-10', '2026-11', '2026-12'
                  ].map(m => (
                    <option key={m} value={m}>
                      {new Date(m + '-01').toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="admin-btn-secondary"
                style={{ fontSize: '11.5px', padding: '5px 12px' }}
                onClick={() => {
                  if (!teamTargets || !teamTargets.comparisons) return;
                  const exportData = teamTargets.comparisons.map(c => ({
                    'Employee Name': c.name,
                    'Employee Code': c.employee_code || '',
                    'Designation': c.designation || '',
                    'Month': adminMonth,
                    'Lead Target': c.lead_target,
                    'Actual Leads': c.lead_actual,
                    'Lead Achievement %': c.lead_achievement !== null ? `${c.lead_achievement}%` : 'N/A',
                    'Conversion Target': c.conversion_target,
                    'Actual Conversions': c.conversion_actual,
                    'Conversion Achievement %': c.conversion_achievement !== null ? `${c.conversion_achievement}%` : 'N/A',
                    'Collection Target (₹)': c.collection_target,
                    'Actual Collections (₹)': c.collection_actual,
                    'Collection Achievement %': c.collection_achievement !== null ? `${c.collection_achievement}%` : 'N/A',
                    'Performance Score %': `${c.performance_score}%`,
                    'Status': c.lead_status
                  }));
                  const ws = XLSX.utils.json_to_sheet(exportData);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, `Targets_${adminMonth}`);
                  XLSX.writeFile(wb, `Target_vs_Actual_Report_${adminMonth}.xlsx`);
                  showToast(`Exported Target Report for ${adminMonth}`);
                }}
              >
                <Download size={13} /> <span>Export Targets</span>
              </button>
            </div>
          </div>

          {/* Team Aggregated KPI Cards */}
          {teamTargets && teamTargets.team_summary && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '20px' }}>
              <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '14px 16px' }}>
                <span style={{ fontSize: '11.5px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Team Lead Quota</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '6px' }}>
                  <strong style={{ fontSize: '20px', color: '#38bdf8' }}>
                    {teamTargets.team_summary.lead_actual} / {teamTargets.team_summary.lead_target || '—'}
                  </strong>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: teamTargets.team_summary.lead_achievement >= 80 ? '#34d399' : '#fbbf24' }}>
                    {teamTargets.team_summary.lead_achievement}%
                  </span>
                </div>
                <div style={{ height: '5px', background: '#1e293b', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(teamTargets.team_summary.lead_achievement, 100)}%`, background: '#38bdf8' }} />
                </div>
              </div>

              <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '14px 16px' }}>
                <span style={{ fontSize: '11.5px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Team Conversions</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '6px' }}>
                  <strong style={{ fontSize: '20px', color: '#34d399' }}>
                    {teamTargets.team_summary.conversion_actual} / {teamTargets.team_summary.conversion_target || '—'}
                  </strong>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: teamTargets.team_summary.conversion_achievement >= 80 ? '#34d399' : '#fbbf24' }}>
                    {teamTargets.team_summary.conversion_achievement}%
                  </span>
                </div>
                <div style={{ height: '5px', background: '#1e293b', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(teamTargets.team_summary.conversion_achievement, 100)}%`, background: '#34d399' }} />
                </div>
              </div>

              <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '14px 16px' }}>
                <span style={{ fontSize: '11.5px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Team Fee Collections</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '6px' }}>
                  <strong style={{ fontSize: '18px', color: '#10b981' }}>
                    {formatCurrency(teamTargets.team_summary.collection_actual)} / {teamTargets.team_summary.collection_target > 0 ? formatCurrency(teamTargets.team_summary.collection_target) : '—'}
                  </strong>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: teamTargets.team_summary.collection_achievement >= 80 ? '#34d399' : '#fbbf24' }}>
                    {teamTargets.team_summary.collection_achievement}%
                  </span>
                </div>
                <div style={{ height: '5px', background: '#1e293b', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(teamTargets.team_summary.collection_achievement, 100)}%`, background: '#10b981' }} />
                </div>
              </div>
            </div>
          )}

          {/* Employee Target Comparison Table */}
          <div style={{ marginTop: '14px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#cbd5e1', marginBottom: '10px' }}>
              Employee Target vs Actual Matrix ({new Date(adminMonth + '-01').toLocaleString('en-US', { month: 'short', year: 'numeric' })})
            </h4>
            {(!teamTargets || !teamTargets.comparisons || teamTargets.comparisons.length === 0) ? (
              <div className="admin-empty-state" style={{ padding: '20px' }}>
                <p>Loading target comparisons...</p>
              </div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Lead Target</th>
                      <th>Actual Leads</th>
                      <th>Lead Ach.</th>
                      <th>Conv. Target</th>
                      <th>Actual Conv.</th>
                      <th>Col. Target</th>
                      <th>Actual Col.</th>
                      <th>Score</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamTargets.comparisons.map(c => {
                      const empObj = employees.find(e => e.id === c.employee_id) || { id: c.employee_id, name: c.name };
                      return (
                        <tr key={c.employee_id}>
                          <td>
                            <div className="admin-emp-cell" style={{ cursor: 'pointer' }} onClick={() => onViewEmployee(empObj)}>
                              <div className="admin-emp-avatar">{c.name?.charAt(0)?.toUpperCase()}</div>
                              <div>
                                <div className="admin-emp-name">{c.name}</div>
                                <div className="admin-emp-email">{c.employee_code || c.designation || 'Consultant'}</div>
                              </div>
                            </div>
                          </td>
                          <td>{c.lead_target || '—'}</td>
                          <td style={{ color: '#38bdf8', fontWeight: 700 }}>{c.lead_actual}</td>
                          <td style={{ color: c.lead_achievement >= 80 ? '#34d399' : c.lead_achievement >= 50 ? '#fbbf24' : '#f87171', fontWeight: 600 }}>
                            {c.lead_achievement !== null ? `${c.lead_achievement}%` : '—'}
                          </td>
                          <td>{c.conversion_target || '—'}</td>
                          <td style={{ color: '#34d399', fontWeight: 700 }}>{c.conversion_actual}</td>
                          <td>{c.collection_target > 0 ? formatCurrency(c.collection_target) : '—'}</td>
                          <td style={{ color: '#10b981', fontWeight: 600 }}>{formatCurrency(c.collection_actual)}</td>
                          <td>
                            <strong style={{ color: '#f8fafc' }}>{c.performance_score}%</strong>
                          </td>
                          <td>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: '4px',
                              background: c.lead_status === 'Target Achieved' ? 'rgba(52,211,153,0.15)' : c.lead_status === 'On Track' ? 'rgba(56,189,248,0.15)' : c.lead_status === 'Needs Attention' ? 'rgba(251,191,36,0.15)' : c.lead_status === 'Critical' ? 'rgba(248,113,113,0.15)' : 'rgba(148,163,184,0.12)',
                              color: c.lead_status === 'Target Achieved' ? '#34d399' : c.lead_status === 'On Track' ? '#38bdf8' : c.lead_status === 'Needs Attention' ? '#fbbf24' : c.lead_status === 'Critical' ? '#f87171' : '#94a3b8'
                            }}>
                              {c.lead_status}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="admin-btn-primary"
                              style={{ padding: '3px 9px', fontSize: '11px' }}
                              onClick={() => onViewEmployee(empObj)}
                            >
                              Manage Targets →
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Top Performers Section */}
        {topPerformers.length > 0 && (
          <div className="admin-section-card" style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Award size={18} color="#fbbf24" />
              <h3 className="admin-section-title" style={{ margin: 0 }}>Top Performers</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              {topPerformers.map((emp, rank) => (
                <div key={emp.id} className="admin-perf-metric" style={{ cursor: 'pointer' }} onClick={() => onViewEmployee(emp)}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: rank === 0 ? '#fbbf24' : rank === 1 ? '#cbd5e1' : '#f59e0b', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px' }}>
                    #{rank + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '13px' }}>{emp.name}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {emp.converted_leads} converted ({emp.performance}% rate)
                    </div>
                  </div>
                  <span style={{ fontSize: '11.5px', color: '#34d399', fontWeight: 700 }}>
                    {formatCurrency(emp.collections)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Employee Workload & Lead Distribution */}
        <div className="admin-section-card" style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 className="admin-section-title" style={{ margin: 0 }}>Live Employee Workload</h3>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748b' }}>
                Track active lead capacity, pending follow-ups, and conversion metrics
              </p>
            </div>
            <button className="admin-btn-secondary" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => setCurrentPage('leads')}>
              Manage & Assign Leads →
            </button>
          </div>

          {workloads.length === 0 ? (
            <div className="admin-empty-state">
              <Users size={36} color="#475569" />
              <p>No active employees found</p>
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Employee ID</th>
                    <th>Assigned</th>
                    <th>Pending</th>
                    <th>Converted</th>
                    <th>Lost</th>
                    <th>Collections</th>
                    <th>Conversion Rate</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {workloads.map(emp => (
                    <tr key={emp.id} className="admin-table-row-click" onClick={() => onViewEmployee(emp)}>
                      <td>
                        <div className="admin-emp-cell">
                          <div className="admin-emp-avatar">{emp.name?.charAt(0)?.toUpperCase()}</div>
                          <div>
                            <div className="admin-emp-name">{emp.name}</div>
                            <div className="admin-emp-email">{emp.designation || 'Consultant'}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="admin-badge-id">{emp.employee_id || '—'}</span></td>
                      <td className="admin-stat-num" style={{ color: '#38bdf8', fontWeight: 700 }}>{emp.assigned_leads}</td>
                      <td className="admin-stat-num" style={{ color: '#fbbf24' }}>{emp.pending_leads}</td>
                      <td className="admin-stat-num" style={{ color: '#34d399', fontWeight: 700 }}>{emp.converted_leads}</td>
                      <td className="admin-stat-num" style={{ color: '#f87171' }}>{emp.lost_leads || 0}</td>
                      <td style={{ fontWeight: 600, color: '#10b981', fontSize: '12px' }}>{formatCurrency(emp.collections)}</td>
                      <td>
                        <div className="admin-perf-bar">
                          <div className="admin-perf-fill" style={{ width: `${Math.min(emp.performance || 0, 100)}%`, background: (emp.performance || 0) >= 60 ? '#34d399' : (emp.performance || 0) >= 30 ? '#f59e0b' : '#f87171' }}></div>
                          <span>{emp.performance || 0}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`admin-status-badge ${emp.status === 'active' ? 'active' : 'inactive'}`}>
                          {emp.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ==================== LEADS MANAGEMENT & ASSIGNMENT VIEW ====================
  const renderLeads = () => {
    const selectedLeadObjects = adminLeads.filter(l => selectedLeads.includes(l.id));

    return (
      <div className="admin-page-content">
        <div className="admin-page-header">
          <div>
            <h1>Lead Management & Distribution</h1>
            <p>Import spreadsheets, assign/distribute leads, and track assignment history</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className="admin-btn-primary"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', boxShadow: '0 2px 8px rgba(16,185,129,0.25)' }}
              onClick={() => setShowAddLeadModal(true)}
            >
              <UserPlus size={15} /> <span>Add Lead</span>
            </button>

            <button
              className="admin-btn-secondary"
              style={{ background: 'rgba(56,189,248,0.15)', color: '#38bdf8', borderColor: 'rgba(56,189,248,0.3)' }}
              onClick={() => setShowImportModal(true)}
            >
              <FileSpreadsheet size={15} /> <span>Import Excel Leads</span>
            </button>

            {selectedLeads.length > 0 && (
              <button
                className="admin-btn-primary"
                style={{ background: '#38bdf8' }}
                onClick={() => setAssignModal({ isOpen: true, lead: null, isBulk: true })}
              >
                <UserCheck2 size={15} /> <span>Bulk Assign ({selectedLeads.length})</span>
              </button>
            )}

            <button className="admin-btn-secondary" onClick={handleExportLeads}>
              <Download size={14} /> <span>Export Leads</span>
            </button>

            <button
              className="admin-btn-secondary"
              onClick={() => {
                fetchImportHistory();
                setShowHistoryModal(true);
              }}
            >
              <History size={14} /> <span>Import History</span>
            </button>

            <button className="admin-btn-secondary" onClick={() => fetchAdminLeads()}>
              <RefreshCw size={14} /> <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Active Batch Filter Banner */}
        {leadsBatchFilter && (
          <div style={{ background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '8px', padding: '10px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileSpreadsheet size={16} color="#38bdf8" />
              <span style={{ fontSize: '13px', color: '#e2e8f0' }}>
                Filtered by Import Batch: <strong style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{leadsBatchFilter}</strong>
              </span>
            </div>
            <button
              className="admin-btn-cancel"
              style={{ padding: '4px 10px', fontSize: '11.5px' }}
              onClick={() => setLeadsBatchFilter('')}
            >
              Clear Filter (Show All)
            </button>
          </div>
        )}

        {/* Quick Filter Counts Bar */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <button
            className={`admin-filter-pill ${leadsAssignment === 'all' && !leadsBatchFilter ? 'active' : ''}`}
            onClick={() => { setLeadsAssignment('all'); setLeadsBatchFilter(''); setLeadsPage(1); }}
          >
            All Leads ({leadsCounts.total})
          </button>
          <button
            className={`admin-filter-pill ${leadsAssignment === 'unassigned' ? 'active' : ''}`}
            onClick={() => { setLeadsAssignment('unassigned'); setLeadsPage(1); }}
          >
            Unassigned ({leadsCounts.unassigned})
          </button>
          <button
            className={`admin-filter-pill ${leadsAssignment === 'assigned' ? 'active' : ''}`}
            onClick={() => { setLeadsAssignment('assigned'); setLeadsPage(1); }}
          >
            Assigned ({leadsCounts.assigned})
          </button>
        </div>

        <div className="admin-section-card">
          {/* Filters Bar */}
          <div className="admin-table-toolbar">
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
              <div className="admin-search-box">
                <Search size={15} />
                <input
                  type="text"
                  placeholder="Search lead name, phone, email, ID..."
                  value={leadsSearch}
                  onChange={e => setLeadsSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchAdminLeads()}
                />
              </div>

              {/* Status Filter */}
              <select
                className="admin-select-filter"
                value={leadsStatus}
                onChange={e => { setLeadsStatus(e.target.value); setLeadsPage(1); }}
              >
                <option value="All">All Statuses</option>
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Follow up">Follow Up</option>
                <option value="Converted">Converted</option>
                <option value="Not Interested">Lost / Not Interested</option>
              </select>

              {/* Employee Filter */}
              <select
                className="admin-select-filter"
                value={leadsAssignment}
                onChange={e => { setLeadsAssignment(e.target.value); setLeadsPage(1); }}
              >
                <option value="all">All Employees</option>
                <option value="unassigned">Unassigned Only</option>
                <option value="assigned">Assigned Only</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>Assigned: {emp.name}</option>
                ))}
              </select>

              {/* Date Filter */}
              <select
                className="admin-select-filter"
                value={leadsDateFilter}
                onChange={e => { setLeadsDateFilter(e.target.value); setLeadsPage(1); }}
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>

            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              Showing {adminLeads.length} of {leadsPagination.total} leads
            </div>
          </div>

          {/* Bulk action sticky indicator */}
          {selectedLeads.length > 0 && (
            <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '8px', padding: '10px 16px', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12.5px', color: '#38bdf8', fontWeight: 600 }}>
                {selectedLeads.length} lead(s) selected
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="admin-btn-primary"
                  style={{ background: '#38bdf8', padding: '5px 12px', fontSize: '12px' }}
                  onClick={() => setAssignModal({ isOpen: true, lead: null, isBulk: true })}
                >
                  Bulk Assign to Employee
                </button>
                <button
                  className="admin-btn-cancel"
                  style={{ padding: '5px 12px', fontSize: '12px' }}
                  onClick={() => setSelectedLeads([])}
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          {/* Leads Table */}
          {adminLeads.length === 0 ? (
            <div className="admin-empty-state">
              <Radio size={40} color="#475569" />
              <p>{leadsLoading ? 'Loading leads...' : 'No leads found matching criteria.'}</p>
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '36px' }}>
                      <input
                        type="checkbox"
                        checked={selectedLeads.length > 0 && selectedLeads.length === adminLeads.length}
                        onChange={handleSelectAllLeads}
                        style={{ accentColor: '#818cf8', cursor: 'pointer' }}
                      />
                    </th>
                    <th>Lead</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Source</th>
                    <th>Assigned Employee</th>
                    <th>Created Date</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {adminLeads.map(lead => {
                    const isAssigned = !!(lead.assigned_to || (lead.assigned_consultant && lead.assigned_consultant !== ''));
                    const empDisplayName = lead.employee_name || lead.assigned_consultant;

                    return (
                      <tr key={lead.id} className={selectedLeads.includes(lead.id) ? 'selected-row' : ''}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedLeads.includes(lead.id)}
                            onChange={() => handleToggleLeadSelect(lead.id)}
                            style={{ accentColor: '#818cf8', cursor: 'pointer' }}
                          />
                        </td>
                        <td>
                          <div>
                            <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{lead.name}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              {lead.lead_id || `ID: ${lead.id}`} {lead.city ? `• ${lead.city}` : ''}
                            </div>
                          </div>
                        </td>
                        <td>{lead.phone || '—'}</td>
                        <td>
                          <span className={`admin-lead-status ${lead.lead_status?.toLowerCase().replace(/\s+/g, '-')}`}>
                            {lead.lead_status || 'New'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '11.5px', color: lead.source === 'Excel Import' ? '#34d399' : '#94a3b8' }}>
                            {lead.source || 'Website'}
                          </span>
                          {lead.import_batch_id && (
                            <div style={{ fontSize: '9.5px', color: '#64748b', fontFamily: 'monospace' }}>
                              {lead.import_batch_id}
                            </div>
                          )}
                        </td>
                        <td>
                          {isAssigned ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div className="admin-emp-avatar" style={{ width: '24px', height: '24px', fontSize: '11px' }}>
                                {empDisplayName?.charAt(0)?.toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#e2e8f0' }}>{empDisplayName}</div>
                                {lead.employee_code && (
                                  <div style={{ fontSize: '10px', color: '#818cf8' }}>{lead.employee_code}</div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="admin-badge-unassigned">
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                          {lead.created_at ? new Date(lead.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              className="admin-btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '11px' }}
                              onClick={() => fetchLeadAssignmentHistory(lead)}
                              title="View Assignment History"
                            >
                              <History size={12} />
                            </button>
                            <button
                              className="admin-btn-assign"
                              onClick={() => setAssignModal({ isOpen: true, lead, isBulk: false })}
                            >
                              <UserCheck2 size={13} />
                              <span>{isAssigned ? 'Reassign' : 'Assign'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {leadsPagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #334155' }}>
              <button
                className="admin-btn-secondary"
                disabled={leadsPage <= 1}
                onClick={() => setLeadsPage(p => Math.max(1, p - 1))}
                style={{ padding: '4px 8px', fontSize: '11.5px' }}
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                Page {leadsPage} of {leadsPagination.totalPages}
              </span>
              <button
                className="admin-btn-secondary"
                disabled={leadsPage >= leadsPagination.totalPages}
                onClick={() => setLeadsPage(p => Math.min(leadsPagination.totalPages, p + 1))}
                style={{ padding: '4px 8px', fontSize: '11.5px' }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ==================== AUDIT LOGS VIEW ====================
  const renderAuditLogs = () => (
    <div className="admin-page-content">
      <div className="admin-page-header">
        <div>
          <h1>Admin Audit Trail</h1>
          <p>Complete chronological audit log of all system actions and lead assignments</p>
        </div>
        <button className="admin-btn-secondary" onClick={() => fetchAuditLogs()}>
          <RefreshCw size={14} /> <span>Refresh</span>
        </button>
      </div>

      <div className="admin-section-card">
        {/* Filters */}
        <div className="admin-table-toolbar">
          <div style={{ display: 'flex', gap: '10px', flex: 1 }}>
            <div className="admin-search-box">
              <Search size={15} />
              <input
                type="text"
                placeholder="Search audit details, users..."
                value={auditSearch}
                onChange={e => setAuditSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchAuditLogs()}
              />
            </div>
            <select
              className="admin-select-filter"
              value={auditAction}
              onChange={e => { setAuditAction(e.target.value); setAuditPage(1); }}
            >
              <option value="ALL">All Actions</option>
              <option value="LEAD_IMPORT">Lead Imports</option>
              <option value="LEAD_ASSIGN">Lead Assignments</option>
              <option value="LEAD_REASSIGN">Lead Reassignments</option>
              <option value="LEAD_BULK_ASSIGN">Bulk Assignments</option>
              <option value="CREATE_EMPLOYEE">Employee Creations</option>
              <option value="UPDATE_EMPLOYEE_STATUS">Status Changes</option>
              <option value="RESET_EMPLOYEE_PASSWORD">Password Resets</option>
            </select>
          </div>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            Total {auditPagination.total} audit events
          </span>
        </div>

        {auditLogs.length === 0 ? (
          <div className="admin-empty-state" style={{ padding: '30px' }}>
            <ShieldCheck size={36} color="#475569" />
            <p>{auditLoading ? 'Loading audit trail...' : 'No audit events found.'}</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Performed By</th>
                  <th>Entity</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {log.created_at ? new Date(log.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td>
                      <span className="admin-badge-id" style={{ fontSize: '10.5px' }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: '#e2e8f0' }}>{log.user_name || 'Admin'}</td>
                    <td style={{ fontSize: '11px', color: '#818cf8', fontFamily: 'monospace' }}>
                      {log.entity_type} {log.entity_id ? `(${log.entity_id})` : ''}
                    </td>
                    <td style={{ fontSize: '12px', color: '#cbd5e1' }}>{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  // ==================== EMPLOYEES VIEW ====================
  const renderEmployees = () => (
    <div className="admin-page-content">
      <div className="admin-page-header">
        <div>
          <h1>Employees</h1>
          <p>Manage employee profiles, credentials, Aadhaar documents, and CRM workspaces</p>
        </div>
        <button
          className="admin-btn-primary"
          style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
          onClick={() => { setEditingEmployee(null); setShowCreateModal(true); }}
        >
          <UserPlus size={15} /> <span>Add Employee</span>
        </button>
      </div>

      <div className="admin-section-card">
        {/* Search and Filters Toolbar */}
        <div className="admin-table-toolbar" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div className="admin-search-box" style={{ minWidth: '240px', flex: 1 }}>
            <Search size={15} />
            <input
              type="text"
              placeholder="Search by name, ID, phone, email, Aadhaar, department..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Department Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>Dept:</span>
              <select
                className="admin-select-filter"
                style={{ padding: '6px 10px', fontSize: '12px', background: '#0f172a', borderColor: '#334155', color: '#e2e8f0', borderRadius: '6px' }}
                value={empDeptFilter}
                onChange={e => setEmpDeptFilter(e.target.value)}
              >
                <option value="All">All Departments</option>
                {departmentsList.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>Status:</span>
              <select
                className="admin-select-filter"
                style={{ padding: '6px 10px', fontSize: '12px', background: '#0f172a', borderColor: '#334155', color: '#e2e8f0', borderRadius: '6px' }}
                value={empStatusFilter}
                onChange={e => setEmpStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="active">Active Staff</option>
                <option value="probation">Probation</option>
                <option value="on_leave">On Leave</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <span className="admin-table-count">{filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {filteredEmployees.length === 0 ? (
          <div className="admin-empty-state">
            <Users size={40} color="#475569" />
            <p>{searchTerm || empStatusFilter !== 'All' || empDeptFilter !== 'All' ? 'No employees match your search or filters' : 'No employees created yet. Click "Add Employee" to get started.'}</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Employee ID</th>
                  <th>Department & Designation</th>
                  <th>Joining Date</th>
                  <th>Contact Number</th>
                  <th>Aadhaar Number</th>
                  <th>Aadhaar Docs</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right', minWidth: '240px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map(emp => (
                  <tr key={emp.id}>
                    <td>
                      <div className="admin-emp-cell">
                        {emp.profile_photo ? (
                          <div style={{ width: '38px', height: '38px', borderRadius: '50%', overflow: 'hidden', border: '1.5px solid #38bdf8', flexShrink: 0 }}>
                            <img src={emp.profile_photo} alt={emp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ) : (
                          <div className="admin-emp-avatar">{emp.name?.charAt(0)?.toUpperCase()}</div>
                        )}
                        <div>
                          <div className="admin-emp-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{emp.name}</span>
                          </div>
                          <div className="admin-emp-email">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="admin-badge-id" style={{ fontWeight: 700 }}>{emp.employee_id || '—'}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '12.5px' }}>{emp.department || 'General'}</div>
                      <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>{emp.designation || 'Consultant'}</div>
                    </td>
                    <td style={{ fontSize: '12px', color: '#cbd5e1' }}>
                      {emp.joining_date ? new Date(emp.joining_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td style={{ fontSize: '12px', color: '#cbd5e1' }}>{emp.phone || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11.5px', fontFamily: 'monospace', background: 'rgba(15,23,42,0.6)', padding: '2px 6px', borderRadius: '4px', border: '1px solid #334155', color: '#94a3b8' }}>
                          {emp.aadhaar_number || 'Not Provided'}
                        </span>
                        {emp.aadhaar_number && (
                          <button
                            type="button"
                            onClick={() => handleOpenAadhaarModal(emp)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#38bdf8', padding: '2px' }}
                            title="Inspect Aadhaar & KYC documents"
                          >
                            <Eye size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <span
                          onClick={() => (emp.has_aadhaar_front || emp.has_aadhaar_back) && handleOpenAadhaarModal(emp)}
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 5px',
                            borderRadius: '4px',
                            background: emp.has_aadhaar_front ? 'rgba(52,211,153,0.15)' : 'rgba(148,163,184,0.1)',
                            color: emp.has_aadhaar_front ? '#34d399' : '#64748b',
                            border: `1px solid ${emp.has_aadhaar_front ? 'rgba(52,211,153,0.3)' : 'rgba(148,163,184,0.2)'}`,
                            cursor: emp.has_aadhaar_front ? 'pointer' : 'default'
                          }}
                          title={emp.has_aadhaar_front ? 'Aadhaar Front Available (Click to view)' : 'No Front Document'}
                        >
                          F: {emp.has_aadhaar_front ? '✓' : '—'}
                        </span>
                        <span
                          onClick={() => (emp.has_aadhaar_front || emp.has_aadhaar_back) && handleOpenAadhaarModal(emp)}
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 5px',
                            borderRadius: '4px',
                            background: emp.has_aadhaar_back ? 'rgba(52,211,153,0.15)' : 'rgba(148,163,184,0.1)',
                            color: emp.has_aadhaar_back ? '#34d399' : '#64748b',
                            border: `1px solid ${emp.has_aadhaar_back ? 'rgba(52,211,153,0.3)' : 'rgba(148,163,184,0.2)'}`,
                            cursor: emp.has_aadhaar_back ? 'pointer' : 'default'
                          }}
                          title={emp.has_aadhaar_back ? 'Aadhaar Back Available (Click to view)' : 'No Back Document'}
                        >
                          B: {emp.has_aadhaar_back ? '✓' : '—'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`admin-status-badge ${emp.status === 'active' ? 'active' : 'inactive'}`}>
                        {emp.employment_status === 'probation' ? 'Probation' : emp.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        {/* Open CRM Button */}
                        <button
                          type="button"
                          className="admin-btn-primary"
                          style={{ fontSize: '11.5px', padding: '5px 10px', background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => onOpenCRM && onOpenCRM(emp)}
                          title={`Open ${emp.name}'s CRM Workspace`}
                        >
                          <ExternalLink size={12} />
                          <span>Open CRM</span>
                        </button>

                        {/* View Profile Button */}
                        <button
                          type="button"
                          className="admin-btn-secondary"
                          style={{ fontSize: '11.5px', padding: '5px 9px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => onViewEmployee(emp)}
                          title="View Employee Profile & Performance"
                        >
                          <Eye size={12} />
                          <span>Profile</span>
                        </button>

                        {/* More Actions Menu */}
                        <div style={{ position: 'relative' }}>
                          <button className="admin-action-btn" onClick={() => setActionMenu(actionMenu === emp.id ? null : emp.id)}>
                            <MoreVertical size={16} />
                          </button>
                          {actionMenu === emp.id && (
                            <div className="admin-action-menu" style={{ right: 0, zIndex: 60 }}>
                              <button onClick={() => { setEditingEmployee(emp); setActionMenu(null); }}>
                                <Edit3 size={13} color="#38bdf8" /> <span>Edit Employee</span>
                              </button>
                              <button onClick={() => { onViewEmployee(emp); setActionMenu(null); }}>
                                <Eye size={13} /> <span>View Performance</span>
                              </button>
                              <button onClick={() => { onOpenCRM && onOpenCRM(emp); setActionMenu(null); }}>
                                <ExternalLink size={13} color="#10b981" /> <span>Open CRM</span>
                              </button>
                              <button onClick={() => { handleOpenAadhaarModal(emp); setActionMenu(null); }}>
                                <ShieldCheck size={13} color="#f59e0b" /> <span>View Aadhaar Docs</span>
                              </button>
                              <button onClick={() => handleToggleStatus(emp)}>
                                {emp.status === 'active' ? <><ToggleLeft size={13} /> <span>Deactivate</span></> : <><ToggleRight size={13} /> <span>Activate</span></>}
                              </button>
                              <button onClick={() => { setResetModal(emp); setActionMenu(null); setNewPassword(''); }}>
                                <KeyRound size={13} /> <span>Reset Password</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  // ==================== MONITORING VIEW ====================
  const renderMonitoring = () => (
    <div className="admin-page-content">
      <div className="admin-page-header">
        <div>
          <h1>Live CRM Monitoring</h1>
          <p>Real-time employee CRM performance tracking and workspace access</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="admin-btn-primary"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
            onClick={() => { setEditingEmployee(null); setShowCreateModal(true); }}
          >
            <UserPlus size={15} /> <span>Add Employee</span>
          </button>
          <button className="admin-btn-secondary" onClick={() => { fetchEmployees(); fetchDashboard(); }}>
            <RefreshCw size={14} /> <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="admin-section-card">
        {employees.length === 0 ? (
          <div className="admin-empty-state">
            <Activity size={40} color="#475569" />
            <p>No employees to monitor. Create employees first.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Employee ID</th>
                  <th>Role</th>
                  <th>Leads</th>
                  <th>Clients</th>
                  <th>Agreements</th>
                  <th>Collections</th>
                  <th>Performance</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right', minWidth: '170px' }}>CRM Access</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id}>
                    <td onClick={() => onViewEmployee(emp)} style={{ cursor: 'pointer' }}>
                      <div className="admin-emp-cell">
                        {emp.profile_photo ? (
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', border: '1.5px solid #38bdf8', flexShrink: 0 }}>
                            <img src={emp.profile_photo} alt={emp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ) : (
                          <div className="admin-emp-avatar">{emp.name?.charAt(0)?.toUpperCase()}</div>
                        )}
                        <div>
                          <div className="admin-emp-name">{emp.name}</div>
                          <div className="admin-emp-email">{emp.designation || emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="admin-badge-id">{emp.employee_id || '—'}</span></td>
                    <td>{emp.designation || '—'}</td>
                    <td className="admin-stat-num">{emp.stats?.leads || 0}</td>
                    <td className="admin-stat-num">{emp.stats?.clients || 0}</td>
                    <td className="admin-stat-num">{emp.stats?.agreements || 0}</td>
                    <td className="admin-stat-num">{formatCurrency(emp.stats?.collections)}</td>
                    <td>
                      <div className="admin-perf-bar">
                        <div className="admin-perf-fill" style={{ width: `${Math.min(emp.stats?.performance || 0, 100)}%`, background: (emp.stats?.performance || 0) >= 70 ? '#34d399' : (emp.stats?.performance || 0) >= 40 ? '#f59e0b' : '#f87171' }}></div>
                        <span>{emp.stats?.performance || 0}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`admin-status-badge ${emp.status === 'active' ? 'active' : 'inactive'}`}>
                        {emp.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          type="button"
                          className="admin-btn-primary"
                          style={{ fontSize: '11px', padding: '4px 9px', background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => onOpenCRM && onOpenCRM(emp)}
                        >
                          <ExternalLink size={12} />
                          <span>Open CRM</span>
                        </button>
                        <button
                          type="button"
                          className="admin-btn-secondary"
                          style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '5px' }}
                          onClick={() => onViewEmployee(emp)}
                        >
                          <Eye size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  // ==================== SETTINGS VIEW ====================
  const renderSettings = () => (
    <div className="admin-page-content">
      <div className="admin-page-header">
        <h1>Settings</h1>
        <p>Admin panel configuration</p>
      </div>
      <div className="admin-section-card">
        <div className="admin-settings-info">
          <div className="admin-settings-row">
            <span className="admin-settings-label">Admin Name</span>
            <span className="admin-settings-value">{user?.name || 'Admin User'}</span>
          </div>
          <div className="admin-settings-row">
            <span className="admin-settings-label">Admin Email</span>
            <span className="admin-settings-value">{user?.email || 'settlexperts@gmail.com'}</span>
          </div>
          <div className="admin-settings-row">
            <span className="admin-settings-label">Role</span>
            <span className="admin-settings-value"><span className="admin-status-badge active">Administrator</span></span>
          </div>
          <div className="admin-settings-row">
            <span className="admin-settings-label">Total Employees</span>
            <span className="admin-settings-value">{employees.length}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-layout">
      <AdminSidebar currentPage={currentPage} setCurrentPage={setCurrentPage} onLogout={onLogout} />

      <div className="admin-main">
        <AdminHeader user={user} onLogout={onLogout} />

        <div className="admin-content-area">
          {currentPage === 'dashboard' && renderDashboard()}
          {currentPage === 'leads' && renderLeads()}
          {currentPage === 'employees' && renderEmployees()}
          {currentPage === 'monitoring' && renderMonitoring()}
          {currentPage === 'audit' && renderAuditLogs()}
          {currentPage === 'settings' && renderSettings()}
        </div>
      </div>

      {/* Assign / Bulk Assign Lead Modal */}
      <AssignLeadModal
        isOpen={assignModal.isOpen}
        onClose={() => setAssignModal({ isOpen: false, lead: null, isBulk: false })}
        lead={assignModal.lead}
        leads={assignModal.isBulk ? selectedLeadObjects : []}
        employees={employees}
        onAssigned={(msg) => {
          showToast(msg || 'Leads assigned successfully!');
          setSelectedLeads([]);
          fetchAdminLeads();
          fetchDashboard();
        }}
      />

      {/* Lead Assignment History Modal */}
      {leadHistoryModal.isOpen && (
        <div className="admin-modal-overlay" onClick={() => setLeadHistoryModal({ isOpen: false, lead: null, history: [] })}>
          <div className="admin-modal" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="admin-modal-header-left">
                <History size={18} className="admin-modal-icon" style={{ color: '#818cf8' }} />
                <h3>Assignment History — {leadHistoryModal.lead?.name}</h3>
              </div>
              <button className="admin-modal-close" onClick={() => setLeadHistoryModal({ isOpen: false, lead: null, history: [] })}>
                <XCircle size={18} />
              </button>
            </div>

            <div className="admin-modal-form" style={{ padding: '16px 20px' }}>
              {leadHistoryModal.history.length === 0 ? (
                <div className="admin-empty-state" style={{ padding: '24px' }}>
                  <History size={32} color="#475569" />
                  <p>No historical reassignment events for this lead.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {leadHistoryModal.history.map(item => (
                    <div key={item.id} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '12px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                          {new Date(item.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="admin-badge-id" style={{ fontSize: '10px' }}>{item.action_type}</span>
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#e2e8f0' }}>
                        {item.previous_employee_name ? (
                          <>Reassigned from <strong style={{ color: '#fbbf24' }}>{item.previous_employee_name}</strong> to <strong style={{ color: '#34d399' }}>{item.new_employee_name || 'Unassigned'}</strong></>
                        ) : (
                          <>Assigned to <strong style={{ color: '#34d399' }}>{item.new_employee_name || 'Unassigned'}</strong></>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                        Changed by: {item.changed_by_name || 'Admin'} {item.notes ? `• ${item.notes}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="admin-modal-actions" style={{ marginTop: '16px' }}>
                <button className="admin-btn-secondary" onClick={() => setLeadHistoryModal({ isOpen: false, lead: null, history: [] })}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Leads from Excel Modal */}
      <ImportLeadsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        employees={employees}
        existingLeads={adminLeads}
        onImportSuccess={(info) => {
          showToast('Leads imported and distributed successfully!');
          fetchDashboard();
          fetchEmployees();
          if (info?.batchId) {
            setLeadsBatchFilter(info.batchId);
            setCurrentPage('leads');
          } else {
            fetchAdminLeads();
          }
        }}
      />

      {/* Import History Modal */}
      {showHistoryModal && (
        <div className="admin-modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="admin-modal" style={{ maxWidth: '860px' }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="admin-modal-header-left">
                <History size={18} className="admin-modal-icon" style={{ color: '#38bdf8' }} />
                <h3>Lead Import History</h3>
              </div>
              <button className="admin-modal-close" onClick={() => setShowHistoryModal(false)}>
                <XCircle size={18} />
              </button>
            </div>

            <div className="admin-modal-form" style={{ padding: '16px 20px' }}>
              {historyLoading ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                  Loading import history...
                </div>
              ) : importHistory.length === 0 ? (
                <div className="admin-empty-state" style={{ padding: '30px' }}>
                  <FileSpreadsheet size={36} color="#475569" />
                  <p>No spreadsheets imported yet.</p>
                </div>
              ) : (
                <div className="admin-table-wrapper" style={{ maxHeight: '380px', overflowY: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>File Name</th>
                        <th>Distribution / Employee</th>
                        <th>Total</th>
                        <th>Imported</th>
                        <th>Skipped</th>
                        <th>Admin</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importHistory.map(h => (
                        <tr key={h.id}>
                          <td style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {new Date(h.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '12px' }}>{h.filename}</div>
                            <div style={{ fontSize: '10px', color: '#818cf8', fontFamily: 'monospace' }}>{h.batch_id}</div>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600, color: '#38bdf8' }}>{h.employee_name}</span>
                            {h.distribution_mode && (
                              <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'capitalize' }}>
                                {h.distribution_mode} distribution
                              </div>
                            )}
                          </td>
                          <td style={{ fontWeight: 600 }}>{h.total_rows}</td>
                          <td style={{ color: '#34d399', fontWeight: 700 }}>{h.imported_count}</td>
                          <td style={{ color: '#fbbf24' }}>{h.skipped_count}</td>
                          <td style={{ fontSize: '11.5px', color: '#94a3b8' }}>{h.admin_name || 'Admin'}</td>
                          <td>
                            <button
                              className="admin-btn-secondary"
                              style={{ padding: '3px 8px', fontSize: '11px' }}
                              onClick={() => {
                                setLeadsBatchFilter(h.batch_id);
                                setCurrentPage('leads');
                                setShowHistoryModal(false);
                              }}
                            >
                              View Leads
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="admin-modal-actions" style={{ marginTop: '16px' }}>
                <button className="admin-btn-secondary" onClick={() => setShowHistoryModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Employee Modal */}
      <CreateEmployeeModal
        isOpen={showCreateModal || Boolean(editingEmployee)}
        employee={editingEmployee}
        onClose={() => {
          setShowCreateModal(false);
          setEditingEmployee(null);
        }}
        onSave={(savedEmp) => {
          setShowCreateModal(false);
          setEditingEmployee(null);
          fetchEmployees();
          fetchDashboard();
          showToast(editingEmployee ? `Employee profile for ${savedEmp?.name || 'staff'} updated successfully!` : 'Employee created successfully!');
        }}
      />

      {/* Aadhaar Documents & KYC Viewer Modal */}
      {aadhaarDocModal && aadhaarDocModal.isOpen && (
        <div className="admin-modal-overlay" onClick={() => setAadhaarDocModal(null)}>
          <div className="admin-modal" style={{ maxWidth: '640px', width: '92vw' }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="admin-modal-header-left">
                <ShieldCheck size={20} color="#f59e0b" />
                <div>
                  <h3 style={{ margin: 0 }}>Aadhaar & KYC Documents</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                    {aadhaarDocModal.employee?.name} • ID: {aadhaarDocModal.employee?.employee_id || 'SE-000'}
                  </p>
                </div>
              </div>
              <button className="admin-modal-close" onClick={() => setAadhaarDocModal(null)}>
                <XCircle size={18} />
              </button>
            </div>

            <div className="admin-modal-form" style={{ padding: '20px' }}>
              {aadhaarDocModal.loading ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                  <div className="admin-spinner" style={{ margin: '0 auto 12px' }}></div>
                  <p style={{ fontSize: '13px' }}>Decrypting and loading Aadhaar verification documents...</p>
                </div>
              ) : (
                <>
                  {/* Verified Aadhaar Banner */}
                  <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '14px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                        Verified Aadhaar Number
                      </span>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', fontFamily: 'monospace', letterSpacing: '1px', marginTop: '2px' }}>
                        {aadhaarDocModal.aadhaarNumber ? (
                          aadhaarDocModal.aadhaarNumber.length === 12
                            ? `${aadhaarDocModal.aadhaarNumber.slice(0, 4)} ${aadhaarDocModal.aadhaarNumber.slice(4, 8)} ${aadhaarDocModal.aadhaarNumber.slice(8, 12)}`
                            : aadhaarDocModal.aadhaarNumber
                        ) : 'Not Provided'}
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                      🔒 Admin Decrypted
                    </span>
                  </div>

                  {/* Documents Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                    {/* Front Document */}
                    <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '12px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '8px' }}>
                        Aadhaar Front Side
                      </span>
                      {aadhaarDocModal.frontDoc ? (
                        <div>
                          <div style={{ height: '140px', borderRadius: '6px', overflow: 'hidden', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', border: '1px solid #334155' }}>
                            <img src={aadhaarDocModal.frontDoc} alt="Aadhaar Front" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                          </div>
                          <a
                            href={aadhaarDocModal.frontDoc}
                            download={`Aadhaar_Front_${aadhaarDocModal.employee?.employee_id || 'emp'}.png`}
                            className="admin-btn-secondary"
                            style={{ width: '100%', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', padding: '5px 0' }}
                          >
                            <Download size={13} />
                            <span>Download Front</span>
                          </a>
                        </div>
                      ) : (
                        <div style={{ height: '140px', border: '1px dashed #475569', borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '12px' }}>
                          <FileText size={24} />
                          <span style={{ marginTop: '6px' }}>No Front Document Uploaded</span>
                        </div>
                      )}
                    </div>

                    {/* Back Document */}
                    <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '12px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '8px' }}>
                        Aadhaar Back Side
                      </span>
                      {aadhaarDocModal.backDoc ? (
                        <div>
                          <div style={{ height: '140px', borderRadius: '6px', overflow: 'hidden', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', border: '1px solid #334155' }}>
                            <img src={aadhaarDocModal.backDoc} alt="Aadhaar Back" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                          </div>
                          <a
                            href={aadhaarDocModal.backDoc}
                            download={`Aadhaar_Back_${aadhaarDocModal.employee?.employee_id || 'emp'}.png`}
                            className="admin-btn-secondary"
                            style={{ width: '100%', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', padding: '5px 0' }}
                          >
                            <Download size={13} />
                            <span>Download Back</span>
                          </a>
                        </div>
                      ) : (
                        <div style={{ height: '140px', border: '1px dashed #475569', borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '12px' }}>
                          <FileText size={24} />
                          <span style={{ marginTop: '6px' }}>No Back Document Uploaded</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="admin-modal-actions" style={{ marginTop: '18px' }}>
                    <button
                      type="button"
                      className="admin-btn-secondary"
                      onClick={() => {
                        const target = aadhaarDocModal.employee;
                        setAadhaarDocModal(null);
                        setEditingEmployee(target);
                      }}
                    >
                      <Edit3 size={13} /> <span>Edit Documents</span>
                    </button>
                    <button type="button" className="admin-btn-primary" onClick={() => setAadhaarDocModal(null)}>
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModal && (
        <div className="admin-modal-overlay" onClick={() => setResetModal(null)}>
          <div className="admin-modal admin-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="admin-modal-header-left">
                <KeyRound size={18} className="admin-modal-icon" />
                <h3>Reset Password</h3>
              </div>
              <button className="admin-modal-close" onClick={() => setResetModal(null)}>
                <XCircle size={18} />
              </button>
            </div>
            <div className="admin-modal-form">
              <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '16px' }}>
                Reset password for <strong style={{ color: '#e2e8f0' }}>{resetModal.name}</strong> ({resetModal.employee_id})
              </p>
              <div className="admin-form-group">
                <label>New Password</label>
                <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" />
              </div>
              <div className="admin-modal-actions">
                <button className="admin-btn-cancel" onClick={() => setResetModal(null)}>Cancel</button>
                <button className="admin-btn-primary" onClick={handleResetPassword}>
                  <KeyRound size={14} /> <span>Reset Password</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Add Lead & Assign Modal */}
      <AdminAddLeadModal
        isOpen={showAddLeadModal}
        onClose={() => setShowAddLeadModal(false)}
        employees={employees}
        onSave={(newLead, assignedEmp) => {
          fetchAdminLeads();
          fetchDashboard();
          showToast(assignedEmp ? `Lead ${newLead.name} created and assigned to ${assignedEmp.name}!` : `Lead ${newLead.name} created successfully!`);
        }}
      />

      {/* Toast */}
      {toast && (
        <div className="admin-toast-container">
          <div className={`admin-toast ${toast.type}`}>
            {toast.type === 'success' ? <CheckCircle2 size={15} color="#34d399" /> : <AlertCircle size={15} color="#f87171" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
