import React, { useState, useEffect } from 'react';
import { Scale, Plus, Search, Edit2, Power, Eye, Phone, Mail, MapPin, FileCheck, Briefcase } from 'lucide-react';
import { api } from '../../services/api';
import { Advocate, Client } from '../../types';
import { Modal } from '../common/Modal';
import { Drawer } from '../common/Drawer';
import { Badge } from '../common/Badge';

export const AdvocatesView: React.FC = () => {
  const [advocates, setAdvocates] = useState<Advocate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedAdvocate, setSelectedAdvocate] = useState<Advocate | null>(null);
  const [assignedClients, setAssignedClients] = useState<Client[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    advocate_id: '',
    mobile: '',
    email: '',
    registration_number: '',
    specialization: '',
    address: '',
    profile_image: '',
    status: 'active',
    notes: '',
  });

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.getAdvocates({
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setAdvocates(res.advocates);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to load advocates' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, statusFilter]);

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      advocate_id: `ADV-${Math.floor(100 + Math.random() * 900)}`,
      mobile: '',
      email: '',
      registration_number: `BAR/${Math.floor(1000 + Math.random() * 9000)}/2024`,
      specialization: 'Banking & Debt Settlement Law',
      address: '',
      profile_image: '',
      status: 'active',
      notes: '',
    });
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAdvocate(formData);
      setFeedbackMsg({ type: 'success', text: `Advocate ${formData.name} onboarded successfully!` });
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to onboard advocate' });
    }
  };

  const handleOpenEdit = (a: Advocate) => {
    setSelectedAdvocate(a);
    setFormData({
      name: a.name,
      advocate_id: a.advocate_id,
      mobile: a.mobile,
      email: a.email,
      registration_number: a.registration_number,
      specialization: a.specialization,
      address: a.address || '',
      profile_image: a.profile_image || '',
      status: a.status,
      notes: a.notes || '',
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdvocate) return;
    try {
      await api.updateAdvocate(selectedAdvocate.id, formData);
      setFeedbackMsg({ type: 'success', text: `Advocate ${formData.name} updated successfully!` });
      setIsEditOpen(false);
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to update advocate' });
    }
  };

  const handleOpenView = async (a: Advocate) => {
    setSelectedAdvocate(a);
    try {
      const details = await api.getAdvocate(a.id);
      setAssignedClients(details.assignedClients || []);
      setIsViewOpen(true);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: 'Failed to load advocate cases' });
    }
  };

  const handleToggleStatus = async (a: Advocate) => {
    try {
      const res = await api.toggleAdvocateStatus(a.id);
      setFeedbackMsg({ type: 'success', text: `Advocate status set to ${res.status}` });
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to toggle status' });
    }
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
            <Scale className="h-5 w-5 text-purple-600" />
            <span>Advocates & Legal Counsels</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage empaneled lawyers, bar registrations, specialization areas, and client case assignments.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Onboard Advocate</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search advocates by name, bar registration, specialization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 px-3 py-2 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Advocates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {advocates.map((adv) => (
          <div
            key={adv.id}
            className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs space-y-4 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-11 w-11 rounded-2xl bg-purple-50 text-purple-700 font-black flex items-center justify-center text-base border border-purple-100 shadow-2xs">
                    {adv.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">{adv.name}</h3>
                    <span className="text-[10px] font-mono text-purple-700 bg-purple-50 border border-purple-100 px-1.5 py-0.2 rounded font-bold">
                      {adv.advocate_id}
                    </span>
                  </div>
                </div>
                <Badge status={adv.status} />
              </div>

              <div className="space-y-1 text-xs">
                <p className="text-slate-800 font-semibold flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <span>{adv.specialization}</span>
                </p>
                <p className="text-slate-500 flex items-center gap-1.5">
                  <FileCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span className="font-mono text-[11px] font-semibold">{adv.registration_number}</span>
                </p>
                <p className="text-slate-500 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{adv.mobile}</span>
                </p>
                <p className="text-slate-500 flex items-center gap-1.5 truncate">
                  <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{adv.email}</span>
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Assigned Cases: <strong className="text-slate-900">{adv.assigned_clients_count || 0}</strong>
              </span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleOpenView(adv)}
                  title="View Cases"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleOpenEdit(adv)}
                  title="Edit Advocate"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleToggleStatus(adv)}
                  title={adv.status === 'active' ? 'Deactivate' : 'Activate'}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    adv.status === 'active'
                      ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                      : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  <Power className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Onboard New Advocate"
        subtitle="Register legal counsel details and bar registration credentials."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Advocate / Firm Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Adv. John Doe & Associates"
                className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Advocate ID *</label>
              <input
                type="text"
                required
                value={formData.advocate_id}
                onChange={(e) => setFormData({ ...formData, advocate_id: e.target.value })}
                placeholder="ADV-001"
                className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d] uppercase font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Bar Registration Number *</label>
              <input
                type="text"
                required
                value={formData.registration_number}
                onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                placeholder="D/1423/2018"
                className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d] uppercase font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Specialization *</label>
              <input
                type="text"
                required
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                placeholder="e.g. SARFAESI, DRT & IBC Appeals"
                className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Mobile Contact *</label>
              <input
                type="text"
                required
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="+91 9876543210"
                className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="counsel@lawchamber.in"
                className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Office Chambers Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Chamber No., High Court / City"
              className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d]"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-gray-100 border border-gray-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#15803d] hover:bg-[#166534] text-white text-xs font-bold shadow-md cursor-pointer"
            >
              Onboard Advocate
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Advocate"
        subtitle={`Updating: ${selectedAdvocate?.name}`}
        maxWidth="2xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Bar Registration</label>
              <input
                type="text"
                required
                value={formData.registration_number}
                onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d] uppercase font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Specialization</label>
              <input
                type="text"
                required
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Mobile</label>
              <input
                type="text"
                required
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-gray-100 border border-gray-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#15803d] hover:bg-[#166534] text-white text-xs font-bold shadow-md cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW CASES DRAWER */}
      <Drawer
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title={selectedAdvocate?.name || 'Advocate Profile'}
        subtitle={`ID: ${selectedAdvocate?.advocate_id} • Bar: ${selectedAdvocate?.registration_number}`}
        width="lg"
      >
        {selectedAdvocate && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <p className="text-slate-300 font-semibold">{selectedAdvocate.specialization}</p>
              <p className="text-slate-400">{selectedAdvocate.address || 'No office address recorded'}</p>
              <p className="text-slate-400">{selectedAdvocate.mobile} • {selectedAdvocate.email}</p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Assigned Client Cases ({assignedClients.length})
              </h4>
              <div className="space-y-2">
                {assignedClients.length > 0 ? (
                  assignedClients.map((c) => (
                    <div key={c.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                      <div className="flex justify-between items-center">
                        <p className="font-bold text-white">{c.name}</p>
                        <span className="font-mono text-slate-400 text-[10px]">{c.client_number}</span>
                      </div>
                      <p className="text-slate-400 mt-1">Debt: ₹{c.total_debt.toLocaleString('en-IN')}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 py-3">No cases currently assigned to this advocate.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
