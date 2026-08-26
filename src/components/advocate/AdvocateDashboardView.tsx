import React, { useState, useEffect } from 'react';
import {
  Scale,
  Briefcase,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Landmark,
  Eye,
  Plus,
  RefreshCw,
  Award,
  ChevronRight,
  TrendingUp,
  FileText
} from 'lucide-react';
import { api } from '../../services/api';
import { CalendarDateFilter, getTodayStr } from '../common/CalendarDateFilter';
import { Badge } from '../common/Badge';

interface AdvocateDashboardViewProps {
  onNavigateToCases: (filter?: string) => void;
  onOpenCase: (caseItem: any) => void;
}

export const AdvocateDashboardView: React.FC<AdvocateDashboardViewProps> = ({
  onNavigateToCases,
  onOpenCase
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getAdvocateDashboardSummary();
      setData(res);
    } catch (err) {
      console.error('Failed to load advocate dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [selectedDate, fromDate, toDate]);

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amt || 0);
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3 font-sans">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#166534] border-t-transparent" />
        <p className="text-xs text-slate-500 font-semibold tracking-wide">Loading Advocate Legal Dashboard...</p>
      </div>
    );
  }

  const cards = data?.summaryCards || {
    totalAssignedCases: 0,
    activeCases: 0,
    closedCases: 0,
    totalDebtManaged: 0
  };

  const recentCases = data?.recentCases || [];

  return (
    <div className="space-y-5 font-sans text-slate-800 pb-16 max-w-full">
      {/* 1. Dashboard Title & Subtitle + Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Welcome to Legal Advocate CRM
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Empanelled Legal Advisory & Debt Conciliation Work Center
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CalendarDateFilter
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            fromDate={fromDate}
            toDate={toDate}
            onRangeChange={(f, t) => {
              setFromDate(f);
              setToDate(t);
            }}
          />
          <button
            onClick={fetchDashboard}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-slate-700 text-xs font-semibold hover:bg-gray-50 transition-colors shadow-2xs"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Target & Performance Banner (Matching Employee CRM Blue Banner) */}
      <div className="rounded-xl overflow-hidden border border-blue-900/20 shadow-sm bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] text-white p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-200 block">
              Empanelled Legal Counsel Performance
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Legal Shield & Debt Conciliation
            </h2>
            <p className="text-xs text-blue-100 font-medium">
              Representing clients against harassment, notice replies, and negotiated debt resolution.
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center text-white font-black">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-200 block">Total Portfolio</span>
              <span className="text-lg font-black text-white">{cards.totalAssignedCases} Active Cases</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Top Metrics KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => onNavigateToCases('all')}
          className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs hover:border-blue-500 transition-all cursor-pointer space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Assigned Cases</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-slate-900 block">{cards.totalAssignedCases}</span>
          <span className="text-[10px] text-slate-500 font-semibold block">Total assigned by Managers</span>
        </div>

        <div
          onClick={() => onNavigateToCases('active')}
          className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs hover:border-emerald-500 transition-all cursor-pointer space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Legal Cases</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-emerald-600 block">{cards.activeCases}</span>
          <span className="text-[10px] text-emerald-700 font-semibold block">Under legal representation</span>
        </div>

        <div
          onClick={() => onNavigateToCases('closed')}
          className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs hover:border-rose-500 transition-all cursor-pointer space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Closed Cases</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-700">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-slate-700 block">{cards.closedCases}</span>
          <span className="text-[10px] text-slate-500 font-semibold block">Settled or completed</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Debt Under Advisory</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
              <Landmark className="h-4 w-4" />
            </div>
          </div>
          <span className="text-xl font-black text-slate-900 block truncate">{formatCurrency(cards.totalDebtManaged)}</span>
          <span className="text-[10px] text-slate-500 font-semibold block">Active total liability</span>
        </div>
      </div>

      {/* 4. Recent Assigned Cases Table Matching Employee CRM */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Briefcase className="h-4 w-4 text-[#15803d]" />
            <h3 className="text-sm font-bold text-slate-900">Recent Assigned Cases</h3>
          </div>
          <button
            onClick={() => onNavigateToCases('all')}
            className="text-xs font-bold text-blue-700 hover:text-blue-900 inline-flex items-center space-x-1"
          >
            <span>View All Cases</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Case ID</th>
                <th className="py-3 px-4">Client Name</th>
                <th className="py-3 px-4">Phone & City</th>
                <th className="py-3 px-4">Total Debt</th>
                <th className="py-3 px-4">Assigned Consultant</th>
                <th className="py-3 px-4">Case Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-slate-700">
              {recentCases.length > 0 ? (
                recentCases.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#1e40af]">{c.client_number}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                    <td className="py-3 px-4 text-slate-600">{c.phone} • {c.city || 'India'}</td>
                    <td className="py-3 px-4 font-bold text-rose-700">{formatCurrency(c.total_debt)}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{c.consultant_name || 'Assigned Staff'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-700 text-white font-bold text-[10px]">
                        {c.case_status || 'Active'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onOpenCase(c)}
                        className="px-2.5 py-1 rounded bg-[#111827] hover:bg-slate-800 text-white font-bold text-[11px] inline-flex items-center space-x-1 transition-all shadow-xs"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Dossier</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    No recent assigned cases found
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
