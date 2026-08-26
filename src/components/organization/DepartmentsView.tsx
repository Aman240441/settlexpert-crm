import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Trash2, Users, UserCheck, Layers, Hash } from 'lucide-react';
import { api } from '../../services/api';
import { Department, User } from '../../types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';

export const DepartmentsView: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    head_manager_id: '',
    status: 'active',
  });

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [deptRes, mgrRes] = await Promise.all([api.getDepartments(), api.getManagers()]);
      setDepartments(deptRes.departments);
      setManagers(mgrRes.managers);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to fetch departments' });
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
      code: '',
      description: '',
      head_manager_id: '',
      status: 'active',
    });
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createDepartment(formData);
      setFeedbackMsg({ type: 'success', text: `Department ${formData.name} created successfully!` });
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to create department' });
    }
  };

  const handleOpenEdit = (d: Department) => {
    setSelectedDept(d);
    setFormData({
      name: d.name,
      code: d.code,
      description: d.description || '',
      head_manager_id: d.head_manager_id || '',
      status: d.status,
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDept) return;
    try {
      await api.updateDepartment(selectedDept.id, formData);
      setFeedbackMsg({ type: 'success', text: `Department ${formData.name} updated successfully!` });
      setIsEditOpen(false);
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to update department' });
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <span>Departments Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure functional business units, codes, and assigned Head Managers.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Create Department</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {departments.map((dept) => (
          <div
            key={dept.id}
            className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs space-y-4 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">{dept.name}</h3>
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-black border border-blue-100">
                      {dept.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">{dept.description || 'No description provided.'}</p>
                </div>
                <button
                  onClick={() => handleOpenEdit(dept)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <UserCheck className="h-4 w-4 text-emerald-600" />
                  <span className="text-slate-500">Head Manager:</span>
                </div>
                <span className="font-bold text-slate-900 truncate max-w-[150px]">
                  {dept.head_manager_name || 'Unassigned'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center text-xs">
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/50">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Managers</span>
                <span className="font-black text-slate-900 text-sm">{dept.manager_count || 0}</span>
              </div>
              <div className="p-2 rounded-xl bg-indigo-50/50 border border-indigo-100">
                <span className="text-[10px] text-indigo-600 block uppercase font-bold">Staff</span>
                <span className="font-black text-indigo-700 text-sm">{dept.employee_count || 0}</span>
              </div>
              <div className="p-2 rounded-xl bg-amber-50/50 border border-amber-100">
                <span className="text-[10px] text-amber-700 block uppercase font-bold">Teams</span>
                <span className="font-black text-amber-700 text-sm">{dept.team_count || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE DEPARTMENT MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Department"
        subtitle="Define department properties and leadership."
        maxWidth="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Department Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Quality Assurance"
              className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Department Code *</label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="e.g. QA"
              className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d] uppercase font-mono"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Head Manager</label>
            <select
              value={formData.head_manager_id}
              onChange={(e) => setFormData({ ...formData, head_manager_id: e.target.value })}
              className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d]"
            >
              <option value="">Select Head Manager</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.emp_or_mgr_id})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Roles, responsibilities and operational scope"
              className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d]"
            />
          </div>
          <div className="flex items-center justify-end space-x-3 pt-2">
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
              Save Department
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT DEPARTMENT MODAL */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Department"
        subtitle={`Updating: ${selectedDept?.name}`}
        maxWidth="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Department Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Department Code</label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d] uppercase font-mono"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Head Manager</label>
            <select
              value={formData.head_manager_id}
              onChange={(e) => setFormData({ ...formData, head_manager_id: e.target.value })}
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
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d]"
            />
          </div>
          <div className="flex items-center justify-end space-x-3 pt-2">
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
    </div>
  );
};
