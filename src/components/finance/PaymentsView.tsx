import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, Clock, Plus, Search, DollarSign, Filter, FileText } from 'lucide-react';
import { api } from '../../services/api';
import { Payment, Client } from '../../types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';

interface PaymentsViewProps {
  initialTab?: 'all' | 'verification' | 'collections' | 'client-fees';
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({ initialTab = 'all' }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'verification' | 'collections' | 'client-fees'>(initialTab);

  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [formData, setFormData] = useState({
    client_id: '',
    amount: 15000,
    payment_method: 'UPI / Bank Transfer',
    transaction_id: '',
    status: 'pending_verification',
    payment_date: new Date().toISOString().split('T')[0],
  });

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [payRes, cliRes] = await Promise.all([api.getPayments(), api.getClients()]);
      setPayments(payRes.payments);
      setClients(cliRes.clients);
      if (cliRes.clients.length > 0 && !formData.client_id) {
        setFormData((prev) => ({ ...prev, client_id: cliRes.clients[0].id }));
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: 'Failed to load payments data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    fetchData();
  }, []);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createPayment(formData);
      setFeedbackMsg({ type: 'success', text: 'Payment recorded and submitted for verification!' });
      setIsRecordOpen(false);
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to record payment' });
    }
  };

  const handleVerify = async (paymentId: string) => {
    try {
      await api.verifyPayment(paymentId, 'verified');
      setFeedbackMsg({ type: 'success', text: 'Payment successfully verified & reconciled!' });
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: 'Failed to verify payment' });
    }
  };

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amt || 0);
  };

  const filteredPayments = payments.filter((p) => {
    if (activeTab === 'verification') return p.status === 'pending_verification';
    if (activeTab === 'collections') return p.status === 'verified';
    return true;
  });

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-16 animate-fade-in">
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs font-semibold ${
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-emerald-600" />
            <span>Finance & Payment Verification Desk</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit client receipts, authenticate transaction IDs, and verify settlement billing records.
          </p>
        </div>
        <button
          onClick={() => setIsRecordOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Record Receipt</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Payments ({payments.length})
        </button>
        <button
          onClick={() => setActiveTab('verification')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center space-x-2 cursor-pointer ${
            activeTab === 'verification' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Pending Verification</span>
          <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
            {payments.filter((p) => p.status === 'pending_verification').length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('collections')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'collections' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Verified Collections ({payments.filter((p) => p.status === 'verified').length})
        </button>
      </div>

      {/* Payments Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Receipt / Date</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4">Transaction Ref</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    Loading payments...
                  </td>
                </tr>
              ) : filteredPayments.length > 0 ? (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-900 block">{p.receipt_number}</span>
                      <span className="text-[10px] text-slate-400">{p.payment_date}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{p.client_name}</span>
                      <span className="font-mono text-[10px] text-slate-400 font-bold">{p.client_number}</span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-emerald-600 text-sm">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{p.payment_method}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {p.transaction_id || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={p.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {p.status === 'pending_verification' ? (
                        <button
                          onClick={() => handleVerify(p.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm shadow-emerald-600/30 transition-all inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Verify</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-600 flex items-center justify-end space-x-1 font-bold">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Reconciled</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    No payment records found in this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD RECEIPT MODAL */}
      <Modal
        isOpen={isRecordOpen}
        onClose={() => setIsRecordOpen(false)}
        title="Record Payment Receipt"
        subtitle="Log a client fee deposit for audit and ledger entry."
        maxWidth="md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Select Client *</label>
            <select
              required
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.client_number})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Amount Received (₹) *</label>
            <input
              type="number"
              required
              min={1}
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Payment Method</label>
            <select
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="UPI / QR Code">UPI / QR Code</option>
              <option value="NEFT / RTGS / IMPS">NEFT / RTGS / IMPS</option>
              <option value="Credit / Debit Card">Credit / Debit Card</option>
              <option value="Payment Gateway Link">Payment Gateway Link</option>
              <option value="Cheque / DD">Cheque / DD</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Bank Transaction ID / UTR *</label>
            <input
              type="text"
              required
              value={formData.transaction_id}
              onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
              placeholder="e.g. UPI/503928192831"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Payment Date</label>
            <input
              type="date"
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsRecordOpen(false)}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30"
            >
              Record Receipt
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
