import React, { useState } from 'react';
import { 
  UserPlus, 
  User, 
  CreditCard, 
  ShieldAlert, 
  Save, 
  ArrowLeft
} from 'lucide-react';

export default function AddClientPage({ onBack, onSaveClient }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    client_id: '',
    phone: '',
    city: '',
    employment_status: 'Select Status',
    employment_type: 'Select Type',
    outstanding_amount: '',
    monthly_income: '',
    credit_card_dues: '',
    personal_loan_dues: '',
    loan_type: 'Select Service',
    paying_emis: 'Select Status',
    harassment_calls: 'Select',
    settlement_needed: 'Select',
    consultation_timing: 'Select Timing',
    case_status: 'Active',
    service_fee: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert('Full Name is required');

    setIsSubmitting(true);
    if (onSaveClient) {
      await onSaveClient({
        ...formData,
        client_id: formData.client_id.trim() || `RD${Math.floor(100 + Math.random() * 900)}`,
        pending_amount: parseFloat(formData.service_fee || 0),
        received_amount: 0,
        this_month_received: 0,
        fees_date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
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
          <UserPlus size={20} />
        </div>

        <div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>
            Add New Client
          </div>
          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
            Create new client profile
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
                placeholder="Auto Generate (RD001)"
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

          {/* Row 2: Phone, City, Employment Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '18px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '4px' }}>
                Phone
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
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
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '4px' }}>
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
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
                <option value="Select Status">Select Status</option>
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
              <option value="Select Type">Select Type</option>
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
                placeholder="Enter amount"
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
                style={{
                  width: '100%',
                  padding: '7px 12px',
                  borderRadius: '4px',
                  border: '1px solid #3b82f6',
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
            <select
              name="loan_type"
              value={formData.loan_type}
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
              <option value="Select Service">Select Service</option>
              <option value="Personal Loan Settlement">Personal Loan Settlement</option>
              <option value="Credit Card Settlement">Credit Card Settlement</option>
              <option value="Mobile App Loan Settlement">Mobile App Loan Settlement</option>
              <option value="All Unsecured Loans">All Unsecured Loans</option>
            </select>
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

          {/* Row 1: Currently paying EMIs ?, Harassment Calls, Settlement Needed?, Consultation Timing */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '4px' }}>
                Currently paying EMIs ?
              </label>
              <select
                name="paying_emis"
                value={formData.paying_emis}
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
                <option value="Select Status">Select Status</option>
                <option value="Paying With Difficulty">Paying With Difficulty</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
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
                <option value="Select">Select</option>
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
                <option value="Select">Select</option>
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
                <option value="Select Timing">Select Timing</option>
                <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
                <option value="12:00 PM - 02:00 PM">12:00 PM - 02:00 PM</option>
                <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
                <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM</option>
                <option value="06:00 PM - 08:00 PM">06:00 PM - 08:00 PM</option>
              </select>
            </div>
          </div>

          {/* Row 2: Case Status */}
          <div style={{ maxWidth: '24%' }}>
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

        {/* ================= 4. PAYMENTS RECORD ================= */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <CreditCard size={14} color="#2563eb" />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb', letterSpacing: '0.5px' }}>
              PAYMENTS RECORD
            </span>
          </div>

          <div style={{ maxWidth: '32%' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '4px' }}>
              Service Fee
            </label>
            <input
              type="number"
              name="service_fee"
              value={formData.service_fee}
              onChange={handleChange}
              placeholder=""
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

        {/* Bottom Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              background: '#0d544c',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
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
            <span>{isSubmitting ? 'Saving...' : 'Save Client'}</span>
          </button>

          <button
            type="button"
            onClick={onBack}
            style={{
              background: '#ffffff',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
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
