import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Save, PhoneCall } from 'lucide-react';

export default function FollowUpModal({ isOpen, onClose, onSave, lead = null }) {
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('11:00');
  const [status, setStatus] = useState('Follow up');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (lead) {
      const today = new Date().toISOString().split('T')[0];
      setFollowUpDate(today);
      setStatus(lead.lead_status || 'Follow up');
      setNotes(lead.notes || '');
    }
  }, [lead, isOpen]);

  if (!isOpen || !lead) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedNotes = notes 
      ? `${notes}\n[Follow-up scheduled on ${followUpDate} at ${followUpTime}]`
      : `[Follow-up scheduled on ${followUpDate} at ${followUpTime}]`;

    onSave({
      ...lead,
      lead_status: status,
      notes: updatedNotes
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="#f59e0b" />
            <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Schedule Follow-up</h3>
          </div>
          <button className="btn-action-icon" onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12.5px' }}>
              <div><strong>Lead:</strong> {lead.name}</div>
              <div style={{ color: '#64748b', marginTop: '2px' }}><strong>Phone:</strong> {lead.phone} | <strong>City:</strong> {lead.city || 'N/A'}</div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 600 }}>Follow-up Date *</label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 600 }}>Follow-up Time</label>
                <input
                  type="time"
                  value={followUpTime}
                  onChange={(e) => setFollowUpTime(e.target.value)}
                  className="form-control"
                />
              </div>
            </div>

            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: 600 }}>Update Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="form-control"
              >
                <option value="Follow up">Follow up</option>
                <option value="Interested">Interested</option>
                <option value="Contacted">Contacted</option>
                <option value="Not Interested">Not Interested</option>
              </select>
            </div>

            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: 600 }}>Follow-up Remarks / Discussion Notes</label>
              <textarea
                rows="3"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Discussed loan settlement options, customer requested callback..."
                className="form-control"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-pill-toggle" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary-green"
              style={{ background: '#f59e0b', borderColor: '#f59e0b', color: '#ffffff', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Save size={13} />
              <span>Save Follow-up</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
