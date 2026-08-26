import React, { useState, useEffect } from 'react';
import {
  Clock,
  Search,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Phone,
  User,
  Building2,
  ChevronRight
} from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../common/Badge';

export const ManagerFollowUpsView: React.FC = () => {
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'tomorrow' | 'overdue' | 'upcoming'>('all');

  const fetchFollowUps = async () => {
    try {
      setLoading(true);
      const res = await api.getManagerFollowUps({ filter: activeFilter });
      setFollowUps(res.followUps || []);
    } catch (err) {
      console.error('Failed to load follow-ups', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, [activeFilter]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-400" />
            <span>Team Follow-Up Schedule & SLA Tracking</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor interaction commitments, detect overdue client follow-ups, and ensure rapid response.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeFilter === 'all'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          All Schedules
        </button>
        <button
          onClick={() => setActiveFilter('today')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
            activeFilter === 'today'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Due Today</span>
        </button>
        <button
          onClick={() => setActiveFilter('tomorrow')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeFilter === 'tomorrow'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          Tomorrow
        </button>
        <button
          onClick={() => setActiveFilter('overdue')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
            activeFilter === 'overdue'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
          <span>Overdue SLA</span>
        </button>
        <button
          onClick={() => setActiveFilter('upcoming')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeFilter === 'upcoming'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          Upcoming (Next 7 Days)
        </button>
      </div>

      {/* Follow-up Cards */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          Loading follow-up schedules...
        </div>
      ) : followUps.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {followUps.map((f) => (
            <div
              key={f.id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-xl space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-indigo-400 text-xs">{f.lead_number}</span>
                    <Badge status={f.lead_status} />
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1">{f.lead_name}</h4>
                  <span className="text-[11px] text-slate-400 font-mono">{f.lead_phone} • {f.lead_city || '—'}</span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Scheduled Next</span>
                  <span className="text-xs font-bold text-amber-400 font-mono">
                    {f.next_follow_up_date ? new Date(f.next_follow_up_date).toLocaleDateString() : 'Immediate'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Call Status: <strong className="text-white">{f.call_status}</strong></span>
                  <span className="text-indigo-400 font-semibold">{f.employee_name || f.user_name || 'Staff'}</span>
                </div>
                <p className="text-slate-200 pt-1 border-t border-slate-900 italic">
                  "{f.remark || 'No remark logged'}"
                </p>
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono pt-1">
                <span>Logged: {new Date(f.created_at).toLocaleString()}</span>
                <span className="text-slate-400 font-medium">Debt: ₹{f.total_debt?.toLocaleString('en-IN')}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
          No follow-ups found for selected timeline filter.
        </div>
      )}
    </div>
  );
};
