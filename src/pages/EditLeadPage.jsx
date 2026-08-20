import React, { useState, useEffect } from 'react';
import { User, ArrowLeft, Save, X } from 'lucide-react';

export default function EditLeadPage({ lead, onBack, onSaveLead }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    outstanding_amount: 'Less Than ₹1,00,000',
    monthly_income: '0',
    loan_type: 'Select Service',
    paying_emis: 'Select Status',
    harassment_calls: 'Select',
    employment_status: 'Employed',
    employment_type: 'Salaried',
    settlement_needed: 'YES',
    consultation_timing: '10:00 AM - 12:00 PM',
    credit_card_dues: '',
    personal_loan_dues: '',
    service_fee: '',
    lead_status: 'New'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || 'Dashrath Sanap',
        phone: lead.phone || '9702991515',
        email: lead.email || 'dashrath1087@gmail.com',
        city: lead.city || 'kalyan',
        outstanding_amount: lead.outstanding_amount || 'Less Than ₹1,00,000',
        monthly_income: lead.monthly_income ? String(lead.monthly_income) : '0',
        loan_type: lead.loan_type || 'mobile_app_loan_settlement',
        paying_emis: lead.paying_emis || (lead.default_status === 'no' ? 'No' : 'Select Status'),
        harassment_calls: lead.harassment_calls || 'Select',
        employment_status: lead.employment_status || 'Employed',
        employment_type: lead.employment_type || 'Salaried',
        settlement_needed: lead.settlement_needed || 'YES',
        consultation_timing: lead.consultation_timing || '10:00 AM - 12:00 PM',
        credit_card_dues: lead.credit_card_dues || '',
        personal_loan_dues: lead.personal_loan_dues || '',
        service_fee: lead.service_fee || '',
        lead_status: lead.lead_status || 'New'
      });
    }
  }, [lead]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert('Full Name is required');
    if (!formData.phone.trim()) return alert('Phone Number is required');

    setIsSubmitting(true);
    if (onSaveLead) {
      await onSaveLead({
        ...lead,
        ...formData
      });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="page-content" style={{ padding: '18px 24px', background: '#f4f6f8', minHeight: '100vh' }}>
      
      {/* Top Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
        <button 
          type="button" 
          onClick={onBack}
          style={{
            background: '#86efac',
            color: '#14532d',
            border: 'none',
            borderRadius: '20px',
            padding: '6px 16px',
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
          <User size={18} color="#2563eb" />
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>EditLead</span>
        </div>
      </div>

      {/* Main Form Container */}
      <form onSubmit={handleSubmit} style={{
        background: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        padding: '24px 28px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        
        {/* Row 1: Full Name & Phone Number */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', color: '#4b5563', marginBottom: '5px' }}>
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Dashrath Sanap"
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                fontSize: '12px',
                outline: 'none',
                background: '#ffffff'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11.5px', color: '#4b5563', marginBottom: '5px' }}>
              Phone Number *
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="9702991515"
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                fontSize: '12px',
                outline: 'none',
                background: '#ffffff'
              }}
            />
          </div>
        </div>

        {/* Row 2: Email & City */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', color: '#4b5563', marginBottom: '5px' }}>
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="dashrath1087@gmail.com"
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                fontSize: '12px',
                outline: 'none',
                background: '#ffffff'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11.5px', color: '#4b5563', marginBottom: '5px' }}>
              City *
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="kalyan"
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                fontSize: '12px',
                outline: 'none',
                background: '#ffffff'
              }}
            />
          </div>
        </div>

        {/* Row 3: Total Outstanding Amount & Monthly Income */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', color: '#4b5563', marginBottom: '5px' }}>
              Total Outstanding Amount *
            </label>
            <select
              name="outstanding_amount"
              value={formData.outstanding_amount}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                fontSize: '12px',
                outline: 'none',
                background: '#ffffff'
              }}
            >
              <option value="Less Than ₹1,00,000">Less Than ₹1,00,000</option>
              <option value="₹1,00,000 - ₹5,00,000">₹1,00,000 - ₹5,00,000</option>
              <option value="₹5,00,000 - ₹10,00,000">₹5,00,000 - ₹10,00,000</option>
              <option value="₹10,00,000 - ₹20,00,000">₹10,00,000 - ₹20,00,000</option>
              <option value="Above ₹20,00,000">Above ₹20,00,000</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11.5px', color: '#4b5563', marginBottom: '5px' }}>
              Monthly Income *
            </label>
            <input
              type="number"
              name="monthly_income"
              value={formData.monthly_income}
              onChange={handleChange}
              placeholder="0"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                fontSize: '12px',
                outline: 'none',
                background: '#ffffff'
              }}
            />
          </div>
        </div>

        {/* Row 4: Type of Service Needed & Currently paying EMIs? */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', color: '#4b5563', marginBottom: '5px' }}>
              Type of Service Needed
            </label>
            <select
              name="loan_type"
              value={formData.loan_type}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                fontSize: '12px',
                outline: 'none',
                background: '#ffffff'
              }}
            >
              <option value="Select Service">Select Service</option>
              <option value="mobile_app_loan_settlement">mobile_app_loan_settlement</option>
              <option value="personal_loan_settlement">personal_loan_settlement</option>
              <option value="credit_card_settlement">credit_card_settlement</option>
              <option value="all_unsecured_loans">all_unsecured_loans</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11.5px', color: '#4b5563', marginBottom: '5px' }}>
              Currently paying EMIs?
            </label>
            <select
              name="paying_emis"
              value={formData.paying_emis}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                fontSize: '12px',
                outline: 'none',
                background: '#ffffff'
              }}
            >
              <option value="Select Status">Select Status</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
        </div>

        {/* Row 5: Are you facing any harassment? & Employed/Unemployed */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', color: '#4b5563', marginBottom: '5px' }}>
              Are you facing any harassment?
            </label>
            <select
              name="harassment_calls"
              value={formData.harassment_calls}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px 12px',
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
            <label style={{ display: 'block', fontSize: '11.5px', color: '#4b5563', marginBottom: '5px' }}>
              Employed/Unemployed *
            </label>
            <select
              name="employment_status"
              value={formData.employment_status}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px 12px',
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

        {/* Row 6: Employment Type & Settlement of personal loan needed? */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', color: '#4b5563', marginBottom: '5px' }}>
              Employment Type *
            </label>
            <select
              name="employment_type"
              value={formData.employment_type}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px 12px',
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

          <div>
            <label style={{ display: 'block', fontSize: '11.5px', color: '#4b5563', marginBottom: '5px' }}>
              Settlement of personal loan needed? *
            </label>
            <select
              name="settlement_needed"
              value={formData.settlement_needed}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px 12px',
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
        </div>

        {/* Row 7: Consultation Timing & Credit Card Dues */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', color: '#4b5563', marginBottom: '5px' }}>
              Consultation Timing *
            </label>
            <select
              name="consultation_timing"
              value={formData.consultation_timing}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px 12px',
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

          <div>
            <label style={{ display: 'block', fontSize: '11.5px', color: '#4b5563', marginBottom: '5px' }}>
              Credit Card Dues *
            </label>
            <input
              type="text"
              name="credit_card_dues"
              value={formData.credit_card_dues}
              onChange={handleChange}
              placeholder="Enter your answer"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                fontSize: '12px',
                outline: 'none',
                background: '#ffffff'
              }}
            />
          </div>
        </div>

        {/* Row 8: Personal Loan Dues & Service Fees */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', color: '#4b5563', marginBottom: '5px' }}>
              Personal Loan Dues *
            </label>
            <input
              type="text"
              name="personal_loan_dues"
              value={formData.personal_loan_dues}
              onChange={handleChange}
              placeholder="Enter your answer"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                fontSize: '12px',
                outline: 'none',
                background: '#ffffff'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11.5px', color: '#4b5563', marginBottom: '5px' }}>
              Service Fees *
            </label>
            <input
              type="text"
              name="service_fee"
              value={formData.service_fee}
              onChange={handleChange}
              placeholder="Enter your answer"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                fontSize: '12px',
                outline: 'none',
                background: '#ffffff'
              }}
            />
          </div>
        </div>

        {/* Row 9: Status */}
        <div style={{ maxWidth: '48%', marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '11.5px', color: '#4b5563', marginBottom: '5px' }}>
            Status
          </label>
          <select
            name="lead_status"
            value={formData.lead_status}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #d1d5db',
              fontSize: '12px',
              outline: 'none',
              background: '#ffffff'
            }}
          >
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Interested">Interested</option>
            <option value="Follow up">Follow up</option>
            <option value="Converted">Converted</option>
            <option value="Not Interested">Not Interested</option>
          </select>
        </div>

        {/* Bottom Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '20px',
              padding: '8px 22px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(37,99,235,0.25)'
            }}
          >
            {isSubmitting ? 'Updating...' : 'Update Lead'}
          </button>

          <button
            type="button"
            onClick={onBack}
            style={{
              background: '#86efac',
              color: '#14532d',
              border: 'none',
              borderRadius: '20px',
              padding: '8px 20px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>

      </form>

    </div>
  );
}
