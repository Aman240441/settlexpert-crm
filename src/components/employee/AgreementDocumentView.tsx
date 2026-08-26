import React from 'react';
import { Download, ArrowLeft } from 'lucide-react';

interface AgreementDocumentViewProps {
  agreement: any;
  onBack?: () => void;
}

export const AgreementDocumentView: React.FC<AgreementDocumentViewProps> = ({ agreement, onBack }) => {
  const clientName = agreement?.name || agreement?.client_name || 'SANCHITA CHATTERJEE';
  const address = agreement?.address || agreement?.client_city || agreement?.city || 'C/O Arka Chatterjee, 17/A, Ram Ratan Bose Lane, Deshbondhu Park, Shyambazar, VTC: Shyambazar Mail, P.O.: Shyambazar Mail, Sub-District: Kolkata, District: Kolkata, West Bengal – 700004';
  const dob = agreement?.dob || '1995-06-05';
  const phone = agreement?.phone || agreement?.client_phone || '+91 70441 18629';
  const email = agreement?.email || agreement?.client_email || 'acsanchita@gmail.com';
  const pan = agreement?.pin_number || agreement?.client_pin || 'BTWPC6838E';
  const startDate = agreement?.start_date || agreement?.executed_date || new Date().toISOString().split('T')[0];
  const rawIncome = agreement?.monthly_income !== undefined && agreement?.monthly_income !== null && agreement?.monthly_income !== ''
    ? agreement.monthly_income
    : (agreement?.client_monthly_income !== undefined && agreement?.client_monthly_income !== null && agreement?.client_monthly_income !== ''
      ? agreement.client_monthly_income
      : (agreement?.client?.monthly_income || 45000));
  const monthlyIncome = parseFloat(String(rawIncome).replace(/[^0-9.]/g, '')) || 45000;
  const agreementDuration = agreement?.agreement_duration || agreement?.resolution_duration || '6 Months';
  const preparedBy = agreement?.prepared_by || 'Dhruv';

  // Attached Lenders
  const lendersList = agreement?.lenders && Array.isArray(agreement.lenders) && agreement.lenders.length > 0
    ? agreement.lenders
    : [
      { bank_name: 'FlexiBee', loan_type: 'Payday Loan', balance: 10800 },
      { bank_name: 'Loan Raja', loan_type: 'Payday Loan', balance: 20400 },
      { bank_name: 'Rupee Celo', loan_type: 'Payday Loan', balance: 54500 },
      { bank_name: 'RupeeFast', loan_type: 'Payday Loan', balance: 4000 },
      { bank_name: 'Samvit Loan', loan_type: 'Payday Loan', balance: 28100 },
      { bank_name: 'Cash Sahara', loan_type: 'Payday Loan', balance: 37600 },
      { bank_name: 'Cash Loan', loan_type: 'Payday Loan', balance: 5550 },
      { bank_name: 'CashMe', loan_type: 'Payday Loan', balance: 5110 },
      { bank_name: 'Loan Margine', loan_type: 'Payday Loan', balance: 4025 },
      { bank_name: 'Loan Chalo', loan_type: 'Payday Loan', balance: 25100 },
      { bank_name: 'Loan Orbit', loan_type: 'Payday Loan', balance: 8031 },
      { bank_name: 'Satyamangalam', loan_type: 'Payday Loan', balance: 10000 },
      { bank_name: 'Nexi', loan_type: 'Payday Loan', balance: 9680 },
      { bank_name: 'Mimo Credit', loan_type: 'Payday Loan', balance: 25100 },
      { bank_name: 'Loan Sensei', loan_type: 'Payday Loan', balance: 40000 },
      { bank_name: 'Rajwise', loan_type: 'Payday Loan', balance: 9000 },
      { bank_name: 'Revoline', loan_type: 'Payday Loan', balance: 10400 },
      { bank_name: 'Rupee112', loan_type: 'Payday Loan', balance: 28980 },
      { bank_name: 'Green Credit', loan_type: 'Payday Loan', balance: 28000 },
      { bank_name: 'Funtilla Rupee', loan_type: 'Payday Loan', balance: 26000 },
      { bank_name: 'Easy Bridge', loan_type: 'Payday Loan', balance: 6200 },
      { bank_name: 'Sampat', loan_type: 'Payday Loan', balance: 28100 }
    ];

  const totalLoanAmount = lendersList.reduce((acc, curr) => acc + (parseFloat(curr.balance) || 0), 0);
  const monthlyFee = agreement?.monthly_fee || Math.round((agreement?.total_fee || 60000) / 6) || 10000;

  // Annexure B Schedule (6 Months) with robust Date Calculation
  const parseValidDate = (dateStr?: string) => {
    if (!dateStr) return new Date(2026, 8, 1);
    if (typeof dateStr === 'string' && dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts[0].length === 4) {
        return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]) || 1);
      } else {
        return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]) || 1);
      }
    } else if (typeof dateStr === 'string' && dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts[2]?.length === 4) {
        return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]) || 1);
      }
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date(2026, 8, 1) : d;
  };

  const parsedBaseDate = parseValidDate(agreement?.executed_date || agreement?.start_date || startDate);
  const baseDay = String(parsedBaseDate.getDate()).padStart(2, '0');
  const baseMonth = parsedBaseDate.getMonth();
  const baseYear = parsedBaseDate.getFullYear();

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const scheduleRows = [];

  for (let i = 0; i < 6; i++) {
    const d = new Date(baseYear, baseMonth + i, Number(baseDay));
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();
    const day = String(d.getDate()).padStart(2, '0');
    scheduleRows.push({
      month: i + 1,
      fee: monthlyFee,
      dueDate: `${day} ${month} ${year}`
    });
  }

  // Dynamic Multi-Page Chunking for Annexure A (Lenders List)
  // Page 1 holds up to 23 lenders together with the Client Details table so the page is fully utilized.
  const firstPageLenderLimit = 23;
  const contPageLenderLimit = 35;

  const lenderPages: typeof lendersList[] = [];
  if (lendersList.length <= firstPageLenderLimit) {
    lenderPages.push(lendersList);
  } else {
    lenderPages.push(lendersList.slice(0, firstPageLenderLimit));
    let remaining = lendersList.slice(firstPageLenderLimit);
    while (remaining.length > 0) {
      lenderPages.push(remaining.slice(0, contPageLenderLimit));
      remaining = remaining.slice(contPageLenderLimit);
    }
  }

  // Dynamic Multi-Page Chunking for Annexure B (Fee Schedule)
  const firstPageScheduleLimit = 6;
  const contPageScheduleLimit = 12;

  const schedulePages: typeof scheduleRows[] = [];
  if (scheduleRows.length <= firstPageScheduleLimit) {
    schedulePages.push(scheduleRows);
  } else {
    schedulePages.push(scheduleRows.slice(0, firstPageScheduleLimit));
    let remaining = scheduleRows.slice(firstPageScheduleLimit);
    while (remaining.length > 0) {
      schedulePages.push(remaining.slice(0, contPageScheduleLimit));
      remaining = remaining.slice(contPageScheduleLimit);
    }
  }

  // Common Header on each page matching SettleXpert Brand
  const PageHeader = () => (
    <div className="border-b-2 border-emerald-600 pb-2 mb-3 flex items-center justify-between">
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
        <p className="text-slate-700">Phone: <span className="font-bold text-slate-950">+91 89292 23949</span> • Email: <span className="font-bold text-slate-950">info@settlexpert.com</span></p>
        <p className="text-slate-700 font-bold">Website: www.settlexpert.com</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 pb-20 font-sans text-slate-950 print:bg-white print:p-0 print:m-0">
      {/* Top Sticky Header Controls (Hidden during print) */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-3.5 shadow-xs flex items-center justify-between print:hidden">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-xs font-bold text-slate-700 flex items-center space-x-1.5 shadow-2xs transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
          )}
          <h1 className="text-base font-bold text-slate-900">
            Agreement Document Preview — <span className="font-mono text-blue-700">{agreement?.agreement_number || 'AGR-2081'}</span>
          </h1>
        </div>

        <div className="flex items-center space-x-2">
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

      {/* DOCUMENT CONTAINER: Exclusively isolated for Print (#agreement-printable-doc) */}
      <div id="agreement-printable-doc" className="max-w-[210mm] mx-auto mt-6 space-y-6 print:m-0 print:space-y-0 print:max-w-none">

        {/* ================= PAGE 1 ================= */}
        <div className="a4-page-card bg-white shadow-md rounded border border-gray-200 p-[8mm_15mm] min-h-[297mm] flex flex-col justify-between box-border">
          <div>
            <PageHeader />
            <div className="text-center my-1.5">
              <h2 className="text-[19px] font-black tracking-wider text-slate-950 uppercase underline">
                CONSULTANCY AGREEMENT
              </h2>
            </div>

            <div className="space-y-2 text-[17px] leading-[1.6] text-slate-950 font-normal">
              <p>
                This Consultancy Agreement ("<strong>Agreement</strong>") is executed on <strong>{startDate}</strong> between:
              </p>

              <p>
                <strong>M/s. SettleXpert LLP</strong>, having its registered/operations office at <strong>CB-201, Naraina Vihar, Ring Road, New Delhi, Delhi, India</strong>, hereinafter referred to as the "<strong>First Party</strong>" or the "<strong>Company</strong>", which expression shall, unless repugnant to the context, include its successors, affiliates and permitted assigns.
              </p>

              <p className="font-bold">AND</p>

              <p>
                <strong>{clientName}</strong>, residing at <strong>{address}</strong>, Date of Birth: <strong>{dob}</strong>, Mobile No.: <strong>{phone}</strong>, Email ID: <strong>{email}</strong>, hereinafter referred to as the "<strong>Second Party</strong>" or the "<strong>Client</strong>".
              </p>

              <p>
                The Company and the Client are hereinafter collectively referred to as the "<strong>Parties</strong>" and individually as a "<strong>Party</strong>".
              </p>

              <p>
                <strong>WHEREAS</strong>, the Company is engaged in providing financial consultancy and debt resolution advisory services to individuals experiencing financial hardship and requiring professional assistance in managing their unsecured debt obligations.
              </p>

              <p>
                <strong>WHEREAS</strong>, the Client has represented that they are presently facing financial constraints and have voluntarily approached the Company seeking professional guidance and consultancy for resolving their outstanding unsecured loan and/or credit obligations.
              </p>

              <p>
                <strong>WHEREAS</strong>, after discussions regarding the Client’s financial circumstances, the Parties have mutually agreed to enter into this Agreement to define the scope of consultancy services, rights, obligations and responsibilities of both Parties.
              </p>

              <p>
                <strong>NOW, THEREFORE</strong>, in consideration of the mutual promises and covenants contained herein, the Parties agree as follows:
              </p>

              <p className="font-bold uppercase text-center pt-0.5 text-[17px]">
                NOW THIS AGREEMENT WITNESSETH AS FOLLOWS:
              </p>

              <div className="pt-0.5">
                <p className="font-bold text-slate-950 text-[18px]">1. PURPOSE OF THE AGREEMENT</p>
              </div>
            </div>
          </div>
        </div>

        {/* ================= PAGE 2 ================= */}
        <div className="a4-page-card bg-white shadow-md rounded border border-gray-200 p-[8mm_15mm] min-h-[297mm] flex flex-col justify-between box-border">
          <div>
            <PageHeader />
            <div className="space-y-2 text-[17px] leading-[1.6] text-slate-950 font-normal">
              <p>
                The purpose of this Agreement is to appoint the Company as the Client’s financial consultancy partner for providing advisory, negotiation support and debt resolution consultancy in relation to the debt accounts specifically mentioned in Annexure A.
              </p>

              <p>
                The Company shall provide consultancy services based upon the information, documents and financial details provided by the Client. The services under this Agreement are advisory in nature and are intended to assist the Client in communicating with lenders, understanding available options and working towards an amicable resolution of outstanding liabilities.
              </p>

              <p>
                The Client acknowledges that the Company does not act as a lender, financial institution, recovery agency or guarantor and shall only provide consultancy and professional assistance within the scope of this Agreement.
              </p>

              <div className="pt-1 space-y-2">
                <p className="font-bold text-slate-950 text-[18px]">2. SCOPE OF CONSULTANCY SERVICES</p>

                <p>
                  Subject to the terms of this Agreement, the Company shall provide consultancy services including, but not limited to:
                </p>

                <div className="space-y-3 pl-2.5 pt-1">
                  <p><strong>a.</strong> Reviewing and assessing the Client’s financial position and outstanding unsecured liabilities.</p>
                  <p><strong>b.</strong> Advising the Client regarding possible debt resolution options based on the financial information shared by the Client.</p>
                  <p><strong>c.</strong> Assisting the Client in preparing a practical financial strategy for addressing outstanding debts.</p>
                  <p><strong>d.</strong> Communicating and negotiating with lenders or their authorised representatives, wherever authorised by the Client.</p>
                  <p><strong>e.</strong> Providing guidance regarding applicable banking practices, borrower rights and available grievance redressal mechanisms.</p>
                  <p><strong>f.</strong> Assisting the Client in drafting representations, replies, requests and other communications intended for lenders or authorised recovery agencies.</p>
                  <p><strong>g.</strong> Providing reasonable guidance where the Client experiences recovery-related harassment or communication inconsistent with applicable regulatory guidelines.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= PAGE 3 ================= */}
        <div className="a4-page-card bg-white shadow-md rounded border border-gray-200 p-[8mm_15mm] min-h-[297mm] flex flex-col justify-between box-border">
          <div>
            <PageHeader />
            <div className="space-y-2 text-[17px] leading-[1.6] text-slate-950 font-normal">
              <div className="pl-2.5">
                <p><strong>h.</strong> Keeping the Client informed regarding significant communications or settlement proposals received from lenders relating to the accounts covered under this Agreement.</p>
              </div>

              <p>
                The services provided under this Agreement shall be limited to the lenders specifically mentioned in Annexure A unless otherwise agreed in writing between the Parties.
              </p>

              <div className="pt-1 space-y-2">
                <p className="font-bold text-slate-950 text-[18px]">3. OBLIGATIONS OF THE COMPANY</p>

                <p>
                  The Company shall make reasonable efforts to provide professional financial consultancy services throughout the tenure of this Agreement. The Company agrees to:
                </p>

                <div className="space-y-3 pl-2.5 pt-1">
                  <p><strong>a.</strong> Review the financial information and supporting documents provided by the Client to understand the nature of the outstanding unsecured liabilities.</p>
                  <p><strong>b.</strong> Provide professional guidance regarding debt resolution strategies based on the Client’s financial condition and the information made available by the Client.</p>
                  <p><strong>c.</strong> Assist the Client in communicating with lenders, financial institutions or their authorised representatives wherever such communication is required and duly authorised by the Client.</p>
                  <p><strong>d.</strong> Prepare and provide drafts of representations, replies, applications, complaints or other communications that may be required for interaction with lenders or other appropriate authorities.</p>
                  <p><strong>e.</strong> Guide the Client regarding applicable borrower rights, regulatory grievance mechanisms and lawful recovery practices issued by competent authorities from time to time.</p>
                  <p><strong>f.</strong> Where required, assist the Client in addressing instances of recovery-related harassment by suggesting appropriate complaint mechanisms before the concerned lender or regulatory authority.</p>
                  <p><strong>g.</strong> Keep the Client informed of any significant communication, proposal or settlement offer received from the lenders relating to the accounts covered under this Agreement.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= PAGE 4 ================= */}
        <div className="a4-page-card bg-white shadow-md rounded border border-gray-200 p-[8mm_15mm] min-h-[297mm] flex flex-col justify-between box-border">
          <div>
            <PageHeader />
            <div className="space-y-2 text-[17px] leading-[1.6] text-slate-950 font-normal">
              <div className="pl-2.5 space-y-3">
                <p><strong>h.</strong> Maintain the confidentiality of the Client’s personal and financial information except where disclosure is necessary for providing the agreed consultancy services or where disclosure is required by law.</p>
                <p><strong>i.</strong> Exercise reasonable professional care while providing consultancy services. However, the Company shall not be responsible for any independent decision taken by the lender or any third party.</p>
              </div>

              <div className="pt-1 space-y-2">
                <p className="font-bold text-slate-950 text-[18px]">4. OBLIGATIONS OF THE CLIENT</p>

                <p>The Client agrees and undertakes to:</p>

                <div className="space-y-3 pl-2.5 pt-1">
                  <p><strong>a.</strong> Provide complete, true and accurate information regarding income, liabilities, assets, outstanding loans and all other relevant financial details required for effective consultancy.</p>
                  <p><strong>b.</strong> Submit all documents and information reasonably requested by the Company for evaluation of the case and preparation of an appropriate debt resolution strategy.</p>
                  <p><strong>c.</strong> Promptly inform the Company of any communication received from lenders, recovery agencies, legal authorities or any other person relating to the accounts covered under this Agreement.</p>
                  <p><strong>d.</strong> Immediately notify the Company of any significant change in financial circumstances including employment, income, residence, contact details or any new borrowing undertaken during the term of this Agreement.</p>
                  <p><strong>e.</strong> Pay the consultancy fees strictly in accordance with the payment schedule agreed between the Parties. Delay or non-payment may result in suspension of consultancy services until outstanding dues are cleared.</p>
                  <p><strong>f.</strong> Cooperate with the Company and provide timely responses whenever information, documents or approvals are required for carrying out the consultancy services.</p>
                  <p><strong>g.</strong> Make all payments only through the Company’s official payment modes as communicated by the Company. The Company shall not be responsible for any payment made to any unauthorised individual, personal bank account or unofficial payment channel.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= PAGE 5 ================= */}
        <div className="a4-page-card bg-white shadow-md rounded border border-gray-200 p-[8mm_15mm] min-h-[297mm] flex flex-col justify-between box-border">
          <div>
            <PageHeader />
            <div className="space-y-1.5 text-[16.5px] leading-[1.55] text-slate-950 font-normal">
              <div className="pl-2.5 space-y-1.5">
                <p><strong>h.</strong> Understand that the consultancy services under this Agreement are limited only to the loan accounts specifically mentioned in Annexure A unless otherwise agreed in writing.</p>
                <p><strong>i.</strong> Refrain from providing false, misleading or incomplete information, as the quality of consultancy and negotiations depends upon the correctness of the information furnished by the Client.</p>
              </div>

              <div className="pt-0.5 space-y-1.5">
                <p className="font-bold text-slate-950 text-[17.5px]">5. CLIENT ACKNOWLEDGEMENTS</p>

                <p>The Client expressly understands and agrees that:</p>

                <div className="space-y-1.5 pl-2.5 pt-0.5">
                  <p><strong>a.</strong> The Company is engaged in providing consultancy and advisory services only and does not guarantee settlement, waiver, reduction of liability or acceptance of any proposal by any lender.</p>
                  <p><strong>b.</strong> Every lender follows its own internal policies and procedures. Any settlement, restructuring or resolution proposal shall remain solely at the discretion of the concerned lender.</p>
                  <p><strong>c.</strong> The time required for resolution may vary depending upon the lender, the Client’s financial circumstances, regulatory requirements and various other factors beyond the Company’s control.</p>
                  <p><strong>d.</strong> The Company does not promise any specific settlement percentage, time period or outcome, and no verbal assurance shall be treated as a guarantee unless specifically recorded in writing by the Company.</p>
                  <p><strong>e.</strong> The Client understands that any debt resolution or settlement may have an impact on the Client’s credit profile or future borrowing eligibility, which is governed by applicable banking practices and credit information companies. The Company shall not be responsible for any such consequence.</p>
                  <p><strong>f.</strong> The Company shall not be liable for any action independently taken by any lender, recovery agency or third party that is beyond the reasonable control of the Company.</p>
                  <p><strong>g.</strong> Litigation before any court or tribunal, unless specifically agreed in writing, does not form part of the consultancy services under this Agreement. Any such assistance, if required, shall be mutually discussed separately.</p>
                  <p><strong>h.</strong> This Agreement represents the complete understanding between the Parties with respect to the consultancy services and supersedes all prior discussions, representations or understandings relating to the subject matter herein.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= PAGE 6 ================= */}
        <div className="a4-page-card bg-white shadow-md rounded border border-gray-200 p-[8mm_15mm] min-h-[297mm] flex flex-col justify-between box-border">
          <div>
            <PageHeader />
            <div className="space-y-2 text-[17px] leading-[1.6] text-slate-950 font-normal">
              <div>
                <p className="font-bold text-slate-950 mb-1 text-[18px]">6. COMMUNICATION</p>
                <p>
                  All communications relating to the services under this Agreement shall be made through the Company’s official communication channels, including email, telephone, WhatsApp or any other mode communicated by the Company.
                </p>
                <p className="mt-1">
                  The Client agrees to promptly share any communication received from lenders or their representatives relating to the loan accounts covered under this Agreement.
                </p>
              </div>

              <div>
                <p className="font-bold text-slate-950 mb-1 text-[18px]">7. CONSULTANCY FEES & PAYMENT TERMS</p>
                <p>
                  The Client agrees to pay the consultancy fees as mentioned in Annexure B & C of this Agreement.
                </p>
                <p className="mt-1">
                  The consultancy fee is payable for the professional services rendered by the Company and shall be paid on or before the agreed due date.
                </p>
                <p className="mt-1">
                  All payments shall be made only through the Company’s official bank account or authorised payment gateway. The Company shall not be responsible for payments made to any personal account or unauthorised person.
                </p>
                <p className="mt-1">
                  The consultancy fees paid are non-refundable once the services have commenced, except where otherwise agreed in writing by the Company.
                </p>
              </div>

              <div>
                <p className="font-bold text-slate-950 mb-1 text-[18px]">8. TENURE OF AGREEMENT</p>
                <p>
                  This Agreement shall remain valid for the period mentioned in Annexure B, unless terminated earlier in accordance with this Agreement.
                </p>
                <p className="mt-1">
                  Any extension or renewal shall be mutually agreed upon by both Parties.
                </p>
              </div>

              <div>
                <p className="font-bold text-slate-950 mb-1 text-[18px]">9. TERMINATION</p>
                <p>
                  Either Party may terminate this Agreement by giving written notice to the other Party.
                </p>
                <p className="mt-1">
                  The Client may discontinue the services by providing the Company with a minimum of fifteen (15) days’ prior written notice before the next scheduled consultancy fee due date. The Client shall remain liable to pay all consultancy fees due up to the effective date of termination, and no refund shall be payable for services already rendered.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ================= PAGE 7 ================= */}
        <div className="a4-page-card bg-white shadow-md rounded border border-gray-200 p-[8mm_15mm] min-h-[297mm] flex flex-col justify-between box-border">
          <div>
            <PageHeader />
            <div className="space-y-2 text-[17px] leading-[1.6] text-slate-950 font-normal">
              <p>The Company may suspend or terminate this Agreement if the Client:</p>
              <ul className="list-disc pl-5 space-y-2 mt-1">
                <li>Fails to pay the agreed consultancy fees within the stipulated time;</li>
                <li>Provides false, misleading or incomplete information; or</li>
                <li>Fails to cooperate or repeatedly breaches the terms of this Agreement.</li>
              </ul>
              <p className="mt-2">
                Upon termination, the Company shall not be liable to refund any consultancy fees already paid for consultancy services rendered up to the effective date of termination.
              </p>

              <div className="pt-1">
                <p className="font-bold text-slate-950 mb-0.5 text-[18px]">10. CONFIDENTIALITY</p>
                <p>
                  The Company shall maintain the confidentiality of all personal and financial information provided by the Client and shall use such information only for the purpose of providing consultancy services under this Agreement or where disclosure is required by applicable law.
                </p>
                <p className="mt-0.5">
                  The Client also agrees not to disclose any confidential documents, strategies, formats or proprietary material provided by the Company to any third party without prior written consent.
                </p>
              </div>

              <div className="pt-1">
                <p className="font-bold text-slate-950 mb-0.5 text-[18px]">11. LIMITATION OF LIABILITY</p>
                <p>
                  The Company shall provide its consultancy services with reasonable skill, care and professional diligence.
                </p>
                <p className="mt-0.5">
                  However, the Company shall not be liable for any decision, action or omission of any lender, financial institution, recovery agency or any third party.
                </p>
                <p className="mt-0.5">
                  Under no circumstances shall the Company’s total liability under this Agreement exceed the consultancy fees paid by the Client during the immediately preceding thirty (30) days.
                </p>
              </div>

              <div className="pt-1">
                <p className="font-bold text-slate-950 mb-0.5 text-[18px]">12. FORCE MAJEURE</p>
                <p>
                  Neither Party shall be held responsible for any delay or failure in performing its obligations under this Agreement due to circumstances beyond its reasonable control, including but not limited to natural disasters, government restrictions, war, strikes, epidemics, system failures or any other unforeseen event.
                </p>
                <p className="mt-0.5">
                  The affected Party shall notify the other Party as soon as reasonably possible.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ================= PAGE 8 ================= */}
        <div className="a4-page-card bg-white shadow-md rounded border border-gray-200 p-[8mm_15mm] min-h-[297mm] flex flex-col justify-between box-border">
          <div>
            <PageHeader />
            <div className="space-y-2 text-[17px] leading-[1.6] text-slate-950 font-normal">
              <div>
                <p className="font-bold text-slate-950 mb-1 text-[18px]">13. GRIEVANCE REDRESSAL & DISPUTE RESOLUTION</p>
                <p>
                  The Company is committed to providing prompt and professional assistance to its Clients. In the event of any grievance, concern or dispute relating to the services provided under this Agreement, the Client shall first communicate the matter to the Company by sending a written email to:
                </p>

                <div className="py-1">
                  <p className="font-bold text-slate-950 text-[17px]">Grievance & Escalation Email:</p>
                  <p className="text-emerald-700 font-bold text-[18px]">info@settlexpert.com</p>
                </div>

                <p>
                  The Company shall make reasonable efforts to review and resolve the grievance at the earliest. Both Parties agree to make sincere efforts to resolve any dispute amicably through the above grievance mechanism before initiating any legal proceedings.
                </p>

                <p>
                  Any matter arising out of or relating to this Agreement shall be subject to the exclusive jurisdiction of the competent courts at New Delhi, India.
                </p>
              </div>

              <div className="pt-0.5">
                <p className="font-bold text-slate-950 mb-0.5 text-[18px]">14. DECLARATION & ACCEPTANCE</p>
                <p>
                  The Client confirms that all information and documents provided to the Company are true and correct to the best of their knowledge.
                </p>
                <p className="mt-0.5">
                  The Client further confirms that they have carefully read and understood the terms and conditions of this Agreement and voluntarily agree to be bound by the same.
                </p>
                <p className="mt-0.5">
                  Both Parties acknowledge that this Agreement has been entered into willingly and without any force, coercion or undue influence.
                </p>
                <p className="mt-0.5">
                  This Agreement may be executed physically or electronically, including through digital signature, OTP verification or any other electronic method accepted by the Company, and such execution shall be deemed valid and legally binding.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-4">
                <div>
                  <p className="font-bold text-slate-950 uppercase text-[17px]">FIRST PARTY</p>
                  <p className="text-slate-900 text-[16px] mt-0.5 font-semibold">NAME: SettleXpert LLP</p>
                  <p className="text-slate-900 text-[16px] mt-0.5">Signature: _______________________</p>
                </div>
                <div>
                  <p className="font-bold text-slate-950 uppercase text-[17px]">SECOND PARTY</p>
                  <p className="text-slate-900 text-[16px] mt-0.5 font-semibold">NAME: {clientName}</p>
                  <p className="text-slate-900 text-[16px] mt-0.5">Signature: _______________________</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= DYNAMIC ANNEXURE A (PAGES FOR LENDERS & CLIENT INFO) ================= */}
        {lenderPages.map((lenderBatch, pageIndex) => (
          <div key={`annexure-a-page-${pageIndex}`} className="a4-page-card bg-white shadow-md rounded border border-gray-200 p-[8mm_15mm] min-h-[297mm] flex flex-col justify-between box-border">
            <div>
              <PageHeader />
              <div className="text-center mb-2.5">
                <h2 className="text-[19px] font-black text-slate-950 underline">
                  {pageIndex === 0
                    ? 'Annexure A - Client & Lender Information'
                    : `Annexure A - Lender Information (Continued - Page ${pageIndex + 1})`}
                </h2>
              </div>

              {/* First Page Only: Client Personal Info Table */}
              {pageIndex === 0 && (
                <div className="mb-2.5 overflow-hidden rounded border border-gray-300">
                  <table className="w-full text-[13.5px] text-left border-collapse">
                    <thead className="bg-[#3b8254] text-white">
                      <tr>
                        <th className="py-0.5 px-3 w-1/3 border-r border-emerald-600 font-bold">Items</th>
                        <th className="py-0.5 px-3 font-bold">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-slate-950">
                      <tr>
                        <td className="py-0.5 px-3 border-r border-gray-200 font-semibold">Name</td>
                        <td className="py-0.5 px-3 font-bold">{clientName}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 px-3 border-r border-gray-200 font-semibold">PAN Number</td>
                        <td className="py-0.5 px-3 font-mono font-bold">{pan}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 px-3 border-r border-gray-200 font-semibold">Date of Birth</td>
                        <td className="py-0.5 px-3 font-mono">{dob}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 px-3 border-r border-gray-200 font-semibold">Phone Number</td>
                        <td className="py-0.5 px-3 font-mono">{phone}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 px-3 border-r border-gray-200 font-semibold">Email</td>
                        <td className="py-0.5 px-3">{email}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 px-3 border-r border-gray-200 font-semibold">Start Date</td>
                        <td className="py-0.5 px-3 font-mono">{startDate}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Lenders List Table for this Batch */}
              <div className="overflow-hidden rounded border border-gray-300">
                <table className="w-full text-[13.5px] text-left border-collapse">
                  <thead className="bg-[#3b8254] text-white">
                    <tr>
                      <th className="py-0.5 px-3 border-r border-emerald-600 font-bold">Lender Name*</th>
                      <th className="py-0.5 px-3 border-r border-emerald-600 font-bold">Loan Type (PL/CC)</th>
                      <th className="py-0.5 px-3 font-bold text-right">Loan Amt (Balance)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-slate-950">
                    {lenderBatch.map((l: any, idx: number) => (
                      <tr key={idx}>
                        <td className="py-0.5 px-3 border-r border-gray-200 font-semibold">{l.bank_name}</td>
                        <td className="py-0.5 px-3 border-r border-gray-200">{l.loan_type || 'Personal loan'}</td>
                        <td className="py-0.5 px-3 font-mono text-right font-bold">{(parseFloat(l.balance) || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}

                    {/* Total Row appears only on the final Annexure A page */}
                    {pageIndex === lenderPages.length - 1 && (
                      <tr className="bg-gray-50 font-bold text-[14.5px]">
                        <td colSpan={2} className="py-1 px-3 border-r border-gray-200 text-center">Total</td>
                        <td className="py-1 px-3 font-mono text-right text-emerald-800 font-black">{totalLoanAmount.toLocaleString('en-IN')}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {pageIndex === lenderPages.length - 1 && (
                <p className="text-[12px] text-slate-600 mt-1 italic">
                  * Each lender has a unique process and resolution is at the discretion of the lenders
                </p>
              )}
            </div>
          </div>
        ))}

        {/* ================= DYNAMIC ANNEXURE B (PAGES FOR FEE SCHEDULE) ================= */}
        {schedulePages.map((scheduleBatch, pageIndex) => (
          <div key={`annexure-b-page-${pageIndex}`} className="a4-page-card bg-white shadow-md rounded border border-gray-200 p-[8mm_15mm] min-h-[297mm] flex flex-col justify-between box-border">
            <div>
              <PageHeader />
              <div className="text-center mb-2.5">
                <h2 className="text-[19px] font-black text-slate-950 underline">
                  {pageIndex === 0
                    ? 'Annexure B'
                    : `Annexure B - Consultancy Fee Schedule (Continued - Page ${pageIndex + 1})`}
                </h2>
              </div>

              {pageIndex === 0 && (
                <>
                  <div className="grid grid-cols-2 gap-y-1.5 text-[16px] text-slate-950 mb-2 leading-relaxed">
                    <div>
                      <strong>Client Name:</strong> <span className="ml-4 font-bold">{clientName}</span>
                    </div>
                    <div>
                      <strong>Prepared By:</strong> <span className="ml-4 font-bold">{preparedBy}</span>
                    </div>
                    <div>
                      <strong>Total Loan:</strong> <span className="ml-6 font-mono font-bold">Rs. {totalLoanAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <strong>Monthly Income:</strong> <span className="ml-3 font-mono font-bold">Rs. {monthlyIncome.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <strong>Agreement Duration:</strong> <span className="ml-2 font-bold">{agreementDuration}</span>
                    </div>
                    <div />
                    <div>
                      <strong>Consultancy Fees:</strong> <span className="ml-3 font-mono font-bold">Rs. {monthlyFee.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <strong>Resolution Duration:</strong> <span className="ml-3 font-bold">{agreementDuration}</span>
                    </div>
                  </div>

                  <div className="text-[12.5px] text-slate-600 space-y-0.5 my-1.5 leading-relaxed">
                    <p>*This is based on past precedents. Each case is unique and at the discretion of the lenders.</p>
                    <p>**To get faster resolutions, save as much as possible on monthly basis.</p>
                  </div>
                </>
              )}

              <div className="mt-2.5">
                <h3 className="text-[16.5px] font-bold text-slate-950 mb-1">Consultancy Fee Schedule</h3>
                <div className="overflow-hidden rounded border border-gray-300">
                  <table className="w-full text-[15.5px] text-center border-collapse">
                    <thead className="bg-gray-200 text-slate-950 font-bold">
                      <tr>
                        <th className="py-1.5 px-3 border-r border-gray-300 w-1/4">Month</th>
                        <th className="py-1.5 px-3 border-r border-gray-300 w-1/2">Consultancy Fees</th>
                        <th className="py-1.5 px-3 w-1/4">Due Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-slate-950">
                      {scheduleBatch.map((row: any) => (
                        <tr key={row.month}>
                          <td className="py-1.5 px-3 border-r border-gray-200 font-semibold">{row.month}</td>
                          <td className="py-1.5 px-3 border-r border-gray-200 font-mono font-bold">Rs. {row.fee.toLocaleString('en-IN')}</td>
                          <td className="py-1.5 px-3 font-mono">{row.dueDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* ================= FINAL PAGE: ANNEXURE C & ANNEXURE D ================= */}
        <div className="a4-page-card bg-white shadow-md rounded border border-gray-200 p-[8mm_15mm] min-h-[297mm] flex flex-col justify-between box-border">
          <div>
            <PageHeader />

            {/* Annexure C */}
            <div className="space-y-1.5 text-[16px] leading-[1.6] text-slate-950 mb-2.5">
              <div className="text-center mb-1">
                <h2 className="text-[18px] font-black text-slate-950 underline">
                  Annexure C - Confirmation of in-hand monthly income
                </h2>
              </div>

              <p>
                I, <strong>{clientName}</strong> expressly confirm that my monthly in hand income as of <strong>{startDate}</strong> is INR <strong>{monthlyIncome.toLocaleString('en-IN')} /-</strong> per month after deductions.
              </p>

              <p>
                I understand that resolution with lenders is a complex process and income is a significant factor. I understand that if I provide factually incorrect income, the same can make my case weaker.
              </p>

              <p>
                In case I have provided incorrect income information the First Party is entitled to:
              </p>
              <ul className="list-disc pl-5 space-y-0.5">
                <li>Seek past income proof in coming months based on attested bank statements.</li>
                <li>Modify the financial proposal suitably in case income is revised.</li>
              </ul>
            </div>

            {/* Annexure D */}
            <div className="space-y-1.5 text-[16px] leading-[1.6] text-slate-950 pt-2 border-t border-gray-200">
              <div className="text-center mb-1">
                <h2 className="text-[18px] font-black text-slate-950 underline">
                  Annexure D - Permission Letter to Communicate with Lenders and Collection Agencies
                </h2>
              </div>

              <p>
                I, <strong>{clientName}</strong> expressly authorize <strong>SettleXpert LLP (Company)</strong>, its agents and representatives to communicate and negotiate with lenders and their collection agencies and to settle the loan amounts on my behalf in discussions with my lenders.
              </p>

              <p>
                <strong>The Company is entitled to</strong>
              </p>
              <p>
                Obtain on my behalf, records, debt validations and support for the debts allegedly owed by me. Communicate and negotiate with banks, lenders, financial institutions, licensed collection agencies and all other related entities and individuals relating to my debts.
              </p>

              <div className="pt-2 space-y-1">
                <p><strong>Signature:</strong> _________________________</p>
                <p><strong>Date:</strong> {startDate}</p>
                <div className="flex justify-between pt-1 text-[15px]">
                  <div>
                    <strong>Place:</strong> {address}
                  </div>
                  <div>
                    <strong>Executed Date:</strong> {startDate}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-300 pt-1 text-center text-[11px] text-slate-500 font-sans print:block">
            <span>Email: info@settlexpert.com | Phone: +91 89292 23949 | Website: www.settlexpert.com</span>
          </div>
        </div>

      </div>
    </div>
  );
};
