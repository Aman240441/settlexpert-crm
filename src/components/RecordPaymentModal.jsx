import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, IndianRupee, CreditCard, ArrowRight, ShieldCheck, FileText } from 'lucide-react';

const formatINR = (val) => {
  const num = typeof val === 'number' ? val : parseFloat(val) || 0;
  return '₹' + num.toLocaleString('en-IN');
};

export default function RecordPaymentModal({ isOpen, client, onClose, onPaymentSuccess }) {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [refNumber, setRefNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (client && isOpen) {
      const pending = parseFloat(client.pending_amount) || 0;
      setAmount(pending > 0 ? String(pending) : '');
      const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      setPaymentDate(today);
      setPaymentMethod('UPI');
      setRefNumber(`UPI/${new Date().getFullYear()}/${Math.floor(100000 + Math.random() * 900000)}`);
      setNotes('');
      setError('');
    }
  }, [client, isOpen]);

  if (!isOpen || !client) return null;

  const serviceFee = parseFloat(client.service_fee) || 0;
  const alreadyReceived = parseFloat(client.received_amount) || 0;
  const currentPending = parseFloat(client.pending_amount) || 0;
  const enteredAmount = parseFloat(amount) || 0;
  const remainingPendingAfterPayment = Math.max(0, currentPending - enteredAmount);
  const willBeFullyPaid = remainingPendingAfterPayment === 0 && (alreadyReceived + enteredAmount) >= serviceFee;

  const handleSetQuickAmount = (val) => {
    setAmount(String(val));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!enteredAmount || enteredAmount <= 0) {
      setError('Please enter a valid payment amount greater than 0');
      return;
    }
    if (enteredAmount > currentPending && currentPending > 0) {
      const confirmExtra = window.confirm(`Entered amount (${formatINR(enteredAmount)}) is higher than pending balance (${formatINR(currentPending)}). Do you wish to continue?`);
      if (!confirmExtra) return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('crm_token');
      const res = await fetch(`/api/clients/${client.id}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          amount: enteredAmount,
          payment_method: paymentMethod,
          reference_number: refNumber,
          payment_date: paymentDate,
          notes
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record payment');

      onPaymentSuccess(data.message || `Payment of ${formatINR(enteredAmount)} recorded successfully!`);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header" style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(15, 23, 42, 0) 100%)' }}>
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#22c55e', margin: 0 }}>
              <IndianRupee size={20} />
              Record Fee Payment
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Clear or reduce pending amount for <strong style={{ color: 'var(--text-primary)' }}>{client.name}</strong> ({client.client_id})
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

            {/* Current Financial Status Card */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              padding: '14px',
              borderRadius: '10px',
              background: 'var(--bg-hover)',
              border: '1px solid var(--border-color)'
            }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Service Fee</span>
                <div style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
                  {formatINR(serviceFee)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Already Received</span>
                <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#22c55e', marginTop: '2px' }}>
                  {formatINR(alreadyReceived)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Pending</span>
                <div style={{ fontSize: '1.05rem', fontWeight: '700', color: currentPending > 0 ? '#ef4444' : '#22c55e', marginTop: '2px' }}>
                  {formatINR(currentPending)}
                </div>
              </div>
            </div>

            {/* Quick Amount Buttons */}
            {currentPending > 0 && (
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Quick Select:</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '5px 10px', borderColor: 'rgba(34, 197, 94, 0.4)', color: '#22c55e' }}
                    onClick={() => handleSetQuickAmount(currentPending)}
                  >
                    Full Pending ({formatINR(currentPending)})
                  </button>
                  {currentPending > 5000 && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '5px 10px' }}
                      onClick={() => handleSetQuickAmount(Math.round(currentPending / 2))}
                    >
                      50% Partial ({formatINR(Math.round(currentPending / 2))})
                    </button>
                  )}
                  {currentPending >= 5000 && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '5px 10px' }}
                      onClick={() => handleSetQuickAmount(5000)}
                    >
                      ₹5,000
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Payment Input Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label>Payment Amount Received (₹) <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="Enter amount in ₹"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{ fontSize: '1.05rem', fontWeight: '600', color: '#22c55e' }}
                />
              </div>

              <div className="form-group">
                <label>Payment Mode</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="Net Banking / IMPS">Net Banking / IMPS / NEFT</option>
                  <option value="Debit / Credit Card">Debit / Credit Card</option>
                  <option value="Cash">Cash Receipt</option>
                  <option value="Cheque">Bank Cheque</option>
                </select>
              </div>

              <div className="form-group">
                <label>Payment / Deposit Date</label>
                <input
                  type="text"
                  placeholder="e.g. 14 Aug 2026"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Transaction / Reference ID</label>
                <input
                  type="text"
                  placeholder="e.g. UPI/123456789"
                  value={refNumber}
                  onChange={(e) => setRefNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Remarks / Notes</label>
              <input
                type="text"
                placeholder="Optional notes e.g., Second installment received"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Post-Payment Preview */}
            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: willBeFullyPaid ? 'rgba(34, 197, 94, 0.08)' : 'rgba(234, 179, 8, 0.08)',
              border: `1px solid ${willBeFullyPaid ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Status After This Payment:</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: willBeFullyPaid ? '#22c55e' : '#eab308', marginTop: '2px' }}>
                  {willBeFullyPaid ? '✅ Fees Status: 100% PAID' : `⏳ Fees Status: PENDING (Balance: ${formatINR(remainingPendingAfterPayment)})`}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>New Total Received:</div>
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#22c55e' }}>
                  {formatINR(alreadyReceived + enteredAmount)}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ background: '#22c55e', borderColor: '#22c55e' }} disabled={loading}>
              {loading ? 'Processing...' : (
                <>
                  <CheckCircle2 size={16} />
                  Confirm & Clear Payment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
