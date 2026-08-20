import React, { useState, useEffect } from 'react';
import { X, Save, IndianRupee } from 'lucide-react';

export default function ClientModal({ isOpen, onClose, onSave, onOpenPayModal, client = null, isViewOnly = false }) {
  const [formData, setFormData] = useState({
    client_id: '',
    name: '',
    phone: '',
    email: '',
    city: '',
    pan: '',
    address: '',
    service_fee: '24000',
    fees_date: '',
    fees_status: 'Pending',
    pending_amount: '2500',
    received_amount: '21500',
    this_month_received: '21500',
    case_status: 'Active',
    assigned_consultant: 'Dhruv',
    assigned_advocate: 'Adv Sparsh Gupta',
    notes: ''
  });

  useEffect(() => {
    if (client) {
      setFormData({
        client_id: client.client_id || '',
        name: client.name || '',
        phone: client.phone || '',
        email: client.email || '',
        city: client.city || '',
        pan: client.pan || '',
        address: client.address || '',
        service_fee: client.service_fee || '0',
        fees_date: client.fees_date || '',
        fees_status: client.fees_status || 'Pending',
        pending_amount: client.pending_amount !== undefined ? client.pending_amount : '0',
        received_amount: client.received_amount !== undefined ? client.received_amount : '0',
        this_month_received: client.this_month_received !== undefined ? client.this_month_received : '0',
        case_status: client.case_status || 'Active',
        assigned_consultant: client.assigned_consultant || 'Dhruv',
        assigned_advocate: client.assigned_advocate || 'Adv Sparsh Gupta',
        notes: client.notes || ''
      });
    } else {
      const randomId = String(Math.floor(60000 + Math.random() * 9999));
      const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      setFormData({
        client_id: randomId,
        name: '',
        phone: '',
        email: '',
        city: '',
        pan: '',
        address: '',
        service_fee: '24000',
        fees_date: today,
        fees_status: 'Pending',
        pending_amount: '4000',
        received_amount: '20000',
        this_month_received: '5000',
        case_status: 'Active',
        assigned_consultant: 'Dhruv',
        assigned_advocate: 'Adv Sparsh Gupta',
        notes: ''
      });
    }
  }, [client, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      // Auto-calculate pending when fee or received changes
      if (name === 'service_fee' || name === 'received_amount') {
        const fee = parseFloat(name === 'service_fee' ? value : updated.service_fee) || 0;
        const rec = parseFloat(name === 'received_amount' ? value : updated.received_amount) || 0;
        const pend = Math.max(0, fee - rec);
        updated.pending_amount = pend;
        updated.fees_status = pend === 0 && fee > 0 ? 'Paid' : 'Pending';
      }
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert('Client Name is required');
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isViewOnly ? 'Client Profile' : (client ? 'Edit Client' : 'Add New Client')}</h3>
          <button className="btn-action-icon" onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid-2">
              <div className="form-group">
                <label>Client ID *</label>
                <input
                  type="text"
                  name="client_id"
                  value={formData.client_id}
                  onChange={handleChange}
                  placeholder="e.g. 60633"
                  className="form-control"
                  disabled={isViewOnly}
                  required
                />
              </div>

              <div className="form-group">
                <label>Client Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Mukesh Kumar"
                  className="form-control"
                  disabled={isViewOnly}
                  required
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. 9997332524"
                  className="form-control"
                  disabled={isViewOnly}
                />
              </div>

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
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>City / State</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. Uttarakhand, Pune"
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
                  placeholder="e.g. AQWPX1234F"
                  className="form-control"
                  disabled={isViewOnly}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Full residential or billing address"
                className="form-control"
                disabled={isViewOnly}
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>SettleXpert Service Fee (₹)</label>
                <input
                  type="number"
                  name="service_fee"
                  value={formData.service_fee}
                  onChange={handleChange}
                  placeholder="24000"
                  className="form-control"
                  disabled={isViewOnly}
                />
              </div>

              <div className="form-group">
                <label>Fees Date</label>
                <input
                  type="text"
                  name="fees_date"
                  value={formData.fees_date}
                  onChange={handleChange}
                  placeholder="e.g. 07 Aug 2026"
                  className="form-control"
                  disabled={isViewOnly}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Total Received Amount (₹)</label>
                <input
                  type="number"
                  name="received_amount"
                  value={formData.received_amount}
                  onChange={handleChange}
                  placeholder="21500"
                  className="form-control"
                  disabled={isViewOnly}
                />
              </div>

              <div className="form-group">
                <label>This Month Received (₹)</label>
                <input
                  type="number"
                  name="this_month_received"
                  value={formData.this_month_received}
                  onChange={handleChange}
                  placeholder="21500"
                  className="form-control"
                  disabled={isViewOnly}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Pending Amount (₹)</label>
                <input
                  type="number"
                  name="pending_amount"
                  value={formData.pending_amount}
                  onChange={handleChange}
                  className="form-control"
                  disabled={isViewOnly}
                />
              </div>

              <div className="form-group">
                <label>Fees Status</label>
                <select
                  name="fees_status"
                  value={formData.fees_status}
                  onChange={handleChange}
                  className="form-control"
                  disabled={isViewOnly}
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Case Status</label>
                <select
                  name="case_status"
                  value={formData.case_status}
                  onChange={handleChange}
                  className="form-control"
                  disabled={isViewOnly}
                >
                  <option value="Active">Active</option>
                  <option value="Closed">Closed</option>
                  <option value="Dropped">Dropped</option>
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
                <label>Assigned Advocate</label>
                <input
                  type="text"
                  name="assigned_advocate"
                  value={formData.assigned_advocate}
                  onChange={handleChange}
                  placeholder="e.g. Adv Sparsh Gupta"
                  className="form-control"
                  disabled={isViewOnly}
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <input
                  type="text"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Additional client details..."
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
              {client && client.pending_amount > 0 && onOpenPayModal && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#22c55e', borderColor: 'rgba(34, 197, 94, 0.3)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
                  onClick={() => onOpenPayModal(client)}
                >
                  <IndianRupee size={14} />
                  <span>Pay Pending (₹{parseFloat(client.pending_amount).toLocaleString('en-IN')})</span>
                </button>
              )}
            </div>
            {!isViewOnly && (
              <button type="submit" className="btn-primary-green">
                <Save size={13} />
                <span>Save Client</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
