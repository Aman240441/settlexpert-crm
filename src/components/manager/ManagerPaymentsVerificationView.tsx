import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  ShieldCheck,
  AlertCircle,
  FileText,
  DollarSign
} from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../common/Badge';

export const ManagerPaymentsVerificationView: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await api.getPaymentVerificationQueue();
      setPayments(res.payments || []);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: 'Failed to load payment verification queue' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleVerifyOrReject = async (paymentId: string, status: 'verified' | 'rejected') => {
    try {
      setProcessingId(paymentId);
      const res = await api.verifyManagerPayment(paymentId, status);
      setFeedbackMsg({ type: 'success', text: res.message || `Payment ${status} successfully` });
      fetchQueue();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || `Failed to update payment status` });
    } finally {
      setProcessingId(null);
    }
  };

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amt || 0);
  };

  const filtered = payments.filter((p) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      p.receipt_number?.toLowerCase().includes(s) ||
      p.client_name?.toLowerCase().includes(s) ||
      p.client_number?.toLowerCase().includes(s) ||
      p.transaction_id?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-4 font-sans text-slate-800 pb-12 animate-fade-in">
      {/* Toast Alert */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded-lg flex items-center justify-between text-xs font-semibold ${
            feedbackMsg.type === 'success'
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
            <span className="text-[#1e40af] font-bold">Finance Control</span>
            <span>/</span>
            <span className="text-slate-800 font-bold">Payment Verification Queue</span>
          </div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-[#15803d]" />
            <span>Finance Payment Verification & Ledger Audit</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit consultant fee submissions against bank statements before adding to verified received balance.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800 shadow-2xs">
            {payments.length} Pending Approvals
          </span>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Receipt #, Client Name, Client ID, Transaction ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#15803d]"
          />
        </div>
      </div>

      {/* Verification Queue Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Mode / Trans ID</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Submitted By</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Audit Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading payment queue...
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#1e40af]">{p.receipt_number}</td>
                    <td className="py-3 px-4">
                      <strong className="text-slate-900 block">{p.client_name}</strong>
                      <span className="text-[10px] font-mono text-slate-500">{p.client_number}</span>
                    </td>
                    <td className="py-3 px-4 font-black text-emerald-700 text-sm">{formatCurrency(p.amount)}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 block capitalize">{p.payment_mode}</span>
                      <span className="text-[10px] font-mono text-slate-500">{p.transaction_id || 'Cash/Cheque'}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">{p.payment_date}</td>
                    <td className="py-3 px-4 text-slate-600">{p.created_by || 'Staff Consultant'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                        Pending Audit
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        disabled={processingId === p.id}
                        onClick={() => handleVerifyOrReject(p.id, 'verified')}
                        className="px-3 py-1.5 rounded-lg bg-[#15803d] hover:bg-emerald-800 text-white font-bold text-[11px] inline-flex items-center space-x-1 transition-all shadow-xs disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Verify</span>
                      </button>
                      <button
                        disabled={processingId === p.id}
                        onClick={() => handleVerifyOrReject(p.id, 'rejected')}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] inline-flex items-center space-x-1 transition-all shadow-xs disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Reject</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500 mb-1" />
                    <p className="font-bold text-slate-700">Verification Queue is Clear</p>
                    <p className="text-xs text-slate-500">All submitted payment receipts have been audited.</p>
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
