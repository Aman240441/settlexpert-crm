import React, { useState } from 'react';
import { X, Send, Mail } from 'lucide-react';

export default function BulkMailModal({ isOpen, onClose, onSend, selectedCount = 0 }) {
  const [subject, setSubject] = useState('Important Update regarding your Debt Settlement Plan - SettleXpert');
  const [message, setMessage] = useState('Dear Client,\n\nThis is a notification regarding your active debt settlement file with SettleXpert. Please ensure timely payment submission or reach out to your assigned legal consultant for advocacy assistance.\n\nWarm regards,\nSettleXpert Team');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim()) return alert('Subject is required');
    setLoading(true);
    await onSend({ subject, message });
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={16} color="#15803d" />
            <h3>Send Bulk Mail to Clients</h3>
          </div>
          <button className="btn-action-icon" onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ background: '#f0fdf4', padding: '10px 14px', borderRadius: '6px', marginBottom: '14px', fontSize: '12px', color: '#166534' }}>
              <strong>Recipients:</strong> {selectedCount > 0 ? `${selectedCount} Selected Clients` : 'All Active Clients in current filter'}
            </div>

            <div className="form-group">
              <label>Email Subject *</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label>Message Content *</label>
              <textarea
                rows="6"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="form-control"
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-pill-toggle" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-dark" disabled={loading}>
              <Send size={13} />
              <span>{loading ? 'Sending...' : 'Send Bulk Mail'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
