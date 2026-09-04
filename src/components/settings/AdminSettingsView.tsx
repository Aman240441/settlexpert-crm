import React, { useState, useEffect } from 'react';
import { Settings, Shield, User, KeyRound, CheckCircle2, Save, Database, Server } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Badge } from '../common/Badge';

export const AdminSettingsView: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [saving, setSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name,
        phone: user.phone || '',
      }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.new_password && formData.new_password !== formData.confirm_password) {
      setFeedbackMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    try {
      setSaving(true);
      await api.updateProfile({
        name: formData.name,
        phone: formData.phone,
        current_password: formData.current_password || undefined,
        new_password: formData.new_password || undefined,
      });
      setFeedbackMsg({ type: 'success', text: 'Admin profile updated successfully!' });
      setFormData((prev) => ({ ...prev, current_password: '', new_password: '', confirm_password: '' }));
      refreshUser();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-16 animate-fade-in max-w-4xl">
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
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="h-5 w-5 text-blue-600" />
          <span>Admin Profile & System Settings</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage Super Administrator credentials, security configurations, and database status.
        </p>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-6">
        <div className="flex items-center space-x-4 pb-4 border-b border-slate-100">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-blue-500/20 overflow-hidden shrink-0">
            {user?.profile_image ? (
              <img src={user.profile_image} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              user?.name?.charAt(0) || 'A'
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-slate-900">{user?.name}</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                Super Administrator
              </span>
            </div>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <p className="text-[11px] text-slate-400 font-mono">ID: {user?.emp_or_mgr_id || 'ADM-001'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Administrator Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Contact Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Password Change Sub-section */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="h-4 w-4 text-blue-600" />
              <span>Security & Password Update</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Current Password</label>
                <input
                  type="password"
                  value={formData.current_password}
                  onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
                  placeholder="Leave empty if not changing"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">New Password</label>
                <input
                  type="password"
                  value={formData.new_password}
                  onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                  placeholder="Min 6 characters"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  placeholder="Re-type new password"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* System Status Info Card */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Database className="h-4 w-4 text-emerald-600" />
          <span>System & Database Health</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Platform State</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 mt-0.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Operational & Reconciled
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Database Storage</span>
            <span className="text-xs font-bold text-slate-900 mt-0.5 block">SQLite Canonical Database</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">API Sync Channel</span>
            <span className="text-xs font-bold text-blue-600 mt-0.5 block">Active REST Endpoint</span>
          </div>
        </div>
      </div>
    </div>
  );
};
