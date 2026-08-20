import React from 'react';
import { X, User, Mail, Phone, Building2, Briefcase, Calendar, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function EmployeeProfileModal({ isOpen, onClose, user }) {
  if (!isOpen || !user) return null;

  const displayName = user.name || 'Employee';
  const initialLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className="admin-modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="admin-modal"
        style={{
          maxWidth: '520px',
          width: '92vw',
          background: '#ffffff',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ background: 'linear-gradient(135deg, #15803d, #166534)', padding: '20px 24px', color: '#ffffff', position: 'relative' }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#ffffff'
            }}
          >
            <X size={16} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {user.profile_photo ? (
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #ffffff', flexShrink: 0, boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                <img src={user.profile_photo} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ) : (
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ffffff', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: 800, border: '3px solid rgba(255,255,255,0.8)', flexShrink: 0 }}>
                {initialLetter}
              </div>
            )}

            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>{displayName}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: 600 }}>
                  ID: {user.employee_id || '002'}
                </span>
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: 600 }}>
                  {user.designation || 'Consultant'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '11.5px', marginBottom: '3px' }}>
                <Mail size={13} />
                <span>Email Address</span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', wordBreak: 'break-all' }}>
                {user.email || '—'}
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '11.5px', marginBottom: '3px' }}>
                <Phone size={13} />
                <span>Mobile Number</span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                {user.phone || '—'}
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '11.5px', marginBottom: '3px' }}>
                <Building2 size={13} />
                <span>Department</span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                {user.department || 'Sales'}
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '11.5px', marginBottom: '3px' }}>
                <Briefcase size={13} />
                <span>Designation</span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                {user.designation || 'Consultant'}
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '11.5px', marginBottom: '3px' }}>
                <Calendar size={13} />
                <span>Joining Date</span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                {user.joining_date ? new Date(user.joining_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '11.5px', marginBottom: '3px' }}>
                <ShieldCheck size={13} />
                <span>Account Status</span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#15803d', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={13} />
                <span>{user.employment_status === 'probation' ? 'On Probation' : 'Active Staff'}</span>
              </div>
            </div>
          </div>

          {/* Aadhaar Vault Notice */}
          <div style={{ marginTop: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} color="#15803d" />
              <div>
                <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#166534', display: 'block' }}>Aadhaar Verification & KYC</span>
                <span style={{ fontSize: '11px', color: '#15803d' }}>
                  {user.masked_aadhaar ? `Verified on file (${user.masked_aadhaar})` : 'Documents securely encrypted & verified by Admin'}
                </span>
              </div>
            </div>
            <span style={{ fontSize: '10.5px', background: '#dcfce7', color: '#15803d', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>
              SECURE
            </span>
          </div>

          {/* Close Action */}
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#15803d',
                color: '#ffffff',
                border: 'none',
                padding: '8px 20px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
