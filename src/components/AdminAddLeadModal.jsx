import React, { useState, useEffect } from 'react';
import { X, UserPlus, UserCheck, AlertCircle, Shield, Building2 } from 'lucide-react';

export default function AdminAddLeadModal({ isOpen, onClose, employees = [], onSave }) {
  const activeEmployees = employees.filter(emp => emp.status === 'active');

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    outstanding_amount: '50,000 - 1,00,000',
    monthly_income: '25000',
    loan_type: 'personal_loan_settlement',
    default_status: 'yes',
    harassment_calls: 'yes',
    assigned_to: '',
    lead_status: 'New',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setForm({
        name: '',
        phone: '',
        email: '',
        city: '',
        outstanding_amount: '50,000 - 1,00,000',
        monthly_income: '25000',
        loan_type: 'personal_loan_settlement',
        default_status: 'yes',
        harassment_calls: 'yes',
        assigned_to: activeEmployees.length > 0 ? String(activeEmployees[0].id) : '',
        lead_status: 'New',
        notes: ''
      });
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('Lead Name is required');
      return;
    }
    if (!form.phone.trim()) {
      setError('Phone Number is required');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('crm_token');
      const selectedEmp = activeEmployees.find(e => String(e.id) === String(form.assigned_to));

      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        city: form.city.trim(),
        outstanding_amount: form.outstanding_amount,
        monthly_income: form.monthly_income,
        loan_type: form.loan_type,
        default_status: form.default_status,
        harassment_calls: form.harassment_calls,
        lead_status: form.lead_status,
        assigned_to: selectedEmp ? selectedEmp.id : null,
        assigned_consultant: selectedEmp ? selectedEmp.name : 'Unassigned',
        notes: form.notes.trim()
      };

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create and assign lead');

      onSave(data, selectedEmp);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="admin-modal" style={{ maxWidth: '680px', width: '92vw', maxHeight: '92vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="admin-modal-header" style={{ position: 'sticky', top: 0, zIndex: 10, background: '#1e293b' }}>
          <div className="admin-modal-header-left">
            <UserPlus size={20} color="#10b981" />
            <div>
              <h3 style={{ margin: 0 }}>Add Lead & Assign Employee</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                Create a new customer lead and assign it directly to an employee's CRM
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
          {/* SECTION 1: LEAD CONTACT DETAILS */}
          <div className="admin-form-section-title">Lead Contact Information</div>
          <div className="admin-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            <div className="admin-form-group">
              <label>Full Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => handleChange('name', e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                required
              />
            </div>

            <div className="admin-form-group">
              <label>Phone Number *</label>
              <input
                type="text"
                value={form.phone}
                onChange={e => handleChange('phone', e.target.value)}
                placeholder="e.g. +91 9876543210"
                required
              />
            </div>

            <div className="admin-form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={e => handleChange('email', e.target.value)}
                placeholder="e.g. ramesh@gmail.com"
              />
            </div>

            <div className="admin-form-group">
              <label>City / Location</label>
              <input
                type="text"
                value={form.city}
                onChange={e => handleChange('city', e.target.value)}
                placeholder="e.g. Mumbai, Maharashtra"
              />
            </div>
          </div>

          {/* SECTION 2: LOAN & FINANCIAL DETAILS */}
          <div className="admin-form-section-title" style={{ marginTop: '20px' }}>Loan & Settlement Details</div>
          <div className="admin-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            <div className="admin-form-group">
              <label>Outstanding Amount</label>
              <select
                className="admin-select-filter"
                style={{ width: '100%', height: '38px', background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', borderRadius: '6px', padding: '0 10px' }}
                value={form.outstanding_amount}
                onChange={e => handleChange('outstanding_amount', e.target.value)}
              >
                <option value="less_than_1,00,000">less_than_1,00,000</option>
                <option value="50,000 - 1,00,000">50,000 - 1,00,000</option>
                <option value="75,000 - 1,50,000">75,000 - 1,50,000</option>
                <option value="1,00,000 - 3,00,000">1,00,000 - 3,00,000</option>
                <option value="1,50,000 - 3,00,000">1,50,000 - 3,00,000</option>
                <option value="3,00,000 - 5,00,000">3,00,000 - 5,00,000</option>
                <option value="5,00,000 - 10,00,000">5,00,000 - 10,00,000</option>
                <option value="above_10,00,000">above_10,00,000</option>
              </select>
            </div>

            <div className="admin-form-group">
              <label>Monthly Income (₹)</label>
              <input
                type="number"
                value={form.monthly_income}
                onChange={e => handleChange('monthly_income', e.target.value)}
                placeholder="25000"
              />
            </div>

            <div className="admin-form-group">
              <label>Loan Type</label>
              <select
                className="admin-select-filter"
                style={{ width: '100%', height: '38px', background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', borderRadius: '6px', padding: '0 10px' }}
                value={form.loan_type}
                onChange={e => handleChange('loan_type', e.target.value)}
              >
                <option value="personal_loan_settlement">Personal Loan Settlement</option>
                <option value="multiple_app_loan_settlement">Multiple App Loan Settlement</option>
                <option value="credit_card_settlement">Credit Card Settlement</option>
                <option value="business_loan_settlement">Business Loan Settlement</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="admin-form-group">
              <label>Harassment Calls</label>
              <select
                className="admin-select-filter"
                style={{ width: '100%', height: '38px', background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', borderRadius: '6px', padding: '0 10px' }}
                value={form.harassment_calls}
                onChange={e => handleChange('harassment_calls', e.target.value)}
              >
                <option value="yes">Yes (Facing calls)</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>

          {/* SECTION 3: ASSIGN EMPLOYEE & STATUS */}
          <div className="admin-form-section-title" style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={16} color="#38bdf8" />
            <span>Assign To Employee CRM</span>
          </div>

          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
            <div className="admin-form-group" style={{ marginBottom: '12px' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Select Employee *</span>
                <span style={{ fontSize: '11px', color: '#38bdf8' }}>⚡ Auto-syncs to Employee CRM</span>
              </label>
              <select
                className="admin-select-filter"
                style={{ width: '100%', height: '40px', background: '#1e293b', border: '1px solid #475569', color: '#f8fafc', borderRadius: '6px', padding: '0 12px', fontSize: '13px', fontWeight: 600 }}
                value={form.assigned_to}
                onChange={e => handleChange('assigned_to', e.target.value)}
                required
              >
                <option value="">-- Unassigned --</option>
                {activeEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} — ID: {emp.employee_id || 'SE'} ({emp.department || 'Sales'} • {emp.designation || 'Consultant'})
                  </option>
                ))}
              </select>
              <small style={{ color: '#94a3b8', fontSize: '11.5px', marginTop: '5px', display: 'block' }}>
                Once saved, this lead will instantly appear in the assigned employee's Leads table, Dashboard summary, and Follow-ups queue.
              </small>
            </div>

            <div className="admin-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginTop: '12px' }}>
              <div className="admin-form-group">
                <label>Initial Lead Status</label>
                <select
                  className="admin-select-filter"
                  style={{ width: '100%', height: '36px', background: '#1e293b', border: '1px solid #334155', color: '#f8fafc', borderRadius: '6px', padding: '0 10px' }}
                  value={form.lead_status}
                  onChange={e => handleChange('lead_status', e.target.value)}
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Interested">Interested</option>
                  <option value="Follow up">Follow up</option>
                  <option value="Converted">Converted</option>
                  <option value="Not Interested">Not Interested</option>
                </select>
              </div>

              <div className="admin-form-group">
                <label>Case Notes / Remark</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={e => handleChange('notes', e.target.value)}
                  placeholder="e.g. Urgently looking for personal loan settlement"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="admin-modal-actions" style={{ marginTop: '20px', borderTop: '1px solid #334155', paddingTop: '16px' }}>
            <button type="button" className="admin-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="admin-btn-primary"
              disabled={loading}
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: '9px 18px' }}
            >
              <UserCheck size={16} />
              <span>{loading ? 'Creating...' : 'Create & Assign Lead'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
