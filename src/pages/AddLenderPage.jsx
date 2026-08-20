import React, { useState } from 'react';
import { Plus, Trash2, ArrowLeft, Upload, FileText, CheckCircle2 } from 'lucide-react';

export default function AddLenderPage({ client, onBack, onSave }) {
  const [lenders, setLenders] = useState(
    client?.lenders && client.lenders.length > 0 
      ? client.lenders 
      : [
          {
            id: 1,
            bank_name: '',
            loan_type: 'Personal Loan',
            balance: '',
            default_date: '',
            status: 'In Negotiation',
            lender_emails: '',
            pdf_file: null
          }
        ]
  );

  const [isSaving, setIsSaving] = useState(false);

  // Calculate total amount
  const totalAmount = lenders.reduce((sum, item) => {
    const val = parseFloat(String(item.balance).replace(/,/g, '')) || 0;
    return sum + val;
  }, 0);

  const handleAddMore = () => {
    setLenders(prev => [
      ...prev,
      {
        id: Date.now(),
        bank_name: '',
        loan_type: 'Personal Loan',
        balance: '',
        default_date: '',
        status: 'In Negotiation',
        lender_emails: '',
        pdf_file: null
      }
    ]);
  };

  const handleRemove = (id) => {
    if (lenders.length === 1) {
      // Clear instead of removing last row
      setLenders([
        {
          id: Date.now(),
          bank_name: '',
          loan_type: 'Personal Loan',
          balance: '',
          default_date: '',
          status: 'In Negotiation',
          lender_emails: '',
          pdf_file: null
        }
      ]);
      return;
    }
    setLenders(prev => prev.filter(item => item.id !== id));
  };

  const handleChange = (id, field, value) => {
    setLenders(prev =>
      prev.map(item => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleFileChange = (id, e) => {
    const file = e.target.files[0];
    if (file) {
      handleChange(id, 'pdf_file', file.name);
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    if (onSave) {
      await onSave(client?.id, lenders);
    }
    setIsSaving(false);
  };

  return (
    <div className="page-content" style={{ padding: '18px 24px', background: '#f8faf9', minHeight: '100vh' }}>
      
      {/* 1. Client Header Card (Exact Match with Screenshot) */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        padding: '14px 20px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
      }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
          Client: <span style={{ fontWeight: 700 }}>{client?.name || 'Mukesh Kumar'}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
            Total Amount : <span style={{ fontWeight: 700 }}>₹{totalAmount.toLocaleString('en-IN')}</span>
          </div>

          <button
            type="button"
            onClick={onBack}
            style={{
              background: '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              padding: '4px 12px',
              fontSize: '11.5px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              color: '#374151'
            }}
          >
            <ArrowLeft size={12} />
            <span>Back</span>
          </button>
        </div>
      </div>

      {/* 2. Lenders Details Card & Table */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        padding: '18px 20px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
      }}>
        <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#111827', marginBottom: '14px' }}>
          Lenders Details
        </div>

        <div style={{ overflowX: 'auto', marginBottom: '18px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#ffffff', borderBottom: '1px solid #e5e7eb', color: '#374151', fontSize: '10.5px' }}>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Bank Name</th>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Loan Type</th>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Balance</th>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Default Date</th>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Lender Emails</th>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>PDF</th>
                <th style={{ padding: '8px 10px', fontWeight: 600, textAlign: 'center' }}>Remove</th>
              </tr>
            </thead>
            <tbody>
              {lenders.map((item, idx) => (
                <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  {/* Bank Name */}
                  <td style={{ padding: '8px 6px' }}>
                    <input
                      type="text"
                      placeholder="e.g. HDFC Bank"
                      value={item.bank_name}
                      onChange={(e) => handleChange(item.id, 'bank_name', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db',
                        fontSize: '11px',
                        outline: 'none'
                      }}
                    />
                  </td>

                  {/* Loan Type */}
                  <td style={{ padding: '8px 6px' }}>
                    <select
                      value={item.loan_type}
                      onChange={(e) => handleChange(item.id, 'loan_type', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db',
                        fontSize: '11px',
                        outline: 'none',
                        background: '#ffffff'
                      }}
                    >
                      <option value="Personal Loan">Personal Loan</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Mobile App Loan">Mobile App Loan</option>
                      <option value="Business Loan">Business Loan</option>
                    </select>
                  </td>

                  {/* Balance */}
                  <td style={{ padding: '8px 6px' }}>
                    <input
                      type="text"
                      placeholder="0"
                      value={item.balance}
                      onChange={(e) => handleChange(item.id, 'balance', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db',
                        fontSize: '11px',
                        outline: 'none'
                      }}
                    />
                  </td>

                  {/* Default Date */}
                  <td style={{ padding: '8px 6px' }}>
                    <input
                      type="date"
                      value={item.default_date}
                      onChange={(e) => handleChange(item.id, 'default_date', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '5px 8px',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db',
                        fontSize: '11px',
                        outline: 'none',
                        background: '#ffffff',
                        cursor: 'pointer'
                      }}
                      onClick={(e) => {
                        try { e.target.showPicker(); } catch (err) {}
                      }}
                    />
                  </td>

                  {/* Status */}
                  <td style={{ padding: '8px 6px' }}>
                    <select
                      value={item.status}
                      onChange={(e) => handleChange(item.id, 'status', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db',
                        fontSize: '11px',
                        outline: 'none',
                        background: '#ffffff'
                      }}
                    >
                      <option value="In Negotiation">In Negotiation</option>
                      <option value="Settlement Requested">Settlement Requested</option>
                      <option value="Defaulted">Defaulted</option>
                      <option value="Active">Active</option>
                      <option value="Settled">Settled</option>
                    </select>
                  </td>

                  {/* Lender Emails */}
                  <td style={{ padding: '8px 6px' }}>
                    <input
                      type="email"
                      placeholder="nodalofficer@bank.com"
                      value={item.lender_emails}
                      onChange={(e) => handleChange(item.id, 'lender_emails', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db',
                        fontSize: '11px',
                        outline: 'none'
                      }}
                    />
                  </td>

                  {/* PDF Upload */}
                  <td style={{ padding: '8px 6px' }}>
                    <label style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 8px',
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      fontSize: '10.5px',
                      color: '#475569',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      maxWidth: '120px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      <Upload size={11} />
                      <span>{item.pdf_file ? item.pdf_file : 'Upload PDF'}</span>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => handleFileChange(item.id, e)}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </td>

                  {/* Remove */}
                  <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                      title="Remove row"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Actions: + Add More and Save */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={handleAddMore}
            style={{
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 16px',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 1px 2px rgba(37,99,235,0.2)'
            }}
          >
            <Plus size={12} />
            <span>Add More</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            style={{
              background: '#16a34a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 18px',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 1px 2px rgba(22,163,74,0.2)'
            }}
          >
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>

      </div>

    </div>
  );
}
