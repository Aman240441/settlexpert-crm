import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';

export default function AgreementModal({ isOpen, onClose, onSave, agreement = null, isViewOnly = false }) {
  const [formData, setFormData] = useState({
    client_name: '',
    email: '',
    phone: '',
    pan: '',
    lender: '',
    loan_account_number: '',
    loan_amount: '50000',
    loan_type: 'Personal Loan',
    agreement_date: '',
    status: 'Active',
    notes: ''
  });

  useEffect(() => {
    if (agreement) {
      setFormData({
        client_name: agreement.client_name || '',
        email: agreement.email || '',
        phone: agreement.phone || '',
        pan: agreement.pan || '',
        lender: agreement.lender || '',
        loan_account_number: agreement.loan_account_number || '',
        loan_amount: agreement.loan_amount || '0',
        loan_type: agreement.loan_type || 'Personal Loan',
        agreement_date: agreement.agreement_date || '',
        status: agreement.status || 'Active',
        notes: agreement.notes || ''
      });
    } else {
      const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      setFormData({
        client_name: '',
        email: '',
        phone: '',
        pan: '',
        lender: 'Home Credit, IDFC First Bank, MoneyWide, Cred',
        loan_account_number: '₹ 15000, 21000, 45000, 9500',
        loan_amount: '90500',
        loan_type: 'Personal Loan, Personal Loan, Personal Loan, Personal Loan',
        agreement_date: today,
        status: 'Active',
        notes: ''
      });
    }
  }, [agreement, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.client_name.trim()) return alert('Client Name is required');
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isViewOnly ? 'Agreement Summary' : (agreement ? 'Edit Agreement' : 'Add New Agreement')}</h3>
          <button className="btn-action-icon" onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid-2">
              <div className="form-group">
                <label>Client Name *</label>
                <input
                  type="text"
                  name="client_name"
                  value={formData.client_name}
                  onChange={handleChange}
                  placeholder="e.g. Mukesh Kumar"
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
                  placeholder="9997332524"
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
                  placeholder="avikormukesh977@gmail.com"
                  className="form-control"
                  disabled={isViewOnly}
                />
              </div>

              <div className="form-group">
                <label>PAN Card Number</label>
                <input
                  type="text"
                  name="pan"
                  value={formData.pan}
                  onChange={handleChange}
                  placeholder="AQWPX1234F"
                  className="form-control"
                  disabled={isViewOnly}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Lenders / Institutions (Comma Separated)</label>
              <textarea
                name="lender"
                rows="3"
                value={formData.lender}
                onChange={handleChange}
                placeholder="e.g. Home Credit, IDFC First Bank, MoneyWide, Cred"
                className="form-control"
                disabled={isViewOnly}
              />
            </div>

            <div className="form-group">
              <label>Loan Details / Account Numbers / Amounts</label>
              <textarea
                name="loan_account_number"
                rows="2"
                value={formData.loan_account_number}
                onChange={handleChange}
                placeholder="e.g. ₹ 15000, 21000, 45000, 9500"
                className="form-control"
                disabled={isViewOnly}
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Total Loan Amount (₹)</label>
                <input
                  type="number"
                  name="loan_amount"
                  value={formData.loan_amount}
                  onChange={handleChange}
                  placeholder="90500"
                  className="form-control"
                  disabled={isViewOnly}
                />
              </div>

              <div className="form-group">
                <label>Agreement Date</label>
                <input
                  type="text"
                  name="agreement_date"
                  value={formData.agreement_date}
                  onChange={handleChange}
                  placeholder="07 Aug 2026"
                  className="form-control"
                  disabled={isViewOnly}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Loan Types</label>
              <input
                type="text"
                name="loan_type"
                value={formData.loan_type}
                onChange={handleChange}
                placeholder="Personal Loan, Payday Loan, Credit Card"
                className="form-control"
                disabled={isViewOnly}
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="form-control"
                  disabled={isViewOnly}
                >
                  <option value="Active">Active</option>
                  <option value="Closed">Closed</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <input
                  type="text"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Additional remarks..."
                  className="form-control"
                  disabled={isViewOnly}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-pill-toggle" onClick={onClose}>
              {isViewOnly ? 'Close' : 'Cancel'}
            </button>
            {!isViewOnly && (
              <button type="submit" className="btn-primary-green">
                <Save size={13} />
                <span>Save Agreement</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
