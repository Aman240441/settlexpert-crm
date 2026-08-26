import React, { useState, useEffect } from 'react';
import { WalletCards, Plus, Edit2, Power, DollarSign, CheckCircle2, Clock } from 'lucide-react';
import { api } from '../../services/api';
import { FeePlan } from '../../types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';

export const FeePlansView: React.FC = () => {
  const [plans, setPlans] = useState<FeePlan[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<FeePlan | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    duration: '1 Month',
    default_fee: 15000,
    status: 'active',
  });

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const durations = ['1 Month', '2 Months', '4 Months', '6 Months', '12 Months', 'Lifetime', 'Custom'];

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.getFeePlans();
      setPlans(res.plans);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to fetch fee plans' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      duration: '1 Month',
      default_fee: 25000,
      status: 'active',
    });
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createFeePlan(formData);
      setFeedbackMsg({ type: 'success', text: `Fee Plan ${formData.name} created successfully!` });
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to create fee plan' });
    }
  };

  const handleOpenEdit = (p: FeePlan) => {
    setSelectedPlan(p);
    setFormData({
      name: p.name,
      duration: p.duration,
      default_fee: p.default_fee,
      status: p.status,
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    try {
      await api.updateFeePlan(selectedPlan.id, formData);
      setFeedbackMsg({ type: 'success', text: `Fee Plan ${formData.name} updated successfully!` });
      setIsEditOpen(false);
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to update fee plan' });
    }
  };

  const handleToggleStatus = async (p: FeePlan) => {
    try {
      const res = await api.toggleFeePlanStatus(p.id);
      setFeedbackMsg({ type: 'success', text: `Fee plan status changed to ${res.status}` });
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to toggle status' });
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
            <WalletCards className="h-5 w-5 text-emerald-600" />
            <span>Fee Plans Configuration</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin defined subscription durations (1M, 2M, 4M, 6M, 12M, Lifetime, Custom) and standard settlement fee structures.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Create Fee Plan</span>
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs space-y-4 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-black border border-emerald-100">
                  {plan.duration}
                </span>
                <div className="flex items-center space-x-1">
                  <Badge status={plan.status} />
                  <button
                    onClick={() => handleOpenEdit(plan)}
                    className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">{plan.name}</h3>
                <div className="mt-2 flex items-baseline space-x-1">
                  <span className="text-2xl font-black text-slate-900">{formatCurrency(plan.default_fee)}</span>
                  <span className="text-xs text-slate-400 font-medium">/ default</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Agreements: <strong className="text-slate-900">{plan.agreements_count || 0}</strong></span>
              <button
                onClick={() => handleToggleStatus(plan)}
                title={plan.status === 'active' ? 'Deactivate' : 'Activate'}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  plan.status === 'active'
                    ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                    : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                }`}
              >
                <Power className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Fee Plan"
        subtitle="Configure duration package and standard pricing."
        maxWidth="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Plan Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. 3 Months Accelerated Resolution"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Duration *</label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            >
              {durations.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Default Fee (₹) *</label>
            <input
              type="number"
              required
              min={0}
              value={formData.default_fee}
              onChange={(e) => setFormData({ ...formData, default_fee: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
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
              Save Fee Plan
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Fee Plan"
        subtitle={`Updating: ${selectedPlan?.name}`}
        maxWidth="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Plan Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Duration</label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            >
              {durations.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Default Fee (₹)</label>
            <input
              type="number"
              required
              min={0}
              value={formData.default_fee}
              onChange={(e) => setFormData({ ...formData, default_fee: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
