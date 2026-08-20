import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, UserCheck, IndianRupee, Sparkles, ArrowRight, Shield } from 'lucide-react';

const formatINR = (val) => {
  const num = typeof val === 'number' ? val : parseFloat(val) || 0;
  return '₹' + num.toLocaleString('en-IN');
};

export default function ConvertLeadModal({ isOpen, lead, onClose, onConvertSuccess }) {
  const [formData, setFormData] = useState({
    service_fee: '25000',
    paid_amount: '5000',
    payment_method: 'UPI',
    reference_number: '',
    payment_date: '',
    pan: '',
    address: '',
    city: '',
    assigned_consultant: 'Dhruv',
    assigned_advocate: 'Adv Sparsh Gupta',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (lead && isOpen) {
      const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      setFormData({
        service_fee: '25000',
        paid_amount: '5000',
        payment_method: 'UPI',
        reference_number: `UPI/${new Date().getFullYear()}/${Math.floor(100000 + Math.random() * 900000)}`,
        payment_date: today,
        pan: '',
        address: lead.city ? `${lead.city}` : '',
        city: lead.city || '',
        assigned_consultant: lead.assigned_consultant || 'Dhruv',
        assigned_advocate: 'Adv Sparsh Gupta',
        notes: `Converted from Lead ID: ${lead.lead_id || lead.id}`
      });
      setError('');
    }
  }, [lead, isOpen]);

  if (!isOpen || !lead) return null;

  const fee = parseFloat(formData.service_fee) || 0;
  const paid = parseFloat(formData.paid_amount) || 0;
  const pending = Math.max(0, fee - paid);
  const isFullyPaid = pending === 0 && fee > 0;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFullPay = () => {
    setFormData(prev => ({ ...prev, paid_amount: prev.service_fee }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fee || fee <= 0) {
      setError('Service fee must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('crm_token');
      const res = await fetch(`/api/leads/${lead.id}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          ...formData,
          service_fee: fee,
          paid_amount: paid
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to convert lead to client');

      onConvertSuccess(data.message || `Lead ${lead.name} converted to Client successfully!`);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(15, 23, 42, 0) 100%)' }}>
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-primary)', margin: 0 }}>
              <Sparkles size={20} />
              Convert Lead to Active Client & Record Payment
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Lead: <strong style={{ color: 'var(--text-primary)' }}>{lead.name}</strong> • Phone: {lead.phone || 'N/A'} • Status: {lead.lead_status}
            </p>
          </div>
          <button className="btn-action-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            {/* Fee & Payment Breakdown */}
            <div style={{
              padding: '14px',
              borderRadius: '10px',
              background: 'var(--bg-hover)',
              border: '1px solid var(--border-color)',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px'
            }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Service Fee</span>
                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
                  {formatINR(fee)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Paid Amount Now</span>
                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#22c55e', marginTop: '2px' }}>
                  {formatINR(paid)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pending Balance</span>
                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: pending > 0 ? '#ef4444' : '#22c55e', marginTop: '2px' }}>
                  {formatINR(pending)}
                </div>
              </div>
            </div>

            {/* Financial Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label>Total Agreed Service Fee (₹) <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="number"
                  name="service_fee"
                  required
                  min="1"
                  value={formData.service_fee}
                  onChange={handleChange}
                  placeholder="e.g. 25000"
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label>Initial Amount Paid (₹)</label>
                  <button
                    type="button"
                    onClick={handleFullPay}
                    style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    100% Paid
                  </button>
                </div>
                <input
                  type="number"
                  name="paid_amount"
                  min="0"
                  value={formData.paid_amount}
                  onChange={handleChange}
                  placeholder="e.g. 5000 or full amount"
                  style={{ fontWeight: '600', color: '#22c55e' }}
                />
              </div>

              <div className="form-group">
                <label>Payment Mode</label>
                <select name="payment_method" value={formData.payment_method} onChange={handleChange}>
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="Net Banking / IMPS">Net Banking / IMPS / NEFT</option>
                  <option value="Debit / Credit Card">Debit / Credit Card</option>
                  <option value="Cash">Cash Receipt</option>
                  <option value="Cheque">Bank Cheque</option>
                </select>
              </div>

              <div className="form-group">
                <label>Transaction / UTR Reference</label>
                <input
                  type="text"
                  name="reference_number"
                  value={formData.reference_number}
                  onChange={handleChange}
                  placeholder="e.g. UPI/33829104812"
                />
              </div>
            </div>

            {/* Advocate & Consultant Assignment */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label>Assigned Advocate</label>
                <select name="assigned_advocate" value={formData.assigned_advocate} onChange={handleChange}>
                  <option value="Adv Sparsh Gupta">Adv Sparsh Gupta</option>
                  <option value="Adv Sakshi Pal">Adv Sakshi Pal</option>
                  <option value="Adv Tamanna Swami">Adv Tamanna Swami</option>
                  <option value="Adv Rahul Verma">Adv Rahul Verma</option>
                </select>
              </div>

              <div className="form-group">
                <label>Assigned Consultant</label>
                <select name="assigned_consultant" value={formData.assigned_consultant} onChange={handleChange}>
                  <option value="Dhruv">Dhruv</option>
                  <option value="Admin">Admin</option>
                  <option value="Aditi Sharma">Aditi Sharma</option>
                  <option value="Karan Mehra">Karan Mehra</option>
                </select>
              </div>

              <div className="form-group">
                <label>Client PAN Number</label>
                <input
                  type="text"
                  name="pan"
                  value={formData.pan}
                  onChange={handleChange}
                  placeholder="e.g. ABCDE1234F"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>

              <div className="form-group">
                <label>City / Location</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. Delhi NCR, Mumbai"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Full Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Client residential / communication address"
              />
            </div>

            {/* Status Summary Banner */}
            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: isFullyPaid ? 'rgba(34, 197, 94, 0.08)' : 'rgba(234, 179, 8, 0.08)',
              border: `1px solid ${isFullyPaid ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Resulting Client Case:</span>
                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: isFullyPaid ? '#22c55e' : '#eab308', marginTop: '2px' }}>
                  {isFullyPaid ? '✅ Active Client (100% Fee Cleared)' : `⏳ Active Client (Pending Balance: ${formatINR(pending)})`}
                </div>
              </div>
              <span className="badge badge-success" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                Lead Status ➔ Converted
              </span>
            </div>
          </div>

          <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Converting...' : (
                <>
                  <UserCheck size={16} />
                  Convert & Create Client Profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
