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
  Download,
  CheckCircle2,
  Clock,
  Send,
  ShieldAlert,
  AlertTriangle,
  Calendar,
  User,
  ExternalLink,
  Edit2,
  Copy,
  Check,
  Scale,
  Award,
  ShieldCheck
} from 'lucide-react';
import { api } from '../../services/api';
import { Modal } from '../common/Modal';
import { CalendarDateFilter, getTodayStr } from '../common/CalendarDateFilter';
import { LegalNoticeDocumentView } from './LegalNoticeDocumentView';

export const AdvocateLegalNoticesView: React.FC = () => {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Mode: 'list' | 'document_view' (Matching Employee CRM Agreement Document View)
  const [viewMode, setViewMode] = useState<'list' | 'document_view'>('list');

  // Stats
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    dispatched: 0,
    delivered: 0,
    draft: 0
  });

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedNoticeForView, setSelectedNoticeForView] = useState<any>(null);
  const [editingNotice, setEditingNotice] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Clients & Lenders for dropdown
  const [clientOptions, setClientOptions] = useState<any[]>([]);
  const [selectedClientDetails, setSelectedClientDetails] = useState<any>(null);

  const [formData, setFormData] = useState({
    client_id: '',
    client_name: '',
    bank_name: '',
    loan_account_no: '',
    notice_type: 'Anti-Harassment Notice (RBI Master Direction)',
    notice_subject: '',
    notice_content: '',
    notice_date: getTodayStr(),
    dispatch_date: '',
    speed_post_number: '',
    status: 'Draft'
  });

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await api.getAdvocateLegalNotices({
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        notice_type: typeFilter !== 'all' ? typeFilter : undefined,
        date: selectedDate || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        page,
        limit
      });
      setNotices(res.notices || []);
      if (res.statusCounts) {
        setStatusCounts(res.statusCounts);
      }
      setTotal(res.pagination?.total || 0);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: 'Failed to load legal notices' });
    } finally {
      setLoading(false);
    }
  };

  const fetchClientOptions = async () => {
    try {
      const res = await api.getAdvocateCases({ limit: 100 });
      setClientOptions(res.cases || []);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [search, statusFilter, typeFilter, selectedDate, fromDate, toDate, page, limit]);

  useEffect(() => {
    fetchClientOptions();
  }, []);

  const generateDefaultNoticeContent = (clientName: string, bankName: string, type: string, loanAccountNo?: string) => {
    const cName = clientName || '[NAME OF CLIENT]';
    const bName = bankName || '[NAME OF BANK / NBFC]';
    const accNo = loanAccountNo || '[LOAN / CREDIT CARD A/C NO]';

    if (type.includes('Harassment') || type.includes('Cease')) {
      return `TO,
1. THE MANAGING DIRECTOR & CHIEF EXECUTIVE OFFICER
   ${bName}
   Corporate Headquarters / Regional Legal Operations Center.

2. THE PRINCIPAL NODAL OFFICER & GRIEVANCE REDRESSAL DESK
   ${bName}

SUBJECT: STATUTORY CEASE & DESIST LEGAL NOTICE UNDER RBI MASTER DIRECTION (DOR.ORG.REC.65/21.04.158/2022-23) AND COMPLAINT AGAINST UNLAWFUL RECOVERY HARASSMENT, THREATS AND COERCIVE PRACTICES.

RE: LOAN / CREDIT CARD FACILITY ACCOUNT NO: ${accNo}
IN RE: OUR CLIENT — ${cName} (RESIDENT OF INDIA)

Sir / Madam,

Under instructions and on behalf of my client ${cName}, through SettleXpert Legal Advisory Desk, I hereby serve upon your institution and its empanelled recovery agencies this formal CEASE & DESIST LEGAL NOTICE:

1. THAT my client is a respectable citizen of India with an established social reputation, who had previously availed credit facilities from your institution under Account No. ${accNo}.

2. THAT owing to genuine, documented financial hardship and severe economic distress, my client has faced difficulty in servicing EMIs and has formally enrolled with SettleXpert for lawful debt resolution, restructuring and amicable settlement.

3. THAT in blatant violation of the Hon'ble Supreme Court judgments in 'ICICI Bank vs. Prakash Kaur (2007) 2 SCC 711' and RBI Directives on Recovery Agents dated August 12, 2022:
   (a) Your recovery agents and third-party agencies have been repeatedly making incessant, abusive phone calls at odd hours (before 8:00 AM and after 7:00 PM).
   (b) Unidentified personnel have threatened family members and visited workplace premises without prior statutory notice or authorization ID cards.
   (c) Defamatory messages and calls have been made to third-party contacts and relatives, constituting criminal intimidation.

4. TAKE NOTICE that recovery through harassment, mental torture, or humiliation is strictly prohibited under law and constitutes punishable offences under Section 503 & 506 (Criminal Intimidation), Section 499 & 500 (Criminal Defamation), and Section 383 (Extortion) of the Indian Penal Code, 1860 / Bharatiya Nyaya Sanhita, 2023.

5. YOU ARE HEREBY CALLED UPON TO:
   (i) Immediately instruct your collection staff, call centers, and recovery agencies to CEASE AND DESIST from contacting my client, family members, or workplace personnel directly.
   (ii) Direct all future communications and debt restructuring proposals strictly to this legal office in writing.
   (iii) Provide a complete statement of accounts reflecting the actual principal outstanding without arbitrary penalties.

FAILING COMPLIANCE within 48 hours of receipt hereof, my client shall be constrained to initiate criminal proceedings before the competent Judicial Magistrate, lodge a formal complaint before the Reserve Bank of India (RBI) Banking Ombudsman, and claim damages for mental agony and loss of reputation at your sole cost and consequence.

A copy of this notice is retained in our chamber records for future judicial proceedings.

Yours faithfully,

ADVOCATE-ON-RECORD
Bar Council Enrollment No: D/1984/2014
Chamber of Advocates & Debt Advisory Cell
High Court of Delhi & Debt Resolution Advisory Desk`;
    } else if (type.includes('138') || type.includes('Cheque')) {
      return `TO,
THE ADVOCATE-ON-RECORD / LEGAL DEPARTMENT
${bName}

SUBJECT: STATUTORY REPLY TO NOTICE UNDER SECTION 138 READ WITH SECTION 141 OF THE NEGOTIABLE INSTRUMENTS ACT, 1881.

RE: YOUR DEMAND NOTICE REF NO: [NOTICE REF] DATED [NOTICE DATE]
IN RE: OUR CLIENT — ${cName} (ACCOUNT NO: ${accNo})

Sir / Madam,

Under instructions from and on behalf of my client ${cName}, I furnish this formal reply to your statutory demand notice:

1. That the allegations and contentions raised in your notice, save and except what is expressly admitted herein, are denied in toto as baseless, erroneous and legally untenable.

2. That the cheque/instrument referenced in your notice was obtained by your institution solely as an undated security instrument at the inception of the credit facility and was never issued towards the discharge of any existing legally enforceable debt in the manner claimed.

3. That your institution has arbitrarily filled in exaggerated penal charges and presented the security cheque without rendering verified reconciliation statements, which amounts to misuse of security instruments contrary to the law laid down by the Hon'ble Supreme Court in 'Dashrathbhai Trikambhai Patel vs. Hitesh Mahendrabhai Patel (2022)'.

4. That my client has always acted in bona fide good faith and remains willing to settle all genuine, verified outstandings under a mutual One-Time Settlement (OTS) framework.

5. You are accordingly called upon to withdraw your premature notice and furnish an authentic principal statement to enable amicable resolution.

Yours faithfully,

ADVOCATE FOR RESPONDENT
Chamber of Legal Counsel & Advisory Board`;
    }

    return `TO,
THE AUTHORIZED LEGAL REPRESENTATIVE
${bName}

SUBJECT: LEGAL COMMUNICATION & PROPOSAL FOR AMICABLE DEBT SETTLEMENT.
RE: CLIENT: ${cName} • A/C NO: ${accNo}

Sir / Madam,
Under instructions of my client ${cName}, please take notice that all negotiations, representations, and settlement terms concerning the above account shall henceforth be managed exclusively through the undersigned legal counsel.

Kindly direct all official communications and verified statement of accounts to this legal desk.

Yours faithfully,
ADVOCATE-ON-RECORD`;
  };

  const handleClientSelectChange = async (clientId: string) => {
    const found = clientOptions.find((c) => c.id === clientId);
    if (found) {
      const bName = found.bank_name || 'HDFC Bank Ltd.';
      const accNo = found.loan_account_no || 'PL-2026-X89';
      setFormData((prev) => ({
        ...prev,
        client_id: found.id,
        client_name: found.name,
        bank_name: bName,
        loan_account_no: accNo,
        notice_subject: `Formal Cease & Desist Legal Notice under RBI Fair Practices Directives for ${found.name}`,
        notice_content: generateDefaultNoticeContent(found.name, bName, prev.notice_type, accNo)
      }));

      try {
        const fullCase = await api.getAdvocateCaseById(clientId);
        setSelectedClientDetails(fullCase);
        if (fullCase.lenders && fullCase.lenders.length > 0 && !formData.bank_name) {
          setFormData((prev) => ({ ...prev, bank_name: fullCase.lenders[0].bank_name }));
        }
      } catch (e) { }
    } else {
      setSelectedClientDetails(null);
    }
  };

  const handleOpenCreateModal = () => {
    setFormData({
      client_id: '',
      client_name: '',
      bank_name: '',
      loan_account_no: '',
      notice_type: 'Anti-Harassment Notice (RBI Master Direction)',
      notice_subject: 'Statutory Cease & Desist Legal Notice against recovery harassment and violation of RBI Directives',
      notice_content: generateDefaultNoticeContent('', '', 'Anti-Harassment Notice (RBI Master Direction)'),
      notice_date: getTodayStr(),
      dispatch_date: '',
      speed_post_number: '',
      status: 'Draft'
    });
    setSelectedClientDetails(null);
    setIsCreateModalOpen(true);
  };

  const handleSaveNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bank_name) {
      setFeedbackMsg({ type: 'error', text: 'Please enter Bank Name' });
      return;
    }
    try {
      const res = await api.createAdvocateLegalNotice(formData);
      setFeedbackMsg({ type: 'success', text: `🎉 ${res.message || 'Legal notice created successfully!'}` });
      setIsCreateModalOpen(false);
      fetchNotices();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to create legal notice' });
    }
  };

  const handleOpenEditModal = (notice: any) => {
    setEditingNotice(notice);
    setFormData({
      client_id: notice.client_id || '',
      client_name: notice.client_name || '',
      bank_name: notice.bank_name || '',
      loan_account_no: notice.loan_account_no || '',
      notice_type: notice.notice_type || 'Anti-Harassment Notice (RBI Master Direction)',
      notice_subject: notice.notice_subject || '',
      notice_content: notice.notice_content || '',
      notice_date: notice.notice_date || getTodayStr(),
      dispatch_date: notice.dispatch_date || '',
      speed_post_number: notice.speed_post_number || '',
      status: notice.status || 'Draft'
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNotice) return;
    try {
      await api.updateAdvocateLegalNotice(editingNotice.id, formData);
      setFeedbackMsg({ type: 'success', text: `Legal Notice ${editingNotice.notice_number} updated successfully!` });
      setIsEditModalOpen(false);
      fetchNotices();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to update legal notice' });
    }
  };

  const handleDeleteNotice = async (id: string, number: string) => {
    if (!window.confirm(`Are you sure you want to delete Legal Notice ${number}?`)) return;
    try {
      await api.deleteAdvocateLegalNotice(id);
      setFeedbackMsg({ type: 'success', text: `Legal Notice ${number} deleted successfully` });
      fetchNotices();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: 'Failed to delete notice' });
    }
  };

  const handleCopyNoticeText = () => {
    if (!selectedNoticeForView) return;
    navigator.clipboard.writeText(selectedNoticeForView.notice_content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintOfficialNotice = () => {
    window.print();
  };

  const handleDownloadDocument = () => {
    if (!selectedNoticeForView) return;
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>${selectedNoticeForView.notice_number} - Legal Notice</title>
    <style>
      body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; margin: 1in; color: #000; }
      .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
      .title { font-size: 16pt; font-weight: bold; }
      .subtitle { font-size: 10pt; color: #444; }
      .ref-bar { margin-bottom: 20px; font-family: Arial, sans-serif; font-size: 10pt; font-weight: bold; }
      .subject { background: #f0f0f0; padding: 10px; font-weight: bold; margin: 15px 0; border-left: 4px solid #000; }
      .content { white-space: pre-wrap; font-size: 11pt; }
      .signature { margin-top: 40px; text-align: right; font-family: Arial, sans-serif; }
    </style></head><body>
      <div class='header'>
        <div class='title'>CHAMBER OF ADVOCATES & LEGAL COUNSEL</div>
        <div class='subtitle'>High Court of Delhi & Supreme Court of India • Debt Resolution Advisory Cell</div>
        <div class='subtitle'>Enrolment: D/1984/2014 • Chamber No. 428, Lawyers Chambers, Patiala House Courts, New Delhi</div>
      </div>
      <div class='ref-bar'>
        <div>REF: SX/ADV/DEL/2026/${selectedNoticeForView.notice_number} ${selectedNoticeForView.speed_post_number ? ' | SPEED POST: ' + selectedNoticeForView.speed_post_number : ''}</div>
        <div>DATE: ${selectedNoticeForView.notice_date}</div>
      </div>
      <div class='subject'>${selectedNoticeForView.notice_subject}</div>
      <div class='content'>${selectedNoticeForView.notice_content}</div>
      <div class='signature'>
        <div><strong>ADVOCATE-ON-RECORD</strong></div>
        <div>SettleXpert Legal Advisory Desk</div>
      </div>
    </body></html>`;

    const blob = new Blob(['\ufeff' + header], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedNoticeForView.notice_number}_Legal_Notice_${(selectedNoticeForView.client_name || 'Client').replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setFeedbackMsg({ type: 'success', text: `📥 Notice ${selectedNoticeForView.notice_number} downloaded successfully!` });
  };

  // ==========================================
  // RENDER SCREEN: FULL OFFICIAL LEGAL NOTICE DOCUMENT VIEW (Matching AgreementDocumentView in Employee CRM)
  // ==========================================
  if (viewMode === 'document_view' && selectedNoticeForView) {
    return (
      <LegalNoticeDocumentView
        notice={selectedNoticeForView}
        onBack={() => {
          setViewMode('list');
          setSelectedNoticeForView(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-4 font-sans text-slate-800 pb-16">
      {/* Top Banner / Toast */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded-lg flex items-center justify-between text-xs font-semibold shadow-xs animate-fadeIn ${feedbackMsg.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
            : 'bg-rose-50 text-rose-800 border border-rose-300'
            }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-700 ml-2">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="h-9 w-9 rounded-lg bg-indigo-900 border border-indigo-950 flex items-center justify-center text-amber-400 shadow-xs">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 leading-tight tracking-tight uppercase">
                Legal Chamber Notices & Anti-Harassment Defense
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Issue executive legal notices on Advocate Chamber Letterhead under RBI Fair Practices Directives
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-indigo-900 hover:bg-indigo-950 text-amber-300 border border-indigo-950 rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Draft Executive Legal Notice</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setStatusFilter('all')}
          className={`cursor-pointer bg-white p-3.5 rounded-xl border transition-all ${statusFilter === 'all' ? 'border-indigo-600 ring-2 ring-indigo-100 shadow-xs' : 'border-gray-200 hover:border-gray-300'
            }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <span>Total Notices Issued</span>
            <FileText className="h-4 w-4 text-indigo-700" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{statusCounts.all}</p>
        </div>

        <div
          onClick={() => setStatusFilter('Dispatched')}
          className={`cursor-pointer bg-white p-3.5 rounded-xl border transition-all ${statusFilter === 'Dispatched' ? 'border-blue-600 ring-2 ring-blue-100 shadow-xs' : 'border-gray-200 hover:border-gray-300'
            }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <span>Dispatched Notices</span>
            <Send className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-700 mt-1 font-mono">{statusCounts.dispatched}</p>
        </div>

        <div
          onClick={() => setStatusFilter('Delivered')}
          className={`cursor-pointer bg-white p-3.5 rounded-xl border transition-all ${statusFilter === 'Delivered' ? 'border-emerald-600 ring-2 ring-emerald-100 shadow-xs' : 'border-gray-200 hover:border-gray-300'
            }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <span>Delivered & Acknowledged</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-1 font-mono">{statusCounts.delivered}</p>
        </div>

        <div
          onClick={() => setStatusFilter('Draft')}
          className={`cursor-pointer bg-white p-3.5 rounded-xl border transition-all ${statusFilter === 'Draft' ? 'border-amber-600 ring-2 ring-amber-100 shadow-xs' : 'border-gray-200 hover:border-gray-300'
            }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <span>Chamber Drafts</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-700 mt-1 font-mono">{statusCounts.draft}</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by notice no, bank, client name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Notice Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-600"
            >
              <option value="all">All Notice Types</option>
              <option value="Anti-Harassment Notice (RBI Master Direction)">Anti-Harassment Notice (RBI Directives)</option>
              <option value="Reply to Section 138 (Cheque Bounce)">Reply to Sec 138 (Cheque Bounce)</option>
              <option value="Reply to Sec 25 (NACH Bounce)">Reply to Sec 25 (NACH Bounce)</option>
              <option value="Reply to Arbitration Notice">Reply to Arbitration Notice</option>
              <option value="Cease & Desist Letter">Cease & Desist Letter</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-600"
            >
              <option value="all">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Delivered">Delivered</option>
              <option value="Replied / Resolved">Replied / Resolved</option>
              <option value="Closed">Closed</option>
            </select>

            {/* Date Filter */}
            <CalendarDateFilter
              selectedDate={selectedDate}
              onDateChange={(d) => {
                setSelectedDate(d);
                setFromDate('');
                setToDate('');
                setPage(1);
              }}
              onRangeChange={(f, t) => {
                setFromDate(f);
                setToDate(t);
                setSelectedDate('');
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Notices Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
            <thead className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-3.5">Reference No</th>
                <th className="py-3 px-3.5">Client Information</th>
                <th className="py-3 px-3.5">Target Financial Institution</th>
                <th className="py-3 px-3.5">Notice Category</th>
                <th className="py-3 px-3.5">Execution Date</th>
                <th className="py-3 px-3.5">Legal Status</th>
                <th className="py-3 px-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="inline-block animate-spin h-5 w-5 border-2 border-indigo-900 border-t-transparent rounded-full mb-2"></div>
                    <div>Loading chamber notices...</div>
                  </td>
                </tr>
              ) : notices.length > 0 ? (
                notices.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3.5 font-bold text-indigo-900 font-mono text-xs">{n.notice_number}</td>
                    <td className="py-2.5 px-3.5">
                      <div className="font-bold text-slate-900">{n.client_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{n.client_number || '—'}</div>
                    </td>
                    <td className="py-2.5 px-3.5 font-semibold text-slate-800">
                      <div className="flex items-center space-x-1.5">
                        <Landmark className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-bold text-slate-900">{n.bank_name}</span>
                      </div>
                      {n.loan_account_no && (
                        <div className="text-[10px] text-slate-500 font-mono ml-5">A/C: {n.loan_account_no}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-900 border border-indigo-200">
                        {n.notice_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 font-mono text-slate-600">{n.notice_date}</td>
                    <td className="py-2.5 px-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${n.status === 'Delivered'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : n.status === 'Dispatched'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : n.status === 'Replied / Resolved'
                              ? 'bg-purple-100 text-purple-800 border border-purple-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                      >
                        {n.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => {
                            setSelectedNoticeForView(n);
                            setViewMode('document_view');
                          }}
                          title="View Official Chamber Letterhead Document"
                          className="h-7 px-2.5 rounded border border-indigo-300 bg-indigo-50 hover:bg-indigo-900 hover:text-white text-indigo-900 flex items-center space-x-1.5 transition-all text-xs font-bold shadow-xs cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Document</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(n)}
                          title="Edit Notice Details"
                          className="h-7 w-7 rounded border border-gray-200 bg-white hover:bg-amber-50 text-amber-600 flex items-center justify-center transition-colors shadow-xs"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteNotice(n.id, n.notice_number)}
                          title="Delete Notice"
                          className="h-7 w-7 rounded border border-gray-200 bg-white hover:bg-rose-50 text-rose-600 flex items-center justify-center transition-colors shadow-xs"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No legal notices found matching current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-slate-600">
          <span>
            Showing {notices.length > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, total)} of {total} entries
          </span>
          <div className="flex items-center space-x-1.5">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-2.5 py-1 bg-white border border-gray-300 rounded text-slate-700 disabled:opacity-40 hover:bg-gray-50 text-xs font-semibold"
            >
              Previous
            </button>
            <span className="px-3 py-1 bg-indigo-900 text-white font-bold rounded text-xs">{page}</span>
            <button
              disabled={page * limit >= total}
              onClick={() => setPage(page + 1)}
              className="px-2.5 py-1 bg-white border border-gray-300 rounded text-slate-700 disabled:opacity-40 hover:bg-gray-50 text-xs font-semibold"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* CREATE DRAFT LEGAL NOTICE MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Draft Executive Legal Notice"
        subtitle="Prepare Cease & Desist, Anti-Harassment or Section 138 Reply under Official Letterhead"
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveNotice} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 block mb-1 font-bold">Select Assigned Client *</label>
              <select
                required
                value={formData.client_id}
                onChange={(e) => handleClientSelectChange(e.target.value)}
                className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded text-slate-900 text-xs focus:outline-none focus:border-indigo-600 font-bold"
              >
                <option value="">-- Choose Client --</option>
                {clientOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.client_number} - {c.name} ({c.city || 'NCR'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-700 block mb-1 font-bold">Notice Category *</label>
              <select
                value={formData.notice_type}
                onChange={(e) => {
                  const newType = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    notice_type: newType,
                    notice_content: generateDefaultNoticeContent(prev.client_name, prev.bank_name, newType, prev.loan_account_no)
                  }));
                }}
                className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded text-slate-900 text-xs focus:outline-none focus:border-indigo-600 font-semibold"
              >
                <option value="Anti-Harassment Notice (RBI Master Direction)">Anti-Harassment Notice (RBI Directives)</option>
                <option value="Reply to Section 138 (Cheque Bounce)">Reply to Sec 138 (Cheque Bounce)</option>
                <option value="Reply to Sec 25 (NACH Bounce)">Reply to Sec 25 (NACH Bounce)</option>
                <option value="Reply to Arbitration Notice">Reply to Arbitration Notice</option>
                <option value="Cease & Desist Letter">Cease & Desist Letter</option>
                <option value="General Legal Notice">General Legal Notice</option>
              </select>
            </div>

            <div>
              <label className="text-slate-700 block mb-1 font-bold">Target Bank / Lending Institution *</label>
              <input
                type="text"
                required
                placeholder="e.g. HDFC Bank Ltd. / Bajaj Finance Ltd."
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded text-slate-900 text-xs focus:outline-none focus:border-indigo-600 font-semibold"
              />
            </div>

            <div>
              <label className="text-slate-700 block mb-1 font-bold">Loan / Card Account Number</label>
              <input
                type="text"
                placeholder="e.g. PL-884920492 / CC-4920"
                value={formData.loan_account_no}
                onChange={(e) => setFormData({ ...formData, loan_account_no: e.target.value })}
                className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded text-slate-900 text-xs focus:outline-none focus:border-indigo-600 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-700 block mb-1 font-bold">Notice Execution Date *</label>
              <input
                type="date"
                required
                value={formData.notice_date}
                onChange={(e) => setFormData({ ...formData, notice_date: e.target.value })}
                className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded text-slate-900 text-xs focus:outline-none focus:border-indigo-600 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-700 block mb-1 font-bold">Notice Subject Header *</label>
            <input
              type="text"
              required
              value={formData.notice_subject}
              onChange={(e) => setFormData({ ...formData, notice_subject: e.target.value })}
              className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded text-slate-900 text-xs focus:outline-none focus:border-indigo-600 font-bold"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-700 font-bold">Official Notice Legal Content & Precedents *</label>
              <span className="text-[10px] text-indigo-700 font-semibold">Auto-formatted with Supreme Court & RBI citations</span>
            </div>
            <textarea
              rows={10}
              required
              value={formData.notice_content}
              onChange={(e) => setFormData({ ...formData, notice_content: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-gray-300 rounded text-slate-900 text-xs font-mono focus:outline-none focus:border-indigo-600 leading-relaxed font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 block mb-1 font-bold">Dispatch Date</label>
              <input
                type="date"
                value={formData.dispatch_date}
                onChange={(e) => setFormData({ ...formData, dispatch_date: e.target.value })}
                className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded text-slate-900 text-xs focus:outline-none focus:border-indigo-600 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-700 block mb-1 font-bold">Notice Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded text-slate-900 text-xs focus:outline-none focus:border-indigo-600 font-bold"
              >
                <option value="Draft">Draft</option>
                <option value="Dispatched">Dispatched</option>
                <option value="Delivered">Delivered</option>
                <option value="Replied / Resolved">Replied / Resolved</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded border border-gray-300 text-slate-700 font-semibold hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded bg-indigo-900 hover:bg-indigo-950 text-amber-300 font-bold shadow-sm"
            >
              Generate Official Notice
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT LEGAL NOTICE MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Legal Notice — ${editingNotice?.notice_number || ''}`}
        subtitle="Update dispatch status and legal arguments"
        maxWidth="2xl"
      >
        <form onSubmit={handleUpdateNotice} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 block mb-1 font-bold">Bank / Institution</label>
              <input
                type="text"
                required
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded text-slate-900 text-xs focus:outline-none focus:border-indigo-600 font-bold"
              />
            </div>

            <div>
              <label className="text-slate-700 block mb-1 font-bold">Notice Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded text-slate-900 text-xs focus:outline-none focus:border-indigo-600 font-bold"
              >
                <option value="Draft">Draft</option>
                <option value="Dispatched">Dispatched</option>
                <option value="Delivered">Delivered</option>
                <option value="Replied / Resolved">Replied / Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-slate-700 block mb-1 font-bold">Dispatch Date</label>
              <input
                type="date"
                value={formData.dispatch_date}
                onChange={(e) => setFormData({ ...formData, dispatch_date: e.target.value })}
                className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded text-slate-900 text-xs focus:outline-none focus:border-indigo-600 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-700 block mb-1 font-bold">Notice Subject Header</label>
            <input
              type="text"
              required
              value={formData.notice_subject}
              onChange={(e) => setFormData({ ...formData, notice_subject: e.target.value })}
              className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded text-slate-900 text-xs focus:outline-none focus:border-indigo-600 font-bold"
            />
          </div>

          <div>
            <label className="text-slate-700 block mb-1 font-bold">Notice Content</label>
            <textarea
              rows={10}
              required
              value={formData.notice_content}
              onChange={(e) => setFormData({ ...formData, notice_content: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-gray-300 rounded text-slate-900 text-xs font-mono focus:outline-none focus:border-indigo-600 leading-relaxed font-medium"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded border border-gray-300 text-slate-700 font-semibold hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded bg-indigo-900 hover:bg-indigo-950 text-amber-300 font-bold shadow-sm"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* EXECUTIVE CHAMBER LETTERHEAD OFFICIAL NOTICE MODAL */}
      <Modal
        isOpen={!!selectedNoticeForView}
        onClose={() => setSelectedNoticeForView(null)}
        title="Official Legal Chamber Letterhead"
        subtitle={`Ref: SX/ADV/DEL/2026/${selectedNoticeForView?.notice_number || ''} • High Court of Delhi Practice Standards`}
        maxWidth="4xl"
      >
        {selectedNoticeForView && (
          <div className="space-y-4 text-slate-900">
            {/* Executive Action Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-900 text-white rounded-lg shadow-sm">
              <div className="flex items-center space-x-2 text-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                <span className="font-bold tracking-wide uppercase text-amber-400 font-mono">
                  {selectedNoticeForView.notice_number}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-300">{selectedNoticeForView.notice_type}</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopyNoticeText}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold flex items-center space-x-1.5 transition-colors border border-slate-700"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Notice'}</span>
                </button>
                <button
                  onClick={handleDownloadDocument}
                  className="px-3.5 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Document</span>
                </button>
                <button
                  onClick={handlePrintOfficialNotice}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Letterhead</span>
                </button>
              </div>
            </div>

            {/* Official Legal Notice Document Preview (A4 Letterhead Standard) */}
            <div className="bg-white border-2 border-slate-300 p-8 sm:p-12 rounded-lg shadow-md space-y-6 text-[13px] leading-relaxed font-serif text-slate-900 relative">
              {/* Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
                <Scale className="w-96 h-96 text-slate-950" />
              </div>

              {/* EXECUTIVE CHAMBER LETTERHEAD HEADER */}
              <div className="border-b-2 border-amber-600 pb-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 rounded bg-slate-900 text-amber-400 flex items-center justify-center font-bold">
                        <Scale className="h-5 w-5" />
                      </div>
                      <div>
                        <h1 className="text-xl font-black text-slate-950 uppercase tracking-wider font-sans">
                          CHAMBER OF ADVOCATES & LEGAL COUNSEL
                        </h1>
                        <p className="text-[11px] text-amber-800 font-bold uppercase tracking-widest font-sans">
                          High Court of Delhi & Supreme Court of India • Debt Resolution Advisory Cell
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-[11px] font-sans text-slate-600 leading-tight">
                    <div className="font-bold text-slate-900">Enrolment: D/1984/2014</div>
                    <div>Chamber No. 428, Lawyers Chambers</div>
                    <div>Patiala House Courts, New Delhi - 110001</div>
                    <div className="text-indigo-900 font-semibold">legal@settlexpert.com</div>
                  </div>
                </div>

                <div className="h-0.5 bg-gradient-to-r from-amber-600 via-indigo-900 to-amber-600 mt-4"></div>
              </div>

              {/* DISPATCH DETAILS & REFERENCE BAR */}
              <div className="flex flex-col sm:flex-row justify-between items-start text-xs font-sans font-semibold border-b border-gray-200 pb-3 gap-2">
                <div className="space-y-0.5">
                  <div className="inline-block px-2 py-0.5 bg-slate-100 border border-slate-300 text-slate-800 rounded font-bold text-[10px] uppercase">
                    VIA REGISTERED SPEED POST A.D. & OFFICIAL EMAIL
                  </div>
                  <div>
                    <span className="text-slate-500">REF NO:</span>{' '}
                    <span className="font-mono font-bold text-indigo-950">
                      SX/ADV/DEL/2026/{selectedNoticeForView.notice_number}
                    </span>
                  </div>
                  {selectedNoticeForView.speed_post_number && (
                    <div>
                      <span className="text-slate-500">CONSIGNMENT NO:</span>{' '}
                      <span className="font-mono font-bold text-blue-800">
                        {selectedNoticeForView.speed_post_number}
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-left sm:text-right space-y-0.5">
                  <div>
                    <span className="text-slate-500">DATE OF ISSUE:</span>{' '}
                    <span className="font-mono font-bold text-slate-900">{selectedNoticeForView.notice_date}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">NATURE:</span>{' '}
                    <span className="font-bold text-amber-900">{selectedNoticeForView.notice_type}</span>
                  </div>
                </div>
              </div>

              {/* FORMAL NOTICE BODY */}
              <div className="space-y-4 text-slate-900 text-[13px] leading-relaxed">
                {/* Subject Header */}
                <div className="bg-slate-50 p-3.5 border-l-4 border-amber-600 rounded font-sans font-bold text-xs uppercase tracking-tight text-slate-950 shadow-2xs">
                  {selectedNoticeForView.notice_subject}
                </div>

                {/* Preformatted Legal Clauses */}
                <div className="whitespace-pre-line font-sans text-xs text-slate-900 leading-relaxed space-y-3 bg-white p-2">
                  {selectedNoticeForView.notice_content}
                </div>
              </div>

              {/* STATUTORY CARBON COPIES (C.C.) & SIGNATURES */}
              <div className="pt-8 border-t-2 border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-6 items-end font-sans text-xs">
                {/* C.C. Block */}
                <div className="text-slate-600 text-[10px] space-y-1 bg-gray-50 p-3 rounded border border-gray-200">
                  <div className="font-bold uppercase text-slate-800 text-[11px]">COPIES MAINTAINED FOR RECORD (C.C.):</div>
                  <div>1. The Banking Ombudsman, Reserve Bank of India (RBI), New Delhi.</div>
                  <div>2. Cyber Crime Cell & Police Commissionerate Jurisdiction.</div>
                  <div>3. Client Judicial Case File — SettleXpert Central Legal Repository.</div>
                </div>

                {/* Advocate Seal & Signatures */}
                <div className="text-right space-y-2">
                  <div className="inline-block text-center border-2 border-indigo-900 text-indigo-950 p-2 rounded-lg font-mono text-[9px] uppercase font-bold bg-indigo-50/50 mb-1">
                    ⚖️ BAR COUNCIL OF DELHI
                    <br />
                    OFFICIAL ADVOCATE SEAL
                    <br />
                    REG: D/1984/2014
                  </div>
                  <div>
                    <div className="font-bold text-slate-950 text-sm uppercase">ADVOCATE-ON-RECORD</div>
                    <div className="text-[11px] text-slate-600">SettleXpert Legal Chamber & Advisory Desk</div>
                    <div className="text-[10px] text-slate-500">Counsel for {selectedNoticeForView.client_name}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
