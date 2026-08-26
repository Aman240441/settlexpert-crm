import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Percent,
  TrendingUp,
  Target,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  PhoneCall,
  UserMinus,
  Calendar,
  Building2,
  FileCheck,
  Layers,
  Scale,
  Eye,
  X,
  Phone,
  Mail,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';
import { Modal } from '../common/Modal';
import { CalendarDateFilter, getTodayStr } from '../common/CalendarDateFilter';

interface EmployeeDashboardViewProps {
  onNavigateTab: (tab: 'leads' | 'clients' | 'agreements', filter?: string) => void;
}

export const EmployeeDashboardView: React.FC<EmployeeDashboardViewProps> = ({ onNavigateTab }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getCRMDashboardSummary({
        date: selectedDate || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined
      });
      setData(res);
    } catch (err) {
      console.error('Failed to load employee CRM dashboard:', err);
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
        <p className="text-xs text-slate-500 font-semibold tracking-wide">Loading CRM Dashboard...</p>
      </div>
    );
  }

  const monthlyTarget = data?.monthlyTarget || {
    month: 'AUGUST',
    year: 2026,
    isSet: false,
    targetAmount: 0,
    collectionTarget: 0
  };

  const cards = data?.summaryCards || {
    totalLeads: 0,
    totalClients: 0,
    conversionRate: 0,
    activeClients: 0,
    totalDropped: 0,
    thisMoExpected: 0,
    nextMoExpected: 0,
    thisMoCollection: 0,
    thisMoPending: 0,
    thisMoDrop: 0,
    thisMoDropped: 0
  };

  const pipeline = data?.leadPipeline || {
    new: 0,
    contacted: 0,
    interested: 0,
    follow_up: 0,
    converted: 0,
    not_interested: 0
  };

  const biz = data?.businessSummary || {
    totalClients: 0,
    currentlyActive: 0,
    dropped: 0,
    months: []
  };

  const userSummary = data?.userWiseSummary || [];
  const advocateSummary = data?.advocateWiseSummary || [];
  const activeClients = data?.activeClients || [];

  return (
    <div className="space-y-5 font-sans text-slate-800 pb-16 max-w-full">
      {/* 1. Dashboard Title & Subtitle + Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Welcome to CRM Dashboard
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Overview of your business performance
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

      {/* 2. Monthly Target Section (Large Blue Banner) */}
      <div className="rounded-xl overflow-hidden border border-blue-900/20 shadow-sm bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] text-white p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-200 block">
              Performance Target
            </span>
            <h2 className="text-lg sm:text-xl font-black tracking-wide text-white">
              MONTHLY TARGET — {monthlyTarget.month} {monthlyTarget.year}
            </h2>
          </div>
          <div>
            <span className="inline-block px-3.5 py-1.5 rounded-lg bg-white/15 backdrop-blur-sm border border-white/20 text-xs font-black text-white tracking-wide shadow-sm">
              {monthlyTarget.isSet ? `Target: ${formatCurrency(monthlyTarget.targetAmount)}` : 'Target Not Set'}
            </span>
          </div>
        </div>

        {monthlyTarget.isSet && (
          <div className="mt-4 pt-4 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-blue-200 uppercase font-bold block">Target</span>
              <span className="text-base font-black text-white">{formatCurrency(monthlyTarget.targetAmount)}</span>
            </div>
            <div>
              <span className="text-[10px] text-blue-200 uppercase font-bold block">Achieved</span>
              <span className="text-base font-black text-emerald-300">{formatCurrency(cards.thisMoCollection)}</span>
            </div>
            <div>
              <span className="text-[10px] text-blue-200 uppercase font-bold block">Remaining</span>
              <span className="text-base font-black text-amber-200">{formatCurrency(Math.max(0, monthlyTarget.targetAmount - cards.thisMoCollection))}</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Summary Cards (11 Compact Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* 1. TOTAL LEADS */}
        <div
          onClick={() => onNavigateTab('leads')}
          className="bg-white rounded-lg border border-gray-200 p-3 shadow-xs hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">TOTAL LEADS</span>
            <Users className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <span className="text-xl font-black text-slate-900 mt-1 block">{cards.totalLeads}</span>
        </div>

        {/* 2. TOTAL CLIENTS */}
        <div
          onClick={() => onNavigateTab('clients')}
          className="bg-white rounded-lg border border-gray-200 p-3 shadow-xs hover:border-emerald-400 hover:shadow-sm transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">TOTAL CLIENTS</span>
            <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <span className="text-xl font-black text-slate-900 mt-1 block">{cards.totalClients}</span>
        </div>

        {/* 3. CONVERSION */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">CONVERSION</span>
            <Percent className="h-3.5 w-3.5 text-indigo-600" />
          </div>
          <span className="text-xl font-black text-slate-900 mt-1 block">{cards.conversionRate}%</span>
        </div>

        {/* 4. ACTIVE CLIENTS */}
        <div
          onClick={() => onNavigateTab('clients', 'active')}
          className="bg-white rounded-lg border border-gray-200 p-3 shadow-xs hover:border-teal-400 hover:shadow-sm transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">ACTIVE CLIENTS</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
          </div>
          <span className="text-xl font-black text-emerald-700 mt-1 block">{cards.activeClients}</span>
        </div>

        {/* 5. TOTAL DROPPED */}
        <div
          onClick={() => onNavigateTab('clients', 'dropped')}
          className="bg-white rounded-lg border border-gray-200 p-3 shadow-xs hover:border-rose-400 hover:shadow-sm transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">TOTAL DROPPED</span>
            <UserMinus className="h-3.5 w-3.5 text-rose-600" />
          </div>
          <span className="text-xl font-black text-rose-600 mt-1 block">{cards.totalDropped}</span>
        </div>

        {/* 6. THIS MO EXPECTED */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">THIS MO EXPECTED</span>
            <IndianRupee className="h-3.5 w-3.5 text-blue-500" />
          </div>
          <span className="text-sm sm:text-base font-black text-slate-900 mt-1 block truncate">
            {formatCurrency(cards.thisMoExpected)}
          </span>
        </div>

        {/* 7. NEXT MO EXPECTED */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">NEXT MO EXPECTED</span>
            <TrendingUp className="h-3.5 w-3.5 text-indigo-500" />
          </div>
          <span className="text-sm sm:text-base font-black text-slate-900 mt-1 block truncate">
            {formatCurrency(cards.nextMoExpected)}
          </span>
        </div>

        {/* 8. THIS MO COLLECTION */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">THIS MO COLLECTION</span>
            <IndianRupee className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <span className="text-sm sm:text-base font-black text-emerald-700 mt-1 block truncate">
            {formatCurrency(cards.thisMoCollection)}
          </span>
        </div>

        {/* 9. THIS MO PENDING */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">THIS MO PENDING</span>
            <Clock className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <span className="text-sm sm:text-base font-black text-amber-700 mt-1 block truncate">
            {formatCurrency(cards.thisMoPending)}
          </span>
        </div>

        {/* 10. THIS MO DROP */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">THIS MO DROP</span>
            <UserMinus className="h-3.5 w-3.5 text-rose-500" />
          </div>
          <span className="text-xl font-black text-rose-600 mt-1 block">{cards.thisMoDrop}</span>
        </div>

        {/* 11. THIS MO DROPPED */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">THIS MO DROPPED</span>
            <IndianRupee className="h-3.5 w-3.5 text-rose-600" />
          </div>
          <span className="text-sm sm:text-base font-black text-rose-600 mt-1 block truncate">
            {formatCurrency(cards.thisMoDropped)}
          </span>
        </div>
      </div>

      {/* 4. Lead Pipeline Status Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            Lead Pipeline Status
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Click status to view leads</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <button
            onClick={() => onNavigateTab('leads', 'new')}
            className="p-2.5 rounded-lg bg-blue-50/70 hover:bg-blue-100/80 border border-blue-200/70 text-left transition-colors flex items-center justify-between"
          >
            <span className="text-xs font-semibold text-blue-900">New</span>
            <span className="text-sm font-black text-blue-700 font-mono">{pipeline.new}</span>
          </button>
          <button
            onClick={() => onNavigateTab('leads', 'contacted')}
            className="p-2.5 rounded-lg bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200/70 text-left transition-colors flex items-center justify-between"
          >
            <span className="text-xs font-semibold text-amber-900">Contacted</span>
            <span className="text-sm font-black text-amber-700 font-mono">{pipeline.contacted}</span>
          </button>
          <button
            onClick={() => onNavigateTab('leads', 'interested')}
            className="p-2.5 rounded-lg bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200/70 text-left transition-colors flex items-center justify-between"
          >
            <span className="text-xs font-semibold text-emerald-900">Interested</span>
            <span className="text-sm font-black text-emerald-700 font-mono">{pipeline.interested}</span>
          </button>
          <button
            onClick={() => onNavigateTab('leads', 'follow_up')}
            className="p-2.5 rounded-lg bg-purple-50/70 hover:bg-purple-100/80 border border-purple-200/70 text-left transition-colors flex items-center justify-between"
          >
            <span className="text-xs font-semibold text-purple-900">Follow Up</span>
            <span className="text-sm font-black text-purple-700 font-mono">{pipeline.follow_up}</span>
          </button>
          <button
            onClick={() => onNavigateTab('leads', 'converted')}
            className="p-2.5 rounded-lg bg-teal-50/70 hover:bg-teal-100/80 border border-teal-200/70 text-left transition-colors flex items-center justify-between"
          >
            <span className="text-xs font-semibold text-teal-900">Converted</span>
            <span className="text-sm font-black text-teal-700 font-mono">{pipeline.converted}</span>
          </button>
          <button
            onClick={() => onNavigateTab('leads', 'not_interested')}
            className="p-2.5 rounded-lg bg-gray-100/80 hover:bg-gray-200/80 border border-gray-300/70 text-left transition-colors flex items-center justify-between"
          >
            <span className="text-xs font-semibold text-slate-700">Not Interested</span>
            <span className="text-sm font-black text-slate-800 font-mono">{pipeline.not_interested}</span>
          </button>
        </div>
      </div>

      {/* 5. Business Summary (Exact Reference Screenshot Specification) */}
      <div className="w-full bg-white border border-gray-200 rounded-sm overflow-hidden shadow-none">
        {/* Thin Green Header Bar */}
        <div className="h-8 bg-[#15803d] text-white px-3 flex items-center justify-between">
          <span className="text-[11px] font-bold text-white tracking-wide">Business Summary</span>
          <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded text-white font-medium tracking-wide">
            Real-time
          </span>
        </div>

        <div className="p-3 space-y-2.5">
          {/* Summary Line: Total Clients: X    Currently Active: Y    Dropped: Z */}
          <div className="flex flex-wrap items-center gap-6 text-[11px] text-slate-700 px-0.5">
            <div>
              <span className="text-slate-500">Total Clients: </span>
              <strong className="text-slate-900 font-bold">{biz.totalClients}</strong>
            </div>
            <div>
              <span className="text-slate-500">Currently Active: </span>
              <strong className="text-slate-900 font-bold">{biz.currentlyActive}</strong>
            </div>
            <div>
              <span className="text-slate-500">Dropped: </span>
              <strong className="text-slate-900 font-bold">{biz.dropped}</strong>
            </div>
          </div>

          {/* 3 Monthly Summary Cards (June, July, August) in 1 horizontal row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {(biz.months && biz.months.length > 0
              ? biz.months
              : [
                  { name: 'June', target: 22500, collection: 0, drop: 0 },
                  { name: 'July', target: 23750, collection: 0, drop: 0 },
                  { name: 'August', target: 25000, collection: 0, drop: 0 },
                ]
            ).map((m: any, idx: number) => (
              <div
                key={idx}
                className="bg-[#fafafa] border border-gray-200 rounded p-2.5 sm:p-3 text-xs space-y-2"
              >
                {/* Month Name: Top-Left */}
                <div className="font-bold text-slate-900 text-xs tracking-tight">
                  {m.name}
                </div>

                {/* Target, Collection, Drop (Left aligned label, Far Right aligned amount) */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="text-[11px]">Target:</span>
                    <span className="font-semibold text-slate-900 text-xs">
                      {formatCurrency(m.target ?? 22500)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="text-[11px]">Collection:</span>
                    <span className="font-semibold text-emerald-700 text-xs">
                      {formatCurrency(m.collection ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="text-[11px]">Drop:</span>
                    <span className="font-semibold text-rose-600 text-xs">
                      {formatCurrency(m.drop ?? 0)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. User Wise Summary (Green Section Header) */}
      <div className="rounded-lg overflow-hidden border border-[#15803d]/30 shadow-xs bg-white">
        <div className="bg-[#15803d] text-white px-4 py-2.5 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider">User Wise Summary</h3>
          <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded text-white tracking-wide">
            Consultant Performance
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] text-left border-collapse">
            <thead className="bg-gray-100 text-slate-700 font-bold border-b border-gray-200 uppercase tracking-tight">
              <tr>
                <th className="py-2.5 px-3">S.No.</th>
                <th className="py-2.5 px-3">Allocated</th>
                <th className="py-2.5 px-3">City</th>
                <th className="py-2.5 px-3 text-center">New Clients</th>
                <th className="py-2.5 px-3 text-right">New Client Collection</th>
                <th className="py-2.5 px-3 text-center">Active Client</th>
                <th className="py-2.5 px-3 text-center">Dropped</th>
                <th className="py-2.5 px-3 text-right">Dropped Amount</th>
                <th className="py-2.5 px-3 text-right">Total Target</th>
                <th className="py-2.5 px-3 text-right">Current Month Collection</th>
                <th className="py-2.5 px-3 text-right">To Be Collected</th>
                <th className="py-2.5 px-3 text-right">Next Month Expected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-slate-800">
              {userSummary.length > 0 ? (
                userSummary.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono">{row.sNo}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{row.allocated}</td>
                    <td className="py-2.5 px-3 text-slate-600">{row.city}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-blue-700">{row.newClients}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-700 font-bold">{formatCurrency(row.newClientCollection)}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-emerald-700">{row.activeClient}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-rose-600">{row.dropped}</td>
                    <td className="py-2.5 px-3 text-right text-rose-600">{formatCurrency(row.droppedAmount)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-500">{row.totalTarget ? formatCurrency(row.totalTarget) : 'Not Set'}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-700 font-bold">{formatCurrency(row.currentMonthCollection)}</td>
                    <td className="py-2.5 px-3 text-right text-amber-700 font-bold">{formatCurrency(row.toBeCollected)}</td>
                    <td className="py-2.5 px-3 text-right text-blue-700 font-bold">{formatCurrency(row.nextMonthExpected)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={12} className="py-4 text-center text-slate-400">
                    No summary data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. Advocate Wise Summary (Green Section Header) */}
      <div className="rounded-lg overflow-hidden border border-[#15803d]/30 shadow-xs bg-white">
        <div className="bg-[#15803d] text-white px-4 py-2.5 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider">Advocate Wise Summary</h3>
          <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded text-white tracking-wide">
            Associated Advocates
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] text-left border-collapse">
            <thead className="bg-gray-100 text-slate-700 font-bold border-b border-gray-200 uppercase tracking-tight">
              <tr>
                <th className="py-2.5 px-3">S.No.</th>
                <th className="py-2.5 px-3">Advocate</th>
                <th className="py-2.5 px-3">Address</th>
                <th className="py-2.5 px-3 text-center">New Clients</th>
                <th className="py-2.5 px-3 text-right">New Client Collection</th>
                <th className="py-2.5 px-3 text-center">Active Client</th>
                <th className="py-2.5 px-3 text-center">Dropped</th>
                <th className="py-2.5 px-3 text-right">Dropped Amount</th>
                <th className="py-2.5 px-3 text-right">Current Month Collection</th>
                <th className="py-2.5 px-3 text-right">To Be Collected</th>
                <th className="py-2.5 px-3 text-right">Next Month Expected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-slate-800">
              {advocateSummary.length > 0 ? (
                advocateSummary.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono">{row.sNo}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{row.advocate}</td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">{row.address}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-blue-700">{row.newClients}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-700 font-bold">{formatCurrency(row.newClientCollection)}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-emerald-700">{row.activeClient}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-rose-600">{row.dropped}</td>
                    <td className="py-2.5 px-3 text-right text-rose-600">{formatCurrency(row.droppedAmount)}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-700 font-bold">{formatCurrency(row.currentMonthCollection)}</td>
                    <td className="py-2.5 px-3 text-right text-amber-700 font-bold">{formatCurrency(row.toBeCollected)}</td>
                    <td className="py-2.5 px-3 text-right text-blue-700 font-bold">{formatCurrency(row.nextMonthExpected)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="py-4 text-center text-slate-400">
                    No advocate assigned clients yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 8. Active Clients Section (Green Section Header) */}
      <div className="rounded-lg overflow-hidden border border-[#15803d]/30 shadow-xs bg-white">
        <div className="bg-[#15803d] text-white px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-xs font-black uppercase tracking-wider">Active Clients</h3>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded text-white font-mono">
              {activeClients.length} Records
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('clients')}
            className="text-xs font-bold text-white hover:underline flex items-center space-x-1"
          >
            <span>Open All Clients</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] text-left border-collapse">
            <thead className="bg-gray-100 text-slate-700 font-bold border-b border-gray-200 uppercase tracking-tight">
              <tr>
                <th className="py-2.5 px-2.5">#</th>
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">Phone</th>
                <th className="py-2.5 px-3">City</th>
                <th className="py-2.5 px-3 text-right">Total Outstanding</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">Monthly SX Fee</th>
                <th className="py-2.5 px-3">Fees Date</th>
                <th className="py-2.5 px-3 text-center">Fees Status</th>
                <th className="py-2.5 px-3 text-right">Pending Amount</th>
                <th className="py-2.5 px-3 text-right">Received Amount</th>
                <th className="py-2.5 px-3 text-center">Case Status</th>
                <th className="py-2.5 px-3">Assigned Consultant</th>
                <th className="py-2.5 px-3">Assigned Advocate</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-slate-800">
              {activeClients.length > 0 ? (
                activeClients.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-2.5 px-2.5 font-mono text-slate-500">{c.sNo || c.client_number}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{c.name}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{c.phone}</td>
                    <td className="py-2.5 px-3 text-slate-600">{c.city || 'N/A'}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-800">{formatCurrency(c.total_debt)}</td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="font-bold text-blue-700">{formatCurrency(c.monthly_fee || 8000)} <span className="text-[10px] text-slate-400 font-normal">/mo</span></div>
                      <div className="text-[10px] text-slate-500 font-medium">Total: {formatCurrency(c.total_agreement_fee || ((c.monthly_fee || 8000) * 6))}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{c.fees_date}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.fees_status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                        c.fees_status === 'Partial' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {c.fees_status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-rose-600 font-bold">{formatCurrency(c.pending_amount)}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-700 font-bold">{formatCurrency(c.received_amount)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {c.case_status || 'Active'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{c.employee_name || 'Assigned'}</td>
                    <td className="py-2.5 px-3 text-slate-700">{c.advocate_name || 'Advocate Legal Desk'}</td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => setSelectedClient(c)}
                        className="p-1 rounded hover:bg-gray-200 text-blue-600 transition-colors"
                        title="View Client Details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={14} className="py-6 text-center text-slate-400">
                    No active clients in portfolio.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Quick View Modal */}
      <Modal
        isOpen={!!selectedClient}
        onClose={() => setSelectedClient(null)}
        title={`Client Details - ${selectedClient?.name || ''}`}
        maxWidth="xl"
      >
        {selectedClient && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Client ID</span>
                <span className="font-mono font-bold text-blue-700">{selectedClient.client_number}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Contact</span>
                <span className="text-slate-900 font-semibold">{selectedClient.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">City</span>
                <span className="text-slate-900 font-semibold">{selectedClient.city || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Loan Outstanding</span>
                <span className="font-mono text-slate-900 font-bold">{formatCurrency(selectedClient.total_debt)}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100">
                <span className="text-blue-700 text-[10px] uppercase font-bold block">Monthly SX Fee</span>
                <span className="text-sm font-black text-blue-800 mt-0.5 block">{formatCurrency(selectedClient.monthly_fee || 8000)} / mo</span>
                <span className="text-[10px] text-blue-600 block mt-0.5">Total: {formatCurrency(selectedClient.total_agreement_fee || ((selectedClient.monthly_fee || 8000) * 6))}</span>
              </div>
              <div className="p-3 bg-teal-50/60 rounded-lg border border-teal-100">
                <span className="text-teal-700 text-[10px] uppercase font-bold block">Received Amount</span>
                <span className="text-sm font-black text-teal-800 mt-0.5 block">{formatCurrency(selectedClient.received_amount || selectedClient.total_received || 0)}</span>
              </div>
              <div className="p-3 bg-rose-50/60 rounded-lg border border-rose-100">
                <span className="text-rose-700 text-[10px] uppercase font-bold block">Pending Balance</span>
                <span className="text-sm font-black text-rose-800 mt-0.5 block">{formatCurrency(selectedClient.pending_amount)}</span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-slate-600">
              <span>Advocate: <strong className="text-slate-900">{selectedClient.advocate_name || 'Legal Desk'}</strong></span>
              <button
                type="button"
                onClick={() => {
                  setSelectedClient(null);
                  onNavigateTab('clients');
                }}
                className="px-3.5 py-2 bg-[#15803d] hover:bg-emerald-800 text-white rounded-lg font-bold transition-colors cursor-pointer"
              >
                Go to Client Portfolio
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
