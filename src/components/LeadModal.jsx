import React, { useState, useEffect } from 'react';
import { X, Save, UserCheck, IndianRupee } from 'lucide-react';

export default function LeadModal({ isOpen, onClose, onSave, onConvertToClient, lead = null, isViewOnly = false }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    outstanding_amount: '50,000 - 1,00,000',
    monthly_income: '25000',
    loan_type: 'personal_loan_settlement',
    default_status: 'yes',
    harassment_calls: 'yes',
    assigned_consultant: 'Dhruv',
    lead_status: 'New',
    notes: ''
  });

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        city: lead.city || '',
        outstanding_amount: lead.outstanding_amount || '50,000 - 1,00,000',
        monthly_income: lead.monthly_income || '25000',
        loan_type: lead.loan_type || 'personal_loan_settlement',
        default_status: lead.default_status || 'yes',
        harassment_calls: lead.harassment_calls || 'yes',
        assigned_consultant: lead.assigned_consultant || 'Dhruv',
        lead_status: lead.lead_status || 'New',
        notes: lead.notes || ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        city: '',
        outstanding_amount: '50,000 - 1,00,000',
        monthly_income: '25000',
        loan_type: 'personal_loan_settlement',
        default_status: 'yes',
        harassment_calls: 'yes',
        assigned_consultant: 'Dhruv',
        lead_status: 'New',
        notes: ''
      });
    }
  }, [lead, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert('Lead Name is required');
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isViewOnly ? 'Lead Details' : (lead ? 'Edit Lead' : 'Add New Lead')}</h3>
          <button className="btn-action-icon" onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid-2">
              <div className="form-group">
                <label>Lead Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Prashant Narang"
                  className="form-control"
                  disabled={isViewOnly}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. 9876543210"
                  className="form-control"
                  disabled={isViewOnly}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@gmail.com"
                  className="form-control"
                  disabled={isViewOnly}
                />
              </div>

              <div className="form-group">
                <label>City / Location</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. Mumbai, Kalyan"
                  className="form-control"
                  disabled={isViewOnly}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Total Outstanding Amount</label>
                <select
                  name="outstanding_amount"
                  value={formData.outstanding_amount}
                  onChange={handleChange}
                  className="form-control"
                  disabled={isViewOnly}
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

              <div className="form-group">
                <label>Monthly Income (₹)</label>
                <input
                  type="number"
                  name="monthly_income"
                  value={formData.monthly_income}
                  onChange={handleChange}
                  placeholder="25000"
                  className="form-control"
                  disabled={isViewOnly}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Loan Type</label>
                <select
                  name="loan_type"
                  value={formData.loan_type}
                  onChange={handleChange}
                  className="form-control"
                  disabled={isViewOnly}
                >
                  <option value="personal_loan_settlement">Personal Loan Settlement</option>
                  <option value="multiple_app_loan_settlement">Multiple App Loan Settlement</option>
                  <option value="credit_card_settlement">Credit Card Settlement</option>
                  <option value="business_loan_settlement">Business Loan Settlement</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Default Status</label>
                <select
                  name="default_status"
                  value={formData.default_status}
                  onChange={handleChange}
                  className="form-control"
                  disabled={isViewOnly}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="paying_with_difficulty">Paying with difficulty</option>
                </select>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Harassment Calls</label>
                <select
                  name="harassment_calls"
                  value={formData.harassment_calls}
                  onChange={handleChange}
                  className="form-control"
                  disabled={isViewOnly}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div className="form-group">
                <label>Assigned Consultant</label>
                <input
                  type="text"
                  name="assigned_consultant"
                  value={formData.assigned_consultant}
                  onChange={handleChange}
                  className="form-control"
                  disabled={isViewOnly}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Lead Status</label>
                <select
                  name="lead_status"
                  value={formData.lead_status}
                  onChange={handleChange}
                  className="form-control"
                  disabled={isViewOnly}
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Interested">Interested</option>
                  <option value="Follow up">Follow up</option>
                  <option value="Converted">Converted</option>
                  <option value="Not Interested">Not Interested</option>
                </select>
              </div>

              <div className="form-group">
                <label>Notes / Case Details</label>
                <input
                  type="text"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Notes or follow-up remarks..."
                  className="form-control"
                  disabled={isViewOnly}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="btn-pill-toggle" onClick={onClose}>
                {isViewOnly ? 'Close' : 'Cancel'}
              </button>
              {lead && lead.lead_status !== 'Converted' && onConvertToClient && (
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', borderColor: 'rgba(59, 130, 246, 0.3)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
                  onClick={() => onConvertToClient(lead)}
                >
                  <UserCheck size={14} />
                  <span>Convert & Record Payment</span>
                </button>
              )}
            </div>
            {!isViewOnly && (
              <button type="submit" className="btn-primary-green">
                <Save size={13} />
                <span>Save Lead</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
