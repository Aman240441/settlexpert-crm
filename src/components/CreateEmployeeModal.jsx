import React, { useState, useEffect, useRef } from 'react';
import {
  X, Eye, EyeOff, RefreshCw, UserPlus, UserCheck, Upload,
  Trash2, ShieldCheck, Image as ImageIcon, CheckCircle2,
  FileCheck, AlertCircle, Sparkles, Camera
} from 'lucide-react';

function generatePassword(length = 12) {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '@#$!%&*';
  const all = upper + lower + digits + special;

  let pw = '';
  pw += upper[Math.floor(Math.random() * upper.length)];
  pw += lower[Math.floor(Math.random() * lower.length)];
  pw += digits[Math.floor(Math.random() * digits.length)];
  pw += special[Math.floor(Math.random() * special.length)];
  for (let i = 4; i < length; i++) {
    pw += all[Math.floor(Math.random() * all.length)];
  }
  return pw.split('').sort(() => Math.random() - 0.5).join('');
}

// Format 12-digit Aadhaar as 1234 5678 9012
function formatAadhaarInput(val) {
  if (!val) return '';
  const digits = String(val).replace(/\D/g, '').slice(0, 12);
  const parts = [];
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }
  return parts.join(' ');
}

export default function CreateEmployeeModal({ isOpen, onClose, onSave, employee = null }) {
  const isEdit = Boolean(employee && employee.id);

  const [form, setForm] = useState({
    name: '',
    employee_id: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    joining_date: '',
    employment_status: 'active',
    aadhaar_number: '',
    password: '',
    confirmPassword: '',
    changePassword: false
  });

  const [profilePhoto, setProfilePhoto] = useState('');
  const [aadhaarFront, setAadhaarFront] = useState('');
  const [aadhaarBack, setAadhaarBack] = useState('');

  const [removePhoto, setRemovePhoto] = useState(false);
  const [removeFrontDoc, setRemoveFrontDoc] = useState(false);
  const [removeBackDoc, setRemoveBackDoc] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showAadhaarNumber, setShowAadhaarNumber] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const profileInputRef = useRef(null);
  const frontInputRef = useRef(null);
  const backInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    if (employee && employee.id) {
      // Edit mode: populate existing values
      setForm({
        name: employee.name || '',
        employee_id: employee.employee_id || '',
        email: employee.email || '',
        phone: employee.phone || '',
        department: employee.department || '',
        designation: employee.designation || '',
        joining_date: employee.joining_date || new Date().toISOString().split('T')[0],
        employment_status: employee.employment_status || employee.status || 'active',
        aadhaar_number: employee.aadhaar_number || '',
        password: '',
        confirmPassword: '',
        changePassword: false
      });
      setProfilePhoto(employee.profile_photo || '');
      setAadhaarFront(employee.aadhaar_front_document || '');
      setAadhaarBack(employee.aadhaar_back_document || '');
      setRemovePhoto(false);
      setRemoveFrontDoc(false);
      setRemoveBackDoc(false);
      setShowAadhaarNumber(false);
      setError('');

      // If in edit mode, fetch full unmasked Aadhaar if available
      fetchAadhaarDetails(employee.id);
    } else {
      // Create mode
      const nowStr = new Date().toISOString().split('T')[0];
      setForm({
        name: '',
        employee_id: '',
        email: '',
        phone: '',
        department: '',
        designation: '',
        joining_date: nowStr,
        employment_status: 'active',
        aadhaar_number: '',
        password: '',
        confirmPassword: '',
        changePassword: false
      });
      setProfilePhoto('');
      setAadhaarFront('');
      setAadhaarBack('');
      setRemovePhoto(false);
      setRemoveFrontDoc(false);
      setRemoveBackDoc(false);
      setShowAadhaarNumber(false);
      setError('');
    }
  }, [isOpen, employee]);

  const fetchAadhaarDetails = async (empId) => {
    try {
      const token = localStorage.getItem('crm_token');
      const res = await fetch(`/api/admin/employees/${empId}/aadhaar`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const d = await res.json();
        if (d.aadhaar_number) {
          setForm(prev => ({ ...prev, aadhaar_number: formatAadhaarInput(d.aadhaar_number) }));
        }
        if (d.aadhaar_front_document) {
          setAadhaarFront(d.aadhaar_front_document);
        }
        if (d.aadhaar_back_document) {
          setAadhaarBack(d.aadhaar_back_document);
        }
      }
    } catch (err) {
      console.error('Fetch Aadhaar details error:', err);
    }
  };

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleAadhaarChange = (e) => {
    const raw = e.target.value;
    const formatted = formatAadhaarInput(raw);
    setForm(prev => ({ ...prev, aadhaar_number: formatted }));
    setError('');
  };

  const handleFileUpload = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setError('Please upload a valid image (JPG, JPEG, PNG, or WEBP)');
      return;
    }

    // Validate size (max 15MB)
    if (file.size > 15 * 1024 * 1024) {
      setError('Image file size must be less than 15MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (type === 'profile') {
        setProfilePhoto(result);
        setRemovePhoto(false);
      } else if (type === 'front') {
        setAadhaarFront(result);
        setRemoveFrontDoc(false);
      } else if (type === 'back') {
        setAadhaarBack(result);
        setRemoveBackDoc(false);
      }
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = () => {
    const pw = generatePassword();
    setForm(prev => ({ ...prev, password: pw, confirmPassword: pw }));
    setShowPassword(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Required Field Validations
    if (!form.name.trim()) { setError('Full Name is required'); return; }
    if (!form.employee_id.trim()) { setError('Employee ID is required'); return; }
    if (!form.email.trim()) { setError('Email is required'); return; }
    if (!form.phone.trim()) { setError('Mobile Number is required'); return; }
    if (!form.department.trim()) { setError('Department is required'); return; }
    if (!form.designation.trim()) { setError('Designation is required'); return; }

    // Password validation for Create mode or if Change Password checked
    if (!isEdit) {
      if (!form.password) { setError('Password is required'); return; }
      if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
      if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    } else if (form.changePassword) {
      if (!form.password) { setError('New password is required'); return; }
      if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
      if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    }

    // Aadhaar Validation if provided
    const cleanAadhaar = form.aadhaar_number.replace(/\D/g, '');
    if (cleanAadhaar && cleanAadhaar.length !== 12) {
      setError('Aadhaar Number must be exactly 12 numeric digits');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('crm_token');
      const url = isEdit ? `/api/admin/employees/${employee.id}` : '/api/admin/employees';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        name: form.name.trim(),
        employee_id: form.employee_id.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        department: form.department.trim(),
        designation: form.designation.trim(),
        joining_date: form.joining_date || new Date().toISOString().split('T')[0],
        employment_status: form.employment_status,
        aadhaar_number: cleanAadhaar || '',
        profile_photo: profilePhoto || '',
        aadhaar_front_document: aadhaarFront || '',
        aadhaar_back_document: aadhaarBack || '',
        remove_profile_photo: removePhoto,
        remove_aadhaar_front: removeFrontDoc,
        remove_aadhaar_back: removeBackDoc
      };

      if (!isEdit) {
        payload.password = form.password;
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save employee profile');

      // If editing and password change was requested
      if (isEdit && form.changePassword && form.password) {
        await fetch(`/api/admin/employees/${employee.id}/password`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ password: form.password })
        });
      }

      onSave(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" style={{ maxWidth: '780px', width: '92vw', maxHeight: '92vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="admin-modal-header" style={{ position: 'sticky', top: 0, zIndex: 10, background: '#1e293b' }}>
          <div className="admin-modal-header-left">
            {isEdit ? <UserCheck size={20} color="#38bdf8" /> : <UserPlus size={20} color="#22c55e" />}
            <div>
              <h3 style={{ margin: 0 }}>{isEdit ? `Edit Employee Profile — ${employee.name}` : 'Create New Employee'}</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                {isEdit ? 'Update employee information, profile photo, and Aadhaar documents' : 'Add employee credentials, profile photo, and Aadhaar KYC details'}
              </p>
            </div>
          </div>
          <button className="admin-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {error && (
          <div className="admin-modal-error" style={{ margin: '16px 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-modal-form" style={{ padding: '20px' }}>
          {/* SECTION 1: PROFILE PHOTO UPLOAD */}
          <div className="admin-form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Camera size={16} color="#38bdf8" />
            <span>Profile Photo</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
            {/* Avatar Preview */}
            <div style={{ position: 'relative', width: '76px', height: '76px', borderRadius: '50%', background: '#1e293b', border: '2px solid #38bdf8', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {profilePhoto && !removePhoto ? (
                <img src={profilePhoto} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '26px', fontWeight: 800, color: '#94a3b8' }}>
                  {form.name ? form.name.charAt(0).toUpperCase() : 'SE'}
                </span>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                <input
                  type="file"
                  ref={profileInputRef}
                  style={{ display: 'none' }}
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={(e) => handleFileUpload(e, 'profile')}
                />
                <button
                  type="button"
                  className="admin-btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => profileInputRef.current?.click()}
                >
                  <Upload size={14} />
                  <span>{profilePhoto && !removePhoto ? 'Replace Photo' : 'Upload Photo'}</span>
                </button>

                {profilePhoto && !removePhoto && (
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 12px', color: '#f87171', borderColor: 'rgba(248,113,113,0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => {
                      setProfilePhoto('');
                      setRemovePhoto(true);
                    }}
                  >
                    <Trash2 size={14} />
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>
              <small style={{ color: '#64748b', fontSize: '11.5px' }}>Supported formats: JPG, JPEG, PNG, WEBP (Max 15MB)</small>
            </div>
          </div>

          {/* SECTION 2: BASIC INFORMATION */}
          <div className="admin-form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={16} color="#22c55e" />
            <span>Basic Information</span>
          </div>

          <div className="admin-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <div className="admin-form-group">
              <label>Full Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => handleChange('name', e.target.value)}
                placeholder="e.g. Alok Sharma"
                required
              />
            </div>

            <div className="admin-form-group">
              <label>Employee ID *</label>
              <input
                type="text"
                value={form.employee_id}
                onChange={e => handleChange('employee_id', e.target.value)}
                placeholder="e.g. 002 or SE-002"
                required
              />
            </div>

            <div className="admin-form-group">
              <label>Email Address *</label>
              <input
                type="email"
                value={form.email}
                onChange={e => handleChange('email', e.target.value)}
                placeholder="e.g. alok@settlexpert.com"
                required
              />
            </div>

            <div className="admin-form-group">
              <label>Mobile Number *</label>
              <input
                type="text"
                value={form.phone}
                onChange={e => handleChange('phone', e.target.value)}
                placeholder="e.g. +91 9876543210"
                required
              />
            </div>

            <div className="admin-form-group">
              <label>Department *</label>
              <input
                type="text"
                value={form.department}
                onChange={e => handleChange('department', e.target.value)}
                placeholder="e.g. Sales, Legal, Accounts"
                required
              />
            </div>

            <div className="admin-form-group">
              <label>Designation *</label>
              <input
                type="text"
                value={form.designation}
                onChange={e => handleChange('designation', e.target.value)}
                placeholder="e.g. Financial Consultant"
                required
              />
            </div>

            <div className="admin-form-group">
              <label>Joining Date</label>
              <input
                type="date"
                value={form.joining_date}
                onChange={e => handleChange('joining_date', e.target.value)}
              />
            </div>

            <div className="admin-form-group">
              <label>Employment Status</label>
              <select
                className="admin-select-filter"
                style={{ width: '100%', height: '38px', background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', borderRadius: '6px', padding: '0 10px' }}
                value={form.employment_status}
                onChange={e => handleChange('employment_status', e.target.value)}
              >
                <option value="active">Active Staff</option>
                <option value="probation">On Probation</option>
                <option value="on_leave">On Leave</option>
                <option value="inactive">Inactive / Resigned</option>
              </select>
            </div>
          </div>

          {/* SECTION 3: AADHAAR & KYC DOCUMENTS */}
          <div className="admin-form-section-title" style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} color="#f59e0b" />
            <span>Aadhaar Verification & Documents (Encrypted & Secure)</span>
          </div>

          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
            <div className="admin-form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Aadhaar Number (12 Digits)</span>
                <span style={{ fontSize: '11px', color: '#38bdf8' }}>🔒 Encrypted with AES-256</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showAadhaarNumber ? 'text' : 'password'}
                  value={form.aadhaar_number}
                  onChange={handleAadhaarChange}
                  placeholder="XXXX XXXX XXXX (e.g. 5678 1234 9876)"
                  maxLength={14}
                  style={{ paddingRight: '40px', letterSpacing: '1px', fontWeight: 600 }}
                />
                <button
                  type="button"
                  onClick={() => setShowAadhaarNumber(!showAadhaarNumber)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                  title={showAadhaarNumber ? 'Hide Aadhaar' : 'Show Aadhaar'}
                >
                  {showAadhaarNumber ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <small style={{ color: '#64748b', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                Standard 12-digit format. Masked by default across normal views for employee privacy.
              </small>
            </div>

            {/* Aadhaar Documents Upload Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              {/* Aadhaar Front */}
              <div style={{ background: '#1e293b', border: '1px dashed #475569', borderRadius: '8px', padding: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0', display: 'block', marginBottom: '8px' }}>
                  Aadhaar Card (Front Side)
                </span>

                {aadhaarFront && !removeFrontDoc ? (
                  <div>
                    <div style={{ height: '110px', width: '100%', borderRadius: '6px', overflow: 'hidden', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', border: '1px solid #334155' }}>
                      <img src={aadhaarFront} alt="Aadhaar Front" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="admin-btn-secondary"
                        style={{ fontSize: '11.5px', padding: '4px 10px', flex: 1 }}
                        onClick={() => frontInputRef.current?.click()}
                      >
                        Replace Front
                      </button>
                      <button
                        type="button"
                        className="admin-btn-secondary"
                        style={{ fontSize: '11.5px', padding: '4px 8px', color: '#f87171' }}
                        onClick={() => { setAadhaarFront(''); setRemoveFrontDoc(true); }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => frontInputRef.current?.click()}
                    style={{ height: '110px', border: '1px dashed #64748b', borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#0f172a' }}
                  >
                    <Upload size={20} color="#94a3b8" />
                    <span style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '6px', fontWeight: 500 }}>Upload Aadhaar Front</span>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>JPG, PNG, WEBP</span>
                  </div>
                )}
                <input
                  type="file"
                  ref={frontInputRef}
                  style={{ display: 'none' }}
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={(e) => handleFileUpload(e, 'front')}
                />
              </div>

              {/* Aadhaar Back */}
              <div style={{ background: '#1e293b', border: '1px dashed #475569', borderRadius: '8px', padding: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0', display: 'block', marginBottom: '8px' }}>
                  Aadhaar Card (Back Side)
                </span>

                {aadhaarBack && !removeBackDoc ? (
                  <div>
                    <div style={{ height: '110px', width: '100%', borderRadius: '6px', overflow: 'hidden', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', border: '1px solid #334155' }}>
                      <img src={aadhaarBack} alt="Aadhaar Back" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="admin-btn-secondary"
                        style={{ fontSize: '11.5px', padding: '4px 10px', flex: 1 }}
                        onClick={() => backInputRef.current?.click()}
                      >
                        Replace Back
                      </button>
                      <button
                        type="button"
                        className="admin-btn-secondary"
                        style={{ fontSize: '11.5px', padding: '4px 8px', color: '#f87171' }}
                        onClick={() => { setAadhaarBack(''); setRemoveBackDoc(true); }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => backInputRef.current?.click()}
                    style={{ height: '110px', border: '1px dashed #64748b', borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#0f172a' }}
                  >
                    <Upload size={20} color="#94a3b8" />
                    <span style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '6px', fontWeight: 500 }}>Upload Aadhaar Back</span>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>JPG, PNG, WEBP</span>
                  </div>
                )}
                <input
                  type="file"
                  ref={backInputRef}
                  style={{ display: 'none' }}
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={(e) => handleFileUpload(e, 'back')}
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: LOGIN CREDENTIALS */}
          <div className="admin-form-section-title" style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Login Credentials</span>
            {isEdit && (
              <label style={{ fontSize: '12px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.changePassword}
                  onChange={e => handleChange('changePassword', e.target.checked)}
                />
                <span>Change Password</span>
              </label>
            )}
          </div>

          {(!isEdit || form.changePassword) && (
            <div className="admin-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <div className="admin-form-group">
                <label>{isEdit ? 'New Password *' : 'Password *'}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => handleChange('password', e.target.value)}
                    placeholder="Min 6 characters"
                    style={{ paddingRight: '36px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="admin-form-group">
                <label>Confirm Password *</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={e => handleChange('confirmPassword', e.target.value)}
                  placeholder="Re-enter password"
                />
              </div>

              <div className="admin-form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button type="button" className="admin-btn-secondary" style={{ width: '100%', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={handleGenerate}>
                  <RefreshCw size={14} />
                  <span>Generate Password</span>
                </button>
              </div>
            </div>
          )}

          {/* ACTIONS */}
          <div className="admin-modal-actions" style={{ marginTop: '24px', borderTop: '1px solid #334155', paddingTop: '16px' }}>
            <button type="button" className="admin-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="admin-btn-primary"
              disabled={loading}
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
            >
              {isEdit ? <UserCheck size={16} /> : <UserPlus size={16} />}
              <span>{loading ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Employee Profile' : 'Create Employee')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
