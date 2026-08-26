import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  KeyRound,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  FileText,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { api } from '../../services/api';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';

export const ManagerTeamView: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Password Reset Modal State
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await api.getManagerTeam();
      setEmployees(res.employees || []);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: 'Failed to load team directory' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp || !newPassword) return;
    try {
      setResetting(true);
      const res = await api.resetTeamEmployeePassword(selectedEmp.id, newPassword);
      setFeedbackMsg({ type: 'success', text: res.message || `Password reset for ${selectedEmp.name}` });
      setSelectedEmp(null);
      setNewPassword('');
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to reset password' });
    } finally {
      setResetting(false);
    }
  };

  const filtered = employees.filter((e) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      e.name?.toLowerCase().includes(s) ||
      e.email?.toLowerCase().includes(s) ||
      e.phone?.includes(s) ||
      e.emp_or_mgr_id?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-4 font-sans text-slate-800 pb-12 animate-fade-in">
      {/* Toast Alert */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded-lg flex items-center justify-between text-xs font-semibold ${
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

      {/* Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 mb-1">
            <span className="text-[#1e40af] font-bold">Dashboard</span>
            <span>/</span>
            <span className="text-[#1e40af] font-bold">Manager Work Center</span>
            <span>/</span>
            <span className="text-slate-800 font-bold">My Team</span>
          </div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="h-4 w-4 text-[#15803d]" />
            <span>Team Overview & Staff Directory</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Employees assigned directly to your department and operational hierarchy.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-bold text-slate-800 shadow-2xs">
            {employees.length} Team Members
          </span>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Employee Name, ID, Email, Phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#15803d]"
          />
        </div>
      </div>

      {/* Team Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs bg-white rounded-xl border border-gray-200">
          Loading team members...
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((emp) => (
            <div
              key={emp.id}
              className="p-4 rounded-xl bg-white border border-gray-200 hover:border-emerald-500 transition-all shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-[#15803d] text-white font-black text-sm flex items-center justify-center shadow-2xs">
                    {emp.name?.charAt(0) || 'E'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-tight">{emp.name}</h4>
                    <span className="text-[11px] font-mono text-slate-500">{emp.emp_or_mgr_id}</span>
                  </div>
                </div>
                <Badge status={emp.status} />
              </div>

              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span className="truncate">{emp.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span>{emp.phone || '—'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[11px] text-slate-500">
                    Joined: {emp.joining_date ? new Date(emp.joining_date).toLocaleDateString() : '—'}
                  </span>
                </div>
              </div>

              {/* Work Throughput Metrics */}
              <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-gray-100 text-center">
                <div className="p-2 rounded-lg bg-gray-50 border border-gray-200">
                  <span className="text-[10px] text-slate-500 block font-semibold">Leads</span>
                  <span className="text-sm font-black text-slate-900">{emp.leads_count || 0}</span>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 block font-semibold">Clients</span>
                  <span className="text-sm font-black text-emerald-700">{emp.clients_count || 0}</span>
                </div>
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                  <span className="text-[10px] text-amber-700 block font-semibold">Tasks</span>
                  <span className="text-sm font-black text-amber-700">{emp.active_tasks_count || 0}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-1">
                <button
                  onClick={() => {
                    setSelectedEmp(emp);
                    setNewPassword('');
                  }}
                  className="w-full py-1.5 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-slate-700 hover:text-slate-900 border border-gray-200 text-xs font-semibold transition-all flex items-center justify-center space-x-1.5"
                >
                  <KeyRound className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Reset Staff Password</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500 rounded-xl bg-white border border-gray-200 text-xs">
          No team employees found.
        </div>
      )}

      {/* Password Reset Modal */}
      <Modal
        isOpen={!!selectedEmp}
        onClose={() => setSelectedEmp(null)}
        title={`Reset Password — ${selectedEmp?.name}`}
        subtitle={`Emp ID: ${selectedEmp?.emp_or_mgr_id} • Staff in your hierarchy`}
      >
        <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 block mb-1 font-semibold">Enter New Password *</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Minimum 6 characters. Action is logged in team audit trail.
            </span>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setSelectedEmp(null)}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-slate-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={resetting}
              className="px-5 py-2.5 rounded-lg bg-[#15803d] hover:bg-emerald-800 text-white font-bold shadow-xs disabled:opacity-50"
            >
              {resetting ? 'Resetting...' : 'Confirm Reset Password'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
