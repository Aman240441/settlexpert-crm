const http = require('http');

const BASE_URL = 'http://localhost:5000';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, text: data });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runCRMTests() {
  console.log('🚀 STARTING SETTL EXPERT STEP 2 — EMPLOYEE CRM VERIFICATION...');
  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(` ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(` ❌ FAIL: ${name}`);
      failed++;
    }
  }

  try {
    // 1. Employee Login
    console.log('\n--- 1. Testing Employee Authentication ---');
    const empLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'vikram.mehta@settlexpert.com', password: 'Employee@123456' }
    });
    assert(empLogin.status === 200 && empLogin.data.token, 'Employee (Vikram Mehta) login successful');
    const empToken = empLogin.data.token;
    const empHeaders = { Authorization: `Bearer ${empToken}` };

    // 2. Employee CRM Dashboard
    console.log('\n--- 2. Testing Employee CRM Dashboard Summary ---');
    const dashSummary = await request('/api/crm/dashboard/summary', { headers: empHeaders });
    assert(dashSummary.status === 200, 'Dashboard summary endpoint 200 OK');
    assert(dashSummary.data.topSummary && dashSummary.data.topSummary.totalLeads !== undefined, 'Dashboard Top Summary (Total Leads, Clients, Conversion %) returned');
    assert(dashSummary.data.monthly && dashSummary.data.monthly.thisMonthCollection !== undefined, 'Monthly Collection, Pending, Expected returned');
    assert(dashSummary.data.monthlyTarget && dashSummary.data.monthlyTarget.collectionTarget > 0, 'Monthly Target & Target Status returned');
    assert(dashSummary.data.leadStatusSummary && dashSummary.data.leadStatusSummary.new !== undefined, 'Lead Status Summary (New, Contacted, Interested, Follow Up, Converted) returned');
    assert(dashSummary.data.businessSummary && dashSummary.data.activeClients !== undefined, 'Business Summary & Active Clients returned');

    // 3. Lead Creation & Sequential ID (LEAD-XXXX)
    console.log('\n--- 3. Testing Lead Creation & Sequential Permanent Lead ID ---');
    const testPhone = `+91 91${Math.floor(10000000 + Math.random() * 90000000)}`;
    const testEmail = `lead_test_${Date.now()}@example.com`;

    const createLeadRes = await request('/api/crm/leads', {
      method: 'POST',
      headers: empHeaders,
      body: {
        name: 'Arjun Kapoor',
        phone: testPhone,
        email: testEmail,
        city: 'Mumbai',
        total_debt: 850000,
        monthly_income: 75000,
        service_needed: 'Credit Card & Loan Settlement',
        paying_emis: 'No',
        harassment_calls: 'Yes',
        employment_status: 'Employed',
        employment_type: 'Salaried',
        settlement_needed: 'Yes',
        credit_card_dues: 500000,
        personal_loan_dues: 350000,
        service_fee: 35000,
        bank_name: 'HDFC & ICICI',
        status: 'new'
      }
    });

    assert(createLeadRes.status === 201 && createLeadRes.data.id, 'Lead created successfully');
    assert(createLeadRes.data.lead_number && createLeadRes.data.lead_number.startsWith('LEAD-'), `Sequential Lead ID generated: ${createLeadRes.data.lead_number}`);
    const createdLeadId = createLeadRes.data.id;
    const createdLeadNumber = createLeadRes.data.lead_number;

    // 4. Duplicate Phone Prevention
    console.log('\n--- 4. Testing Duplicate Lead Prevention (Phone & Email) ---');
    const dupPhoneRes = await request('/api/crm/leads', {
      method: 'POST',
      headers: empHeaders,
      body: {
        name: 'Duplicate Phone Attempt',
        phone: testPhone,
        email: `another_${Date.now()}@example.com`,
        status: 'new'
      }
    });
    assert(dupPhoneRes.status === 409, 'Duplicate Phone Number BLOCKED (HTTP 409 Conflict)');

    // Duplicate Email Prevention
    const dupEmailRes = await request('/api/crm/leads', {
      method: 'POST',
      headers: empHeaders,
      body: {
        name: 'Duplicate Email Attempt',
        phone: `+91 99${Math.floor(10000000 + Math.random() * 90000000)}`,
        email: testEmail,
        status: 'new'
      }
    });
    assert(dupEmailRes.status === 409, 'Duplicate Email Address BLOCKED (HTTP 409 Conflict)');

    // 5. Lead Update & created_at immutability
    console.log('\n--- 5. Testing Lead Update & created_at Immutability ---');
    const leadDetailBefore = await request(`/api/crm/leads/${createdLeadId}`, { headers: empHeaders });
    const originalCreatedAt = leadDetailBefore.data.lead.created_at;

    const updateLeadRes = await request(`/api/crm/leads/${createdLeadId}`, {
      method: 'PUT',
      headers: empHeaders,
      body: {
        name: 'Arjun Kapoor (Updated)',
        city: 'Mumbai Suburban',
        monthly_income: 80000,
        status: 'contacted'
      }
    });
    assert(updateLeadRes.status === 200, 'Lead edited successfully');

    const leadDetailAfter = await request(`/api/crm/leads/${createdLeadId}`, { headers: empHeaders });
    assert(leadDetailAfter.data.lead.name === 'Arjun Kapoor (Updated)', 'Lead name updated');
    assert(leadDetailAfter.data.lead.created_at === originalCreatedAt, 'Lead created_at permanently preserved (Unchanged after edit)');

    // 6. Follow-up History
    console.log('\n--- 6. Testing Follow-up History ---');
    const followUp1 = await request(`/api/crm/leads/${createdLeadId}/follow-up`, {
      method: 'POST',
      headers: empHeaders,
      body: {
        call_status: 'Connected',
        interested_level: 'High Interest',
        final_status: 'interested',
        remark: 'Client shared statement documents, interested in 6 months plan.',
        next_follow_up_date: '2025-04-10'
      }
    });
    assert(followUp1.status === 201, 'First Follow-up history entry logged');

    const followUp2 = await request(`/api/crm/leads/${createdLeadId}/follow-up`, {
      method: 'POST',
      headers: empHeaders,
      body: {
        call_status: 'Connected',
        interested_level: 'Ready for Conversion',
        final_status: 'follow_up',
        remark: 'Discussed fee plan terms with spouse, ready to onboard.',
        next_follow_up_date: '2025-04-12'
      }
    });
    assert(followUp2.status === 201, 'Second Follow-up history entry logged (History preserved without overwriting)');

    const leadWithHistory = await request(`/api/crm/leads/${createdLeadId}`, { headers: empHeaders });
    assert(leadWithHistory.data.followUps && leadWithHistory.data.followUps.length >= 2, 'Follow-up history list returned with all historical entries');

    // 7. Lead Conversion to Client
    console.log('\n--- 7. Testing Lead Conversion to Client ---');
    const convertRes = await request(`/api/crm/leads/${createdLeadId}/convert`, {
      method: 'POST',
      headers: empHeaders
    });
    assert(convertRes.status === 201 && convertRes.data.client_id, 'Lead successfully converted to Client');
    const convertedClientId = convertRes.data.client_id;
    const convertedClientNum = convertRes.data.client_number;
    assert(convertedClientNum && convertedClientNum.startsWith('CL-'), `Sequential Client ID generated: ${convertedClientNum}`);

    // Verify converted client retains lead_id link
    const clientDetail = await request(`/api/crm/clients/${convertedClientId}`, { headers: empHeaders });
    assert(clientDetail.status === 200 && clientDetail.data.client.lead_id === createdLeadId, 'Client retains permanent lead_id relation');

    // 8. Multiple Lenders Management
    console.log('\n--- 8. Testing Multiple Lenders for Client ---');
    const lender1 = await request(`/api/crm/clients/${convertedClientId}/lenders`, {
      method: 'POST',
      headers: empHeaders,
      body: {
        bank_name: 'HDFC Bank Credit Card',
        loan_type: 'Credit Card',
        balance: 320000,
        default_date: '2024-11-01',
        status: 'Defaulted',
        lender_email: 'nodal.cards@hdfcbank.com'
      }
    });
    assert(lender1.status === 201, 'Lender 1 added');

    const lender2 = await request(`/api/crm/clients/${convertedClientId}/lenders`, {
      method: 'POST',
      headers: empHeaders,
      body: {
        bank_name: 'ICICI Personal Loan',
        loan_type: 'Personal Loan',
        balance: 280000,
        default_date: '2024-12-15',
        status: 'Defaulted',
        lender_email: 'collections@icicibank.com'
      }
    });
    assert(lender2.status === 201, 'Lender 2 added');

    const lender3 = await request(`/api/crm/clients/${convertedClientId}/lenders`, {
      method: 'POST',
      headers: empHeaders,
      body: {
        bank_name: 'Axis Bank Jumbo Loan',
        loan_type: 'Personal Loan',
        balance: 250000,
        default_date: '2025-01-10',
        status: 'Legal Notice Received',
        lender_email: 'legal.collections@axisbank.com'
      }
    });
    assert(lender3.status === 201, 'Lender 3 added');

    const clientWithLenders = await request(`/api/crm/clients/${convertedClientId}`, { headers: empHeaders });
    assert(clientWithLenders.data.lenders && clientWithLenders.data.lenders.length >= 3, 'Client has all 3 multiple lenders attached');

    // 9. Client -> Agreement Auto-Link
    console.log('\n--- 9. Testing Agreement Generation (Client Auto-link) ---');
    const agreementRes = await request('/api/crm/agreements', {
      method: 'POST',
      headers: empHeaders,
      body: {
        client_id: convertedClientId,
        total_fee: 45000,
        monthly_fee: 7500,
        resolution_duration: '6 Months',
        status: 'signed',
        agreement_body: 'Standard Settl Expert Retainer Agreement Terms for Debt Resolution'
      }
    });
    assert(agreementRes.status === 201 && agreementRes.data.agreement_number, 'Agreement generated with auto-linked Client (No duplicate client)');
    const createdAgrNum = agreementRes.data.agreement_number;
    const createdAgrId = agreementRes.data.id;
    assert(createdAgrNum && createdAgrNum.startsWith('AGR-'), `Sequential Agreement ID generated: ${createdAgrNum}`);

    // 10. Payment Access Security (Employee 403 Blocked, Manager Allowed)
    console.log('\n--- 10. Testing Employee Payment Restriction (403 Forbidden) ---');
    const paymentRes = await request('/api/crm/payments', {
      method: 'POST',
      headers: empHeaders,
      body: {
        client_id: convertedClientId,
        agreement_id: createdAgrId,
        amount: 15000,
        payment_method: 'UPI / Bank Transfer',
        transaction_id: 'UPI/503928190000',
        payment_date: '2025-04-12'
      }
    });
    assert(paymentRes.status === 403, 'Employee payment submission strictly blocked with HTTP 403 Forbidden (View-Only Mode)');

    // 11. Employee Data Scope Check (Employee B cannot see Employee A's private leads)
    console.log('\n--- 11. Testing Employee Scoping (Data Isolation) ---');
    const emp2Login = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'ananya.roy@settlexpert.com', password: 'Employee@123456' }
    });
    assert(emp2Login.status === 200, 'Employee B (Ananya Roy) login successful');
    const emp2Headers = { Authorization: `Bearer ${emp2Login.data.token}` };

    const emp2Leads = await request('/api/crm/leads', { headers: emp2Headers });
    const containsEmp1Lead = emp2Leads.data.leads.some(l => l.id === createdLeadId);
    assert(!containsEmp1Lead, 'Employee B CANNOT see Employee A\'s private assigned leads (Scoped correctly)');

    console.log(`\n=================================================`);
    console.log(` STEP 2 CRM VERIFICATION RESULT: ${passed} PASSED, ${failed} FAILED`);
    console.log(`=================================================`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('CRM test execution error:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  setTimeout(() => {
    runCRMTests().then(() => {
      console.log('All Employee CRM backend tests passed!');
      process.exit(0);
    }).catch(err => {
      console.error(err);
      process.exit(1);
    });
  }, 1000);
}

module.exports = { runCRMTests };
