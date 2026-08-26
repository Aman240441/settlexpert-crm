import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Trash2, Users, UserCheck, Building2, CheckSquare } from 'lucide-react';
import { api } from '../../services/api';
import { Team, Department, User } from '../../types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';

export const TeamsView: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    department_id: '',
    manager_id: '',
    status: 'active',
    employee_ids: [] as string[],
  });

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamRes, deptRes, mgrRes, empRes] = await Promise.all([
        api.getTeams(),
        api.getDepartments(),
        api.getManagers(),
        api.getEmployees(),
      ]);
      setTeams(teamRes.teams);
      setDepartments(deptRes.departments);
      setManagers(mgrRes.managers);
      setEmployees(empRes.employees);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to fetch teams' });
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
      department_id: departments[0]?.id || '',
      manager_id: managers[0]?.id || '',
      status: 'active',
      employee_ids: [],
    });
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTeam(formData);
      setFeedbackMsg({ type: 'success', text: `Team ${formData.name} created successfully!` });
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to create team' });
    }
  };

  const handleOpenEdit = (t: Team) => {
    setSelectedTeam(t);
    const currentMemberIds = t.members ? t.members.map((m) => m.id) : [];
    setFormData({
      name: t.name,
      department_id: t.department_id || '',
      manager_id: t.manager_id || '',
      status: t.status,
      employee_ids: currentMemberIds,
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;
    try {
      await api.updateTeam(selectedTeam.id, formData);
      setFeedbackMsg({ type: 'success', text: `Team ${formData.name} updated successfully!` });
      setIsEditOpen(false);
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to update team' });
    }
  };

  const toggleEmployeeSelection = (empId: string) => {
    if (formData.employee_ids.includes(empId)) {
      setFormData({
        ...formData,
        employee_ids: formData.employee_ids.filter((id) => id !== empId),
      });
    } else {
      setFormData({
        ...formData,
        employee_ids: [...formData.employee_ids, empId],
      });
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
            <Layers className="h-5 w-5 text-purple-600" />
            <span>Teams Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize functional units under departments and assign dedicated employees and managers.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Create Team</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {teams.map((team) => (
          <div
            key={team.id}
            className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs space-y-4 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">{team.name}</h3>
                  <span className="text-xs text-slate-500">{team.department_name || 'Unassigned Department'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge status={team.status} />
                  <button
                    onClick={() => handleOpenEdit(team)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs">
                <span className="text-slate-600 flex items-center space-x-1.5 font-medium">
                  <UserCheck className="h-4 w-4 text-blue-600" />
                  <span>Supervising Manager:</span>
                </span>
                <span className="font-bold text-slate-900">{team.manager_name || 'Unassigned'}</span>
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Assigned Employees ({team.members?.length || 0})</span>
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {team.members && team.members.length > 0 ? (
                  team.members.map((m) => (
                    <span
                      key={m.id}
                      className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold"
                    >
                      {m.name} <span className="text-[10px] text-slate-400 font-mono">({m.emp_or_mgr_id})</span>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">No employees assigned to this team yet.</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE TEAM MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Team"
        subtitle="Group staff into focused task teams under a manager."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Team Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Legal Notices Squad"
                className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Department *</label>
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
              <label className="text-xs font-semibold text-slate-700 block mb-1">Managing Lead</label>
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

          <div className="pt-2 border-t border-gray-100">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-2">
              Select Team Members
            </label>
            <div className="max-h-48 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 bg-gray-50 border border-gray-200 rounded-xl">
              {employees.map((emp) => {
                const isSelected = formData.employee_ids.includes(emp.id);
                return (
                  <div
                    key={emp.id}
                    onClick={() => toggleEmployeeSelection(emp.id)}
                    className={`p-2 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors ${
                      isSelected
                        ? 'bg-emerald-50 border border-emerald-300 text-emerald-900 font-semibold'
                        : 'hover:bg-white text-slate-700'
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{emp.name}</p>
                      <span className="text-[10px] text-slate-500 font-mono">{emp.emp_or_mgr_id}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => { }}
                      className="rounded border-gray-300 text-[#15803d]"
                    />
                  </div>
                );
              })}
            </div>
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
              Save Team
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT TEAM MODAL */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Team"
        subtitle={`Updating team: ${selectedTeam?.name}`}
        maxWidth="2xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Team Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              <label className="text-xs font-semibold text-slate-700 block mb-1">Managing Lead</label>
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

          <div className="pt-2 border-t border-gray-100">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-2">
              Assigned Team Members ({formData.employee_ids.length})
            </label>
            <div className="max-h-48 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 bg-gray-50 border border-gray-200 rounded-xl">
              {employees.map((emp) => {
                const isSelected = formData.employee_ids.includes(emp.id);
                return (
                  <div
                    key={emp.id}
                    onClick={() => toggleEmployeeSelection(emp.id)}
                    className={`p-2 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors ${
                      isSelected
                        ? 'bg-emerald-50 border border-emerald-300 text-emerald-900 font-semibold'
                        : 'hover:bg-white text-slate-700'
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{emp.name}</p>
                      <span className="text-[10px] text-slate-500 font-mono">{emp.emp_or_mgr_id}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => { }}
                      className="rounded border-gray-300 text-[#15803d]"
                    />
                  </div>
                );
              })}
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
    </div>
  );
};
