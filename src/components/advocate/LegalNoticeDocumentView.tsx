import React from 'react';
import { Download, ArrowLeft, Copy, Check } from 'lucide-react';

interface LegalNoticeDocumentViewProps {
  notice: any;
  onBack?: () => void;
}

export const LegalNoticeDocumentView: React.FC<LegalNoticeDocumentViewProps> = ({ notice, onBack }) => {
  const [copied, setCopied] = React.useState(false);

  const noticeNumber = notice?.notice_number || 'LN-0001';
  const clientName = notice?.client_name || notice?.name || 'Harun Raseed';
  const clientPan = notice?.client_pan || notice?.pan_number || notice?.pan || 'BTWPC6838E';
  const clientPhone = notice?.client_phone || notice?.phone || '+91 98138 72093';
  const clientEmail = notice?.client_email || notice?.email || 'khan****@gmail.com';
  const clientAddress = notice?.client_address || notice?.address || notice?.client_city || 'New Delhi, Delhi, India';
  const bankName = notice?.bank_name || 'HDFC Bank Ltd.';
  const loanAccountNo = notice?.loan_account_no || 'HDFC-CC-98402941';
  const noticeDate = notice?.notice_date || new Date().toISOString().split('T')[0];
  const noticeSubject =
    notice?.notice_subject ||
    `STATUTORY CEASE & DESIST LEGAL NOTICE UNDER RBI MASTER DIRECTION (DOR.ORG.REC.65/21.04.158/2022-23) AND COMPLAINT AGAINST UNLAWFUL RECOVERY HARASSMENT AND COERCIVE PRACTICES`;

  const handleCopyNoticeText = () => {
    const fullText = `LEGAL NOTICE REF: SX/ADV/DEL/2026/${noticeNumber}\nCLIENT: ${clientName} (PAN: ${clientPan})\nPHONE: ${clientPhone} | EMAIL: ${clientEmail}\nADDRESS: ${clientAddress}\nBANK: ${bankName}\nACCOUNT: ${loanAccountNo}\nDATE: ${noticeDate}\n\nSUBJECT: ${noticeSubject}\n\n[Official Statutory Legal Notice - SettleXpert LLP]`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Header component strictly matching SettleXpert brand
  const PageHeader = () => (
    <div className="border-b-2 border-emerald-600 pb-2 mb-3.5 flex items-center justify-between">
      {/* SettleXpert Brand Logo Image (Enlarged & Prominent) */}
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
            Legal Notice Document Preview — <span className="font-mono text-indigo-700">{noticeNumber}</span>
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

      {/* DOCUMENT CONTAINER: Strict A4 Sheets with Balanced Padding and Natural Flow */}
      <div
        id="notice-printable-doc"
        className="printable-doc-container max-w-[210mm] mx-auto mt-6 space-y-6 print:m-0 print:space-y-0 print:max-w-none"
      >
        {/* ========================================================================= */}
        {/* ================================= PAGE 1 ================================ */}
        {/* ========================================================================= */}
        <div className="a4-page-card bg-white shadow-md rounded border border-gray-200 pt-[10mm] px-[20mm] pb-[18mm] min-h-[297mm] box-border">
          <PageHeader />

          {/* Reference Bar */}
          <div className="flex justify-between items-center text-[13px] font-sans border-b border-gray-300 pb-1.5 mb-2.5">
            <div>
              <strong>REF NO:</strong>{' '}
              <span className="font-mono font-bold text-slate-900">SX/ADV/DEL/2026/{noticeNumber}</span>
            </div>
            <div>
              <strong>DATE:</strong> <span>{noticeDate}</span>
            </div>
          </div>

          {/* Document Title Header */}
          <div className="text-center my-2">
            <h2 className="text-[18px] font-bold tracking-wide text-slate-950 uppercase underline font-sans">
              LEGAL CEASE & DESIST NOTICE
            </h2>
          </div>

          {/* Formal Addressing Block */}
          <div className="text-[16px] leading-relaxed text-slate-900 font-sans space-y-1 mb-2.5">
            <p><strong>TO,</strong></p>
            <p className="font-bold">1. THE MANAGING DIRECTOR & CHIEF EXECUTIVE OFFICER</p>
            <p className="pl-4">{bankName}, Corporate Legal Headquarters, India.</p>
            <p className="font-bold mt-1.5">2. THE PRINCIPAL NODAL OFFICER & GRIEVANCE REDRESSAL DESK</p>
            <p className="pl-4">{bankName}, Retail Credit & Debt Management Operations.</p>
          </div>

          {/* Subject & References */}
          <div className="text-[16px] font-sans my-2.5 py-2 border-t border-b border-gray-200 leading-snug space-y-1">
            <p>
              <strong>SUBJECT:</strong> {noticeSubject}
            </p>
            <p>
              <strong>RE:</strong> LOAN / CREDIT FACILITY ACCOUNT NO: <strong>{loanAccountNo}</strong>
            </p>
            <p>
              <strong>IN RE:</strong> OUR CLIENT — <strong>{clientName}</strong> (PAN: <strong>{clientPan}</strong>)
            </p>
          </div>

          {/* Body Text Clauses with Clean Spacing */}
          <div className="space-y-4 text-[16px] leading-[1.65] text-slate-950 font-normal text-justify">
            <p>
              <strong>Sir / Madam,</strong> Under instructions and on behalf of my client <strong>{clientName}</strong> (PAN: <strong>{clientPan}</strong>, Contact: <strong>{clientPhone}</strong>, Email: <strong>{clientEmail}</strong>), resident of {clientAddress} (hereinafter referred to as "<strong>My Client</strong>"), who has duly authorized the undersigned counsel through <strong>M/s. SettleXpert LLP</strong>, I hereby serve upon your institution and its empanelled collection agencies this formal Legal Notice:
            </p>

            <p>
              <strong>1. Credit Facility Background:</strong> That My Client is a respectable citizen of India with an established social reputation, who had previously availed credit facilities from your institution under Account No. <strong>{loanAccountNo}</strong>.
            </p>

            <p>
              <strong>2. Bona Fide Repayment Intent:</strong> That My Client has always acted with bona fide intentions and made sincere efforts to service payments as agreed. The underlying relationship between the parties is governed purely by civil contract terms and the applicable regulatory guidelines of the Reserve Bank of India.
            </p>

            <p>
              <strong>3. Unforeseen Financial Hardship:</strong> That due to genuine financial difficulties, economic challenges, and medical or cash-flow constraints beyond human control, My Client has experienced temporary difficulty in maintaining regular EMIs. Recognizing this, My Client has engaged <strong>SettleXpert LLP</strong> to assist in structured negotiations for an amicable One-Time Settlement (OTS).
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ================================= PAGE 2 ================================ */}
        {/* ========================================================================= */}
        <div className="a4-page-card bg-white shadow-md rounded border border-gray-200 pt-[10mm] px-[20mm] pb-[18mm] min-h-[297mm] box-border">
          <PageHeader />

          <div className="border-b border-gray-300 pb-1 mb-3.5 flex justify-between items-center text-[12px] font-sans text-slate-600">
            <span>REF: SX/ADV/DEL/2026/{noticeNumber}</span>
            <span>CLIENT: {clientName} (PAN: {clientPan}) • BANK: {bankName}</span>
          </div>

          <div className="space-y-4 text-[16px] leading-[1.65] text-slate-950 font-normal text-justify">
            <div>
              <p>
                <strong>4. Unlawful Recovery Practices & Harassment:</strong> That despite My Client's open communication and willingness to resolve the matter through lawful restructuring, your recovery executives and third-party agencies have resorted to unwarranted and unlawful recovery tactics:
              </p>

              {/* Subpoints (a), (b), (c) with Clean Spacing & Indentation */}
              <div className="space-y-2.5 my-3 pl-5">
                <p>
                  <strong>(a) Incessant Phone Calls:</strong> Making continuous and repeated phone calls at irregular and odd hours, causing severe mental stress.
                </p>
                <p>
                  <strong>(b) Workplace Visits:</strong> Threatening to visit or visiting My Client's workplace and employer premises without statutory authority, causing embarrassment and risking livelihood.
                </p>
                <p>
                  <strong>(c) Third-Party Contacting:</strong> Contacting family members, relatives, and colleagues who are neither co-borrowers nor guarantors, which is strictly unlawful.
                </p>
              </div>
            </div>

            <p>
              <strong>5. Supreme Court Precedents:</strong> That the Hon'ble Supreme Court of India has categorically held in <em>ICICI Bank Ltd. vs. Prakash Kaur (2007) 2 SCC 711</em> that banks cannot use strong-arm tactics or abusive measures for loan recovery, and all collection activities must adhere strictly to the rule of law.
            </p>

            <div>
              <p>
                <strong>6. Statutory Violations & Penal Provisions:</strong> Please take notice that harassment, criminal intimidation, and public defamation are punishable offenses under the Indian Penal Code, 1860 / Bharatiya Nyaya Sanhita, 2023:
              </p>

              {/* Subpoints (i), (ii), (iii), (iv) with Clean Spacing & Indentation */}
              <div className="space-y-2.5 my-3 pl-5">
                <p>
                  <strong>(i) Section 503 & 506 IPC:</strong> Criminal Intimidation by threatening injury to person, reputation, or property.
                </p>
                <p>
                  <strong>(ii) Section 499 & 500 IPC:</strong> Criminal Defamation by lowering the reputation of My Client in the eyes of family and colleagues.
                </p>
                <p>
                  <strong>(iii) Section 383 & 384 IPC:</strong> Extortion by placing a person in fear of injury to extract payments.
                </p>
                <p>
                  <strong>(iv) Information Technology Act, 2000:</strong> Sending offensive and abusive messages over electronic communication channels.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ================================= PAGE 3 ================================ */}
        {/* ========================================================================= */}
        <div className="a4-page-card bg-white shadow-md rounded border border-gray-200 pt-[10mm] px-[20mm] pb-[18mm] min-h-[297mm] box-border">
          <PageHeader />

          <div className="border-b border-gray-300 pb-1 mb-3.5 flex justify-between items-center text-[12px] font-sans text-slate-600">
            <span>REF: SX/ADV/DEL/2026/{noticeNumber}</span>
            <span>CLIENT: {clientName} (PAN: {clientPan}) • BANK: {bankName}</span>
          </div>

          <div className="space-y-4 text-[16px] leading-[1.65] text-slate-950 font-normal text-justify">
            <p>
              <strong>7. RBI Master Direction on Recovery Agents:</strong> Under the Reserve Bank of India Circular dated August 12, 2022 (DOR.ORG.REC.65/21.04.158/2022-23), banks and NBFCs are strictly barred from contacting borrowers before 8:00 AM and after 7:00 PM, harassing family members, or making misleading representations.
            </p>

            <p>
              <strong>8. Institution Liability:</strong> Your institution is directly and vicariously responsible for the conduct and actions of all outsourced agencies, agents, and collection executives acting on your behalf.
            </p>

            <div>
              <p>
                <strong>9. Formal Requisitions & Demands:</strong> In light of the above facts and legal position, My Client hereby calls upon your institution to comply with the following demands:
              </p>

              {/* Subpoints (a), (b), (c), (d) with Clean Spacing & Indentation */}
              <div className="space-y-2.5 my-3 pl-5">
                <p>
                  <strong>(a) Immediate Cease & Desist:</strong> Immediately stop all recovery agents and call centers from directly contacting, calling, or visiting My Client, family members, or workplace.
                </p>
                <p>
                  <strong>(b) Centralized Official Communication:</strong> Route all future settlement discussions, notices, and communications exclusively through this legal advisory office in writing.
                </p>
                <p>
                  <strong>(c) Statement of Account:</strong> Provide a complete, verified statement of account reflecting the principal amount outstanding, after reversing arbitrary penal charges.
                </p>
                <p>
                  <strong>(d) One-Time Settlement:</strong> Provide a structured, mutually acceptable One-Time Settlement (OTS) proposal within reasonable parameters.
                </p>
              </div>
            </div>

            <p>
              <strong>10. Peremptory Notice Period:</strong> You are hereby granted a period of <strong>48 hours</strong> from receipt of this notice to confirm compliance with these requisitions in writing.
            </p>

            <p>
              <strong>11. Legal Consequences of Non-Compliance:</strong> In case of non-compliance or continued harassment, My Client shall be constrained to initiate formal complaints before the <strong>RBI Banking Ombudsman</strong>, file a police complaint for criminal intimidation, and approach the appropriate Consumer Forum for compensation at your cost.
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ================================= PAGE 4 ================================ */}
        {/* ========================================================================= */}
        <div className="a4-page-card bg-white shadow-md rounded border border-gray-200 pt-[10mm] px-[20mm] pb-[18mm] min-h-[297mm] box-border">
          <PageHeader />

          <div className="border-b border-gray-300 pb-1 mb-3.5 flex justify-between items-center text-[12px] font-sans text-slate-600">
            <span>REF: SX/ADV/DEL/2026/{noticeNumber}</span>
            <span>CLIENT: {clientName} (PAN: {clientPan}) • BANK: {bankName}</span>
          </div>

          <div className="space-y-4 text-[16px] leading-[1.65] text-slate-950 font-normal">
            <p>
              <strong>12. Verification & Client Confirmation:</strong>
            </p>
            <p className="text-justify">
              I, <strong>{clientName}</strong> (Holder of PAN: <strong>{clientPan}</strong>, Phone: <strong>{clientPhone}</strong>), resident of {clientAddress}, do hereby verify and confirm that the contents of this Statutory Legal Notice have been drafted under my instructions, explained to me, and I confirm the statements made herein to be true and correct.
            </p>

            <div className="border border-gray-300 p-3 rounded text-[15px] my-3">
              <p><strong>Verified at:</strong> New Delhi, India &nbsp;&nbsp;|&nbsp;&nbsp; <strong>Dated:</strong> {noticeDate}</p>
            </div>

            {/* Signatures Block with Clean Spacing */}
            <div className="pt-8 grid grid-cols-2 gap-8 items-end text-[15px]">
              <div>
                <div className="h-14 border-b border-gray-400 mb-1.5"></div>
                <p className="font-bold uppercase text-slate-950">{clientName}</p>
                <p className="text-slate-600 text-[13px]">Client / Aggrieved Party (PAN: {clientPan})</p>
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
              <p>2. Cyber Crime Cell / Police Commissionerate Jurisdiction.</p>
              <p>3. Judicial Case File — SettleXpert Central Legal Repository.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
