import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  TrendingUp,
  Clock,
  ShieldCheck,
  CreditCard,
  FileCheck,
  Calendar,
  ArrowRight,
  AlertTriangle,
  Scale,
  Sparkles,
  CheckCircle2,
  FileText,
  Layers,
  Briefcase,
  Eye,
  RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';

interface ManagerDashboardViewProps {
  onNavigateTab: (tab: string, filter?: string) => void;
}

export const ManagerDashboardView: React.FC<ManagerDashboardViewProps> = ({ onNavigateTab }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getManagerDashboard();
      setData(res);
    } catch (err) {
      console.error('Failed to load manager dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amt || 0);
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20 font-sans">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#15803d] border-t-transparent" />
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Loading Manager Work Center...
          </p>
        </div>
      </div>
    );
  }

  const { topCards, pipeline, managerType } = data;
  const isFinance = managerType === 'FIN' || managerType === 'FINANCE' || managerType === 'COLLECTION';
  const isLegal = managerType === 'LEGAL';

  return (
    <div className="space-y-5 font-sans text-slate-800 pb-12 animate-fade-in">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 mb-1">
            <span className="text-[#1e40af] font-bold">Dashboard</span>
            <span>/</span>
            <span className="text-[#1e40af] font-bold">{managerType} Manager</span>
            <span>/</span>
            <span className="text-slate-800 font-bold">Overview Command</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Welcome to {managerType} Manager Work Center
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time pipeline monitoring, team assignments, legal advocate allocation, and finance control.
          </p>
        </div>

        <button
          onClick={fetchDashboard}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-slate-700 text-xs font-semibold hover:bg-gray-50 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Target & Operational Banner */}
      <div className="rounded-xl overflow-hidden border border-blue-900/20 shadow-sm bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] text-white p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-200 block">
              Departmental Operational Command
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              {managerType} Division Pipeline & Quota
            </h2>
            <p className="text-xs text-blue-100 font-medium max-w-xl">
              Supervising active staff, client conciliation lifecycles, and verification SLA metrics.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onNavigateTab('leads')}
              className="px-4 py-2 rounded-lg bg-white text-[#1e3a8a] hover:bg-blue-50 text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
            >
              <span>Manage Leads</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Primary Top Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div
          onClick={() => onNavigateTab('team')}
          className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs hover:border-blue-500 transition-all cursor-pointer space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">My Employees</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{topCards.myEmployees}</p>
          <span className="text-[10px] text-slate-500 font-medium block">Assigned team staff</span>
        </div>

        <div
          onClick={() => onNavigateTab('leads')}
          className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs hover:border-emerald-500 transition-all cursor-pointer space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">My Leads</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{topCards.myLeads}</p>
          <span className="text-[10px] text-slate-500 font-medium block">Team leads pipeline</span>
        </div>

        <div
          onClick={() => onNavigateTab('clients')}
          className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs hover:border-blue-500 transition-all cursor-pointer space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Clients</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{topCards.myClients}</p>
          <span className="text-[10px] text-slate-500 font-medium block">Retained portfolio</span>
        </div>

        <div
          onClick={() => onNavigateTab('clients')}
          className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs hover:border-emerald-500 transition-all cursor-pointer space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Clients</span>
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-1">{topCards.activeClients}</p>
          <span className="text-[10px] text-slate-500 font-medium block">Ongoing advocacy</span>
        </div>

        <div
          onClick={() => onNavigateTab('tasks')}
          className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs hover:border-amber-500 transition-all cursor-pointer space-y-1 col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Tasks</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700 mt-1">{topCards.pendingTasks}</p>
          <span className="text-[10px] text-slate-500 font-medium block">Action items pending</span>
        </div>
      </div>

      {/* Role Specific Highlight Section */}
      {isFinance && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => onNavigateTab('verification')}
            className="p-4 rounded-xl bg-white border border-amber-300 shadow-xs cursor-pointer hover:border-amber-500 transition-all space-y-1"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Verification Queue</span>
                <p className="text-2xl font-black text-slate-900 mt-1">{topCards.pendingVerification}</p>
              </div>
              <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
                <CreditCard className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Receipts awaiting verification and ledger confirmation.</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs space-y-1">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Total Verified Collection</span>
                <p className="text-2xl font-black text-emerald-700 mt-1">{formatCurrency(topCards.totalCollection)}</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Verified payments processed in company settlement accounts.</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs space-y-1">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Outstanding Retainers</span>
                <p className="text-2xl font-black text-rose-700 mt-1">{formatCurrency(topCards.pendingCollection)}</p>
              </div>
              <div className="p-2 rounded-lg bg-rose-50 text-rose-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Uncollected retainer balance from active client portfolio.</p>
          </div>
        </div>
      )}

      {isLegal && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => onNavigateTab('advocates')}
            className="p-4 rounded-xl bg-white border border-blue-200 shadow-xs cursor-pointer hover:border-blue-400 transition-all space-y-1"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Empanelled Advocates</span>
                <p className="text-2xl font-black text-slate-900 mt-1">{topCards.advocatesCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
                <Scale className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Active advocates registered across legal specializations.</p>
          </div>

          <div
            onClick={() => onNavigateTab('clients')}
            className="p-4 rounded-xl bg-white border border-amber-200 shadow-xs cursor-pointer hover:border-amber-400 transition-all space-y-1"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Clients Requiring Advocate</span>
                <p className="text-2xl font-black text-amber-700 mt-1">{topCards.unassignedAdvocates}</p>
              </div>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Clients converted without an assigned legal counsel.</p>
          </div>

          <div
            onClick={() => onNavigateTab('clients')}
            className="p-4 rounded-xl bg-white border border-emerald-200 shadow-xs cursor-pointer hover:border-emerald-400 transition-all space-y-1"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Advocate Assigned Cases</span>
                <p className="text-2xl font-black text-emerald-700 mt-1">{topCards.assignedAdvocates}</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Clients actively represented by empanelled legal counsel.</p>
          </div>
        </div>
      )}

      {/* Team Lead Pipeline Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-[#15803d]" />
            <h3 className="text-sm font-bold text-slate-900">Staff Performance & Pipeline Overview</h3>
          </div>
          <button
            onClick={() => onNavigateTab('team')}
            className="text-xs font-bold text-[#1e40af] hover:text-blue-900 inline-flex items-center space-x-1"
          >
            <span>View All Team Members</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Employee ID</th>
                <th className="py-3 px-4">Total Leads</th>
                <th className="py-3 px-4">Clients Converted</th>
                <th className="py-3 px-4">Conversion Rate</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-slate-700">
              {pipeline && pipeline.length > 0 ? (
                pipeline.map((item: any) => (
                  <tr key={item.employee.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{item.employee.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{item.employee.emp_or_mgr_id || 'EMP'}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{item.leadsCount}</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">{item.clientsCount}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px]">
                        {item.conversionRate}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onNavigateTab('team')}
                        className="px-2.5 py-1 rounded bg-[#111827] hover:bg-slate-800 text-white font-bold text-[11px] inline-flex items-center space-x-1 transition-all shadow-xs"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Manage</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    No team pipeline data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
