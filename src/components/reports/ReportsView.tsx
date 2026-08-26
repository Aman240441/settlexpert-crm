import React, { useState, useEffect } from 'react';
import { PieChart, TrendingUp, Building2, WalletCards, ShieldCheck, Download } from 'lucide-react';
import { api } from '../../services/api';
import { StatCard } from '../common/StatCard';

export const ReportsView: React.FC = () => {
  const [reportData, setReportData] = useState<{ deptStats: any[]; planStats: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const res = await api.getReportsSummary();
        setReportData(res);
      } catch (err) {
        console.error('Failed to load reports summary:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amt || 0);
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-16 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <PieChart className="h-5 w-5 text-blue-600" />
            <span>Executive Analytics & Management Reports</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Holistic performance breakdown across departments, client distributions, and fee plan revenues.
          </p>
        </div>
      </div>

      {/* Department Performance Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-4">
        <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Building2 className="h-4 w-4 text-blue-600" />
          <span>Departmental Staff & Case Metrics</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-center">Total Staff</th>
                <th className="py-3 px-4 text-center">Active Leads</th>
                <th className="py-3 px-4 text-center">Retained Clients</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400 font-medium">Loading reports...</td>
                </tr>
              ) : reportData?.deptStats && reportData.deptStats.length > 0 ? (
                reportData.deptStats.map((d) => (
                  <tr key={d.department} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{d.department}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700">{d.total_staff}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-amber-600">{d.total_leads}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600">{d.total_clients}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400 font-medium">No departmental records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fee Plan Performance */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-4">
        <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
          <WalletCards className="h-4 w-4 text-emerald-600" />
          <span>Fee Plan Portfolio Distribution</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Plan Name</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Default Fee</th>
                <th className="py-3 px-4 text-center">Subscribed Clients</th>
                <th className="py-3 px-4 text-right">Total Plan Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 font-medium">Loading plan reports...</td>
                </tr>
              ) : reportData?.planStats && reportData.planStats.length > 0 ? (
                reportData.planStats.map((p) => (
                  <tr key={p.plan_name} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{p.plan_name}</td>
                    <td className="py-3.5 px-4 text-slate-500">{p.duration}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{formatCurrency(p.default_fee)}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-blue-600">{p.client_count}</td>
                    <td className="py-3.5 px-4 text-right font-black text-emerald-600">{formatCurrency(p.total_revenue)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 font-medium">No fee plans active.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
