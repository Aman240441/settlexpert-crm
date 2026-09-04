import React from 'react';
import { Download, ArrowLeft, Copy, Check } from 'lucide-react';

interface DemandNoticeDocumentViewProps {
  demandNotice: any;
  onBack?: () => void;
}

export const DemandNoticeDocumentView: React.FC<DemandNoticeDocumentViewProps> = ({ demandNotice, onBack }) => {
  const [copied, setCopied] = React.useState(false);

  const demandNumber = demandNotice?.demand_number || 'DN-0001';
  const clientName = demandNotice?.client_name || demandNotice?.name || 'Harun Raseed';
  const clientPan = demandNotice?.client_pan || demandNotice?.pan_number || demandNotice?.pan || 'BTWPC6838E';
  const clientPhone = demandNotice?.client_phone || demandNotice?.phone || '+91 98138 72093';
  const clientEmail = demandNotice?.client_email || demandNotice?.email || 'khan****@gmail.com';
  const clientAddress = demandNotice?.client_address || demandNotice?.address || demandNotice?.client_city || 'New Delhi, Delhi, India';
  const bankName = demandNotice?.bank_name || 'HDFC Bank Ltd.';
  const loanAccountNo = demandNotice?.loan_account_no || 'HDFC-CC-98402941';
  const demandAmount = demandNotice?.demand_amount || 250000;
  const settlementOffer = demandNotice?.settlement_offer_amount || 112500;
  const noticeDate = demandNotice?.notice_date || new Date().toISOString().split('T')[0];
  const demandType = demandNotice?.demand_type || 'Incoming Loan Recall Demand';

  const handleCopyNoticeText = () => {
    const fullText = `STATUTORY LEGAL REPLY TO DEMAND NOTICE REF: SX/ADV/DEL/2026/${demandNumber}\nCLIENT: ${clientName} (PAN: ${clientPan})\nBANK: ${bankName}\nACCOUNT: ${loanAccountNo}\nDEMAND AMOUNT: ₹${demandAmount.toLocaleString('en-IN')}\nOTS SETTLEMENT OFFER: ₹${settlementOffer.toLocaleString('en-IN')}\nDATE: ${noticeDate}\n\n[Official Statutory Legal Reply - SettleXpert LLP]`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Header component strictly matching SettleXpert brand
  const PageHeader = () => (
    <div className="border-b-2 border-emerald-600 pb-2 mb-3.5 flex items-center justify-between">
      {/* SettleXpert Brand Logo Image */}
      <div className="flex items-center">
        <img src="/logo.png" alt="SettleXpert" className="h-14 max-h-14 w-auto object-contain" />
      </div>

      {/* SettleXpert LLP Registered Details */}
      <div className="text-right text-[12px] leading-tight text-slate-700 font-sans space-y-0.5">
        <strong className="text-slate-950 font-black text-[16px] uppercase tracking-wider block">
          SETTLEXPERT LLP
        </strong>
        <p className="font-medium text-slate-800">CB-201, Naraina Vihar, Ring Road, New Delhi, Delhi, India</p>
        <p className="text-slate-700">
          Phone: <span className="font-bold text-slate-950">+91 89292 23949</span> • Email:{' '}
          <span className="font-bold text-slate-950">info@settlexpert.com</span>
        </p>
        <p className="text-slate-700 font-bold">Website: www.settlexpert.com</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 pb-20 font-sans text-slate-950 print:bg-white print:p-0 print:m-0">
      {/* Top Sticky Header Controls */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-3.5 shadow-xs flex items-center justify-between print:hidden">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-xs font-bold text-slate-700 flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
          )}
          <h1 className="text-base font-bold text-slate-900">
            Demand Notice Reply Document — <span className="font-mono text-amber-700">{demandNumber}</span>
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyNoticeText}
            className="px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-xs font-bold text-slate-700 flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? 'Copied' : 'Copy Notice'}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 bg-[#15803d] hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Download PDF / Print</span>
          </button>
        </div>
      </div>

      {/* DOCUMENT CONTAINER: Strict A4 Sheets with Natural Flow */}
      <div
        id="notice-printable-doc"
        className="printable-doc-container max-w-[210mm] mx-auto mt-6 space-y-6 print:m-0 print:space-y-0 print:max-w-none"
      >
        {/* ================================= PAGE 1 ================================ */}
        <div className="a4-page-card bg-white shadow-md rounded border border-gray-200 pt-[10mm] px-[20mm] pb-[18mm] min-h-[297mm] box-border">
          <PageHeader />

          {/* Reference Bar */}
          <div className="flex justify-between items-center text-[13px] font-sans border-b border-gray-300 pb-1.5 mb-2.5">
            <div>
              <strong>REPLY REF NO:</strong>{' '}
              <span className="font-mono font-bold text-slate-900">SX/ADV/DEL/REP/2026/{demandNumber}</span>
            </div>
            <div>
              <strong>DATE:</strong> <span>{noticeDate}</span>
            </div>
          </div>

          {/* Document Title Header */}
          <div className="text-center my-2">
            <h2 className="text-[18px] font-bold tracking-wide text-slate-950 uppercase underline font-sans">
              STATUTORY LEGAL REPLY TO DEMAND NOTICE & OTS PROPOSAL
            </h2>
          </div>

          {/* Formal Addressing Block */}
          <div className="text-[16px] leading-relaxed text-slate-900 font-sans space-y-1 mb-2.5">
            <p><strong>TO,</strong></p>
            <p className="font-bold">1. THE LEGAL COUNSEL / AUTHORIZED SIGNATORY</p>
            <p className="pl-4">{bankName}, Retail Lending Operations & Legal Collections.</p>
            <p className="font-bold mt-1.5">2. THE PRINCIPAL NODAL OFFICER</p>
            <p className="pl-4">{bankName}, Grievance Redressal Division, India.</p>
          </div>

          {/* Subject & References */}
          <div className="text-[16px] font-sans my-2.5 py-2 border-t border-b border-gray-200 leading-snug space-y-1">
            <p>
              <strong>SUBJECT:</strong> STATUTORY REPLY TO YOUR DEMAND / RECALL NOTICE DATED {noticeDate} CONCERNING LOAN ACCOUNT NO: <strong>{loanAccountNo}</strong> AND SUBMISSION OF REVISED ONE-TIME SETTLEMENT (OTS) PROPOSAL.
            </p>
            <p>
              <strong>NATURE:</strong> {demandType} • DEMANDED: <strong>₹{parseFloat(demandAmount.toString()).toLocaleString('en-IN')}</strong>
            </p>
            <p>
              <strong>IN RE:</strong> OUR CLIENT — <strong>{clientName}</strong> (PAN: <strong>{clientPan}</strong>)
            </p>
          </div>

          {/* Body Text Clauses */}
          <div className="space-y-4 text-[16px] leading-[1.65] text-slate-950 font-normal text-justify">
            <p>
              <strong>Sir / Madam,</strong> Under instructions and on behalf of my client <strong>{clientName}</strong> (PAN: <strong>{clientPan}</strong>, Contact: <strong>{clientPhone}</strong>, Email: <strong>{clientEmail}</strong>), resident of {clientAddress} (hereinafter referred to as "<strong>My Client</strong>"), who has duly authorized the undersigned counsel through <strong>M/s. SettleXpert LLP</strong>, I furnish this formal Statutory Reply to your Demand Notice:
            </p>

            <p>
              <strong>1. Total Denial of Unsubstantiated Claims:</strong> That the contents, allegations, and penal calculations raised in your referenced notice, save and except what is specifically admitted herein, are denied in toto as erroneous, exaggerated, and legally untenable.
            </p>

            <p>
              <strong>2. Contractual Relationship & Bona Fide Intent:</strong> That My Client has historically made diligent repayments towards the credit facility under Account No. <strong>{loanAccountNo}</strong>. The delay or irregularity in servicing current EMIs is neither willful nor malicious, but solely attributable to unforeseen financial hardship and liquidity constraints beyond human control.
            </p>

            <p>
              <strong>3. Arbitrary & Compounded Penal Charges:</strong> That your demand of <strong>₹{parseFloat(demandAmount.toString()).toLocaleString('en-IN')}</strong> includes arbitrary penal interest, late fees, and processing levies charged in contravention of RBI Master Directions on Fair Lending Practices.
            </p>
          </div>
        </div>

        {/* ================================= PAGE 2 ================================ */}
        <div className="a4-page-card bg-white shadow-md rounded border border-gray-200 pt-[10mm] px-[20mm] pb-[18mm] min-h-[297mm] box-border">
          <PageHeader />

          <div className="border-b border-gray-300 pb-1 mb-3.5 flex justify-between items-center text-[12px] font-sans text-slate-600">
            <span>REPLY REF: SX/ADV/DEL/REP/2026/{demandNumber}</span>
            <span>CLIENT: {clientName} (PAN: {clientPan}) • BANK: {bankName}</span>
          </div>

          <div className="space-y-4 text-[16px] leading-[1.65] text-slate-950 font-normal text-justify">
            <div>
              <p>
                <strong>4. Statutory Precedents & Legal Protections:</strong> Please note the binding legal position established by the Hon'ble Supreme Court of India:
              </p>

              <div className="space-y-2.5 my-3 pl-5">
                <p>
                  <strong>(a) Supreme Court in Dashrathbhai Patel (2022):</strong> The Hon'ble Supreme Court held that security cheques or undated instruments cannot be misused to claim inflated sums without furnishing verified statement of principal liability.
                </p>
                <p>
                  <strong>(b) ICICI Bank vs. Prakash Kaur (2007):</strong> The Apex Court strictly ruled that recovery must be conducted exclusively through lawful due process and no coercive intimidation or musclemen can be deployed.
                </p>
                <p>
                  <strong>(c) RBI Master Direction on Recovery Agents:</strong> Threatening calls, workplace visits, and third-party harassment are strictly prohibited and actionable under law.
                </p>
              </div>
            </div>

            <div>
              <p>
                <strong>5. Formal One-Time Settlement (OTS) Proposal:</strong> In bona fide demonstration of sincerity to close the matter amicably, My Client hereby submits a revised One-Time Settlement offer:
              </p>

              <div className="space-y-2.5 my-3 pl-5 bg-slate-50 p-3 rounded border border-gray-200">
                <p>
                  <strong>• Total Demanded Claim:</strong> ₹{parseFloat(demandAmount.toString()).toLocaleString('en-IN')}
                </p>
                <p>
                  <strong>• Proposed OTS Settlement Offer:</strong> <span className="font-bold text-emerald-800">₹{parseFloat(settlementOffer.toString()).toLocaleString('en-IN')}</span> (Full & Final Discharge)
                </p>
                <p>
                  <strong>• Payment Mode:</strong> Structured single or 2-installment settlement upon issuance of official Bank Settlement Letter / No-Dues Certificate (NDC).
                </p>
              </div>
            </div>

            <p>
              <strong>6. Statutory Requisition to Hold Proceedings:</strong> You are hereby called upon to keep all legal, arbitration, or coercive collection proceedings in abeyance pending consideration of this OTS proposal.
            </p>
          </div>
        </div>

        {/* ================================= PAGE 3 ================================ */}
        <div className="a4-page-card bg-white shadow-md rounded border border-gray-200 pt-[10mm] px-[20mm] pb-[18mm] min-h-[297mm] box-border">
          <PageHeader />

          <div className="border-b border-gray-300 pb-1 mb-3.5 flex justify-between items-center text-[12px] font-sans text-slate-600">
            <span>REPLY REF: SX/ADV/DEL/REP/2026/{demandNumber}</span>
            <span>CLIENT: {clientName} (PAN: {clientPan}) • BANK: {bankName}</span>
          </div>

          <div className="space-y-4 text-[16px] leading-[1.65] text-slate-950 font-normal">
            <p>
              <strong>7. Verification & Confirmation:</strong>
            </p>
            <p className="text-justify">
              I, <strong>{clientName}</strong> (Holder of PAN: <strong>{clientPan}</strong>, Phone: <strong>{clientPhone}</strong>), resident of {clientAddress}, do hereby verify and confirm that the contents of this Statutory Reply have been drafted under my instructions, explained to me, and I confirm the statements made herein to be true and correct.
            </p>

            <div className="border border-gray-300 p-3 rounded text-[15px] my-3">
              <p><strong>Verified at:</strong> New Delhi, India &nbsp;&nbsp;|&nbsp;&nbsp; <strong>Dated:</strong> {noticeDate}</p>
            </div>

            {/* Signatures Block */}
            <div className="pt-8 grid grid-cols-2 gap-8 items-end text-[15px]">
              <div>
                <div className="h-14 border-b border-gray-400 mb-1.5"></div>
                <p className="font-bold uppercase text-slate-950">{clientName}</p>
                <p className="text-slate-600 text-[13px]">Client / Authorized Signatory (PAN: {clientPan})</p>
                <p className="text-slate-500 text-[12px]">Phone: {clientPhone} • Email: {clientEmail}</p>
              </div>

              <div className="text-right">
                <div className="h-14 border-b border-gray-400 mb-1.5"></div>
                <p className="font-bold uppercase text-slate-950">ADVOCATE-ON-RECORD</p>
                <p className="text-slate-700 font-medium text-[14px]">SettleXpert Legal Advisory Desk</p>
                <p className="text-slate-500 text-[13px]">Bar Council Enrollment No: D/1984/2014</p>
              </div>
            </div>

            {/* Statutory C.C. Copies Block */}
            <div className="mt-8 pt-3.5 border-t border-gray-200 text-[14px] text-slate-600 space-y-1.5">
              <p className="font-bold text-slate-900 uppercase">COPY MAINTAINED FOR RECORD (C.C.):</p>
              <p>1. Office of the Banking Ombudsman, Reserve Bank of India, New Delhi.</p>
              <p>2. Client Judicial Case File — SettleXpert Central Legal Repository.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
