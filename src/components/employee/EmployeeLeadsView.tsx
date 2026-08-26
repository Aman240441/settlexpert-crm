import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  ArrowLeft,
  Calendar,
  Phone,
  Building2,
  Clock,
  CheckCircle2,
  History,
  FileSignature,
  FileText,
  Edit,
  Download,
  Filter,
  Eye,
  X,
  UserCheck,
  CheckSquare,
  Square,
  MessageSquare,
  User
} from 'lucide-react';
import { api } from '../../services/api';
import { Modal } from '../common/Modal';
import { CalendarDateFilter, getTodayStr } from '../common/CalendarDateFilter';

interface EmployeeLeadsViewProps {
  initialStatusFilter?: string;
  onNavigateToAgreement?: (lead: any) => void;
}

export const EmployeeLeadsView: React.FC<EmployeeLeadsViewProps> = ({
  initialStatusFilter,
  onNavigateToAgreement
}) => {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter || 'all');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    new: 0,
    contacted: 0,
    interested: 0,
    follow_up: 0,
    converted: 0,
    not_interested: 0
  });

  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Screen Mode: 'list' | 'edit_lead' | 'follow_up'
  const [viewMode, setViewMode] = useState<'list' | 'edit_lead' | 'follow_up'>('list');
  const [currentLead, setCurrentLead] = useState<any>(null);

  // Edit Lead Form State (Matching Reference Screenshot 18 Fields)
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    total_debt_range: 'Less Than ₹1,00,000',
    total_debt: 100000,
    monthly_income: 0,
    service_needed: 'personal_loan_settlement',
    paying_emis: 'Select Status',
    harassment_calls: 'Select',
    employment_status: 'Employed',
    employment_type: 'Salaried',
    settlement_needed: 'YES',
    consultation_timing: '10:00 AM - 12:00 PM',
    credit_card_dues: '',
    personal_loan_dues: '',
    service_fee: '0',
    status: 'new'
  });

  // Follow-up Screen State
  const [selectedLeadForFollowUp, setSelectedLeadForFollowUp] = useState<any>(null);
  const [followUpHistory, setFollowUpHistory] = useState<any[]>([]);
  const [followUpFormData, setFollowUpFormData] = useState({
    call_status: 'Connected',
    interested_level: 'High',
    final_status: 'interested',
    remark: '',
    next_follow_up_date: new Date(Date.now() + 86400000).toISOString().split('T')[0]
  });

  // Add Lead Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newLeadData, setNewLeadData] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    total_debt: 500000,
    monthly_income: 35000,
    service_needed: 'personal_loan_settlement',
    status: 'new',
    loan_type: 'personal_loan_settlement',
    default_status: 'Defaulted',
    harassment_calls: 'No'
  });

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await api.getCRMLeads({
        search: search || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        date: selectedDate || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        page,
        limit
      });
      setLeads(res.leads || []);
      setTotal(res.pagination?.total || 0);
      if (res.statusCounts) {
        setStatusCounts(res.statusCounts);
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: 'Failed to load leads' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialStatusFilter !== undefined) {
      setStatusFilter(initialStatusFilter || 'all');
      setPage(1);
    }
  }, [initialStatusFilter]);

  useEffect(() => {
    fetchLeads();
  }, [search, statusFilter, selectedDate, fromDate, toDate, page, limit]);

  const handleApplyDateFilter = () => {
    setPage(1);
    fetchLeads();
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedLeadIds([]);
      setSelectAll(false);
    } else {
      setSelectedLeadIds(leads.map((l) => l.id));
      setSelectAll(true);
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedLeadIds.includes(id)) {
      setSelectedLeadIds(selectedLeadIds.filter((item) => item !== id));
      setSelectAll(false);
    } else {
      const updated = [...selectedLeadIds, id];
      setSelectedLeadIds(updated);
      if (updated.length === leads.length) {
        setSelectAll(true);
      }
    }
  };

  // Open Edit Lead Screen
  const handleOpenEditLead = (lead: any) => {
    setCurrentLead(lead);

    // Map debt value to dropdown range
    let debtRange = 'Less Than ₹1,00,000';
    const debtVal = parseFloat(lead.total_debt) || 0;
    if (debtVal >= 1000000) {
      debtRange = 'Above ₹10,000,000';
    } else if (debtVal >= 500000) {
      debtRange = '₹5,00,000 - ₹10,00,000';
    } else if (debtVal >= 100000) {
      debtRange = '₹1,00,000 - ₹5,00,000';
    }

    setEditFormData({
      name: lead.name || '',
      phone: lead.phone || '',
      email: lead.email || '',
      city: lead.city || 'Other City',
      total_debt_range: debtRange,
      total_debt: debtVal || 100000,
      monthly_income: lead.monthly_income || 0,
      service_needed: lead.service_needed || 'personal_loan_settlement',
      paying_emis: lead.paying_emis || 'Select Status',
      harassment_calls: lead.harassment_calls || 'Select',
      employment_status: lead.employment_status || 'Employed',
      employment_type: lead.employment_type || 'Salaried',
      settlement_needed: lead.settlement_needed || 'YES',
      consultation_timing: lead.consultation_timing || '10:00 AM - 12:00 PM',
      credit_card_dues: lead.credit_card_dues ? String(lead.credit_card_dues) : '',
      personal_loan_dues: lead.personal_loan_dues ? String(lead.personal_loan_dues) : '',
      service_fee: lead.service_fee ? String(lead.service_fee) : '0',
      status: lead.status || 'new'
    });
    setViewMode('edit_lead');
  };

  // Save Edit Lead
  const handleSaveEditLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Map debt range to numeric if needed
      let numericDebt = editFormData.total_debt;
      if (editFormData.total_debt_range === 'Less Than ₹1,00,000') numericDebt = 90000;
      else if (editFormData.total_debt_range === '₹1,00,000 - ₹5,00,000') numericDebt = 300000;
      else if (editFormData.total_debt_range === '₹5,00,000 - ₹10,00,000') numericDebt = 750000;
      else if (editFormData.total_debt_range === 'Above ₹10,000,000') numericDebt = 1200000;

      const payload = {
        name: editFormData.name,
        phone: editFormData.phone,
        email: editFormData.email,
        city: editFormData.city,
        total_debt: numericDebt,
        monthly_income: parseFloat(editFormData.monthly_income as any) || 0,
        service_needed: editFormData.service_needed,
        paying_emis: editFormData.paying_emis,
        harassment_calls: editFormData.harassment_calls,
        employment_status: editFormData.employment_status,
        employment_type: editFormData.employment_type,
        settlement_needed: editFormData.settlement_needed,
        consultation_timing: editFormData.consultation_timing,
        credit_card_dues: parseFloat(editFormData.credit_card_dues as any) || 0,
        personal_loan_dues: parseFloat(editFormData.personal_loan_dues as any) || 0,
        service_fee: parseFloat(editFormData.service_fee as any) || 0,
        status: editFormData.status
      };

      await api.updateCRMLead(currentLead.id, payload);
      setFeedbackMsg({ type: 'success', text: `Lead ${currentLead.lead_number} updated successfully!` });
      setViewMode('list');
      fetchLeads();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to update lead' });
    }
  };

  // Open Dedicated Follow-up Screen
  const handleOpenFollowUp = async (lead: any) => {
    setSelectedLeadForFollowUp(lead);
    setFollowUpFormData({
      call_status: 'Connected',
      interested_level: 'High',
      final_status: lead.status || 'interested',
      remark: '',
      next_follow_up_date: new Date(Date.now() + 86400000).toISOString().split('T')[0]
    });
    try {
      const hist = await api.getCRMFollowUps(lead.id);
      setFollowUpHistory(hist.followUps || []);
    } catch (e) {
      setFollowUpHistory([]);
    }
    setViewMode('follow_up');
  };

  // Save Follow-up (Appends to history)
  const handleSaveFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCRMFollowUp(selectedLeadForFollowUp.id, followUpFormData);
      setFeedbackMsg({ type: 'success', text: `Follow-up recorded successfully for ${selectedLeadForFollowUp.lead_number}!` });

      // Refresh follow-up history
      const hist = await api.getCRMFollowUps(selectedLeadForFollowUp.id);
      setFollowUpHistory(hist.followUps || []);

      // Update local lead status
      setSelectedLeadForFollowUp({
        ...selectedLeadForFollowUp,
        status: followUpFormData.final_status
      });

      // Clear remark
      setFollowUpFormData((prev) => ({ ...prev, remark: '' }));
      fetchLeads();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to record follow-up' });
    }
  };

  // Create Agreement Action (Navigates with Lead Preselected)
  const handleCreateAgreementAction = (lead: any) => {
    if (onNavigateToAgreement) {
      onNavigateToAgreement(lead);
    } else {
      setFeedbackMsg({ type: 'success', text: `Proceeding to create agreement for ${lead.name}...` });
    }
  };

  // Create New Lead
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createCRMLead(newLeadData);
      setFeedbackMsg({ type: 'success', text: `Lead ${res.lead?.lead_number || 'created'} registered successfully!` });
      setIsCreateOpen(false);
      setNewLeadData({
        name: '',
        phone: '',
        email: '',
        city: '',
        total_debt: 500000,
        monthly_income: 35000,
        service_needed: 'personal_loan_settlement',
        status: 'new',
        loan_type: 'personal_loan_settlement',
        default_status: 'Defaulted',
        harassment_calls: 'No'
      });
      fetchLeads();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to create lead' });
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (leads.length === 0) {
      setFeedbackMsg({ type: 'error', text: 'No leads to export' });
      return;
    }
    const headers = [
      'Lead ID',
      'Name',
      'Phone',
      'Email',
      'City',
      'Total Debt',
      'Monthly Income',
      'Service Needed',
      'Status',
      'Created Date'
    ];
    const rows = leads.map((l) => [
      l.lead_number,
      `"${l.name || ''}"`,
      l.phone || '',
      l.email || '',
      `"${l.city || ''}"`,
      l.total_debt || 0,
      l.monthly_income || 0,
      `"${l.service_needed || ''}"`,
      l.status || '',
      l.created_at || ''
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Leads_Export_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amt || 0);
  };

  // ==========================================
  // RENDER SCREEN: EDIT LEAD (Exact Reference Screenshot Match)
  // ==========================================
  if (viewMode === 'edit_lead') {
    return (
      <div className="space-y-4 font-sans text-slate-800 pb-16 ">
        {/* Header matching Screenshot: Green rounded Back button + Edit Lead */}
        <div className="flex items-center space-x-3 pb-1 border-b border-gray-200">
          <button
            onClick={() => setViewMode('list')}
            className="px-3.5 py-1.5 rounded-lg bg-[#10b981] hover:bg-emerald-600 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>&lt; Back to List</span>
          </button>
          <div className="flex items-center space-x-1.5 text-[#2563eb] font-bold text-sm">
            <User className="h-4 w-4" />
            <span>EditLead</span>
          </div>
        </div>

        {/* Edit Lead Form Card (2-Column Grid) */}
        <form onSubmit={handleSaveEditLead} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4 text-xs">
          {/* Row 1: Full Name & Phone Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Full Name *</label>
              <input
                type="text"
                required
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Phone Number *</label>
              <input
                type="tel"
                required
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Row 2: Email & City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Email *</label>
              <input
                type="email"
                required
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="text-slate-600 block mb-1 font-semibold">City *</label>
              <input
                type="text"
                required
                value={editFormData.city}
                onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                placeholder="Other City"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Row 3: Total Outstanding Amount & Monthly Income */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Total Outstanding Amount *</label>
              <select
                value={editFormData.total_debt_range}
                onChange={(e) => setEditFormData({ ...editFormData, total_debt_range: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value="Less Than ₹1,00,000">Less Than ₹1,00,000</option>
                <option value="₹1,00,000 - ₹5,00,000">₹1,00,000 - ₹5,00,000</option>
                <option value="₹5,00,000 - ₹10,00,000">₹5,00,000 - ₹10,00,000</option>
                <option value="Above ₹10,000,000">Above ₹10,00,000</option>
              </select>
            </div>
            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Monthly Income *</label>
              <input
                type="number"
                required
                value={editFormData.monthly_income}
                onChange={(e) => setEditFormData({ ...editFormData, monthly_income: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Row 4: Type of Service Needed & Currently paying EMIs? */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Type of Service Needed</label>
              <select
                value={editFormData.service_needed}
                onChange={(e) => setEditFormData({ ...editFormData, service_needed: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value="personal_loan_settlement">personal_loan_settlement</option>
                <option value="credit_card_settlement">credit_card_settlement</option>
                <option value="multiple_loans_settlement">multiple_loans_settlement</option>
              </select>
            </div>
            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Currently paying EMIs?</label>
              <select
                value={editFormData.paying_emis}
                onChange={(e) => setEditFormData({ ...editFormData, paying_emis: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value="Select Status">Select Status</option>
                <option value="Paying">Paying</option>
                <option value="Paying With Difficulty">Paying With Difficulty</option>
                <option value="Not Paying">Not Paying</option>
              </select>
            </div>
          </div>

          {/* Row 5: Are you facing any harassment? & Employed / Unemployed */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Are you facing any harassment?</label>
              <select
                value={editFormData.harassment_calls}
                onChange={(e) => setEditFormData({ ...editFormData, harassment_calls: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value="Select">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Employed/Unemployed *</label>
              <select
                value={editFormData.employment_status}
                onChange={(e) => setEditFormData({ ...editFormData, employment_status: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value="Employed">Employed</option>
                <option value="Unemployed">Unemployed</option>
                <option value="Self Employed">Self Employed</option>
              </select>
            </div>
          </div>

          {/* Row 6: Employment Type & Settlement of personal loan needed? */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Employment Type *</label>
              <select
                value={editFormData.employment_type}
                onChange={(e) => setEditFormData({ ...editFormData, employment_type: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value="Salaried">Salaried</option>
                <option value="Business">Business</option>
                <option value="Freelancer">Freelancer</option>
              </select>
            </div>
            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Settlement of personal loan needed? *</label>
              <select
                value={editFormData.settlement_needed}
                onChange={(e) => setEditFormData({ ...editFormData, settlement_needed: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value="YES">YES</option>
                <option value="NO">NO</option>
              </select>
            </div>
          </div>

          {/* Row 7: Consultation Timing & Credit Card Dues */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Consultation Timing *</label>
              <select
                value={editFormData.consultation_timing}
                onChange={(e) => setEditFormData({ ...editFormData, consultation_timing: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
                <option value="12:00 PM - 02:00 PM">12:00 PM - 02:00 PM</option>
                <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
                <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM</option>
              </select>
            </div>
            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Credit Card Dues *</label>
              <input
                type="text"
                placeholder="Enter your answer"
                value={editFormData.credit_card_dues}
                onChange={(e) => setEditFormData({ ...editFormData, credit_card_dues: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Row 8: Personal Loan Dues & Service Fees */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Personal Loan Dues *</label>
              <input
                type="text"
                placeholder="Enter your answer"
                value={editFormData.personal_loan_dues}
                onChange={(e) => setEditFormData({ ...editFormData, personal_loan_dues: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Service Fees *</label>
              <input
                type="text"
                value={editFormData.service_fee}
                onChange={(e) => setEditFormData({ ...editFormData, service_fee: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 font-semibold"
              />
            </div>
          </div>

          {/* Row 9: Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Status</label>
              <select
                value={editFormData.status}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 font-bold"
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="interested">Interested</option>
                <option value="follow_up">Follow Up</option>
                <option value="converted">Converted</option>
                <option value="not_interested">Not Interested</option>
              </select>
            </div>
            <div />
          </div>

          {/* Bottom Action Buttons: Blue Update Lead + Green Cancel */}
          <div className="flex items-center space-x-3 pt-4 border-t border-gray-100">
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors"
            >
              Update Lead
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="px-5 py-2 rounded-lg bg-[#10b981] hover:bg-emerald-600 text-white font-bold text-xs shadow-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ==========================================
  // RENDER SCREEN: FOLLOW-UP PAGE
  // ==========================================
  if (viewMode === 'follow_up' && selectedLeadForFollowUp) {
    const lead = selectedLeadForFollowUp;

    return (
      <div className="space-y-4 font-sans text-slate-800 pb-16 ">
        {/* Toast Alert */}
        {feedbackMsg && (
          <div
            className={`p-3 rounded-lg flex items-center justify-between text-xs font-semibold ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                : 'bg-rose-50 border border-rose-300 text-rose-800'
            }`}
          >
            <span>{feedbackMsg.text}</span>
            <button onClick={() => setFeedbackMsg(null)} className="text-slate-500 hover:text-slate-800 font-bold ml-4">
              ✕
            </button>
          </div>
        )}

        {/* Main Page Header */}
        <div className="flex items-center space-x-3 pb-1 border-b border-gray-200">
          <button
            onClick={() => setViewMode('list')}
            className="px-3.5 py-1.5 rounded-lg bg-[#15803d] hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>&lt; Back to List</span>
          </button>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">Lead Information</h1>
        </div>

        {/* Lead Information Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4 text-xs">
          <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider border-b border-gray-100 pb-2">
            Lead Information — {lead.lead_number}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2.5">
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Name</span>
                <span className="font-bold text-slate-900 text-xs">{lead.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Phone</span>
                <span className="font-mono text-slate-900">{lead.phone}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase">City</span>
                <span className="text-slate-800">{lead.city || 'Other City'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Total Outstanding</span>
                <span className="font-bold text-slate-900">{formatCurrency(lead.total_debt || 100000)}</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Monthly Income</span>
                <span className="text-slate-800">{formatCurrency(lead.monthly_income || 0)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Credit Card Dues</span>
                <span className="text-slate-800">{formatCurrency(lead.credit_card_dues || 0)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Personal Loan Dues</span>
                <span className="text-slate-800">{formatCurrency(lead.personal_loan_dues || 0)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Type of Service Needed</span>
                <span className="font-mono text-[11px] text-slate-800">{lead.service_needed || 'personal_loan_settlement'}</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Employment Status</span>
                <span className="text-slate-800">{lead.employment_status || 'Employed'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Employment Type</span>
                <span className="text-slate-800">{lead.employment_type || 'Salaried'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Currently paying EMIs?</span>
                <span className="text-slate-800">{lead.paying_emis || 'Select Status'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Facing Harassment?</span>
                <span className="text-slate-800">{lead.harassment_calls || 'No'}</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Settlement Needed?</span>
                <span className="text-slate-800">{lead.settlement_needed || 'YES'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Consultation Timing</span>
                <span className="text-slate-800">{lead.consultation_timing || '10:00 AM - 12:00 PM'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Service Fees</span>
                <span className="text-slate-800">{formatCurrency(lead.service_fee || 0)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Lead Status</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800 inline-block">
                  {lead.status || 'new'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center space-x-2">
            <span className="text-slate-500 text-[10px] font-bold uppercase">Email:</span>
            <span className="font-mono text-slate-800">{lead.email || '—'}</span>
          </div>
        </div>

        {/* Update Follow-up Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4 text-xs">
          <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider border-b border-gray-100 pb-2">
            Update Follow-up
          </h2>

          <form onSubmit={handleSaveFollowUp} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Call Status *</label>
                <select
                  value={followUpFormData.call_status}
                  onChange={(e) => setFollowUpFormData({ ...followUpFormData, call_status: e.target.value })}
                  className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                >
                  <option value="Connected">Connected</option>
                  <option value="Busy / Call Waiting">Busy / Call Waiting</option>
                  <option value="Ringing / No Answer">Ringing / No Answer</option>
                  <option value="Switched Off / Out of Reach">Switched Off / Out of Reach</option>
                  <option value="Disconnected by Client">Disconnected by Client</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Interested Level *</label>
                <select
                  value={followUpFormData.interested_level}
                  onChange={(e) => setFollowUpFormData({ ...followUpFormData, interested_level: e.target.value })}
                  className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                  <option value="None">None</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Next Follow-up Date *</label>
                <input
                  type="date"
                  required
                  value={followUpFormData.next_follow_up_date}
                  onChange={(e) => setFollowUpFormData({ ...followUpFormData, next_follow_up_date: e.target.value })}
                  className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Final Status *</label>
                <select
                  value={followUpFormData.final_status}
                  onChange={(e) => setFollowUpFormData({ ...followUpFormData, final_status: e.target.value })}
                  className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded text-slate-900 text-xs focus:outline-none focus:border-blue-600 font-bold"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="interested">Interested</option>
                  <option value="follow_up">Follow Up</option>
                  <option value="converted">Converted</option>
                  <option value="not_interested">Not Interested</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Remark *</label>
              <textarea
                required
                rows={3}
                placeholder="Enter client conversation summary, loan resolution requirements, next callback action..."
                value={followUpFormData.remark}
                onChange={(e) => setFollowUpFormData({ ...followUpFormData, remark: e.target.value })}
                className="w-full p-2.5 bg-white border border-gray-300 rounded text-slate-900 text-xs focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-5 py-2 rounded bg-[#15803d] hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors"
              >
                Save Follow Up
              </button>
            </div>
          </form>
        </div>

        {/* Follow-up History Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-gray-200 bg-gray-50/70">
            <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider">
              Follow-up History ({followUpHistory.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse whitespace-nowrap">
              <thead className="bg-gray-100 text-slate-700 font-bold border-b border-gray-200 uppercase tracking-tight">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Follow-Up By</th>
                  <th className="py-2.5 px-3">Lead Call</th>
                  <th className="py-2.5 px-3">Lead Interest</th>
                  <th className="py-2.5 px-3 text-center">Lead Status</th>
                  <th className="py-2.5 px-3">Follow-Up Date & Time</th>
                  <th className="py-2.5 px-4 min-w-[200px]">Remark</th>
                  <th className="py-2.5 px-3">Follow-Up Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-slate-800">
                {followUpHistory.length > 0 ? (
                  followUpHistory.map((h, idx) => (
                    <tr key={h.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{h.user_name || 'Dhruv Consultant'}</td>
                      <td className="py-2.5 px-3 text-slate-700">{h.call_status}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          h.interested_level === 'High' ? 'bg-emerald-100 text-emerald-800' :
                          h.interested_level === 'Medium' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-slate-700'
                        }`}>
                          {h.interested_level}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                          {h.final_status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[10px]">
                        {new Date(h.created_at).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 whitespace-normal text-slate-700">{h.remark}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        {h.next_follow_up_date || '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400 font-semibold">
                      No follow-ups yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER MAIN LEADS LIST (Exact Reference Screenshot Layout)
  // ==========================================
  return (
    <div className="space-y-3.5 font-sans text-slate-800 pb-16">
      {/* Toast Alert */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded-lg flex items-center justify-between text-xs font-semibold ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border border-rose-300 text-rose-800'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-500 hover:text-slate-800 font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* 1. Page Header: Breadcrumb (Left), + Add Lead (Center), Date & Export (Right) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-transparent">
        {/* Left: Breadcrumb */}
        <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500">
          <span className="text-slate-600 font-medium">Dashboard</span>
          <span className="text-slate-400">/</span>
          <span className="text-slate-900 font-bold">SettleXpert</span>
        </div>

        {/* Center: + Add Lead Button (Compact Black Button) */}
        <div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center space-x-1 px-4 py-1.5 rounded bg-[#111827] hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ Add Lead</span>
          </button>
        </div>

        {/* Right: Calendar Date Filter + Export/Download */}
        <div className="flex items-center space-x-2">
          <CalendarDateFilter
            selectedDate={selectedDate}
            onDateChange={(d) => {
              setSelectedDate(d);
              setPage(1);
            }}
            fromDate={fromDate}
            toDate={toDate}
            onRangeChange={(f, t) => {
              setFromDate(f);
              setToDate(t);
              setPage(1);
            }}
          />
          <button
            onClick={handleExportCSV}
            title="Export CSV"
            className="p-1.5 rounded bg-white border border-gray-300 hover:bg-gray-50 text-slate-700 transition-colors shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Lead Status Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <button
          onClick={() => {
            setStatusFilter('all');
            setPage(1);
          }}
          className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
            statusFilter === 'all'
              ? 'bg-[#111827] text-white shadow-xs'
              : 'bg-white hover:bg-gray-50 text-slate-700 border border-gray-200'
          }`}
        >
          All ({statusCounts.all})
        </button>
        <button
          onClick={() => {
            setStatusFilter('new');
            setPage(1);
          }}
          className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
            statusFilter === 'new'
              ? 'bg-[#111827] text-white shadow-xs'
              : 'bg-white hover:bg-gray-50 text-slate-700 border border-gray-200'
          }`}
        >
          New ({statusCounts.new})
        </button>
        <button
          onClick={() => {
            setStatusFilter('contacted');
            setPage(1);
          }}
          className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
            statusFilter === 'contacted'
              ? 'bg-[#111827] text-white shadow-xs'
              : 'bg-white hover:bg-gray-50 text-slate-700 border border-gray-200'
          }`}
        >
          Contacted ({statusCounts.contacted})
        </button>
        <button
          onClick={() => {
            setStatusFilter('interested');
            setPage(1);
          }}
          className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
            statusFilter === 'interested'
              ? 'bg-[#111827] text-white shadow-xs'
              : 'bg-white hover:bg-gray-50 text-slate-700 border border-gray-200'
          }`}
        >
          Interested ({statusCounts.interested})
        </button>
        <button
          onClick={() => {
            setStatusFilter('follow_up');
            setPage(1);
          }}
          className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
            statusFilter === 'follow_up'
              ? 'bg-[#111827] text-white shadow-xs'
              : 'bg-white hover:bg-gray-50 text-slate-700 border border-gray-200'
          }`}
        >
          Follow up ({statusCounts.follow_up})
        </button>
        <button
          onClick={() => {
            setStatusFilter('converted');
            setPage(1);
          }}
          className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
            statusFilter === 'converted'
              ? 'bg-[#111827] text-white shadow-xs'
              : 'bg-white hover:bg-gray-50 text-slate-700 border border-gray-200'
          }`}
        >
          Converted ({statusCounts.converted})
        </button>
        <button
          onClick={() => {
            setStatusFilter('not_interested');
            setPage(1);
          }}
          className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
            statusFilter === 'not_interested'
              ? 'bg-[#111827] text-white shadow-xs'
              : 'bg-white hover:bg-gray-50 text-slate-700 border border-gray-200'
          }`}
        >
          Not Interested ({statusCounts.not_interested})
        </button>
      </div>

      {/* 3. Search + Date Filter Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded border border-gray-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Lead Name, Phone, City, ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-300 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs text-slate-700 focus:outline-none"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs text-slate-700 focus:outline-none"
          />
          <button
            onClick={handleApplyDateFilter}
            className="px-4 py-1.5 rounded bg-[#111827] hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs flex items-center space-x-1"
          >
            <Filter className="h-3 w-3" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* 4. Leads Main Data Table */}
      <div className="bg-white rounded border border-gray-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] border-collapse whitespace-nowrap">
            <thead className="bg-gray-100/90 text-slate-700 font-bold border-b border-gray-200 uppercase tracking-tight">
              <tr>
                <th className="py-2.5 px-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="py-2.5 px-2">#</th>
                <th className="py-2.5 px-3">Assigned Consultant Name</th>
                <th className="py-2.5 px-3">Lead Name</th>
                <th className="py-2.5 px-3">Email</th>
                <th className="py-2.5 px-3">Phone</th>
                <th className="py-2.5 px-3">City</th>
                <th className="py-2.5 px-3 text-right">Total Outstanding Amount</th>
                <th className="py-2.5 px-3 text-right">Monthly Income</th>
                <th className="py-2.5 px-3">Loan Type</th>
                <th className="py-2.5 px-3 text-center">Default Status</th>
                <th className="py-2.5 px-3 text-center">Harassment Calls</th>
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3 text-center">Lead Status</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-slate-400">
                    Loading leads...
                  </td>
                </tr>
              ) : leads.length > 0 ? (
                leads.map((l, idx) => (
                  <tr key={l.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-2.5 px-3">
                      <input
                        type="checkbox"
                        checked={selectedLeadIds.includes(l.id)}
                        onChange={() => handleToggleSelect(l.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                    </td>
                    <td className="py-2.5 px-2 font-mono text-slate-500">{(page - 1) * limit + idx + 1}</td>
                    <td className="py-2.5 px-3 text-slate-700">{l.employee_name || 'Dhruv Consultant'}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{l.name}</td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono">{l.email || '—'}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">{l.phone}</td>
                    <td className="py-2.5 px-3 text-slate-600">{l.city || 'Other City'}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {formatCurrency(l.total_debt || 100000)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700">
                      {formatCurrency(l.monthly_income || 30000)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono text-[10px]">
                      {l.service_needed || l.loan_type || 'personal_loan_settlement'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {l.default_status || 'Defaulted'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        l.harassment_calls === 'Yes' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-gray-50 text-slate-700 border border-gray-200'
                      }`}>
                        {l.harassment_calls || 'No'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[10px]">
                      {l.created_at ? new Date(l.created_at).toLocaleString() : '2026-08-22 10:00:00'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold capitalize ${
                        l.status === 'new' ? 'bg-blue-100 text-blue-800' :
                        l.status === 'contacted' ? 'bg-amber-100 text-amber-800' :
                        l.status === 'interested' ? 'bg-emerald-100 text-emerald-800' :
                        l.status === 'follow_up' ? 'bg-purple-100 text-purple-800' :
                        l.status === 'converted' ? 'bg-teal-100 text-teal-800' : 'bg-gray-100 text-slate-700'
                      }`}>
                        {l.status}
                      </span>
                    </td>
                    {/* The 3 Exact Actions */}
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        {/* Button 1: Create Agreement */}
                        <button
                          onClick={() => handleCreateAgreementAction(l)}
                          title="Create Agreement"
                          className="h-7 w-7 rounded border border-gray-200 bg-white hover:bg-gray-50 text-slate-600 hover:text-blue-600 transition-colors flex items-center justify-center shadow-xs"
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </button>

                        {/* Button 2: Follow Up */}
                        <button
                          onClick={() => handleOpenFollowUp(l)}
                          title="Follow Up"
                          className="h-7 w-7 rounded border border-gray-200 bg-white hover:bg-gray-50 text-slate-600 hover:text-emerald-600 transition-colors flex items-center justify-center shadow-xs"
                        >
                          <Calendar className="h-3.5 w-3.5" />
                        </button>

                        {/* Button 3: Edit Lead */}
                        <button
                          onClick={() => handleOpenEditLead(l)}
                          title="Edit Lead"
                          className="h-7 w-7 rounded border border-gray-200 bg-white hover:bg-gray-50 text-slate-600 hover:text-amber-600 transition-colors flex items-center justify-center shadow-xs"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-slate-400">
                    No leads found matching current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="p-3 bg-gray-50/80 border-t border-gray-200 flex items-center justify-between text-xs text-slate-600">
          <span>
            Showing {leads.length > 0 ? (page - 1) * limit + 1 : 0} to{' '}
            {Math.min(page * limit, total)} of {total} entries
          </span>

          <div className="flex items-center space-x-1.5">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-2.5 py-1 bg-white border border-gray-300 rounded text-slate-700 disabled:opacity-40 hover:bg-gray-50 transition-colors text-xs font-semibold"
            >
              Previous
            </button>
            <span className="px-2 text-slate-700 font-bold">{page}</span>
            <button
              disabled={page * limit >= total}
              onClick={() => setPage(page + 1)}
              className="px-2.5 py-1 bg-white border border-gray-300 rounded text-slate-700 disabled:opacity-40 hover:bg-gray-50 transition-colors text-xs font-semibold"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ADD LEAD MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register New Lead Pipeline Entry"
        subtitle="Generates permanent sequential LEAD-XXXX identifier with duplicate prevention"
      >
        <form onSubmit={handleCreateLead} className="space-y-4 text-xs font-sans text-slate-800">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Lead Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Chandra"
                value={newLeadData.name}
                onChange={(e) => setNewLeadData({ ...newLeadData, name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Mobile Phone Number *</label>
              <input
                type="tel"
                required
                placeholder="+91 98XXXXXXXX"
                value={newLeadData.phone}
                onChange={(e) => setNewLeadData({ ...newLeadData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Email Address</label>
              <input
                type="email"
                placeholder="client@example.com"
                value={newLeadData.email}
                onChange={(e) => setNewLeadData({ ...newLeadData, email: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="text-slate-600 block mb-1 font-semibold">City</label>
              <input
                type="text"
                placeholder="e.g. Mumbai, Delhi, Bengaluru"
                value={newLeadData.city}
                onChange={(e) => setNewLeadData({ ...newLeadData, city: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Total Outstanding Debt (₹) *</label>
              <input
                type="number"
                required
                value={newLeadData.total_debt}
                onChange={(e) => setNewLeadData({ ...newLeadData, total_debt: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Monthly Income (₹) *</label>
              <input
                type="number"
                required
                value={newLeadData.monthly_income}
                onChange={(e) => setNewLeadData({ ...newLeadData, monthly_income: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 bg-gray-100 text-slate-700 rounded-lg font-bold hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#111827] text-white rounded-lg font-bold hover:bg-slate-800 shadow-md"
            >
              Register Lead
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
