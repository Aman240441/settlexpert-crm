import React, { useState, useEffect } from 'react';
import { Layers, Plus, Search, Filter, Phone, Mail, Building2, UserCheck, FileSpreadsheet } from 'lucide-react';
import { api } from '../../services/api';
import { Lead, User, Department } from '../../types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';

interface LeadsViewProps {
  onNavigateToImport?: () => void;
}

export const LeadsView: React.FC<LeadsViewProps> = ({ onNavigateToImport }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    loan_amount: 500000,
    bank_name: 'HDFC Bank',
    status: 'new',
    manager_id: '',
    employee_id: '',
    department_id: '',
  });

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [leadRes, mgrRes, empRes, deptRes] = await Promise.all([
        api.getLeads(),
        api.getManagers(),
        api.getEmployees(),
        api.getDepartments(),
      ]);
      setLeads(leadRes.leads);
      setManagers(mgrRes.managers);
      setEmployees(empRes.employees);
      setDepartments(deptRes.departments);
      if (mgrRes.managers.length > 0 && !formData.manager_id) {
        setFormData((prev) => ({ ...prev, manager_id: mgrRes.managers[0].id }));
      }
      if (deptRes.departments.length > 0 && !formData.department_id) {
        setFormData((prev) => ({ ...prev, department_id: deptRes.departments[0].id }));
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: 'Failed to load leads data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createLead(formData);
      setFeedbackMsg({ type: 'success', text: `Lead for ${formData.name} created successfully!` });
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to create lead' });
    }
  };

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amt || 0);
  };

  const filteredLeads = leads.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search) ||
      (l.bank_name && l.bank_name.toLowerCase().includes(search.toLowerCase())) ||
      (l.lead_number && l.lead_number.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs font-semibold ${feedbackMsg.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
            : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
            }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-900 font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="h-5 w-5 text-amber-500" />
            <span>CRM — Leads Pipeline</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin oversight across debt settlement prospects, loan exposure, and handling managers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onNavigateToImport && (
            <button
              onClick={onNavigateToImport}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Import Leads (Excel/CSV)</span>
            </button>
          )}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create Lead</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search leads by name, phone, bank or lead number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
        />
      </div>

      {/* Leads Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Lead Ref / Date</th>
                <th className="py-3.5 px-4">Lead Name</th>
                <th className="py-3.5 px-4">Phone / Email</th>
                <th className="py-3.5 px-4">Debt / Bank</th>
                <th className="py-3.5 px-4">Managing Lead</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    Loading leads...
                  </td>
                </tr>
              ) : filteredLeads.length > 0 ? (
                filteredLeads.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-900 block">{l.lead_number}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(l.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{l.name}</td>
                    <td className="py-3.5 px-4">
                      <p className="text-slate-800 font-medium">{l.phone}</p>
                      <p className="text-[11px] text-slate-400">{l.email || '—'}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-emerald-600 block">{formatCurrency(l.loan_amount)}</span>
                      <span className="text-[11px] text-slate-500">{l.bank_name || 'Bank not specified'}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      <span className="inline-flex items-center space-x-1">
                        <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                        <span>{l.manager_name || 'Unassigned'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={l.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    No leads found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Settlement Lead"
        subtitle="Record prospective client intake details."
        maxWidth="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Sunil Gavaskar"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Phone *</label>
            <input
              type="text"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 9876543210"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">City / Location</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="e.g. Mumbai, Delhi, Bengaluru"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Bank Name / Lenders</label>
            <input
              type="text"
              value={formData.bank_name}
              onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              placeholder="e.g. ICICI Bank, SBI Cards"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Estimated Debt (₹)</label>
            <input
              type="number"
              value={formData.loan_amount}
              onChange={(e) => setFormData({ ...formData, loan_amount: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Assign Manager</label>
              <select
                value={formData.manager_id}
                onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">None / Direct</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.emp_or_mgr_id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Assign Employee <span className="text-emerald-600 font-bold">(Direct to CRM)</span>
              </label>
              <select
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                className="w-full px-3 py-2 bg-emerald-50/50 border border-emerald-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-semibold"
              >
                <option value="">Unassigned Pool</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.emp_or_mgr_id || 'EMP'})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 cursor-pointer"
            >
              Save Lead
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
