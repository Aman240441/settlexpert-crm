import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Power,
  ExternalLink,
  Shield,
  Building2,
  Phone,
  Mail,
  Scale,
  Briefcase,
  UserCheck,
  CheckCircle2,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';
import { StaffProfile as StaffProfileType, Department } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { CreateStaffModal } from './CreateStaffModal';
import { StaffProfile } from './StaffProfile';

interface StaffDirectoryProps {
  onOpenCRM?: (role: string, staff: StaffProfileType) => void;
}

export const StaffDirectory: React.FC<StaffDirectoryProps> = ({ onOpenCRM }) => {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const [staffList, setStaffList] = useState<StaffProfileType[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    fetchStaff();
    loadDepartments();
  }, [search, selectedType, selectedDept, selectedStatus]);

  const loadDepartments = async () => {
    try {
      const res = await api.getDepartments();
      if (res?.departments) setDepartments(res.departments);
    } catch (e) {
      console.error('Error fetching departments:', e);
    }
  };

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (selectedType) params.staff_type = selectedType;
      if (selectedDept) params.department = selectedDept;
      if (selectedStatus) params.status = selectedStatus;

      const res = await api.getStaffDirectory(params);
      setStaffList(res.staff || []);
    } catch (err) {
      console.error('Error fetching staff directory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (staff: StaffProfileType) => {
    if (!isAdmin) return;
    const newStatus = staff.status === 'active' ? 'inactive' : 'active';
    try {
      await api.updateStaffStatus(staff.id, newStatus);
      setStaffList(prev =>
        prev.map(s => (s.id === staff.id ? { ...s, status: newStatus as any } : s))
      );
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  // If viewing a specific profile, render StaffProfile subcomponent
  if (selectedStaffId) {
    return (
      <StaffProfile
        staffId={selectedStaffId}
        onBack={() => {
          setSelectedStaffId(null);
          fetchStaff();
        }}
        onOpenCRM={onOpenCRM}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Banner & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 text-xs font-bold uppercase tracking-wider">
              Centralized Directory
            </span>
            <span className="text-xs text-slate-400">• Aadhaar KYC Protected</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Staff Directory & KYC Management
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Unified directory of all workforce members (Employees, Managers, Advocates, Consultants & Staff) with RBAC access control.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStaff}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {isAdmin && (
            <button
              id="create-staff-btn"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20"
            >
              <Plus className="h-4 w-4" />
              <span>Create Staff Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, ID, phone..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Staff Type */}
        <select
          value={selectedType}
          onChange={e => setSelectedType(e.target.value)}
          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 focus:bg-white focus:border-blue-500"
        >
          <option value="">All Staff Types</option>
          <option value="Employee">Employee</option>
          <option value="Manager">Manager</option>
          <option value="Advocate">Advocate</option>
          <option value="Consultant">Consultant</option>
          <option value="Other Staff">Other Staff</option>
        </select>

        {/* Department */}
        <select
          value={selectedDept}
          onChange={e => setSelectedDept(e.target.value)}
          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 focus:bg-white focus:border-blue-500"
        >
          <option value="">All Departments</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
          ))}
        </select>

        {/* Status */}
        <select
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 focus:bg-white focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              <p className="text-xs text-slate-400 font-medium">Loading staff records...</p>
            </div>
          </div>
        ) : staffList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">No Staff Members Found</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              Try adjusting your search criteria or create a new staff profile.
            </p>
            {isAdmin && (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-500"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Staff Member</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Staff Member</th>
                  <th className="px-4 py-4">Staff ID</th>
                  <th className="px-4 py-4">Type / Role</th>
                  <th className="px-4 py-4">Department & Designation</th>
                  <th className="px-4 py-4">Contact</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.map(s => {
                  const isActive = s.status === 'active';
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Member Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-slate-400">
                            {s.profile_image ? (
                              <img src={s.profile_image} alt={s.name} className="h-full w-full object-cover" />
                            ) : (
                              <span className="font-bold text-sm text-slate-600">{s.name.charAt(0)}</span>
                            )}
                          </div>
                          <div>
                            <p
                              onClick={() => setSelectedStaffId(s.id)}
                              className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer text-xs"
                            >
                              {s.name}
                            </p>
                            <p className="text-[11px] text-slate-400">{s.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Staff ID */}
                      <td className="px-4 py-4 font-mono font-bold text-slate-700 text-xs">
                        {s.emp_or_mgr_id || s.id}
                      </td>

                      {/* Staff Type */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            s.role === 'advocate' || s.staff_type === 'Advocate'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : s.role === 'manager' || s.staff_type === 'Manager'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {s.staff_type || s.role}
                        </span>
                      </td>

                      {/* Department & Designation */}
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-800">{s.designation || 'Staff Member'}</p>
                        <p className="text-[11px] text-slate-400">{s.department_name || 'General'}</p>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-4 space-y-0.5">
                        <p className="font-medium text-slate-700">{s.phone || '—'}</p>
                        {s.city && <p className="text-[10px] text-slate-400">{s.city}</p>}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedStaffId(s.id)}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                            title="View Profile"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {onOpenCRM && (
                            <button
                              onClick={() => onOpenCRM(s.role, s)}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Open in CRM"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </button>
                          )}

                          {isAdmin && (
                            <button
                              onClick={() => handleToggleStatus(s)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isActive
                                  ? 'text-rose-600 hover:bg-rose-50'
                                  : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={isActive ? 'Deactivate' : 'Activate'}
                            >
                              <Power className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Staff Modal */}
      <CreateStaffModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          fetchStaff();
        }}
      />
    </div>
  );
};

