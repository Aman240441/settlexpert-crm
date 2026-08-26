import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, Calendar, AlertTriangle, FolderOpen, Plus, UserCheck } from 'lucide-react';
import { api } from '../../services/api';
import { TaskItem, User } from '../../types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';

interface OperationsViewProps {
  initialTab?: 'tasks' | 'follow-ups' | 'documents' | 'escalations';
}

export const OperationsView: React.FC<OperationsViewProps> = ({ initialTab = 'tasks' }) => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tasks' | 'follow-ups' | 'documents' | 'escalations'>(initialTab);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    module: 'Operations',
    priority: 'medium' as const,
    due_date: new Date().toISOString().split('T')[0],
    assigned_to: '',
  });

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [taskRes, empRes] = await Promise.all([api.getTasks(), api.getEmployees()]);
      setTasks(taskRes.tasks);
      setEmployees(empRes.employees);
      if (empRes.employees.length > 0 && !formData.assigned_to) {
        setFormData((prev) => ({ ...prev, assigned_to: empRes.employees[0].id }));
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: 'Failed to load operations data' });
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

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTask(formData);
      setFeedbackMsg({ type: 'success', text: 'Operation task queued successfully!' });
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to create task' });
    }
  };

  const handleToggleStatus = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await api.updateTaskStatus(taskId, nextStatus);
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: 'Failed to update task status' });
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
            <CheckCircle2 className="h-5 w-5 text-blue-600" />
            <span>Operations & Case Workflow Center</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin oversight across operational task queues, follow-up schedules, and legal escalations.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Assign Task</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center space-x-2 cursor-pointer ${
            activeTab === 'tasks' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Tasks ({tasks.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('follow-ups')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center space-x-2 cursor-pointer ${
            activeTab === 'follow-ups' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Follow-ups Schedule</span>
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center space-x-2 cursor-pointer ${
            activeTab === 'documents' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FolderOpen className="h-3.5 w-3.5" />
          <span>Documents Verification</span>
        </button>
        <button
          onClick={() => setActiveTab('escalations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center space-x-2 cursor-pointer ${
            activeTab === 'escalations' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>Escalations</span>
        </button>
      </div>

      {/* Task List */}
      <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 w-10">Done</th>
                <th className="py-3.5 px-4">Task Details</th>
                <th className="py-3.5 px-4">Module</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4">Assigned Staff</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    Loading operations tasks...
                  </td>
                </tr>
              ) : tasks.length > 0 ? (
                tasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <input
                        type="checkbox"
                        checked={t.status === 'completed'}
                        onChange={() => handleToggleStatus(t.id, t.status)}
                        className="rounded border-slate-300 text-blue-600 cursor-pointer h-4 w-4"
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-bold text-slate-900 block ${
                          t.status === 'completed' ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {t.title}
                      </span>
                      {t.description && <span className="text-[11px] text-slate-500">{t.description}</span>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{t.module || 'General'}</td>
                    <td className="py-3.5 px-4">
                      <Badge status={t.priority} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{t.due_date || 'No deadline'}</td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <span className="inline-flex items-center space-x-1">
                        <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                        <span className="font-medium">{t.assigned_to_name || 'Unassigned'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={t.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    No operational tasks queued.
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
        title="Assign Operations Task"
        subtitle="Queue an action item for departmental staff."
        maxWidth="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Task Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Verify bank settlement offer letter"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Module Area</label>
            <select
              value={formData.module}
              onChange={(e) => setFormData({ ...formData, module: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="Operations">Operations</option>
              <option value="Legal">Legal / Advocate</option>
              <option value="Finance">Finance</option>
              <option value="Collection">Collection</option>
              <option value="Sales">Sales</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Due Date</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Assign Staff</label>
            <select
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.emp_or_mgr_id})
                </option>
              ))}
            </select>
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
              Queue Task
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
