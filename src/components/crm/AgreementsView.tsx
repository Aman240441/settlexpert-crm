import React, { useState, useEffect } from 'react';
import { FileSignature, Plus, Search, FileCheck, CheckCircle2, Clock } from 'lucide-react';
import { api } from '../../services/api';
import { Agreement, Client, FeePlan } from '../../types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';

export const AgreementsView: React.FC = () => {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [feePlans, setFeePlans] = useState<FeePlan[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    client_id: '',
    fee_plan_id: '',
    total_fee: 45000,
    status: 'active',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
  });

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [agrRes, cliRes, planRes] = await Promise.all([
        api.getAgreements(),
        api.getClients(),
        api.getFeePlans(),
      ]);
      setAgreements(agrRes.agreements);
      setClients(cliRes.clients);
      setFeePlans(planRes.plans);
      if (cliRes.clients.length > 0 && !formData.client_id) {
        setFormData((prev) => ({ ...prev, client_id: cliRes.clients[0].id }));
      }
      if (planRes.plans.length > 0 && !formData.fee_plan_id) {
        setFormData((prev) => ({ ...prev, fee_plan_id: planRes.plans[0].id }));
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: 'Failed to load agreements' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAgreement(formData);
      setFeedbackMsg({ type: 'success', text: 'Agreement generated and recorded successfully!' });
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to create agreement' });
    }
  };

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amt || 0);
  };

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
            <FileSignature className="h-5 w-5 text-rose-600" />
            <span>Agreements & Retainer Contracts</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Binding settlement engagement contracts, fee terms, and protection tenures.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Agreement</span>
        </button>
      </div>

      {/* Agreements Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Agreement Ref</th>
                <th className="py-3.5 px-4">Client Name</th>
                <th className="py-3.5 px-4">Fee Plan Package</th>
                <th className="py-3.5 px-4">Total Contract Fee</th>
                <th className="py-3.5 px-4">Effective Period</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    Loading agreements...
                  </td>
                </tr>
              ) : agreements.length > 0 ? (
                agreements.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-900 block">{a.agreement_number}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(a.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{a.client_name}</span>
                      <span className="text-[11px] font-mono text-slate-400 font-bold">{a.client_number}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
                        {a.fee_plan_name || 'Custom Plan'} ({a.fee_plan_duration || 'Custom'})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-rose-600 text-sm">
                      {formatCurrency(a.total_fee)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {a.start_date || 'Immediate'} → {a.end_date || 'Expiry by tenure'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={a.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    No agreements on file. Click "New Agreement" to draft one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Generate Agreement Contract"
        subtitle="Authorize a settlement agreement and establish fee schedule."
        maxWidth="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
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
            <label className="text-xs font-semibold text-slate-300 block mb-1">Select Fee Plan *</label>
            <select
              required
              value={formData.fee_plan_id}
              onChange={(e) => {
                const plan = feePlans.find((p) => p.id === e.target.value);
                setFormData({
                  ...formData,
                  fee_plan_id: e.target.value,
                  total_fee: plan ? plan.default_fee : formData.total_fee,
                });
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            >
              {feePlans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.duration} • ₹{p.default_fee.toLocaleString('en-IN')})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Agreed Total Fee (₹) *</label>
            <input
              type="number"
              required
              min={1}
              value={formData.total_fee}
              onChange={(e) => setFormData({ ...formData, total_fee: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Start Date</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">End Date</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30"
            >
              Issue Agreement
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
