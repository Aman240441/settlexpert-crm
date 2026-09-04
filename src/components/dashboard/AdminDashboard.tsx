import React, { useEffect, useState } from 'react';
import {
  Users,
  UserCheck,
  Scale,
  DollarSign,
  Layers,
  FileSignature,
  CreditCard,
  Clock,
  CheckCircle2,
  Calendar,
  ArrowRight,
  TrendingUp,
  Activity,
  ShieldCheck,
  Building2,
  Phone,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../../services/api';
import { DashboardStats } from '../../types';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';

interface AdminDashboardProps {
  onNavigate: (section: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amt || 0);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="text-xs text-slate-400 font-medium">Loading Settl Expert Command Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-16">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#1e3a8a] via-[#1e40af] to-[#2563eb] text-white p-6 shadow-sm border border-blue-900/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider">
              Step 1 • Master Control
            </span>
            <span className="text-xs text-blue-200 font-medium">• Real-time Sync Active</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight mt-1.5">
            Executive Admin Control Center
          </h2>
          <p className="text-xs text-blue-100 mt-1 max-w-2xl">
            Governing organization hierarchies, managers, advocates, fee plans, agreements, and live audit trails across Settl Expert.
          </p>
        </div>
        <div className="flex items-center space-x-2.5 flex-wrap">
          <button
            onClick={() => onNavigate('staff-directory')}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-blue-50 text-blue-900 text-xs font-bold transition-all shadow-sm flex items-center space-x-2 cursor-pointer"
          >
            <Users className="h-4 w-4 text-blue-600" />
            <span>Staff Directory & KYC</span>
          </button>
          <button
            onClick={() => onNavigate('managers')}
            className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all border border-white/20 flex items-center space-x-2 cursor-pointer"
          >
            <UserCheck className="h-4 w-4 text-white" />
            <span>Managers</span>
          </button>
          <button
            onClick={() => onNavigate('advocates')}
            className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all border border-white/20 flex items-center space-x-2 cursor-pointer"
          >
            <Scale className="h-4 w-4 text-white" />
            <span>Advocates</span>
          </button>
        </div>
      </div>

      {/* 1. Core Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <StatCard
          title="Managers"
          value={stats?.counts.totalManagers || 0}
          icon={UserCheck}
          color="blue"
          subtitle="Department heads"
          onClick={() => onNavigate('managers')}
        />
        <StatCard
          title="Employees"
          value={stats?.counts.totalEmployees || 0}
          icon={Users}
          color="indigo"
          subtitle="Active workforce"
          onClick={() => onNavigate('employees')}
        />
        <StatCard
          title="Advocates"
          value={stats?.counts.totalAdvocates || 0}
          icon={Scale}
          color="purple"
          subtitle="Legal counsels"
          onClick={() => onNavigate('advocates')}
        />
        <StatCard
          title="Leads"
          value={stats?.counts.totalLeads || 0}
          icon={Layers}
          color="amber"
          subtitle="Pipelines"
          onClick={() => onNavigate('leads')}
        />
        <StatCard
          title="Clients"
          value={stats?.counts.totalClients || 0}
          icon={CheckCircle2}
          color="emerald"
          subtitle="Retained cases"
          onClick={() => onNavigate('clients')}
        />
        <StatCard
          title="Agreements"
          value={stats?.counts.totalAgreements || 0}
          icon={FileSignature}
          color="rose"
          subtitle="Active contracts"
          onClick={() => onNavigate('agreements')}
        />
      </div>

      {/* 2. Finance & Operations Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Finance Snapshot */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">Finance Highlights</h3>
                <p className="text-xs text-slate-500">Total fees, verified collections, and pending reconciliations</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('payments')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1 cursor-pointer"
            >
              <span>View Payments</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-1">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight block">Total Agreement Fees</span>
              <span className="text-lg font-black text-slate-900 mt-1 block">
                {formatCurrency(stats?.finance.totalFees || 0)}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-tight block">Total Received</span>
              <span className="text-lg font-black text-emerald-700 mt-1 block">
                {formatCurrency(stats?.finance.totalReceived || 0)}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight block">Total Pending Dues</span>
              <span className="text-lg font-black text-amber-600 mt-1 block">
                {formatCurrency(stats?.finance.totalPending || 0)}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-tight block">Pending Verification</span>
              <span className="text-lg font-black text-amber-700 mt-1 block">
                {stats?.finance.pendingVerificationCount || 0} ({formatCurrency(stats?.finance.pendingVerificationAmt || 0)})
              </span>
            </div>
          </div>
        </div>

        {/* Operations Snapshot */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">Operations</h3>
                <p className="text-xs text-slate-500">Daily follow-ups & tasks</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              Tasks
            </button>
          </div>

          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs font-semibold text-slate-700 flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span>Today's Follow-ups</span>
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {stats?.operations.todayFollowups || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs font-semibold text-slate-700 flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-amber-600" />
                <span>Pending Tasks</span>
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {stats?.operations.pendingTasks || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs font-semibold text-slate-700 flex items-center space-x-2">
                <FileSignature className="h-4 w-4 text-purple-600" />
                <span>Pending Agreements</span>
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                {stats?.operations.pendingAgreements || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Manager Overview Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">Manager Overview</h3>
            <p className="text-xs text-slate-500">Department leaders, staffing, and active portfolios</p>
          </div>
          <button
            onClick={() => onNavigate('managers')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1 cursor-pointer"
          >
            <span>All Managers ({stats?.managerOverview?.length || 0})</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Manager</th>
                <th className="py-3 px-4">Manager Type</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-center">Employees</th>
                <th className="py-3 px-4 text-center">Leads</th>
                <th className="py-3 px-4 text-center">Clients</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {stats?.managerOverview && stats.managerOverview.length > 0 ? (
                stats.managerOverview.map((mgr) => (
                  <tr key={mgr.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs overflow-hidden shrink-0">
                          {mgr.profile_image ? (
                            <img src={mgr.profile_image} alt={mgr.name} className="h-full w-full object-cover" />
                          ) : (
                            mgr.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{mgr.name}</p>
                          <span className="text-[10px] text-slate-400 font-mono">{mgr.emp_or_mgr_id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                        {mgr.manager_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{mgr.department_name}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-900">{mgr.employee_count}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-600">{mgr.lead_count}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600">{mgr.client_count}</td>
                    <td className="py-3.5 px-4">
                      <Badge status={mgr.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    No managers recorded yet. Click "Create Manager" to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Feeds Grid: Recent Leads, Recent Clients, Recent Payments, Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Recent Leads */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Recent Leads</span>
              <button onClick={() => onNavigate('leads')} className="text-[11px] text-blue-600 hover:underline font-bold">
                View All
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {stats?.recentLeads && stats.recentLeads.length > 0 ? (
                stats.recentLeads.map((l) => (
                  <div key={l.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-left">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900">{l.name}</p>
                      <Badge status={l.status} size="sm" />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {l.bank_name} • {formatCurrency(l.loan_amount)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">No leads available</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Clients */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Recent Clients</span>
              <button onClick={() => onNavigate('clients')} className="text-[11px] text-blue-600 hover:underline font-bold">
                View All
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {stats?.recentClients && stats.recentClients.length > 0 ? (
                stats.recentClients.map((c) => (
                  <div key={c.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-left">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900">{c.name}</p>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">{c.client_number}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Target: {formatCurrency(c.settlement_target)} • {c.fee_plan_name || 'Standard'}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">No clients available</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Recent Payments</span>
              <button onClick={() => onNavigate('payments')} className="text-[11px] text-blue-600 hover:underline font-bold">
                View All
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {stats?.recentPayments && stats.recentPayments.length > 0 ? (
                stats.recentPayments.map((p) => (
                  <div key={p.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-600">{formatCurrency(p.amount)}</span>
                      <Badge status={p.status} size="sm" />
                    </div>
                    <p className="text-[11px] text-slate-700 font-medium mt-0.5">{p.client_name}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{p.receipt_number}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">No payments recorded</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Audit Activity */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Audit Stream</span>
              <button onClick={() => onNavigate('audit')} className="text-[11px] text-blue-600 hover:underline font-bold">
                All Logs
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                stats.recentActivity.slice(0, 4).map((a) => (
                  <div key={a.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">{a.action}</span>
                      <span className="text-[10px] text-slate-400">{new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">{a.user_name} • {a.module}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">No activity logged</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
