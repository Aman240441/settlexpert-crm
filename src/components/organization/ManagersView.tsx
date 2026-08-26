import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Search,
  Filter,
  MoreVertical,
  KeyRound,
  Shield,
  Eye,
  Edit2,
  Power,
  Users,
  Building2,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  FileCheck,
  CheckCircle2,
  XCircle,
  Upload,
  Lock
} from 'lucide-react';
import { api } from '../../services/api';
import { User, Department, ManagerType, PermissionRow } from '../../types';
import { Modal } from '../common/Modal';
import { Drawer } from '../common/Drawer';
import { Badge } from '../common/Badge';
import { CreateStaffModal } from '../staff/CreateStaffModal';

export const ManagersView: React.FC = () => {
  const [managers, setManagers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managerTypes, setManagerTypes] = useState<ManagerType[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals & Drawers
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isResetPassOpen, setIsResetPassOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState<User | null>(null);
  const [selectedManagerPerms, setSelectedManagerPerms] = useState<PermissionRow[]>([]);
  const [selectedManagerEmps, setSelectedManagerEmps] = useState<User[]>([]);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    emp_or_mgr_id: '',
    password: '',
    joining_date: new Date().toISOString().split('T')[0],
    manager_type_id: '',
    department_id: '',
    status: 'active',
    profile_image: '',
    id_type: 'Aadhaar Card',
    id_front: '',
    id_back: '',
  });

  const [resetPassVal, setResetPassVal] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mgrRes, deptRes, typeRes] = await Promise.all([
        api.getManagers({
          search: search || undefined,
          department: selectedDept || undefined,
          type: selectedType || undefined,
          status: selectedStatus || undefined,
        }),
        api.getDepartments(),
        api.getManagerTypes(),
      ]);
      setManagers(mgrRes.managers);
      setDepartments(deptRes.departments);
      setManagerTypes(typeRes.types);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to load managers' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, selectedDept, selectedType, selectedStatus]);

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      emp_or_mgr_id: `MGR-${Math.floor(1000 + Math.random() * 9000)}`,
      password: 'Manager@123456',
      joining_date: new Date().toISOString().split('T')[0],
      manager_type_id: managerTypes[0]?.id || '',
      department_id: departments[0]?.id || '',
      status: 'active',
      profile_image: '',
      id_type: 'Aadhaar Card',
      id_front: 'front_doc_verified.pdf',
      id_back: 'back_doc_verified.pdf',
    });
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createManager(formData);
      setFeedbackMsg({ type: 'success', text: `Manager ${formData.name} created successfully!` });
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to create manager' });
    }
  };

  const handleOpenEdit = (mgr: User) => {
    setSelectedManager(mgr);
    setFormData({
      name: mgr.name,
      email: mgr.email,
      phone: mgr.phone || '',
      emp_or_mgr_id: mgr.emp_or_mgr_id || '',
      password: '',
      joining_date: mgr.joining_date || '',
      manager_type_id: mgr.manager_type_id || '',
      department_id: mgr.department_id || '',
      status: mgr.status,
      profile_image: mgr.profile_image || '',
      id_type: mgr.id_type || 'Aadhaar Card',
      id_front: mgr.id_front || '',
      id_back: mgr.id_back || '',
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedManager) return;
    try {
      await api.updateManager(selectedManager.id, formData);
      setFeedbackMsg({ type: 'success', text: `Manager ${formData.name} updated successfully!` });
      setIsEditOpen(false);
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to update manager' });
    }
  };

  const handleOpenView = async (mgr: User) => {
    try {
      setSelectedManager(mgr);
      const details = await api.getManager(mgr.id);
      setSelectedManagerEmps(details.assignedEmployees || []);
      const permsRes = await api.getUserPermissions(mgr.id);
      setSelectedManagerPerms(permsRes.matrix || []);
      setIsViewOpen(true);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: 'Failed to load manager details' });
    }
  };

  const handleToggleStatus = async (mgr: User) => {
    try {
      const res = await api.toggleManagerStatus(mgr.id);
      setFeedbackMsg({ type: 'success', text: `Manager status changed to ${res.status}` });
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to toggle status' });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedManager) return;
    try {
      await api.resetManagerPassword(selectedManager.id, resetPassVal);
      setFeedbackMsg({ type: 'success', text: `Password reset successfully for ${selectedManager.name}` });
      setIsResetPassOpen(false);
      setResetPassVal('');
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to reset password' });
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-16 animate-fade-in">
      {/* Toast Alert */}
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

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-blue-600" />
            <span>Managers Directory</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Create and govern departmental managers, login credentials, assigned permissions, and teams.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Create Manager</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 px-3 py-2 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.code})
            </option>
          ))}
        </select>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 px-3 py-2 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Manager Types</option>
          {managerTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 px-3 py-2 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Managers Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Manager Profile</th>
                <th className="py-3.5 px-4">Manager Type</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Direct Team</th>
                <th className="py-3.5 px-4">Joining Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    Loading managers...
                  </td>
                </tr>
              ) : managers.length > 0 ? (
                managers.map((mgr) => (
                  <tr key={mgr.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm border border-blue-200 shrink-0">
                          {mgr.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 tracking-tight">{mgr.name}</p>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                            <span className="font-mono text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.2 rounded text-[10px] font-bold">
                              {mgr.emp_or_mgr_id}
                            </span>
                            <span>•</span>
                            <span className="truncate max-w-[140px]">{mgr.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {mgr.manager_type_name || 'General'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {mgr.department_name || 'Unassigned'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center space-x-1.5 text-slate-700">
                        <Users className="h-3.5 w-3.5 text-indigo-600" />
                        <span className="font-bold">{mgr.employee_count || 0}</span>
                        <span className="text-slate-400 text-[10px]">Employees</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{mgr.joining_date || 'N/A'}</td>
                    <td className="py-3.5 px-4">
                      <Badge status={mgr.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => handleOpenView(mgr)}
                          title="View Profile & Matrix"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(mgr)}
                          title="Edit Manager"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedManager(mgr);
                            setResetPassVal('Manager@123456');
                            setIsResetPassOpen(true);
                          }}
                          title="Reset Password"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                        >
                          <KeyRound className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(mgr)}
                          title={mgr.status === 'active' ? 'Deactivate' : 'Activate'}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            mgr.status === 'active'
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    No managers found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MANAGER MODAL (UNIFIED KYC & PROFILE) */}
      <CreateStaffModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          setFeedbackMsg({ type: 'success', text: 'Manager profile created successfully with complete KYC verification!' });
          fetchData();
        }}
        defaultStaffType="Manager"
      />

      {/* EDIT MANAGER MODAL */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Manager"
        subtitle={`Updating manager: ${selectedManager?.name}`}
        maxWidth="2xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Manager ID</label>
              <input
                type="text"
                required
                value={formData.emp_or_mgr_id}
                onChange={(e) => setFormData({ ...formData, emp_or_mgr_id: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d] uppercase font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Manager Type</label>
              <select
                value={formData.manager_type_id}
                onChange={(e) => setFormData({ ...formData, manager_type_id: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d]"
              >
                {managerTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Department</label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d]"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d]"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
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

      {/* RESET PASSWORD MODAL */}
      <Modal
        isOpen={isResetPassOpen}
        onClose={() => setIsResetPassOpen(false)}
        title="Reset Manager Password"
        subtitle={`Generate a new security access password for ${selectedManager?.name}`}
        maxWidth="md"
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">New Password (Min 6 chars) *</label>
            <input
              type="text"
              required
              minLength={6}
              value={resetPassVal}
              onChange={(e) => setResetPassVal(e.target.value)}
              placeholder="e.g. NewPass@2025"
              className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d] font-mono"
            />
          </div>
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsResetPassOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-gray-100 border border-gray-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md cursor-pointer"
            >
              Update Password
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW MANAGER DRAWER */}
      <Drawer
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title={selectedManager?.name || 'Manager Profile'}
        subtitle={`Manager ID: ${selectedManager?.emp_or_mgr_id} • ${selectedManager?.department_name}`}
        width="2xl"
      >
        {selectedManager && (
          <div className="space-y-6">
            {/* Quick Profile Card */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center space-x-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-lg">
                {selectedManager.name.charAt(0)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-bold text-white">{selectedManager.name}</h3>
                  <Badge status={selectedManager.status} />
                </div>
                <p className="text-xs text-slate-400">{selectedManager.email} • {selectedManager.phone || 'No phone'}</p>
                <div className="flex items-center space-x-3 text-xs text-slate-500 pt-1">
                  <span>Type: <strong className="text-slate-300">{selectedManager.manager_type_name}</strong></span>
                  <span>•</span>
                  <span>Joined: <strong className="text-slate-300">{selectedManager.joining_date}</strong></span>
                </div>
              </div>
            </div>

            {/* Assigned Staff */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-400" />
                <span>Direct Reporting Employees ({selectedManagerEmps.length})</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedManagerEmps.length > 0 ? (
                  selectedManagerEmps.map((emp) => (
                    <div key={emp.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-left">
                      <p className="text-xs font-bold text-white">{emp.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{emp.emp_or_mgr_id}</p>
                      <p className="text-[11px] text-slate-500 truncate">{emp.email}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 col-span-2 py-3">No employees assigned to this manager yet.</p>
                )}
              </div>
            </div>

            {/* Module Permissions Matrix */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-400" />
                <span>Effective Module Permissions</span>
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase text-[9px] border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Module</th>
                      <th className="py-2.5 px-2 text-center">View</th>
                      <th className="py-2.5 px-2 text-center">Create</th>
                      <th className="py-2.5 px-2 text-center">Edit</th>
                      <th className="py-2.5 px-2 text-center">Delete</th>
                      <th className="py-2.5 px-2 text-center">Assign</th>
                      <th className="py-2.5 px-2 text-center">Verify</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {selectedManagerPerms.map((p) => (
                      <tr key={p.module} className="hover:bg-slate-900/40">
                        <td className="py-2 px-3 font-semibold text-white">{p.module}</td>
                        <td className="py-2 px-2 text-center">{p.can_view ? '✅' : '—'}</td>
                        <td className="py-2 px-2 text-center">{p.can_create ? '✅' : '—'}</td>
                        <td className="py-2 px-2 text-center">{p.can_edit ? '✅' : '—'}</td>
                        <td className="py-2 px-2 text-center">{p.can_delete ? '✅' : '—'}</td>
                        <td className="py-2 px-2 text-center">{p.can_assign ? '✅' : '—'}</td>
                        <td className="py-2 px-2 text-center">{p.can_verify ? '✅' : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
