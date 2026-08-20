import React, { useState, useEffect, useRef } from 'react';
import {
  UserPlus,
  Calendar,
  Save,
  ArrowLeft,
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  Strikethrough as StrikeIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Link2,
  Unlink,
  Table as TableIcon,
  Undo2,
  Redo2,
  Search,
  Printer,
  Maximize2,
  Minimize2,
  FileCode,
  CheckSquare,
  HelpCircle,
  Scissors,
  Copy,
  ClipboardPaste,
  Quote,
  Indent,
  Outdent,
  Subscript,
  Superscript,
  RemoveFormatting,
  Eye
} from 'lucide-react';
import AgreementPreviewModal from '../components/AgreementPreviewModal';

export default function CreateAgreementPage({ lead = null, onSave, onCancel }) {
  // 1. Personal Details
  const [name, setName] = useState(lead?.client_name || lead?.name || '');
  const [pan, setPan] = useState(lead?.pan || '');
  const [dob, setDob] = useState(lead?.dob || lead?.date_of_birth || '');
  const [phone, setPhone] = useState(lead?.phone || '');
  const [email, setEmail] = useState(lead?.email || '');
  const [startDate, setStartDate] = useState(lead?.agreement_date || lead?.startDate || new Date().toISOString().split('T')[0]);
  const [address, setAddress] = useState(lead?.address || (lead?.city ? `${lead.city}` : ''));

  // 2. Loan Details
  const [lenders, setLenders] = useState([
    { lenderName: '', loanType: 'Personal Loan', loanAmount: '' }
  ]);

  // 3. Agreement Details
  const [agreementDuration, setAgreementDuration] = useState('6 Months');
  const [consultancyFees, setConsultancyFees] = useState('');
  const [resolutionDuration, setResolutionDuration] = useState('6 Months');
  const [preparedBy, setPreparedBy] = useState('');
  const [executedDate, setExecutedDate] = useState(new Date().toISOString().split('T')[0]);
  const [monthlyIncome, setMonthlyIncome] = useState('');

  // Preview Modal State
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Editor states
  const editorRef = useRef(null);
  const [isSourceMode, setIsSourceMode] = useState(false);
  const [rawHtml, setRawHtml] = useState('');
  const [tagPath, setTagPath] = useState(['body', 'p', 'strong']);
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);

  useEffect(() => {
    if (lead) {
      setName(lead.client_name || lead.name || '');
      setPhone(lead.phone || '');
      setEmail(lead.email || '');
      setPan(lead.pan || '');
      setDob(lead.dob || lead.date_of_birth || '');
      setAddress(lead.address || lead.client_address || (lead.city ? `${lead.city}` : ''));
      setMonthlyIncome(lead.monthly_income ? String(lead.monthly_income) : (lead.monthlyIncome ? String(lead.monthlyIncome) : ''));
      setStartDate(lead.agreement_date || lead.startDate || new Date().toISOString().split('T')[0]);
      setExecutedDate(lead.executedDate || lead.agreement_date || new Date().toISOString().split('T')[0]);
      
      const dur = lead.agreement_duration || lead.duration || lead.agreementDuration || '6 Months';
      setAgreementDuration(dur);

      const fee = lead.consultancy_fee || lead.consultancyFees || (lead.service_fee ? String(lead.service_fee) : '');
      setConsultancyFees(fee ? String(fee) : '');

      const resDur = lead.resolution_duration || lead.resolutionDuration || '6 Months';
      setResolutionDuration(resDur);

      const prepBy = lead.prepared_by || lead.assigned_consultant || lead.preparedBy || 'Dhruv';
      setPreparedBy(prepBy);

      if (lead.lenders && Array.isArray(lead.lenders) && lead.lenders.length > 0) {
        setLenders(lead.lenders.map(l => ({
          lenderName: l.lenderName || l.name || l.lender_name || '',
          loanType: l.loanType || l.type || l.loan_type || 'Personal Loan',
          loanAmount: String(l.loanAmount || l.amount || l.loan_amount || '').replace(/[^\d.]/g, ''),
          account_number: l.account_number || l.accountNumber || ''
        })));
      } else if (lead.lender) {
        setLenders([{
          lenderName: lead.lender,
          loanType: lead.loan_type || 'Personal Loan',
          loanAmount: lead.loan_amount ? String(lead.loan_amount) : '',
          account_number: lead.loan_account_number || ''
        }]);
      } else if (lead.loan_type || lead.outstanding_amount) {
        setLenders([{
          lenderName: lead.bank_name || 'Bank',
          loanType: lead.loan_type || 'Personal Loan',
          loanAmount: lead.loan_amount ? String(lead.loan_amount) : ''
        }]);
      } else {
        setLenders([{ lenderName: '', loanType: 'Personal Loan', loanAmount: '' }]);
      }

      if (lead.notes && lead.notes.trim().length > 20) {
        setRawHtml(lead.notes);
        if (editorRef.current) {
          editorRef.current.innerHTML = lead.notes;
        }
      }
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setPan('');
      setDob('');
      setAddress('');
      setMonthlyIncome('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setExecutedDate(new Date().toISOString().split('T')[0]);
      setAgreementDuration('6 Months');
      setConsultancyFees('');
      setResolutionDuration('6 Months');
      setPreparedBy('Dhruv');
      setLenders([{ lenderName: '', loanType: 'Personal Loan', loanAmount: '' }]);
    }
  }, [lead]);

  // Exact verbatim legal agreement dynamically populated from live user input
  const generateInitialHtml = () => {
    return `<div style="text-align: center; font-size: 13px; font-weight: bold; margin-bottom: 18px; letter-spacing: 0.5px; color: #111827;">CONSULTANCY AGREEMENT</div>

<p style="margin-bottom: 12px; line-height: 1.6; font-size: 11.5px;">This Consultancy Agreement ("<strong>Agreement</strong>") is executed on <strong>${executedDate || new Date().toISOString().split('T')[0]}</strong> between:</p>

<p style="margin-bottom: 12px; line-height: 1.6; font-size: 11.5px;"><strong>M/s. SettleXpert Financial Services Pvt. Ltd.</strong>, having its registered/operations office at <strong>CB-201, Naraina Vihar, Ring Road, New Delhi, Delhi, India</strong>, hereinafter referred to as the "<strong>First Party</strong>" or the "<strong>Company</strong>", which expression shall, unless repugnant to the context, include its successors, affiliates and permitted assigns.</p>

<p style="margin-bottom: 12px; line-height: 1.6; font-size: 11.5px;">AND</p>

<p style="margin-bottom: 12px; line-height: 1.6; font-size: 11.5px;"><strong>${name || '—'}</strong>, residing at <strong>${address || '—'}</strong>, Date of Birth: <strong>${dob || '—'}</strong>, Mobile No.: <strong>${phone || '—'}</strong>, Email ID: <strong><a href="mailto:${email || ''}" style="color: #2563eb;">${email || '—'}</a></strong>, hereinafter referred to as the "<strong>Second Party</strong>" or the "<strong>Client</strong>".</p>

<p style="margin-bottom: 12px; line-height: 1.6; font-size: 11.5px;">The Company and the Client are hereinafter collectively referred to as the "<strong>Parties</strong>" and individually as a "<strong>Party</strong>".</p>

<p style="margin-bottom: 12px; line-height: 1.6; font-size: 11.5px;"><strong>WHEREAS</strong>, the Company is engaged in providing financial consultancy and debt resolution advisory services to individuals experiencing financial hardship and requiring professional assistance in managing their unsecured debt obligations.</p>

<p style="margin-bottom: 12px; line-height: 1.6; font-size: 11.5px;"><strong>WHEREAS</strong>, the Client has represented that they are presently facing financial constraints and have voluntarily approached the Company seeking professional guidance and consultancy for resolving their outstanding unsecured loan and/or credit obligations.</p>

<p style="margin-bottom: 12px; line-height: 1.6; font-size: 11.5px;"><strong>WHEREAS</strong>, after discussions regarding the Client’s financial circumstances, the Parties have mutually agreed to enter into this Agreement to define the scope of consultancy services, rights, obligations and responsibilities of both Parties.</p>

<p style="margin-bottom: 12px; line-height: 1.6; font-size: 11.5px;"><strong>NOW, THEREFORE</strong>, in consideration of the mutual promises and covenants contained herein, the Parties agree as follows:</p>

<p style="margin-bottom: 6px; font-weight: bold; font-size: 12px; color: #1e293b;">1. PURPOSE OF THE AGREEMENT</p>
<p style="margin-bottom: 8px; line-height: 1.6; font-size: 11.5px;">The purpose of this Agreement is to appoint the Company as the Client’s financial consultancy partner for providing advisory assistance, negotiation support and debt resolution consultancy in relation to the debt accounts specifically identified in Annexure A.</p>
<p style="margin-bottom: 8px; line-height: 1.6; font-size: 11.5px;">The Company shall provide consultancy services based on the information, documents and financial details supplied by the Client. The services provided under this Agreement are advisory and consultancy-based in nature and are intended to assist the Client in communicating with lenders, understanding available resolution options and working towards an amicable resolution of outstanding liabilities.</p>
<p style="margin-bottom: 14px; line-height: 1.6; font-size: 11.5px;">The Client acknowledges that the Company does not operate as a lender, financial institution, recovery agency or guarantor and shall provide only professional consultancy and assistance within the scope of this Agreement.</p>

<p style="margin-bottom: 6px; font-weight: bold; font-size: 12px; color: #1e293b;">2. SCOPE OF CONSULTANCY SERVICES</p>
<p style="margin-bottom: 8px; line-height: 1.6; font-size: 11.5px;">Subject to the terms and conditions of this Agreement, the Company shall provide consultancy services including, but not limited to:</p>
<ul style="margin-left: 20px; margin-bottom: 10px; line-height: 1.6; font-size: 11.5px;">
  <li><strong>a.</strong> Reviewing and evaluating the Client’s financial position and outstanding unsecured liabilities.</li>
  <li><strong>b.</strong> Advising the Client regarding potential debt resolution options based on the financial information and documents provided by the Client.</li>
  <li><strong>c.</strong> Assisting the Client in developing a practical financial strategy for addressing and resolving outstanding debts.</li>
  <li><strong>d.</strong> Communicating and negotiating with lenders or their authorised representatives wherever such communication or negotiation has been duly authorised by the Client.</li>
  <li><strong>e.</strong> Providing general guidance regarding applicable banking practices, borrower rights and available grievance redressal mechanisms.</li>
  <li><strong>f.</strong> Assisting the Client with drafting representations, replies, requests and other communications intended for lenders or authorised recovery representatives.</li>
  <li><strong>g.</strong> Providing reasonable guidance in situations involving recovery-related harassment or communications that may be inconsistent with applicable regulatory guidelines.</li>
  <li><strong>h.</strong> Keeping the Client informed about significant communications, proposals or settlement offers received from lenders concerning the accounts covered under this Agreement.</li>
</ul>
<p style="margin-bottom: 14px; line-height: 1.6; font-size: 11.5px;">The services provided under this Agreement shall remain limited to the lenders and loan accounts specifically mentioned in Annexure A unless otherwise mutually agreed upon in writing by the Parties.</p>

<p style="margin-bottom: 6px; font-weight: bold; font-size: 12px; color: #1e293b;">3. OBLIGATIONS OF THE COMPANY</p>
<p style="margin-bottom: 8px; line-height: 1.6; font-size: 11.5px;">The Company shall make reasonable professional efforts to provide financial consultancy services throughout the tenure of this Agreement. The Company agrees to:</p>
<ul style="margin-left: 20px; margin-bottom: 14px; line-height: 1.6; font-size: 11.5px;">
  <li><strong>a.</strong> Review the financial information, documents and supporting records submitted by the Client to understand the nature and status of the outstanding unsecured liabilities.</li>
  <li><strong>b.</strong> Provide professional guidance regarding appropriate debt resolution strategies based on the Client’s financial circumstances and the information made available to the Company.</li>
  <li><strong>c.</strong> Assist the Client in communicating with lenders, financial institutions or their authorised representatives whenever such communication is necessary and duly authorised by the Client.</li>
  <li><strong>d.</strong> Prepare and provide drafts of representations, replies, applications, complaints or other communications that may reasonably be required for communication with lenders or other appropriate authorities.</li>
  <li><strong>e.</strong> Provide guidance regarding applicable borrower rights, grievance redressal mechanisms and lawful recovery practices issued by competent authorities from time to time.</li>
  <li><strong>f.</strong> Where reasonably required, assist the Client in addressing instances of recovery-related harassment by guiding the Client regarding appropriate complaint mechanisms before the concerned lender or regulatory authority.</li>
  <li><strong>g.</strong> Keep the Client reasonably informed about significant communications, proposals or settlement offers received from lenders in relation to the accounts covered under this Agreement.</li>
  <li><strong>h.</strong> Maintain confidentiality of the Client’s personal, financial and documentary information, except where disclosure is necessary for providing the agreed consultancy services or where disclosure is required by applicable law.</li>
  <li><strong>i.</strong> Exercise reasonable professional care and diligence while providing consultancy services. However, the Company shall not be responsible for any independent decision, action or omission of any lender or third party.</li>
</ul>

<p style="margin-bottom: 6px; font-weight: bold; font-size: 12px; color: #1e293b;">4. OBLIGATIONS OF THE CLIENT</p>
<p style="margin-bottom: 8px; line-height: 1.6; font-size: 11.5px;">The Client agrees and undertakes to:</p>
<ul style="margin-left: 20px; margin-bottom: 14px; line-height: 1.6; font-size: 11.5px;">
  <li><strong>a.</strong> Provide complete, accurate and truthful information regarding income, liabilities, assets, outstanding loans and all other relevant financial details required for effective consultancy.</li>
  <li><strong>b.</strong> Provide all documents and information reasonably requested by the Company for assessment of the case and preparation of an appropriate debt resolution strategy.</li>
  <li><strong>c.</strong> Promptly inform the Company about any communication received from lenders, recovery agencies, legal authorities or any other person concerning the accounts covered under this Agreement.</li>
  <li><strong>d.</strong> Immediately notify the Company of any material change in financial circumstances, including employment, income, residence, contact details or any new borrowing undertaken during the term of this Agreement.</li>
  <li><strong>e.</strong> Pay the consultancy fees strictly according to the payment schedule mutually agreed between the Parties. Any delay or failure in payment may result in suspension of consultancy services until the outstanding amount is cleared.</li>
  <li><strong>f.</strong> Fully cooperate with the Company and provide timely responses whenever information, documents, approvals or confirmations are required for carrying out the consultancy services.</li>
  <li><strong>g.</strong> Make all payments only through the Company’s official payment modes as communicated by the Company. The Company shall not be responsible for any payment made to an unauthorised individual, personal bank account or unofficial payment channel.</li>
  <li><strong>h.</strong> Understand that the consultancy services under this Agreement are restricted to the loan accounts specifically listed in Annexure A unless otherwise agreed in writing.</li>
  <li><strong>i.</strong> Refrain from providing false, misleading, incomplete or inaccurate information, as the effectiveness of consultancy and negotiation efforts depends upon the correctness of the information furnished by the Client.</li>
</ul>

<p style="margin-bottom: 6px; font-weight: bold; font-size: 12px; color: #1e293b;">5. CLIENT ACKNOWLEDGEMENTS</p>
<p style="margin-bottom: 8px; line-height: 1.6; font-size: 11.5px;">The Client expressly understands and agrees that:</p>
<ul style="margin-left: 20px; margin-bottom: 14px; line-height: 1.6; font-size: 11.5px;">
  <li><strong>a.</strong> The Company provides consultancy and advisory services only and does not guarantee settlement, waiver, reduction of liability or acceptance of any proposal by any lender.</li>
  <li><strong>b.</strong> Each lender operates according to its own internal policies, procedures and approval mechanisms. Any settlement, restructuring or resolution proposal shall remain solely subject to the discretion and approval of the concerned lender.</li>
  <li><strong>c.</strong> The time required for resolution may vary depending upon the lender, the Client’s financial circumstances, documentation, regulatory requirements and other factors outside the Company’s reasonable control.</li>
  <li><strong>d.</strong> The Company does not promise any specific settlement percentage, resolution timeline or particular outcome. No verbal statement shall be treated as a guarantee unless specifically confirmed in writing by the Company.</li>
  <li><strong>e.</strong> The Client understands that debt resolution or settlement may affect the Client’s credit profile or future borrowing eligibility, which is governed by applicable banking practices and credit information companies. The Company shall not be responsible for such consequences.</li>
  <li><strong>f.</strong> The Company shall not be liable for any action, decision or omission independently taken by any lender, recovery agency or other third party beyond the reasonable control of the Company.</li>
  <li><strong>g.</strong> Litigation before any court or tribunal, unless specifically agreed to in writing, does not form part of the consultancy services covered under this Agreement. Any such assistance, if required, shall be discussed and agreed upon separately.</li>
  <li><strong>h.</strong> This Agreement constitutes the complete understanding between the Parties concerning the consultancy services and supersedes all previous discussions, representations or understandings relating to the subject matter of this Agreement.</li>
</ul>

<p style="margin-bottom: 6px; font-weight: bold; font-size: 12px; color: #1e293b;">6. COMMUNICATION</p>
<p style="margin-bottom: 8px; line-height: 1.6; font-size: 11.5px;">All communications concerning the services under this Agreement shall be conducted through the Company’s official communication channels, including email, telephone, WhatsApp or any other communication method officially communicated by the Company. The Company’s official working hours are Monday to Friday, 9:00 AM to 6:00 PM.</p>
<p style="margin-bottom: 14px; line-height: 1.6; font-size: 11.5px;">The Client agrees to promptly forward or share any communication received from lenders or their representatives relating to the loan accounts covered under this Agreement.</p>

<p style="margin-bottom: 6px; font-weight: bold; font-size: 12px; color: #1e293b;">7. CONSULTANCY FEES & PAYMENT TERMS</p>
<p style="margin-bottom: 8px; line-height: 1.6; font-size: 11.5px;">The Client agrees to pay the consultancy fees as specified in Annexure B & C of this Agreement.</p>
<p style="margin-bottom: 8px; line-height: 1.6; font-size: 11.5px;">The consultancy fee shall be payable against the professional consultancy services provided by the Company and shall be paid on or before the mutually agreed due date.</p>
<p style="margin-bottom: 8px; line-height: 1.6; font-size: 11.5px;">All payments shall be made only through the Company’s official bank account or authorised payment gateway. The Company shall not be responsible for any payment made to a personal account or unauthorised person.</p>
<p style="margin-bottom: 14px; line-height: 1.6; font-size: 11.5px;">Consultancy fees paid to the Company shall be non-refundable once the agreed services have commenced, except where otherwise specifically agreed in writing by the Company.</p>

<p style="margin-bottom: 6px; font-weight: bold; font-size: 12px; color: #1e293b;">8. TENURE OF AGREEMENT</p>
<p style="margin-bottom: 8px; line-height: 1.6; font-size: 11.5px;">This Agreement shall remain valid for the period specified in Annexure B, unless terminated earlier in accordance with the provisions of this Agreement.</p>
<p style="margin-bottom: 14px; line-height: 1.6; font-size: 11.5px;">Any extension or renewal of this Agreement shall be subject to mutual written consent of both Parties.</p>

<p style="margin-bottom: 6px; font-weight: bold; font-size: 12px; color: #1e293b;">9. TERMINATION</p>
<p style="margin-bottom: 8px; line-height: 1.6; font-size: 11.5px;">Either Party may terminate this Agreement by providing written notice to the other Party.</p>
<p style="margin-bottom: 8px; line-height: 1.6; font-size: 11.5px;">The Client may discontinue the services by providing the Company with a minimum of fifteen (15) days’ prior written notice before the next scheduled consultancy fee due date. The Client shall remain responsible for all consultancy fees due up to the effective date of termination, and no refund shall be payable for services already rendered.</p>
<p style="margin-bottom: 6px; line-height: 1.6; font-size: 11.5px;">The Company may suspend or terminate this Agreement if the Client:</p>
<ul style="margin-left: 20px; margin-bottom: 8px; line-height: 1.6; font-size: 11.5px;">
  <li>Fails to pay the agreed consultancy fees within the stipulated period;</li>
  <li>Provides false, misleading, incomplete or inaccurate information; or</li>
  <li>Fails to cooperate with the Company or repeatedly breaches the terms and conditions of this Agreement.</li>
</ul>
<p style="margin-bottom: 14px; line-height: 1.6; font-size: 11.5px;">Upon termination, the Company shall not be liable to refund any consultancy fees already paid for consultancy services rendered up to the effective date of termination.</p>

<p style="margin-bottom: 6px; font-weight: bold; font-size: 12px; color: #1e293b;">10. CONFIDENTIALITY</p>
<p style="margin-bottom: 8px; line-height: 1.6; font-size: 11.5px;">The Company shall maintain the confidentiality of all personal, financial and documentary information provided by the Client and shall use such information solely for providing consultancy services under this Agreement or where disclosure is required by applicable law.</p>
<p style="margin-bottom: 14px; line-height: 1.6; font-size: 11.5px;">The Client also agrees not to disclose, reproduce, distribute or share any confidential documents, strategies, formats, processes or proprietary material provided by the Company with any third party without prior written consent.</p>

<p style="margin-bottom: 6px; font-weight: bold; font-size: 12px; color: #1e293b;">11. LIMITATION OF LIABILITY</p>
<p style="margin-bottom: 8px; line-height: 1.6; font-size: 11.5px;">The Company shall provide its consultancy services with reasonable professional skill, care and diligence.</p>
<p style="margin-bottom: 8px; line-height: 1.6; font-size: 11.5px;">However, the Company shall not be responsible or liable for any decision, action, omission or outcome arising from any lender, financial institution, recovery agency or other third party.</p>
<p style="margin-bottom: 14px; line-height: 1.6; font-size: 11.5px;">Under no circumstances shall the Company’s total liability under this Agreement exceed the consultancy fees actually paid by the Client during the immediately preceding thirty (30) days.</p>

<p style="margin-bottom: 6px; font-weight: bold; font-size: 12px; color: #1e293b;">12. FORCE MAJEURE</p>
<p style="margin-bottom: 8px; line-height: 1.6; font-size: 11.5px;">Neither Party shall be held responsible for any delay, interruption or failure to perform its obligations under this Agreement due to circumstances beyond its reasonable control, including but not limited to natural disasters, government restrictions, war, strikes, epidemics, system failures, technical disruptions or any other unforeseen event.</p>
<p style="margin-bottom: 14px; line-height: 1.6; font-size: 11.5px;">The affected Party shall notify the other Party as soon as reasonably practicable.</p>

<p style="margin-bottom: 6px; font-weight: bold; font-size: 12px; color: #1e293b;">13. GRIEVANCE REDRESSAL & DISPUTE RESOLUTION</p>
<p style="margin-bottom: 8px; line-height: 1.6; font-size: 11.5px;">The Company is committed to providing professional and timely assistance to its Clients.</p>
<p style="margin-bottom: 8px; line-height: 1.6; font-size: 11.5px;">In the event of any grievance, concern or dispute relating to the services provided under this Agreement, the Client shall first communicate the matter to the Company through a written email at:</p>
<p style="margin-bottom: 8px; line-height: 1.6; font-size: 11.5px;"><strong>Grievance & Escalation Email:</strong> <a href="mailto:SettleXperts@gmail.com" style="color: #2563eb;">SettleXperts@gmail.com</a></p>
<p style="margin-bottom: 8px; line-height: 1.6; font-size: 11.5px;">The Company shall make reasonable efforts to review and address the grievance at the earliest possible opportunity.</p>
<p style="margin-bottom: 8px; line-height: 1.6; font-size: 11.5px;">Both Parties agree to make sincere and reasonable efforts to resolve any dispute amicably through the above grievance mechanism before initiating any legal proceedings.</p>
<p style="margin-bottom: 14px; line-height: 1.6; font-size: 11.5px;">Any matter arising out of or relating to this Agreement shall be subject to the exclusive jurisdiction of the competent courts at New Delhi, India.</p>

<p style="margin-bottom: 6px; font-weight: bold; font-size: 12px; color: #1e293b;">14. DECLARATION & ACCEPTANCE</p>
<p style="margin-bottom: 8px; line-height: 1.6; font-size: 11.5px;">The Client confirms that all information, statements and documents provided to the Company are true, complete and correct to the best of the Client’s knowledge.</p>
<p style="margin-bottom: 8px; line-height: 1.6; font-size: 11.5px;">The Client further confirms that they have carefully read and understood the terms and conditions of this Agreement and voluntarily agree to be bound by the same.</p>
<p style="margin-bottom: 8px; line-height: 1.6; font-size: 11.5px;">Both Parties acknowledge that this Agreement has been entered into willingly and without any force, coercion or undue influence.</p>
<p style="margin-bottom: 14px; line-height: 1.6; font-size: 11.5px;">This Agreement may be executed physically or electronically, including through digital signature, OTP verification or any other electronic method accepted by the Company, and such execution shall be deemed valid and legally binding.</p>`;
  };

  useEffect(() => {
    if (editorRef.current) {
      const initContent = generateInitialHtml();
      editorRef.current.innerHTML = initContent;
      setRawHtml(initContent);
    }
  }, [name, phone, email, address, dob, executedDate]);

  // Execute editor command
  const execCmd = (command, value = null) => {
    if (isSourceMode) return;
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, value);
      handleEditorChange();
    }
  };

  // Sync editor content
  const handleEditorChange = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setRawHtml(html);
      updateTagPath();
    }
  };

  // Toggle Source Mode
  const handleToggleSource = () => {
    if (isSourceMode) {
      if (editorRef.current) {
        editorRef.current.innerHTML = rawHtml;
      }
      setIsSourceMode(false);
    } else {
      if (editorRef.current) {
        setRawHtml(editorRef.current.innerHTML);
      }
      setIsSourceMode(true);
    }
  };

  // Update breadcrumb tag path
  const updateTagPath = () => {
    const selection = window.getSelection();
    if (!selection || !selection.anchorNode) return;
    let node = selection.anchorNode.nodeType === 3 ? selection.anchorNode.parentNode : selection.anchorNode;
    const path = [];
    while (node && node !== editorRef.current && node.tagName) {
      path.unshift(node.tagName.toLowerCase());
      node = node.parentNode;
    }
    path.unshift('body');
    setTagPath(path.length > 1 ? path : ['body', 'p', 'strong']);
  };

  // Add Table
  const handleInsertTable = () => {
    const tableHtml = `<table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%; margin: 10px 0; border: 1px solid #cbd5e1; font-size: 11px;">
      <thead><tr style="background:#f8fafc;"><th>Lender</th><th>Loan Account</th><th>Amount (₹)</th></tr></thead>
      <tbody><tr><td>Bank Name</td><td>XXXX-XXXX</td><td>50,000</td></tr></tbody>
    </table>`;
    execCmd('insertHTML', tableHtml);
  };

  // Add Link
  const handleInsertLink = () => {
    const url = prompt('Enter URL:', 'https://');
    if (url) execCmd('createLink', url);
  };

  // Calculate total loan
  const totalLoan = lenders.reduce((sum, item) => {
    const val = parseFloat(item.loanAmount) || 0;
    return sum + val;
  }, 0);

  const handleAddLender = () => {
    setLenders(prev => [...prev, { lenderName: '', loanType: '', loanAmount: '' }]);
  };

  const handleRemoveLender = (index) => {
    if (lenders.length === 1) {
      setLenders([{ lenderName: '', loanType: '', loanAmount: '' }]);
    } else {
      setLenders(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleLenderChange = (index, field, value) => {
    const updated = [...lenders];
    updated[index][field] = value;
    setLenders(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return alert('Name is required');

    const lenderNames = lenders.map(l => l.lenderName).filter(Boolean).join(', ');
    const loanTypes = lenders.map(l => l.loanType).filter(Boolean).join(', ');
    const loanDetails = lenders.map(l => `${l.lenderName || 'Bank'}: ₹${l.loanAmount || '0'}`).join(', ');

    const currentBody = isSourceMode ? rawHtml : (editorRef.current ? editorRef.current.innerHTML : rawHtml);

    const payload = {
      client_name: name,
      email: email,
      phone: phone,
      pan: pan,
      dob: dob,
      address: address,
      city: lead?.city || '',
      consultancy_fee: consultancyFees,
      agreement_duration: agreementDuration,
      resolution_duration: resolutionDuration,
      prepared_by: preparedBy || 'Dhruv',
      lender: lenderNames || 'Bank / Lender',
      loan_account_number: loanDetails,
      loan_amount: String(totalLoan || 50000),
      loan_type: loanTypes || 'Personal Loan',
      agreement_date: executedDate || new Date().toISOString().split('T')[0],
      status: 'Active',
      notes: currentBody,
      lead_id: lead?.id || null,
      lenders: lenders
    };

    onSave(payload);
  };

  return (
    <div className="page-content" style={{ padding: '14px 18px', background: '#f8faf9' }}>

      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: '#ffffff', borderBottom: '1px solid #edf2f7', borderTopLeftRadius: '6px', borderTopRightRadius: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserPlus size={16} color="#2563eb" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#1f2937' }}>Add New Agreement</span>
        </div>
        <button
          type="button"
          onClick={() => setShowPreviewModal(true)}
          style={{
            background: '#15803d',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            padding: '5px 12px',
            fontSize: '11.5px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Eye size={13} />
          <span>Preview Agreement (PDF Style)</span>
        </button>
      </div>

      {/* Main Form Container */}
      <form onSubmit={handleSubmit} style={{ background: '#ffffff', padding: '18px 22px', borderBottomLeftRadius: '6px', borderBottomRightRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>

        {/* ================= 1. PERSONAL DETAILS ================= */}
        <div style={{ marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <span style={{ color: '#2563eb', fontWeight: 700, fontSize: '13px' }}>[▎</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb', letterSpacing: '0.4px' }}>PERSONAL DETAILS</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '14px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '3px' }}>Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dashrath Sanap"
                required
                style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '3px' }}>PAN Number</label>
              <input
                type="text"
                value={pan}
                onChange={(e) => setPan(e.target.value)}
                placeholder=""
                style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '3px' }}>Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  fontSize: '12px',
                  outline: 'none',
                  background: '#ffffff',
                  cursor: 'pointer',
                  color: dob ? '#111827' : '#6b7280'
                }}
                onClick={(e) => {
                  try { e.target.showPicker(); } catch (err) { }
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '14px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '3px' }}>Phone *</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9702991515"
                required
                style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '3px' }}>Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dashrath1087@gmail.com"
                required
                style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '3px' }}>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  fontSize: '12px',
                  outline: 'none',
                  background: '#ffffff',
                  cursor: 'pointer',
                  color: startDate ? '#111827' : '#6b7280'
                }}
                onClick={(e) => {
                  try { e.target.showPicker(); } catch (err) { }
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '3px' }}>Address</label>
            <textarea
              rows="3"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder=""
              style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none', resize: 'vertical' }}
            />
          </div>
        </div>

        {/* ================= 2. LOAN DETAILS ================= */}
        <div style={{ marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <span style={{ color: '#2563eb', fontWeight: 700, fontSize: '13px' }}>[▎</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb', letterSpacing: '0.4px' }}>LOAN DETAILS</span>
          </div>

          <div style={{ border: '1px solid #e5e7eb', borderRadius: '4px', padding: '12px 14px', background: '#ffffff', marginBottom: '10px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#1f2937', marginBottom: '10px' }}>Lender Details</div>

            {/* Lender Rows */}
            {lenders.map((row, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1.2fr 80px', gap: '12px', alignItems: 'flex-end', marginBottom: '10px' }}>
                <div>
                  {idx === 0 && <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '3px' }}>Lender Name</label>}
                  <input
                    type="text"
                    placeholder="Bank Name"
                    value={row.lenderName}
                    onChange={(e) => handleLenderChange(idx, 'lenderName', e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '3px', border: '1px solid #d1d5db', fontSize: '11.5px', outline: 'none' }}
                  />
                </div>

                <div>
                  {idx === 0 && <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '3px' }}>Loan Type</label>}
                  <input
                    type="text"
                    placeholder="Loan Type"
                    value={row.loanType}
                    onChange={(e) => handleLenderChange(idx, 'loanType', e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '3px', border: '1px solid #d1d5db', fontSize: '11.5px', outline: 'none' }}
                  />
                </div>

                <div>
                  {idx === 0 && <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '3px' }}>Loan Amount</label>}
                  <input
                    type="number"
                    placeholder="Amount"
                    value={row.loanAmount}
                    onChange={(e) => handleLenderChange(idx, 'loanAmount', e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '3px', border: '1px solid #d1d5db', fontSize: '11.5px', outline: 'none' }}
                  />
                </div>

                <div>
                  {idx === 0 && <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '3px' }}>Remove</label>}
                  <button
                    type="button"
                    onClick={() => handleRemoveLender(idx)}
                    style={{
                      width: '100%',
                      padding: '5px 0',
                      background: '#b91c1c',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '3px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddLender}
              style={{ background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '3px', padding: '5px 12px', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer', marginTop: '4px' }}
            >
              + Add More
            </button>
          </div>

          {/* Total Loan Box */}
          <div style={{ maxWidth: '300px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '4px' }}>Total Loan</label>
            <input
              type="text"
              readOnly
              value={totalLoan ? totalLoan.toFixed(2) : '0.00'}
              style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '12px', background: '#ffffff', outline: 'none' }}
            />
          </div>
        </div>

        {/* ================= 3. AGREEMENT DETAILS ================= */}
        <div style={{ marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <span style={{ color: '#2563eb', fontWeight: 700, fontSize: '13px' }}>[▎</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb', letterSpacing: '0.4px' }}>AGREEMENT DETAILS</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '14px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '3px' }}>Agreement Duration</label>
              <input
                type="text"
                value={agreementDuration}
                onChange={(e) => setAgreementDuration(e.target.value)}
                placeholder=""
                style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                <label style={{ fontSize: '11px', color: '#4b5563' }}>Consultancy Fees (Monthly)</label>
                {parseFloat(consultancyFees) > 0 && (
                  <span style={{ fontSize: '10.5px', color: '#059669', fontWeight: 600 }}>
                    Total: ₹{(parseFloat(consultancyFees) * (parseInt(agreementDuration) || 6)).toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              <input
                type="text"
                value={consultancyFees}
                onChange={(e) => setConsultancyFees(e.target.value)}
                placeholder="e.g. 8000"
                style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '3px' }}>Resolution Duration</label>
              <input
                type="text"
                value={resolutionDuration}
                onChange={(e) => setResolutionDuration(e.target.value)}
                placeholder=""
                style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '3px' }}>Prepared By</label>
              <input
                type="text"
                value={preparedBy}
                onChange={(e) => setPreparedBy(e.target.value)}
                placeholder=""
                style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '3px' }}>Executed Date</label>
              <input
                type="date"
                value={executedDate}
                onChange={(e) => setExecutedDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  fontSize: '12px',
                  outline: 'none',
                  background: '#ffffff',
                  cursor: 'pointer',
                  color: executedDate ? '#111827' : '#6b7280'
                }}
                onClick={(e) => {
                  try { e.target.showPicker(); } catch (err) { }
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '3px' }}>Monthly Income</label>
              <input
                type="text"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                placeholder="Enter Monthly income"
                style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none' }}
              />
            </div>
          </div>
        </div>

        {/* ================= 4. AGREEMENT BODY (WORKING FULL CKEDITOR) ================= */}
        <div style={{ marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <span style={{ color: '#2563eb', fontWeight: 700, fontSize: '13px' }}>[▎</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb', letterSpacing: '0.4px' }}>AGREEMENT BODY</span>
          </div>

          <label style={{ display: 'block', fontSize: '11px', color: '#4b5563', marginBottom: '6px' }}>Agreement Body</label>

          {/* EXACT WORKING CKEDITOR CONTAINER */}
          <div style={{
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            background: '#ffffff',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
          }}>

            {/* TOOLBAR HEADER */}
            <div style={{
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              padding: '6px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              userSelect: 'none'
            }}>

              {/* Toolbar Row 1 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleToggleSource}
                  title="Source Code"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    padding: '2px 6px',
                    fontSize: '11px',
                    borderRadius: '3px',
                    border: isSourceMode ? '1px solid #3b82f6' : '1px solid #d1d5db',
                    background: isSourceMode ? '#eff6ff' : '#ffffff',
                    cursor: 'pointer',
                    color: '#374151'
                  }}
                >
                  <FileCode size={12} />
                  <span>Source</span>
                </button>

                <span style={{ color: '#cbd5e1', margin: '0 2px' }}>|</span>

                <button type="button" onClick={() => handleSubmit({ preventDefault: () => { } })} className="ck-tool-btn" title="Save"><Save size={13} /></button>
                <button type="button" onClick={() => { if (editorRef.current) { editorRef.current.innerHTML = ''; handleEditorChange(); } }} className="ck-tool-btn" title="New Page"><FileCode size={13} /></button>
                <button type="button" onClick={() => window.print()} className="ck-tool-btn" title="Print"><Printer size={13} /></button>

                <span style={{ color: '#cbd5e1', margin: '0 2px' }}>|</span>

                <button type="button" onClick={() => execCmd('cut')} className="ck-tool-btn" title="Cut"><Scissors size={13} /></button>
                <button type="button" onClick={() => execCmd('copy')} className="ck-tool-btn" title="Copy"><Copy size={13} /></button>
                <button type="button" onClick={() => execCmd('paste')} className="ck-tool-btn" title="Paste"><ClipboardPaste size={13} /></button>

                <span style={{ color: '#cbd5e1', margin: '0 2px' }}>|</span>

                <button type="button" onClick={() => execCmd('undo')} className="ck-tool-btn" title="Undo"><Undo2 size={13} /></button>
                <button type="button" onClick={() => execCmd('redo')} className="ck-tool-btn" title="Redo"><Redo2 size={13} /></button>

                <span style={{ color: '#cbd5e1', margin: '0 2px' }}>|</span>

                <button type="button" onClick={() => { const q = prompt('Find text:'); if (q) window.find(q); }} className="ck-tool-btn" title="Find"><Search size={13} /></button>
                <button type="button" onClick={() => execCmd('selectAll')} className="ck-tool-btn" title="Select All"><CheckSquare size={13} /></button>
              </div>

              {/* Toolbar Row 2 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => execCmd('bold')} className="ck-tool-btn font-bold" title="Bold"><BoldIcon size={13} /></button>
                <button type="button" onClick={() => execCmd('italic')} className="ck-tool-btn" title="Italic"><ItalicIcon size={13} /></button>
                <button type="button" onClick={() => execCmd('underline')} className="ck-tool-btn" title="Underline"><UnderlineIcon size={13} /></button>
                <button type="button" onClick={() => execCmd('strikeThrough')} className="ck-tool-btn" title="Strike Through"><StrikeIcon size={13} /></button>
                <button type="button" onClick={() => execCmd('subscript')} className="ck-tool-btn" title="Subscript"><Subscript size={13} /></button>
                <button type="button" onClick={() => execCmd('superscript')} className="ck-tool-btn" title="Superscript"><Superscript size={13} /></button>
                <button type="button" onClick={() => execCmd('removeFormat')} className="ck-tool-btn" title="Remove Format"><RemoveFormatting size={13} /></button>

                <span style={{ color: '#cbd5e1', margin: '0 2px' }}>|</span>

                <button type="button" onClick={() => execCmd('insertOrderedList')} className="ck-tool-btn" title="Numbered List"><ListOrdered size={13} /></button>
                <button type="button" onClick={() => execCmd('insertUnorderedList')} className="ck-tool-btn" title="Bulleted List"><List size={13} /></button>
                <button type="button" onClick={() => execCmd('outdent')} className="ck-tool-btn" title="Outdent"><Outdent size={13} /></button>
                <button type="button" onClick={() => execCmd('indent')} className="ck-tool-btn" title="Indent"><Indent size={13} /></button>
                <button type="button" onClick={() => execCmd('formatBlock', 'blockquote')} className="ck-tool-btn" title="Blockquote"><Quote size={13} /></button>

                <span style={{ color: '#cbd5e1', margin: '0 2px' }}>|</span>

                <button type="button" onClick={() => execCmd('justifyLeft')} className="ck-tool-btn" title="Align Left"><AlignLeft size={13} /></button>
                <button type="button" onClick={() => execCmd('justifyCenter')} className="ck-tool-btn" title="Align Center"><AlignCenter size={13} /></button>
                <button type="button" onClick={() => execCmd('justifyRight')} className="ck-tool-btn" title="Align Right"><AlignRight size={13} /></button>
                <button type="button" onClick={() => execCmd('justifyFull')} className="ck-tool-btn" title="Justify"><AlignJustify size={13} /></button>

                <span style={{ color: '#cbd5e1', margin: '0 2px' }}>|</span>

                <button type="button" onClick={handleInsertLink} className="ck-tool-btn" title="Insert Link"><Link2 size={13} /></button>
                <button type="button" onClick={() => execCmd('unlink')} className="ck-tool-btn" title="Unlink"><Unlink size={13} /></button>
                <button type="button" onClick={handleInsertTable} className="ck-tool-btn" title="Table"><TableIcon size={13} /></button>
              </div>

              {/* Toolbar Row 3 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <select
                  onChange={(e) => execCmd('formatBlock', e.target.value)}
                  style={{ fontSize: '11px', padding: '2px 4px', border: '1px solid #cbd5e1', borderRadius: '3px', background: '#ffffff', outline: 'none' }}
                >
                  <option value="p">Styles</option>
                  <option value="h1">Heading 1</option>
                  <option value="h2">Heading 2</option>
                  <option value="h3">Heading 3</option>
                  <option value="p">Paragraph</option>
                </select>

                <select
                  onChange={(e) => execCmd('formatBlock', e.target.value)}
                  style={{ fontSize: '11px', padding: '2px 4px', border: '1px solid #cbd5e1', borderRadius: '3px', background: '#ffffff', outline: 'none' }}
                >
                  <option value="p">Normal</option>
                  <option value="h2">Heading</option>
                  <option value="pre">Formatted</option>
                </select>

                <span style={{ color: '#cbd5e1', margin: '0 2px' }}>|</span>

                {/* Text Color Picker */}
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <label
                    htmlFor="textColorInput"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      padding: '2px 4px',
                      border: '1px solid #d1d5db',
                      borderRadius: '3px',
                      background: '#ffffff'
                    }}
                    title="Text Color"
                  >
                    <span style={{ color: '#dc2626' }}>A</span>▾
                  </label>
                  <input
                    id="textColorInput"
                    type="color"
                    onChange={(e) => execCmd('foreColor', e.target.value)}
                    style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                  />
                </div>

                {/* Background Color Picker */}
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <label
                    htmlFor="bgColorInput"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      padding: '2px 4px',
                      border: '1px solid #d1d5db',
                      borderRadius: '3px',
                      background: '#fef08a'
                    }}
                    title="Background Color"
                  >
                    <span>A</span>▾
                  </label>
                  <input
                    id="bgColorInput"
                    type="color"
                    onChange={(e) => execCmd('hiliteColor', e.target.value)}
                    style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                  />
                </div>

                <span style={{ color: '#cbd5e1', margin: '0 2px' }}>|</span>

                <button
                  type="button"
                  onClick={() => setIsEditorFullscreen(!isEditorFullscreen)}
                  className="ck-tool-btn"
                  title={isEditorFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  {isEditorFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                </button>

                <button type="button" onClick={() => alert('SettleExpert Contract Editor')} className="ck-tool-btn" title="Help"><HelpCircle size={13} /></button>
              </div>
            </div>

            {/* EDITABLE CONTENT AREA */}
            <div style={{ position: 'relative', minHeight: '380px', maxHeight: isEditorFullscreen ? '80vh' : '540px', overflowY: 'auto' }}>
              {isSourceMode ? (
                <textarea
                  value={rawHtml}
                  onChange={(e) => {
                    setRawHtml(e.target.value);
                  }}
                  style={{
                    width: '100%',
                    minHeight: '380px',
                    padding: '16px 20px',
                    fontFamily: 'Consolas, Monaco, monospace',
                    fontSize: '12px',
                    lineHeight: '1.5',
                    border: 'none',
                    outline: 'none',
                    background: '#1e293b',
                    color: '#f8fafc',
                    boxSizing: 'border-box'
                  }}
                />
              ) : (
                <div
                  ref={editorRef}
                  contentEditable
                  onInput={handleEditorChange}
                  onKeyUp={updateTagPath}
                  onMouseUp={updateTagPath}
                  style={{
                    minHeight: '380px',
                    padding: '24px 28px',
                    fontSize: '12px',
                    lineHeight: '1.65',
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    color: '#111827',
                    outline: 'none',
                    background: '#ffffff'
                  }}
                />
              )}
            </div>

            {/* STATUS BAR FOOTER */}
            <div style={{
              borderTop: '1px solid #e5e7eb',
              padding: '4px 10px',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: '#6b7280',
              fontFamily: 'monospace'
            }}>
              <div>
                {tagPath.map((tag, i) => (
                  <span key={i} style={{ marginRight: '6px' }}>{tag}</span>
                ))}
              </div>
              <div style={{ fontSize: '10px', cursor: 'se-resize', userSelect: 'none' }}>◢</div>
            </div>
          </div>
        </div>

        {/* ================= BOTTOM ACTIONS ================= */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '10px' }}>
          <button
            type="submit"
            style={{
              background: '#14532d',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '7px 16px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.08)'
            }}
          >
            <Save size={13} />
            <span>Save Agreement</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            style={{
              background: '#15803d',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '7px 14px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.08)'
            }}
          >
            <Eye size={13} />
            <span>Preview Agreement (PDF Style)</span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            style={{
              background: '#ffffff',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              padding: '7px 14px',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <ArrowLeft size={13} />
            <span>Cancel</span>
          </button>
        </div>
      </form>

      {/* 11-Page PDF-Style Agreement Preview Modal */}
      <AgreementPreviewModal
        isOpen={showPreviewModal}
        agreement={{
          client_name: name,
          email,
          phone,
          pan,
          dob,
          address,
          city: lead?.city || '',
          agreement_date: executedDate,
          start_date: startDate,
          prepared_by: preparedBy || 'Dhruv',
          assigned_consultant: preparedBy || 'Dhruv',
          agreement_duration: agreementDuration,
          consultancy_fee: consultancyFees,
          resolution_duration: resolutionDuration,
          monthly_income: monthlyIncome,
          loan_amount: totalLoan,
          lenders: lenders.map(l => ({
            name: l.lenderName || l.name,
            type: l.loanType || l.type || 'Personal Loan',
            amount: l.loanAmount ? `₹ ${parseFloat(String(l.loanAmount).replace(/[^\d.]/g, '') || 0).toLocaleString('en-IN')}` : '—',
            account_number: l.account_number || ''
          }))
        }}
        onClose={() => setShowPreviewModal(false)}
      />
    </div>
  );
}
