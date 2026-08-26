import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Search,
  UserPlus,
  ArrowRightLeft,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Building2,
  Phone,
  CheckCircle2,
  History,
  FileSpreadsheet,
  Plus
} from 'lucide-react';
import { api } from '../../services/api';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';

interface ManagerLeadsViewProps {
  onNavigateToImport?: () => void;
}

export const ManagerLeadsView: React.FC<ManagerLeadsViewProps> = ({ onNavigateToImport }) => {
  const [leads, setLeads] = useState<any[]>([]);
  const [teamEmployees, setTeamEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [empFilter, setEmpFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Create Lead Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    loan_amount: 500000,
    bank_name: 'HDFC Bank',
    employee_id: ''
  });

  // Reassign Modal State
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [targetEmpId, setTargetEmpId] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [reassigning, setReassigning] = useState(false);

  // Follow-up history drawer
  const [selectedLeadHistory, setSelectedLeadHistory] = useState<any>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const [leadsRes, teamRes] = await Promise.all([
        api.getManagerLeads({
          search: search || undefined,
          status: statusFilter || undefined,
          employee_id: empFilter || undefined,
          date: dateFilter || undefined,
          page,
          limit
        }),
        api.getManagerTeam()
      ]);
      setLeads(leadsRes.leads);
      setTotal(leadsRes.pagination.total);
      setTeamEmployees(teamRes.employees || []);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: 'Failed to load manager leads' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [search, statusFilter, empFilter, dateFilter, page, limit]);

  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !targetEmpId) return;

    try {
      setReassigning(true);
      const res = await api.assignManagerLead(selectedLead.id, targetEmpId, reassignReason);
      setFeedbackMsg({ type: 'success', text: res.message || 'Lead reassigned successfully' });
      setReassignModalOpen(false);
      setSelectedLead(null);
      setTargetEmpId('');
      setReassignReason('');
      fetchLeads();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to reassign lead' });
    } finally {
      setReassigning(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.createLead(createFormData);
      setFeedbackMsg({
        type: 'success',
        text: `Lead for ${createFormData.name} created successfully and assigned to employee CRM!`
      });
      setIsCreateOpen(false);
      setCreateFormData({
        name: '',
        phone: '',
        email: '',
        city: '',
        loan_amount: 500000,
        bank_name: 'HDFC Bank',
        employee_id: ''
      });
      fetchLeads();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to create lead' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLeadDetail = async (lead: any) => {
    try {
      const detailed = await api.getCRMLead(lead.id);
      setSelectedLeadHistory(detailed);
    } catch (err) {
      setSelectedLeadHistory(lead);
    }
  };

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amt || 0);
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-12 animate-fade-in">
      {/* Toast Alert */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs font-semibold ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border border-rose-300 text-rose-800'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-500 hover:text-slate-800 font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            <span>Team Lead Management & Distribution</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor incoming leads, verify follow-up schedules, and rebalance employee case allocations.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {onNavigateToImport && (
            <button
              onClick={onNavigateToImport}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Import & Distribute</span>
            </button>
          )}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Lead</span>
          </button>
          <span className="px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-700">
            {total} Total Leads Scoped
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative sm:col-span-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Lead ID, Name, Phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Lead Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="interested">Interested</option>
            <option value="follow_up">Follow Up</option>
            <option value="converted">Converted</option>
            <option value="not_interested">Not Interested</option>
          </select>
        </div>

        <div>
          <select
            value={empFilter}
            onChange={(e) => setEmpFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Team Employees</option>
            {teamEmployees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.emp_or_mgr_id})
              </option>
            ))}
          </select>
        </div>

        <div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 px-3 py-2 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Leads Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 w-10">#</th>
                <th className="py-3.5 px-4">Lead ID</th>
                <th className="py-3.5 px-4">Lead Name / City</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Total Debt</th>
                <th className="py-3.5 px-4">Assigned Staff</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4">Next Follow-up</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                    Loading team leads...
                  </td>
                </tr>
              ) : leads.length > 0 ? (
                leads.map((l, idx) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-slate-400 font-medium">{(page - 1) * limit + idx + 1}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 whitespace-nowrap">
                      {l.lead_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{l.name}</span>
                      <span className="text-[11px] text-slate-500">{l.city || '—'}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 font-medium">{l.phone}</td>
                    <td className="py-3.5 px-4 font-bold text-rose-600">
                      {formatCurrency(l.total_debt)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">
                        {l.employee_name || 'Unassigned'}
                      </span>
                      {l.employee_code && (
                        <span className="text-[10px] font-mono text-slate-400 font-bold">{l.employee_code}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(l.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-[11px] whitespace-nowrap">
                      {l.next_follow_up_date ? (
                        <span className="text-amber-700 font-bold">
                          {new Date(l.next_follow_up_date).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={l.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenLeadDetail(l)}
                        title="View Full Lead & Follow-up Timeline"
                        className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 transition-all inline-flex items-center cursor-pointer"
                      >
                        <History className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          setSelectedLead(l);
                          setTargetEmpId(l.employee_id || (teamEmployees[0] ? teamEmployees[0].id : ''));
                          setReassignModalOpen(true);
                        }}
                        title="Reassign to Team Employee"
                        className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 transition-all inline-flex items-center cursor-pointer"
                      >
                        <ArrowRightLeft className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                    No leads found matching current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <span>Showing</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(parseInt(e.target.value));
                setPage(1);
              }}
              className="bg-white border border-slate-200 rounded px-2 py-1 text-slate-900 focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>of {total} total leads</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-1.5 rounded-lg bg-white border border-slate-200 disabled:opacity-30 hover:bg-slate-100 text-slate-700 cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-bold text-slate-900">Page {page}</span>
            <button
              disabled={page * limit >= total}
              onClick={() => setPage(page + 1)}
              className="p-1.5 rounded-lg bg-white border border-slate-200 disabled:opacity-30 hover:bg-slate-100 text-slate-700 cursor-pointer shadow-2xs"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* REASSIGN LEAD MODAL */}
      <Modal
        isOpen={reassignModalOpen}
        onClose={() => setReassignModalOpen(false)}
        title={`Reassign Lead — ${selectedLead?.lead_number}`}
        subtitle={`Current Client: ${selectedLead?.name} • Assigned To: ${selectedLead?.employee_name || 'Unassigned'}`}
      >
        <form onSubmit={handleReassignSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Select Team Member *</label>
            <select
              required
              value={targetEmpId}
              onChange={(e) => setTargetEmpId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value="">Choose Employee from your team</option>
              {teamEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.emp_or_mgr_id})
                </option>
              ))}
            </select>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Only employees in your assigned team or department are available.
            </span>
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Reassignment Reason / Note</label>
            <input
              type="text"
              value={reassignReason}
              onChange={(e) => setReassignReason(e.target.value)}
              placeholder="e.g. Workload balancing, language match, regional coverage"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setReassignModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={reassigning || !targetEmpId}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {reassigning ? 'Reassigning...' : 'Confirm Reassignment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* LEAD FOLLOW-UP TIMELINE MODAL */}
      <Modal
        isOpen={!!selectedLeadHistory}
        onClose={() => setSelectedLeadHistory(null)}
        title={`Lead History — ${selectedLeadHistory?.lead_number}`}
        subtitle={`Client: ${selectedLeadHistory?.name} • Phone: ${selectedLeadHistory?.phone}`}
        maxWidth="lg"
      >
        {selectedLeadHistory && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Debt</span>
                <span className="text-sm font-black text-rose-400">
                  {formatCurrency(selectedLeadHistory.total_debt)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Status</span>
                <span className="font-bold text-white capitalize">{selectedLeadHistory.status}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Created Date</span>
                <span className="text-slate-300 font-mono">
                  {new Date(selectedLeadHistory.created_at).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Assigned Staff</span>
                <span className="text-indigo-400 font-bold">
                  {selectedLeadHistory.employee_name || 'Unassigned'}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <History className="h-3.5 w-3.5 text-indigo-400" />
                <span>Follow-Up Interaction Timeline</span>
              </h4>

              {selectedLeadHistory.follow_ups && selectedLeadHistory.follow_ups.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {selectedLeadHistory.follow_ups.map((f: any) => (
                    <div
                      key={f.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-indigo-300">{f.user_name || 'Consultant'}</span>
                        <span className="text-slate-500 font-mono">
                          {new Date(f.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-200">{f.remark || 'No remark logged'}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-900">
                        <span>Call Status: <strong className="text-white">{f.call_status}</strong></span>
                        {f.next_follow_up_date && (
                          <span className="text-amber-400">
                            Next: {new Date(f.next_follow_up_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-500 text-center">
                  No interaction records logged yet.
                </p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLeadHistory(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 font-bold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* CREATE LEAD MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Team Lead"
        subtitle="Manually enter lead details and assign directly to your team employee."
        maxWidth="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={createFormData.name}
              onChange={e => setCreateFormData({ ...createFormData, name: e.target.value })}
              placeholder="e.g. Anand Kumar"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Phone *</label>
            <input
              type="text"
              required
              value={createFormData.phone}
              onChange={e => setCreateFormData({ ...createFormData, phone: e.target.value })}
              placeholder="+91 9876543210"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
            <input
              type="email"
              value={createFormData.email}
              onChange={e => setCreateFormData({ ...createFormData, email: e.target.value })}
              placeholder="anand@example.com"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">City / Location</label>
            <input
              type="text"
              value={createFormData.city}
              onChange={e => setCreateFormData({ ...createFormData, city: e.target.value })}
              placeholder="e.g. Mumbai, Delhi, Lucknow"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Estimated Debt (₹)</label>
            <input
              type="number"
              value={createFormData.loan_amount}
              onChange={e => setCreateFormData({ ...createFormData, loan_amount: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Assign to Team Employee <span className="text-emerald-400 font-bold">(Direct to CRM)</span>
            </label>
            <select
              value={createFormData.employee_id}
              onChange={e => setCreateFormData({ ...createFormData, employee_id: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-emerald-500/50 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">Leave Unassigned in Team Pool</option>
              {teamEmployees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.emp_or_mgr_id || 'EMP'})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              Save & Assign Lead
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
