import React, { useState, useEffect } from 'react';
import { Activity, Search, Filter, ShieldCheck, Clock, RefreshCw, FileText } from 'lucide-react';
import { api } from '../../services/api';
import { AuditLog } from '../../types';
import { Modal } from '../common/Modal';
import { CalendarDateFilter, getTodayStr } from '../common/CalendarDateFilter';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const modules = [
    'Managers',
    'Employees',
    'Advocates',
    'Departments',
    'Teams',
    'Manager Types',
    'Roles & Permissions',
    'Fee Plans',
    'Leads',
    'Clients',
    'Agreements',
    'Payments',
    'Tasks',
    'Auth',
    'System',
  ];

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs({
        search: search || undefined,
        module: moduleFilter || undefined,
        role: roleFilter || undefined,
        date: selectedDate || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        limit: 150,
      });
      setLogs(res.logs);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search, moduleFilter, roleFilter, selectedDate, fromDate, toDate]);

  const formatDetails = (raw: string | undefined) => {
    if (!raw) return 'No additional metadata';
    try {
      const obj = JSON.parse(raw);
      return JSON.stringify(obj, null, 2);
    } catch {
      return raw;
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-16 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <span>Activity & System Audit Trail</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable chronicle tracking manager creations, staff assignments, advocate registrations, permission changes, and security events.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CalendarDateFilter
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            fromDate={fromDate}
            toDate={toDate}
            onRangeChange={(f, t) => {
              setFromDate(f);
              setToDate(t);
            }}
          />
          <button
            onClick={fetchLogs}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all border border-slate-200 shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search action, user, or record..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>

        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 px-3 py-2 focus:outline-none focus:border-blue-500"
        >
          <option value="">All System Modules</option>
          {modules.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 px-3 py-2 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Actor Roles</option>
          <option value="admin">Administrator</option>
          <option value="manager">Manager</option>
          <option value="employee">Employee</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Module</th>
                <th className="py-3.5 px-4">Record ID</th>
                <th className="py-3.5 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => setSelectedLog(l)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                      {new Date(l.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">{l.user_name}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[10px] uppercase font-bold text-blue-700 border border-blue-100">
                        {l.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{l.action}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{l.module}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">{l.record_id || '—'}</td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate text-[11px]">
                      {l.details_json || '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    No audit records found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Detail Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={selectedLog?.action || 'Audit Log Event'}
        subtitle={`Module: ${selectedLog?.module} • Record: ${selectedLog?.record_id}`}
        maxWidth="lg"
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-1.5">
              <p className="text-slate-700">
                <strong className="text-slate-900">Executed By:</strong> {selectedLog.user_name} ({selectedLog.role})
              </p>
              <p className="text-slate-700">
                <strong className="text-slate-900">Timestamp:</strong> {new Date(selectedLog.created_at).toLocaleString()}
              </p>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                Payload / Event Details
              </label>
              <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap max-h-64">
                {formatDetails(selectedLog.details_json)}
              </pre>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-[#111827] hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
