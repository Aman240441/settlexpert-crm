import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Scale, UserCheck, WalletCards, Eye, ArrowLeft, FileSignature, Edit2, Building2 } from 'lucide-react';
import { api } from '../../services/api';
import { Client, FeePlan, User, Advocate } from '../../types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { ClientDetailsUnifiedView } from './ClientDetailsUnifiedView';

export const ClientsView: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [feePlans, setFeePlans] = useState<FeePlan[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [advocates, setAdvocates] = useState<Advocate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Mode: 'list' | 'view_details'
  const [viewMode, setViewMode] = useState<'list' | 'view_details'>('list');
  const [selectedClientDetails, setSelectedClientDetails] = useState<any>(null);
  const [selectedClientMonthlyPayments, setSelectedClientMonthlyPayments] = useState<any>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    total_debt: 750000,
    settlement_target: 350000,
    fee_plan_id: '',
    manager_id: '',
    advocate_id: '',
    status: 'active',
  });

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cliRes, planRes, mgrRes, advRes] = await Promise.all([
        api.getClients(),
        api.getFeePlans(),
        api.getManagers(),
        api.getAdvocates(),
      ]);
      setClients(cliRes.clients);
      setFeePlans(planRes.plans);
      setManagers(mgrRes.managers);
      setAdvocates(advRes.advocates);
      if (planRes.plans.length > 0 && !formData.fee_plan_id) {
        setFormData((prev) => ({ ...prev, fee_plan_id: planRes.plans[0].id }));
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: 'Failed to load client accounts' });
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
      await api.createClient(formData);
      setFeedbackMsg({ type: 'success', text: `Client ${formData.name} onboarded successfully!` });
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to create client' });
    }
  };

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amt || 0);
  };

  const handleOpenClientDetails = async (client: any) => {
    try {
      setLoading(true);
      const [detailed, monthlyRes] = await Promise.all([
        api.getCRMClient(client.id),
        api.getCRMClientMonthlyPayments(client.id).catch(() => null)
      ]);
      setSelectedClientDetails(detailed);
      setSelectedClientMonthlyPayments(monthlyRes);
      setViewMode('view_details');
    } catch (err) {
      setSelectedClientDetails({ client });
      setSelectedClientMonthlyPayments(null);
      setViewMode('view_details');
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.client_number && c.client_number.toLowerCase().includes(search.toLowerCase()))
  );

  // Render Full Client Details & Onboarding Form View
  if (viewMode === 'view_details' && selectedClientDetails) {
    const clientData = selectedClientDetails.client || selectedClientDetails;
    return (
      <ClientDetailsUnifiedView
        client={clientData}
        lenders={selectedClientDetails.lenders || []}
        agreements={selectedClientDetails.agreements || []}
        payments={selectedClientDetails.payments || []}
        monthlyPaymentData={selectedClientMonthlyPayments}
        userRole="admin"
        initialTab="onboarding-form"
        onBack={() => {
          setViewMode('list');
          setSelectedClientDetails(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-16 animate-fade-in">
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs font-semibold ${feedbackMsg.type === 'success'
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
            <Users className="h-5 w-5 text-emerald-600" />
            <span>CRM — Retained Clients</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Active debt settlement portfolios, assigned advocates, and resolution target matrices.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Client</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search clients by name, client number, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Client Number / Date</th>
                <th className="py-3.5 px-4">Client Name</th>
                <th className="py-3.5 px-4">Total Debt / Target</th>
                <th className="py-3.5 px-4">Fee Plan</th>
                <th className="py-3.5 px-4">Assigned Advocate</th>
                <th className="py-3.5 px-4">Manager</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                    Loading clients...
                  </td>
                </tr>
              ) : filteredClients.length > 0 ? (
                filteredClients.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleOpenClientDetails(c)}
                        className="text-left group cursor-pointer"
                        title="View Full Client Details & Onboarding Form"
                      >
                        <span className="font-mono font-bold text-blue-700 block group-hover:underline">
                          {c.client_number}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleOpenClientDetails(c)}
                        className="text-left font-bold text-slate-900 hover:text-blue-700 transition-colors cursor-pointer block"
                        title="View Full Client Details & Onboarding Form"
                      >
                        {c.name}
                      </button>
                      <p className="text-[11px] text-slate-500 font-mono">{c.phone}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{formatCurrency(c.total_debt)}</span>
                      <span className="text-[11px] text-emerald-600 font-semibold">Target: {formatCurrency(c.settlement_target)}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
                        {c.fee_plan_name || 'Standard'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <span className="inline-flex items-center space-x-1.5">
                        <Scale className="h-3.5 w-3.5 text-purple-600" />
                        <span>{c.advocate_name || 'Unassigned'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="inline-flex items-center space-x-1">
                        <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                        <span>{c.manager_name || 'Unassigned'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={c.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenClientDetails(c)}
                        title="View Full Client Details"
                        className="h-7 w-7 rounded border border-cyan-400 bg-white hover:bg-cyan-50 text-cyan-500 transition-colors inline-flex items-center justify-center shadow-xs cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        title="Edit Client"
                        className="h-7 w-7 rounded border border-amber-400 bg-white hover:bg-amber-50 text-amber-500 transition-colors inline-flex items-center justify-center shadow-xs cursor-pointer"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        title="Add Lender"
                        className="h-7 w-7 rounded border border-indigo-400 bg-white hover:bg-indigo-50 text-indigo-500 transition-colors inline-flex items-center justify-center shadow-xs cursor-pointer"
                      >
                        <Building2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                    No clients found matching criteria.
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
        title="Onboard Client Case"
        subtitle="Register signed client, resolution target, and assign legal counsel."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Vikramaditya Rao"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 9876543210"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Total Debt Amount (₹) *</label>
              <input
                type="number"
                required
                value={formData.total_debt}
                onChange={(e) => setFormData({ ...formData, total_debt: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Settlement Target (₹) *</label>
              <input
                type="number"
                required
                value={formData.settlement_target}
                onChange={(e) => setFormData({ ...formData, settlement_target: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Fee Plan</label>
              <select
                value={formData.fee_plan_id}
                onChange={(e) => setFormData({ ...formData, fee_plan_id: e.target.value })}
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
              <label className="text-xs font-semibold text-slate-300 block mb-1">Assign Advocate</label>
              <select
                value={formData.advocate_id}
                onChange={(e) => setFormData({ ...formData, advocate_id: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Select Advocate</option>
                {advocates.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.specialization})
                  </option>
                ))}
              </select>
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
              Onboard Client
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
