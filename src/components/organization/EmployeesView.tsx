import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  KeyRound,
  Edit2,
  Power,
  UserCheck,
  Building2,
  ArrowRightLeft,
  Eye,
  FileCheck
} from 'lucide-react';
import { api } from '../../services/api';
import { User, Department } from '../../types';
import { Modal } from '../common/Modal';
import { Drawer } from '../common/Drawer';
import { Badge } from '../common/Badge';
import { CreateStaffModal } from '../staff/CreateStaffModal';

export const EmployeesView: React.FC = () => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedManager, setSelectedManager] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isResetPassOpen, setIsResetPassOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);

  // Forms
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    emp_or_mgr_id: '',
    password: 'Employee@123456',
    joining_date: new Date().toISOString().split('T')[0],
    department_id: '',
    manager_id: '',
    status: 'active',
    profile_image: '',
    id_type: 'Aadhaar Card',
    id_front: 'id_front_scan.pdf',
    id_back: 'id_back_scan.pdf',
  });

  const [transferData, setTransferData] = useState({
    new_manager_id: '',
    transfer_reason: '',
  });

  const [resetPassVal, setResetPassVal] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [empRes, mgrRes, deptRes] = await Promise.all([
        api.getEmployees({
          search: search || undefined,
          department: selectedDept || undefined,
          manager: selectedManager || undefined,
          status: selectedStatus || undefined,
        }),
        api.getManagers(),
        api.getDepartments(),
      ]);
      setEmployees(empRes.employees);
      setManagers(mgrRes.managers);
      setDepartments(deptRes.departments);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to load employees' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, selectedDept, selectedManager, selectedStatus]);

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      emp_or_mgr_id: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      password: 'Employee@123456',
      joining_date: new Date().toISOString().split('T')[0],
      department_id: departments[0]?.id || '',
      manager_id: managers[0]?.id || '',
      status: 'active',
      profile_image: '',
      id_type: 'PAN Card',
      id_front: 'id_front_scan.pdf',
      id_back: 'id_back_scan.pdf',
    });
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createEmployee(formData);
      setFeedbackMsg({ type: 'success', text: `Employee ${formData.name} created successfully!` });
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to create employee' });
    }
  };

  const handleOpenEdit = (emp: User) => {
    setSelectedEmployee(emp);
    setFormData({
      name: emp.name,
      email: emp.email,
      phone: emp.phone || '',
      emp_or_mgr_id: emp.emp_or_mgr_id || '',
      password: '',
      joining_date: emp.joining_date || new Date().toISOString().split('T')[0],
      department_id: emp.department_id || '',
      manager_id: emp.manager_id || '',
      status: emp.status,
      profile_image: emp.profile_image || '',
      id_type: emp.id_type || 'Aadhaar Card',
      id_front: emp.id_front || '',
      id_back: emp.id_back || '',
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    try {
      await api.updateEmployee(selectedEmployee.id, formData);
      setFeedbackMsg({ type: 'success', text: `Employee ${formData.name} updated successfully!` });
      setIsEditOpen(false);
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to update employee' });
    }
  };

  const handleOpenView = (emp: User) => {
    setSelectedEmployee(emp);
    setIsViewOpen(true);
  };

  const handleOpenTransfer = (emp: User) => {
    setSelectedEmployee(emp);
    setTransferData({
      new_manager_id: managers.find((m) => m.id !== emp.manager_id)?.id || '',
      transfer_reason: 'Workload balancing & case reallocation',
    });
    setIsTransferOpen(true);
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    try {
      await api.transferEmployeeManager(selectedEmployee.id, transferData);
      setFeedbackMsg({ type: 'success', text: `Employee ${selectedEmployee.name} transferred successfully!` });
      setIsTransferOpen(false);
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to transfer employee' });
    }
  };

  const handleToggleStatus = async (emp: User) => {
    try {
      const res = await api.toggleEmployeeStatus(emp.id);
      setFeedbackMsg({ type: 'success', text: `Employee status changed to ${res.status}` });
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to toggle status' });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    try {
      await api.resetEmployeePassword(selectedEmployee.id, resetPassVal);
      setFeedbackMsg({ type: 'success', text: `Password reset successfully for ${selectedEmployee.name}` });
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
            <Users className="h-5 w-5 text-indigo-600" />
            <span>Employees Directory</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin oversight on workforce, manager assignments, cross-department transfers, and status controls.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Create Employee</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search employees..."
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
          value={selectedManager}
          onChange={(e) => setSelectedManager(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 px-3 py-2 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Managers</option>
          {managers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.emp_or_mgr_id})
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

      {/* Employees Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Assigned Manager</th>
                <th className="py-3.5 px-4">Team</th>
                <th className="py-3.5 px-4">Joining Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    Loading employees...
                  </td>
                </tr>
              ) : employees.length > 0 ? (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-9 w-9 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm border border-indigo-200 shrink-0 overflow-hidden">
                          {emp.profile_image ? (
                            <img src={emp.profile_image} alt={emp.name} className="h-full w-full object-cover" />
                          ) : (
                            emp.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 tracking-tight">{emp.name}</p>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                            <span className="font-mono text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded text-[10px] font-bold">
                              {emp.emp_or_mgr_id}
                            </span>
                            <span>•</span>
                            <span className="truncate max-w-[140px]">{emp.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {emp.department_name || 'Unassigned'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center space-x-1.5 text-slate-700">
                        <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                        <span className="font-medium">{emp.manager_name || 'Unassigned'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{emp.team_name || '—'}</td>
                    <td className="py-3.5 px-4 text-slate-500">{emp.joining_date || 'N/A'}</td>
                    <td className="py-3.5 px-4">
                      <Badge status={emp.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => handleOpenView(emp)}
                          title="View Profile"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenTransfer(emp)}
                          title="Transfer Manager"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          title="Edit Employee"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedEmployee(emp);
                            setResetPassVal('Employee@123456');
                            setIsResetPassOpen(true);
                          }}
                          title="Reset Password"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                        >
                          <KeyRound className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(emp)}
                          title={emp.status === 'active' ? 'Deactivate' : 'Activate'}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            emp.status === 'active'
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
                    No employees found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE EMPLOYEE MODAL (UNIFIED KYC & PROFILE) */}
      <CreateStaffModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          setFeedbackMsg({ type: 'success', text: 'Employee profile created successfully with complete KYC verification!' });
          fetchData();
        }}
        defaultStaffType="Employee"
      />

      {/* EDIT EMPLOYEE MODAL */}

      {/* EDIT EMPLOYEE MODAL */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Employee"
        subtitle={`Updating: ${selectedEmployee?.name}`}
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
              <label className="text-xs font-semibold text-slate-700 block mb-1">Employee ID</label>
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
              <label className="text-xs font-semibold text-slate-700 block mb-1">Department</label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d]"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Assigned Manager</label>
              <select
                value={formData.manager_id}
                onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d]"
              >
                <option value="">Unassigned</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.emp_or_mgr_id})
                  </option>
                ))}
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

      {/* TRANSFER MANAGER MODAL */}
      <Modal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        title="Transfer Employee to Another Manager"
        subtitle={`Reallocate ${selectedEmployee?.name} (Current Manager: ${selectedEmployee?.manager_name || 'None'})`}
        maxWidth="md"
      >
        <form onSubmit={handleTransferSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Target Manager *</label>
            <select
              required
              value={transferData.new_manager_id}
              onChange={(e) => setTransferData({ ...transferData, new_manager_id: e.target.value })}
              className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d]"
            >
              <option value="">Select Target Manager</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} • {m.department_name} ({m.emp_or_mgr_id})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Transfer Reason / Audit Note</label>
            <textarea
              rows={2}
              value={transferData.transfer_reason}
              onChange={(e) => setTransferData({ ...transferData, transfer_reason: e.target.value })}
              placeholder="e.g. Department expansion, case reassignment"
              className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d]"
            />
          </div>
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsTransferOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-gray-100 border border-gray-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md cursor-pointer"
            >
              Confirm Transfer
            </button>
          </div>
        </form>
      </Modal>

      {/* RESET PASSWORD MODAL */}
      <Modal
        isOpen={isResetPassOpen}
        onClose={() => setIsResetPassOpen(false)}
        title="Reset Employee Password"
        subtitle={`Set new login credentials for ${selectedEmployee?.name}`}
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

      {/* VIEW EMPLOYEE DRAWER */}
      <Drawer
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title={selectedEmployee?.name || 'Employee Profile'}
        subtitle={`Employee ID: ${selectedEmployee?.emp_or_mgr_id} • ${selectedEmployee?.department_name}`}
        width="lg"
      >
        {selectedEmployee && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center space-x-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-2xl flex items-center justify-center shadow-lg overflow-hidden shrink-0">
                {selectedEmployee.profile_image ? (
                  <img src={selectedEmployee.profile_image} alt={selectedEmployee.name} className="h-full w-full object-cover" />
                ) : (
                  selectedEmployee.name.charAt(0)
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-bold text-white">{selectedEmployee.name}</h3>
                  <Badge status={selectedEmployee.status} />
                </div>
                <p className="text-xs text-slate-400">{selectedEmployee.email} • {selectedEmployee.phone || 'No phone'}</p>
                <div className="flex items-center space-x-3 text-xs text-slate-500 pt-1">
                  <span>Manager: <strong className="text-slate-300">{selectedEmployee.manager_name || 'None'}</strong></span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Department</span>
                <span className="font-semibold text-white">{selectedEmployee.department_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Joining Date</span>
                <span className="font-semibold text-white">{selectedEmployee.joining_date}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">ID Verification</span>
                <span className="font-semibold text-emerald-400">{selectedEmployee.id_type || 'Verified'}</span>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
