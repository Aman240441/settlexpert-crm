import React, { useState, useEffect } from 'react';
import {
  Clock,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  CheckSquare
} from 'lucide-react';
import { api } from '../../services/api';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';

export const ManagerTasksView: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [teamEmployees, setTeamEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'medium',
    due_date: new Date().toISOString().split('T')[0],
    module: 'Operations'
  });

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchTasksAndTeam = async () => {
    try {
      setLoading(true);
      const [taskRes, teamRes] = await Promise.all([
        api.getManagerTasks(),
        api.getManagerTeam()
      ]);
      setTasks(taskRes.tasks || []);
      setTeamEmployees(teamRes.employees || []);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: 'Failed to load tasks' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksAndTeam();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createManagerTask(formData);
      setFeedbackMsg({ type: 'success', text: res.message || 'Task created successfully' });
      setIsCreateOpen(false);
      setFormData({
        title: '',
        description: '',
        assigned_to: '',
        priority: 'medium',
        due_date: new Date().toISOString().split('T')[0],
        module: 'Operations'
      });
      fetchTasksAndTeam();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to create task' });
    }
  };

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

      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 mb-1">
            <span className="text-[#1e40af] font-bold">Dashboard</span>
            <span>/</span>
            <span className="text-[#1e40af] font-bold">Manager Work Center</span>
            <span>/</span>
            <span className="text-slate-800 font-bold">Team Tasks & Operational Queue</span>
          </div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-[#15803d]" />
            <span>Team Task Assignments & Operational Queue</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Assign action items, legal drafting notices, client follow-up duties, and audit completion.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#15803d] hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Assign Team Task</span>
        </button>
      </div>

      {/* Tasks Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs bg-white rounded-xl border border-gray-200">
          Loading team tasks...
        </div>
      ) : tasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((t) => (
            <div
              key={t.id}
              className="p-4 rounded-xl bg-white border border-gray-200 hover:border-emerald-500 transition-all shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-bold text-[#166534] uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                  {t.module || 'General'}
                </span>
                <Badge status={t.status} />
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 leading-tight">{t.title}</h4>
                {t.description && (
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{t.description}</p>
                )}
              </div>

              <div className="pt-2.5 border-t border-gray-100 text-xs space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-500">Assigned To:</span>
                  <span className="font-semibold text-slate-900">{t.assigned_to_name || 'Unassigned'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Due Date:</span>
                  <span className="font-mono text-amber-700 font-bold">
                    {t.due_date ? new Date(t.due_date).toLocaleDateString() : 'Immediate'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Priority:</span>
                  <span className="capitalize font-bold text-slate-800">{t.priority}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500 rounded-xl bg-white border border-gray-200 text-xs">
          No tasks currently assigned to your team.
        </div>
      )}

      {/* CREATE TASK MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Assign New Task to Team Staff"
        subtitle="Create an actionable duty item with due date and priority."
      >
        <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 block mb-1 font-semibold">Task Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Review Settlement NOC from HDFC"
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
            />
          </div>

          <div>
            <label className="text-slate-700 block mb-1 font-semibold">Description / Action Required</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Specific instructions or case references..."
              className="w-full p-3 bg-white border border-gray-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-600 text-xs resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 block mb-1 font-semibold">Assign Staff Member</label>
              <select
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
              >
                <option value="">Unassigned</option>
                {teamEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.emp_or_mgr_id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-700 block mb-1 font-semibold">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent SLA</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-slate-700 block mb-1 font-semibold">Due Date</label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-slate-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-[#15803d] hover:bg-emerald-800 text-white font-bold shadow-xs"
            >
              Queue Task
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
