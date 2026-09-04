import React, { useState } from 'react';
import {
  ArrowLeft,
  Printer,
  ExternalLink,
  Edit,
  User,
  Building2,
  TrendingDown,
  CreditCard,
  FolderOpen,
  PhoneCall,
  MessageSquare,
  CheckCircle2,
  Award,
  Sliders,
  Scale,
  Layers,
  FileSpreadsheet,
  Receipt,
  AlertTriangle,
  FileText,
  Star,
  History,
  ShieldCheck,
  Plus,
  Copy,
  Check,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Lock,
  Send,
  Download,
  Clock,
  AlertCircle,
  HelpCircle,
  X
} from 'lucide-react';
import { ClientOnboardingFormView } from './ClientOnboardingFormView';
import { Badge } from '../common/Badge';

export type ClientDetailTab =
  | 'info'
  | 'lenders'
  | 'income-emi'
  | 'emi'
  | 'bank'
  | 'documents'
  | 'boarding-call'
  | 'conversation'
  | 'client-action'
  | 'case-closure'
  | 'client-attribute'
  | 'notices'
  | 'sales-handover'
  | 'onboarding-form'
  | 'payment-history'
  | 'escalation-form'
  | 'financial-form'
  | 'sales-feedback-form'
  | 'history';

interface ClientDetailsUnifiedViewProps {
  client: any;
  lenders?: any[];
  agreements?: any[];
  payments?: any[];
  monthlyPaymentData?: any;
  userRole?: 'admin' | 'manager' | 'employee';
  initialTab?: ClientDetailTab;
  onBack: () => void;
  onOpenAgreement?: (client: any) => void;
  onOpenEdit?: (client: any) => void;
  onOpenLenders?: (client: any) => void;
}

export const ClientDetailsUnifiedView: React.FC<ClientDetailsUnifiedViewProps> = ({
  client,
  lenders = [],
  agreements = [],
  payments = [],
  monthlyPaymentData,
  userRole = 'employee',
  initialTab = 'onboarding-form',
  onBack,
  onOpenAgreement,
  onOpenEdit,
  onOpenLenders,
}) => {
  const [activeTab, setActiveTab] = useState<ClientDetailTab>(initialTab);

  // Local state for interactive features
  const [caseStatus, setCaseStatus] = useState<string>(client?.case_status || client?.status || 'active');
  const [nachDisabled, setNachDisabled] = useState<boolean>(true);

  // Conversation Notes
  const [newNote, setNewNote] = useState('');
  const [conversationLogs, setConversationLogs] = useState<any[]>([
    {
      id: 'conv-1',
      sender: client?.employee_name || 'Consultant Desk',
      role: 'Case Manager',
      date: '17 Feb 2025, 03:30 PM',
      note: 'Client verified all 4 loan accounts. Harassment reported from recovery agency. Advised client to stop NACH and record all abusive calls.',
      channel: 'Phone Call',
    },
    {
      id: 'conv-2',
      sender: 'Adv. Subham Singh',
      role: 'Advocate on Record',
      date: '18 Feb 2025, 11:15 AM',
      note: 'Cease and Desist notice issued under RBI Fair Practices Code to ICICI Bank and HDFC Bank. Speed post tracking numbers logged.',
      channel: 'Legal Dispatch',
    },
  ]);

  // Escalation Tickets
  const [escalations, setEscalations] = useState<any[]>([
    {
      id: 'ESC-9021',
      category: 'Illegal Home Visit',
      lender: 'HDFC Bank Recovery Agency',
      date: '19 Feb 2025',
      priority: 'High',
      status: 'In Legal Review',
      details: 'Unannounced agent visit at residence at 8:30 PM. CCTV video footage received from client.',
    },
  ]);
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [newEscalation, setNewEscalation] = useState({
    category: 'Abusive Phone Calls',
    lender: 'ICICI Bank',
    details: '',
    priority: 'High',
  });

  // Star Rating for Sales Feedback
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState('Consultant explained debt resolution process and agreement terms very clearly.');

  // Lenders list
  const [localLenders, setLocalLenders] = useState<any[]>(
    lenders && lenders.length > 0
      ? lenders
      : client?.lenders && client.lenders.length > 0
      ? client.lenders
      : [
          { id: 'len-1', bank_name: 'ICICI Bank', loan_type: 'Personal Loan', account_number: '•••• 8192', balance: 180000, target: 80000, emi: 8500, status: 'Negotiating' },
          { id: 'len-2', bank_name: 'HDFC Bank', loan_type: 'Credit Card', account_number: '•••• 3041', balance: 120000, target: 50000, emi: 6000, status: 'Under Notice' },
          { id: 'len-3', bank_name: 'SBI Cards', loan_type: 'Credit Card', account_number: '•••• 9942', balance: 90000, target: 40000, emi: 4500, status: 'Negotiating' },
          { id: 'len-4', bank_name: 'Bajaj Finance', loan_type: 'Consumer Loan', account_number: '•••• 1204', balance: 60000, target: 25000, emi: 3000, status: 'Settlement Offered' },
        ]
  );
  const [showAddLenderModal, setShowAddLenderModal] = useState(false);
  const [newLender, setNewLender] = useState({
    bank_name: '',
    loan_type: 'Personal Loan',
    account_number: '',
    balance: '',
    target: '',
  });

  if (!client) {
    return (
      <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-gray-200">
        No client details found.
      </div>
    );
  }

  // Exact tabs list matching the live reference screenshot
  const allTabs: { id: ClientDetailTab; label: string }[] = [
    { id: 'info', label: 'Info' },
    { id: 'lenders', label: 'Lenders' },
    { id: 'income-emi', label: 'Income/EMI' },
    { id: 'emi', label: 'EMI' },
    { id: 'bank', label: 'Bank' },
    { id: 'documents', label: 'Documents' },
    { id: 'boarding-call', label: 'Boarding Call' },
    { id: 'conversation', label: 'Conversation' },
    { id: 'client-action', label: 'Client Action' },
    { id: 'case-closure', label: 'Case Closure' },
    { id: 'client-attribute', label: 'Client Attribute' },
    { id: 'notices', label: 'Notices' },
    { id: 'sales-handover', label: 'Sales Handover' },
    { id: 'onboarding-form', label: 'Onboarding Form' },
    { id: 'payment-history', label: 'Payment History' },
    { id: 'escalation-form', label: 'Escalation Form' },
    { id: 'financial-form', label: 'Financial Form' },
    { id: 'sales-feedback-form', label: 'Sales Feedback Form' },
    { id: 'history', label: 'History' },
  ];

  const clientId = client.client_number || 'CT298728710';
  const clientName = client.name || 'Farhan khan';
  const totalDebt = Number(client.total_debt || 450000);
  const monthlyIncome = Number(client.monthly_income || 35000);
  const totalEmi = Number(client.monthly_emi || client.total_emi || 20000);
  const monthlyExpenses = Number(client.family_monthly_expenses || 30000);
  const disposableSurplus = Math.max(0, monthlyIncome - monthlyExpenses);

  const formatCurrency = (amt: any) => {
    if (amt === null || amt === undefined || isNaN(Number(amt))) return '—';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(amt));
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    const log = {
      id: `conv-${Date.now()}`,
      sender: userRole === 'admin' ? 'Admin Desk' : userRole === 'manager' ? 'Legal Manager' : (client.employee_name || 'Case Consultant'),
      role: userRole.toUpperCase(),
      date: new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      note: newNote,
      channel: 'CRM Note',
    };
    setConversationLogs([log, ...conversationLogs]);
    setNewNote('');
  };

  const handleAddLender = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLender.bank_name) return;
    const len = {
      id: `len-${Date.now()}`,
      bank_name: newLender.bank_name,
      loan_type: newLender.loan_type,
      account_number: newLender.account_number || 'Pending',
      balance: Number(newLender.balance) || 50000,
      target: Number(newLender.target) || Math.round((Number(newLender.balance) || 50000) * 0.45),
      emi: Math.round(((Number(newLender.balance) || 50000) * 0.04)),
      status: 'Negotiating',
    };
    setLocalLenders([...localLenders, len]);
    setShowAddLenderModal(false);
    setNewLender({ bank_name: '', loan_type: 'Personal Loan', account_number: '', balance: '', target: '' });
  };

  const handleCreateEscalation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEscalation.details) return;
    const esc = {
      id: `ESC-${Math.floor(1000 + Math.random() * 9000)}`,
      category: newEscalation.category,
      lender: newEscalation.lender,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      priority: newEscalation.priority,
      status: 'Escalated to Legal Head',
      details: newEscalation.details,
    };
    setEscalations([esc, ...escalations]);
    setShowEscalationModal(false);
    setNewEscalation({ category: 'Abusive Phone Calls', lender: 'ICICI Bank', details: '', priority: 'High' });
  };

  return (
    <div className="space-y-4 font-sans text-slate-800 pb-16 animate-fade-in min-h-0 h-auto">
      {/* Top Title & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 leading-tight">Client Information</h1>
          <div className="flex items-center space-x-1 text-xs text-slate-500 mt-0.5">
            <span>Home</span>
            <span>-</span>
            <span>Forms</span>
            <span>-</span>
            <span className="font-semibold text-slate-700">Client Information</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onOpenEdit && (
            <button
              onClick={() => onOpenEdit(client)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Edit Client
            </button>
          )}
          <button
            onClick={onBack}
            className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-xs font-bold text-slate-700 flex items-center space-x-1 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </button>
        </div>
      </div>

      {/* Light Green Client Registration Banner (Matching Live Reference Screenshot) */}
      <div className="rounded-lg bg-[#bbf7d0] px-5 py-3 border border-[#86efac]/80 shadow-2xs flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-[#14532d]">Client Registration</div>
          <div className="text-sm font-semibold text-[#166534] mt-0.5">
            {clientId} -- {clientName}
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Case Status</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-white text-emerald-800 border border-emerald-300">
            {caseStatus.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Tabs Navigation Bar (Scrollable, Active in Solid Blue) */}
      <div className="bg-white rounded-xl border border-gray-200 p-2 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {allTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#3b82f6] text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. ONBOARDING FORM (The 35-Field Structured Table) */}
      {/* ========================================================================= */}
      {activeTab === 'onboarding-form' && (
        <ClientOnboardingFormView
          client={client}
          lenders={localLenders}
          agreements={agreements}
          payments={payments}
          monthlyPaymentData={monthlyPaymentData}
          onOpenAgreement={onOpenAgreement}
        />
      )}

      {/* ========================================================================= */}
      {/* 2. INFO (Comprehensive 360 Client Dossier) */}
      {/* ========================================================================= */}
      {activeTab === 'info' && (
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Personal & Contact Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center space-x-2 border-b border-gray-100 pb-2 text-blue-700 font-bold">
                <User className="h-4 w-4" />
                <span>Personal & Contact Info</span>
              </div>
              <div className="space-y-2">
                <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Full Legal Name:</span> <strong>{client.name}</strong></div>
                <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Email Address:</span> <a href={`mailto:${client.email}`} className="text-blue-600 underline">{client.email}</a></div>
                <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Mobile Phone:</span> <a href={`tel:${client.phone}`} className="font-mono text-slate-800 font-bold">{client.phone}</a></div>
                <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Spouse / Emergency:</span> {client.spouse_phone || client.alt_phone || '+918618358812'}</div>
                <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Current Address:</span> {client.address || client.city || 'Connaught Place, New Delhi, India'}</div>
              </div>
            </div>

            {/* Financial & Debt Snapshot */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center space-x-2 border-b border-gray-100 pb-2 text-rose-700 font-bold">
                <TrendingDown className="h-4 w-4" />
                <span>Financial & Debt Snapshot</span>
              </div>
              <div className="space-y-2">
                <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Total Outstanding Debt:</span> <strong className="font-mono text-rose-700 text-sm">{formatCurrency(totalDebt)}</strong></div>
                <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Target Settlement (~45%):</span> <strong className="font-mono text-emerald-700">{formatCurrency(client.settlement_target || totalDebt * 0.45)}</strong></div>
                <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Verified Monthly Salary:</span> <span className="font-mono font-bold text-slate-800">{formatCurrency(monthlyIncome)}</span></div>
                <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Total Lenders Count:</span> <span className="font-bold">{localLenders.length} Creditors</span></div>
                <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Debt to Income Ratio:</span> <span className="font-bold text-amber-800">{Math.round((totalEmi / (monthlyIncome || 1)) * 100)}% (Critical Stress)</span></div>
              </div>
            </div>

            {/* Legal & Case Assignment */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center space-x-2 border-b border-gray-100 pb-2 text-purple-700 font-bold">
                <Scale className="h-4 w-4" />
                <span>Legal & Case Assignment</span>
              </div>
              <div className="space-y-2">
                <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Legal Counsel:</span> <strong className="text-purple-900">{client.advocate_name || 'Subham Singh'}</strong></div>
                <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Advocate Email:</span> {client.advocate_email || 'subham@expertpanel.org'}</div>
                <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Case Consultant / Staff:</span> {client.employee_name || 'Dhruv Singh'}</div>
                <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Cease & Desist Notice:</span> <span className="text-emerald-700 font-bold">Dispatched via Speed Post</span></div>
                <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Registered Date:</span> {client.created_at ? new Date(client.created_at).toLocaleDateString('en-IN') : '17 Feb 2025'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. LENDERS (Enrolled Creditor Portfolio) */}
      {/* ========================================================================= */}
      {activeTab === 'lenders' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs text-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Enrolled Creditors & Lenders Portfolio</h3>
              <p className="text-slate-500 text-[11px]">All banks, cards, and NBFC accounts actively represented under debt resolution.</p>
            </div>
            <button
              onClick={() => setShowAddLenderModal(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Creditor</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-gray-200 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Bank / Creditor</th>
                  <th className="py-2.5 px-3">Loan Type</th>
                  <th className="py-2.5 px-3">Account No</th>
                  <th className="py-2.5 px-3">Outstanding</th>
                  <th className="py-2.5 px-3">Settlement Target</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {localLenders.map((l, i) => (
                  <tr key={l.id || i} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-bold text-slate-900">{l.bank_name}</td>
                    <td className="py-3 px-3 text-slate-600">{l.loan_type || 'Unsecured'}</td>
                    <td className="py-3 px-3 font-mono text-slate-700">{l.account_number || '•••• 8192'}</td>
                    <td className="py-3 px-3 font-mono font-bold text-rose-700">{formatCurrency(l.balance)}</td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-700">{formatCurrency(l.target || l.balance * 0.45)}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        {l.status || 'Negotiating'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. INCOME / EMI (Financial Ratio Analysis) */}
      {/* ========================================================================= */}
      {activeTab === 'income-emi' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs text-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-gray-100 pb-3">Income vs EMI Debt Burden Analysis</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] font-bold uppercase text-emerald-800 block mb-1">Monthly Salary</span>
              <div className="text-xl font-mono font-black text-emerald-900">{formatCurrency(monthlyIncome)}</div>
              <span className="text-[10px] text-emerald-700 mt-1 block">In-Hand Salary</span>
            </div>
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
              <span className="text-[10px] font-bold uppercase text-rose-800 block mb-1">Previous Total EMI</span>
              <div className="text-xl font-mono font-black text-rose-900">{formatCurrency(totalEmi)}</div>
              <span className="text-[10px] text-rose-700 mt-1 block">Across 4 Lenders</span>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-[10px] font-bold uppercase text-amber-800 block mb-1">Family Living Expenses</span>
              <div className="text-xl font-mono font-black text-amber-900">{formatCurrency(monthlyExpenses)}</div>
              <span className="text-[10px] text-amber-700 mt-1 block">Rent, Ration, Utilities</span>
            </div>
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-[10px] font-bold uppercase text-blue-800 block mb-1">Disposable Surplus</span>
              <div className="text-xl font-mono font-black text-blue-900">{formatCurrency(disposableSurplus)}</div>
              <span className="text-[10px] text-blue-700 mt-1 block">Surplus For Settlement</span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Debt-to-Income (DTI) Ratio Meter</span>
              <span className="font-mono font-bold text-rose-700">57% DTI</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-rose-600 rounded-full" style={{ width: '57%' }}></div>
            </div>
            <p className="text-[11px] text-slate-500">
              A DTI over 50% qualifies the client for acute financial distress representation before banks for substantial OTS waivers.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. EMI (Monthly Retainer Ledger) */}
      {/* ========================================================================= */}
      {activeTab === 'emi' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs text-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Monthly Retainer & Service EMI Schedule</h3>
              <p className="text-slate-500 text-[11px]">Installment ledger for legal protection & debt settlement services.</p>
            </div>
            <div className="font-mono font-bold text-slate-900">
              Monthly Fee: <span className="text-blue-700">₹8,000 / Month</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-gray-200 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Instalment</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3">Expected Amount</th>
                  <th className="py-2.5 px-3">Received Amount</th>
                  <th className="py-2.5 px-3">Payment Mode</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  { month: 'Month 1', date: '05 Mar 2025', exp: 8000, rec: 8000, mode: 'UPI / Razorpay', status: 'Paid' },
                  { month: 'Month 2', date: '05 Apr 2025', exp: 8000, rec: 0, mode: 'Auto Mandate', status: 'Pending' },
                  { month: 'Month 3', date: '05 May 2025', exp: 8000, rec: 0, mode: 'Auto Mandate', status: 'Upcoming' },
                  { month: 'Month 4', date: '05 Jun 2025', exp: 8000, rec: 0, mode: 'Auto Mandate', status: 'Upcoming' },
                  { month: 'Month 5', date: '05 Jul 2025', exp: 8000, rec: 0, mode: 'Auto Mandate', status: 'Upcoming' },
                  { month: 'Month 6', date: '05 Aug 2025', exp: 8000, rec: 0, mode: 'Auto Mandate', status: 'Upcoming' },
                ].map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{item.month}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{item.date}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{formatCurrency(item.exp)}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">{formatCurrency(item.rec)}</td>
                    <td className="py-2.5 px-3 text-slate-600">{item.mode}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. BANK (Banking & NACH Safeguard) */}
      {/* ========================================================================= */}
      {activeTab === 'bank' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs text-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-gray-100 pb-3">Primary Salary Account & NACH Mandate Configuration</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Salary / Primary Operating Account</span>
              <div className="text-sm font-bold text-slate-900">{client.salary_bank || 'ICICI Bank Ltd.'}</div>
              <div className="font-mono text-slate-700">Account No: •••• •••• 9118 (Savings)</div>
              <div className="font-mono text-slate-600">IFSC Code: ICIC0000104 • Connaught Place Branch</div>
              <div className="text-slate-500 text-[11px]">Salary Date: 5th of every month</div>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-amber-800 font-bold uppercase text-[10px]">NACH / Auto-Debit Protection</span>
                <button
                  type="button"
                  onClick={() => setNachDisabled(!nachDisabled)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${nachDisabled ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}
                >
                  {nachDisabled ? 'NACH Cancellation Active' : 'NACH Active (Risk)'}
                </button>
              </div>
              <p className="text-amber-900 text-[11px] leading-relaxed">
                Bank auto-debits on defaulted loans cause severe recurring bounce penalties (₹590 per bounce). Client has been instructed to cancel NACH mandates through internet banking.
              </p>
              <div className="text-[10px] font-mono text-amber-800 font-semibold">
                Lenders auto-debiting: 0 • Blank cheques issued: 0
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. DOCUMENTS (KYC & Legal Document Manager) */}
      {/* ========================================================================= */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs text-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">KYC & Financial Documents Repository</h3>
              <p className="text-slate-500 text-[11px]">Verified identity proofs, bank statements, and legal agreements.</p>
            </div>
            <button
              onClick={() => alert('Document upload modal opened. Select PDF / JPG files to attach.')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Upload Document</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { title: 'Permanent Account Number (PAN Card)', file: 'PAN_Farhan_Khan.pdf', status: 'Verified', date: '17 Feb 2025' },
              { title: 'Government Aadhaar Card (Masked UIDAI)', file: 'Aadhaar_Front_Back.pdf', status: 'Authenticated', date: '17 Feb 2025' },
              { title: 'Salary Bank Statement (Last 6 Months)', file: 'ICICI_Statement_6M.pdf', status: 'Analyzed', date: '17 Feb 2025' },
              { title: 'Executed Retainer Legal Agreement', file: 'Agreement_SettleXpert_CT298.pdf', status: 'Active Legal Contract', date: '18 Feb 2025' },
              { title: 'Creditor Notice & Demand Letters', file: 'Creditor_Demand_Notices.pdf', status: 'Logged', date: '18 Feb 2025' },
            ].map((doc, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FolderOpen className="h-5 w-5 text-blue-600 shrink-0" />
                  <div>
                    <strong className="text-slate-900 block">{doc.title}</strong>
                    <span className="font-mono text-[10px] text-slate-500">{doc.file} • {doc.date}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {doc.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => alert(`Downloading: ${doc.file}`)}
                    className="p-1 rounded hover:bg-slate-200 text-slate-600 cursor-pointer"
                    title="Download"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. BOARDING CALL (Onboarding Call Quality & Consent Verification) */}
      {/* ========================================================================= */}
      {activeTab === 'boarding-call' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs text-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Boarding & Welcome Verification Call</h3>
              <p className="text-slate-500 text-[11px]">Audit of onboarding call protocols, agreement explanation, and client confirmations.</p>
            </div>
            <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px]">
              Call Verified: 17 Feb 2025, 04:15 PM
            </span>
          </div>

          <div className="space-y-2">
            {[
              { q: 'Points explained in onboarding call', a: 'Agreement terms, debt resolution timelines, and legal protections explained.', ok: true },
              { q: 'Has client agreed to subscribe to Truecaller Premium?', a: 'Confirmed. Agreed to activate spam block.', ok: true },
              { q: 'Has client agreed to install CCTV camera at home?', a: 'Confirmed. Agreed to record any unannounced recovery agent visits.', ok: true },
              { q: 'Is spouse aware of loans and debt resolution proceedings?', a: 'Yes. Spouse fully informed.', ok: true },
              { q: 'Are parents aware of loan proceedings?', a: 'Yes. Parents informed to avoid third-party social harassment.', ok: true },
              { q: 'Client consent for SettleXpert legal representation', a: 'Client signed declaration digitally verified.', ok: true },
            ].map((item, i) => (
              <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start justify-between gap-4">
                <div>
                  <strong className="text-slate-900 block">{item.q}</strong>
                  <span className="text-slate-600 text-[11px] mt-0.5 block">{item.a}</span>
                </div>
                <span className="shrink-0 p-1 rounded-full bg-emerald-100 text-emerald-700">
                  <Check className="h-3.5 w-3.5" />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. CONVERSATION (Live Interactive Communication Timeline) */}
      {/* ========================================================================= */}
      {activeTab === 'conversation' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs text-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-gray-100 pb-3">Client Interaction & Follow-Up Notes Timeline</h3>

          {/* Add Note Box */}
          <form onSubmit={handleAddNote} className="space-y-2">
            <textarea
              rows={3}
              placeholder="Log new interaction note, call summary, or customer update..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-gray-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-600"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Save Note</span>
              </button>
            </div>
          </form>

          {/* Timeline */}
          <div className="space-y-3 pt-2">
            {conversationLogs.map((log) => (
              <div key={log.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center space-x-2">
                    <strong className="text-slate-900">{log.sender}</strong>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-bold">{log.role}</span>
                  </div>
                  <span className="text-slate-400 font-mono">{log.date}</span>
                </div>
                <p className="text-slate-700 text-xs leading-relaxed mt-1">{log.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. CLIENT ACTION (Operational Status & Case Adjustments) */}
      {/* ========================================================================= */}
      {activeTab === 'client-action' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs text-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-gray-100 pb-3">Operational Case Action Center</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <label className="font-bold text-slate-800 block">Update Client Lifecycle Case Status</label>
              <select
                value={caseStatus}
                onChange={(e) => setCaseStatus(e.target.value)}
                className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600"
              >
                <option value="active">Active (Under Resolution)</option>
                <option value="under_notice">Under Legal Notice Protection</option>
                <option value="in_settlement">In Settlement Negotiation</option>
                <option value="escalated">Escalated (Harassment Alert)</option>
                <option value="closed">Case Closed (Settled)</option>
              </select>
              <button
                type="button"
                onClick={() => alert(`Case status updated to: ${caseStatus.toUpperCase()}`)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
              >
                Apply Status Change
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <label className="font-bold text-slate-800 block">Advocate Legal Shield Action</label>
              <p className="text-slate-500 text-[11px]">
                Request immediate advocate cease & desist re-dispatch if banks continue unauthorized calls.
              </p>
              <button
                type="button"
                onClick={() => alert('Urgent notice dispatch requested to Advocate Subham Singh.')}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5"
              >
                <Scale className="h-3.5 w-3.5" />
                <span>Re-issue Notice to Creditors</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. CASE CLOSURE (Settlement Resolution & NOC Milestone) */}
      {/* ========================================================================= */}
      {activeTab === 'case-closure' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs text-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Debt Settlement Resolution & NOC Case Closure</h3>
              <p className="text-slate-500 text-[11px]">Track No Objection Certificates (NOC) and final debt waiver letters from lenders.</p>
            </div>
            <span className="px-2.5 py-1 rounded bg-blue-100 text-blue-800 font-bold">
              Resolution In Progress
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Total Original Debt</span>
              <strong className="text-base font-mono font-bold text-slate-900">{formatCurrency(totalDebt)}</strong>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block mb-1">Est. Settled Amount</span>
              <strong className="text-base font-mono font-bold text-emerald-800">{formatCurrency(totalDebt * 0.45)}</strong>
            </div>
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-[10px] uppercase font-bold text-blue-700 block mb-1">Estimated Savings</span>
              <strong className="text-base font-mono font-bold text-blue-800">{formatCurrency(totalDebt * 0.55)} (55%)</strong>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <strong className="text-slate-800 block">Lender Settlement NOC Status:</strong>
            <div className="space-y-1.5">
              {localLenders.map((l, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                  <span className="font-bold text-slate-800">{l.bank_name} ({l.loan_type})</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    Settlement Negotiation in Progress
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 12. CLIENT ATTRIBUTE (Risk & Psychological Scorecard) */}
      {/* ========================================================================= */}
      {activeTab === 'client-attribute' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs text-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-gray-100 pb-3">Client Behavioral & Risk Attribute Matrix</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Client Temperament</span>
              <div className="text-sm font-bold text-slate-900">Cooperative / High Anxiety</div>
              <p className="text-[11px] text-slate-500">Needs periodic reassurance on recovery agent phone calls.</p>
            </div>
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
              <span className="text-rose-700 font-bold uppercase text-[10px]">Harassment Severity</span>
              <div className="text-sm font-bold text-rose-900">Severe Unlawful Calls</div>
              <p className="text-[11px] text-rose-700">Agents calling from multiple virtual numbers. Truecaller active.</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
              <span className="text-emerald-700 font-bold uppercase text-[10px]">Likelihood of Early Drop</span>
              <div className="text-sm font-bold text-emerald-900">Low Risk (Committed)</div>
              <p className="text-[11px] text-emerald-700">Client has family support and committed to full resolution plan.</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 13. NOTICES (Statutory Legal Notice Tracker) */}
      {/* ========================================================================= */}
      {activeTab === 'notices' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs text-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Statutory Legal Notices & Dispatch Tracking</h3>
              <p className="text-slate-500 text-[11px]">Official Cease & Desist notices dispatched under RBI Master Directions.</p>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { lender: 'ICICI Bank Ltd.', type: 'Cease & Desist against Harassment', speedPost: 'ED891230492IN', status: 'Delivered', date: '18 Feb 2025' },
              { lender: 'HDFC Bank Ltd.', type: 'Cease & Desist against Harassment', speedPost: 'ED891230493IN', status: 'Delivered', date: '18 Feb 2025' },
              { lender: 'SBI Cards & Payment Services', type: 'Representation under RBI Ombudsman', speedPost: 'ED891230494IN', status: 'In Transit', date: '19 Feb 2025' },
            ].map((n, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <strong className="text-slate-900 block">{n.lender}</strong>
                  <span className="text-slate-600 text-[11px]">{n.type}</span>
                  <div className="font-mono text-[10px] text-blue-700 mt-0.5">Tracking No: {n.speedPost} • Dispatched: {n.date}</div>
                </div>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${n.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                  {n.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 14. SALES HANDOVER (Handoff Dossier) */}
      {/* ========================================================================= */}
      {activeTab === 'sales-handover' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs text-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-gray-100 pb-3">Sales to Legal/Operations Handover Dossier</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div><span className="text-slate-400 font-bold uppercase text-[10px] block">Converted By Consultant:</span> <strong className="text-slate-900">{client.employee_name || 'Dhruv Singh'}</strong></div>
              <div><span className="text-slate-400 font-bold uppercase text-[10px] block">Lead Conversion Date:</span> 17 Feb 2025</div>
              <div><span className="text-slate-400 font-bold uppercase text-[10px] block">Lead Origin:</span> Direct Web Intake Form</div>
              <div><span className="text-slate-400 font-bold uppercase text-[10px] block">Agreed Retainer Fee:</span> ₹48,000 (6 Months @ ₹8,000/mo)</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Consultant Handover Note:</span>
              <p className="text-slate-700 leading-relaxed italic">
                "Client was under intense recovery harassment on ICICI personal loan and HDFC card. Advised to cancel NACH and onboarded under 6-month resolution plan. All 4 lender statements collected and verified."
              </p>
              <div className="text-[11px] text-emerald-700 font-bold pt-1">
                ✓ Handover Accepted by Operations Manager
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 15. PAYMENT HISTORY (Financial Transactions) */}
      {/* ========================================================================= */}
      {activeTab === 'payment-history' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs text-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Verified Payments & Receipts Ledger</h3>
              <p className="text-slate-500 text-[11px]">Official transaction records verified by the Finance Department.</p>
            </div>
            <span className="font-mono font-bold text-emerald-700">Total Collected: ₹8,000</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-gray-200 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Receipt ID</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Gateway</th>
                  <th className="py-2.5 px-3">Verified By</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-mono font-bold text-blue-700">SX-RCP-2025-091</td>
                  <td className="py-3 px-3 font-mono text-slate-600">17 Feb 2025</td>
                  <td className="py-3 px-3 font-mono font-black text-emerald-700">₹8,000.00</td>
                  <td className="py-3 px-3 text-slate-700">Razorpay / UPI</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Finance Verified
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => window.print()}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-gray-300 rounded text-[11px] font-bold text-slate-700 cursor-pointer"
                    >
                      Print Receipt
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 16. ESCALATION FORM (Harassment & Complaint Tickets) */}
      {/* ========================================================================= */}
      {activeTab === 'escalation-form' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs text-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Harassment & Grievance Escalation Center</h3>
              <p className="text-slate-500 text-[11px]">Log unlawful recovery agent visits, third-party calls, or harassment violations.</p>
            </div>
            <button
              onClick={() => setShowEscalationModal(true)}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Raise Escalation</span>
            </button>
          </div>

          <div className="space-y-3">
            {escalations.map((esc) => (
              <div key={esc.id} className="p-4 rounded-xl bg-rose-50/50 border border-rose-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-rose-800">{esc.id}</span>
                    <span className="font-bold text-slate-900">{esc.category} ({esc.lender})</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                    {esc.status}
                  </span>
                </div>
                <p className="text-slate-700 text-xs">{esc.details}</p>
                <div className="text-[10px] text-slate-500 font-mono">Date Logged: {esc.date} • Priority: {esc.priority}</div>
              </div>
            ))}
          </div>

          {/* Modal to raise new escalation */}
          {showEscalationModal && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl p-5 max-w-md w-full space-y-3 shadow-xl">
                <div className="flex items-center justify-between border-b pb-2">
                  <strong className="text-sm font-bold text-slate-900">Raise Harassment Escalation</strong>
                  <button onClick={() => setShowEscalationModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
                </div>
                <form onSubmit={handleCreateEscalation} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Violation Category</label>
                    <select
                      value={newEscalation.category}
                      onChange={(e) => setNewEscalation({ ...newEscalation, category: e.target.value })}
                      className="w-full p-2 border rounded-lg text-xs"
                    >
                      <option>Illegal Home Visit (Unannounced / Odd Hours)</option>
                      <option>Abusive Phone Calls (Bad Language)</option>
                      <option>Calling Relatives / Workplace</option>
                      <option>Threatening Legal Action without Authority</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Involved Bank / Lender</label>
                    <input
                      type="text"
                      value={newEscalation.lender}
                      onChange={(e) => setNewEscalation({ ...newEscalation, lender: e.target.value })}
                      className="w-full p-2 border rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Incident Details</label>
                    <textarea
                      rows={3}
                      value={newEscalation.details}
                      onChange={(e) => setNewEscalation({ ...newEscalation, details: e.target.value })}
                      placeholder="Specify agent name, phone number, time of call/visit..."
                      className="w-full p-2 border rounded-lg text-xs"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <button type="button" onClick={() => setShowEscalationModal(false)} className="px-3 py-1.5 border rounded-lg text-xs font-bold">Cancel</button>
                    <button type="submit" className="px-4 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold">Submit Escalation</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 17. FINANCIAL FORM (Comprehensive Hardship Statement) */}
      {/* ========================================================================= */}
      {activeTab === 'financial-form' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs text-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-gray-100 pb-3">Financial Hardship Affidavit & Living Statement</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <strong className="text-slate-800 block">Asset Declaration:</strong>
              <div><span className="text-slate-500">Real Estate / Immovable Property:</span> <strong>Nil (Living on Rent)</strong></div>
              <div><span className="text-slate-500">Vehicles:</span> Two-Wheeler (Motorcycle)</div>
              <div><span className="text-slate-500">Gold / Jewelry:</span> Pledged earlier for personal emergency</div>
              <div><span className="text-slate-500">Bank Balance:</span> ₹4,200</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <strong className="text-slate-800 block">Monthly Living Budget:</strong>
              <div><span className="text-slate-500">House Rent:</span> ₹12,000</div>
              <div><span className="text-slate-500">Family Grocery & Ration:</span> ₹10,000</div>
              <div><span className="text-slate-500">Children School Fees:</span> ₹5,000</div>
              <div><span className="text-slate-500">Medical / Utilities:</span> ₹3,000</div>
              <div className="pt-1 border-t font-bold text-slate-900">Total Essential Living: ₹30,000 / Month</div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 18. SALES FEEDBACK FORM (Client Rating & Feedback) */}
      {/* ========================================================================= */}
      {activeTab === 'sales-feedback-form' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs text-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-gray-100 pb-3">Client Onboarding Experience & Feedback</h3>
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4 max-w-xl">
            <div>
              <label className="font-bold text-slate-800 block mb-1">Sales Transparency & Service Rating</label>
              <div className="flex items-center space-x-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFeedbackRating(s)}
                    className="p-1 cursor-pointer"
                  >
                    <Star className={`h-6 w-6 ${s <= feedbackRating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                  </button>
                ))}
                <span className="font-bold text-slate-700 ml-2">{feedbackRating} / 5 Stars</span>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Client Feedback & Comments</label>
              <textarea
                rows={3}
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-xs"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setFeedbackSubmitted(true);
                alert('Sales Feedback saved successfully!');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs"
            >
              {feedbackSubmitted ? '✓ Feedback Saved' : 'Submit Feedback'}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 19. HISTORY (Audit Trail of All Changes) */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs text-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-gray-100 pb-3">Complete System Audit Log & Timeline</h3>
          <div className="space-y-3">
            {[
              { title: 'Client Onboarded & Registration Created', by: 'Dhruv Singh', role: 'Consultant', date: '17 Feb 2025, 02:45 PM' },
              { title: 'Onboarding Form 35 Questions Completed & Verified', by: 'Dhruv Singh', role: 'Consultant', date: '17 Feb 2025, 03:15 PM' },
              { title: 'First Month Retainer Fee (₹8,000) Verified', by: 'Finance Department', role: 'Finance Admin', date: '17 Feb 2025, 04:00 PM' },
              { title: 'Retainer Legal Agreement Generated & Countersigned', by: 'Legal Desk', role: 'Ops Desk', date: '18 Feb 2025, 10:30 AM' },
              { title: 'Advocate Subham Singh Assigned as Advocate-on-Record', by: 'Legal Manager', role: 'Manager', date: '18 Feb 2025, 11:00 AM' },
              { title: 'Cease & Desist Notices Dispatched via Speed Post', by: 'Adv. Subham Singh', role: 'Advocate', date: '18 Feb 2025, 02:00 PM' },
            ].map((h, i) => (
              <div key={i} className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="h-2 w-2 rounded-full bg-blue-600 mt-1.5 shrink-0"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900">{h.title}</strong>
                    <span className="text-slate-400 font-mono text-[10px]">{h.date}</span>
                  </div>
                  <span className="text-[11px] text-slate-500">By: {h.by} ({h.role})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal for adding lender */}
      {showAddLenderModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b pb-2">
              <strong className="text-sm font-bold text-slate-900">Add New Creditor / Lender</strong>
              <button onClick={() => setShowAddLenderModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleAddLender} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Bank / NBFC Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Axis Bank, RBL, Kotak Mahindra"
                  value={newLender.bank_name}
                  onChange={(e) => setNewLender({ ...newLender, bank_name: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Loan Type</label>
                  <select
                    value={newLender.loan_type}
                    onChange={(e) => setNewLender({ ...newLender, loan_type: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option>Personal Loan</option>
                    <option>Credit Card</option>
                    <option>Consumer Loan</option>
                    <option>Business Loan</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Account / Card No</label>
                  <input
                    type="text"
                    placeholder="•••• 4201"
                    value={newLender.account_number}
                    onChange={(e) => setNewLender({ ...newLender, account_number: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Outstanding Balance (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="100000"
                    value={newLender.balance}
                    onChange={(e) => setNewLender({ ...newLender, balance: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Settlement Target (₹)</label>
                  <input
                    type="number"
                    placeholder="45000"
                    value={newLender.target}
                    onChange={(e) => setNewLender({ ...newLender, target: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowAddLenderModal(false)} className="px-3 py-1.5 border rounded-lg font-bold">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-bold">Add Creditor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
