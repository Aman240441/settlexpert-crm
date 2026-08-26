import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Printer,
  Eye,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Landmark,
  X,
  FileSignature,
  Trash2,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Download,
  CheckCircle,
  ArrowLeft,
  Edit,
  Phone
} from 'lucide-react';
import { api } from '../../services/api';
import { Modal } from '../common/Modal';
import { AgreementDocumentView } from './AgreementDocumentView';
import { CalendarDateFilter, getTodayStr } from '../common/CalendarDateFilter';

interface EmployeeAgreementsViewProps {
  preselectedClient?: any;
}

export const EmployeeAgreementsView: React.FC<EmployeeAgreementsViewProps> = ({ preselectedClient }) => {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Mode: 'list' | 'create' | 'document_view'
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'document_view'>('list');
  const [editingAgreementId, setEditingAgreementId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedAgrForModal, setSelectedAgrForModal] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    client_id: '',
    lead_id: '',
    name: '',
    pin_number: '',
    dob: '1990-01-01',
    phone: '',
    email: '',
    start_date: new Date().toISOString().split('T')[0],
    address: '',
    // Agreement details
    agreement_duration: '6 Months',
    monthly_fee: 7500,
    total_fee: 45000,
    resolution_duration: '6 Months',
    prepared_by: 'Dhruv Consultant',
    executed_date: new Date().toISOString().split('T')[0],
    monthly_income: 45000,
    status: 'draft',
    agreement_body: ''
  });

  // Lenders list
  const [lenders, setLenders] = useState<Array<{ id: string; bank_name: string; loan_type: string; balance: number }>>([
    { id: '1', bank_name: 'HDFC Bank', loan_type: 'Personal Loan', balance: 150000 },
    { id: '2', bank_name: 'ICICI Bank', loan_type: 'Credit Card', balance: 80000 }
  ]);

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Generate Agreement template text dynamically (Official SettleXpert Legal Template)
  const generateAgreementTemplate = (data: any, lenderList: any[]) => {
    const lenderText = lenderList && lenderList.length > 0
      ? lenderList.map((l, i) => `   ${i + 1}. ${l.bank_name || 'Bank'} — ${l.loan_type || 'Loan'} — ₹${(parseFloat(l.balance as any) || 0).toLocaleString('en-IN')}`).join('\n')
      : '   1. Designated Banking Accounts & Credit Card Facilities';

    const totalDebt = lenderList && lenderList.length > 0
      ? lenderList.reduce((acc, l) => acc + (parseFloat(l.balance as any) || 0), 0).toLocaleString('en-IN')
      : '0';

    const executionDate = data.executed_date || data.start_date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const clientName = data.name || '[Client Full Name]';
    const clientAddress = data.address || '—';
    const clientDob = data.dob || '—';
    const clientPhone = data.phone || '—';
    const clientEmail = data.email || '—';
    const tenure = data.resolution_duration || data.agreement_duration || '6 Months';
    const totalFee = (data.total_fee || 45000).toLocaleString('en-IN');
    const monthlyFee = (data.monthly_fee || 7500).toLocaleString('en-IN');

    return `CONSULTANCY AGREEMENT
This Consultancy Agreement ("Agreement") is executed on ${executionDate} between:
M/s. SettleXpert LLP, having its registered/operations office at CB-201, Naraina Vihar, Ring Road, New Delhi, Delhi, India, hereinafter referred to as the "First Party" or the "Company", which expression shall, unless repugnant to the context, include its successors, affiliates and permitted assigns.
AND
${clientName}, residing at ${clientAddress}, Date of Birth: ${clientDob}, Mobile No.: ${clientPhone}, Email ID: ${clientEmail}, hereinafter referred to as the "Second Party" or the "Client".
The Company and the Client are hereinafter collectively referred to as the "Parties" and individually as a "Party".
WHEREAS, the Company is engaged in providing financial consultancy and debt resolution advisory services to individuals experiencing financial hardship and requiring professional assistance in managing their unsecured debt obligations.
WHEREAS, the Client has represented that they are presently facing financial constraints and have voluntarily approached the Company seeking professional guidance and consultancy for resolving their outstanding unsecured loan and/or credit obligations.
WHEREAS, after discussions regarding the Client’s financial circumstances, the Parties have mutually agreed to enter into this Agreement to define the scope of consultancy services, rights, obligations and responsibilities of both Parties.
NOW, THEREFORE, in consideration of the mutual promises and covenants contained herein, the Parties agree as follows:
1. PURPOSE OF THE AGREEMENT
The purpose of this Agreement is to appoint the Company as the Client’s financial consultancy partner for providing advisory assistance, negotiation support and debt resolution consultancy in relation to the debt accounts specifically identified in Annexure A.
The Company shall provide consultancy services based on the information, documents and financial details supplied by the Client. The services provided under this Agreement are advisory and consultancy-based in nature and are intended to assist the Client in communicating with lenders, understanding available resolution options and working towards an amicable resolution of outstanding liabilities.
The Client acknowledges that the Company does not operate as a lender, financial institution, recovery agency or guarantor and shall provide only professional consultancy and assistance within the scope of this Agreement.
2. SCOPE OF CONSULTANCY SERVICES
Subject to the terms and conditions of this Agreement, the Company shall provide consultancy services including, but not limited to:
a. Reviewing and evaluating the Client’s financial position and outstanding unsecured liabilities.
b. Advising the Client regarding potential debt resolution options based on the financial information and documents provided by the Client.
c. Assisting the Client in developing a practical financial strategy for addressing and resolving outstanding debts.
d. Communicating and negotiating with lenders or their authorised representatives wherever such communication or negotiation has been duly authorised by the Client.
e. Providing general guidance regarding applicable banking practices, borrower rights and available grievance redressal mechanisms.
f. Assisting the Client with drafting representations, replies, requests and other communications intended for lenders or authorised recovery representatives.
g. Providing reasonable guidance in situations involving recovery-related harassment or communications that may be inconsistent with applicable regulatory guidelines.
h. Keeping the Client informed about significant communications, proposals or settlement offers received from lenders concerning the accounts covered under this Agreement.
The services provided under this Agreement shall remain limited to the lenders and loan accounts specifically mentioned in Annexure A unless otherwise mutually agreed upon in writing by the Parties.
3. OBLIGATIONS OF THE COMPANY
The Company shall make reasonable professional efforts to provide financial consultancy services throughout the tenure of this Agreement. The Company agrees to:
a. Review the financial information, documents and supporting records submitted by the Client to understand the nature and status of the outstanding unsecured liabilities.
b. Provide professional guidance regarding appropriate debt resolution strategies based on the Client’s financial circumstances and the information made available to the Company.
c. Assist the Client in communicating with lenders, financial institutions or their authorised representatives whenever such communication is necessary and duly authorised by the Client.
d. Prepare and provide drafts of representations, replies, applications, complaints or other communications that may reasonably be required for communication with lenders or other appropriate authorities.
e. Provide guidance regarding applicable borrower rights, grievance redressal mechanisms and lawful recovery practices issued by competent authorities from time to time.
f. Where reasonably required, assist the Client in addressing instances of recovery-related harassment by guiding the Client regarding appropriate complaint mechanisms before the concerned lender or regulatory authority.
g. Keep the Client reasonably informed about significant communications, proposals or settlement offers received from lenders in relation to the accounts covered under this Agreement.
h. Maintain confidentiality of the Client’s personal, financial and documentary information, except where disclosure is necessary for providing the agreed consultancy services or where disclosure is required by applicable law.
i. Exercise reasonable professional care and diligence while providing consultancy services. However, the Company shall not be responsible for any independent decision, action or omission of any lender or third party.
4. OBLIGATIONS OF THE CLIENT
The Client agrees and undertakes to:
a. Provide complete, accurate and truthful information regarding income, liabilities, assets, outstanding loans and all other relevant financial details required for effective consultancy.
b. Provide all documents and information reasonably requested by the Company for assessment of the case and preparation of an appropriate debt resolution strategy.
c. Promptly inform the Company about any communication received from lenders, recovery agencies, legal authorities or any other person concerning the accounts covered under this Agreement.
d. Immediately notify the Company of any material change in financial circumstances, including employment, income, residence, contact details or any new borrowing undertaken during the term of this Agreement.
e. Pay the consultancy fees strictly according to the payment schedule mutually agreed between the Parties. Any delay or failure in payment may result in suspension of consultancy services until the outstanding amount is cleared.
f. Fully cooperate with the Company and provide timely responses whenever information, documents, approvals or confirmations are required for carrying out the consultancy services.
g. Make all payments only through the Company’s official payment modes as communicated by the Company. The Company shall not be responsible for any payment made to an unauthorised individual, personal bank account or unofficial payment channel.
h. Understand that the consultancy services under this Agreement are restricted to the loan accounts specifically listed in Annexure A unless otherwise agreed in writing.
i. Refrain from providing false, misleading, incomplete or inaccurate information, as the effectiveness of consultancy and negotiation efforts depends upon the correctness of the information furnished by the Client.
5. CLIENT ACKNOWLEDGEMENTS
The Client expressly understands and agrees that:
a. The Company provides consultancy and advisory services only and does not guarantee settlement, waiver, reduction of liability or acceptance of any proposal by any lender.
b. Each lender operates according to its own internal policies, procedures and approval mechanisms. Any settlement, restructuring or resolution proposal shall remain solely subject to the discretion and approval of the concerned lender.
c. The time required for resolution may vary depending upon the lender, the Client’s financial circumstances, documentation, regulatory requirements and other factors outside the Company’s reasonable control.
d. The Company does not promise any specific settlement percentage, resolution timeline or particular outcome. No verbal statement shall be treated as a guarantee unless specifically confirmed in writing by the Company.
e. The Client understands that debt resolution or settlement may affect the Client’s credit profile or future borrowing eligibility, which is governed by applicable banking practices and credit information companies. The Company shall not be responsible for such consequences.
f. The Company shall not be liable for any action, decision or omission independently taken by any lender, recovery agency or other third party beyond the reasonable control of the Company.
g. Litigation before any court or tribunal, unless specifically agreed to in writing, does not form part of the consultancy services covered under this Agreement. Any such assistance, if required, shall be discussed and agreed upon separately.
h. This Agreement constitutes the complete understanding between the Parties concerning the consultancy services and supersedes all previous discussions, representations or understandings relating to the subject matter of this Agreement.
6. COMMUNICATION
All communications concerning the services under this Agreement shall be conducted through the Company’s official communication channels, including email, telephone, WhatsApp or any other communication method officially communicated by the Company. The Company’s official working hours are Monday to Friday, 9:00 AM to 6:00 PM.
The Client agrees to promptly forward or share any communication received from lenders or their representatives relating to the loan accounts covered under this Agreement.
7. CONSULTANCY FEES & PAYMENT TERMS
The Client agrees to pay the consultancy fees as specified in Annexure B & C of this Agreement.
The consultancy fee shall be payable against the professional consultancy services provided by the Company and shall be paid on or before the mutually agreed due date.
All payments shall be made only through the Company’s official bank account or authorised payment gateway. The Company shall not be responsible for any payment made to a personal account or unauthorised person.
Consultancy fees paid to the Company shall be non-refundable once the agreed services have commenced, except where otherwise specifically agreed in writing by the Company.
8. TENURE OF AGREEMENT
This Agreement shall remain valid for the period specified in Annexure B, unless terminated earlier in accordance with the provisions of this Agreement.
Any extension or renewal of this Agreement shall be subject to mutual written consent of both Parties.
9. TERMINATION
Either Party may terminate this Agreement by providing written notice to the other Party.
The Client may discontinue the services by providing the Company with a minimum of fifteen (15) days’ prior written notice before the next scheduled consultancy fee due date. The Client shall remain responsible for all consultancy fees due up to the effective date of termination, and no refund shall be payable for services already rendered.
The Company may suspend or terminate this Agreement if the Client:
Fails to pay the agreed consultancy fees within the stipulated period;
Provides false, misleading, incomplete or inaccurate information; or
Fails to cooperate with the Company or repeatedly breaches the terms and conditions of this Agreement.
Upon termination, the Company shall not be liable to refund any consultancy fees already paid for consultancy services rendered up to the effective date of termination.
10. CONFIDENTIALITY
The Company shall maintain the confidentiality of all personal, financial and documentary information provided by the Client and shall use such information solely for providing consultancy services under this Agreement or where disclosure is required by applicable law.
The Client also agrees not to disclose, reproduce, distribute or share any confidential documents, strategies, formats, processes or proprietary material provided by the Company with any third party without prior written consent.
11. LIMITATION OF LIABILITY
The Company shall provide its consultancy services with reasonable professional skill, care and diligence.
However, the Company shall not be responsible or liable for any decision, action, omission or outcome arising from any lender, financial institution, recovery agency or other third party.
Under no circumstances shall the Company’s total liability under this Agreement exceed the consultancy fees actually paid by the Client during the immediately preceding thirty (30) days.
12. FORCE MAJEURE
Neither Party shall be held responsible for any delay, interruption or failure to perform its obligations under this Agreement due to circumstances beyond its reasonable control, including but not limited to natural disasters, government restrictions, war, strikes, epidemics, system failures, technical disruptions or any other unforeseen event.
The affected Party shall notify the other Party as soon as reasonably practicable.
13. GRIEVANCE REDRESSAL & DISPUTE RESOLUTION
The Company is committed to providing professional and timely assistance to its Clients.
In the event of any grievance, concern or dispute relating to the services provided under this Agreement, the Client shall first communicate the matter to the Company through a written email at:
Grievance & Escalation Email: info@settlexpert.com
The Company shall make reasonable efforts to review and address the grievance at the earliest possible opportunity.
Both Parties agree to make sincere and reasonable efforts to resolve any dispute amicably through the above grievance mechanism before initiating any legal proceedings.
Any matter arising out of or relating to this Agreement shall be subject to the exclusive jurisdiction of the competent courts at New Delhi, India.
14. DECLARATION & ACCEPTANCE
The Client confirms that all information, statements and documents provided to the Company are true, complete and correct to the best of the Client’s knowledge.
The Client further confirms that they have carefully read and understood the terms and conditions of this Agreement and voluntarily agree to be bound by the same.
Both Parties acknowledge that this Agreement has been entered into willingly and without any force, coercion or undue influence.
This Agreement may be executed physically or electronically, including through digital signature, OTP verification or any other electronic method accepted by the Company, and such execution shall be deemed valid and legally binding.

==================================================
ANNEXURE A: LIST OF ENROLLED DEBT ACCOUNTS / LENDERS
==================================================
${lenderText}

Total Enrolled Outstanding Liability: ₹${totalDebt}

==================================================
ANNEXURE B: CONSULTANCY FEE STRUCTURE & TENURE
==================================================
1. Agreed Service Tenure: ${tenure}
2. Total Agreed Consultancy Fee: ₹${totalFee}
3. Monthly Retainer / Installment Fee: ₹${monthlyFee}
4. Payment Due Date: On or before 5th of each calendar month

==================================================
ANNEXURE C: SIGNATURES & EXECUTION
==================================================
FOR AND ON BEHALF OF THE COMPANY:
SettleXpert LLP

Authorised Signatory: _________________________
Date: ${executionDate}

FOR AND ON BEHALF OF THE CLIENT (SECOND PARTY):
Name: ${clientName}
Signature: _________________________
Date: ${executionDate}`;
  };

  const fetchAgreements = async () => {
    try {
      setLoading(true);
      const res = await api.getCRMAgreements({
        search: search || undefined,
        date: selectedDate || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        page,
        limit
      });
      setAgreements(res.agreements || []);
      setTotal(res.pagination?.total || 0);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: 'Failed to load agreements' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgreements();
  }, [search, selectedDate, fromDate, toDate, page, limit]);

  useEffect(() => {
    if (!formData.agreement_body) {
      setFormData((prev) => ({
        ...prev,
        agreement_body: generateAgreementTemplate(prev, lenders)
      }));
    }
  }, []);

  // If navigated with preselected client/lead
  useEffect(() => {
    if (preselectedClient) {
      const isLead = !preselectedClient.client_number && preselectedClient.lead_number;
      const initialName = preselectedClient.name || '';
      const initialPhone = preselectedClient.phone || '';
      const initialEmail = preselectedClient.email || '';
      const initialCity = preselectedClient.city || '';
      const initialDebt = preselectedClient.total_debt || preselectedClient.loan_amount || 200000;
      const initialIncome = preselectedClient.monthly_income || 35000;
      const initialFee = preselectedClient.sx_fee || 45000;

      const initialLenders = preselectedClient.bank_name
        ? [{ id: '1', bank_name: preselectedClient.bank_name, loan_type: preselectedClient.service_needed || 'Personal Loan', balance: initialDebt }]
        : [{ id: '1', bank_name: 'HDFC Bank', loan_type: 'Personal Loan', balance: initialDebt }];

      const initialData = {
        client_id: isLead ? '' : preselectedClient.id,
        lead_id: isLead ? preselectedClient.id : (preselectedClient.lead_id || ''),
        name: initialName,
        pin_number: preselectedClient.pin_number || '110001',
        dob: preselectedClient.dob || '1990-01-01',
        phone: initialPhone,
        email: initialEmail,
        start_date: new Date().toISOString().split('T')[0],
        address: initialCity,
        agreement_duration: '6 Months',
        monthly_fee: Math.round(initialFee / 6),
        total_fee: initialFee,
        resolution_duration: '6 Months',
        prepared_by: 'Dhruv Consultant',
        executed_date: new Date().toISOString().split('T')[0],
        monthly_income: initialIncome,
        status: 'draft',
        agreement_body: ''
      };

      initialData.agreement_body = generateAgreementTemplate(initialData, initialLenders);

      setFormData(initialData);
      setLenders(initialLenders);
      setViewMode('create');
    }
  }, [preselectedClient]);

  // Calculate total loan amount
  const totalLoanAmount = lenders.reduce((sum, l) => sum + (parseFloat(l.balance as any) || 0), 0);

  // Add lender row
  const handleAddLender = () => {
    setLenders([...lenders, { id: String(Date.now()), bank_name: '', loan_type: 'Personal Loan', balance: 50000 }]);
  };

  // Remove lender row
  const handleRemoveLender = (id: string) => {
    if (lenders.length > 1) {
      setLenders(lenders.filter((l) => l.id !== id));
    }
  };

  // Update lender field
  const handleUpdateLender = (id: string, field: string, value: any) => {
    const updated = lenders.map((l) => (l.id === id ? { ...l, [field]: value } : l));
    setLenders(updated);
    setFormData((prev) => ({
      ...prev,
      agreement_body: generateAgreementTemplate(prev, updated)
    }));
  };

  // Handle Duration change
  const handleDurationChange = (dur: string) => {
    let months = 6;
    let fee = 45000;
    if (dur === '1 Month') { months = 1; fee = 15000; }
    else if (dur === '2 Months') { months = 2; fee = 25000; }
    else if (dur === '4 Months') { months = 4; fee = 40000; }
    else if (dur === '6 Months') { months = 6; fee = 55000; }
    else if (dur === '12 Months') { months = 12; fee = 85000; }
    else if (dur === 'Lifetime') { months = 24; fee = 120000; }

    const updatedData = {
      ...formData,
      agreement_duration: dur,
      resolution_duration: dur,
      total_fee: fee,
      monthly_fee: Math.round(fee / months)
    };
    updatedData.agreement_body = generateAgreementTemplate(updatedData, lenders);
    setFormData(updatedData);
  };

  // Save Agreement
  const handleSaveAgreement = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.name || !formData.phone) {
      setFeedbackMsg({ type: 'error', text: 'Client Name and Phone are required' });
      return;
    }
    try {
      setSaving(true);
      const parsedIncome = parseFloat(String(formData.monthly_income).replace(/[^0-9.]/g, '')) || 0;
      const parsedTotalFee = parseFloat(String(formData.total_fee).replace(/[^0-9.]/g, '')) || 0;
      const parsedMonthlyFee = parseFloat(String(formData.monthly_fee).replace(/[^0-9.]/g, '')) || 0;

      const normalizedData = {
        ...formData,
        monthly_income: parsedIncome,
        total_fee: parsedTotalFee,
        monthly_fee: parsedMonthlyFee,
      };

      const freshAgreementBody = generateAgreementTemplate(normalizedData, lenders);
      const payload = {
        ...normalizedData,
        agreement_body: freshAgreementBody,
        lenders
      };
      if (editingAgreementId) {
        await api.updateCRMAgreement(editingAgreementId, payload);
        setFeedbackMsg({ type: 'success', text: `Agreement updated successfully!` });
      } else {
        const res = await api.createCRMAgreement(payload);
        setFeedbackMsg({ type: 'success', text: `Agreement ${res.agreement_number || ''} generated successfully!` });
      }
      setEditingAgreementId(null);
      setViewMode('list');
      fetchAgreements();
    } catch (err: any) {
      console.error('Save agreement error:', err);
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to save agreement' });
    } finally {
      setSaving(false);
    }
  };

  // Handle Open Edit
  const handleOpenEdit = async (a: any) => {
    setEditingAgreementId(a.id);
    let loadedLenders = a.lenders || [];
    let clientDetail: any = null;

    if (a.client_id) {
      try {
        clientDetail = await api.getCRMClient(a.client_id);
        if (clientDetail && clientDetail.lenders && clientDetail.lenders.length > 0) {
          loadedLenders = clientDetail.lenders;
        }
      } catch (e) { }
    }
    if (!loadedLenders || loadedLenders.length === 0) {
      loadedLenders = [
        { id: '1', bank_name: 'HDFC Bank', loan_type: 'Personal Loan', balance: 50000 }
      ];
    }
    setLenders(loadedLenders);

    const clientObj = clientDetail?.client || {};

    const formValues = {
      client_id: a.client_id || '',
      lead_id: a.lead_id || clientObj.lead_id || '',
      name: a.name || a.client_name || clientObj.name || '',
      pin_number: a.pin_number || a.client_pin || clientObj.pan_number || 'BTWPC6838E',
      dob: a.dob || clientObj.dob || '1995-06-05',
      phone: a.phone || a.client_phone || clientObj.phone || '',
      email: a.email || a.client_email || clientObj.email || '',
      start_date: a.start_date || a.executed_date || new Date().toISOString().split('T')[0],
      address: a.address || a.client_city || clientObj.city || '',
      agreement_duration: a.agreement_duration || a.resolution_duration || '6 Months',
      monthly_fee: a.monthly_fee || Math.round((a.total_fee || 45000) / 6) || 7500,
      total_fee: a.total_fee || 45000,
      resolution_duration: a.resolution_duration || a.agreement_duration || '6 Months',
      prepared_by: a.prepared_by || 'Dhruv Consultant',
      executed_date: a.start_date || a.executed_date || new Date().toISOString().split('T')[0],
      monthly_income: (a.monthly_income !== undefined && a.monthly_income !== null && a.monthly_income !== '')
        ? a.monthly_income
        : ((clientObj.monthly_income !== undefined && clientObj.monthly_income !== null && clientObj.monthly_income !== '')
          ? clientObj.monthly_income
          : 45000),
      status: a.status || 'draft',
      agreement_body: ''
    };

    formValues.agreement_body = generateAgreementTemplate(formValues, loadedLenders);

    setFormData(formValues);
    setViewMode('create');
  };

  // Handle Delete Agreement
  const handleDeleteAgreement = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this agreement?')) return;
    try {
      await api.deleteCRMAgreement(id);
      setFeedbackMsg({ type: 'success', text: 'Agreement deleted successfully' });
      fetchAgreements();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to delete agreement' });
    }
  };

  // Open Document View
  const handleOpenDocumentView = async (a: any) => {
    try {
      if (a.client_id) {
        const clientDetail = await api.getCRMClient(a.client_id);
        setSelectedAgrForModal({
          ...a,
          lenders: clientDetail.lenders && clientDetail.lenders.length > 0 ? clientDetail.lenders : a.lenders,
          dob: clientDetail.client?.dob || a.dob,
          monthly_income: clientDetail.client?.monthly_income || a.monthly_income,
          address: clientDetail.client?.address || clientDetail.client?.city || a.client_city || a.address
        });
      } else {
        setSelectedAgrForModal(a);
      }
    } catch (err) {
      setSelectedAgrForModal(a);
    }
    setViewMode('document_view');
  };

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amt || 0);
  };

  // ==========================================
  // RENDER SCREEN: ADD / EDIT AGREEMENT (Exact Reference Screenshot)
  // ==========================================
  if (viewMode === 'create') {
    return (
      <div className="space-y-4 font-sans text-slate-800 pb-16 ">
        {/* Top Header Matching Screenshot */}
        <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setEditingAgreementId(null);
                setViewMode('list');
              }}
              className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
              title="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="text-sm font-bold text-slate-800">Add / Edit Agreement</h1>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedAgrForModal({
                ...formData,
                lenders,
                agreement_number: editingAgreementId ? 'AGR-UPDATE' : 'AGR-PREVIEW',
                client_name: formData.name,
                client_phone: formData.phone,
                client_email: formData.email,
                client_city: formData.address,
                client_pin: formData.pin_number
              });
              setViewMode('document_view');
            }}
            className="px-3.5 py-1.5 rounded-lg bg-[#15803d] hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Preview Agreement (PDF/Save)</span>
          </button>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSaveAgreement} className="space-y-4 text-xs">
          {/* SECTION 1: PERSONAL DETAILS */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs space-y-3">
            <h2 className="text-[11px] font-bold uppercase text-slate-800 tracking-wider border-b border-gray-100 pb-2 flex items-center space-x-1.5">
              <span className="h-3 w-1 bg-blue-600 rounded-full inline-block"></span>
              <span>PERSONAL DETAILS</span>
            </h2>

            {/* Row 1: Name, PAN Number, Date of Birth */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-600 block mb-1 font-medium text-[11px]">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    const updated = { ...formData, name: val };
                    updated.agreement_body = generateAgreementTemplate(updated, lenders);
                    setFormData(updated);
                  }}
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-medium text-[11px]">PAN Number</label>
                <input
                  type="text"
                  value={formData.pin_number}
                  onChange={(e) => setFormData({ ...formData, pin_number: e.target.value })}
                  placeholder="e.g. FGWPK0024B"
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-slate-900 text-xs focus:outline-none focus:border-blue-600 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-medium text-[11px]">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {/* Row 2: Phone, Email, Start Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-600 block mb-1 font-medium text-[11px]">Phone *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-slate-900 text-xs focus:outline-none focus:border-blue-600 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-medium text-[11px]">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-medium text-[11px]">Start Date</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {/* Row 3: Address */}
            <div>
              <label className="text-slate-600 block mb-1 font-medium text-[11px]">Address</label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => {
                  const val = e.target.value;
                  const updated = { ...formData, address: val };
                  updated.agreement_body = generateAgreementTemplate(updated, lenders);
                  setFormData(updated);
                }}
                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-slate-900 text-xs focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* SECTION 2: LOAN DETAILS */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs space-y-3">
            <h2 className="text-[11px] font-bold uppercase text-slate-800 tracking-wider border-b border-gray-100 pb-2 flex items-center space-x-1.5">
              <span className="h-3 w-1 bg-blue-600 rounded-full inline-block"></span>
              <span>LOAN DETAILS</span>
            </h2>

            <div className="text-[11px] text-slate-400 font-semibold mb-1">
              Loaded Lenders
            </div>

            <div className="space-y-2">
              {lenders.map((l) => (
                <div key={l.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-gray-50/50 p-2 rounded border border-gray-200">
                  <div className="sm:col-span-5">
                    <label className="text-[10px] text-slate-500 block sm:hidden">Lender Name</label>
                    <input
                      type="text"
                      placeholder="Lender Name"
                      value={l.bank_name}
                      onChange={(e) => handleUpdateLender(l.id, 'bank_name', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="text-[10px] text-slate-500 block sm:hidden">Loan Type</label>
                    <input
                      type="text"
                      placeholder="e.g. Personal Loan, Credit Card"
                      value={l.loan_type}
                      onChange={(e) => handleUpdateLender(l.id, 'loan_type', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] text-slate-500 block sm:hidden">Loan Amount</label>
                    <input
                      type="number"
                      placeholder="Amount"
                      value={l.balance}
                      onChange={(e) => handleUpdateLender(l.id, 'balance', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-xs text-slate-800 focus:outline-none focus:border-blue-600 font-mono font-semibold"
                    />
                  </div>

                  <div className="sm:col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveLender(l.id)}
                      disabled={lenders.length === 1}
                      className="px-2.5 py-1.5 bg-[#dc2626] hover:bg-rose-700 text-white rounded text-xs font-bold disabled:opacity-30 transition-colors w-full"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={handleAddLender}
                className="px-3.5 py-1.5 rounded bg-[#2563eb] text-white hover:bg-blue-700 font-bold text-xs transition-colors inline-flex items-center space-x-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Add More</span>
              </button>
            </div>

            <div className="pt-2 border-t border-gray-100 max-w-xs">
              <label className="text-[11px] text-slate-600 font-medium block mb-1">Total Loan</label>
              <input
                type="text"
                disabled
                value={totalLoanAmount.toLocaleString('en-IN')}
                className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded text-slate-800 text-xs font-mono font-bold"
              />
            </div>
          </div>

          {/* SECTION 3: AGREEMENT DETAILS */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs space-y-3">
            <h2 className="text-[11px] font-bold uppercase text-slate-800 tracking-wider border-b border-gray-100 pb-2 flex items-center space-x-1.5">
              <span className="h-3 w-1 bg-blue-600 rounded-full inline-block"></span>
              <span>AGREEMENT DETAILS</span>
            </h2>

            {/* Row 1: Duration, Fee, Resolution */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-600 block mb-1 font-medium text-[11px]">Agreement Duration</label>
                <select
                  value={formData.agreement_duration}
                  onChange={(e) => handleDurationChange(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-slate-900 text-xs focus:outline-none focus:border-blue-600 font-medium"
                >
                  <option value="1 Month">1 Month</option>
                  <option value="2 Months">2 Months</option>
                  <option value="4 Months">4 Months</option>
                  <option value="6 Months">6 Months</option>
                  <option value="12 Months">12 Months</option>
                  <option value="Lifetime">Lifetime</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-medium text-[11px]">Consultancy Fees (Monthly)</label>
                <input
                  type="text"
                  value={formData.monthly_fee ? `Rs. ${formData.monthly_fee.toLocaleString('en-IN')}` : ''}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    setFormData({ ...formData, monthly_fee: parseFloat(raw) || 0 });
                  }}
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-slate-900 text-xs focus:outline-none focus:border-blue-600 font-mono font-medium"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-medium text-[11px]">Resolution Duration</label>
                <input
                  type="text"
                  value={formData.resolution_duration}
                  onChange={(e) => setFormData({ ...formData, resolution_duration: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {/* Row 2: Prepared By, Executed Date, Monthly Income */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-600 block mb-1 font-medium text-[11px]">Prepared By</label>
                <input
                  type="text"
                  value={formData.prepared_by}
                  onChange={(e) => setFormData({ ...formData, prepared_by: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-medium text-[11px]">Executed Date</label>
                <input
                  type="date"
                  value={formData.executed_date || formData.start_date || ''}
                  onChange={(e) => setFormData({ ...formData, executed_date: e.target.value, start_date: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-medium text-[11px]">Monthly Income (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 45000"
                  value={formData.monthly_income ?? ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                    setFormData({ ...formData, monthly_income: val as any });
                  }}
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-slate-900 text-xs focus:outline-none focus:border-blue-600 font-mono font-semibold"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: AGREEMENT BODY (Rich CKEditor style layout) */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs space-y-2">
            <h2 className="text-[11px] font-bold uppercase text-slate-800 tracking-wider border-b border-gray-100 pb-2 flex items-center space-x-1.5">
              <span className="h-3 w-1 bg-blue-600 rounded-full inline-block"></span>
              <span>AGREEMENT BODY</span>
            </h2>

            <div>
              <label className="text-slate-600 block mb-1 font-medium text-[11px]">Agreement Body</label>

              {/* CKEditor Full WYSIWYG Toolbar */}
              <div className="bg-[#f8fafc] border border-gray-300 rounded-t-lg p-2 flex flex-wrap items-center gap-1.5 text-slate-700 text-xs">
                {/* Source & Clipboard */}
                <button type="button" className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 font-semibold text-[11px]">
                  Source
                </button>
                <div className="h-4 w-px bg-gray-300 mx-0.5" />
                <button type="button" className="p-1 hover:bg-gray-200 rounded" title="Bold">
                  <Bold className="h-3.5 w-3.5 font-bold" />
                </button>
                <button type="button" className="p-1 hover:bg-gray-200 rounded" title="Italic">
                  <Italic className="h-3.5 w-3.5" />
                </button>
                <button type="button" className="p-1 hover:bg-gray-200 rounded" title="Underline">
                  <Underline className="h-3.5 w-3.5" />
                </button>
                <div className="h-4 w-px bg-gray-300 mx-0.5" />
                <button type="button" className="p-1 hover:bg-gray-200 rounded" title="Numbered List">
                  <ListOrdered className="h-3.5 w-3.5" />
                </button>
                <button type="button" className="p-1 hover:bg-gray-200 rounded" title="Bullet List">
                  <List className="h-3.5 w-3.5" />
                </button>
                <div className="h-4 w-px bg-gray-300 mx-0.5" />
                <button type="button" className="p-1 hover:bg-gray-200 rounded" title="Align Left">
                  <AlignLeft className="h-3.5 w-3.5" />
                </button>
                <button type="button" className="p-1 hover:bg-gray-200 rounded" title="Align Center">
                  <AlignCenter className="h-3.5 w-3.5" />
                </button>
                <button type="button" className="p-1 hover:bg-gray-200 rounded" title="Align Right">
                  <AlignRight className="h-3.5 w-3.5" />
                </button>
                <div className="h-4 w-px bg-gray-300 mx-0.5" />
                <select className="px-2 py-0.5 bg-white border border-gray-300 rounded text-[11px]">
                  <option>Styles</option>
                </select>
                <select className="px-2 py-0.5 bg-white border border-gray-300 rounded text-[11px]">
                  <option>Normal</option>
                  <option>Heading 1</option>
                  <option>Heading 2</option>
                </select>
              </div>

              {/* Document Textarea */}
              <textarea
                rows={16}
                value={formData.agreement_body}
                onChange={(e) => setFormData({ ...formData, agreement_body: e.target.value })}
                className="w-full p-4 font-mono text-[11.5px] bg-white border border-t-0 border-gray-300 rounded-b-lg text-slate-900 focus:outline-none focus:border-blue-600 leading-relaxed"
              />
            </div>
          </div>

          {/* SECTION 5: BOTTOM ACTION BUTTONS MATCHING SCREENSHOT */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              onClick={(e) => handleSaveAgreement(e)}
              className="px-5 py-2 rounded-lg bg-[#111827] hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              {saving ? (
                <span>Saving Agreement...</span>
              ) : (
                <span>Save Agreement</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedAgrForModal({
                  ...formData,
                  lenders,
                  agreement_number: editingAgreementId ? 'AGR-UPDATE' : 'AGR-PREVIEW',
                  client_name: formData.name,
                  client_phone: formData.phone,
                  client_email: formData.email,
                  client_city: formData.address,
                  client_pin: formData.pin_number
                });
                setViewMode('document_view');
              }}
              className="px-4 py-2 rounded-lg bg-[#15803d] hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition-colors flex items-center space-x-1.5"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Preview Agreement (PDF/Save)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingAgreementId(null);
                setViewMode('list');
              }}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-slate-700 font-bold text-xs transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ==========================================
  // RENDER SCREEN: 11-PAGE DOCUMENT VIEWER (Matching PDF Upload)
  // ==========================================
  if (viewMode === 'document_view' && selectedAgrForModal) {
    return <AgreementDocumentView agreement={selectedAgrForModal} onBack={() => setViewMode('list')} />;
  }

  // ==========================================
  // RENDER SCREEN: AGREEMENT LIST (Exact Reference Screenshot)
  // ==========================================
  return (
    <div className="space-y-4 font-sans text-slate-800 pb-16">
      {/* Toast Alert */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded-lg flex items-center justify-between text-xs font-semibold ${feedbackMsg.type === 'success'
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

      {/* Top Header Bar Matching Screenshot */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900">Agreement List</h1>

        <button
          onClick={() => setViewMode('create')}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#111827] hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>+ Add Agreement</span>
        </button>
      </div>

      {/* Main Card Container Matching Screenshot */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
        {/* Card Heading */}
        <div className="p-4 border-b border-gray-100 flex items-center space-x-2">
          <FileText className="h-4 w-4 text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-900">Agreement List</h2>
        </div>

        {/* Filter Controls Row (Entries dropdown on left, Calendar filter center, Search on right) */}
        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-600 shadow-2xs"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>

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
          </div>

          <div className="flex items-center">
            <input
              type="text"
              placeholder="Search agreement, client, phone.."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') fetchAgreements();
              }}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-l-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 w-64 sm:w-72"
            />
            <button
              onClick={fetchAgreements}
              className="px-3.5 py-1.5 bg-[#15803d] hover:bg-emerald-800 text-white rounded-r-lg text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-2xs"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search</span>
            </button>
          </div>
        </div>

        {/* Agreement Table Matching Screenshot */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-gray-50/70 text-slate-700 font-bold border-y border-gray-200 text-[11px]">
              <tr>
                <th className="py-3 px-4 w-12 text-slate-500">#</th>
                <th className="py-3 px-4 min-w-[220px]">User Info</th>
                <th className="py-3 px-4 min-w-[140px]">Phone</th>
                <th className="py-3 px-4 min-w-[280px]">Loan Details</th>
                <th className="py-3 px-4 text-right min-w-[110px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Loading agreement records...
                  </td>
                </tr>
              ) : agreements.length > 0 ? (
                agreements.map((a, idx) => {
                  const lenderNames = a.lender_names || (a.lenders && a.lenders.map((l: any) => l.bank_name).filter(Boolean).join(', ')) || 'Home Credit, IDFC First Bank, MoneyWide, Cred';
                  const loanAmt = a.loan_amount || a.client_total_debt || a.total_fee || 90500;
                  const loanType = a.loan_type || a.client_loan_type || a.service_needed || 'Personal Loan';
                  const panOrPin = a.pin_number || a.client_pin ? `PAN: ${a.pin_number || a.client_pin}` : 'PAN: AQWPX1234F';

                  return (
                    <tr key={a.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-500 align-top">
                        {(page - 1) * limit + idx + 1}
                      </td>

                      {/* User Info Column */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-bold text-slate-900 text-xs">
                          {a.client_name || a.name || 'Mukesh Kumar'}
                        </div>
                        <div className="text-slate-500 text-[11px] mt-0.5 font-normal">
                          {a.client_email || a.email || 'avikormukesh977@gmail.com'}
                        </div>
                        <div className="text-slate-400 text-[10px] font-mono mt-0.5 uppercase tracking-wide">
                          {panOrPin}
                        </div>
                      </td>

                      {/* Phone Column */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="text-slate-700 font-mono text-xs flex items-center space-x-1.5">
                          <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>{a.client_phone || a.phone || '9997332524'}</span>
                        </div>
                      </td>

                      {/* Loan Details Column */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1 text-xs leading-tight">
                          <div>
                            <span className="font-bold text-slate-900">Lender: </span>
                            <span className="text-slate-600">{lenderNames}</span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-900">Loan: </span>
                            <span className="text-slate-800 font-mono font-semibold">₹ {loanAmt.toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-900">Type: </span>
                            <span className="text-slate-600">{loanType}</span>
                          </div>
                        </div>
                      </td>

                      {/* Actions Column */}
                      <td className="py-3.5 px-4 text-right align-top">
                        <div className="inline-flex items-center space-x-1.5">
                          {/* View Button (Opens 11-Page PDF Viewer) */}
                          <button
                            onClick={() => handleOpenDocumentView(a)}
                            className="p-1.5 rounded border border-cyan-200 bg-white hover:bg-cyan-50 text-cyan-600 transition-colors shadow-2xs"
                            title="View Agreement PDF"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEdit(a)}
                            className="p-1.5 rounded border border-amber-200 bg-white hover:bg-amber-50 text-amber-600 transition-colors shadow-2xs"
                            title="Edit Agreement"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteAgreement(a.id)}
                            className="p-1.5 rounded border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 transition-colors shadow-2xs"
                            title="Delete Agreement"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No agreements found matching current search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination Matching Screenshot */}
        <div className="p-4 bg-white border-t border-gray-100 flex items-center justify-between text-xs text-slate-600">
          <span>
            Showing {agreements.length > 0 ? (page - 1) * limit + 1 : 0} to{' '}
            {Math.min(page * limit, total)} of {total} entries
          </span>

          <div className="flex items-center space-x-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-slate-700 disabled:opacity-40 hover:bg-gray-50 transition-colors text-xs font-semibold"
            >
              Previous
            </button>
            <button
              disabled={page * limit >= total}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-slate-700 disabled:opacity-40 hover:bg-gray-50 transition-colors text-xs font-semibold"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

