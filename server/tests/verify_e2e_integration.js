const http = require('http');
const db = require('../db/database');

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

async function runE2EIntegrationTests() {
  console.log('🚀 STARTING STEP 4 — FULL SYSTEM INTEGRATION & HARDENING SUITE...');
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
    // ========================================================
    // 1. AUTHENTICATION & SINGLE SOURCE OF TRUTH TOKENS
    // ========================================================
    console.log('\n--- 1. Testing Multi-Role Authentication ---');
    const adminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@settlexpert.com', password: 'Admin@123456' }
    });
    assert(adminLogin.status === 200 && adminLogin.data.token, 'Super Admin Login successful');
    const adminHeaders = { Authorization: `Bearer ${adminLogin.data.token}` };

    const legalLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'rajesh.legal@settlexpert.com', password: 'Manager@123456' }
    });
    assert(legalLogin.status === 200 && legalLogin.data.token, 'Legal Manager (Rajesh Kumar) Login successful');
    const legalHeaders = { Authorization: `Bearer ${legalLogin.data.token}` };

    const finLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'pooja.finance@settlexpert.com', password: 'Manager@123456' }
    });
    assert(finLogin.status === 200 && finLogin.data.token, 'Finance Manager (Pooja Sharma) Login successful');
    const finHeaders = { Authorization: `Bearer ${finLogin.data.token}` };

    const empLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'vikram.mehta@settlexpert.com', password: 'Employee@123456' }
    });
    assert(empLogin.status === 200 && empLogin.data.token, 'Employee (Vikram Mehta) Login successful');
    const empHeaders = { Authorization: `Bearer ${empLogin.data.token}` };

    const empBLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'ananya.roy@settlexpert.com', password: 'Employee@123456' }
    });
    assert(empBLogin.status === 200 && empBLogin.data.token, 'Employee B (Ananya Roy) Login successful');
    const empBHeaders = { Authorization: `Bearer ${empBLogin.data.token}` };

    // ========================================================
    // 2. NEGATIVE SECURITY TESTS (RBAC & CROSS-SCOPE FORBIDDEN)
    // ========================================================
    console.log('\n--- 2. Testing Negative Security Matrix (HTTP 403 Forbidden) ---');
    // Employee attempting Admin API
    const empAdminAttempt = await request('/api/managers', { headers: empHeaders });
    assert(empAdminAttempt.status === 403, 'Employee → Admin API returns HTTP 403 Forbidden');

    // Employee attempting Manager API
    const empMgrAttempt = await request('/api/manager/dashboard', { headers: empHeaders });
    assert(empMgrAttempt.status === 403, 'Employee → Manager API returns HTTP 403 Forbidden');

    // Employee attempting Advocate Update on client
    const empAdvAttempt = await request('/api/manager/clients/cli-01/advocate', {
      method: 'PATCH',
      headers: empHeaders,
      body: { advocate_id: 'adv-01' }
    });
    assert(empAdvAttempt.status === 403, 'Employee → Advocate Update returns HTTP 403 Forbidden (View Only)');

    // Employee attempting Fee Update on client
    const empFeeAttempt = await request('/api/manager/clients/cli-01/fee', {
      method: 'PATCH',
      headers: empHeaders,
      body: { sx_fee: 50000 }
    });
    assert(empFeeAttempt.status === 403, 'Employee → Total Fee Update returns HTTP 403 Forbidden (Manager Controlled)');

    // Legal Manager attempting Finance Payment Verification queue
    const legalPayAttempt = await request('/api/manager/payments/verification-queue', { headers: legalHeaders });
    assert(legalPayAttempt.status === 403, 'Legal Manager → Finance Verification Queue returns HTTP 403 Forbidden');

    // ========================================================
    // 3. END-TO-END GOLDEN LIFECYCLE
    // ========================================================
    console.log('\n--- 3. Testing End-to-End Golden Lifecycle (Single Canonical Entity) ---');
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const goldenPhone = `+91 91${randomSuffix}99`;
    const goldenEmail = `golden_${Date.now()}@domain.com`;

    // Step A: Employee Creates Lead
    const leadCreateRes = await request('/api/crm/leads', {
      method: 'POST',
      headers: empHeaders,
      body: {
        name: 'Arjun Vardhan',
        phone: goldenPhone,
        email: goldenEmail,
        city: 'Mumbai',
        total_debt: 1200000,
        monthly_income: 95000,
        service_fee: 75000,
        status: 'new'
      }
    });
    assert(leadCreateRes.status === 201 && leadCreateRes.data.id, `Lead created: ${leadCreateRes.data.lead_number}`);
    const leadId = leadCreateRes.data.id;
    const leadNumber = leadCreateRes.data.lead_number;

    // Verify initial created_at timestamp
    const leadDetailRes = await request(`/api/crm/leads/${leadId}`, { headers: empHeaders });
    const leadObj = leadDetailRes.data.lead || leadDetailRes.data;
    const originalCreatedAt = leadObj.created_at;
    assert(originalCreatedAt !== undefined, `Original created_at: ${originalCreatedAt}`);

    // Step B: Employee Logs Multiple Append-Only Follow-ups
    const fup1 = await request(`/api/crm/leads/${leadId}/follow-up`, {
      method: 'POST',
      headers: empHeaders,
      body: {
        call_status: 'Connected',
        interested_level: 'High',
        final_status: 'interested',
        remark: 'Client reviewed settlement strategy and requested fee structure details.',
        next_follow_up_date: new Date(Date.now() + 86400000).toISOString().split('T')[0]
      }
    });
    assert(fup1.status === 201, 'First follow-up appended to interaction history');

    const fup2 = await request(`/api/crm/leads/${leadId}/follow-up`, {
      method: 'POST',
      headers: empHeaders,
      body: {
        call_status: 'Connected',
        interested_level: 'Ready to Sign',
        final_status: 'interested',
        remark: 'Client confirmed onboarding and fee terms.',
        next_follow_up_date: new Date().toISOString().split('T')[0]
      }
    });
    assert(fup2.status === 201, 'Second follow-up appended without overwriting first follow-up');

    // Step C: Edit Lead & Verify created_at Immutability
    const editLeadRes = await request(`/api/crm/leads/${leadId}`, {
      method: 'PUT',
      headers: empHeaders,
      body: {
        name: 'Arjun Vardhan (Verified)',
        phone: goldenPhone,
        city: 'Mumbai Suburban',
        total_debt: 1250000,
        status: 'interested'
      }
    });
    assert(editLeadRes.status === 200, 'Lead edited in place');

    const checkLeadRes = await request(`/api/crm/leads/${leadId}`, { headers: empHeaders });
    const checkLeadObj = checkLeadRes.data.lead || checkLeadRes.data;
    const checkFollowUps = checkLeadRes.data.followUps || checkLeadRes.data.follow_ups || [];
    assert(checkLeadObj.created_at === originalCreatedAt, 'Lead created_at permanently preserved (Unchanged after edit)');
    assert(checkFollowUps.length === 2, 'All historical follow-up records intact');

    // Step D: Lead Conversion to Canonical Client
    const convertRes = await request(`/api/crm/leads/${leadId}/convert`, {
      method: 'POST',
      headers: empHeaders
    });
    assert(convertRes.status === 201 && convertRes.data.client_id, `Lead converted to Client ${convertRes.data.client_number}`);
    const clientId = convertRes.data.client_id;
    const clientNumber = convertRes.data.client_number;

    // Verify Client record links to original lead_id
    const clientDetailRes = await request(`/api/crm/clients/${clientId}`, { headers: empHeaders });
    const clientObj = clientDetailRes.data.client || clientDetailRes.data;
    assert(clientObj.lead_id === leadId, 'Client retains permanent lead_id relation');
    assert(clientObj.name === 'Arjun Vardhan (Verified)', 'Client retains latest canonical profile');

    // Step E: Add Multiple Lenders to Client
    const addLender1 = await request(`/api/crm/clients/${clientId}/lenders`, {
      method: 'POST',
      headers: empHeaders,
      body: {
        bank_name: 'HDFC Bank',
        loan_type: 'Personal Loan',
        balance: 650000,
        default_date: '2024-11-15',
        status: 'Active'
      }
    });
    const addLender2 = await request(`/api/crm/clients/${clientId}/lenders`, {
      method: 'POST',
      headers: empHeaders,
      body: {
        bank_name: 'ICICI Bank',
        loan_type: 'Credit Card',
        balance: 350000,
        default_date: '2024-12-01',
        status: 'Active'
      }
    });
    const addLender3 = await request(`/api/crm/clients/${clientId}/lenders`, {
      method: 'POST',
      headers: empHeaders,
      body: {
        bank_name: 'Axis Bank',
        loan_type: 'Personal Loan',
        balance: 250000,
        default_date: '2025-01-10',
        status: 'Active'
      }
    });
    assert(addLender1.status === 201 && addLender2.status === 201 && addLender3.status === 201, 'Three multiple lenders attached to client');

    // Verify 3 lenders attached without duplicating client
    const updatedClientRes = await request(`/api/crm/clients/${clientId}`, { headers: empHeaders });
    const updatedLenders = updatedClientRes.data.lenders || [];
    assert(updatedLenders.length === 3, 'Client has 3 attached lenders (Zero client duplicates)');

    // Step F: Create Agreement Auto-Linked to Client
    const agrRes = await request('/api/crm/agreements', {
      method: 'POST',
      headers: empHeaders,
      body: {
        client_id: clientId,
        name: clientObj.name,
        phone: clientObj.phone,
        total_fee: 75000,
        monthly_fee: 12500,
        resolution_duration: '6 Months',
        status: 'signed'
      }
    });
    assert(agrRes.status === 201 && agrRes.data.id, `Agreement created: ${agrRes.data.agreement_number}`);
    const agreementId = agrRes.data.id;
    const agreementNumber = agrRes.data.agreement_number;

    // Step G: Legal Manager Assigns Advocate
    const advList = await request('/api/manager/advocates', { headers: legalHeaders });
    const advocate = advList.data.advocates[0];
    const assignAdvRes = await request(`/api/manager/clients/${clientId}/advocate`, {
      method: 'PATCH',
      headers: legalHeaders,
      body: { advocate_id: advocate.id }
    });
    assert(assignAdvRes.status === 200, `Legal Manager assigned Advocate ${advocate.name} to Client ${clientNumber}`);

    // Step H: Employee Submits Payment Receipt (Pending Verification)
    const payRes = await request('/api/crm/payments', {
      method: 'POST',
      headers: empHeaders,
      body: {
        client_id: clientId,
        amount: 25000,
        payment_method: 'NEFT / RTGS',
        transaction_id: 'TXN/GOLDEN/9988'
      }
    });
    assert(payRes.status === 201 && payRes.data.id, `Payment receipt submitted: ${payRes.data.receipt_number} (pending_verification)`);
    const paymentId = payRes.data.id;

    // Step I: Finance Manager Verifies Payment Receipt & Balance Updates
    const verifyRes = await request(`/api/manager/payments/${paymentId}/verify`, {
      method: 'PATCH',
      headers: finHeaders,
      body: { status: 'verified', notes: 'Verified against settlement bank statement' }
    });
    assert(verifyRes.status === 200, 'Finance Manager verified payment receipt (Status = Verified)');

    // Verify Financial Balance Formula: Pending = MAX(0, Total Fee - Total Verified)
    const finalClientRes = await request(`/api/crm/clients/${clientId}`, { headers: empHeaders });
    const finalClientObj = finalClientRes.data.client || finalClientRes.data;
    assert(finalClientObj.total_received === 25000, 'Verified Payment accurately reflected in Total Received (₹25,000)');
    const expectedPending = Math.max(0, 75000 - 25000);
    assert(finalClientObj.pending_amount === expectedPending, `Client pending balance calculated as ₹${expectedPending}`);
    assert(finalClientObj.advocate_name === advocate.name, 'Client displays assigned Advocate in Employee CRM');

    // ========================================================
    // 4. DATABASE INTEGRITY & ORPHAN RECORD AUDIT
    // ========================================================
    console.log('\n--- 4. Testing Database Integrity & Zero Orphan Records ---');
    const orphanAgreements = db.prepare(`SELECT COUNT(*) as count FROM agreements WHERE client_id NOT IN (SELECT id FROM clients)`).get().count;
    assert(orphanAgreements === 0, 'Zero orphan agreements (Every agreement references a valid client)');

    const orphanPayments = db.prepare(`SELECT COUNT(*) as count FROM payments WHERE client_id NOT IN (SELECT id FROM clients)`).get().count;
    assert(orphanPayments === 0, 'Zero orphan payments (Every payment references a valid client)');

    const orphanLenders = db.prepare(`SELECT COUNT(*) as count FROM lenders WHERE client_id NOT IN (SELECT id FROM clients)`).get().count;
    assert(orphanLenders === 0, 'Zero orphan lenders (Every lender references a valid client)');

    const orphanFollowUps = db.prepare(`SELECT COUNT(*) as count FROM follow_ups WHERE lead_id NOT IN (SELECT id FROM leads)`).get().count;
    assert(orphanFollowUps === 0, 'Zero orphan follow-ups (Every follow-up references a valid lead)');

    // ========================================================
    // 5. AUDIT LOGGING VERIFICATION
    // ========================================================
    console.log('\n--- 5. Testing Cross-System Audit Logging ---');
    const auditRes = await request('/api/audit-logs', { headers: adminHeaders });
    assert(auditRes.status === 200 && auditRes.data.logs.length > 0, 'Global Audit Logs returned');

    const actions = auditRes.data.logs.map(l => l.action);
    assert(actions.includes('Lead Created') || actions.includes('Lead Updated'), 'Audit captures Lead lifecycle events');
    assert(actions.includes('Advocate Assigned'), 'Audit captures Advocate assignment events');
    assert(actions.includes('Payment Verified'), 'Audit captures Payment verification events');

    console.log(`\n=================================================`);
    console.log(` STEP 4 E2E INTEGRATION RESULT: ${passed} PASSED, ${failed} FAILED`);
    console.log(`=================================================`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Integration test error:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  setTimeout(() => {
    runE2EIntegrationTests().then(() => {
      console.log('All E2E Integration tests passed!');
      process.exit(0);
    }).catch(err => {
      console.error(err);
      process.exit(1);
    });
  }, 1000);
}

module.exports = { runE2EIntegrationTests };
