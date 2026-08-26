import React, { useState, useEffect } from 'react';
import { ShieldCheck, Save, CheckSquare, Square, UserCheck, Shield, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { User, PermissionRow } from '../../types';

export const RolesPermissionsView: React.FC = () => {
  const [managers, setManagers] = useState<User[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState<string>('');
  const [matrix, setMatrix] = useState<PermissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchManagers = async () => {
    try {
      setLoading(true);
      const res = await api.getManagers();
      setManagers(res.managers);
      if (res.managers.length > 0) {
        setSelectedManagerId(res.managers[0].id);
        loadPermissions(res.managers[0].id);
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: 'Failed to load managers for permissions' });
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async (mgrId: string) => {
    try {
      const res = await api.getUserPermissions(mgrId);
      setMatrix(res.matrix || []);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: 'Failed to load permission matrix' });
    }
  };

  useEffect(() => {
    fetchManagers();
  }, []);

  const handleManagerChange = (id: string) => {
    setSelectedManagerId(id);
    loadPermissions(id);
  };

  const handleToggle = (moduleName: string, action: keyof Omit<PermissionRow, 'module'>) => {
    setMatrix((prev) =>
      prev.map((row) => {
        if (row.module === moduleName) {
          return { ...row, [action]: !row[action] };
        }
        return row;
      })
    );
  };

  const handleToggleAllForModule = (moduleName: string, enableAll: boolean) => {
    setMatrix((prev) =>
      prev.map((row) => {
        if (row.module === moduleName) {
          return {
            ...row,
            can_view: enableAll,
            can_create: enableAll,
            can_edit: enableAll,
            can_delete: enableAll,
            can_assign: enableAll,
            can_verify: enableAll,
          };
        }
        return row;
      })
    );
  };

  const handleSave = async () => {
    if (!selectedManagerId) return;
    try {
      setSaving(true);
      await api.updateUserPermissions(selectedManagerId, matrix);
      setFeedbackMsg({ type: 'success', text: 'Module permissions saved successfully!' });
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to save permissions' });
    } finally {
      setSaving(false);
    }
  };

  const selectedManager = managers.find((m) => m.id === selectedManagerId);

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
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <span>Roles & Permissions Matrix</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure fine-grained module access controls (View, Create, Edit, Delete, Assign, Verify) for individual managers.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !selectedManagerId}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? 'Saving...' : 'Save Permissions'}</span>
        </button>
      </div>

      {/* Selector Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center space-x-3">
          <UserCheck className="h-5 w-5 text-blue-600 shrink-0" />
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Select Manager to Configure
            </label>
            <select
              value={selectedManagerId}
              onChange={(e) => handleManagerChange(e.target.value)}
              className="mt-1 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 px-3 py-2 focus:outline-none focus:border-blue-500 font-medium"
            >
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} • {m.department_name} ({m.emp_or_mgr_id})
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedManager && (
          <div className="flex items-center space-x-4 text-xs text-slate-600 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
            <span>
              Manager Type: <strong className="text-slate-900">{selectedManager.manager_type_name}</strong>
            </span>
            <span>•</span>
            <span>
              Department: <strong className="text-slate-900">{selectedManager.department_name}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Matrix Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-4 px-6 w-1/4">System Module</th>
                <th className="py-4 px-3 text-center">View</th>
                <th className="py-4 px-3 text-center">Create</th>
                <th className="py-4 px-3 text-center">Edit</th>
                <th className="py-4 px-3 text-center">Delete</th>
                <th className="py-4 px-3 text-center">Assign</th>
                <th className="py-4 px-3 text-center">Verify</th>
                <th className="py-4 px-4 text-right">Quick Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                    Loading permission matrix...
                  </td>
                </tr>
              ) : matrix.length > 0 ? (
                matrix.map((row) => (
                  <tr key={row.module} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-slate-900 tracking-tight flex items-center space-x-2">
                      <span className="h-2 w-2 rounded-full bg-blue-600" />
                      <span>{row.module}</span>
                    </td>

                    {/* View */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggle(row.module, 'can_view')}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${row.can_view ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-50 text-slate-400 border border-slate-200'
                          }`}
                      >
                        {row.can_view ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                      </button>
                    </td>

                    {/* Create */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggle(row.module, 'can_create')}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${row.can_create ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-50 text-slate-400 border border-slate-200'
                          }`}
                      >
                        {row.can_create ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                      </button>
                    </td>

                    {/* Edit */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggle(row.module, 'can_edit')}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${row.can_edit ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-50 text-slate-400 border border-slate-200'
                          }`}
                      >
                        {row.can_edit ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                      </button>
                    </td>

                    {/* Delete */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggle(row.module, 'can_delete')}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${row.can_delete ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-slate-50 text-slate-400 border border-slate-200'
                          }`}
                      >
                        {row.can_delete ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                      </button>
                    </td>

                    {/* Assign */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggle(row.module, 'can_assign')}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${row.can_assign ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' : 'bg-slate-50 text-slate-400 border border-slate-200'
                          }`}
                      >
                        {row.can_assign ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                      </button>
                    </td>

                    {/* Verify */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggle(row.module, 'can_verify')}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${row.can_verify ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-slate-50 text-slate-400 border border-slate-200'
                          }`}
                      >
                        {row.can_verify ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                      </button>
                    </td>

                    {/* Quick Toggle */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => handleToggleAllForModule(row.module, true)}
                          className="text-[10px] font-semibold text-emerald-600 hover:underline"
                        >
                          All
                        </button>
                        <span className="text-slate-300">/</span>
                        <button
                          type="button"
                          onClick={() => handleToggleAllForModule(row.module, false)}
                          className="text-[10px] font-semibold text-slate-500 hover:underline"
                        >
                          None
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No modules available.
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
