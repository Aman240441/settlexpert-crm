import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  Calendar,
  AlertTriangle,
  FolderOpen,
  Plus,
  UserCheck,
  Phone,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
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
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFollowUps, setLoadingFollowUps] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'follow-ups' | 'documents' | 'escalations'>(initialTab);
  const [followUpFilter, setFollowUpFilter] = useState<'all' | 'today' | 'tomorrow' | 'overdue' | 'upcoming'>('all');

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

  const fetchTasksData = async () => {
    try {
      setLoading(true);
      const [taskRes, empRes] = await Promise.all([
        api.getTasks().catch(() => ({ tasks: [] })),
        api.getEmployees().catch(() => ({ employees: [] })),
      ]);
      setTasks(taskRes?.tasks || []);
      const emps = empRes?.employees || [];
      setEmployees(emps);
      if (emps.length > 0 && !formData.assigned_to) {
        setFormData((prev) => ({ ...prev, assigned_to: emps[0].id }));
      }
    } catch (err: any) {
      console.error('Failed to load operations data', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowUpsData = async (filter: string = followUpFilter) => {
    try {
      setLoadingFollowUps(true);
      const res = await api.getManagerFollowUps({ filter }).catch(() => ({ followUps: [] }));
      setFollowUps(res?.followUps || []);
    } catch (err) {
      console.error('Failed to load follow-ups', err);
    } finally {
      setLoadingFollowUps(false);
    }
  };

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    fetchTasksData();
  }, []);

  useEffect(() => {
    if (activeTab === 'follow-ups') {
      fetchFollowUpsData(followUpFilter);
    }
  }, [activeTab, followUpFilter]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTask(formData);
      setFeedbackMsg({ type: 'success', text: 'Operation task queued successfully!' });
      setIsCreateOpen(false);
      setFormData({
        title: '',
        description: '',
        module: 'Operations',
        priority: 'medium',
        due_date: new Date().toISOString().split('T')[0],
        assigned_to: employees[0]?.id || '',
      });
      fetchTasksData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to create task' });
    }
  };

  const handleToggleStatus = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await api.updateTaskStatus(taskId, nextStatus);
      fetchTasksData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: 'Failed to update task status' });
    }
  };

  // Filter tasks based on tab
  const displayedTasks = tasks.filter((t) => {
    if (activeTab === 'documents') {
      return t.module?.toLowerCase().includes('document') || t.module?.toLowerCase().includes('legal') || t.module === 'Operations';
    }
    if (activeTab === 'escalations') {
      return t.priority === 'urgent' || t.priority === 'high';
    }
    return true;
  });

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
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-500 hover:text-slate-800 font-bold ml-4 cursor-pointer">
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
            Admin oversight across operational task queues, client follow-up schedules, and legal escalations.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {activeTab === 'follow-ups' ? (
            <button
              onClick={() => fetchFollowUpsData(followUpFilter)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingFollowUps ? 'animate-spin text-blue-600' : ''}`} />
              <span>Refresh</span>
            </button>
          ) : (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Assign Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
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

      {/* ACTIVE TAB: FOLLOW-UPS SCHEDULE */}
      {activeTab === 'follow-ups' ? (
        <div className="space-y-4">
          {/* Sub-filters for Follow-ups */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setFollowUpFilter('all')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                followUpFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              All Schedules ({followUps.length})
            </button>
            <button
              onClick={() => setFollowUpFilter('today')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                followUpFilter === 'today'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Due Today</span>
            </button>
            <button
              onClick={() => setFollowUpFilter('tomorrow')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                followUpFilter === 'tomorrow'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Tomorrow
            </button>
            <button
              onClick={() => setFollowUpFilter('overdue')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                followUpFilter === 'overdue'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
              <span>Overdue SLA</span>
            </button>
            <button
              onClick={() => setFollowUpFilter('upcoming')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                followUpFilter === 'upcoming'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Upcoming
            </button>
          </div>

          {/* Follow-up Cards Grid */}
          {loadingFollowUps ? (
            <div className="py-16 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
              Loading follow-up schedules...
            </div>
          ) : followUps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {followUps.map((f) => (
                <div
                  key={f.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 transition-all shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-blue-600 text-xs">{f.lead_number}</span>
                        <Badge status={f.lead_status || f.final_status} />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">{f.lead_name || 'Client Lead'}</h4>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {f.lead_phone} {f.lead_city ? `• ${f.lead_city}` : ''}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase block font-bold">Scheduled Next</span>
                      <span className="text-xs font-bold text-emerald-600 font-mono">
                        {f.next_follow_up_date ? new Date(f.next_follow_up_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Immediate'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">
                        Call Status: <strong className="text-slate-800">{f.call_status || 'Logged'}</strong>
                      </span>
                      <span className="text-blue-600 font-semibold">{f.employee_name || f.user_name || 'Assigned Staff'}</span>
                    </div>
                    <p className="text-slate-600 pt-1 border-t border-slate-200 italic">
                      "{f.remark || 'No remarks recorded.'}"
                    </p>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pt-1">
                    <span>Logged: {new Date(f.created_at).toLocaleDateString('en-IN')}</span>
                    {f.total_debt ? (
                      <span className="text-slate-600 font-medium">Debt: ₹{Number(f.total_debt).toLocaleString('en-IN')}</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 rounded-2xl bg-white border border-slate-200 text-xs">
              <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No follow-ups found for this timeline.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Follow-up commitments scheduled by staff will appear here.</p>
            </div>
          )}
        </div>
      ) : (
        /* TASK LIST TABLE (for tasks, documents, escalations) */
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
                ) : displayedTasks.length > 0 ? (
                  displayedTasks.map((t) => (
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
                    <td colSpan={7} className="py-10 text-center text-slate-400 font-medium">
                      No {activeTab} tasks queued at this moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
              <option value="Documents">Documents Verification</option>
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
                  {e.name} ({e.emp_or_mgr_id || e.email})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 cursor-pointer"
            >
              Queue Task
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
