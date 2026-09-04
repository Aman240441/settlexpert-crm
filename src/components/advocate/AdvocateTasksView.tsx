import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Search,
  Scale,
  Calendar,
  Filter
} from 'lucide-react';
import { api } from '../../services/api';
import { Modal } from '../common/Modal';

export const AdvocateTasksView: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [search, setSearch] = useState('');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.getTasks({ status: statusFilter !== 'all' ? statusFilter : undefined });
      const legalTasks = (res.tasks || []).filter((t: any) => t.module === 'Legal' || t.title?.includes('CL-') || t.title?.includes('[CL'));
      setTasks(legalTasks);
    } catch (err) {
      console.error('Failed to load legal tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter]);

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await api.updateTaskStatus(taskId, newStatus);
      fetchTasks();
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4 font-sans text-slate-800 pb-16">
      {/* Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
          <span className="text-[#1e40af] font-bold">Dashboard</span>
          <span>/</span>
          <span className="text-[#1e40af] font-bold">Legal Counsel</span>
          <span>/</span>
          <span className="text-slate-800 font-bold">Legal Actions & Notice Responses</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${statusFilter === 'all'
                ? 'bg-[#111827] text-white shadow-sm'
                : 'bg-white border border-gray-300 text-slate-700 hover:bg-gray-50'
              }`}
          >
            All Actions
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${statusFilter === 'pending'
                ? 'bg-[#111827] text-white shadow-sm'
                : 'bg-white border border-gray-300 text-slate-700 hover:bg-gray-50'
              }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${statusFilter === 'completed'
                ? 'bg-[#111827] text-white shadow-sm'
                : 'bg-white border border-gray-300 text-slate-700 hover:bg-gray-50'
              }`}
          >
            Completed
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search notice / action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 w-56 sm:w-64"
          />
        </div>
      </div>

      {/* Card Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-[#15803d]" />
            <h2 className="text-sm font-bold text-slate-900">
              Legal Tasks & Court Notice Action Items
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            {filteredTasks.length} Total Recorded
          </span>
        </div>

        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="py-12 text-center text-slate-400">Loading action items...</div>
          ) : filteredTasks.length > 0 ? (
            filteredTasks.map((t) => (
              <div key={t.id} className="p-4 hover:bg-gray-50/80 transition-colors flex items-start justify-between gap-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={t.status === 'completed'}
                    onChange={() => handleToggleTask(t.id, t.status)}
                    className="mt-1 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <div>
                    <h4 className={`text-xs font-bold ${t.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                      {t.title}
                    </h4>
                    {t.description && (
                      <p className="text-[11px] text-slate-500 mt-0.5">{t.description}</p>
                    )}
                    <div className="flex items-center space-x-3 mt-1.5 text-[10px] text-slate-400">
                      <span>Logged by: {t.created_by || 'Counsel'}</span>
                      {t.due_date && <span>• Due: {t.due_date}</span>}
                      <span>• Priority: <strong className="uppercase text-slate-700">{t.priority}</strong></span>
                    </div>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                  {t.status === 'completed' ? 'Done' : 'Pending'}
                </span>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              No legal tasks recorded yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
