import React, { useState, useEffect } from 'react';
import { 
  User, 
  CreditCard, 
  ShieldAlert, 
  RotateCcw, 
  Save, 
  ArrowLeft,
  Calendar,
  Building,
  DollarSign
} from 'lucide-react';

export default function EditClientPage({ client, onBack, onSaveClient }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    client_id: '',
    phone: '',
    city: '',
    employment_status: 'Employed',
    employment_type: 'Salaried',
    outstanding_amount: '5 Lakh - 10 Lakh',
    monthly_income: '30000.00',
    credit_card_dues: 'no',
    personal_loan_dues: '7,93,145',
    loan_type: 'Personal Loan Settlement',
    paying_emis: 'Paying With Difficulty',
    harassment_calls: 'Yes',
    settlement_needed: 'YES',
    consultation_timing: '10:00 AM - 12:00 PM',
    lead_status: 'Converted',
    case_status: 'Active',
    service_fee: '24000.00',
    fees_date: '2026-08-07'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || 'Mukesh Kumar',
        email: client.email || 'avikormukesh1977@gmail.com',
        client_id: client.client_id || 'RD533',
        phone: client.phone || '9997332524',
        city: client.city || 'Uttrakhand',
        employment_status: client.employment_status || 'Employed',
        employment_type: client.employment_type || 'Salaried',
        outstanding_amount: client.outstanding_amount || '5 Lakh - 10 Lakh',
        monthly_income: client.monthly_income ? String(client.monthly_income) : '30000.00',
        credit_card_dues: client.credit_card_dues || 'no',
        personal_loan_dues: client.personal_loan_dues || '7,93,145',
        loan_type: client.loan_type || 'Personal Loan Settlement',
        paying_emis: client.paying_emis || client.default_status || 'Paying With Difficulty',
        harassment_calls: client.harassment_calls || 'Yes',
        settlement_needed: client.settlement_needed || 'YES',
        consultation_timing: client.consultation_timing || '10:00 AM - 12:00 PM',
        lead_status: client.lead_status || 'Converted',
        case_status: client.case_status || 'Active',
        service_fee: client.service_fee ? String(client.service_fee) : '24000.00',
        fees_date: client.fees_date_raw || '2026-08-07'
      });
    }
  }, [client]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert('Name is required');

    setIsSubmitting(true);
    if (onSaveClient) {
      await onSaveClient({
        ...client,
        ...formData
      });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="page-content" style={{ padding: '20px 24px', background: '#f8faf9', minHeight: '100vh' }}>
      
      {/* Top Header Row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '22px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          background: '#eff6ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#2563eb'
        }}>
          <User size={20} />
        </div>

        <div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>
            Edit Client Details
          </div>
          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
            Modify profile information and case records
          </div>
        </div>
      </div>

      {/* Main Form Container */}
      <form onSubmit={handleSubmit} style={{
        background: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        padding: '24px 26px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        
        {/* ================= 1. IDENTITY DETAILS ================= */}
        <div style={{ marginBottom: '26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <User size={14} color="#2563eb" />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb', letterSpacing: '0.5px' }}>
              IDENTITY DETAILS
            </span>
          </div>

          {/* Row 1: Full Name, Email Address, Client ID */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '18px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '4px' }}>
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Mukesh Kumar"
                required
                style={{
                  width: '100%',
                  padding: '7px 12px',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  fontSize: '12px',
                  outline: 'none',
                  background: '#ffffff'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '4px' }}>
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="avikormukesh1977@gmail.com"
                required
                style={{
                  width: '100%',
                  padding: '7px 12px',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  fontSize: '12px',
                  outline: 'none',
                  background: '#ffffff'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '4px' }}>
                Client ID
              </label>
              <input
                type="text"
                name="client_id"
                value={formData.client_id}
                onChange={handleChange}
                placeholder="RD533"
                style={{
                  width: '100%',
                  padding: '7px 12px',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  fontSize: '12px',
                  outline: 'none',
                  background: '#ffffff'
                }}
              />
            </div>
          </div>

          {/* Row 2: Primary Phone, City/Location, Employment Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '18px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '4px' }}>
                Primary Phone
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="9997332524"
                required
                style={{
                  width: '100%',
                  padding: '7px 12px',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  fontSize: '12px',
                  outline: 'none',
                  background: '#ffffff'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '4px' }}>
                City/Location
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Uttrakhand"
                style={{
                  width: '100%',
                  padding: '7px 12px',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  fontSize: '12px',
                  outline: 'none',
                  background: '#ffffff'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '4px' }}>
                Employment Status
              </label>
              <select
                name="employment_status"
                value={formData.employment_status}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '7px 12px',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  fontSize: '12px',
                  outline: 'none',
                  background: '#ffffff'
                }}
              >
                <option value="Employed">Employed</option>
                <option value="Unemployed">Unemployed</option>
                <option value="Self Employed">Self Employed</option>
                <option value="Business">Business</option>
              </select>
            </div>
          </div>

          {/* Row 3: Employment Type */}
          <div style={{ maxWidth: '32%' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '4px' }}>
              Employment Type
            </label>
            <select
              name="employment_type"
              value={formData.employment_type}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '7px 12px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                fontSize: '12px',
                outline: 'none',
                background: '#ffffff'
              }}
            >
              <option value="Salaried">Salaried</option>
              <option value="Self Employed">Self Employed</option>
              <option value="Business">Business</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* ================= 2. FINANCIAL PROFILE ================= */}
        <div style={{ marginBottom: '26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <CreditCard size={14} color="#2563eb" />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb', letterSpacing: '0.5px' }}>
              FINANCIAL PROFILE
            </span>
          </div>

          {/* Row 1: Total Outstanding Amount, Monthly Income, Credit Card Dues, Personal Loan Dues */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '4px' }}>
                Total Outstanding Amount
              </label>
              <input
                type="text"
                name="outstanding_amount"
                value={formData.outstanding_amount}
                onChange={handleChange}
                placeholder="5 Lakh - 10 Lakh"
                style={{
                  width: '100%',
                  padding: '7px 12px',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  fontSize: '12px',
                  outline: 'none',
                  background: '#ffffff'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '4px' }}>
                Monthly Income
              </label>
              <input
                type="number"
                name="monthly_income"
                value={formData.monthly_income}
                onChange={handleChange}
                placeholder="30000.00"
                style={{
                  width: '100%',
                  padding: '7px 12px',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  fontSize: '12px',
                  outline: 'none',
                  background: '#ffffff'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '4px' }}>
                Credit Card Dues
              </label>
              <input
                type="text"
                name="credit_card_dues"
                value={formData.credit_card_dues}
                onChange={handleChange}
                placeholder="no"
                style={{
                  width: '100%',
                  padding: '7px 12px',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  fontSize: '12px',
                  outline: 'none',
                  background: '#ffffff'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '4px' }}>
                Personal Loan Dues
              </label>
              <input
                type="text"
                name="personal_loan_dues"
                value={formData.personal_loan_dues}
                onChange={handleChange}
                placeholder="7,93,145"
                style={{
                  width: '100%',
                  padding: '7px 12px',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  fontSize: '12px',
                  outline: 'none',
                  background: '#ffffff'
                }}
              />
            </div>
          </div>

          {/* Row 2: Loan Type */}
          <div style={{ maxWidth: '24%' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '4px' }}>
              Loan Type
            </label>
            <input
              type="text"
              name="loan_type"
              value={formData.loan_type}
              onChange={handleChange}
              placeholder="Personal Loan Settlement"
              style={{
                width: '100%',
                padding: '7px 12px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                fontSize: '12px',
                outline: 'none',
                background: '#ffffff'
              }}
            />
          </div>
        </div>

        {/* ================= 3. STATUS & BUSINESS ================= */}
        <div style={{ marginBottom: '26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <ShieldAlert size={14} color="#2563eb" />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb', letterSpacing: '0.5px' }}>
              STATUS & BUSINESS
            </span>
          </div>

          {/* Row 1: Currently paying EMIs?, Harassment Calls, Settlement Needed?, Consultation Timing */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '4px' }}>
                Currently paying EMIs?
              </label>
              <input
                type="text"
                name="paying_emis"
                value={formData.paying_emis}
                onChange={handleChange}
                placeholder="Paying With Difficulty"
                style={{
                  width: '100%',
                  padding: '7px 12px',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  fontSize: '12px',
                  outline: 'none',
                  background: '#ffffff'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '4px' }}>
                Harassment Calls
              </label>
              <select
                name="harassment_calls"
                value={formData.harassment_calls}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '7px 12px',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  fontSize: '12px',
                  outline: 'none',
                  background: '#ffffff'
                }}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '4px' }}>
                Settlement Needed?
              </label>
              <select
                name="settlement_needed"
                value={formData.settlement_needed}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '7px 12px',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  fontSize: '12px',
                  outline: 'none',
                  background: '#ffffff'
                }}
              >
                <option value="YES">YES</option>
                <option value="NO">NO</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '4px' }}>
                Consultation Timing
              </label>
              <select
                name="consultation_timing"
                value={formData.consultation_timing}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '7px 12px',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  fontSize: '12px',
                  outline: 'none',
                  background: '#ffffff'
                }}
              >
                <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
                <option value="12:00 PM - 02:00 PM">12:00 PM - 02:00 PM</option>
                <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
                <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM</option>
                <option value="06:00 PM - 08:00 PM">06:00 PM - 08:00 PM</option>
              </select>
            </div>
          </div>

          {/* Row 2: Lead Status, Case Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '4px' }}>
                Lead Status
              </label>
              <input
                type="text"
                name="lead_status"
                value={formData.lead_status}
                onChange={handleChange}
                placeholder="Converted"
                style={{
                  width: '100%',
                  padding: '7px 12px',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  fontSize: '12px',
                  outline: 'none',
                  background: '#ffffff'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '4px' }}>
                Case Status
              </label>
              <select
                name="case_status"
                value={formData.case_status}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '7px 12px',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  fontSize: '12px',
                  outline: 'none',
                  background: '#ffffff'
                }}
              >
                <option value="Active">Active</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>
        </div>

        {/* ================= 4. PAYMENTS RECORD ================= */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <CreditCard size={14} color="#2563eb" />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb', letterSpacing: '0.5px' }}>
              PAYMENTS RECORD
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '4px' }}>
                Service Fee
              </label>
              <input
                type="number"
                name="service_fee"
                value={formData.service_fee}
                onChange={handleChange}
                placeholder="24000.00"
                style={{
                  width: '100%',
                  padding: '7px 12px',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  fontSize: '12px',
                  outline: 'none',
                  background: '#ffffff'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '4px' }}>
                Fees Date
              </label>
              <input
                type="date"
                name="fees_date"
                value={formData.fees_date}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '7px 12px',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  fontSize: '12px',
                  outline: 'none',
                  background: '#ffffff',
                  cursor: 'pointer'
                }}
                onClick={(e) => {
                  try { e.target.showPicker(); } catch (err) {}
                }}
              />
            </div>
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              background: '#0d544c',
              color: '#ffffff',
              border: 'none',
              borderRadius: '20px',
              padding: '8px 22px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 3px rgba(13,84,76,0.2)'
            }}
          >
            <Save size={13} />
            <span>{isSubmitting ? 'Updating...' : 'Update client data'}</span>
          </button>

          <button
            type="button"
            onClick={onBack}
            style={{
              background: '#ffffff',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '20px',
              padding: '8px 20px',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ArrowLeft size={13} />
            <span>Cancel</span>
          </button>
        </div>

      </form>

    </div>
  );
}
