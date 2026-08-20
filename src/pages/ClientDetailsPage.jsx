import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  SquarePen, 
  User, 
  Building2, 
  CreditCard, 
  Settings, 
  Clock, 
  ShieldAlert,
  MapPin,
  Mail,
  Phone,
  FileCheck,
  Plus,
  Eye,
  Edit2
} from 'lucide-react';

export default function ClientDetailsPage({ client, onBack, onEditClient, onViewAgreement, onCreateAgreement, onEditAgreement }) {
  const [clientAgreements, setClientAgreements] = useState([]);
  const [loadingAgreements, setLoadingAgreements] = useState(true);

  useEffect(() => {
    if (!client) return;
    const fetchClientAgreements = async () => {
      try {
        setLoadingAgreements(true);
        const token = localStorage.getItem('crm_token');
        const res = await fetch(`/api/agreements?search=${encodeURIComponent(client.name || '')}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const data = await res.json();
        const matches = (data.data || []).filter(a => 
          String(a.client_id_ref) === String(client.id) || 
          String(a.client_name).trim().toLowerCase() === String(client.name).trim().toLowerCase()
        );
        setClientAgreements(matches.length > 0 ? matches : (data.data || []));
      } catch (err) {
        console.error('Failed to fetch client agreements:', err);
      } finally {
        setLoadingAgreements(false);
      }
    };
    fetchClientAgreements();
  }, [client]);

  if (!client) {
    return (
      <div className="page-content" style={{ padding: '24px' }}>
        <button onClick={onBack} className="btn-secondary" style={{ marginBottom: '16px' }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div>No client data available.</div>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ padding: '18px 24px', background: '#f8faf9', minHeight: '100vh' }}>
      
      {/* 1. Top Client Header Bar */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px 20px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        {/* Left: Avatar, Name & Case Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '6px',
            background: '#f0fdfa',
            border: '1.5px solid #0d9488',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0d9488'
          }}>
            <User size={22} />
          </div>

          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '3px' }}>
              {client.name || 'Mukesh Kumar'}
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              background: '#eff6ff',
              color: '#2563eb',
              borderRadius: '12px',
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: 600
            }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#2563eb' }}></span>
              <span>Case Status: {client.case_status || 'Active'}</span>
            </div>
          </div>
        </div>

        {/* Right: Back & Edit Client Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              background: '#ffffff',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ArrowLeft size={13} />
            <span>Back</span>
          </button>

          <button
            type="button"
            onClick={() => onEditClient(client)}
            style={{
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 16px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(37,99,235,0.2)'
            }}
          >
            <SquarePen size={13} />
            <span>Edit Client</span>
          </button>
        </div>
      </div>

      {/* 2. Main Content 2-Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr', gap: '20px' }}>
        
        {/* ================= LEFT COLUMN ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Card 1: PERSONAL & CONTACT INFORMATION */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '20px 22px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <User size={15} color="#2563eb" />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#1e293b', letterSpacing: '0.5px' }}>
                PERSONAL & CONTACT INFORMATION
              </span>
            </div>

            {/* Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '9.5px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                  Full Name
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#111827' }}>
                  {client.name || 'Mukesh Kumar'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '9.5px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                  Email Address
                </div>
                <div style={{ fontSize: '12px', color: '#111827', fontWeight: 500 }}>
                  {client.email || 'avikormukesh1977@gmail.com'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '9.5px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                  Phone Number
                </div>
                <div style={{ fontSize: '12px', color: '#111827', fontWeight: 500 }}>
                  {client.phone || '9997332524'}
                </div>
              </div>
            </div>

            {/* Row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '9.5px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                  City
                </div>
                <div style={{ fontSize: '12px', color: '#111827', fontWeight: 500 }}>
                  {client.city || 'Uttrakhand'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '9.5px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                  Employment Status
                </div>
                <div style={{ fontSize: '12px', color: '#111827', fontWeight: 500 }}>
                  {client.employment_status || 'Employed'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '9.5px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                  Employment Type
                </div>
                <div style={{ fontSize: '12px', color: '#111827', fontWeight: 500 }}>
                  {client.employment_type || 'Salaried'}
                </div>
              </div>
            </div>

            {/* Row 3 */}
            <div>
              <div style={{ fontSize: '9.5px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                Created On
              </div>
              <div style={{ fontSize: '12px', color: '#111827', fontWeight: 500 }}>
                {client.fees_date || '07 Aug 2026'}
              </div>
            </div>
          </div>

          {/* Card 2: LOAN & DEBT PROFILE */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '20px 22px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <Building2 size={15} color="#ef4444" />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#1e293b', letterSpacing: '0.5px' }}>
                LOAN & DEBT PROFILE
              </span>
            </div>

            {/* Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '9.5px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                  Outstanding Amount
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#0284c7' }}>
                  {client.outstanding_amount || '5 Lakh - 10 Lakh'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '9.5px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                  Monthly Income
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#111827' }}>
                  ₹ {client.monthly_income ? parseFloat(client.monthly_income).toLocaleString('en-IN') : '30,000.00'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '9.5px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                  Credit Card Dues
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#ef4444' }}>
                  {client.credit_card_dues || 'no'}
                </div>
              </div>
            </div>

            {/* Row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '9.5px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                  Personal Loan Dues
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#ef4444' }}>
                  {client.personal_loan_dues || '7,93,145'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '9.5px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                  Loan Type
                </div>
                <div style={{ fontSize: '12px', color: '#111827', fontWeight: 500 }}>
                  {client.loan_type || 'Personal Loan Settlement'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '9.5px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                  Default Status
                </div>
                <div style={{ fontSize: '12px', color: '#111827', fontWeight: 500 }}>
                  {client.default_status || 'Paying With Difficulty'}
                </div>
              </div>
            </div>

            {/* Row 3 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '9.5px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                  Harassment Calls
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#ef4444' }}>
                  {client.harassment_calls || 'Yes'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '9.5px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                  Settlement Needed?
                </div>
                <div style={{ fontSize: '12px', color: '#111827', fontWeight: 600 }}>
                  {client.settlement_needed || 'YES'}
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* ================= RIGHT COLUMN ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Card 1: SERVICE & PAYMENTS */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '20px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <CreditCard size={15} color="#16a34a" />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#1e293b', letterSpacing: '0.5px' }}>
                SERVICE & PAYMENTS
              </span>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '9.5px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                Consultation Timing
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#111827' }}>
                <Clock size={13} color="#6b7280" />
                <span>{client.consultation_timing || '10:00 AM - 12:00 PM'}</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '9.5px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                Service Fee (Agreed)
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>
                ₹ {parseFloat(client.service_fee || 24000).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Card 2: SYSTEM STATUS */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '20px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Settings size={15} color="#f59e0b" />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#1e293b', letterSpacing: '0.5px' }}>
                SYSTEM STATUS
              </span>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '9.5px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                Lead Lifecycle Status
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>
                CONVERTED
              </div>
            </div>

            <div>
              <div style={{ fontSize: '9.5px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                Assigned Consultant Name
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500, color: '#111827' }}>
                <User size={13} color="#6b7280" />
                <span>{client.assigned_consultant || 'Dhruv'}</span>
              </div>
            </div>
          </div>

          {/* Card 3: AGREEMENTS */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '20px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck size={15} color="#16a34a" />
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#1e293b', letterSpacing: '0.5px' }}>
                  AGREEMENTS
                </span>
              </div>
              <button
                type="button"
                onClick={() => onCreateAgreement ? onCreateAgreement(client) : null}
                style={{
                  background: '#f0fdf4',
                  color: '#15803d',
                  border: '1px solid #86efac',
                  borderRadius: '4px',
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Plus size={11} />
                <span>New Agreement</span>
              </button>
            </div>

            {loadingAgreements ? (
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Loading agreements...</div>
            ) : clientAgreements.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {clientAgreements.map((ag, idx) => (
                  <div key={ag.id || idx} style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '12px',
                    fontSize: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong style={{ color: '#0f172a' }}>Agreement #{idx + 1}</strong>
                      <span style={{
                        background: '#dcfce7',
                        color: '#15803d',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '10.5px',
                        fontWeight: 700
                      }}>
                        {ag.status || 'Active'}
                      </span>
                    </div>
                    <div style={{ color: '#475569', fontSize: '11.5px', marginBottom: '2px' }}>
                      <strong>Date:</strong> {ag.agreement_date || ag.fees_date || 'N/A'}
                    </div>
                    <div style={{ color: '#475569', fontSize: '11.5px', marginBottom: '8px' }}>
                      <strong>Fee:</strong> ₹ {parseFloat(ag.service_fee || client.service_fee || 0).toLocaleString('en-IN')}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => onViewAgreement ? onViewAgreement(ag) : null}
                        style={{
                          background: '#16a34a',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 8px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                      >
                        <Eye size={12} />
                        <span>View / PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditAgreement ? onEditAgreement(ag) : (onCreateAgreement ? onCreateAgreement({ ...ag, ...client, isEditAgreement: true }) : null)}
                        style={{
                          background: '#2563eb',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 8px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                      >
                        <Edit2 size={12} />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>No Agreement Found</div>
                <button
                  type="button"
                  onClick={() => onCreateAgreement ? onCreateAgreement(client) : null}
                  style={{
                    background: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '6px 14px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Plus size={12} />
                  <span>Create Agreement</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
