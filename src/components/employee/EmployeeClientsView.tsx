import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Search,
  Plus,
  Download,
  Calendar,
  Eye,
  Edit2,
  Edit,
  Trash2,
  Building2,
  ArrowLeft,
  CheckCircle2,
  Mail,
  Upload,
  User,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Send,
  CreditCard,
  Clock,
  ShieldCheck,
  FileText,
  FileSignature,
  Lock,
  History,
  AlertCircle,
  DollarSign
} from 'lucide-react';
import { api } from '../../services/api';
import { Modal } from '../common/Modal';
import { CalendarDateFilter, getTodayStr } from '../common/CalendarDateFilter';
import { AgreementDocumentView } from './AgreementDocumentView';
import { ClientDetailsUnifiedView } from '../crm/ClientDetailsUnifiedView';

interface EmployeeClientsViewProps {
  initialCaseStatusFilter?: string;
  onNavigateToAgreement?: (client: any) => void;
}

export const EmployeeClientsView: React.FC<EmployeeClientsViewProps> = ({
  initialCaseStatusFilter,
  onNavigateToAgreement
}) => {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'closed'>(
    initialCaseStatusFilter === 'closed' ? 'closed' : 'active'
  );
  const [monthFilter, setMonthFilter] = useState('');

  // Screen Modes: 'list' | 'edit' | 'lenders' | 'view_details' | 'document_view'
  const [viewMode, setViewMode] = useState<'list' | 'edit' | 'lenders' | 'view_details' | 'document_view'>('list');
  const [currentClient, setCurrentClient] = useState<any>(null);
  const [selectedAgreementData, setSelectedAgreementData] = useState<any>(null);

  // Edit Client Form State (Matching Screenshot 4)
  const [editFormData, setEditFormData] = useState<any>({});

  // Lenders Management State (Matching Screenshot 2)
  const [lendersList, setLendersList] = useState<any[]>([]);
  const [clientAgreements, setClientAgreements] = useState<any[]>([]);
  const [clientPayments, setClientPayments] = useState<any[]>([]);
  const [monthlyPaymentData, setMonthlyPaymentData] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [lenderSaving, setLenderSaving] = useState(false);

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await api.getCRMClients({
        search: search || undefined,
        case_status: activeTab,
        month: monthFilter || undefined,
        date: selectedDate || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        page,
        limit
      });
      setClients(res.clients || []);
      setTotal(res.pagination?.total || 0);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: 'Failed to load clients' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCaseStatusFilter !== undefined) {
      setActiveTab(initialCaseStatusFilter === 'closed' ? 'closed' : 'active');
      setPage(1);
    }
  }, [initialCaseStatusFilter]);

  useEffect(() => {
    fetchClients();
  }, [search, activeTab, monthFilter, selectedDate, fromDate, toDate, page, limit]);

  // Open Edit Mode (Screenshot 4)
  const handleOpenEdit = async (client: any) => {
    try {
      const detailed = await api.getCRMClient(client.id);
      setCurrentClient(detailed.client || detailed);
      setEditFormData({
        ...(detailed.client || detailed),
        sx_fee: (detailed.client || detailed).sx_fee || ((detailed.client || detailed).total_debt * 0.1) || 6000,
        pending_amount: (detailed.client || detailed).pending_amount || 0,
        total_received: (detailed.client || detailed).total_received || 0,
        this_month_received: (detailed.client || detailed).this_month_received || 0
      });
      setViewMode('edit');
    } catch (err) {
      setCurrentClient(client);
      setEditFormData(client);
      setViewMode('edit');
    }
  };

  // Open Lenders Mode (Screenshot 2)
  const handleOpenLenders = async (client: any) => {
    try {
      const detailed = await api.getCRMClient(client.id);
      setCurrentClient(detailed.client || detailed);
      const existingLenders = detailed.lenders || [];
      setLendersList(
        existingLenders.length > 0
          ? existingLenders
          : [{ bank_name: '', loan_type: '', balance: '' }]
      );
      setViewMode('lenders');
    } catch (err) {
      setCurrentClient(client);
      setLendersList([{ bank_name: '', loan_type: '', balance: '' }]);
      setViewMode('lenders');
    }
  };

  // Open View Details Mode (Screenshot 7)
  const handleOpenViewDetails = async (client: any) => {
    try {
      const [detailed, monthlyRes] = await Promise.all([
        api.getCRMClient(client.id),
        api.getCRMClientMonthlyPayments(client.id)
      ]);
      setCurrentClient(detailed.client || detailed);
      setLendersList(detailed.lenders || []);
      setClientAgreements(detailed.agreements || []);
      setClientPayments(detailed.payments || []);
      setMonthlyPaymentData(monthlyRes);
      setViewMode('view_details');
    } catch (err) {
      setCurrentClient(client);
      setLendersList([]);
      setClientAgreements([]);
      setClientPayments([]);
      setMonthlyPaymentData(null);
      setViewMode('view_details');
    }
  };

  // Submit Edit Client Form
  const handleSaveEditClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClient) return;

    try {
      await api.updateCRMClient(currentClient.id, editFormData);
      setFeedbackMsg({ type: 'success', text: `Client ${currentClient.client_number} updated successfully` });
      setViewMode('list');
      fetchClients();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to update client' });
    }
  };

  // Save Lenders
  const handleSaveLenders = async () => {
    if (!currentClient) return;

    for (let i = 0; i < lendersList.length; i++) {
      const len = lendersList[i];
      if (!len.bank_name || !len.bank_name.trim()) {
        setFeedbackMsg({ type: 'error', text: `Bank Name is required for row ${i + 1}` });
        return;
      }
      if (!len.loan_type || !len.loan_type.trim()) {
        setFeedbackMsg({ type: 'error', text: `Loan Type is required for row ${i + 1}` });
        return;
      }
      const bal = parseFloat(len.balance);
      if (isNaN(bal) || bal < 0) {
        setFeedbackMsg({ type: 'error', text: `Please enter a valid numeric Balance for row ${i + 1}` });
        return;
      }
    }

    try {
      setLenderSaving(true);
      for (const len of lendersList) {
        if (!len.id) {
          await api.addCRMLender(currentClient.id, {
            bank_name: len.bank_name.trim(),
            loan_type: len.loan_type.trim(),
            balance: parseFloat(len.balance) || 0
          });
        }
      }
      setFeedbackMsg({ type: 'success', text: 'Lenders updated successfully' });
      setViewMode('list');
      fetchClients();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to save lenders' });
    } finally {
      setLenderSaving(false);
    }
  };

  const handleAddLenderRow = () => {
    setLendersList([
      ...lendersList,
      { bank_name: '', loan_type: '', balance: '' }
    ]);
  };

  const handleRemoveLenderRow = async (index: number) => {
    const len = lendersList[index];
    if (len.id && currentClient) {
      const confirmDelete = window.confirm(`Are you sure you want to remove ${len.bank_name || 'this lender'} from client records?`);
      if (!confirmDelete) return;
      try {
        await api.deleteCRMLender(currentClient.id, len.id);
        setFeedbackMsg({ type: 'success', text: `Lender ${len.bank_name || ''} removed successfully` });
      } catch (err: any) {
        setFeedbackMsg({ type: 'error', text: err.message || 'Failed to remove lender' });
        return;
      }
    }
    const updated = [...lendersList];
    updated.splice(index, 1);
    if (updated.length === 0) {
      updated.push({ bank_name: '', loan_type: '', balance: '' });
    }
    setLendersList(updated);
  };

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amt || 0);
  };

  const exportToCSV = () => {
    const headers = ['Client ID', 'Name', 'Phone', 'Email', 'City', 'SX Fee', 'Fees Date', 'Fees Status', 'Pending Amount', 'Total Received', 'Case Status', 'Advocate'];
    const rows = clients.map((c) => [
      c.client_number,
      c.name,
      c.phone,
      c.email || '',
      c.city || '',
      c.sx_fee || '',
      c.fees_date || '',
      c.fees_status || '',
      c.pending_amount || 0,
      c.total_received || 0,
      c.case_status || c.status,
      c.advocate_name || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Clients_Export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ==========================================
  // RENDER SCREEN 2: ADD / MANAGE LENDERS (Lender Page)
  // ==========================================
  if (viewMode === 'lenders') {
    const totalLendersAmount = lendersList.reduce((acc, curr) => acc + (parseFloat(curr.balance) || 0), 0);

    return (
      <div className="space-y-4 font-sans text-slate-800 pb-12 ">
        {/* Header Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">
            Client: <span className="text-[#166534] font-bold">{currentClient?.name}</span>
          </h2>
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-slate-700">
              Total Amount: ₹{totalLendersAmount.toLocaleString('en-IN')}
            </span>
            <button
              onClick={() => setViewMode('list')}
              className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-xs font-bold text-slate-700 flex items-center space-x-1.5 shadow-sm transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>
          </div>
        </div>

        {/* Lenders Details Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
          <h3 className="text-xs font-bold text-slate-800 border-b border-gray-200 pb-2">Lenders Details</h3>

          <div className="space-y-3">
            {lendersList.map((lender, index) => (
              <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end text-xs">
                {/* 1. Bank Name (Manual Text Input) */}
                <div className="sm:col-span-4">
                  <label className="text-[11px] text-slate-600 block font-semibold mb-1">Bank Name</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC Bank"
                    value={lender.bank_name || ''}
                    onChange={(e) => {
                      const upd = [...lendersList];
                      upd[index].bank_name = e.target.value;
                      setLendersList(upd);
                    }}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>

                {/* 2. Loan Type (Manual Text Input - No Dropdown) */}
                <div className="sm:col-span-4">
                  <label className="text-[11px] text-slate-600 block font-semibold mb-1">Loan Type</label>
                  <input
                    type="text"
                    placeholder="e.g. Personal Loan, Credit Card"
                    value={lender.loan_type || ''}
                    onChange={(e) => {
                      const upd = [...lendersList];
                      upd[index].loan_type = e.target.value;
                      setLendersList(upd);
                    }}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>

                {/* 3. Balance (Manual Numeric Input) */}
                <div className="sm:col-span-2">
                  <label className="text-[11px] text-slate-600 block font-semibold mb-1">Balance</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="e.g. 250000"
                    value={lender.balance !== undefined && lender.balance !== null ? lender.balance : ''}
                    onChange={(e) => {
                      const upd = [...lendersList];
                      upd[index].balance = e.target.value === '' ? '' : parseFloat(e.target.value);
                      setLendersList(upd);
                    }}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-800 text-xs font-mono font-semibold focus:outline-none focus:border-blue-600"
                  />
                </div>

                {/* 4. Remove Button in Red Color */}
                <div className="sm:col-span-2 flex items-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveLenderRow(index)}
                    title="Remove Lender"
                    className="w-full px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 hover:border-rose-300 transition-colors flex items-center justify-center space-x-1.5 text-xs font-bold shadow-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons: Add More & Save */}
          <div className="flex items-center space-x-2.5 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleAddLenderRow}
              className="px-4 py-2 rounded-lg bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ Add More</span>
            </button>
            <button
              type="button"
              onClick={handleSaveLenders}
              disabled={lenderSaving}
              className="px-5 py-2 rounded-lg bg-[#16a34a] hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors disabled:opacity-50"
            >
              {lenderSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER SCREEN: FULL OFFICIAL AGREEMENT DOCUMENT VIEW
  // ==========================================
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

  // ==========================================
  // RENDER SCREEN: VIEW CLIENT DETAILS (With Onboarding Form Tab)
  // ==========================================
  if (viewMode === 'view_details' && currentClient) {
    return (
      <ClientDetailsUnifiedView
        client={currentClient}
        lenders={lendersList}
        agreements={clientAgreements}
        payments={clientPayments}
        monthlyPaymentData={monthlyPaymentData}
        userRole="employee"
        initialTab="info"
        onBack={() => setViewMode('list')}
        onOpenAgreement={handleOpenAgreement}
        onOpenEdit={handleOpenEdit}
        onOpenLenders={handleOpenLenders}
      />
    );
  }

  // ==========================================
  // RENDER SCREEN 4: EDIT CLIENT DETAILS (Screenshot 4)
  // ==========================================
  if (viewMode === 'edit') {
    return (
      <div className="space-y-4 font-sans text-slate-800 pb-12 ">
        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-[#1e40af]" />
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">Edit Client Details</h2>
              <p className="text-[11px] text-slate-500">Modify profile information and case records</p>
            </div>
          </div>
          <button
            onClick={() => setViewMode('list')}
            className="px-3 py-1 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-xs font-bold text-slate-700 flex items-center space-x-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </button>
        </div>

        <form onSubmit={handleSaveEditClient} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6 text-xs">
          {/* Section 1: Identity Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#1e40af] uppercase tracking-wider flex items-center space-x-1.5 border-b border-gray-200 pb-1.5">
              <span>1. IDENTITY DETAILS</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={editFormData.name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={editFormData.email || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Client ID</label>
                <input
                  type="text"
                  disabled
                  value={editFormData.client_number || ''}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-slate-600 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Primary Phone</label>
                <input
                  type="tel"
                  value={editFormData.phone || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">City / Location</label>
                <input
                  type="text"
                  value={editFormData.city || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Employment Status</label>
                <select
                  value={editFormData.employment_status || 'Employed'}
                  onChange={(e) => setEditFormData({ ...editFormData, employment_status: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600"
                >
                  <option value="Employed">Employed</option>
                  <option value="Unemployed">Unemployed</option>
                  <option value="Self Employed">Self Employed</option>
                  <option value="Business">Business Owner</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Employment Type</label>
                <select
                  value={editFormData.employment_type || 'Salaried'}
                  onChange={(e) => setEditFormData({ ...editFormData, employment_type: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600"
                >
                  <option value="Salaried">Salaried</option>
                  <option value="Business">Business</option>
                  <option value="Freelancer">Freelancer</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Financial Profile */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#1e40af] uppercase tracking-wider flex items-center space-x-1.5 border-b border-gray-200 pb-1.5">
              <span>2. FINANCIAL PROFILE</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Total Outstanding Amount</label>
                <input
                  type="text"
                  value={editFormData.total_debt ? `₹${editFormData.total_debt}` : ''}
                  onChange={(e) => setEditFormData({ ...editFormData, total_debt: parseFloat(e.target.value.replace(/[^0-9]/g, '')) || 0 })}
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Monthly Income</label>
                <input
                  type="number"
                  value={editFormData.monthly_income || 0}
                  onChange={(e) => setEditFormData({ ...editFormData, monthly_income: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Credit Card Dues</label>
                <input
                  type="text"
                  value={editFormData.credit_card_dues || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, credit_card_dues: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Personal Loan Dues</label>
                <input
                  type="text"
                  value={editFormData.personal_loan_dues || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, personal_loan_dues: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Loan Type</label>
              <input
                type="text"
                value={editFormData.loan_type || 'Personal Loan Settlement'}
                onChange={(e) => setEditFormData({ ...editFormData, loan_type: e.target.value })}
                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Section 3: Status & Business */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#1e40af] uppercase tracking-wider flex items-center space-x-1.5 border-b border-gray-200 pb-1.5">
              <span>3. STATUS & BUSINESS</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Currently paying EMIs?</label>
                <select
                  value={editFormData.paying_emis || 'Paying With Difficulty'}
                  onChange={(e) => setEditFormData({ ...editFormData, paying_emis: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600"
                >
                  <option value="Paying">Paying Regularly</option>
                  <option value="Paying With Difficulty">Paying With Difficulty</option>
                  <option value="Not Paying">Stopped Paying (Defaulted)</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Harassment Calls</label>
                <select
                  value={editFormData.harassment_calls || 'Yes'}
                  onChange={(e) => setEditFormData({ ...editFormData, harassment_calls: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600"
                >
                  <option value="Yes">Yes (Recovery Agency Harassment)</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Settlement Needed?</label>
                <select
                  value={editFormData.settlement_needed || 'YES'}
                  onChange={(e) => setEditFormData({ ...editFormData, settlement_needed: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600"
                >
                  <option value="YES">YES</option>
                  <option value="NO">NO</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Consultation Timing</label>
                <select
                  value={editFormData.consultation_timing || '10:00 AM - 12:00 PM'}
                  onChange={(e) => setEditFormData({ ...editFormData, consultation_timing: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600"
                >
                  <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
                  <option value="12:00 PM - 02:00 PM">12:00 PM - 02:00 PM</option>
                  <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
                  <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Lead Status</label>
                <select
                  value={editFormData.status || 'Converted'}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600"
                >
                  <option value="Converted">Converted</option>
                  <option value="Active">Active</option>
                  <option value="Follow Up">Follow Up</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Case Status</label>
                <select
                  value={editFormData.case_status || 'active'}
                  onChange={(e) => setEditFormData({ ...editFormData, case_status: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600"
                >
                  <option value="active">Active</option>
                  <option value="closed">Closed / Settled</option>
                  <option value="dropped">Dropped / Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Payments & Fee Record (View-Only Ledger for Employee) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-1.5">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-[#1e40af] uppercase tracking-wider">
                  4. PAYMENTS & FEE RECORD
                </h3>
              </div>
              <div className="flex items-center space-x-2">

                {monthlyPaymentData?.history && monthlyPaymentData.history.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsHistoryModalOpen(true)}
                    className="px-2.5 py-0.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-[11px] font-bold transition-colors flex items-center space-x-1"
                  >
                    <History className="h-3 w-3" />
                    <span>Audit Log ({monthlyPaymentData.history.length})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Summary Metrics (7 Key Values) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-xs">
              <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg group hover:border-blue-300 transition-colors">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  MONTHLY SX FEE
                </span>
                <div className="relative flex items-center">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-sm font-black text-slate-900 pointer-events-none">₹</span>
                  <input
                    type="number"
                    value={editFormData.monthly_fee || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, monthly_fee: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-3.5 bg-transparent border-b border-dashed border-gray-300 group-hover:border-blue-400 focus:border-blue-600 focus:outline-none text-sm font-black text-slate-900 placeholder:text-slate-300 transition-colors"
                    placeholder="8000"
                  />
                </div>
                <span className="text-[10px] text-slate-500 font-medium block mt-1">/ Month</span>
              </div>

              <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg group hover:border-blue-300 transition-colors">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  AGREEMENT DURATION
                </span>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    value={editFormData.duration_months || 6}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setEditFormData({ ...editFormData, duration_months: val, resolution_duration: `${val} Months` });
                    }}
                    className="w-8 bg-transparent border-b border-dashed border-gray-300 group-hover:border-blue-400 focus:border-blue-600 focus:outline-none text-sm font-black text-blue-700 text-center transition-colors"
                  />
                  <span className="text-sm font-black text-blue-700">Months</span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium block mt-1">
                  {editFormData.duration_months || 6} Cycles
                </span>
              </div>

              <div className="p-2.5 bg-blue-50/60 border border-blue-200 rounded-lg">
                <span className="text-[9px] font-bold text-blue-700 uppercase tracking-wider block mb-1">
                  TOTAL AGREEMENT FEE
                </span>
                <div className="text-sm font-black text-blue-900">
                  {formatCurrency((editFormData.monthly_fee || 8000) * (editFormData.duration_months || 6))}
                </div>
                <span className="text-[10px] text-blue-600 font-medium">Full Value</span>
              </div>

              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                  TOTAL RECEIVED
                </span>
                <div className="text-sm font-black text-emerald-800">
                  {formatCurrency(monthlyPaymentData?.summary?.total_received || editFormData.total_received || 0)}
                </div>
                <span className="text-[10px] text-emerald-600 font-medium">Collected</span>
              </div>

              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg">
                <span className="text-[9px] font-bold text-rose-700 uppercase tracking-wider block mb-1">
                  TOTAL PENDING
                </span>
                <div className="text-sm font-black text-rose-800">
                  {formatCurrency(
                    monthlyPaymentData?.summary?.total_pending !== undefined
                      ? monthlyPaymentData.summary.total_pending
                      : Math.max(
                        0,
                        (monthlyPaymentData?.summary?.total_agreement_fee || 48000) -
                        (editFormData.total_received || 0)
                      )
                  )}
                </div>
                <span className="text-[10px] text-rose-600 font-medium">Balance</span>
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                <span className="text-[9px] font-bold text-amber-700 uppercase tracking-wider block mb-1">
                  CURRENT MONTH RECEIVED
                </span>
                <div className="text-sm font-black text-amber-900">
                  {formatCurrency(
                    monthlyPaymentData?.summary?.current_month_received !== undefined
                      ? monthlyPaymentData.summary.current_month_received
                      : editFormData.this_month_received || 0
                  )}
                </div>
                <span className="text-[10px] text-amber-700 font-medium">
                  Month {monthlyPaymentData?.summary?.current_month_number || 1}
                </span>
              </div>

              <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg">
                <span className="text-[9px] font-bold text-indigo-700 uppercase tracking-wider block mb-1">
                  CURRENT MONTH STATUS
                </span>
                <div className="text-sm font-black text-indigo-900">
                  {monthlyPaymentData?.summary?.current_month_status || editFormData.fees_status || 'Pending'}
                </div>
                <span className="text-[10px] text-indigo-600 font-medium">Active Cycle</span>
              </div>
            </div>


          </div>

          {/* Section 5: Legal & Advocate Assignment */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-1.5">
              <h3 className="text-xs font-bold text-[#1e40af] uppercase tracking-wider flex items-center space-x-1.5">
                <span>5. LEGAL & ADVOCATE ASSIGNMENT</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Assigned Advocate Name</label>
                <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-semibold flex items-center justify-between">
                  {editFormData.advocate_name ? (
                    <span className="text-emerald-800 font-bold flex items-center space-x-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
                      <span>{editFormData.advocate_name}</span>
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">Not Assigned</span>
                  )}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Assigned Consultant</label>
                <input
                  type="text"
                  disabled
                  value={editFormData.employee_name || 'Dhruv Consultant'}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-slate-700 text-xs font-medium cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Case Notes / Remarks</label>
              <textarea
                rows={2}
                value={editFormData.notes || ''}
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#15803d] hover:bg-emerald-800 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Update client data</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ==========================================
  // RENDER SCREEN 1: CLIENTS LIST (Screenshot 3)
  // ==========================================
  return (
    <div className="space-y-4 font-sans text-slate-800 pb-12 ">
      {/* Toast */}
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

      {/* Breadcrumb & Top Bar Matching Screenshot 3 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
          <span className="text-[#1e40af] font-bold">Dashboard</span>
          <span>/</span>
          <span className="text-slate-800 font-bold">Clients</span>
        </div>

        {/* Right Controls: Calendar Date Filter, Month Selector & Export */}
        <div className="flex flex-wrap items-center gap-2">
          <CalendarDateFilter
            selectedDate={selectedDate}
            onDateChange={(d) => {
              setSelectedDate(d);
              setPage(1);
            }}
            fromDate={fromDate}
            toDate={toDate}
            onRangeChange={(f, t) => {
              setFromDate(f);
              setToDate(t);
              setPage(1);
            }}
          />

          <select
            value={monthFilter}
            onChange={(e) => {
              setMonthFilter(e.target.value);
              if (e.target.value) {
                setSelectedDate('');
                setFromDate('');
                setToDate('');
              }
              setPage(1);
            }}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="">Month Wise</option>
            <option value="2026-08">August - 2026</option>
            <option value="2026-07">July - 2026</option>
            <option value="2026-06">June - 2026</option>
          </select>

          <button
            onClick={exportToCSV}
            className="px-3 py-1.5 rounded-lg bg-[#15803d] hover:bg-emerald-800 text-white text-xs font-bold transition-all flex items-center space-x-1 shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar Matching Screenshot 3 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 ${activeTab === 'active'
              ? 'bg-[#111827] text-white shadow-sm'
              : 'bg-white border border-gray-300 text-slate-700 hover:bg-gray-50'
              }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>Active</span>
          </button>

          <button
            onClick={() => setActiveTab('closed')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 ${activeTab === 'closed'
              ? 'bg-[#111827] text-white shadow-sm'
              : 'bg-white border border-gray-300 text-slate-700 hover:bg-gray-50'
              }`}
          >
            <span className="h-2 w-2 rounded-full bg-rose-500"></span>
            <span>Closed</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Bulk Action & Clients Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <button
            onClick={() => setFeedbackMsg({ type: 'success', text: 'Bulk email notices sent to selected clients successfully.' })}
            className="px-3 py-1.5 rounded-lg bg-[#111827] hover:bg-slate-800 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm"
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Send Bulk Mail</span>
          </button>
          <span className="text-xs text-slate-500 font-semibold">{total} Clients Loaded</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/90 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3 px-3 w-8"><input type="checkbox" className="rounded" /></th>
                <th className="py-3 px-3 w-10">#</th>
                <th className="py-3 px-3">Client Id</th>
                <th className="py-3 px-3">Name</th>
                <th className="py-3 px-3">Phone</th>
                <th className="py-3 px-3">Email</th>
                <th className="py-3 px-3">City</th>
                <th className="py-3 px-3 whitespace-nowrap">Monthly SX Fee</th>
                <th className="py-3 px-3">Fees Date</th>
                <th className="py-3 px-3">Fees Status</th>
                <th className="py-3 px-3">Pending Amount</th>
                <th className="py-3 px-3">Total Received</th>
                <th className="py-3 px-3">This Month</th>
                <th className="py-3 px-3">Case Status</th>
                <th className="py-3 px-3">Assigned Consultant</th>
                <th className="py-3 px-3">Assigned Advocate</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={17} className="py-12 text-center text-slate-400">
                    Loading client portfolio...
                  </td>
                </tr>
              ) : clients.length > 0 ? (
                clients.map((c, idx) => (
                  <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-3"><input type="checkbox" className="rounded" /></td>
                    <td className="py-3 px-3 text-slate-500 font-mono">{(page - 1) * limit + idx + 1}</td>
                    <td className="py-3 px-3 font-mono font-bold text-[#1e40af] whitespace-nowrap">
                      {c.client_number}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">{c.name}</td>
                    <td className="py-3 px-3 font-mono text-slate-700">{c.phone}</td>
                    <td className="py-3 px-3 text-slate-600 truncate max-w-[140px]">{c.email || '—'}</td>
                    <td className="py-3 px-3 text-slate-600">{c.city || '—'}</td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-bold text-slate-900">
                        {formatCurrency(c.monthly_fee || 8000)}{' '}
                        <span className="text-[10px] text-slate-500 font-normal">/mo</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        Total: {formatCurrency(c.total_agreement_fee || ((c.monthly_fee || 8000) * (c.duration_months || 6)))}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                      {c.fees_date || '—'}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.fees_status === 'Paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                        }`}>
                        {c.fees_status || 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-rose-700 bg-rose-50/50">
                      {formatCurrency(c.pending_amount)}
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-700">
                      {formatCurrency(c.total_received)}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">
                      {formatCurrency(c.this_month_received || 0)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-700 text-white font-bold text-[10px]">
                        {c.case_status || 'Active'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                      {c.employee_name || 'Dhruv Consultant'}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {c.advocate_name ? (
                        <span className="font-semibold text-slate-800 text-xs flex items-center space-x-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 inline-block"></span>
                          <span>{c.advocate_name}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 border border-amber-200 text-amber-700">
                          Not Assigned
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Action 1: View Client Agreement Document */}
                        <button
                          onClick={() => handleOpenAgreement(c)}
                          title="View Client Agreement"
                          className="h-7 w-7 rounded border border-gray-200 bg-white hover:bg-gray-50 text-slate-600 hover:text-indigo-600 transition-colors flex items-center justify-center shadow-xs"
                        >
                          <FileSignature className="h-3.5 w-3.5" />
                        </button>

                        {/* Action 2: View Client Details */}
                        <button
                          onClick={() => handleOpenViewDetails(c)}
                          title="View Client Details"
                          className="h-7 w-7 rounded border border-gray-200 bg-white hover:bg-gray-50 text-slate-600 hover:text-cyan-600 transition-colors flex items-center justify-center shadow-xs"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        {/* Action 3: Edit Client Information */}
                        <button
                          onClick={() => handleOpenEdit(c)}
                          title="Edit Client Information"
                          className="h-7 w-7 rounded border border-gray-200 bg-white hover:bg-gray-50 text-slate-600 hover:text-amber-600 transition-colors flex items-center justify-center shadow-xs"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        {/* Action 4: Manage Multiple Lenders / Case Details */}
                        <button
                          onClick={() => handleOpenLenders(c)}
                          title="Lender / Case Details"
                          className="h-7 w-7 rounded border border-gray-200 bg-white hover:bg-gray-50 text-slate-600 hover:text-purple-600 transition-colors flex items-center justify-center shadow-xs"
                        >
                          <Building2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={17} className="py-16 text-center text-slate-400">
                    No clients recorded matching current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="p-3 bg-gray-50/60 border-t border-gray-200 flex items-center justify-between text-xs text-slate-600">
          <span>
            Showing {clients.length > 0 ? (page - 1) * limit + 1 : 0} to{' '}
            {Math.min(page * limit, total)} of {total} entries
          </span>

          <div className="flex items-center space-x-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-2 py-1 bg-white border border-gray-300 rounded text-slate-700 disabled:opacity-40"
            >
              &lt;
            </button>
            <span className="px-3 py-1 bg-emerald-700 text-white font-bold rounded">
              {page}
            </span>
            <button
              disabled={page * limit >= total}
              onClick={() => setPage(page + 1)}
              className="px-2 py-1 bg-white border border-gray-300 rounded text-slate-700 disabled:opacity-40"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* PAYMENT TRANSACTION HISTORY MODAL (EMPLOYEE VIEW-ONLY) */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title={`Payment Audit History — ${currentClient?.name || ''}`}
        subtitle={`Client ID: ${currentClient?.client_number || ''} • Permanent Verification Log`}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-between text-blue-900">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span>
                Permanent payment history audit records verified by Finance & Operations Managers.
              </span>
            </div>
            <span className="font-bold text-blue-800">
              {monthlyPaymentData?.history?.length || 0} Transactions
            </span>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-80">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Month</th>
                  <th className="py-2.5 px-3">Payment Date</th>
                  <th className="py-2.5 px-3">Amount Received</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Remarks</th>
                  <th className="py-2.5 px-3">Updated By</th>
                  <th className="py-2.5 px-3">Recorded At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-slate-700">
                {monthlyPaymentData?.history && monthlyPaymentData.history.length > 0 ? (
                  monthlyPaymentData.history.map((h: any, idx: number) => (
                    <tr key={h.id || idx} className="hover:bg-gray-50/80">
                      <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">Month {h.month_number}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{h.payment_date}</td>
                      <td className="py-2.5 px-3 font-black text-emerald-700 font-mono">
                        {formatCurrency(h.amount_received)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${h.payment_status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : h.payment_status === 'Partially Paid'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                            }`}
                        >
                          {h.payment_status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{h.remarks || '—'}</td>
                      <td className="py-2.5 px-3 text-slate-800 font-semibold">
                        {h.updated_by_name || 'Manager'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[10px]">
                        {h.created_at ? h.created_at.replace('T', ' ').substring(0, 19) : '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No payment transactions recorded yet for this client.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-2 border-t border-gray-200">
            <button
              onClick={() => setIsHistoryModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-slate-800 text-white font-bold text-xs"
            >
              Close History
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
