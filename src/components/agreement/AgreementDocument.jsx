import React from 'react';
import AgreementHeader from './AgreementHeader';

/**
 * Agreement Document Renderer — ALL 11 PAGES
 * MASTER TYPOGRAPHY SPECIFICATIONS:
 * - Font Family: Montserrat (Montserrat Regular 400/500, Medium 500, SemiBold 600, Bold 700, ExtraBold 800)
 * - Line Height: 1.4 (1.35–1.45)
 * - Page Dimensions: Single A4 Portrait (210mm x 297mm)
 * - Usable Content Width: 176mm (17mm margins)
 * - Company: SettleXpert Financial Services Pvt. Ltd. (settlexperts.com)
 */
export default function AgreementDocument({ agreement, scale = 1, activePage = null }) {
  if (!agreement) return null;

  // Extract dynamic CRM data strictly from the actual client / agreement record
  const clientName = agreement.client_name || agreement.name || '—';
  const clientEmail = agreement.email || '—';
  const clientPhone = agreement.phone || '—';
  const clientDob = agreement.dob || agreement.date_of_birth || '—';
  const clientPan = agreement.pan || agreement.pan_number || '—';
  const clientAddress = agreement.client_address || agreement.address || agreement.client_city || agreement.city || '—';
  const executedDate = agreement.agreement_date || agreement.client_fees_date || agreement.executed_date || agreement.start_date || new Date().toISOString().split('T')[0];
  const preparedBy = agreement.assigned_consultant || agreement.prepared_by || agreement.created_by_name || 'Dhruv';

  // Fixed A4 Page style
  const pageStyle = {
    width: '210mm',
    height: '297mm',
    minHeight: '297mm',
    maxHeight: '297mm',
    background: '#ffffff',
    boxSizing: 'border-box',
    padding: '0 0 16mm 0',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Montserrat', sans-serif",
    boxShadow: '0 4px 15px rgba(0,0,0,0.18)',
    position: 'relative',
    overflow: 'hidden',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    color: '#111827',
    marginBottom: activePage === null ? '24px' : '0'
  };

  // 176mm centered text container (17mm left + 176mm + 17mm right = 210mm)
  const bodyStyle = {
    width: '176mm',
    maxWidth: '176mm',
    margin: '0 auto',
    fontSize: '17px',
    lineHeight: 1.52,
    fontWeight: 500,
    color: '#111827',
    fontFamily: "'Montserrat', sans-serif",
    letterSpacing: 'normal',
    boxSizing: 'border-box',
    paddingTop: '6px',
    overflowWrap: 'normal',
    wordBreak: 'normal',
    whiteSpace: 'normal',
    textAlign: 'left'
  };

  const pStyle = {
    margin: '0 0 12px 0',
    fontSize: '17px',
    lineHeight: 1.52,
    fontWeight: 500,
    fontFamily: "'Montserrat', sans-serif",
    letterSpacing: 'normal',
    overflowWrap: 'normal',
    wordBreak: 'normal',
    whiteSpace: 'normal'
  };

  // ================= PAGE 1 (LOCKED & UNTOUCHED) =================
  const renderPage1 = () => (
    <div id="a4-page-1" className="a4-page-sheet" style={pageStyle}>
      {/* Master Reference Header */}
      <AgreementHeader />

      {/* Page 1 Body Content */}
      <div style={bodyStyle}>
        {/* Main Heading: CONSULTANCY AGREEMENT (Centered) */}
        <div style={{
          fontSize: '20px',
          lineHeight: 1.4,
          fontWeight: 800,
          textAlign: 'center',
          textTransform: 'uppercase',
          margin: '22px 0 16px 0',
          letterSpacing: 'normal',
          color: '#000000',
          fontFamily: "'Montserrat', sans-serif"
        }}>
          CONSULTANCY AGREEMENT
        </div>

        {/* Opening Paragraph (Left Aligned) */}
        <p style={{ ...pStyle, textAlign: 'left', margin: '0 0 12px 0' }}>
          This Consultancy Agreement ("<strong style={{ fontWeight: 700, color: '#000000' }}>Agreement</strong>") is executed on <strong style={{ fontWeight: 700, color: '#000000' }}>{executedDate}</strong> between:
        </p>

        {/* First Party (Left Aligned) */}
        <p style={{ ...pStyle, textAlign: 'left', margin: '0 0 12px 0' }}>
          <strong style={{ fontWeight: 700, color: '#000000' }}>M/s. SettleXpert Financial Services Pvt. Ltd.</strong>, having its registered/operations office at <strong style={{ fontWeight: 700, color: '#000000' }}>CB-201, Naraina Vihar, Ring Road, New Delhi, Delhi, India</strong>, hereinafter referred to as the "<strong style={{ fontWeight: 700, color: '#000000' }}>First Party</strong>" or the "<strong style={{ fontWeight: 700, color: '#000000' }}>Company</strong>", which expression shall, unless repugnant to the context, include its successors, affiliates and permitted assigns.
        </p>

        {/* AND (Left Aligned) */}
        <p style={{ ...pStyle, textAlign: 'left', fontWeight: 700, margin: '10px 0 10px 0', color: '#000000' }}>
          AND
        </p>

        {/* Second Party / Client (Left Aligned) */}
        <p style={{ ...pStyle, textAlign: 'left', margin: '0 0 12px 0' }}>
          <strong style={{ fontWeight: 700, color: '#000000' }}>{clientName}</strong>, residing at <strong style={{ fontWeight: 700, color: '#000000' }}>{clientAddress}</strong>, Date of Birth: <strong style={{ fontWeight: 700, color: '#000000' }}>{clientDob}</strong>, Mobile No.: <strong style={{ fontWeight: 700, color: '#000000' }}>{clientPhone}</strong>, Email ID: <strong style={{ fontWeight: 700, color: '#000000' }}>{clientEmail}</strong>, hereinafter referred to as the "<strong style={{ fontWeight: 700, color: '#000000' }}>Second Party</strong>" or the "<strong style={{ fontWeight: 700, color: '#000000' }}>Client</strong>".
        </p>

        {/* Parties definition (Left Aligned) */}
        <p style={{ ...pStyle, textAlign: 'left', margin: '0 0 12px 0' }}>
          The Company and the Client are hereinafter collectively referred to as the "<strong style={{ fontWeight: 700, color: '#000000' }}>Parties</strong>" and individually as a "<strong style={{ fontWeight: 700, color: '#000000' }}>Party</strong>".
        </p>

        {/* WHEREAS 1 (Left Aligned) */}
        <p style={{ ...pStyle, textAlign: 'left', margin: '0 0 12px 0' }}>
          <strong style={{ fontWeight: 700, color: '#000000' }}>WHEREAS</strong>, the Company is engaged in providing financial consultancy and debt resolution advisory services to individuals experiencing financial hardship and requiring professional assistance in managing their unsecured debt obligations.
        </p>

        {/* WHEREAS 2 (Left Aligned) */}
        <p style={{ ...pStyle, textAlign: 'left', margin: '0 0 12px 0' }}>
          <strong style={{ fontWeight: 700, color: '#000000' }}>WHEREAS</strong>, the Client has represented that they are presently facing financial constraints and have voluntarily approached the Company seeking professional guidance and consultancy for resolving their outstanding unsecured loan and/or credit obligations.
        </p>

        {/* WHEREAS 3 (Left Aligned) */}
        <p style={{ ...pStyle, textAlign: 'left', margin: '0 0 12px 0' }}>
          <strong style={{ fontWeight: 700, color: '#000000' }}>WHEREAS</strong>, after discussions regarding the Client’s financial circumstances, the Parties have mutually agreed to enter into this Agreement to define the scope of consultancy services, rights, obligations and responsibilities of both Parties.
        </p>

        {/* NOW, THEREFORE (Left Aligned) */}
        <p style={{ ...pStyle, textAlign: 'left', margin: '0 0 12px 0' }}>
          <strong style={{ fontWeight: 700, color: '#000000' }}>NOW, THEREFORE</strong>, in consideration of the mutual promises and covenants contained herein, the Parties agree as follows:
        </p>

        {/* Centered Agreement Statement (Centered) */}
        <p style={{
          textAlign: 'center',
          fontWeight: 700,
          margin: '16px 0 14px 0',
          fontSize: '17px',
          letterSpacing: 'normal',
          lineHeight: 1.52,
          color: '#000000',
          fontFamily: "'Montserrat', sans-serif"
        }}>
          NOW THIS AGREEMENT WITNESSETH AS FOLLOWS:
        </p>

        {/* Section 1 Heading (Left Aligned) */}
        <div style={{
          fontSize: '17px',
          lineHeight: 1.45,
          fontWeight: 700,
          margin: '12px 0 6px 0',
          textAlign: 'left',
          color: '#000000',
          fontFamily: "'Montserrat', sans-serif"
        }}>
          1. PURPOSE OF THE AGREEMENT
        </div>
      </div>
    </div>
  );

  // ================= PAGE 2 (LOCKED & UNTOUCHED) =================
  const renderPage2 = () => (
    <div id="a4-page-2" className="a4-page-sheet" style={pageStyle}>
      {/* Master Reference Header (Same as Page 1) */}
      <AgreementHeader />

      {/* Page 2 Body Content */}
      <div style={{ ...bodyStyle, paddingTop: '10px' }}>
        {/* Section 1 Continuation Paragraphs */}
        <p style={pStyle}>
          The purpose of this Agreement is to appoint the Company as the Client’s financial consultancy partner for providing advisory, negotiation support and debt resolution consultancy in relation to the debt accounts specifically mentioned in Annexure A.
        </p>

        <p style={pStyle}>
          The Company shall provide consultancy services based upon the information, documents and financial details provided by the Client. The services under this Agreement are advisory in nature and are intended to assist the Client in communicating with lenders, understanding available options and working towards an amicable resolution of outstanding liabilities.
        </p>

        <p style={pStyle}>
          The Client acknowledges that the Company does not act as a lender, financial institution, recovery agency or guarantor and shall only provide consultancy and professional assistance within the scope of this Agreement.
        </p>

        {/* Section 2 Heading */}
        <div style={{
          fontSize: '17px',
          lineHeight: 1.52,
          fontWeight: 700,
          textAlign: 'left',
          margin: '14px 0 8px 0',
          color: '#0f172a',
          fontFamily: "'Montserrat', sans-serif"
        }}>
          2. SCOPE OF CONSULTANCY SERVICES
        </div>

        {/* Section 2 Introductory text */}
        <p style={pStyle}>
          Subject to the terms of this Agreement, the Company shall provide consultancy services including, but not limited to:
        </p>

        {/* Clause a */}
        <p style={pStyle}>
          <strong style={{ fontWeight: 700 }}>a.</strong> Reviewing and assessing the Client’s financial position and outstanding unsecured liabilities.
        </p>

        {/* Clause b */}
        <p style={pStyle}>
          <strong style={{ fontWeight: 700 }}>b.</strong> Advising the Client regarding possible debt resolution options based on the financial information shared by the Client.
        </p>

        {/* Clause c */}
        <p style={pStyle}>
          <strong style={{ fontWeight: 700 }}>c.</strong> Assisting the Client in preparing a practical financial strategy for addressing outstanding debts.
        </p>

        {/* Clause d */}
        <p style={pStyle}>
          <strong style={{ fontWeight: 700 }}>d.</strong> Communicating and negotiating with lenders or their authorised representatives, wherever authorised by the Client.
        </p>

        {/* Clause e */}
        <p style={pStyle}>
          <strong style={{ fontWeight: 700 }}>e.</strong> Providing guidance regarding applicable banking practices, borrower rights and available grievance redressal mechanisms.
        </p>

        {/* Clause f */}
        <p style={pStyle}>
          <strong style={{ fontWeight: 700 }}>f.</strong> Assisting the Client in drafting representations, replies, requests and other communications intended for lenders or authorised recovery agencies.
        </p>

        {/* Clause g */}
        <p style={pStyle}>
          <strong style={{ fontWeight: 700 }}>g.</strong> Providing reasonable guidance where the Client experiences recovery-related harassment or communication inconsistent with applicable regulatory guidelines.
        </p>
      </div>
    </div>
  );

  // ================= PAGE 3 (LOCKED & UNTOUCHED) =================
  const renderPage3 = () => {
    const pStyle3 = {
      margin: '0 0 12px 0',
      fontSize: '16.5px',
      lineHeight: 1.52,
      fontWeight: 500,
      fontFamily: "'Montserrat', sans-serif",
      overflowWrap: 'normal',
      wordBreak: 'normal',
      whiteSpace: 'normal'
    };

    return (
      <div id="a4-page-3" className="a4-page-sheet" style={pageStyle}>
        {/* Master Reference Header (Exact same as Page 1 & 2) */}
        <AgreementHeader />

        {/* Page 3 Body Content */}
        <div style={{ ...bodyStyle, fontSize: '16.5px', paddingTop: '10px' }}>
          {/* Clause h of Section 2 */}
          <p style={pStyle3}>
            <strong style={{ fontWeight: 700 }}>h.</strong> Keeping the Client informed regarding significant communications or settlement proposals received from lenders relating to the accounts covered under this Agreement.
          </p>

          {/* Annexure A limitation paragraph */}
          <p style={pStyle3}>
            The services provided under this Agreement shall be limited to the lenders specifically mentioned in Annexure A unless otherwise agreed in writing between the Parties.
          </p>

          {/* Section 3 Heading */}
          <div style={{
            fontSize: '16.5px',
            lineHeight: 1.52,
            fontWeight: 700,
            textAlign: 'left',
            margin: '14px 0 8px 0',
            color: '#0f172a',
            fontFamily: "'Montserrat', sans-serif"
          }}>
            3. OBLIGATIONS OF THE COMPANY
          </div>

          {/* Section 3 Intro */}
          <p style={pStyle3}>
            The Company shall make reasonable efforts to provide professional financial consultancy services throughout the tenure of this Agreement. The Company agrees to:
          </p>

          {/* Clause a */}
          <p style={pStyle3}>
            <strong style={{ fontWeight: 700 }}>a.</strong> Review the financial information and supporting documents provided by the Client to understand the nature of the outstanding unsecured liabilities.
          </p>

          {/* Clause b */}
          <p style={pStyle3}>
            <strong style={{ fontWeight: 700 }}>b.</strong> Provide professional guidance regarding debt resolution strategies based on the Client’s financial condition and the information made available by the Client.
          </p>

          {/* Clause c */}
          <p style={pStyle3}>
            <strong style={{ fontWeight: 700 }}>c.</strong> Assist the Client in communicating with lenders, financial institutions or their authorised representatives wherever such communication is required and duly authorised by the Client.
          </p>

          {/* Clause d */}
          <p style={pStyle3}>
            <strong style={{ fontWeight: 700 }}>d.</strong> Prepare and provide drafts of representations, replies, applications, complaints or other communications that may be required for interaction with lenders or other appropriate authorities.
          </p>

          {/* Clause e */}
          <p style={pStyle3}>
            <strong style={{ fontWeight: 700 }}>e.</strong> Guide the Client regarding applicable borrower rights, regulatory grievance mechanisms and lawful recovery practices issued by competent authorities from time to time.
          </p>

          {/* Clause f */}
          <p style={pStyle3}>
            <strong style={{ fontWeight: 700 }}>f.</strong> Where required, assist the Client in addressing instances of recovery-related harassment by suggesting appropriate complaint mechanisms before the concerned lender or regulatory authority.
          </p>

          {/* Clause g */}
          <p style={pStyle3}>
            <strong style={{ fontWeight: 700 }}>g.</strong> Keep the Client informed of any significant communication, proposal or settlement offer received from the lenders relating to the accounts covered under this Agreement.
          </p>

          {/* Clause h */}
          <p style={pStyle3}>
            <strong style={{ fontWeight: 700 }}>h.</strong> Maintain the confidentiality of the Client’s personal and financial information except where disclosure is necessary for providing the agreed consultancy services or where disclosure is required by law.
          </p>
        </div>
      </div>
    );
  };

  // ================= PAGE 4 (LOCKED & UNTOUCHED) =================
  const renderPage4 = () => {
    const pStyle4 = {
      margin: '0 0 12px 0',
      fontSize: '17px',
      lineHeight: 1.52,
      fontWeight: 500,
      fontFamily: "'Montserrat', sans-serif",
      overflowWrap: 'normal',
      wordBreak: 'normal',
      whiteSpace: 'normal'
    };

    return (
      <div id="a4-page-4" className="a4-page-sheet" style={pageStyle}>
        {/* Master Reference Header (Exact same as Page 1, 2, 3) */}
        <AgreementHeader />

        {/* Page 4 Body Content */}
        <div style={{ ...bodyStyle, fontSize: '17px', paddingTop: '10px' }}>
          {/* Clause i of Section 3 */}
          <p style={pStyle4}>
            <strong style={{ fontWeight: 700 }}>i.</strong> Exercise reasonable professional care while providing consultancy services. However, the Company shall not be responsible for any independent decision taken by the lender or any third party.
          </p>

          {/* Section 4 Heading */}
          <div style={{
            fontSize: '17px',
            lineHeight: 1.52,
            fontWeight: 700,
            textAlign: 'left',
            margin: '14px 0 8px 0',
            color: '#0f172a',
            fontFamily: "'Montserrat', sans-serif"
          }}>
            4. OBLIGATIONS OF THE CLIENT
          </div>

          {/* Section 4 Intro */}
          <p style={pStyle4}>
            The Client agrees and undertakes to:
          </p>

          {/* Clause a */}
          <p style={pStyle4}>
            <strong style={{ fontWeight: 700 }}>a.</strong> Provide complete, true and accurate information regarding income, liabilities, assets, outstanding loans and all other relevant financial details required for effective consultancy.
          </p>

          {/* Clause b */}
          <p style={pStyle4}>
            <strong style={{ fontWeight: 700 }}>b.</strong> Submit all documents and information reasonably requested by the Company for evaluation of the case and preparation of an appropriate debt resolution strategy.
          </p>

          {/* Clause c */}
          <p style={pStyle4}>
            <strong style={{ fontWeight: 700 }}>c.</strong> Promptly inform the Company of any communication received from lenders, recovery agencies, legal authorities or any other person relating to the accounts covered under this Agreement.
          </p>

          {/* Clause d */}
          <p style={pStyle4}>
            <strong style={{ fontWeight: 700 }}>d.</strong> Immediately notify the Company of any significant change in financial circumstances including employment, income, residence, contact details or any new borrowing undertaken during the term of this Agreement.
          </p>

          {/* Clause e */}
          <p style={pStyle4}>
            <strong style={{ fontWeight: 700 }}>e.</strong> Pay the consultancy fees strictly in accordance with the payment schedule agreed between the Parties. Delay or non-payment may result in suspension of consultancy services until outstanding dues are cleared.
          </p>

          {/* Clause f */}
          <p style={pStyle4}>
            <strong style={{ fontWeight: 700 }}>f.</strong> Cooperate with the Company and provide timely responses whenever information, documents or approvals are required for carrying out the consultancy services.
          </p>

          {/* Clause g */}
          <p style={pStyle4}>
            <strong style={{ fontWeight: 700 }}>g.</strong> Make all payments only through the Company’s official payment modes as communicated by the Company. The Company shall not be responsible for any payment made to any unauthorised individual, personal bank account or unofficial payment channel.
          </p>

          {/* Clause h */}
          <p style={pStyle4}>
            <strong style={{ fontWeight: 700 }}>h.</strong> Understand that the consultancy services under this Agreement are limited only to the loan accounts specifically mentioned in Annexure A unless otherwise agreed in writing.
          </p>
        </div>
      </div>
    );
  };

  // ================= PAGE 5 (LOCKED & UNTOUCHED) =================
  const renderPage5 = () => {
    const pStyle5 = {
      margin: '0 0 8px 0',
      fontSize: '18.4px',
      lineHeight: 1.38,
      fontWeight: 500,
      fontFamily: "'Montserrat', sans-serif",
      overflowWrap: 'normal',
      wordBreak: 'normal',
      whiteSpace: 'normal'
    };

    return (
      <div id="a4-page-5" className="a4-page-sheet" style={pageStyle}>
        {/* Master Reference Header (Exact same as Pages 1-4) */}
        <AgreementHeader />

        {/* Page 5 Body Content */}
        <div style={{ ...bodyStyle, fontSize: '18.4px', paddingTop: '10px' }}>
          {/* Clause i of Section 4 */}
          <p style={pStyle5}>
            <strong style={{ fontWeight: 700 }}>i.</strong> Refrain from providing false, misleading or incomplete information, as the quality of consultancy and negotiations depends upon the correctness of the information furnished by the Client.
          </p>

          {/* Section 5 Heading */}
          <div style={{
            fontSize: '18.4px',
            lineHeight: 1.38,
            fontWeight: 700,
            textAlign: 'left',
            margin: '12px 0 6px 0',
            color: '#0f172a',
            fontFamily: "'Montserrat', sans-serif"
          }}>
            5. CLIENT ACKNOWLEDGEMENTS
          </div>

          {/* Section 5 Intro */}
          <p style={pStyle5}>
            The Client expressly understands and agrees that:
          </p>

          {/* Clause a */}
          <p style={pStyle5}>
            <strong style={{ fontWeight: 700 }}>a.</strong> The Company is engaged in providing consultancy and advisory services only and does not guarantee settlement, waiver, reduction of liability or acceptance of any proposal by any lender.
          </p>

          {/* Clause b */}
          <p style={pStyle5}>
            <strong style={{ fontWeight: 700 }}>b.</strong> Every lender follows its own internal policies and procedures. Any settlement, restructuring or resolution proposal shall remain solely at the discretion of the concerned lender.
          </p>

          {/* Clause c */}
          <p style={pStyle5}>
            <strong style={{ fontWeight: 700 }}>c.</strong> The time required for resolution may vary depending upon the lender, the Client’s financial circumstances, regulatory requirements and various other factors beyond the Company’s control.
          </p>

          {/* Clause d */}
          <p style={pStyle5}>
            <strong style={{ fontWeight: 700 }}>d.</strong> The Company does not promise any specific settlement percentage, time period or outcome, and no verbal assurance shall be treated as a guarantee unless specifically recorded in writing by the Company.
          </p>

          {/* Clause e */}
          <p style={pStyle5}>
            <strong style={{ fontWeight: 700 }}>e.</strong> The Client understands that any debt resolution or settlement may have an impact on the Client’s credit profile or future borrowing eligibility, which is governed by applicable banking practices and credit information companies. The Company shall not be responsible for any such consequence.
          </p>

          {/* Clause f */}
          <p style={pStyle5}>
            <strong style={{ fontWeight: 700 }}>f.</strong> The Company shall not be liable for any action independently taken by any lender, recovery agency or third party that is beyond the reasonable control of the Company.
          </p>

          {/* Clause g */}
          <p style={pStyle5}>
            <strong style={{ fontWeight: 700 }}>g.</strong> Litigation before any court or tribunal, unless specifically agreed in writing, does not form part of the consultancy services under this Agreement. Any such assistance, if required, shall be mutually discussed separately.
          </p>

          {/* Clause h */}
          <p style={pStyle5}>
            <strong style={{ fontWeight: 700 }}>h.</strong> This Agreement represents the complete understanding between the Parties with respect to the consultancy services and supersedes all prior discussions, representations or understandings relating to the subject matter herein.
          </p>
        </div>
      </div>
    );
  };

  // ================= PAGE 6 (LOCKED & UNTOUCHED) =================
  const renderPage6 = () => {
    const pStyle6 = {
      margin: '0 0 12px 0',
      fontSize: '17px',
      lineHeight: 1.52,
      fontWeight: 500,
      fontFamily: "'Montserrat', sans-serif",
      overflowWrap: 'normal',
      wordBreak: 'normal',
      whiteSpace: 'normal'
    };

    return (
      <div id="a4-page-6" className="a4-page-sheet" style={pageStyle}>
        {/* Master Reference Header (Exact same as Pages 1-5) */}
        <AgreementHeader />

        {/* Page 6 Body Content */}
        <div style={{ ...bodyStyle, fontSize: '17px', paddingTop: '10px' }}>
          {/* Section 6 Heading */}
          <div style={{
            fontSize: '17px',
            lineHeight: 1.52,
            fontWeight: 700,
            textAlign: 'left',
            margin: '12px 0 8px 0',
            color: '#0f172a',
            fontFamily: "'Montserrat', sans-serif"
          }}>
            6. COMMUNICATION
          </div>

          <p style={pStyle6}>
            All communications relating to the services under this Agreement shall be made through the Company’s official communication channels, including email, telephone, WhatsApp or any other mode communicated by the Company.
          </p>

          <p style={pStyle6}>
            The Client agrees to promptly share any communication received from lenders or their representatives relating to the loan accounts covered under this Agreement.
          </p>

          {/* Section 7 Heading */}
          <div style={{
            fontSize: '17px',
            lineHeight: 1.52,
            fontWeight: 700,
            textAlign: 'left',
            margin: '14px 0 8px 0',
            color: '#0f172a',
            fontFamily: "'Montserrat', sans-serif"
          }}>
            7. CONSULTANCY FEES & PAYMENT TERMS
          </div>

          <p style={pStyle6}>
            The Client agrees to pay the consultancy fees as mentioned in Annexure B & C of this Agreement.
          </p>

          <p style={pStyle6}>
            The consultancy fee is payable for the professional services rendered by the Company and shall be paid on or before the agreed due date.
          </p>

          <p style={pStyle6}>
            All payments shall be made only through the Company's official bank account or authorised payment gateway. The Company shall not be responsible for payments made to any personal account or unauthorised person.
          </p>

          <p style={pStyle6}>
            The consultancy fees paid are non-refundable once the services have commenced, except where otherwise agreed in writing by the Company.
          </p>

          {/* Section 8 Heading */}
          <div style={{
            fontSize: '17px',
            lineHeight: 1.52,
            fontWeight: 700,
            textAlign: 'left',
            margin: '14px 0 8px 0',
            color: '#0f172a',
            fontFamily: "'Montserrat', sans-serif"
          }}>
            8. TENURE OF AGREEMENT
          </div>

          <p style={pStyle6}>
            This Agreement shall remain valid for the period mentioned in Annexure B, unless terminated earlier in accordance with this Agreement.
          </p>

          <p style={pStyle6}>
            Any extension or renewal shall be mutually agreed upon by both Parties.
          </p>

          {/* Section 9 Heading */}
          <div style={{
            fontSize: '17px',
            lineHeight: 1.52,
            fontWeight: 700,
            textAlign: 'left',
            margin: '14px 0 8px 0',
            color: '#0f172a',
            fontFamily: "'Montserrat', sans-serif"
          }}>
            9. TERMINATION
          </div>

          <p style={pStyle6}>
            Either Party may terminate this Agreement by giving written notice to the other Party.
          </p>

          <p style={pStyle6}>
            The Client may discontinue the services by providing the Company with a minimum of fifteen (15) days’ prior written notice before the next scheduled consultancy fee due date. The Client shall remain liable to pay all consultancy fees due up to the effective date of termination, and no refund shall be payable for services already rendered.
          </p>
        </div>
      </div>
    );
  };

  // ================= PAGE 7 (LOCKED & UNTOUCHED) =================
  const renderPage7 = () => {
    const pStyle7 = {
      margin: '0 0 8px 0',
      fontSize: '17px',
      lineHeight: 1.38,
      fontWeight: 500,
      fontFamily: "'Montserrat', sans-serif",
      overflowWrap: 'normal',
      wordBreak: 'normal',
      whiteSpace: 'normal'
    };

    return (
      <div id="a4-page-7" className="a4-page-sheet" style={pageStyle}>
        {/* Master Reference Header (Exact same as Pages 1-6) */}
        <AgreementHeader />

        {/* Page 7 Body Content */}
        <div style={{ ...bodyStyle, fontSize: '17px', paddingTop: '10px' }}>
          {/* Termination continuation */}
          <p style={pStyle7}>
            The Company may suspend or terminate this Agreement if the Client:
          </p>

          <p style={{ ...pStyle7, paddingLeft: '8px' }}>
            Fails to pay the agreed consultancy fees within the stipulated time;<br />
            Provides false, misleading or incomplete information; or<br />
            Fails to cooperate or repeatedly breaches the terms of this Agreement.
          </p>

          <p style={pStyle7}>
            Upon termination, the Company shall not be liable to refund any consultancy fees already paid for consultancy services rendered up to the effective date of termination.
          </p>

          {/* Section 10 Heading */}
          <div style={{
            fontSize: '17px',
            lineHeight: 1.38,
            fontWeight: 700,
            textAlign: 'left',
            margin: '12px 0 6px 0',
            color: '#0f172a',
            fontFamily: "'Montserrat', sans-serif"
          }}>
            10. CONFIDENTIALITY
          </div>

          <p style={pStyle7}>
            The Company shall maintain the confidentiality of all personal and financial information provided by the Client and shall use such information only for the purpose of providing consultancy services under this Agreement or where disclosure is required by applicable law.
          </p>

          <p style={pStyle7}>
            The Client also agrees not to disclose any confidential documents, strategies, formats or proprietary material provided by the Company to any third party without prior written consent.
          </p>

          {/* Section 11 Heading */}
          <div style={{
            fontSize: '17px',
            lineHeight: 1.38,
            fontWeight: 700,
            textAlign: 'left',
            margin: '12px 0 6px 0',
            color: '#0f172a',
            fontFamily: "'Montserrat', sans-serif"
          }}>
            11. LIMITATION OF LIABILITY
          </div>

          <p style={pStyle7}>
            The Company shall provide its consultancy services with reasonable skill, care and professional diligence.
          </p>

          <p style={pStyle7}>
            However, the Company shall not be liable for any decision, action or omission of any lender, financial institution, recovery agency or any third party.
          </p>

          <p style={pStyle7}>
            Under no circumstances shall the Company’s total liability under this Agreement exceed the consultancy fees paid by the Client during the immediately preceding thirty (30) days.
          </p>

          {/* Section 12 Heading */}
          <div style={{
            fontSize: '17px',
            lineHeight: 1.38,
            fontWeight: 700,
            textAlign: 'left',
            margin: '12px 0 6px 0',
            color: '#0f172a',
            fontFamily: "'Montserrat', sans-serif"
          }}>
            12. FORCE MAJEURE
          </div>

          <p style={pStyle7}>
            Neither Party shall be held responsible for any delay or failure in performing its obligations under this Agreement due to circumstances beyond its reasonable control, including but not limited to natural disasters, government restrictions, war, strikes, epidemics, system failures or any other unforeseen event.
          </p>

          <p style={pStyle7}>
            The affected Party shall notify the other Party as soon as reasonably possible.
          </p>

          {/* Section 13 Heading */}
          <div style={{
            fontSize: '17px',
            lineHeight: 1.38,
            fontWeight: 700,
            textAlign: 'left',
            margin: '12px 0 6px 0',
            color: '#0f172a',
            fontFamily: "'Montserrat', sans-serif"
          }}>
            13. GRIEVANCE REDRESSAL & DISPUTE RESOLUTION
          </div>

          <p style={pStyle7}>
            The Company is committed to providing prompt and professional assistance to its Clients.
          </p>
        </div>
      </div>
    );
  };

  // ================= PAGE 8 (LOCKED & UNTOUCHED) =================
  const renderPage8 = () => {
    const pStyle8 = {
      margin: '0 0 8px 0',
      fontSize: '17px',
      lineHeight: 1.38,
      fontWeight: 500,
      fontFamily: "'Montserrat', sans-serif",
      overflowWrap: 'normal',
      wordBreak: 'normal',
      whiteSpace: 'normal'
    };

    return (
      <div id="a4-page-8" className="a4-page-sheet" style={pageStyle}>
        {/* Master Reference Header (Exact same as Pages 1-7) */}
        <AgreementHeader />

        {/* Page 8 Body Content */}
        <div style={{ ...bodyStyle, fontSize: '17px', paddingTop: '10px' }}>
          {/* Section 13 Continuation */}
          <p style={pStyle8}>
            In the event of any grievance, concern or dispute relating to the services provided under this Agreement, the Client shall first communicate the matter to the Company by sending a written email to:
          </p>

          <div style={{ margin: '6px 0 8px 0' }}>
            <p style={{ ...pStyle8, margin: '0 0 2px 0' }}>
              <strong style={{ fontWeight: 700 }}>Grievance & Escalation Email:</strong>
            </p>
            <p style={{ ...pStyle8, margin: '0 0 6px 0', color: '#2563eb', fontWeight: 700 }}>
              SettleXperts@gmail.com
            </p>
          </div>

          <p style={pStyle8}>
            The Company shall make reasonable efforts to review and resolve the grievance at the earliest.
          </p>

          <p style={pStyle8}>
            Both Parties agree to make sincere efforts to resolve any dispute amicably through the above grievance mechanism before initiating any legal proceedings.
          </p>

          <p style={pStyle8}>
            Any matter arising out of or relating to this Agreement shall be subject to the exclusive jurisdiction of the competent courts at New Delhi, India.
          </p>

          {/* Section 14 Heading */}
          <div style={{
            fontSize: '17px',
            lineHeight: 1.38,
            fontWeight: 700,
            textAlign: 'left',
            margin: '12px 0 6px 0',
            color: '#0f172a',
            fontFamily: "'Montserrat', sans-serif"
          }}>
            14. DECLARATION & ACCEPTANCE
          </div>

          <p style={pStyle8}>
            The Client confirms that all information and documents provided to the Company are true and correct to the best of their knowledge.
          </p>

          <p style={pStyle8}>
            The Client further confirms that they have carefully read and understood the terms and conditions of this Agreement and voluntarily agree to be bound by the same.
          </p>

          <p style={pStyle8}>
            Both Parties acknowledge that this Agreement has been entered into willingly and without any force, coercion or undue influence.
          </p>

          <p style={pStyle8}>
            This Agreement may be executed physically or electronically, including through digital signature, OTP verification or any other electronic method accepted by the Company, and such execution shall be deemed valid and legally binding.
          </p>

          {/* Signatures Section */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
            marginTop: '18px',
            paddingTop: '12px',
            borderTop: '1px dashed #cbd5e1'
          }}>
            {/* First Party Box */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              padding: '12px',
              fontSize: '12px',
              fontFamily: "'Montserrat', sans-serif"
            }}>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px', fontSize: '13.5px' }}>
                FIRST PARTY
              </div>
              <div style={{ color: '#334155', fontSize: '12px', marginBottom: '18px' }}>
                <strong style={{ fontWeight: 700 }}>NAME:</strong> SettleXpert Financial Services Pvt. Ltd.
              </div>
              <div style={{ borderBottom: '1px solid #94a3b8', width: '80%', marginBottom: '4px' }}></div>
              <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 500 }}>
                Authorised Signatory
              </div>
            </div>

            {/* Second Party Box */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              padding: '12px',
              fontSize: '12px',
              fontFamily: "'Montserrat', sans-serif"
            }}>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px', fontSize: '13.5px' }}>
                SECOND PARTY
              </div>
              <div style={{ color: '#334155', fontSize: '12px', marginBottom: '18px' }}>
                <strong style={{ fontWeight: 700 }}>NAME:</strong> {clientName}
              </div>
              <div style={{ borderBottom: '1px solid #94a3b8', width: '80%', marginBottom: '4px' }}></div>
              <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 500 }}>
                Client Signature
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ================= PAGE 9+ (ANNEXURE A — DYNAMIC MULTI-PAGE CHUNKING) =================
  const clientItems = [
    { item: 'Name', detail: clientName },
    { item: 'PAN Number', detail: clientPan },
    { item: 'Date of Birth', detail: clientDob },
    { item: 'Phone Number', detail: clientPhone },
    { item: 'Email', detail: clientEmail },
    { item: 'Start Date', detail: executedDate }
  ];

  // Dynamic Lenders calculation with strict 1-to-1 individual row normalization
  let rawLenders = agreement.lenders;
  if (typeof rawLenders === 'string') {
    try {
      rawLenders = JSON.parse(rawLenders);
    } catch (e) {
      rawLenders = null;
    }
  }

  let parsedLenders = [];

  if (Array.isArray(rawLenders) && rawLenders.length > 0) {
    rawLenders.forEach(item => {
      const lenderNameStr = String(item.lenderName || item.name || item.lender_name || '').trim();
      const loanTypeStr = String(item.loanType || item.type || item.loan_type || 'Personal Loan').trim();
      const loanAmtStr = String(item.loanAmount !== undefined ? item.loanAmount : (item.amount !== undefined ? item.amount : (item.loan_amount || item.outstanding_amount || ''))).trim();
      const rawAccountStr = String(item.account_number || item.formatted || '').trim();

      if (lenderNameStr.includes(',') || lenderNameStr.includes('\n')) {
        const delimiter = lenderNameStr.includes(',') ? ',' : '\n';
        const names = lenderNameStr.split(delimiter).map(s => s.trim()).filter(Boolean);
        const types = loanTypeStr.split(delimiter).map(s => s.trim());
        const amounts = loanAmtStr.split(delimiter).map(s => s.trim());

        names.forEach((n, i) => {
          const amtVal = amounts[i] || '';
          let singleAmt = 0;
          let formattedAmt = '';
          if (amtVal.includes('×') || amtVal.includes('*')) {
            formattedAmt = amtVal.startsWith('₹') ? amtVal : `₹${amtVal}`;
            const parts = amtVal.replace(/[₹,]/g, '').split(/[×*]/).map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
            singleAmt = parts.length === 2 ? parts[0] * parts[1] : (parseFloat(amtVal.replace(/[^\d.]/g, '')) || 0);
          } else {
            singleAmt = parseFloat(String(amtVal).replace(/[^\d.]/g, '')) || 0;
            formattedAmt = singleAmt > 0 ? `₹ ${singleAmt.toLocaleString('en-IN')}` : (amtVal ? `₹ ${amtVal}` : '—');
          }
          parsedLenders.push({
            name: n,
            type: types[i] || types[0] || 'Personal Loan',
            rawAmount: singleAmt,
            amount: formattedAmt
          });
        });
      } else if (lenderNameStr) {
        let singleAmt = 0;
        let formattedAmt = '';
        const checkStr = rawAccountStr && (rawAccountStr.includes('×') || rawAccountStr.includes('*')) ? rawAccountStr : loanAmtStr;

        if (checkStr.includes('×') || checkStr.includes('*')) {
          formattedAmt = checkStr.startsWith('₹') ? checkStr : `₹${checkStr}`;
          const parts = checkStr.replace(/[₹,]/g, '').split(/[×*]/).map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
          singleAmt = parts.length === 2 ? parts[0] * parts[1] : (parseFloat(checkStr.replace(/[^\d.]/g, '')) || 0);
        } else {
          singleAmt = parseFloat(loanAmtStr.replace(/[^\d.]/g, '')) || 0;
          formattedAmt = singleAmt > 0 ? `₹ ${singleAmt.toLocaleString('en-IN')}` : (loanAmtStr ? `₹ ${loanAmtStr}` : '—');
        }

        parsedLenders.push({
          name: lenderNameStr,
          type: loanTypeStr || 'Personal Loan',
          rawAmount: singleAmt,
          amount: formattedAmt
        });
      }
    });
  }

  if (parsedLenders.length === 0 && agreement.lender) {
    const lenderStr = String(agreement.lender).trim();
    const typeStr = String(agreement.loan_type || 'Personal Loan').trim();
    const amountStr = String(agreement.loan_amount || '').trim();
    const detailsStr = String(agreement.loan_account_number || '').trim();

    if (lenderStr.includes(',') || lenderStr.includes('\n')) {
      const delimiter = lenderStr.includes(',') ? ',' : '\n';
      const names = lenderStr.split(delimiter).map(s => s.trim()).filter(Boolean);
      const types = typeStr.split(delimiter).map(s => s.trim());
      const details = detailsStr.split(delimiter).map(s => s.trim());

      names.forEach((n, i) => {
        let singleAmt = 0;
        let formattedAmt = '';
        if (details[i]) {
          const detailItem = String(details[i]).trim();
          const colonIdx = detailItem.indexOf(':');
          const valPart = colonIdx !== -1 ? detailItem.substring(colonIdx + 1).trim() : detailItem.trim();
          if (valPart.includes('×') || valPart.includes('*')) {
            formattedAmt = valPart.startsWith('₹') ? valPart : `₹${valPart}`;
            const parts = valPart.replace(/[₹,]/g, '').split(/[×*]/).map(s => parseFloat(s.trim())).filter(num => !isNaN(num));
            singleAmt = parts.length === 2 ? parts[0] * parts[1] : (parseFloat(valPart.replace(/[^\d.]/g, '')) || 0);
          } else {
            singleAmt = parseFloat(valPart.replace(/[^\d.]/g, '')) || 0;
            formattedAmt = singleAmt > 0 ? `₹ ${singleAmt.toLocaleString('en-IN')}` : (valPart ? `₹ ${valPart}` : '—');
          }
        }
        parsedLenders.push({
          name: n,
          type: types[i] || types[0] || 'Personal Loan',
          rawAmount: singleAmt,
          amount: formattedAmt || '—'
        });
      });
    } else {
      const singleAmt = parseFloat(amountStr.replace(/[^\d.]/g, '')) || 0;
      parsedLenders.push({
        name: lenderStr,
        type: typeStr || 'Personal Loan',
        rawAmount: singleAmt,
        amount: singleAmt > 0 ? `₹ ${singleAmt.toLocaleString('en-IN')}` : '—'
      });
    }
  }

  if (parsedLenders.length === 0) {
    parsedLenders = [{
      name: 'Standard / Bank',
      type: 'Personal Loan',
      rawAmount: 0,
      amount: '—'
    }];
  }

  const calculatedTotalLoan = parsedLenders.reduce((sum, l) => sum + (l.rawAmount || 0), 0);
  const displayTotalLoan = calculatedTotalLoan > 0
    ? `₹ ${calculatedTotalLoan.toLocaleString('en-IN')}`
    : (agreement.loan_amount ? `₹ ${parseFloat(String(agreement.loan_amount).replace(/[^\d.]/g, '') || 0).toLocaleString('en-IN')}` : '—');

  const thStyle = {
    background: '#008037',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '12px',
    padding: '7px 12px',
    textAlign: 'left',
    border: '1px solid #000000',
    fontFamily: "'Montserrat', sans-serif"
  };

  const tdStyle = {
    padding: '6px 12px',
    fontSize: '12.5px',
    color: '#111827',
    fontWeight: 500,
    border: '1px solid #000000',
    fontFamily: "'Montserrat', sans-serif"
  };

  const renderPage9 = () => {
    return (
      <div id="a4-page-9" key="a4-page-9" className="a4-page-sheet annexure-a-sheet" style={{
        ...pageStyle,
        height: 'auto',
        maxHeight: 'none',
        overflow: 'visible',
        pageBreakAfter: 'always',
        breakAfter: 'page'
      }}>
        <AgreementHeader />
        <div style={{ ...bodyStyle, paddingTop: '18px' }}>
          <div style={{
            fontSize: '17px',
            lineHeight: 1.52,
            fontWeight: 700,
            textAlign: 'center',
            textDecoration: 'underline',
            marginBottom: '20px',
            color: '#0f172a',
            fontFamily: "'Montserrat', sans-serif"
          }}>
            Annexure A - Client & Lender Information
          </div>

          {/* Client Information Table */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '22px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <table style={{
              width: '320px',
              borderCollapse: 'collapse',
              border: '1px solid #000000',
              background: '#ffffff'
            }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: '45%' }}>Items</th>
                  <th style={{ ...thStyle, width: '55%' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {clientItems.map((row, idx) => (
                  <tr key={idx} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                    <td style={{ ...tdStyle, fontWeight: 700 }}>{row.item}</td>
                    <td style={tdStyle}>{row.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Lender Details Table (Continuous - full space utilization without artificial row slicing) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ width: '480px', maxWidth: '100%' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: '1px solid #000000',
                background: '#ffffff',
                pageBreakInside: 'auto',
                breakInside: 'auto'
              }}>
                <thead style={{ display: 'table-header-group' }}>
                  <tr style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                    <th style={{ ...thStyle, width: '40%' }}>Lender Name*</th>
                    <th style={{ ...thStyle, width: '32%' }}>Loan Type (PL/CC)</th>
                    <th style={{ ...thStyle, width: '28%', textAlign: 'right' }}>Loan Amt (Balance)</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedLenders.map((lender, idx) => (
                    <tr key={idx} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                      <td style={tdStyle}>{lender.name}</td>
                      <td style={tdStyle}>{lender.type}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>{lender.amount}</td>
                    </tr>
                  ))}
                  <tr style={{ background: '#f8fafc', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                    <td style={{ ...tdStyle, fontWeight: 700 }}>Total</td>
                    <td style={tdStyle}></td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap' }}>{displayTotalLoan}</td>
                  </tr>
                </tbody>
              </table>

              <div style={{
                fontSize: '11px',
                fontWeight: 500,
                color: '#475569',
                marginTop: '8px',
                textAlign: 'left',
                fontFamily: "'Montserrat', sans-serif",
                lineHeight: 1.52,
                pageBreakInside: 'avoid',
                breakInside: 'avoid'
              }}>
                * Each lender has a unique process and resolution is at the discretion of the lenders
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ================= PAGE 10 (ANNEXURE B) =================
  const renderPage10 = () => {
    const monthlyFee = parseFloat(String(agreement.consultancy_fee || agreement.service_fee || agreement.consultancyFees || 0).replace(/[^\d.]/g, '')) || 0;
    const displayMonthlyFee = monthlyFee > 0 ? `Rs. ${monthlyFee.toLocaleString('en-IN')}` : 'Rs. 8,000';
    const displayDuration = agreement.agreement_duration || agreement.duration || '6 Months';
    const displayResolution = agreement.resolution_duration || '6 Months';

    const durationNum = parseInt(displayDuration) || 6;
    const totalConsultancyFee = (monthlyFee > 0 ? monthlyFee : 8000) * durationNum;
    const displayTotalFee = `Rs. ${totalConsultancyFee.toLocaleString('en-IN')}`;

    let totalLoanVal = 0;
    if (agreement.lenders && Array.isArray(agreement.lenders) && agreement.lenders.length > 0) {
      totalLoanVal = agreement.lenders.reduce((sum, l) => sum + (parseFloat(String(l.loanAmount || l.amount || 0).replace(/[^\d.]/g, '')) || 0), 0);
    } else if (agreement.loan_amount) {
      totalLoanVal = parseFloat(String(agreement.loan_amount).replace(/[^\d.]/g, '')) || 0;
    }
    const displayTotalLoan = totalLoanVal > 0 ? `Rs. ${totalLoanVal.toLocaleString('en-IN')}` : '—';

    const startDateObj = new Date(executedDate && !isNaN(new Date(executedDate).getTime()) ? executedDate : new Date());
    const feeSchedule = Array.from({ length: durationNum }, (_, i) => {
      const d = new Date(startDateObj);
      d.setMonth(d.getMonth() + i);
      return {
        month: String(i + 1),
        fee: displayMonthlyFee,
        due: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      };
    });

    const thFeeStyle = {
    background: '#94a3b8',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '12px',
    padding: '7px 14px',
    textAlign: 'center',
    border: '1px solid #000000',
    fontFamily: "'Montserrat', sans-serif"
  };

    const tdFeeStyle = {
      padding: '6px 14px',
      fontSize: '12px',
      color: '#111827',
      fontWeight: 500,
      textAlign: 'center',
      border: '1px solid #000000',
      fontFamily: "'Montserrat', sans-serif"
    };

    return (
      <div id="a4-page-10" key="a4-page-10" className="a4-page-sheet" style={pageStyle}>
        <AgreementHeader />
        <div style={{ ...bodyStyle, paddingTop: '18px' }}>
          <div style={{
            fontSize: '17px',
            lineHeight: 1.52,
            fontWeight: 700,
            textAlign: 'center',
            textDecoration: 'underline',
            marginBottom: '20px',
            color: '#0f172a',
            fontFamily: "'Montserrat', sans-serif"
          }}>
            Annexure B
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.8fr',
            columnGap: '20px',
            rowGap: '6px',
            fontSize: '16px',
            lineHeight: 1.52,
            fontFamily: "'Montserrat', sans-serif",
            color: '#111827',
            marginBottom: '16px'
          }}>
            <div>
              <strong style={{ fontWeight: 700 }}>Client Name:</strong> <span style={{ fontWeight: 500 }}>{clientName}</span>
            </div>
            <div>
              <strong style={{ fontWeight: 700 }}>Prepared By:</strong> <span style={{ fontWeight: 500 }}>{preparedBy}</span>
            </div>

            <div>
              <strong style={{ fontWeight: 700 }}>Total Loan:</strong> <span style={{ fontWeight: 500 }}>{displayTotalLoan}</span>
            </div>
            <div></div>

            <div>
              <strong style={{ fontWeight: 700 }}>Agreement Duration:</strong> <span style={{ fontWeight: 500 }}>{displayDuration}</span>
            </div>
            <div></div>

            <div>
              <strong style={{ fontWeight: 700 }}>Consultancy Fees:</strong> <span style={{ fontWeight: 500 }}>{displayMonthlyFee} / Month (Total: {displayTotalFee})</span>
            </div>
            <div></div>

            <div>
              <strong style={{ fontWeight: 700 }}>Resolution Duration:</strong> <span style={{ fontWeight: 500 }}>{displayResolution}</span>
            </div>
            <div></div>
          </div>

          <div style={{
            fontSize: '12px',
            lineHeight: 1.52,
            color: '#334155',
            fontFamily: "'Montserrat', sans-serif",
            marginBottom: '20px'
          }}>
            <p style={{ margin: '0 0 4px 0', fontWeight: 500 }}>
              *This is based on past precedents. Each case is unique and at the discretion of the lenders.
            </p>
            <p style={{ margin: '0', fontWeight: 500 }}>
              **To get faster resolutions, save as much as possible on monthly basis.
            </p>
          </div>

          <div style={{
            fontSize: '17px',
            fontWeight: 700,
            color: '#0f172a',
            textAlign: 'left',
            marginBottom: '10px',
            fontFamily: "'Montserrat', sans-serif"
          }}>
            Consultancy Fee Schedule
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <table style={{
              width: '450px',
              maxWidth: '100%',
              borderCollapse: 'collapse',
              border: '1px solid #000000',
              background: '#ffffff'
            }}>
              <thead>
                <tr>
                  <th style={{ ...thFeeStyle, width: '22%' }}>Month</th>
                  <th style={{ ...thFeeStyle, width: '40%' }}>Consultancy Fees</th>
                  <th style={{ ...thFeeStyle, width: '38%' }}>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {feeSchedule.map((row, idx) => (
                  <tr key={idx}>
                    <td style={tdFeeStyle}>{row.month}</td>
                    <td style={tdFeeStyle}>{row.fee}</td>
                    <td style={tdFeeStyle}>{row.due}</td>
                  </tr>
                ))}
                <tr style={{ background: '#f8fafc' }}>
                  <td style={{ ...tdFeeStyle, fontWeight: 700 }}>Total</td>
                  <td style={{ ...tdFeeStyle, fontWeight: 700 }}>{displayTotalFee}</td>
                  <td style={{ ...tdFeeStyle, fontWeight: 500, color: '#64748b' }}>—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ================= PAGE 11 (ANNEXURE C & D — FINAL PAGE) =================
  const renderPage11 = () => {
    const pStyle11 = {
      margin: '0 0 7px 0',
      fontSize: '15.5px',
      lineHeight: 1.38,
      fontWeight: 500,
      fontFamily: "'Montserrat', sans-serif",
      overflowWrap: 'normal',
      wordBreak: 'normal',
      whiteSpace: 'normal',
      color: '#111827'
    };

    return (
      <div id="a4-page-11" key="a4-page-11" className="a4-page-sheet" style={{ ...pageStyle, padding: '0 0 8mm 0', justifyContent: 'space-between' }}>
        <div>
          <AgreementHeader />
          <div style={{ ...bodyStyle, fontSize: '15.5px', paddingTop: '10px' }}>
            <div style={{
              fontSize: '17px',
              lineHeight: 1.35,
              fontWeight: 700,
              textAlign: 'center',
              textDecoration: 'underline',
              margin: '6px 0 10px 0',
              color: '#0f172a',
              fontFamily: "'Montserrat', sans-serif"
            }}>
              Annexure C - Confirmation of in-hand monthly income
            </div>

            <p style={pStyle11}>
              I, <strong style={{ fontWeight: 700 }}>{clientName}</strong> expressly confirm that my monthly in hand income as of <strong style={{ fontWeight: 700 }}>{executedDate}</strong> is INR &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/- per month after deductions.
            </p>

            <p style={pStyle11}>
              I understand that resolution with lenders is a complex process and income is a significant factor. I understand that if I provide factually incorrect income, the same can make my case weaker.
            </p>

            <p style={{ ...pStyle11, margin: '0 0 4px 0' }}>
              In case I have provided incorrect income information the First Party is entitled to:
            </p>

            <p style={{ ...pStyle11, margin: '0 0 2px 0', paddingLeft: '12px' }}>
              • Seek past income proof in coming months based on attested bank statements.
            </p>
            <p style={{ ...pStyle11, margin: '0 0 12px 0', paddingLeft: '12px' }}>
              • Modify the financial proposal suitably in case income is revised.
            </p>

            <div style={{
              fontSize: '17px',
              lineHeight: 1.35,
              fontWeight: 700,
              textAlign: 'center',
              textDecoration: 'underline',
              margin: '10px 0 10px 0',
              color: '#0f172a',
              fontFamily: "'Montserrat', sans-serif"
            }}>
              Annexure D - Permission Letter to Communicate with Lenders and Collection Agencies
            </div>

            <p style={pStyle11}>
              I, <strong style={{ fontWeight: 700 }}>{clientName}</strong> expressly authorize <strong style={{ fontWeight: 700 }}>SettleXpert Financial Services Pvt. Ltd.</strong> (Company), its agents and representatives to communicate and negotiate with lenders and their collection agencies and to settle the loan amounts on my behalf in discussions with my lenders.
            </p>

            <p style={{ ...pStyle11, margin: '0 0 4px 0' }}>
              The Company is entitled to:
            </p>

            <p style={{ ...pStyle11, margin: '0 0 2px 0', paddingLeft: '12px' }}>
              • Obtain on my behalf, records, debt validations and support for the debts allegedly owed by me.
            </p>
            <p style={{ ...pStyle11, margin: '0 0 14px 0', paddingLeft: '12px' }}>
              • Communicate and negotiate with banks, lenders, financial institutions, licensed collection agencies and all other related entities and individuals relating to my debts.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 0.8fr',
              gap: '20px',
              marginTop: '10px',
              fontSize: '17px',
              fontFamily: "'Montserrat', sans-serif",
              color: '#1e293b'
            }}>
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ fontWeight: 700 }}>Signature:</strong>
                </div>
                <div style={{ marginBottom: '6px' }}>
                  <strong style={{ fontWeight: 700 }}>Date:</strong> {executedDate}
                </div>
                <div>
                  <strong style={{ fontWeight: 700 }}>Place:</strong> {clientAddress}
                </div>
              </div>

              <div style={{ textAlign: 'right', paddingRight: '10px' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px', fontSize: '17px' }}>
                  Executed
                </div>
                <div style={{ fontWeight: 500, color: '#334155' }}>
                  {executedDate}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ width: '100%', boxSizing: 'border-box' }}>
          <div style={{
            width: '176mm',
            height: '1.5px',
            background: '#008037',
            margin: '0 auto 8px auto'
          }}></div>

          <div style={{
            fontSize: '11px',
            color: '#475569',
            textAlign: 'center',
            fontFamily: "'Montserrat', sans-serif",
            lineHeight: 1.52,
            fontWeight: 500
          }}>
            Email: <span style={{ color: '#008037', fontWeight: 700 }}>SettleXperts@gmail.com</span> &nbsp;|&nbsp;
            Phone: <strong style={{ color: '#1e293b', fontWeight: 700 }}>+91 89292 23949</strong> &nbsp;|&nbsp;
            Website: <span style={{ color: '#008037', fontWeight: 700 }}>www.settlexpert.com</span>
          </div>
        </div>
      </div>
    );
  };

  // Compile full sequential list of all page render functions
  const allPageRenderers = [
    () => renderPage1(),
    () => renderPage2(),
    () => renderPage3(),
    () => renderPage4(),
    () => renderPage5(),
    () => renderPage6(),
    () => renderPage7(),
    () => renderPage8(),
    () => renderPage9(),
    () => renderPage10(),
    () => renderPage11()
  ];

  return (
    <div id="agreement-printable-doc" style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
      {activePage !== null && typeof activePage === 'number' ? (
        allPageRenderers[activePage - 1] ? allPageRenderers[activePage - 1]() : null
      ) : (
        allPageRenderers.map((fn, idx) => (
          <React.Fragment key={idx}>
            {fn()}
          </React.Fragment>
        ))
      )}
    </div>
  );
}
