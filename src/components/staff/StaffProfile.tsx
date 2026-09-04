import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  Shield,
  Edit2,
  KeyRound,
  Power,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Scale,
  Users,
  Briefcase,
  Layers,
  AlertCircle,
  Camera,
  Trash2,
  Check,
  X,
  Upload,
  Save
} from 'lucide-react';
import { api } from '../../services/api';
import { StaffProfile as StaffProfileType, Department } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { AadhaarSection } from './AadhaarSection';
import { Modal } from '../common/Modal';

interface StaffProfileProps {
  staffId: string;
  onBack: () => void;
  onOpenCRM?: (role: string, staff: StaffProfileType) => void;
}

export const StaffProfile: React.FC<StaffProfileProps> = ({ staffId, onBack, onOpenCRM }) => {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const [staff, setStaff] = useState<StaffProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managerTypes, setManagerTypes] = useState<any[]>([]);

  // Edit Form Fields
  const [editForm, setEditForm] = useState({
    name: '',
    emp_or_mgr_id: '',
    email: '',
    phone: '',
    department_id: '',
    designation: '',
    joining_date: '',
    employment_status: 'Active',
    manager_type_id: '',
    profile_image: '',
    aadhaar_number: '',
    aadhaar_front_doc: null as string | null,
    aadhaar_back_doc: null as string | null,
  });

  // Password Reset Modal State
  const [isResetPassOpen, setIsResetPassOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [staffId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getStaffProfile(staffId);
      setStaff(res.staff);
    } catch (err: any) {
      console.error('Failed to load staff profile:', err);
      setError(err.message || 'Failed to load staff profile');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = async () => {
    if (!staff) return;
    try {
      if (departments.length === 0 || managerTypes.length === 0) {
        const [deptsRes, mtRes] = await Promise.all([
          api.getDepartments().catch(() => ({ departments: [] })),
          api.getManagerTypes().catch(() => ({ types: [] })),
        ]);
        setDepartments(deptsRes.departments || []);
        const rawTypes = (mtRes as any).types || (mtRes as any).manager_types || [];
        setManagerTypes(rawTypes);
      }
    } catch (e) {
      console.warn('Dropdown prefetch error:', e);
    }

    let initialAadhaar = (staff as any).aadhaar_full || '';
    if (!initialAadhaar && staff.aadhaar_masked) {
      try {
        const rev = await api.revealAadhaar(staff.id);
        initialAadhaar = rev.aadhaar_number || '';
      } catch (e) {}
    }

    setEditForm({
      name: staff.name || '',
      emp_or_mgr_id: staff.emp_or_mgr_id || '',
      email: staff.email || '',
      phone: staff.phone || '',
      department_id: staff.department_id || '',
      designation: staff.designation || '',
      joining_date: staff.joining_date || '',
      employment_status: staff.employment_status || (staff.status === 'active' ? 'Active' : 'Inactive'),
      manager_type_id: staff.manager_type_id || '',
      profile_image: staff.profile_image || '',
      aadhaar_number: initialAadhaar,
      aadhaar_front_doc: null,
      aadhaar_back_doc: null,
    });

    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Profile picture size exceeds 5MB limit');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        setEditForm(prev => ({ ...prev, profile_image: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveProfileImage = () => {
    setEditForm(prev => ({ ...prev, profile_image: '' }));
  };

  const handleSaveEdit = async () => {
    if (!staff) return;
    if (!editForm.name.trim()) {
      alert('Staff name is required');
      return;
    }
    if (!editForm.email.trim()) {
      alert('Email address is required');
      return;
    }

    try {
      setSaving(true);
      const payload: any = {
        name: editForm.name.trim(),
        emp_or_mgr_id: editForm.emp_or_mgr_id.trim().toUpperCase(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        department_id: editForm.department_id || null,
        designation: editForm.designation.trim(),
        joining_date: editForm.joining_date || null,
        employment_status: editForm.employment_status,
        status: editForm.employment_status === 'Inactive' ? 'inactive' : 'active',
        manager_type_id: editForm.manager_type_id || null,
        profile_image: editForm.profile_image, // empty string clears in DB
      };

      if (editForm.aadhaar_number !== undefined) {
        payload.aadhaar_number = editForm.aadhaar_number.replace(/\s/g, '');
      }
      if (editForm.aadhaar_front_doc !== null) {
        payload.aadhaar_front_doc = editForm.aadhaar_front_doc;
      }
      if (editForm.aadhaar_back_doc !== null) {
        payload.aadhaar_back_doc = editForm.aadhaar_back_doc;
      }

      await api.updateStaff(staff.id, payload);
      // Immediately refresh and show updated info on this same page
      await fetchProfile();
      setIsEditing(false);
    } catch (err: any) {
      alert(`Failed to save changes: ${err.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!staff || !isAdmin) return;
    const newStatus = staff.status === 'active' ? 'inactive' : 'active';
    try {
      await api.updateStaffStatus(staff.id, newStatus);
      setStaff({ ...staff, status: newStatus as any });
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const handleResetPassword = async () => {
    if (!staff || !newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    setActionLoading(true);
    try {
      await api.resetStaffPassword(staff.id, newPassword);
      alert('Password reset successfully');
      setIsResetPassOpen(false);
      setNewPassword('');
    } catch (err: any) {
      alert(`Failed to reset password: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="text-xs text-slate-400 font-medium">Loading staff profile...</p>
        </div>
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="rounded-2xl bg-white p-8 border border-slate-200 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">Staff Profile Not Found</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">{error || 'Could not retrieve staff details.'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isStaffActive = staff.status === 'active' || staff.employment_status === 'Active';

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Bar Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={isEditing ? handleCancelEdit : onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{isEditing ? 'Cancel Edit' : 'Back to Staff Directory'}</span>
        </button>

        <div className="flex items-center gap-2">
          {onOpenCRM && !isEditing && (
            <button
              onClick={() => onOpenCRM(staff.role, staff)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Open in {staff.role === 'advocate' ? 'Advocate CRM' : staff.role === 'manager' ? 'Manager Panel' : 'Employee CRM'}</span>
            </button>
          )}

          {isAdmin && (
            <>
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5 text-slate-500" />
                    <span>Cancel</span>
                  </button>

                  <button
                    id="save-changes-btn"
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    id="edit-profile-btn"
                    onClick={handleStartEdit}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Edit Profile</span>
                  </button>

                  <button
                    onClick={() => setIsResetPassOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                  >
                    <KeyRound className="h-3.5 w-3.5 text-slate-500" />
                    <span>Reset Password</span>
                  </button>

                  <button
                    onClick={handleToggleStatus}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors border ${
                      staff.status === 'active'
                        ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    <Power className="h-3.5 w-3.5" />
                    <span>{staff.status === 'active' ? 'Deactivate' : 'Activate'}</span>
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* 1. Large Profile Header */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Profile Photo */}
          <div className="relative">
            <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-white shadow-md overflow-hidden flex items-center justify-center text-slate-400 relative">
              {isEditing ? (
                editForm.profile_image ? (
                  <img src={editForm.profile_image} alt={editForm.name || staff.name} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-14 w-14 text-slate-400" />
                )
              ) : staff.profile_image ? (
                <img src={staff.profile_image} alt={staff.name} className="h-full w-full object-cover" />
              ) : (
                <User className="h-14 w-14 text-slate-400" />
              )}

              {/* Edit Photo Overlay */}
              {isEditing && (
                <label
                  className="absolute inset-0 bg-black/55 hover:bg-black/65 text-white flex flex-col items-center justify-center opacity-90 transition-opacity cursor-pointer text-center p-1"
                  title="Upload or replace profile picture"
                >
                  <Camera className="h-5 w-5 mb-1 text-white" />
                  <span className="text-[10px] font-bold text-white leading-tight">
                    {editForm.profile_image ? 'Replace' : 'Upload'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfileImageUpload}
                  />
                </label>
              )}
            </div>

            {/* Remove photo button in edit mode */}
            {isEditing && editForm.profile_image && (
              <button
                type="button"
                onClick={handleRemoveProfileImage}
                title="Remove profile picture"
                className="absolute -top-2 -right-2 h-6 w-6 bg-rose-600 hover:bg-rose-500 text-white rounded-full flex items-center justify-center shadow-md border-2 border-white transition-colors z-10"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}

            {!isEditing && (
              <span
                className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-white ${
                  isStaffActive ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
                title={isStaffActive ? 'Active' : 'Inactive'}
              />
            )}
          </div>

          {/* Details */}
          <div className="flex-1 space-y-2">
            {isEditing ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Staff Full Name"
                      className="w-full text-lg sm:text-xl font-bold text-slate-900 border border-slate-300 rounded-xl px-3 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="w-36">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Staff ID
                    </label>
                    <input
                      type="text"
                      value={editForm.emp_or_mgr_id}
                      onChange={e => setEditForm({ ...editForm, emp_or_mgr_id: e.target.value })}
                      placeholder="EMP-XXXX"
                      className="w-full font-mono text-xs font-bold text-slate-800 border border-slate-300 rounded-xl px-2.5 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase"
                    />
                  </div>
                </div>

                <p className="text-xs text-slate-500">
                  You are editing this profile in real-time. Edit individual details in the cards below and click <strong className="text-emerald-700">Save Changes</strong>.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {staff.name}
                  </h1>
                  <span className="px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 font-mono text-xs font-bold text-slate-700">
                    {staff.emp_or_mgr_id || 'ID: ' + staff.id}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                      isStaffActive
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                        : 'bg-slate-100 border border-slate-200 text-slate-600'
                    }`}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    {staff.employment_status || (isStaffActive ? 'Active Staff' : 'Inactive')}
                  </span>
                </div>

                <p className="text-sm font-semibold text-slate-600">
                  {staff.designation || 'Staff Member'} • <span className="text-blue-600">{staff.department_name || 'General Department'}</span>
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    {staff.email}
                  </span>
                  {staff.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      {staff.phone}
                    </span>
                  )}
                  {staff.city && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {staff.city}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    Joined {staff.joining_date || 'N/A'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Split Grid: Staff Info & Verified Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Dark Navy Information Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 text-white shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold tracking-tight">EMPLOYEE INFORMATION & VERIFIED DOCUMENTS</h2>
                  <p className="text-xs text-slate-400">Centralized staff profile & credentials</p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                {isEditing ? 'Edit Mode Active' : staff.staff_type || staff.role}
              </span>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Email Address */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Email Address</span>
                {isEditing ? (
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full text-sm font-semibold text-white bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-400"
                    placeholder="email@example.com"
                  />
                ) : (
                  <p className="text-sm font-semibold text-white break-all">{staff.email}</p>
                )}
              </div>

              {/* Contact Phone */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Contact Phone</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full text-sm font-semibold text-white bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-400"
                    placeholder="+91 98765 43210"
                  />
                ) : (
                  <p className="text-sm font-semibold text-white">{staff.phone || '—'}</p>
                )}
              </div>

              {/* Department */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Department</span>
                {isEditing ? (
                  <select
                    value={editForm.department_id}
                    onChange={e => setEditForm({ ...editForm, department_id: e.target.value })}
                    className="w-full text-sm font-semibold text-white bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-400"
                  >
                    <option value="" className="bg-slate-900 text-white">Select Department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                        {d.name} {d.code ? `(${d.code})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm font-semibold text-white">{staff.department_name || '—'} {staff.department_code ? `(${staff.department_code})` : ''}</p>
                )}
              </div>

              {/* Designation */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Designation</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.designation}
                    onChange={e => setEditForm({ ...editForm, designation: e.target.value })}
                    className="w-full text-sm font-semibold text-white bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-400"
                    placeholder="e.g. Senior Debt Specialist"
                  />
                ) : (
                  <p className="text-sm font-semibold text-white">{staff.designation || 'Staff Member'}</p>
                )}
              </div>

              {/* Joining Date */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Joining Date</span>
                {isEditing ? (
                  <input
                    type="date"
                    value={editForm.joining_date}
                    onChange={e => setEditForm({ ...editForm, joining_date: e.target.value })}
                    className="w-full text-sm font-semibold text-white bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-400"
                  />
                ) : (
                  <p className="text-sm font-semibold text-white">{staff.joining_date || '—'}</p>
                )}
              </div>

              {/* Employment Status */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Employment Status</span>
                {isEditing ? (
                  <select
                    value={editForm.employment_status}
                    onChange={e => setEditForm({ ...editForm, employment_status: e.target.value })}
                    className="w-full text-sm font-semibold text-emerald-400 bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-400"
                  >
                    <option value="Active" className="bg-slate-900 text-emerald-400">Active</option>
                    <option value="Probation" className="bg-slate-900 text-amber-400">Probation</option>
                    <option value="Notice Period" className="bg-slate-900 text-orange-400">Notice Period</option>
                    <option value="Inactive" className="bg-slate-900 text-rose-400">Inactive</option>
                  </select>
                ) : (
                  <p className="text-sm font-semibold text-emerald-400">{staff.employment_status || staff.status || 'Active'}</p>
                )}
              </div>

              {/* Reporting Manager (Display) */}
              {staff.reporting_manager_name && !isEditing && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Reporting Manager</span>
                  <p className="text-sm font-semibold text-white">{staff.reporting_manager_name}</p>
                </div>
              )}

              {/* Manager Type (Editable if manager role or in edit mode) */}
              {(staff.role === 'manager' || staff.manager_type_name || isEditing) && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Manager Type</span>
                  {isEditing ? (
                    <select
                      value={editForm.manager_type_id}
                      onChange={e => setEditForm({ ...editForm, manager_type_id: e.target.value })}
                      className="w-full text-sm font-semibold text-white bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-400"
                    >
                      <option value="" className="bg-slate-900 text-white">General / None</option>
                      {managerTypes.map(mt => (
                        <option key={mt.id} value={mt.id} className="bg-slate-900 text-white">
                          {mt.name} ({mt.code})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm font-semibold text-white">
                      {staff.manager_type_name ? `${staff.manager_type_name} (${staff.manager_type_code})` : '—'}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Extended Personal Details (Non-edit read only) */}
            {(staff.date_of_birth || staff.father_name || staff.mother_name || staff.gender) && (
              <div className="border-t border-slate-800 pt-6 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Personal Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  {staff.date_of_birth && (
                    <div>
                      <span className="text-slate-400 block text-[10px]">Date of Birth</span>
                      <span className="font-semibold text-slate-200">{staff.date_of_birth}</span>
                    </div>
                  )}
                  {staff.gender && (
                    <div>
                      <span className="text-slate-400 block text-[10px]">Gender</span>
                      <span className="font-semibold text-slate-200">{staff.gender}</span>
                    </div>
                  )}
                  {staff.father_name && (
                    <div>
                      <span className="text-slate-400 block text-[10px]">Father's Name</span>
                      <span className="font-semibold text-slate-200">{staff.father_name}</span>
                    </div>
                  )}
                  {staff.mother_name && (
                    <div>
                      <span className="text-slate-400 block text-[10px]">Mother's Name</span>
                      <span className="font-semibold text-slate-200">{staff.mother_name}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Address Details */}
            {(staff.current_address || staff.permanent_address || staff.city || staff.state) && (
              <div className="border-t border-slate-800 pt-6 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Address Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {staff.current_address && (
                    <div>
                      <span className="text-slate-400 block text-[10px]">Current Address</span>
                      <span className="font-semibold text-slate-200">{staff.current_address}</span>
                    </div>
                  )}
                  {staff.permanent_address && (
                    <div>
                      <span className="text-slate-400 block text-[10px]">Permanent Address</span>
                      <span className="font-semibold text-slate-200">{staff.permanent_address}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Advocate Details if present */}
            {(staff.role === 'advocate' || staff.staff_type === 'Advocate' || staff.registration_number) && (
              <div className="border-t border-slate-800 pt-6 space-y-4">
                <div className="flex items-center gap-2 text-purple-400">
                  <Scale className="h-4 w-4" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">Advocate Legal Details</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Bar Council / Registration No.</span>
                    <span className="font-mono font-bold text-white">{staff.registration_number || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Enrollment State / Council</span>
                    <span className="font-semibold text-slate-200">{staff.bar_council_state || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Legal Specialization</span>
                    <span className="font-semibold text-slate-200">{staff.specialization || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Experience</span>
                    <span className="font-semibold text-slate-200">{staff.years_experience ? `${staff.years_experience} Years` : '—'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Aadhaar KYC & Documents */}
        <div className="space-y-6">
          <AadhaarSection
            staffId={staff.id}
            maskedAadhaar={staff.aadhaar_masked}
            fullAadhaarInitial={(staff as any).aadhaar_full}
            kycStatus={staff.kyc_status || staff.kyc_meta?.kyc_status || 'pending'}
            hasFront={staff.kyc_meta ? staff.kyc_meta.has_front : false}
            hasBack={staff.kyc_meta ? staff.kyc_meta.has_back : false}
            isEditing={isEditing}
            editAadhaarNumber={editForm.aadhaar_number}
            editFrontDoc={editForm.aadhaar_front_doc}
            editBackDoc={editForm.aadhaar_back_doc}
            onAadhaarNumberChange={(num) => setEditForm(prev => ({ ...prev, aadhaar_number: num }))}
            onFrontDocChange={(doc) => setEditForm(prev => ({ ...prev, aadhaar_front_doc: doc }))}
            onBackDocChange={(doc) => setEditForm(prev => ({ ...prev, aadhaar_back_doc: doc }))}
          />
        </div>
      </div>

      {/* Reset Password Modal */}
      <Modal
        isOpen={isResetPassOpen}
        onClose={() => setIsResetPassOpen(false)}
        title={`Reset Password — ${staff.name}`}
      >
        <div className="space-y-4 p-2">
          <p className="text-xs text-slate-500">
            Set a new temporary or permanent password for this staff account.
          </p>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 focus:border-blue-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsResetPassOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleResetPassword}
              disabled={actionLoading}
              className="px-4 py-2 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {actionLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
