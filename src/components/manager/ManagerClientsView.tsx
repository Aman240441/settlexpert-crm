import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Search,
  Scale,
  DollarSign,
  Eye,
  ShieldCheck,
  Building2,
  Calendar,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FileSignature,
  FileText,
  User,
  Landmark,
  CheckCircle2,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { api } from '../../services/api';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { AgreementDocumentView } from '../employee/AgreementDocumentView';
import { ClientDetailsUnifiedView } from '../crm/ClientDetailsUnifiedView';

interface ManagerClientsViewProps {
  managerType?: string;
}

export const ManagerClientsView: React.FC<ManagerClientsViewProps> = ({ managerType = 'LEGAL' }) => {
  const [clients, setClients] = useState<any[]>([]);
  const [advocates, setAdvocates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Mode: 'list' | 'document_view' | 'view_details'
  const [viewMode, setViewMode] = useState<'list' | 'document_view' | 'view_details'>('list');
  const [selectedAgreementData, setSelectedAgreementData] = useState<any>(null);
  const [selectedClientForDetails, setSelectedClientForDetails] = useState<any>(null);
  const [selectedClientMonthlyPayments, setSelectedClientMonthlyPayments] = useState<any>(null);

  // Modals & Drawers
  const [selectedClient360, setSelectedClient360] = useState<any>(null);
  const [selectedAgreementModal, setSelectedAgreementModal] = useState<any>(null);
  const [advocateModalClient, setAdvocateModalClient] = useState<any>(null);
  const [selectedAdvocateId, setSelectedAdvocateId] = useState('');
  const [advocateSearch, setAdvocateSearch] = useState('');
  const [advocateNotes, setAdvocateNotes] = useState('');
  const [clientAdvocateHistory, setClientAdvocateHistory] = useState<any[]>([]);
  const [feeModalClient, setFeeModalClient] = useState<any>(null);
  const [feeData, setFeeData] = useState({ sx_fee: 0, fees_date: '', fees_status: '' });

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isLegal = managerType === 'LEGAL' || managerType === 'ADMIN';
  const isFinance = managerType === 'FIN' || managerType === 'FINANCE' || managerType === 'ADMIN';

  const fetchClientsAndAdvocates = async () => {
    try {
      setLoading(true);
      const cliRes = await api.getManagerClients({ search: search || undefined, case_status: statusFilter || undefined, page, limit });
      setClients(cliRes?.clients || []);
      setTotal(cliRes?.pagination?.total || 0);

      // Load advocates safely so any advocate permissions issue doesn't block clients view
      try {
        const advRes = await api.getAdvocates();
        setAdvocates(advRes?.advocates || []);
      } catch {
        setAdvocates([]);
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: 'Failed to load clients' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientsAndAdvocates();
  }, [search, statusFilter, page, limit]);

  const openAdvocateModal = async (client: any) => {
    setAdvocateModalClient(client);
    setSelectedAdvocateId(client.advocate_id || '');
    setAdvocateSearch('');
    setAdvocateNotes('');
    try {
      const res = await api.getClientAdvocateHistory(client.id);
      setClientAdvocateHistory(res.history || []);
    } catch {
      setClientAdvocateHistory([]);
    }
  };

  const handleAssignAdvocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advocateModalClient) return;

    try {
      const res = await api.assignClientAdvocate(advocateModalClient.id, selectedAdvocateId);
      setFeedbackMsg({ type: 'success', text: res.message || 'Advocate assigned successfully' });
      setAdvocateModalClient(null);
      fetchClientsAndAdvocates();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to assign advocate' });
    }
  };

  const handleUpdateFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeModalClient) return;

    try {
      const res = await api.updateClientFee(feeModalClient.id, feeData);
      setFeedbackMsg({ type: 'success', text: res.message || 'Fee updated successfully' });
      setFeeModalClient(null);
      fetchClientsAndAdvocates();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to update fee' });
    }
  };

  const handleOpen360 = async (client: any) => {
    try {
      const detailed = await api.getCRMClient(client.id);
      setSelectedClient360(detailed);
    } catch (err) {
      setSelectedClient360(client);
    }
  };

  const handleOpenClientDetails = async (client: any) => {
    try {
      setLoading(true);
      const [detailed, monthlyRes] = await Promise.all([
        api.getCRMClient(client.id),
        api.getCRMClientMonthlyPayments(client.id).catch(() => null)
      ]);
      setSelectedClientForDetails(detailed);
      setSelectedClientMonthlyPayments(monthlyRes);
      setViewMode('view_details');
    } catch (err) {
      setSelectedClientForDetails({ client });
      setSelectedClientMonthlyPayments(null);
      setViewMode('view_details');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAgreement = async (client: any) => {
    try {
      const detailed = await api.getCRMClient(client.id);
      const agr = detailed.agreements && detailed.agreements.length > 0 ? detailed.agreements[0] : null;
      const targetClient = detailed.client || detailed;

      const agreementObj = {
        ...(agr || {}),
        id: agr?.id || 'agr-draft',
        agreement_number: agr?.agreement_number || ('AGR-' + (client.client_number ? client.client_number.replace(/[^0-9]/g, '') : '2026')),
        name: targetClient.name,
        client_name: targetClient.name,
        phone: targetClient.phone,
        client_phone: targetClient.phone,
        email: targetClient.email,
        client_email: targetClient.email,
        city: targetClient.city,
        client_city: targetClient.city,
        address: targetClient.city || targetClient.address || 'India',
        monthly_income: targetClient.monthly_income || 45000,
        monthly_fee: agr?.monthly_fee || 8000,
        total_fee: agr?.total_fee || 48000,
        resolution_duration: agr?.resolution_duration || '6 Months',
        agreement_duration: agr?.resolution_duration || '6 Months',
        prepared_by: agr?.prepared_by || 'SettleXpert Legal Desk',
        start_date: agr?.start_date || agr?.executed_date || new Date().toISOString().split('T')[0],
        executed_date: agr?.executed_date || agr?.start_date || new Date().toISOString().split('T')[0],
        status: agr?.status || 'Active',
        lenders: detailed.lenders || []
      };

      setSelectedAgreementData(agreementObj);
      setViewMode('document_view');
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: 'Failed to load client agreement' });
    }
  };

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amt || 0);
  };

  // Render Full Client Details & Onboarding Form View
  if (viewMode === 'view_details' && selectedClientForDetails) {
    const clientData = selectedClientForDetails.client || selectedClientForDetails;
    return (
      <ClientDetailsUnifiedView
        client={clientData}
        lenders={selectedClientForDetails.lenders || []}
        agreements={selectedClientForDetails.agreements || []}
        payments={selectedClientForDetails.payments || []}
        monthlyPaymentData={selectedClientMonthlyPayments}
        userRole="manager"
        initialTab="onboarding-form"
        onBack={() => {
          setViewMode('list');
          setSelectedClientForDetails(null);
        }}
        onOpenAgreement={handleOpenAgreement}
      />
    );
  }

  // Render Document View Mode (Exact same view as Employee CRM)
  if (viewMode === 'document_view' && selectedAgreementData) {
    return (
      <AgreementDocumentView
        agreement={selectedAgreementData}
        onBack={() => {
          setViewMode('list');
          setSelectedAgreementData(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-4 font-sans text-slate-800 pb-12 animate-fade-in">
      {/* Toast Alert */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded-lg flex items-center justify-between text-xs font-semibold ${feedbackMsg.type === 'success'
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
            <span className="text-slate-800 font-bold">Clients & Case Portfolio</span>
          </div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-[#15803d]" />
            <span>Retained Clients Portfolio</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Active debt settlement cases, legal advocate assignments, retainer fee schedules, and multiple lenders.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-bold text-slate-800 shadow-2xs">
            {total} Total Clients
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Client ID, Name, Phone, City..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#15803d]"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg text-xs text-slate-700 px-3 py-1.5 focus:outline-none focus:border-[#15803d]"
          >
            <option value="">All Case Statuses</option>
            <option value="active">Active</option>
            <option value="closed">Closed / Settled</option>
            <option value="dropped">Dropped / Inactive</option>
          </select>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3 px-3 w-10">#</th>
                <th className="py-3 px-3">Client ID</th>
                <th className="py-3 px-3">Client Name / City</th>
                <th className="py-3 px-3">Assigned Staff</th>
                <th className="py-3 px-3">Assigned Advocate</th>
                <th className="py-3 px-3">SX Fee</th>
                <th className="py-3 px-3">Received</th>
                <th className="py-3 px-3">Pending</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Loading clients...
                  </td>
                </tr>
              ) : clients.length > 0 ? (
                clients.map((c, idx) => (
                  <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-3 text-slate-500 font-mono">{(page - 1) * limit + idx + 1}</td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => handleOpenClientDetails(c)}
                        className="text-left group cursor-pointer"
                        title="Open Client Details & Onboarding Form"
                      >
                        <span className="font-mono font-bold text-[#1e40af] block group-hover:underline">
                          {c.client_number}
                        </span>
                      </button>
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => handleOpenClientDetails(c)}
                        className="text-left font-bold text-slate-900 hover:text-blue-700 transition-colors cursor-pointer block"
                        title="Open Client Details & Onboarding Form"
                      >
                        {c.name}
                      </button>
                      <span className="text-[10px] text-slate-500">{c.city || '—'} • {c.phone}</span>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">{c.employee_name || 'Staff'}</td>
                    <td className="py-3 px-3">
                      {c.advocate_name ? (
                        <span className="font-semibold text-slate-800 text-xs flex items-center space-x-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#15803d] inline-block"></span>
                          <span>{c.advocate_name}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 border border-amber-200 text-amber-700">
                          Not Assigned
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {formatCurrency(c.sx_fee || (c.total_debt * 0.1))}
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-700">
                      {formatCurrency(c.total_received)}
                    </td>
                    <td className="py-3 px-3 font-bold text-rose-700">
                      {formatCurrency(c.pending_amount)}
                    </td>
                    <td className="py-3 px-3">
                      <Badge status={c.case_status || c.status} />
                    </td>
                    <td className="py-2 px-3 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenClientDetails(c)}
                        title="View Client Details & Onboarding Form"
                        className="h-7 w-7 rounded border border-gray-200 bg-white hover:bg-gray-50 text-slate-600 hover:text-blue-600 transition-colors inline-flex items-center justify-center shadow-xs cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>

                      {/* View Client Agreement Document */}
                      <button
                        onClick={() => handleOpenAgreement(c)}
                        title="View Client Agreement"
                        className="h-7 w-7 rounded border border-gray-200 bg-white hover:bg-gray-50 text-slate-600 hover:text-indigo-600 transition-colors inline-flex items-center justify-center shadow-xs"
                      >
                        <FileSignature className="h-3.5 w-3.5" />
                      </button>

                      {/* Legal Manager Advocate Assignment */}
                      {isLegal && (
                        <button
                          onClick={() => openAdvocateModal(c)}
                          title="Assign or Change Empanelled Advocate"
                          className="h-7 w-7 rounded border border-gray-200 bg-white hover:bg-gray-50 text-slate-600 hover:text-emerald-600 transition-colors inline-flex items-center justify-center shadow-xs"
                        >
                          <Scale className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {/* Finance Manager Fee Editor */}
                      {isFinance && (
                        <button
                          onClick={() => {
                            setFeeModalClient(c);
                            setFeeData({
                              sx_fee: c.sx_fee || (c.total_debt * 0.1),
                              fees_date: c.fees_date || '',
                              fees_status: c.fees_status || 'Pending'
                            });
                          }}
                          title="Update Client Fee Structure"
                          className="h-7 w-7 rounded border border-gray-200 bg-white hover:bg-gray-50 text-slate-600 hover:text-amber-600 transition-colors inline-flex items-center justify-center shadow-xs"
                        >
                          <DollarSign className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No clients found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold text-slate-500">
          <div>
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} clients
          </div>
          <div className="flex items-center space-x-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-2.5 py-1 rounded border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50 text-slate-700"
            >
              Previous
            </button>
            <span className="px-3 py-1 rounded bg-[#111827] text-white font-bold">
              {page}
            </span>
            <button
              disabled={page * limit >= total}
              onClick={() => setPage(page + 1)}
              className="px-2.5 py-1 rounded border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50 text-slate-700"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ASSIGN ADVOCATE MODAL */}
      <Modal
        isOpen={!!advocateModalClient}
        onClose={() => setAdvocateModalClient(null)}
        title={`Assign Legal Advocate — ${advocateModalClient?.client_number}`}
        subtitle={`Client: ${advocateModalClient?.name} • Case Status: ${advocateModalClient?.case_status || 'Active'}`}
        maxWidth="lg"
      >
        <form onSubmit={handleAssignAdvocate} className="space-y-4 text-xs">
          {/* Current Assignment Banner */}
          <div className={`p-3 rounded-xl border flex items-center justify-between ${advocateModalClient?.advocate_name
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-amber-50 border-amber-200'
            }`}>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Current Assigned Advocate</span>
              {advocateModalClient?.advocate_name ? (
                <span className="text-sm font-bold text-emerald-800 flex items-center space-x-1.5 mt-0.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
                  <span>{advocateModalClient.advocate_name}</span>
                </span>
              ) : (
                <span className="inline-flex items-center mt-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 border border-amber-300 text-amber-800">
                  Not Assigned
                </span>
              )}
            </div>
            {advocateModalClient?.advocate_name && (
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                Active Assignment
              </span>
            )}
          </div>

          {/* Search Advocate Input */}
          <div className="space-y-1">
            <label className="text-slate-700 block font-semibold">
              Search & Select Advocate *
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Advocate by name, bar ID, city (e.g. Rahul)..."
                value={advocateSearch}
                onChange={(e) => setAdvocateSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Advocates List */}
          <div className="space-y-1">
            <label className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">
              Matching Empanelled Advocates ({
                advocates.filter((a) => {
                  if (!advocateSearch) return true;
                  const q = advocateSearch.toLowerCase();
                  return (
                    a.name?.toLowerCase().includes(q) ||
                    a.advocate_id?.toLowerCase().includes(q) ||
                    a.specialization?.toLowerCase().includes(q) ||
                    a.registration_number?.toLowerCase().includes(q)
                  );
                }).length
              })
            </label>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              <div
                onClick={() => setSelectedAdvocateId('')}
                className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${selectedAdvocateId === ''
                    ? 'bg-gray-100 border-[#15803d] text-slate-900 font-bold'
                    : 'bg-white border-gray-200 text-slate-600 hover:bg-gray-50'
                  }`}
              >
                <div className="flex items-center space-x-2">
                  <div className="h-6 w-6 rounded bg-gray-200 flex items-center justify-center font-bold text-slate-500 text-xs">
                    ✕
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900">Unassign / No Advocate</span>
                    <span className="block text-[10px] text-slate-500">Remove current advocate assignment</span>
                  </div>
                </div>
                {selectedAdvocateId === '' && <span className="text-[#15803d] font-bold text-xs">✓ Selected</span>}
              </div>

              {advocates
                .filter((a) => {
                  if (!advocateSearch) return true;
                  const q = advocateSearch.toLowerCase();
                  return (
                    a.name?.toLowerCase().includes(q) ||
                    a.advocate_id?.toLowerCase().includes(q) ||
                    a.specialization?.toLowerCase().includes(q) ||
                    a.registration_number?.toLowerCase().includes(q)
                  );
                })
                .map((a) => {
                  const isSelected = selectedAdvocateId === a.id;
                  return (
                    <div
                      key={a.id}
                      onClick={() => setSelectedAdvocateId(a.id)}
                      className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${isSelected
                          ? 'bg-emerald-50 border-[#15803d] text-slate-900 ring-1 ring-[#15803d]'
                          : 'bg-white border-gray-200 text-slate-700 hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className={`h-7 w-7 rounded flex items-center justify-center font-bold text-xs ${isSelected ? 'bg-[#15803d] text-white' : 'bg-gray-100 text-slate-600'
                          }`}>
                          <Scale className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-xs text-slate-900">{a.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 text-slate-600 font-mono">
                              {a.advocate_id || a.registration_number}
                            </span>
                          </div>
                          <span className="block text-[10px] text-slate-500 font-medium">
                            {a.specialization || 'Debt Resolution Specialist'} • {a.city || 'Pan India'}
                          </span>
                        </div>
                      </div>
                      {isSelected && <span className="text-[#15803d] font-bold text-xs">✓ Selected</span>}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Notes Input */}
          <div>
            <label className="text-slate-700 block mb-1 font-semibold">Case Defense Instructions / Remarks</label>
            <textarea
              rows={2}
              value={advocateNotes}
              onChange={(e) => setAdvocateNotes(e.target.value)}
              placeholder="e.g. Assigned to handle legal harassment notices from HDFC Bank..."
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Assignment History Timeline */}
          {clientAdvocateHistory.length > 0 && (
            <div className="pt-2 border-t border-gray-200 space-y-1.5">
              <span className="text-slate-600 text-[10px] uppercase font-bold tracking-wider block">
                Assignment History Log ({clientAdvocateHistory.length})
              </span>
              <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                {clientAdvocateHistory.map((h: any) => (
                  <div key={h.id} className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-[11px] flex justify-between items-center">
                    <div>
                      <span className="text-slate-500">{h.previous_advocate_name || 'None'}</span>
                      <span className="text-indigo-600 mx-1.5 font-bold">➔</span>
                      <strong className="text-emerald-700">{h.new_advocate_name || 'Unassigned'}</strong>
                      {h.notes && <span className="text-slate-500 block text-[10px] italic">{h.notes}</span>}
                    </div>
                    <div className="text-right text-[10px] text-slate-500">
                      <span>By {h.assigned_by_name}</span>
                      <span className="block font-mono">{h.created_at ? h.created_at.substring(0, 10) : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setAdvocateModalClient(null)}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-slate-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-[#15803d] hover:bg-emerald-800 text-white font-bold shadow-xs flex items-center space-x-1.5"
            >
              <Scale className="h-4 w-4" />
              <span>{advocateModalClient?.advocate_id ? 'Reassign Advocate' : 'Assign Advocate'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* UPDATE FEE MODAL */}
      <Modal
        isOpen={!!feeModalClient}
        onClose={() => setFeeModalClient(null)}
        title={`Update Retainer Fee — ${feeModalClient?.client_number}`}
        subtitle={`Client: ${feeModalClient?.name}`}
      >
        <form onSubmit={handleUpdateFee} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 block mb-1 font-semibold">SettleXpert Fee Amount (₹) *</label>
            <input
              type="number"
              required
              min="0"
              value={feeData.sx_fee}
              onChange={(e) => setFeeData({ ...feeData, sx_fee: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 font-bold focus:outline-none focus:border-emerald-600 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 block mb-1 font-semibold">Fee Due Date</label>
              <input
                type="date"
                value={feeData.fees_date}
                onChange={(e) => setFeeData({ ...feeData, fees_date: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="text-slate-700 block mb-1 font-semibold">Fee Status</label>
              <select
                value={feeData.fees_status}
                onChange={(e) => setFeeData({ ...feeData, fees_status: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
              >
                <option value="Pending">Pending</option>
                <option value="Partial">Partial</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setFeeModalClient(null)}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-slate-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-[#15803d] hover:bg-emerald-800 text-white font-bold shadow-xs"
            >
              Update Fee Structure
            </button>
          </div>
        </form>
      </Modal>

      {/* CLIENT 360 MODAL */}
      <Modal
        isOpen={!!selectedClient360}
        onClose={() => setSelectedClient360(null)}
        title={`Client 360 Dossier — ${selectedClient360?.client?.client_number || selectedClient360?.client_number}`}
        subtitle={`Full Profile, Multi-Lenders & Agreement Record`}
        maxWidth="lg"
      >
        {selectedClient360 ? (
          <div className="space-y-4 text-xs">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-slate-500 text-[10px] block uppercase font-bold">Total Debt</span>
                <span className="text-sm font-black text-rose-700">
                  {formatCurrency(selectedClient360.client?.total_debt || selectedClient360.total_debt)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-slate-500 text-[10px] block uppercase font-bold">Monthly SX Fee</span>
                <span className="text-sm font-black text-slate-900">
                  {formatCurrency(selectedClient360.client?.monthly_fee || 8000)} / mo
                </span>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-slate-500 text-[10px] block uppercase font-bold">Total Received</span>
                <span className="text-sm font-black text-emerald-700">
                  {formatCurrency(selectedClient360.client?.total_received || selectedClient360.total_received || 0)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-slate-500 text-[10px] block uppercase font-bold">Pending Balance</span>
                <span className="text-sm font-black text-rose-700">
                  {formatCurrency(selectedClient360.client?.pending_amount || selectedClient360.pending_amount || 0)}
                </span>
              </div>
            </div>

            {/* Profile Overview */}
            <div className="p-4 rounded-xl bg-white border border-gray-200 space-y-2">
              <h4 className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                <User className="h-3.5 w-3.5 text-[#15803d]" />
                <span>Client Profile & Contact Information</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4 text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Name</span>
                  <span className="font-bold text-slate-900">{selectedClient360.client?.name || selectedClient360.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Phone</span>
                  <span className="font-mono text-slate-900">{selectedClient360.client?.phone || selectedClient360.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">City</span>
                  <span className="text-slate-800">{selectedClient360.client?.city || selectedClient360.city || 'India'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Consultant</span>
                  <span className="text-slate-900 font-semibold">{selectedClient360.client?.employee_name || selectedClient360.employee_name || 'Staff'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Advocate</span>
                  {(selectedClient360?.client?.advocate_name || selectedClient360?.advocate_name) ? (
                    <span className="font-bold text-emerald-700 flex items-center space-x-1 mt-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block"></span>
                      <span>{selectedClient360.client?.advocate_name || selectedClient360.advocate_name}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 border border-amber-200 text-amber-700">
                      Not Assigned
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Case Status</span>
                  <span className="font-bold text-slate-900 uppercase">{selectedClient360.client?.case_status || selectedClient360.case_status || 'Active'}</span>
                </div>
              </div>
            </div>

            {/* Agreement Section in 360 */}
            <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-indigo-900 text-xs flex items-center space-x-1.5">
                  <FileSignature className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Client Retainer Agreement Record</span>
                </h4>
                {selectedClient360.agreements && selectedClient360.agreements.length > 0 && (
                  <button
                    onClick={() => {
                      const c = selectedClient360.client || selectedClient360;
                      setSelectedClient360(null);
                      handleOpenAgreement(c);
                    }}
                    className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] transition-colors"
                  >
                    View Full Agreement Document
                  </button>
                )}
              </div>

              {selectedClient360.agreements && selectedClient360.agreements.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                  <div className="p-2 bg-white rounded border border-indigo-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Agreement Ref</span>
                    <span className="font-mono font-bold text-indigo-700">{selectedClient360.agreements[0].agreement_number}</span>
                  </div>
                  <div className="p-2 bg-white rounded border border-indigo-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Monthly Retainer</span>
                    <span className="font-bold text-slate-900">{formatCurrency(selectedClient360.agreements[0].monthly_fee || 8000)} / mo</span>
                  </div>
                  <div className="p-2 bg-white rounded border border-indigo-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Duration</span>
                    <span className="font-bold text-blue-700">{selectedClient360.agreements[0].resolution_duration || '6 Months'}</span>
                  </div>
                  <div className="p-2 bg-white rounded border border-indigo-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Contract Value</span>
                    <span className="font-black text-emerald-800">{formatCurrency(selectedClient360.agreements[0].total_fee || 48000)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 italic">No formal agreement contract linked to this client yet.</p>
              )}
            </div>

            {/* Lenders List */}
            {selectedClient360.lenders && selectedClient360.lenders.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                  <Landmark className="h-3.5 w-3.5 text-[#15803d]" />
                  <span>Attached Lenders Portfolio ({selectedClient360.lenders.length})</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedClient360.lenders.map((l: any) => (
                    <div key={l.id} className="p-3 rounded-lg bg-gray-50 border border-gray-200 space-y-1">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>{l.bank_name}</span>
                        <span className="text-rose-700">{formatCurrency(l.balance)}</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>{l.loan_type}</span>
                        <span className="font-bold text-emerald-700">{l.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-gray-200">
              <button
                onClick={() => setSelectedClient360(null)}
                className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-slate-800 text-white font-bold text-xs"
              >
                Close Dossier
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
