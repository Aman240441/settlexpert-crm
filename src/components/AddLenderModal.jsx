import React, { useState } from 'react';
import { Landmark, X, Plus, Trash2, CheckCircle2 } from 'lucide-react';

export default function AddLenderModal({ isOpen, client, onClose, onSave }) {
  if (!isOpen || !client) return null;

  const [lenders, setLenders] = useState(client.lenders || [
    { id: 1, bank_name: 'HDFC Bank', account_number: '50200012345678', loan_type: 'Personal Loan', dues: '2,50,000', status: 'In Negotiation' },
    { id: 2, bank_name: 'ICICI Bank', account_number: '43210098765432', loan_type: 'Credit Card', dues: '1,80,000', status: 'Settlement Requested' }
  ]);

  const [newLender, setNewLender] = useState({
    bank_name: '',
    account_number: '',
    loan_type: 'Personal Loan',
    dues: '',
    status: 'In Negotiation'
  });

  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddLender = (e) => {
    e.preventDefault();
    if (!newLender.bank_name.trim()) return alert('Bank/Lender name is required');
    
    const item = {
      id: Date.now(),
      ...newLender
    };

    const updated = [...lenders, item];
    setLenders(updated);
    setNewLender({
      bank_name: '',
      account_number: '',
      loan_type: 'Personal Loan',
      dues: '',
      status: 'In Negotiation'
    });
    setShowAddForm(false);
    if (onSave) onSave(client.id, updated);
  };

  const handleDeleteLender = (id) => {
    const updated = lenders.filter(l => l.id !== id);
    setLenders(updated);
    if (onSave) onSave(client.id, updated);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.45)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '10px',
        width: '100%',
        maxWidth: '560px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '6px',
              background: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563eb'
            }}>
              <Landmark size={16} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                Add Lender / Manage Banks
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Client: <strong>{client.name}</strong> ({client.client_id})
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: '4px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '18px 20px', maxHeight: '65vh', overflowY: 'auto' }}>
          
          {/* Lenders List */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
              Linked Lenders ({lenders.length})
            </div>

            {lenders.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {lenders.map(l => (
                  <div 
                    key={l.id} 
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>{l.bank_name}</span>
                        <span style={{ fontSize: '10px', background: '#eff6ff', color: '#2563eb', padding: '1px 6px', borderRadius: '4px' }}>
                          {l.loan_type}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        A/C: {l.account_number || 'N/A'} • Dues: <span style={{ color: '#dc2626', fontWeight: 600 }}>₹{l.dues || '0'}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '10px', background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '10px', fontWeight: 500 }}>
                        {l.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteLender(l.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '2px'
                        }}
                        title="Remove lender"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', fontSize: '11.5px', background: '#f8fafc', borderRadius: '6px' }}>
                No lenders added yet.
              </div>
            )}
          </div>

          {/* Add New Lender Toggle / Form */}
          {!showAddForm ? (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              style={{
                width: '100%',
                background: '#eff6ff',
                color: '#2563eb',
                border: '1px dashed #93c5fd',
                borderRadius: '6px',
                padding: '9px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Plus size={14} />
              <span>+ Add New Lender</span>
            </button>
          ) : (
            <form onSubmit={handleAddLender} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '14px' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#0f172a', marginBottom: '10px' }}>
                Enter Lender / Bank Details
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#475569', marginBottom: '3px' }}>Bank / Lender Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC Bank / Bajaj Finserv"
                    value={newLender.bank_name}
                    onChange={(e) => setNewLender({ ...newLender, bank_name: e.target.value })}
                    required
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '11.5px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#475569', marginBottom: '3px' }}>Loan / Account Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 502000XXXXXX"
                    value={newLender.account_number}
                    onChange={(e) => setNewLender({ ...newLender, account_number: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '11.5px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#475569', marginBottom: '3px' }}>Loan Type</label>
                  <select
                    value={newLender.loan_type}
                    onChange={(e) => setNewLender({ ...newLender, loan_type: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '11.5px', outline: 'none', background: '#fff' }}
                  >
                    <option value="Personal Loan">Personal Loan</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Mobile App Loan">Mobile App Loan</option>
                    <option value="Business Loan">Business Loan</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#475569', marginBottom: '3px' }}>Total Outstanding Dues (₹)</label>
                  <input
                    type="text"
                    placeholder="e.g. 1,50,000"
                    value={newLender.dues}
                    onChange={(e) => setNewLender({ ...newLender, dues: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '11.5px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  style={{ background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '4px', padding: '6px 12px', fontSize: '11px', fontWeight: 500, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '6px 14px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Save Lender
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 18px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'flex-end',
          background: '#f8fafc'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#09090b',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 18px',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
