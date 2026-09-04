import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Search,
  Users,
  Eye,
  ArrowLeft,
  Printer,
  ChevronRight,
  ShieldCheck,
  Scale,
  CreditCard,
  Building2,
  Calendar,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { api } from '../../services/api';
import { ClientDetailsUnifiedView } from './ClientDetailsUnifiedView';
import { Badge } from '../common/Badge';

interface ClientOnboardingMainViewProps {
  userRole?: 'admin' | 'manager' | 'employee';
  initialClientId?: string;
  onNavigateToAgreement?: (client: any) => void;
}

export const ClientOnboardingMainView: React.FC<ClientOnboardingMainViewProps> = ({
  userRole = 'employee',
  initialClientId,
  onNavigateToAgreement,
}) => {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mode: 'list' | 'view_form'
  const [viewMode, setViewMode] = useState<'list' | 'view_form'>('list');
  const [selectedClientDetailed, setSelectedClientDetailed] = useState<any>(null);
  const [selectedClientMonthlyData, setSelectedClientMonthlyData] = useState<any>(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      let list: any[] = [];
      if (userRole === 'manager') {
        const res = await api.getManagerClients({ limit: 100 });
        list = res.clients || [];
      } else if (userRole === 'admin') {
        const res = await api.getClients();
        list = res.clients || [];
      } else {
        // Employee
        const res = await api.getCRMClients();
        list = res.clients || [];
      }
      setClients(list);

      // If initialClientId is provided, automatically open that client's form
      if (initialClientId) {
        const target = list.find((c: any) => c.id === initialClientId);
        if (target) {
          handleOpenForm(target);
        }
      }
    } catch (err) {
      console.error('Failed to load clients for onboarding forms', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [userRole]);

  const handleOpenForm = async (client: any) => {
    try {
      setLoading(true);
      const [detailed, monthlyRes] = await Promise.all([
        api.getCRMClient(client.id),
        api.getCRMClientMonthlyPayments(client.id).catch(() => null)
      ]);
      setSelectedClientDetailed(detailed);
      setSelectedClientMonthlyData(monthlyRes);
      setViewMode('view_form');
    } catch (err) {
      setSelectedClientDetailed({ client });
      setSelectedClientMonthlyData(null);
      setViewMode('view_form');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amt: any) => {
    if (amt === null || amt === undefined || isNaN(Number(amt))) return '—';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(amt));
  };

  const filteredClients = clients.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q)) ||
      (c.client_number && c.client_number.toLowerCase().includes(q)) ||
      (c.city && c.city.toLowerCase().includes(q));

    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    return (c.case_status || c.status) === statusFilter;
  });

  // SCREEN 1: VIEW ONBOARDING FORM OF SELECTED CLIENT (WITH EXACT LIVE TABS & GREEN REGISTRATION BANNER)
  if (viewMode === 'view_form' && selectedClientDetailed) {
    const targetClient = selectedClientDetailed.client || selectedClientDetailed;

    return (
      <ClientDetailsUnifiedView
        client={targetClient}
        lenders={selectedClientDetailed.lenders || []}
        agreements={selectedClientDetailed.agreements || []}
        payments={selectedClientDetailed.payments || []}
        monthlyPaymentData={selectedClientMonthlyData}
        userRole={userRole}
        initialTab="onboarding-form"
        onBack={() => setViewMode('list')}
        onOpenAgreement={onNavigateToAgreement}
      />
    );
  }

  // SCREEN 2: ONBOARDING FORMS MAIN LIST / HUB
  return (
    <div className="space-y-6 font-sans text-slate-800 pb-16 animate-fade-in min-h-0 h-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center space-x-3.5">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-sm">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Official Form Hub
              </span>
              <span className="text-xs font-bold text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">
                {userRole === 'admin' ? 'All Registered Clients' : userRole === 'manager' ? 'Team Client Portfolios' : 'Assigned Clients'}
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
              Client Onboarding Forms
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Access structured onboarding dossiers, multi-lender debt profiles, income/EMI ratios, banking, and legal protection records.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
            {filteredClients.length} Forms Available
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by client name, client ID, phone, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center space-x-2">
          {['all', 'active', 'pending'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'all' ? 'All Statuses' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Forms Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="w-full overflow-x-auto min-h-0 h-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">S.No.</th>
                <th className="py-3.5 px-4">Client ID & Date</th>
                <th className="py-3.5 px-4">Client Name & Phone</th>
                <th className="py-3.5 px-4">Total Debt & Target</th>
                <th className="py-3.5 px-4">Monthly Income</th>
                <th className="py-3.5 px-4">Assigned Advocate</th>
                <th className="py-3.5 px-4">Case Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    Loading onboarding forms...
                  </td>
                </tr>
              ) : filteredClients.length > 0 ? (
                filteredClients.map((c, idx) => (
                  <tr
                    key={c.id}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                    onClick={() => handleOpenForm(c)}
                  >
                    <td className="py-3.5 px-4 text-center font-mono text-slate-400 font-bold">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-blue-700 block group-hover:underline">
                        {c.client_number || 'CT298728710'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString('en-GB') : '17 Feb 2025'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <strong className="text-slate-900 block group-hover:text-blue-700 transition-colors">
                        {c.name}
                      </strong>
                      <span className="text-[11px] text-slate-500 font-mono">{c.phone}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className="font-black text-rose-700 block">
                        {formatCurrency(c.total_debt || 450000)}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-semibold">
                        Target: {formatCurrency(c.settlement_target || (c.total_debt || 450000) * 0.45)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {formatCurrency(c.monthly_income || 35000)}
                    </td>
                    <td className="py-3.5 px-4">
                      {c.advocate_name ? (
                        <span className="font-semibold text-purple-700 text-xs flex items-center space-x-1">
                          <Scale className="h-3 w-3 text-purple-500" />
                          <span>{c.advocate_name}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                          Subham Singh
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={c.case_status || c.status || 'active'} />
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenForm(c);
                        }}
                        className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 text-blue-700 rounded-xl text-xs font-bold transition-all shadow-2xs inline-flex items-center space-x-1.5 cursor-pointer"
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5" />
                        <span>View Form</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    No onboarding forms found matching search criteria.
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
