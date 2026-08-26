import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  User,
  Phone,
  Mail,
  Building2,
  Shield,
  Upload,
  Lock,
  Calendar,
  MapPin,
  Scale,
  FileCheck,
  X,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';
import { api } from '../../services/api';
import { Department, ManagerType, User as UserType } from '../../types';

interface CreateStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultStaffType?: 'Employee' | 'Manager' | 'Advocate' | 'Consultant' | 'Other Staff';
}

export const CreateStaffModal: React.FC<CreateStaffModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultStaffType = 'Employee'
}) => {
  const [activeTab, setActiveTab] = useState<'personal' | 'contact' | 'professional' | 'kyc' | 'login'>('personal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<UserType[]>([]);
  const [managerTypes, setManagerTypes] = useState<ManagerType[]>([]);

  const getInitialRole = (type: string) => {
    if (type === 'Manager') return 'manager';
    if (type === 'Advocate') return 'advocate';
    return 'employee';
  };

  // Form State
  const [formData, setFormData] = useState({
    // A. Personal
    name: '',
    profile_image: '',
    date_of_birth: '',
    gender: 'Male',
    father_name: '',
    mother_name: '',

    // B. Contact
    email: '',
    phone: '',
    alt_phone: '',
    whatsapp_number: '',
    current_address: '',
    permanent_address: '',
    city: '',
    state: '',
    pin_code: '',

    // C. Professional
    staff_type: defaultStaffType,
    department_id: '',
    designation: '',
    emp_or_mgr_id: '',
    joining_date: new Date().toISOString().split('T')[0],
    employment_status: 'Active' as 'Active' | 'Inactive' | 'Suspended' | 'Resigned',
    manager_id: '',
    reporting_manager_id: '',
    manager_type_id: '',
    // Advocate details
    registration_number: '',
    bar_council_state: '',
    specialization: '',
    years_experience: 0,

    // D. Aadhaar KYC
    aadhaar_number: '',
    aadhaar_front_doc: '',
    aadhaar_back_doc: '',

    // E. Login
    role: getInitialRole(defaultStaffType) as 'admin' | 'manager' | 'employee' | 'advocate',
    password: '',
    confirm_password: ''
  });

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDependencies();
      setError(null);
      setActiveTab('personal');
      setFormData(prev => ({
        ...prev,
        name: '',
        profile_image: '',
        date_of_birth: '',
        gender: 'Male',
        father_name: '',
        mother_name: '',
        email: '',
        phone: '',
        alt_phone: '',
        whatsapp_number: '',
        current_address: '',
        permanent_address: '',
        city: '',
        state: '',
        pin_code: '',
        staff_type: defaultStaffType,
        designation: '',
        emp_or_mgr_id: '',
        joining_date: new Date().toISOString().split('T')[0],
        employment_status: 'Active',
        manager_id: '',
        reporting_manager_id: '',
        manager_type_id: '',
        registration_number: '',
        bar_council_state: '',
        specialization: '',
        years_experience: 0,
        aadhaar_number: '',
        aadhaar_front_doc: '',
        aadhaar_back_doc: '',
        role: getInitialRole(defaultStaffType) as any,
        password: '',
        confirm_password: ''
      }));
    }
  }, [isOpen, defaultStaffType]);

  const loadDependencies = async () => {
    try {
      const [deptRes, mgrRes, mtRes] = await Promise.allSettled([
        api.getDepartments(),
        api.getManagers(),
        api.getManagerTypes()
      ]);

      if (deptRes.status === 'fulfilled' && deptRes.value?.departments) {
        setDepartments(deptRes.value.departments);
        if (deptRes.value.departments.length > 0 && !formData.department_id) {
          setFormData(prev => ({ ...prev, department_id: deptRes.value.departments[0].id }));
        }
      }
      if (mgrRes.status === 'fulfilled' && mgrRes.value?.managers) {
        setManagers(mgrRes.value.managers);
      }
      if (mtRes.status === 'fulfilled' && mtRes.value?.types) {
        setManagerTypes(mtRes.value.types);
      }
    } catch (e) {
      console.error('Error loading staff dropdowns:', e);
    }
  };

  const handleStaffTypeChange = (type: 'Employee' | 'Manager' | 'Advocate' | 'Consultant' | 'Other Staff') => {
    let role: 'admin' | 'manager' | 'employee' | 'advocate' = 'employee';
    if (type === 'Manager') role = 'manager';
    else if (type === 'Advocate') role = 'advocate';

    setFormData(prev => ({
      ...prev,
      staff_type: type,
      role
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'profile_image' | 'aadhaar_front_doc' | 'aadhaar_back_doc') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          [field]: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    if (!formData.name.trim()) return 'Full Name is required';
    if (!formData.date_of_birth) return 'Date of Birth is required';
    if (!formData.email.trim()) return 'Email Address is required';
    if (!formData.phone.trim()) return 'Primary Phone is required';
    if (!formData.department_id) return 'Department is required';
    if (!formData.designation.trim()) return 'Designation is required';
    if (!formData.joining_date) return 'Joining Date is required';

    if (formData.password) {
      if (formData.password.length < 6) return 'Password must be at least 6 characters';
      if (formData.password !== formData.confirm_password) return 'Passwords do not match';
    }

    if (formData.aadhaar_number) {
      const cleanAadhaar = formData.aadhaar_number.replace(/\s/g, '');
      if (cleanAadhaar.length !== 12 || !/^\d+$/.test(cleanAadhaar)) {
        return 'Aadhaar Number must be a valid 12-digit number';
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valError = validate();
    if (valError) {
      setError(valError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: Record<string, any> = {
        name: formData.name.trim(),
        profile_image: formData.profile_image || null,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        father_name: formData.father_name.trim() || null,
        mother_name: formData.mother_name.trim() || null,

        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        alt_phone: formData.alt_phone.trim() || null,
        whatsapp_number: formData.whatsapp_number.trim() || null,
        current_address: formData.current_address.trim() || null,
        permanent_address: formData.permanent_address.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        pin_code: formData.pin_code.trim() || null,

        staff_type: formData.staff_type,
        department_id: formData.department_id || null,
        designation: formData.designation.trim(),
        emp_or_mgr_id: formData.emp_or_mgr_id.trim().toUpperCase() || undefined,
        joining_date: formData.joining_date,
        employment_status: formData.employment_status,
        manager_id: formData.manager_id || null,
        reporting_manager_id: formData.reporting_manager_id || formData.manager_id || null,
        manager_type_id: formData.staff_type === 'Manager' ? formData.manager_type_id || null : null,

        role: formData.role,
        password: formData.password || 'Staff@123456',

        aadhaar_number: formData.aadhaar_number.trim() || null,
        aadhaar_front_doc: formData.aadhaar_front_doc || null,
        aadhaar_back_doc: formData.aadhaar_back_doc || null
      };

      if (formData.staff_type === 'Advocate' || formData.role === 'advocate') {
        payload.registration_number = formData.registration_number.trim() || null;
        payload.bar_council_state = formData.bar_council_state.trim() || null;
        payload.specialization = formData.specialization.trim() || null;
        payload.years_experience = Number(formData.years_experience) || 0;
      }

      await api.createStaff(payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create staff member');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/30 border border-blue-500/30 text-blue-400">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Create Staff Profile</h2>
              <p className="text-xs text-slate-400">Add Employee, Manager, Advocate, Consultant or Other Staff</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 overflow-x-auto">
          {[
            { id: 'personal', label: 'A. Personal Details', icon: User },
            { id: 'contact', label: 'B. Contact Details', icon: Phone },
            { id: 'professional', label: 'C. Professional', icon: Building2 },
            { id: 'kyc', label: 'D. Aadhaar KYC', icon: Shield },
            { id: 'login', label: 'E. Login / Account', icon: Lock }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 border-b-2 px-4 py-3 text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-blue-600 text-blue-700 bg-white shadow-xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 max-h-[65vh] overflow-y-auto space-y-6">
            {error && (
              <div className="flex items-center space-x-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* TAB A: Personal Details */}
            {activeTab === 'personal' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-6">
                  {/* Photo Upload */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative h-24 w-24 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                      {formData.profile_image ? (
                        <img src={formData.profile_image} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-10 w-10 text-slate-400" />
                      )}
                    </div>
                    <label className="cursor-pointer text-[11px] font-bold text-blue-600 hover:text-blue-700">
                      Upload Photo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => handleFileUpload(e, 'profile_image')}
                      />
                    </label>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Vikram Mehta"
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Date of Birth <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.date_of_birth}
                        onChange={e => setFormData({ ...formData, date_of_birth: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                      <select
                        value={formData.gender}
                        onChange={e => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Father's Name</label>
                      <input
                        type="text"
                        value={formData.father_name}
                        onChange={e => setFormData({ ...formData, father_name: e.target.value })}
                        placeholder="e.g. Rajesh Mehta"
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Mother's Name</label>
                      <input
                        type="text"
                        value={formData.mother_name}
                        onChange={e => setFormData({ ...formData, mother_name: e.target.value })}
                        placeholder="e.g. Sunita Mehta"
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB B: Contact Details */}
            {activeTab === 'contact' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="vikram.mehta@settlexpert.com"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Primary Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Alternate Phone</label>
                  <input
                    type="tel"
                    value={formData.alt_phone}
                    onChange={e => setFormData({ ...formData, alt_phone: e.target.value })}
                    placeholder="+91 91234 56789"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Number</label>
                  <input
                    type="tel"
                    value={formData.whatsapp_number}
                    onChange={e => setFormData({ ...formData, whatsapp_number: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Current Address</label>
                  <textarea
                    rows={2}
                    value={formData.current_address}
                    onChange={e => setFormData({ ...formData, current_address: e.target.value })}
                    placeholder="House/Flat No., Street, Area"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Permanent Address</label>
                  <textarea
                    rows={2}
                    value={formData.permanent_address}
                    onChange={e => setFormData({ ...formData, permanent_address: e.target.value })}
                    placeholder="Permanent residential address"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Mumbai"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                    placeholder="e.g. Maharashtra"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">PIN Code</label>
                  <input
                    type="text"
                    value={formData.pin_code}
                    onChange={e => setFormData({ ...formData, pin_code: e.target.value })}
                    placeholder="400001"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* TAB C: Professional Details */}
            {activeTab === 'professional' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Staff Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.staff_type}
                    onChange={e => handleStaffTypeChange(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-semibold"
                  >
                    <option value="Employee">Employee</option>
                    <option value="Manager">Manager</option>
                    <option value="Advocate">Advocate</option>
                    <option value="Consultant">Consultant</option>
                    <option value="Other Staff">Other Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Department <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.department_id}
                    onChange={e => setFormData({ ...formData, department_id: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select Department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Designation <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.designation}
                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g. Senior Debt Specialist"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Staff ID <span className="text-slate-400 font-normal">(Leave blank to auto-generate)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.emp_or_mgr_id}
                    onChange={e => setFormData({ ...formData, emp_or_mgr_id: e.target.value.toUpperCase() })}
                    placeholder="EMP-010 or auto-generated"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-mono text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Joining Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.joining_date}
                    onChange={e => setFormData({ ...formData, joining_date: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Employment Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.employment_status}
                    onChange={e => setFormData({ ...formData, employment_status: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Resigned">Resigned</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reporting Manager</label>
                  <select
                    value={formData.manager_id}
                    onChange={e => setFormData({ ...formData, manager_id: e.target.value, reporting_manager_id: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select Manager (Optional)</option>
                    {managers.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.emp_or_mgr_id || 'Manager'})</option>
                    ))}
                  </select>
                </div>

                {formData.staff_type === 'Manager' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Manager Type</label>
                    <select
                      value={formData.manager_type_id}
                      onChange={e => setFormData({ ...formData, manager_type_id: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select Manager Type</option>
                      {managerTypes.map(mt => (
                        <option key={mt.id} value={mt.id}>{mt.name} ({mt.code})</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Advocate specific fields */}
                {(formData.staff_type === 'Advocate' || formData.role === 'advocate') && (
                  <div className="md:col-span-2 rounded-xl bg-purple-50/60 border border-purple-200 p-4 space-y-3 mt-2">
                    <div className="flex items-center space-x-2 text-purple-800 font-bold text-xs">
                      <Scale className="h-4 w-4" />
                      <span>Advocate Legal Credentials</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Registration / Bar Council No.</label>
                        <input
                          type="text"
                          value={formData.registration_number}
                          onChange={e => setFormData({ ...formData, registration_number: e.target.value })}
                          placeholder="e.g. MAH/1234/2018"
                          className="w-full rounded-lg border border-purple-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Bar Council / State</label>
                        <input
                          type="text"
                          value={formData.bar_council_state}
                          onChange={e => setFormData({ ...formData, bar_council_state: e.target.value })}
                          placeholder="e.g. Bar Council of Maharashtra & Goa"
                          className="w-full rounded-lg border border-purple-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Legal Specialization</label>
                        <input
                          type="text"
                          value={formData.specialization}
                          onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                          placeholder="e.g. Banking & Debt Settlement"
                          className="w-full rounded-lg border border-purple-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Years of Experience</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.years_experience}
                          onChange={e => setFormData({ ...formData, years_experience: parseInt(e.target.value) || 0 })}
                          className="w-full rounded-lg border border-purple-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB D: Aadhaar KYC (ZERO PAN FIELDS) */}
            {activeTab === 'kyc' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                  <div className="flex items-center space-x-2 text-amber-800 text-xs font-bold mb-1">
                    <Shield className="h-4 w-4" />
                    <span>Government Identity Verification (Aadhaar Only)</span>
                  </div>
                  <p className="text-[11px] text-amber-700">
                    Aadhaar number will be stored securely and masked (XXXX XXXX 1234) across normal views. Only authorized Admin can reveal the full number.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Aadhaar Number (12 Digits)
                  </label>
                  <input
                    type="text"
                    maxLength={14}
                    value={formData.aadhaar_number}
                    onChange={e => setFormData({ ...formData, aadhaar_number: e.target.value })}
                    placeholder="1234 5678 9012"
                    className="w-full max-w-md rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-mono tracking-widest text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Aadhaar Front */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 flex flex-col items-center justify-center text-center">
                    <label className="block text-xs font-bold text-slate-700 mb-2">Aadhaar Front Image</label>
                    <div className="relative h-32 w-full max-w-[240px] rounded-xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden mb-2">
                      {formData.aadhaar_front_doc ? (
                        <img src={formData.aadhaar_front_doc} alt="Aadhaar Front" className="h-full w-full object-contain p-1" />
                      ) : (
                        <div className="text-slate-400 flex flex-col items-center">
                          <Upload className="h-6 w-6 mb-1" />
                          <span className="text-[10px]">No Front Image</span>
                        </div>
                      )}
                    </div>
                    <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition-colors">
                      Choose Front Image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => handleFileUpload(e, 'aadhaar_front_doc')}
                      />
                    </label>
                  </div>

                  {/* Aadhaar Back */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 flex flex-col items-center justify-center text-center">
                    <label className="block text-xs font-bold text-slate-700 mb-2">Aadhaar Back Image</label>
                    <div className="relative h-32 w-full max-w-[240px] rounded-xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden mb-2">
                      {formData.aadhaar_back_doc ? (
                        <img src={formData.aadhaar_back_doc} alt="Aadhaar Back" className="h-full w-full object-contain p-1" />
                      ) : (
                        <div className="text-slate-400 flex flex-col items-center">
                          <Upload className="h-6 w-6 mb-1" />
                          <span className="text-[10px]">No Back Image</span>
                        </div>
                      )}
                    </div>
                    <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition-colors">
                      Choose Back Image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => handleFileUpload(e, 'aadhaar_back_doc')}
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* TAB E: Login / Account */}
            {activeTab === 'login' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Login Email (Matches Contact Email) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@settlexpert.com"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    System Role <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-semibold"
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="advocate">Advocate</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password <span className="text-slate-400 font-normal">(Default: Staff@123456)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter custom password or use default"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 pr-10 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={formData.confirm_password}
                    onChange={e => setFormData({ ...formData, confirm_password: e.target.value })}
                    placeholder="Re-type password if customized"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
            <div className="flex items-center gap-2">
              {activeTab !== 'personal' && (
                <button
                  type="button"
                  onClick={() => {
                    const tabs: Array<'personal' | 'contact' | 'professional' | 'kyc' | 'login'> = [
                      'personal', 'contact', 'professional', 'kyc', 'login'
                    ];
                    const idx = tabs.indexOf(activeTab);
                    if (idx > 0) setActiveTab(tabs[idx - 1]);
                  }}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Previous Step
                </button>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>

              {activeTab !== 'login' ? (
                <button
                  type="button"
                  onClick={() => {
                    const tabs: Array<'personal' | 'contact' | 'professional' | 'kyc' | 'login'> = [
                      'personal', 'contact', 'professional', 'kyc', 'login'
                    ];
                    const idx = tabs.indexOf(activeTab);
                    if (idx < tabs.length - 1) setActiveTab(tabs[idx + 1]);
                  }}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-500 transition-colors shadow-sm"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-emerald-600 px-6 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-sm disabled:opacity-50"
                >
                  {loading ? 'Creating Staff Member...' : 'Create Staff Member'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

