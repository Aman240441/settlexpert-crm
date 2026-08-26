import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Shield,
  Clock,
  User,
  Activity,
  FileCheck
} from 'lucide-react';
import { api } from '../../services/api';

export const ManagerActivityView: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        const res = await api.getManagerActivity();
        setLogs(res.logs || []);
      } catch (err) {
        console.error('Failed to load activity logs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, []);

  const filtered = logs.filter((l) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      l.action?.toLowerCase().includes(s) ||
      l.user_name?.toLowerCase().includes(s) ||
      l.module?.toLowerCase().includes(s) ||
      l.record_id?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-400" />
            <span>Team Activity Stream & Audit Trail</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time audit log of team actions, lead assignments, fee adjustments, and verifications.
          </p>
        </div>

        <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-indigo-400">
          {logs.length} Scoped Events
        </span>
      </div>

      {/* Search */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by Action, Staff Name, Module, Record Ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Activity Timeline Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Action Event</th>
                <th className="py-3.5 px-4">Module</th>
                <th className="py-3.5 px-4">Initiated By</th>
                <th className="py-3.5 px-4">Record Ref</th>
                <th className="py-3.5 px-4">Details / Metadata</th>
                <th className="py-3.5 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading activity stream...
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                      {l.action}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] font-bold uppercase">
                        {l.module}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-medium">
                      {l.user_name || 'System'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {l.record_id || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px] max-w-xs truncate font-mono">
                      {l.details_json || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(l.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No activity logs recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
