import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  FileText, 
  User, 
  Phone, 
  MapPin, 
  DollarSign, 
  CreditCard, 
  Briefcase, 
  Clock, 
  AlertCircle, 
  Calendar, 
  Mail, 
  Edit3, 
  History, 
  CheckCircle2,
  HelpCircle,
  IndianRupee,
  ShieldAlert,
  Send
} from 'lucide-react';

export default function FollowUpPage({ lead, onBack, onSaveFollowUp }) {
  const [callStatus, setCallStatus] = useState('Select');
  const [interestedLevel, setInterestedLevel] = useState('Select');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [finalStatus, setFinalStatus] = useState('Select');
  const [remark, setRemark] = useState('');
  const [history, setHistory] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize history from lead notes/history if present
  useEffect(() => {
    if (lead) {
      setFinalStatus(lead.lead_status || 'Select');
      // If there are existing follow-up records in notes or mock
      if (lead.followup_history) {
        setHistory(lead.followup_history);
      } else if (lead.notes && lead.notes.includes('[Follow-up')) {
        // Parse from notes
        setHistory([
          {
            id: 1,
            followUpBy: lead.assigned_consultant || 'Dhruv',
            callStatus: 'Connected',
            interest: 'High',
            status: lead.lead_status || 'Follow up',
            dateTime: new Date().toLocaleString(),
            remark: lead.notes,
            followUpDate: new Date().toISOString().split('T')[0]
          }
        ]);
      }
    }
  }, [lead]);

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!remark.trim() && callStatus === 'Select') {
      alert('Please enter a remark or select call status');
      return;
    }

    setIsSubmitting(true);
    const newRecord = {
      id: history.length + 1,
      followUpBy: lead?.assigned_consultant || 'Dhruv',
      callStatus: callStatus !== 'Select' ? callStatus : 'Connected',
      interest: interestedLevel !== 'Select' ? interestedLevel : 'Medium',
      status: finalStatus !== 'Select' ? finalStatus : 'Follow up',
      dateTime: new Date().toLocaleString(),
      remark: remark || 'Follow-up logged successfully',
      followUpDate: nextFollowUpDate || new Date().toISOString().split('T')[0]
    };

    const updatedHistory = [newRecord, ...history];
    setHistory(updatedHistory);

    if (onSaveFollowUp) {
      await onSaveFollowUp({
        ...lead,
        lead_status: finalStatus !== 'Select' ? finalStatus : lead?.lead_status,
        followup_history: updatedHistory,
        notes: remark ? `${lead?.notes ? lead.notes + '\n' : ''}[Follow-up: ${callStatus} | Next: ${nextFollowUpDate}]: ${remark}` : lead?.notes
      });
    }

    // Reset inputs
    setRemark('');
    setCallStatus('Select');
    setInterestedLevel('Select');
    setIsSubmitting(false);
  };

  if (!lead) {
    return (
      <div className="page-content" style={{ padding: '24px' }}>
        <button onClick={onBack} className="btn-secondary" style={{ marginBottom: '16px' }}>
          <ArrowLeft size={14} /> Back to Leads
        </button>
        <div>No lead selected.</div>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ padding: '16px 20px', background: '#f4f6f8', minHeight: '100vh' }}>
      
      {/* Top Breadcrumb / Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
        <button 
          type="button" 
          onClick={onBack}
          style={{
            background: '#86efac',
            color: '#14532d',
            border: 'none',
            borderRadius: '20px',
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
        >
          <span>&lt; Back to List</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} color="#2563eb" />
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Lead Information</span>
        </div>
      </div>

      {/* ================= 1. LEAD INFORMATION CARD ================= */}
      <div style={{
        background: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        padding: '20px 24px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        
        {/* Row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1.2fr 1.4fr', gap: '16px', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#9ca3af', marginBottom: '3px' }}>
              <User size={12} />
              <span>Name</span>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
              {lead.name || 'Dashrath Sanap'}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#9ca3af', marginBottom: '3px' }}>
              <Phone size={12} />
              <span>Phone</span>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
              {lead.phone || '9702991515'}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#9ca3af', marginBottom: '3px' }}>
              <MapPin size={12} />
              <span>City</span>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
              {lead.city || 'kalyan'}
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b', marginBottom: '3px' }}>
              <DollarSign size={12} />
              <span>Total Outstanding</span>
            </div>
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0284c7' }}>
              {lead.outstanding_amount || '₹1,00,000 - ₹5,00,000'}
            </div>
          </div>
        </div>

        {/* Row 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1.2fr 1.4fr', gap: '16px', marginBottom: '18px' }}>
          <div style={{ background: '#eff6ff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#3b82f6', marginBottom: '2px' }}>
              <CreditCard size={12} />
              <span>Monthly Income</span>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1d4ed8' }}>
              ₹ {lead.monthly_income ? parseFloat(lead.monthly_income).toLocaleString('en-IN') : '0'}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#9ca3af', marginBottom: '3px' }}>
              <CreditCard size={12} />
              <span>Credit Card Dues</span>
            </div>
            <div style={{ fontSize: '12px', color: '#4b5563', fontWeight: 500 }}>
              {lead.credit_card_dues || 'N/A'}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#9ca3af', marginBottom: '3px' }}>
              <Briefcase size={12} />
              <span>Personal Loan Dues</span>
            </div>
            <div style={{ fontSize: '12px', color: '#4b5563', fontWeight: 500 }}>
              {lead.personal_loan_dues || 'N/A'}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#9ca3af', marginBottom: '3px' }}>
              <FileText size={12} />
              <span>Service Needed</span>
            </div>
            <div style={{ fontSize: '12px', color: '#111827', fontWeight: 600 }}>
              {lead.loan_type || 'mobile_app_loan_settlement'}
            </div>
          </div>
        </div>

        {/* Row 3 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1.2fr 1.4fr', gap: '16px', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#9ca3af', marginBottom: '3px' }}>
              <Briefcase size={12} />
              <span>Employment Status</span>
            </div>
            <div style={{ fontSize: '12px', color: '#4b5563', fontWeight: 500 }}>
              {lead.employment_status || 'N/A'}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#9ca3af', marginBottom: '3px' }}>
              <Briefcase size={12} />
              <span>Employment Type</span>
            </div>
            <div style={{ fontSize: '12px', color: '#4b5563', fontWeight: 500 }}>
              {lead.employment_type || 'N/A'}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#9ca3af', marginBottom: '3px' }}>
              <CreditCard size={12} />
              <span>Paying EMIs?</span>
            </div>
            <div style={{ fontSize: '12px', color: '#4b5563', fontWeight: 500 }}>
              {lead.default_status === 'no' ? 'no' : (lead.paying_emis || 'no')}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#9ca3af', marginBottom: '3px' }}>
              <ShieldAlert size={12} />
              <span>Facing Harassment?</span>
            </div>
            <div style={{ fontSize: '12px', color: '#4b5563', fontWeight: 500 }}>
              {lead.harassment_calls || 'N/A'}
            </div>
          </div>
        </div>

        {/* Row 4 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1.2fr 1.4fr', gap: '16px', marginBottom: '18px', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#9ca3af', marginBottom: '3px' }}>
              <HelpCircle size={12} />
              <span>Settlement Needed?</span>
            </div>
            <div style={{ fontSize: '12px', color: '#4b5563', fontWeight: 500 }}>
              {lead.settlement_needed || 'N/A'}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#9ca3af', marginBottom: '3px' }}>
              <Clock size={12} />
              <span>Consultation Timing</span>
            </div>
            <div style={{ fontSize: '12px', color: '#4b5563', fontWeight: 500 }}>
              {lead.consultation_timing || 'N/A'}
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '16px', color: '#2563eb', fontWeight: 'bold' }}>₹</span>
            <div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>Service Fees</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>
                {lead.service_fee ? `₹${lead.service_fee}` : 'N/A'}
              </div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#9ca3af', marginBottom: '3px' }}>
              <CheckCircle2 size={12} />
              <span>Lead Status</span>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#16a34a' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#16a34a' }}></span>
              <span>{lead.lead_status || 'New'}</span>
            </div>
          </div>
        </div>

        {/* Row 5: Email */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#9ca3af', marginBottom: '3px' }}>
            <Mail size={12} />
            <span>Email</span>
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
            {lead.email || 'dashrath1087@gmail.com'}
          </div>
        </div>

      </div>

      {/* ================= 2. UPDATE FOLLOW-UP CARD ================= */}
      <div style={{
        background: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        padding: '20px 24px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#1f2937', marginBottom: '16px' }}>
          <Edit3 size={15} color="#2563eb" />
          <span>Update Follow-up</span>
        </div>

        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            
            {/* Call Status */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '4px' }}>Call Status</label>
              <select
                value={callStatus}
                onChange={(e) => setCallStatus(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '12px', background: '#ffffff', outline: 'none' }}
              >
                <option value="Select">Select</option>
                <option value="Connected">Connected</option>
                <option value="Not Connected">Not Connected</option>
                <option value="Busy">Busy</option>
                <option value="Switched Off">Switched Off</option>
                <option value="Ringing">Ringing</option>
                <option value="Call Back">Call Back</option>
              </select>
            </div>

            {/* Interested Level */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '4px' }}>Interested Level</label>
              <select
                value={interestedLevel}
                onChange={(e) => setInterestedLevel(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '12px', background: '#ffffff', outline: 'none' }}
              >
                <option value="Select">Select</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
                <option value="Not Interested">Not Interested</option>
              </select>
            </div>

            {/* Next Follow-up Date */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '4px' }}>Next Follow-up Date</label>
              <input
                type="date"
                value={nextFollowUpDate}
                onChange={(e) => setNextFollowUpDate(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '6px 10px', 
                  borderRadius: '4px', 
                  border: '1px solid #d1d5db', 
                  fontSize: '12px', 
                  background: '#ffffff', 
                  outline: 'none',
                  cursor: 'pointer',
                  color: nextFollowUpDate ? '#111827' : '#6b7280'
                }}
                onClick={(e) => {
                  try { e.target.showPicker(); } catch (err) {}
                }}
              />
            </div>

            {/* Final Status */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '4px' }}>Final Status</label>
              <select
                value={finalStatus}
                onChange={(e) => setFinalStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  border: finalStatus === 'Converted' ? '1.5px solid #15803d' : '1px solid #d1d5db',
                  fontSize: '12px',
                  background: finalStatus === 'Converted' ? '#f0fdf4' : '#ffffff',
                  color: finalStatus === 'Converted' ? '#15803d' : '#111827',
                  fontWeight: finalStatus === 'Converted' ? 700 : 400,
                  outline: 'none'
                }}
              >
                <option value="Select">Select</option>
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Interested">Interested</option>
                <option value="Follow up">Follow up</option>
                <option value="Converted">Converted ➔ Convert to Client</option>
                <option value="Not Interested">Not Interested</option>
              </select>
            </div>
          </div>

          {/* Conversion Notification Banner when Converted is selected */}
          {finalStatus === 'Converted' && (
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '6px',
              padding: '10px 14px',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#15803d'
            }}>
              <CheckCircle2 size={18} color="#15803d" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '12px' }}>
                <strong>Lead will be Converted to Client:</strong> Saving with status <em>"Converted"</em> will automatically convert this lead into an active Client and immediately open the <strong>Clients</strong> tab.
              </div>
            </div>
          )}

          {/* Remark */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '4px' }}>Remark</label>
            <textarea
              rows="3"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder=""
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                fontSize: '12px',
                outline: 'none',
                resize: 'vertical',
                background: '#f8fafc'
              }}
            />
          </div>

          {/* Save Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                background: finalStatus === 'Converted' ? 'linear-gradient(135deg, #15803d, #166534)' : '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 22px',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: finalStatus === 'Converted' ? '0 2px 8px rgba(21,128,61,0.3)' : '0 1px 2px rgba(37,99,235,0.2)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {isSubmitting ? (
                'Processing...'
              ) : finalStatus === 'Converted' ? (
                <>
                  <CheckCircle2 size={14} />
                  <span>Convert to Client & Go to Clients Tab</span>
                </>
              ) : (
                'Save Follow Up'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ================= 3. FOLLOW-UP HISTORY CARD ================= */}
      <div style={{
        background: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        padding: '20px 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#1f2937', marginBottom: '16px' }}>
          <History size={15} color="#2563eb" />
          <span>Follow-up History</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb', textAlign: 'left', color: '#4b5563' }}>
                <th style={{ padding: '8px 10px', fontWeight: 600, width: '40px' }}>#</th>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Follow-Up By</th>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Lead Call</th>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Lead Interest</th>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Lead Status</th>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Follow-Up Date & Time</th>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Remark</th>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Follow-Up Date</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '24px 10px', color: '#9ca3af', fontSize: '12px' }}>
                    No follow-ups yet
                  </td>
                </tr>
              ) : (
                history.map((h, i) => (
                  <tr key={h.id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 10px', color: '#6b7280' }}>{i + 1}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 500, color: '#111827' }}>{h.followUpBy}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ 
                        background: '#eff6ff', 
                        color: '#2563eb', 
                        padding: '2px 8px', 
                        borderRadius: '12px', 
                        fontSize: '10.5px', 
                        fontWeight: 600 
                      }}>
                        {h.callStatus}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', color: '#4b5563' }}>{h.interest}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ 
                        color: h.status === 'Converted' ? '#15803d' : '#0284c7', 
                        fontWeight: 600 
                      }}>
                        {h.status}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', color: '#6b7280' }}>{h.dateTime}</td>
                    <td style={{ padding: '8px 10px', color: '#374151' }}>{h.remark}</td>
                    <td style={{ padding: '8px 10px', color: '#6b7280' }}>{h.followUpDate}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
