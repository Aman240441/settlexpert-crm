import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Plus,
  Search,
  Eye,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Landmark,
  X,
  FileSignature,
  Trash2,
  Download,
  CheckCircle2,
  Clock,
  Send,
  Calendar,
  FileText,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Edit2,
  TrendingDown
} from 'lucide-react';
import { api } from '../../services/api';
import { Modal } from '../common/Modal';
import { DemandNoticeDocumentView } from './DemandNoticeDocumentView';

interface AdvocateDemandNoticesViewProps {
  onDraftReplyNotice?: (demandData: any) => void;
}

export const AdvocateDemandNoticesView: React.FC<AdvocateDemandNoticesViewProps> = ({ onDraftReplyNotice }) => {
  const [demandNotices, setDemandNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Mode: 'list' | 'document_view'
  const [viewMode, setViewMode] = useState<'list' | 'document_view'>('list');
  const [selectedNoticeForDocView, setSelectedNoticeForDocView] = useState<any>(null);

  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    pending: 0,
    replied: 0,
    settled: 0
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedNoticeForDetailModal, setSelectedNoticeForDetailModal] = useState<any>(null);
  const [editingNotice, setEditingNotice] = useState<any>(null);

  const [clientOptions, setClientOptions] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    client_id: '',
    client_name: '',
    client_pan: '',
    client_phone: '',
    client_email: '',
    client_address: '',
    bank_name: '',
    loan_account_no: '',
    demand_type: 'Incoming Loan Recall Demand',
    demand_amount: 0,
    settlement_offer_amount: 0,
    notice_date: new Date().toISOString().split('T')[0],
    reply_due_date: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    status: 'Pending Review',
    remarks: ''
  });

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchDemandNotices = async () => {
    try {
      setLoading(true);
      const res = await api.getAdvocateDemandNotices({
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        demand_type: typeFilter !== 'all' ? typeFilter : undefined,
        page,
        limit
      });
      setDemandNotices(res.demandNotices || []);
      if (res.statusCounts) {
        setStatusCounts(res.statusCounts);
      }
      setTotal(res.pagination?.total || 0);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: 'Failed to load demand notices' });
    } finally {
      setLoading(false);
    }
  };

  const fetchClientOptions = async () => {
    try {
      const res = await api.getAdvocateCases({ limit: 100 });
      setClientOptions(res.cases || []);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchDemandNotices();
  }, [search, statusFilter, typeFilter, page, limit]);

  useEffect(() => {
    fetchClientOptions();
  }, []);

  const handleClientSelectChange = async (clientId: string) => {
    const found = clientOptions.find((c) => c.id === clientId);
    if (found) {
      const totalDebt = parseFloat(found.total_debt) || 500000;
      let bName = found.bank_name || 'HDFC Bank Ltd.';
      let accNo = found.loan_account_no || 'PL-2026-X89';
      let pan = found.pan_number || 'BTWPC6838E';
      let phone = found.phone || '+91 98138 72093';
      let email = found.email || 'khan****@gmail.com';
      let address = found.address || found.city || 'New Delhi, Delhi, India';

      try {
        const fullCase = await api.getAdvocateCaseById(clientId);
        const cData = fullCase.case || fullCase;
        const agrs = fullCase.agreements || [];
        const latestAgr = agrs.length > 0 ? agrs[0] : null;
        const lenders = fullCase.lenders || [];
        const firstLender = lenders.length > 0 ? lenders[0] : null;

        if (cData.pan || latestAgr?.pin_number) pan = cData.pan || latestAgr.pin_number;
        if (cData.phone || latestAgr?.phone) phone = cData.phone || latestAgr.phone;
        if (cData.email || latestAgr?.email) email = cData.email || latestAgr.email;
        if (cData.address || latestAgr?.address) address = cData.address || latestAgr.address;
        if (firstLender?.bank_name) bName = firstLender.bank_name;
        if (firstLender?.loan_account_no) accNo = firstLender.loan_account_no;
      } catch (e) {}

      setFormData((prev) => ({
        ...prev,
        client_id: found.id,
        client_name: found.name,
        client_pan: pan,
        client_phone: phone,
        client_email: email,
        client_address: address,
        bank_name: bName,
        loan_account_no: accNo,
        demand_amount: totalDebt,
        settlement_offer_amount: Math.round(totalDebt * 0.45)
      }));
    }
  };

  const handleOpenCreateModal = () => {
    setFormData({
      client_id: '',
      client_name: '',
      client_pan: '',
      client_phone: '',
      client_email: '',
      client_address: '',
      bank_name: '',
      loan_account_no: '',
      demand_type: 'Incoming Loan Recall Demand',
      demand_amount: 500000,
      settlement_offer_amount: 225000,
      notice_date: new Date().toISOString().split('T')[0],
      reply_due_date: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      status: 'Pending Review',
      remarks: 'Incoming statutory notice received from lender demanding full loan repayment.'
    });
    setIsCreateModalOpen(true);
  };

  const handleSaveDemandNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bank_name) {
      setFeedbackMsg({ type: 'error', text: 'Please enter Bank Name' });
      return;
    }
    try {
      const res = await api.createAdvocateDemandNotice(formData);
      setFeedbackMsg({ type: 'success', text: `🎉 ${res.message || 'Demand Notice recorded successfully!'}` });
      setIsCreateModalOpen(false);
      fetchDemandNotices();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to record demand notice' });
    }
  };

  const handleOpenEditModal = (notice: any) => {
    setEditingNotice(notice);
    setFormData({
      client_id: notice.client_id || '',
      client_name: notice.client_name || '',
      client_pan: notice.client_pan || 'BTWPC6838E',
      client_phone: notice.client_phone || '+91 98138 72093',
      client_email: notice.client_email || 'khan****@gmail.com',
      client_address: notice.client_address || 'New Delhi, Delhi, India',
      bank_name: notice.bank_name || '',
      loan_account_no: notice.loan_account_no || '',
      demand_type: notice.demand_type || 'Incoming Loan Recall Demand',
      demand_amount: notice.demand_amount || 0,
      settlement_offer_amount: notice.settlement_offer_amount || 0,
      notice_date: notice.notice_date || new Date().toISOString().split('T')[0],
      reply_due_date: notice.reply_due_date || '',
      status: notice.status || 'Pending Review',
      remarks: notice.remarks || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateDemandNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNotice) return;
    try {
      await api.updateAdvocateDemandNotice(editingNotice.id, formData);
      setFeedbackMsg({ type: 'success', text: `Demand Notice ${editingNotice.demand_number} updated successfully!` });
      setIsEditModalOpen(false);
      fetchDemandNotices();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to update demand notice' });
    }
  };

  const handleDeleteNotice = async (id: string, number: string) => {
    if (!window.confirm(`Are you sure you want to delete Demand Notice ${number}?`)) return;
    try {
      await api.deleteAdvocateDemandNotice(id);
      setFeedbackMsg({ type: 'success', text: `Demand Notice ${number} deleted successfully` });
      fetchDemandNotices();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: 'Failed to delete demand notice' });
    }
  };

  // Full Screen A4 Demand Notice Reply Document
  if (viewMode === 'document_view' && selectedNoticeForDocView) {
    return (
      <DemandNoticeDocumentView
        demandNotice={selectedNoticeForDocView}
        onBack={() => {
          setViewMode('list');
          setSelectedNoticeForDocView(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-4 font-sans text-slate-800 pb-16">
      {/* Top Banner / Toast */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded-lg flex items-center justify-between text-xs font-semibold shadow-xs animate-fadeIn ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
              : 'bg-rose-50 text-rose-800 border border-rose-300'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-700 ml-2">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">Demand Notices & OTS Proposals</h1>
              <p className="text-[11px] text-slate-500">Track incoming bank demand notices and manage formal OTS counter proposals</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Record Demand Notice</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Tracked</span>
            <FileText className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-xl font-black text-slate-900">{statusCounts.all}</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex justify-between items-center text-rose-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Review</span>
            <Clock className="h-4 w-4" />
          </div>
          <p className="text-xl font-black text-rose-700">{statusCounts.pending}</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex justify-between items-center text-blue-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Reply Dispatched</span>
            <Send className="h-4 w-4" />
          </div>
          <p className="text-xl font-black text-blue-700">{statusCounts.replied}</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex justify-between items-center text-emerald-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Settled / Agreed</span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <p className="text-xl font-black text-emerald-700">{statusCounts.settled}</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row gap-2.5 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by demand no, bank, client name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-amber-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-amber-600"
          >
            <option value="all">All Demand Types</option>
            <option value="Incoming Loan Recall Demand">Loan Recall Demand</option>
            <option value="Incoming Section 138 Statutory Demand">Sec 138 Demand</option>
            <option value="Incoming Pre-Litigation Legal Demand">Pre-Litigation Demand</option>
            <option value="Outgoing OTS Settlement Demand">Outgoing OTS Demand</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-amber-600"
          >
            <option value="all">All Status</option>
            <option value="Pending Review">Pending Review</option>
            <option value="OTS In Negotiation">OTS In Negotiation</option>
            <option value="Reply Dispatched">Reply Dispatched</option>
            <option value="Settlement Agreed">Settlement Agreed</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-2.5 px-3.5">Demand Ref No</th>
                <th className="py-2.5 px-3.5">Client Details</th>
                <th className="py-2.5 px-3.5">Bank / Lender</th>
                <th className="py-2.5 px-3.5">Demand Category</th>
                <th className="py-2.5 px-3.5 text-right">Bank Demand</th>
                <th className="py-2.5 px-3.5 text-right">OTS Offer (45%)</th>
                <th className="py-2.5 px-3.5">Notice Date</th>
                <th className="py-2.5 px-3.5">Reply Due Date</th>
                <th className="py-2.5 px-3.5">Status</th>
                <th className="py-2.5 px-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Loading demand notices...
                  </td>
                </tr>
              ) : demandNotices.length > 0 ? (
                demandNotices.map((d) => (
                  <tr key={d.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-2.5 px-3.5 font-bold text-amber-700 font-mono">{d.demand_number}</td>
                    <td className="py-2.5 px-3.5">
                      <div className="font-bold text-slate-900">{d.client_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{d.client_number || '—'}</div>
                    </td>
                    <td className="py-2.5 px-3.5 font-semibold text-slate-800">
                      <div className="flex items-center space-x-1.5">
                        <Landmark className="h-3.5 w-3.5 text-slate-400" />
                        <span>{d.bank_name}</span>
                      </div>
                      {d.loan_account_no && (
                        <div className="text-[10px] text-slate-400 font-mono ml-5">A/C: {d.loan_account_no}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {d.demand_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono font-bold text-rose-600">
                      ₹{parseFloat(d.demand_amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono font-bold text-emerald-700">
                      ₹{parseFloat(d.settlement_offer_amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3.5 font-mono text-slate-600">{d.notice_date}</td>
                    <td className="py-2.5 px-3.5 font-mono">
                      {d.reply_due_date ? (
                        <span className="inline-flex items-center space-x-1 text-rose-700 font-semibold">
                          <Clock className="h-3 w-3" />
                          <span>{d.reply_due_date}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          d.status === 'Settlement Agreed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : d.status === 'Reply Dispatched'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : d.status === 'OTS In Negotiation'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        {/* 1-Click View Reply Letter Document */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedNoticeForDocView(d);
                            setViewMode('document_view');
                          }}
                          title="View Official Reply Letter"
                          className="h-7 px-2.5 rounded bg-[#15803d] hover:bg-emerald-800 text-white font-bold text-[11px] flex items-center space-x-1 shadow-xs transition-colors cursor-pointer"
                        >
                          <FileText className="h-3 w-3" />
                          <span>View Reply</span>
                        </button>

                        {/* Quick View Details Modal */}
                        <button
                          type="button"
                          onClick={() => setSelectedNoticeForDetailModal(d)}
                          title="View Assessment Details"
                          className="h-7 w-7 rounded border border-gray-200 bg-white hover:bg-amber-50 text-amber-700 flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        {/* Edit Demand Notice Modal */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(d)}
                          title="Edit Demand Notice"
                          className="h-7 w-7 rounded border border-gray-200 bg-white hover:bg-blue-50 text-blue-600 flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        {/* Delete Record */}
                        <button
                          type="button"
                          onClick={() => handleDeleteNotice(d.id, d.demand_number)}
                          title="Delete Notice"
                          className="h-7 w-7 rounded border border-gray-200 bg-white hover:bg-rose-50 text-rose-600 flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No demand notices recorded matching current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">
            Showing {demandNotices.length > 0 ? (page - 1) * limit + 1 : 0} to{' '}
            {Math.min(page * limit, total)} of {total} demand notices
          </span>
          <div className="flex items-center space-x-1.5">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-2.5 py-1 bg-white border border-gray-300 rounded text-slate-700 disabled:opacity-40 hover:bg-gray-50 text-xs font-semibold cursor-pointer"
            >
              Previous
            </button>
            <span className="px-3 py-1 bg-amber-600 text-white font-bold rounded text-xs">{page}</span>
            <button
              disabled={page * limit >= total}
              onClick={() => setPage(page + 1)}
              className="px-2.5 py-1 bg-white border border-gray-300 rounded text-slate-700 disabled:opacity-40 hover:bg-gray-50 text-xs font-semibold cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* CREATE DEMAND NOTICE MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Record Bank Demand Notice / OTS Proposal"
        subtitle="Track incoming loan recall demand or structure a formal counter-settlement offer"
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveDemandNotice} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Select Assigned Client *</label>
              <select
                required
                value={formData.client_id}
                onChange={(e) => handleClientSelectChange(e.target.value)}
                className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded text-slate-900 text-xs focus:outline-none focus:border-amber-600 font-bold"
              >
                <option value="">-- Choose Client --</option>
                {clientOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.client_number} - {c.name} ({c.city || 'NCR'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Demand Category *</label>
              <select
                value={formData.demand_type}
                onChange={(e) => setFormData({ ...formData, demand_type: e.target.value })}
                className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded text-slate-900 text-xs focus:outline-none focus:border-amber-600 font-semibold"
              >
                <option value="Incoming Loan Recall Demand">Incoming Loan Recall Demand</option>
                <option value="Incoming Section 138 Statutory Demand">Incoming Section 138 Statutory Demand</option>
                <option value="Incoming Pre-Litigation Legal Demand">Incoming Pre-Litigation Legal Demand</option>
                <option value="Outgoing OTS Settlement Demand">Outgoing OTS Settlement Demand</option>
                <option value="Loan Acceleration Demand">Loan Acceleration Demand</option>
              </select>
            </div>
          </div>

          {/* PERSONAL DETAILS AUTO-FETCHED CARD */}
          {formData.client_name && (
            <div className="bg-slate-50 border border-amber-200 rounded-lg p-3 space-y-2">
              <div className="flex items-center space-x-1.5 border-b border-amber-200 pb-1">
                <span className="h-3 w-1 bg-amber-600 rounded-full inline-block"></span>
                <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                  CLIENT AGREEMENT DETAILS (AUTO-FETCHED)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] font-semibold">Name</span>
                  <span className="font-bold text-slate-900">{formData.client_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-semibold">PAN Number</span>
                  <span className="font-mono font-bold text-amber-700">{formData.client_pan || 'BTWPC6838E'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-semibold">Phone</span>
                  <span className="font-mono font-bold text-slate-900">{formData.client_phone || '+91 98138 72093'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-semibold">Email</span>
                  <span className="font-medium text-slate-800">{formData.client_email || 'khan****@gmail.com'}</span>
                </div>
                <div className="sm:col-span-2 lg:col-span-4">
                  <span className="text-slate-500 block text-[10px] font-semibold">Registered Address</span>
                  <span className="font-medium text-slate-800">{formData.client_address || 'New Delhi, Delhi, India'}</span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Bank / Lending Institution *</label>
              <input
                type="text"
                required
                placeholder="e.g. HDFC Bank Ltd."
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded text-slate-900 text-xs focus:outline-none focus:border-amber-600 font-semibold"
              />
            </div>

            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Loan Account Number</label>
              <input
                type="text"
                placeholder="e.g. LN-984029402"
                value={formData.loan_account_no}
                onChange={(e) => setFormData({ ...formData, loan_account_no: e.target.value })}
                className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded text-slate-900 text-xs focus:outline-none focus:border-amber-600 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Bank Claimed Demand Amount (₹) *</label>
              <input
                type="number"
                required
                value={formData.demand_amount}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setFormData({
                    ...formData,
                    demand_amount: val,
                    settlement_offer_amount: Math.round(val * 0.45)
                  });
                }}
                className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded text-slate-900 text-xs font-mono font-bold focus:outline-none focus:border-amber-600 text-rose-600"
              />
            </div>

            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Proposed OTS Settlement Amount (₹) *</label>
              <input
                type="number"
                required
                value={formData.settlement_offer_amount}
                onChange={(e) => setFormData({ ...formData, settlement_offer_amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded text-slate-900 text-xs font-mono font-bold focus:outline-none focus:border-amber-600 text-emerald-700"
              />
            </div>

            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Notice Date *</label>
              <input
                type="date"
                required
                value={formData.notice_date}
                onChange={(e) => setFormData({ ...formData, notice_date: e.target.value })}
                className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded text-slate-900 text-xs focus:outline-none focus:border-amber-600 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Reply Due Date (Deadline)</label>
              <input
                type="date"
                value={formData.reply_due_date}
                onChange={(e) => setFormData({ ...formData, reply_due_date: e.target.value })}
                className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded text-slate-900 text-xs focus:outline-none focus:border-amber-600 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-600 block mb-1 font-semibold">Remarks & Defense Notes</label>
            <textarea
              rows={3}
              placeholder="Enter remarks, bank lawyer contacts, legal counter-grounds..."
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full p-2.5 bg-white border border-gray-300 rounded text-slate-900 text-xs focus:outline-none focus:border-amber-600"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded border border-gray-300 text-slate-700 font-semibold hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm cursor-pointer"
            >
              Save Demand Record
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT DEMAND NOTICE MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Demand Notice — ${editingNotice?.demand_number || ''}`}
        subtitle="Update claim figures, reply deadline or case settlement status"
        maxWidth="2xl"
      >
        <form onSubmit={handleUpdateDemandNotice} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Client Name</label>
              <input
                type="text"
                disabled
                value={formData.client_name}
                className="w-full px-2.5 py-2 bg-gray-100 border border-gray-300 rounded text-slate-900 text-xs font-bold"
              />
            </div>

            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Demand Category *</label>
              <select
                value={formData.demand_type}
                onChange={(e) => setFormData({ ...formData, demand_type: e.target.value })}
                className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded text-slate-900 text-xs focus:outline-none focus:border-amber-600 font-semibold"
              >
                <option value="Incoming Loan Recall Demand">Incoming Loan Recall Demand</option>
                <option value="Incoming Section 138 Statutory Demand">Incoming Section 138 Statutory Demand</option>
                <option value="Incoming Pre-Litigation Legal Demand">Incoming Pre-Litigation Legal Demand</option>
                <option value="Outgoing OTS Settlement Demand">Outgoing OTS Settlement Demand</option>
                <option value="Loan Acceleration Demand">Loan Acceleration Demand</option>
              </select>
            </div>

            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Bank / Lending Institution *</label>
              <input
                type="text"
                required
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded text-slate-900 text-xs focus:outline-none focus:border-amber-600 font-semibold"
              />
            </div>

            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Loan Account Number</label>
              <input
                type="text"
                value={formData.loan_account_no}
                onChange={(e) => setFormData({ ...formData, loan_account_no: e.target.value })}
                className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded text-slate-900 text-xs focus:outline-none focus:border-amber-600 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Bank Claimed Demand Amount (₹) *</label>
              <input
                type="number"
                required
                value={formData.demand_amount}
                onChange={(e) => setFormData({ ...formData, demand_amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded text-slate-900 text-xs font-mono font-bold focus:outline-none focus:border-amber-600 text-rose-600"
              />
            </div>

            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Proposed OTS Settlement Amount (₹) *</label>
              <input
                type="number"
                required
                value={formData.settlement_offer_amount}
                onChange={(e) => setFormData({ ...formData, settlement_offer_amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded text-slate-900 text-xs font-mono font-bold focus:outline-none focus:border-amber-600 text-emerald-700"
              />
            </div>

            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Reply Due Date (Deadline)</label>
              <input
                type="date"
                value={formData.reply_due_date}
                onChange={(e) => setFormData({ ...formData, reply_due_date: e.target.value })}
                className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded text-slate-900 text-xs focus:outline-none focus:border-amber-600 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded text-slate-900 text-xs font-bold focus:outline-none focus:border-amber-600 text-indigo-700"
              >
                <option value="Pending Review">Pending Review</option>
                <option value="OTS In Negotiation">OTS In Negotiation</option>
                <option value="Reply Dispatched">Reply Dispatched</option>
                <option value="Settlement Agreed">Settlement Agreed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-slate-600 block mb-1 font-semibold">Remarks & Counter Defense Notes</label>
            <textarea
              rows={3}
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full p-2.5 bg-white border border-gray-300 rounded text-slate-900 text-xs focus:outline-none focus:border-amber-600"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded border border-gray-300 text-slate-700 font-semibold hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm cursor-pointer"
            >
              Update Record
            </button>
          </div>
        </form>
      </Modal>

      {/* QUICK VIEW DETAILS MODAL */}
      <Modal
        isOpen={!!selectedNoticeForDetailModal}
        onClose={() => setSelectedNoticeForDetailModal(null)}
        title={`Demand Assessment — ${selectedNoticeForDetailModal?.demand_number || ''}`}
        subtitle="Bank Claim vs OTS Settlement Assessment"
        maxWidth="lg"
      >
        {selectedNoticeForDetailModal && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Client Name</span>
                <span className="font-bold text-slate-900 text-sm">{selectedNoticeForDetailModal.client_name}</span>
                <span className="text-slate-500 block font-mono text-[10px]">{selectedNoticeForDetailModal.client_number}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Bank / Lender</span>
                <span className="font-bold text-slate-900 text-sm">{selectedNoticeForDetailModal.bank_name}</span>
                {selectedNoticeForDetailModal.loan_account_no && (
                  <span className="text-slate-500 block font-mono text-[10px]">A/C: {selectedNoticeForDetailModal.loan_account_no}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                <span className="text-[10px] text-rose-600 font-bold uppercase block">Bank Demanded Amount</span>
                <span className="text-lg font-bold text-rose-700 font-mono">
                  ₹{parseFloat(selectedNoticeForDetailModal.demand_amount || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <span className="text-[10px] text-emerald-700 font-bold uppercase block">OTS Settlement Target</span>
                <span className="text-lg font-bold text-emerald-800 font-mono">
                  ₹{parseFloat(selectedNoticeForDetailModal.settlement_offer_amount || 0).toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-emerald-600 block mt-0.5">
                  Savings: ₹{(parseFloat(selectedNoticeForDetailModal.demand_amount || 0) - parseFloat(selectedNoticeForDetailModal.settlement_offer_amount || 0)).toLocaleString('en-IN')} (55% Waiver)
                </span>
              </div>
            </div>

            <div className="p-3 bg-white border border-gray-200 rounded-lg space-y-2">
              <div className="flex justify-between border-b border-gray-100 pb-1.5">
                <span className="text-slate-500">Notice Category:</span>
                <span className="font-bold text-slate-900">{selectedNoticeForDetailModal.demand_type}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-1.5">
                <span className="text-slate-500">Notice Received Date:</span>
                <span className="font-mono text-slate-800">{selectedNoticeForDetailModal.notice_date}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-1.5">
                <span className="text-slate-500">Reply Due Date:</span>
                <span className="font-mono font-bold text-rose-600">{selectedNoticeForDetailModal.reply_due_date || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Status:</span>
                <span className="font-bold text-indigo-700">{selectedNoticeForDetailModal.status}</span>
              </div>
            </div>

            {selectedNoticeForDetailModal.remarks && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Remarks / Legal Notes</span>
                <p className="text-slate-800 leading-relaxed">{selectedNoticeForDetailModal.remarks}</p>
              </div>
            )}

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  const docData = selectedNoticeForDetailModal;
                  setSelectedNoticeForDetailModal(null);
                  setSelectedNoticeForDocView(docData);
                  setViewMode('document_view');
                }}
                className="w-full py-2 bg-[#15803d] hover:bg-emerald-800 text-white font-bold rounded-lg flex items-center justify-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <FileText className="h-4 w-4" />
                <span>Open Full-Screen Reply Document</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
