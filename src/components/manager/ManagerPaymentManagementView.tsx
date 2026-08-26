import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  DollarSign,
  User,
  ArrowLeft,
  Edit,
  History,
  FileText,
  FileSignature,
  ShieldCheck,
  RefreshCw,
  Plus,
  ArrowRight,
  TrendingUp,
  Building2
} from 'lucide-react';
import { api } from '../../services/api';
import { Modal } from '../common/Modal';
import { AgreementDocumentView } from '../employee/AgreementDocumentView';

interface ManagerPaymentManagementViewProps {
  onBack?: () => void;
}

export const ManagerPaymentManagementView: React.FC<ManagerPaymentManagementViewProps> = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clientSchedule, setClientSchedule] = useState<any>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Agreement Document State
  const [selectedAgreementData, setSelectedAgreementData] = useState<any>(null);

  // Update Payment Modal State
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [updateForm, setUpdateForm] = useState({
    expected_amount: 8000,
    received_amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_status: 'Paid',
    remarks: 'Monthly fee received',
    payment_type: 'set_direct' as 'set_direct' | 'add_to_received'
  });
  const [savingPayment, setSavingPayment] = useState(false);

  // Generate Schedule Modal State
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    monthly_fee: 8000,
    duration: '6 Months',
    start_date: new Date().toISOString().split('T')[0]
  });
  const [generatingSchedule, setGeneratingSchedule] = useState(false);

  // View History Modal State
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleOpenAgreement = async (clientId: string) => {
    try {
      const detailed = await api.getCRMClient(clientId);
      const agr = detailed.agreements && detailed.agreements.length > 0 ? detailed.agreements[0] : null;
      const targetClient = detailed.client || detailed;

      const agreementObj = {
        ...(agr || {}),
        id: agr?.id || 'agr-draft',
        agreement_number: agr?.agreement_number || ('AGR-' + (targetClient.client_number ? targetClient.client_number.replace(/[^0-9]/g, '') : '2026')),
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
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: 'Failed to load client agreement' });
    }
  };

  // Full-screen Official Agreement Document View (exact same as Employee CRM)
  if (selectedAgreementData) {
    return (
      <AgreementDocumentView
        agreement={selectedAgreementData}
        onBack={() => setSelectedAgreementData(null)}
      />
    );
  }

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await api.getManagerPaymentsClients();
      setClients(res.clients || []);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: 'Failed to load client payment records' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const loadClientSchedule = async (clientId: string) => {
    try {
      setScheduleLoading(true);
      const res = await api.getManagerClientMonthlyPayments(clientId);
      setClientSchedule(res);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: 'Failed to load client payment schedule' });
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleSelectClient = (client: any) => {
    setSelectedClient(client);
    loadClientSchedule(client.id);
  };

  const handleOpenUpdateModal = (record: any) => {
    setSelectedRecord(record);
    const expected = record.expected_amount || 8000;
    const currentReceived = record.received_amount || 0;
    const remainingForMonth = Math.max(0, expected - currentReceived);

    setUpdateForm({
      expected_amount: expected,
      received_amount: currentReceived > 0 ? currentReceived : expected,
      payment_date: record.payment_date || new Date().toISOString().split('T')[0],
      payment_status: currentReceived >= expected && expected > 0 ? 'Paid' : currentReceived > 0 ? 'Partially Paid' : 'Paid',
      remarks: record.remarks || (currentReceived > 0 ? 'Payment update recorded' : 'Monthly fee received'),
      payment_type: 'set_direct'
    });
    setUpdateModalOpen(true);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    try {
      setSavingPayment(true);
      const res = await api.updateCRMMonthlyPaymentRecord(selectedRecord.id, {
        expected_amount: parseFloat(String(updateForm.expected_amount)) || 0,
        received_amount: parseFloat(String(updateForm.received_amount)) || 0,
        payment_date: updateForm.payment_date,
        payment_status: updateForm.payment_status,
        remarks: updateForm.remarks,
        payment_type: updateForm.payment_type
      });

      setFeedbackMsg({
        type: 'success',
        text: res.message || `Month ${selectedRecord.month_number} payment saved successfully!`
      });
      setUpdateModalOpen(false);
      // Reload schedule and client list
      if (selectedClient) {
        await loadClientSchedule(selectedClient.id);
      }
      fetchClients();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to update payment' });
    } finally {
      setSavingPayment(false);
    }
  };

  const handleGenerateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    try {
      setGeneratingSchedule(true);
      const res = await api.generateCRMMonthlyPaymentSchedule(selectedClient.id, {
        agreement_duration: generateForm.duration,
        monthly_fee: parseFloat(String(generateForm.monthly_fee)) || 8000,
        start_date: generateForm.start_date
      });

      setFeedbackMsg({
        type: 'success',
        text: res.message || 'Monthly payment schedule created successfully!'
      });
      setGenerateModalOpen(false);
      await loadClientSchedule(selectedClient.id);
      fetchClients();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to generate schedule' });
    } finally {
      setGeneratingSchedule(false);
    }
  };

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amt || 0);
  };

  // Filter clients
  const filteredClients = clients.filter((c) => {
    const s = search.toLowerCase();
    const matchesSearch =
      c.name?.toLowerCase().includes(s) ||
      c.client_number?.toLowerCase().includes(s) ||
      c.phone?.includes(s) ||
      c.city?.toLowerCase().includes(s);

    const matchesStatus = !statusFilter || c.fees_status?.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  // Calculate totals
  const totalAgreedAll = clients.reduce((acc, c) => acc + (c.total_agreement_fee || 0), 0);
  const totalReceivedAll = clients.reduce((acc, c) => acc + (c.total_received || 0), 0);
  const totalPendingAll = Math.max(0, totalAgreedAll - totalReceivedAll);

  return (
    <div className="space-y-5 font-sans text-slate-800 pb-16 animate-fade-in">
      {/* Toast Alert */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl flex items-center justify-between text-xs font-semibold shadow-xs ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border border-rose-300 text-rose-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-500 hover:text-slate-800 font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 mb-1">
            <span className="text-[#1e40af] font-bold">Manager Workspace</span>
            <span>/</span>
            <span className="text-slate-800 font-bold">Payment Management & Schedule Control</span>
          </div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-[#15803d]" />
            <span>Monthly Payment Control & Audit Ledger</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Authorized Manager payment updates with partial payment calculation and permanent audit logging.
          </p>
        </div>

        {selectedClient && (
          <button
            onClick={() => {
              setSelectedClient(null);
              setClientSchedule(null);
            }}
            className="px-3.5 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-xs font-bold text-slate-700 flex items-center space-x-1.5 shadow-2xs transition-colors self-start sm:self-auto"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>All Clients</span>
          </button>
        )}
      </div>

      {/* Stats Summary Cards */}
      {!selectedClient && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
              TOTAL AGREEMENT BOOKINGS
            </span>
            <div className="text-xl font-black text-slate-900">{formatCurrency(totalAgreedAll)}</div>
            <span className="text-[11px] text-slate-500 mt-1 block">{clients.length} Client Portfolios</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
            <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block mb-1">
              TOTAL RECEIVED (COLLECTED)
            </span>
            <div className="text-xl font-black text-emerald-700">{formatCurrency(totalReceivedAll)}</div>
            <span className="text-[11px] text-emerald-600 mt-1 block">Verified In Settlements</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-2xs">
            <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider block mb-1">
              TOTAL PENDING COLLECTIONS
            </span>
            <div className="text-xl font-black text-rose-700">{formatCurrency(totalPendingAll)}</div>
            <span className="text-[11px] text-rose-600 mt-1 block">Scheduled Over Months</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/20 shadow-2xs">
            <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider block mb-1">
              RETAINER SCHEDULES
            </span>
            <div className="text-xl font-black text-blue-700">₹8,000 / mo</div>
            <span className="text-[11px] text-blue-600 mt-1 block">Standard Fixed Monthly Fee</span>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SCREEN 1: CLIENT SELECTION TABLE */}
      {/* ======================================================== */}
      {!selectedClient && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden space-y-3 p-4">
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Client ID, Name, Phone, City..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#15803d]"
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#15803d]"
              >
                <option value="">All Payment Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Pending">Pending</option>
              </select>

              <button
                onClick={fetchClients}
                className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-slate-700 shadow-2xs"
                title="Refresh Clients"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3">Client ID</th>
                  <th className="py-3 px-3">Client Name</th>
                  <th className="py-3 px-3">Phone</th>
                  <th className="py-3 px-3">Agreement Duration</th>
                  <th className="py-3 px-3">Monthly Fee</th>
                  <th className="py-3 px-3">Total Agreement Fee</th>
                  <th className="py-3 px-3">Total Received</th>
                  <th className="py-3 px-3">Total Pending</th>
                  <th className="py-3 px-3">Fees Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400">
                      Loading client payment schedules...
                    </td>
                  </tr>
                ) : filteredClients.length > 0 ? (
                  filteredClients.map((c, idx) => (
                    <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono font-bold text-[#1e40af] whitespace-nowrap">
                        {c.client_number}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">{c.name}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">{c.phone}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-bold whitespace-nowrap">
                          {c.resolution_duration || `${c.duration_months || 6} Months`}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {formatCurrency(c.monthly_fee || 8000)}
                      </td>
                      <td className="py-3 px-3 font-black text-slate-900">
                        {formatCurrency(c.total_agreement_fee || 48000)}
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-700">
                        {formatCurrency(c.total_received || 0)}
                      </td>
                      <td className="py-3 px-3 font-bold text-rose-700 bg-rose-50/30">
                        {formatCurrency(c.pending_amount || 0)}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.fees_status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : c.fees_status === 'Partially Paid' || c.fees_status === 'Partial'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-slate-100 text-slate-700 border border-slate-300'
                          }`}
                        >
                          {c.fees_status || 'Pending'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenAgreement(c.id)}
                          title="View Client Agreement"
                          className="h-7 w-7 rounded border border-gray-200 bg-white hover:bg-gray-50 text-slate-600 hover:text-indigo-600 transition-colors inline-flex items-center justify-center shadow-xs"
                        >
                          <FileSignature className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleSelectClient(c)}
                          className="px-3 py-1.5 rounded-lg bg-[#15803d] hover:bg-emerald-800 text-white font-bold text-xs inline-flex items-center space-x-1 shadow-2xs transition-colors"
                        >
                          <span>Manage Payment</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400">
                      No clients found matching filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SCREEN 2: SELECTED CLIENT MONTHLY PAYMENT SCHEDULE */}
      {/* ======================================================== */}
      {selectedClient && clientSchedule && (
        <div className="space-y-5">
          {/* Client Header Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="h-11 w-11 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-700 flex items-center justify-center font-bold">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base font-black text-slate-900">{clientSchedule.client?.name}</h2>
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono font-bold text-xs">
                      {clientSchedule.client?.client_number}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Phone: <span className="font-mono text-slate-700">{clientSchedule.client?.phone}</span> • City: {clientSchedule.client?.city || 'India'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleOpenAgreement(clientSchedule.client?.id)}
                  className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition-colors"
                >
                  <FileSignature className="h-3.5 w-3.5 text-indigo-600" />
                  <span>View Agreement</span>
                </button>

                <button
                  onClick={() => setHistoryModalOpen(true)}
                  className="px-3.5 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-xs font-bold text-slate-700 flex items-center space-x-1.5 shadow-2xs"
                >
                  <History className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Payment History ({clientSchedule.history?.length || 0})</span>
                </button>

                <button
                  onClick={() => {
                    setGenerateForm({
                      monthly_fee: clientSchedule.summary?.monthly_fee || 8000,
                      duration: clientSchedule.summary?.agreement_duration || '6 Months',
                      start_date: new Date().toISOString().split('T')[0]
                    });
                    setGenerateModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-[#2563eb] hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-2xs"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Regenerate Schedule</span>
                </button>
              </div>
            </div>

            {/* Client Summary Grid (4 Cards) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                  MONTHLY SETTL EXPERT FEE
                </span>
                <div className="text-base font-black text-slate-900">
                  {formatCurrency(clientSchedule.summary?.monthly_fee || 8000)}
                </div>
                <span className="text-[10px] text-slate-500">Per Month Fixed</span>
              </div>

              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                  AGREEMENT DURATION
                </span>
                <div className="text-base font-black text-blue-700">
                  {clientSchedule.summary?.agreement_duration || '6 Months'}
                </div>
                <span className="text-[10px] text-slate-500">
                  {clientSchedule.summary?.duration_months || 6} Payment Cycles
                </span>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] text-emerald-700 font-bold uppercase block mb-1">
                  TOTAL RECEIVED AMOUNT
                </span>
                <div className="text-base font-black text-emerald-800">
                  {formatCurrency(clientSchedule.summary?.total_received || 0)}
                </div>
                <span className="text-[10px] text-emerald-600">
                  Status: {clientSchedule.summary?.fees_status || 'Pending'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
                <span className="text-[10px] text-rose-700 font-bold uppercase block mb-1">
                  TOTAL PENDING FEE
                </span>
                <div className="text-base font-black text-rose-800">
                  {formatCurrency(clientSchedule.summary?.total_pending || 0)}
                </div>
                <span className="text-[10px] text-rose-600">
                  Of {formatCurrency(clientSchedule.summary?.total_agreement_fee || 48000)} Total
                </span>
              </div>
            </div>
          </div>

          {/* Monthly Payment Schedule Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-[#15803d]" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  MONTHLY PAYMENT SCHEDULE ({clientSchedule.records?.length || 0} MONTHS)
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-600">
                Total Agreement Fee: {formatCurrency(clientSchedule.summary?.total_agreement_fee || 48000)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Cycle</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Expected Amount</th>
                    <th className="py-3 px-4">Received Amount</th>
                    <th className="py-3 px-4">Pending Amount</th>
                    <th className="py-3 px-4">Payment Date</th>
                    <th className="py-3 px-4">Payment Status</th>
                    <th className="py-3 px-4">Remarks</th>
                    <th className="py-3 px-4 text-right">Manager Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-slate-700">
                  {clientSchedule.records && clientSchedule.records.length > 0 ? (
                    clientSchedule.records.map((r: any) => (
                      <tr key={r.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                          Month {r.month_number}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                          {r.due_date}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                          {formatCurrency(r.expected_amount)}
                        </td>
                        <td className="py-3 px-4 font-black text-emerald-700 font-mono">
                          {formatCurrency(r.received_amount || 0)}
                        </td>
                        <td className="py-3 px-4 font-bold text-rose-700 font-mono bg-rose-50/20">
                          {formatCurrency(r.pending_amount || 0)}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                          {r.payment_date || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block whitespace-nowrap ${
                              r.payment_status === 'Paid'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : r.payment_status === 'Partially Paid'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : r.payment_status === 'Overdue'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-slate-100 text-slate-700 border border-slate-300'
                            }`}
                          >
                            {r.payment_status || 'Pending'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 max-w-[180px] truncate" title={r.remarks || ''}>
                          {r.remarks || '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenUpdateModal(r)}
                            className="px-3 py-1.5 rounded-lg bg-[#15803d] hover:bg-emerald-800 text-white font-bold text-xs inline-flex items-center space-x-1 shadow-2xs transition-colors"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            <span>Update Payment</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        No payment schedule recorded. Click "Regenerate Schedule" above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Embedded Permanent Payment History Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center space-x-2">
                <History className="h-4 w-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  PERMANENT PAYMENT TRANSACTION HISTORY AUDIT LOG
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 italic">
                Permanent records • Never overwritten
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Month</th>
                    <th className="py-3 px-4">Payment Date</th>
                    <th className="py-3 px-4">Amount Received</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Remarks</th>
                    <th className="py-3 px-4">Updated By</th>
                    <th className="py-3 px-4">Recorded At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-slate-700">
                  {clientSchedule.history && clientSchedule.history.length > 0 ? (
                    clientSchedule.history.map((h: any, idx: number) => (
                      <tr key={h.id || idx} className="hover:bg-gray-50/80">
                        <td className="py-3 px-4 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">Month {h.month_number}</td>
                        <td className="py-3 px-4 font-mono text-slate-700">{h.payment_date}</td>
                        <td className="py-3 px-4 font-black text-emerald-700 font-mono">
                          {formatCurrency(h.amount_received)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              h.payment_status === 'Paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : h.payment_status === 'Partially Paid'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {h.payment_status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{h.remarks || '—'}</td>
                        <td className="py-3 px-4 text-slate-800 font-semibold">
                          {h.updated_by_name || 'Finance Manager'} ({h.updated_by_role || 'Manager'})
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[10px]">
                          {h.created_at ? h.created_at.replace('T', ' ').substring(0, 19) : '—'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No historical payment transactions logged yet for this client.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: UPDATE PAYMENT FORM (MANAGER CONTROL) */}
      {/* ======================================================== */}
      <Modal
        isOpen={updateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
        title={`Update Payment — Month ${selectedRecord?.month_number}`}
        subtitle={`Client: ${selectedClient?.name} (${selectedClient?.client_number})`}
        maxWidth="md"
      >
        <form onSubmit={handleSavePayment} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">MONTH</span>
              <span className="font-black text-slate-900 text-sm">Month {selectedRecord?.month_number}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">DUE DATE</span>
              <span className="font-mono text-slate-700 font-semibold text-xs">{selectedRecord?.due_date}</span>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">Expected Amount (₹) *</label>
            <input
              type="number"
              min="0"
              required
              value={updateForm.expected_amount}
              onChange={(e) => setUpdateForm({ ...updateForm, expected_amount: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 font-mono font-bold text-sm focus:outline-none focus:border-[#15803d]"
            />
            <p className="text-[10px] text-slate-400 mt-0.5">Fixed independent monthly fee (e.g. ₹8,000)</p>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">Received Amount (₹) *</label>
            <input
              type="number"
              min="0"
              required
              value={updateForm.received_amount}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                const exp = updateForm.expected_amount || 8000;
                let autoStat = updateForm.payment_status;
                if (val >= exp && exp > 0) autoStat = 'Paid';
                else if (val > 0) autoStat = 'Partially Paid';
                else autoStat = 'Pending';

                setUpdateForm({
                  ...updateForm,
                  received_amount: val,
                  payment_status: autoStat
                });
              }}
              className="w-full px-3 py-2 bg-emerald-50 border-2 border-emerald-500 rounded-lg text-emerald-900 font-mono font-black text-base focus:outline-none"
            />
            {/* Live Partial / Full Calculation preview */}
            <div className="mt-1 flex items-center justify-between text-[11px] font-semibold text-slate-600">
              <span>
                Pending for Month: <strong className="text-rose-700 font-mono">{formatCurrency(Math.max(0, updateForm.expected_amount - updateForm.received_amount))}</strong>
              </span>
              <span className="text-emerald-700 font-bold">
                {updateForm.received_amount >= updateForm.expected_amount ? 'Full Payment' : updateForm.received_amount > 0 ? 'Partial Payment' : 'No Payment'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Payment Date *</label>
              <input
                type="date"
                required
                value={updateForm.payment_date}
                onChange={(e) => setUpdateForm({ ...updateForm, payment_date: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-[#15803d]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Payment Status *</label>
              <select
                value={updateForm.payment_status}
                onChange={(e) => setUpdateForm({ ...updateForm, payment_status: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 text-xs font-bold focus:outline-none focus:border-[#15803d]"
              >
                <option value="Paid">Paid</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">Remarks *</label>
            <input
              type="text"
              required
              placeholder="e.g. Monthly fee received via UPI / Bank Transfer"
              value={updateForm.remarks}
              onChange={(e) => setUpdateForm({ ...updateForm, remarks: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-[#15803d]"
            />
          </div>

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-[10px] text-amber-800 flex items-start space-x-2">
            <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              This update will be permanently recorded in the client payment transaction history log and automatically synchronized with the Employee CRM.
            </span>
          </div>

          <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setUpdateModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-slate-700 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingPayment}
              className="px-5 py-2 rounded-lg bg-[#15803d] hover:bg-emerald-800 text-white font-bold shadow-xs transition-colors disabled:opacity-50 flex items-center space-x-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{savingPayment ? 'Saving Payment...' : 'Save Payment'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 2: REGENERATE / GENERATE SCHEDULE */}
      {/* ======================================================== */}
      <Modal
        isOpen={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        title="Generate Monthly Payment Schedule"
        subtitle={`Client: ${selectedClient?.name} (${selectedClient?.client_number})`}
        maxWidth="md"
      >
        <form onSubmit={handleGenerateSchedule} className="space-y-4 text-xs">
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">Monthly Settl Expert Fee (₹) *</label>
            <input
              type="number"
              required
              min="0"
              value={generateForm.monthly_fee}
              onChange={(e) => setGenerateForm({ ...generateForm, monthly_fee: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 font-bold font-mono focus:outline-none focus:border-[#15803d]"
            />
            <p className="text-[10px] text-slate-400 mt-0.5">Example: ₹8,000 per month (Fixed independent amount)</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Agreement Duration *</label>
              <select
                value={generateForm.duration}
                onChange={(e) => setGenerateForm({ ...generateForm, duration: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-[#15803d]"
              >
                <option value="1 Month">1 Month</option>
                <option value="2 Months">2 Months</option>
                <option value="4 Months">4 Months</option>
                <option value="6 Months">6 Months (Standard)</option>
                <option value="12 Months">12 Months</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={generateForm.start_date}
                onChange={(e) => setGenerateForm({ ...generateForm, start_date: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#15803d]"
              />
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-1">
            <span className="text-[11px] font-bold text-blue-900 block">Total Agreement Fee Preview:</span>
            <div className="text-base font-black text-blue-900">
              {formatCurrency(
                (generateForm.monthly_fee || 8000) *
                  (generateForm.duration === '1 Month'
                    ? 1
                    : generateForm.duration === '2 Months'
                    ? 2
                    : generateForm.duration === '4 Months'
                    ? 4
                    : generateForm.duration === '12 Months'
                    ? 12
                    : 6)
              )}
            </div>
            <p className="text-[10px] text-blue-700">
              ₹{(generateForm.monthly_fee || 8000).toLocaleString('en-IN')} × {generateForm.duration} = ₹
              {(
                (generateForm.monthly_fee || 8000) *
                (generateForm.duration === '1 Month' ? 1 : generateForm.duration === '2 Months' ? 2 : generateForm.duration === '4 Months' ? 4 : generateForm.duration === '12 Months' ? 12 : 6)
              ).toLocaleString('en-IN')}{' '}
              (Fixed monthly amounts, no division)
            </p>
          </div>

          <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setGenerateModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-slate-700 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={generatingSchedule}
              className="px-5 py-2 rounded-lg bg-[#2563eb] hover:bg-blue-700 text-white font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              {generatingSchedule ? 'Generating...' : 'Generate Schedule'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 3: FULL PAYMENT HISTORY MODAL */}
      {/* ======================================================== */}
      <Modal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title={`Payment Transaction History — ${selectedClient?.name}`}
        subtitle={`Client Number: ${selectedClient?.client_number}`}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-96">
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
                  <th className="py-2.5 px-3">Updated At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-slate-700">
                {clientSchedule?.history && clientSchedule.history.length > 0 ? (
                  clientSchedule.history.map((h: any, idx: number) => (
                    <tr key={h.id || idx} className="hover:bg-gray-50/80">
                      <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">Month {h.month_number}</td>
                      <td className="py-2.5 px-3 font-mono">{h.payment_date}</td>
                      <td className="py-2.5 px-3 font-black text-emerald-700 font-mono">
                        {formatCurrency(h.amount_received)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            h.payment_status === 'Paid'
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
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
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
                      No permanent history records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-2 border-t border-gray-200">
            <button
              onClick={() => setHistoryModalOpen(false)}
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
