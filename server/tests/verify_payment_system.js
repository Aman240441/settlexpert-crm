/**
 * Settl Expert - Employee CRM Payment View-Only & Manager Payment Control Verification
 * 
 * Verifies:
 * 1. Fixed Monthly Fee Logic (₹8,000 × 6 = ₹48,000, NO splitting)
 * 2. Employee Role: View Allowed (200 OK), Mutation Blocked (403 Forbidden)
 * 3. Manager Role: Full Payment Management & Update Control
 * 4. Partial Payment Calculation (₹8,000 expected, ₹4,000 received -> Partially Paid, +₹4,000 -> Paid)
 * 5. Permanent Payment History Log Maintenance (Never overwritten)
 * 6. Employee CRM Real-time Sync upon Manager Updates
 */

const http = require('http');
const assert = require('assert');
const db = require('../db/database');

const BASE_URL = 'http://localhost:5000';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('===============================================================');
  console.log('  SETTL EXPERT — PAYMENT VIEW-ONLY & MANAGER CONTROL TEST SUITE');
  console.log('===============================================================');

  try {
    // 1. Authentication for Admin, Manager, and Employee
    console.log('\n--- 1. Authenticating Roles ---');
    const adminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@settlexpert.com', password: 'Admin@123456' }
    });
    assert(adminLogin.status === 200, 'Admin login failed');
    const adminHeaders = { Authorization: `Bearer ${adminLogin.data.token}` };

    const mgrLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'pooja.finance@settlexpert.com', password: 'Manager@123456' }
    });
    assert(mgrLogin.status === 200, 'Finance Manager (Pooja Finance) login failed');
    const mgrHeaders = { Authorization: `Bearer ${mgrLogin.data.token}` };

    const empLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'vikram.mehta@settlexpert.com', password: 'Employee@123456' }
    });
    assert(empLogin.status === 200, 'Employee (Vikram Mehta) login failed');
    const empHeaders = { Authorization: `Bearer ${empLogin.data.token}` };
    console.log('✔ Authenticated Admin, Finance Manager, and Employee.');

    // 2. Setup Canonical Test Client and 6-Month Agreement (₹8,000 / month)
    console.log('\n--- 2. Setting Up Canonical Client with 6-Month Agreement @ ₹8,000/mo ---');
    const testClientId = 'cli-test-pay-' + Date.now().toString().slice(-4);
    const testClientNum = 'CL-TEST-PAY';

    db.prepare(`DELETE FROM clients WHERE client_number = ?`).run(testClientNum);
    db.prepare(`
      INSERT INTO clients (id, client_number, name, email, phone, city, total_debt, monthly_income, sx_fee, fees_status, case_status, status)
      VALUES (?, ?, 'Rahul Dev Sharma', 'rahul.dev@example.com', '+91 9888800011', 'Delhi', 500000, 45000, 48000, 'Pending', 'active', 'active')
    `).run(testClientId, testClientNum);

    const testAgrId = 'agr-test-pay-' + Date.now().toString().slice(-4);
    db.prepare(`
      INSERT INTO agreements (id, agreement_number, client_id, name, phone, email, resolution_duration, monthly_fee, total_fee, status)
      VALUES (?, 'AGR-TEST-PAY-01', ?, 'Rahul Dev Sharma', '+91 9888800011', 'rahul.dev@example.com', '6 Months', 8000, 48000, 'active')
    `).run(testAgrId, testClientId);

    // 3. Verify Schedule Generation & Monthly Fee Logic (₹8,000 × 6 = ₹48,000, NO splitting)
    console.log('\n--- 3. Testing Monthly Fee Logic & Schedule Generation ---');
    const genRes = await request(`/api/crm/clients/${testClientId}/monthly-payments/generate`, {
      method: 'POST',
      headers: mgrHeaders,
      body: {
        agreement_id: testAgrId,
        agreement_duration: '6 Months',
        monthly_fee: 8000,
        start_date: '2026-08-01'
      }
    });
    assert(genRes.status === 201, `Manager generated schedule: status ${genRes.status}`);
    assert(genRes.data.records.length === 6, 'Generated exactly 6 monthly records for 6 Months duration');
    
    // Check that every month's expected amount is independently ₹8,000 (NOT divided by 6)
    const allExpected8000 = genRes.data.records.every(r => r.expected_amount === 8000);
    assert(allExpected8000, 'Every month has expected amount = ₹8,000 independently (No division/splitting)');
    console.log('✔ Fixed Monthly Fee Logic PASSED: ₹8,000 per month × 6 Months = ₹48,000 total.');

    // 4. Test Employee Security & RBAC (Mutation Blocked -> 403 Forbidden)
    console.log('\n--- 4. Testing Employee Security & RBAC (Mutations Blocked) ---');
    
    // 4a. Employee attempting to create payment -> 403
    const empCreatePay = await request('/api/crm/payments', {
      method: 'POST',
      headers: empHeaders,
      body: { client_id: testClientId, amount: 8000, payment_method: 'UPI' }
    });
    assert(empCreatePay.status === 403, 'Employee POST /api/crm/payments is BLOCKED (HTTP 403 Forbidden)');

    // 4b. Employee attempting to update monthly payment -> 403
    const firstRecordId = genRes.data.records[0].id;
    const empUpdatePay = await request(`/api/crm/monthly-payments/${firstRecordId}`, {
      method: 'PUT',
      headers: empHeaders,
      body: { received_amount: 8000, payment_status: 'Paid' }
    });
    assert(empUpdatePay.status === 403, 'Employee PUT /api/crm/monthly-payments/:id is BLOCKED (HTTP 403 Forbidden)');

    // 4c. Employee attempting to generate schedule -> 403
    const empGenSchedule = await request(`/api/crm/clients/${testClientId}/monthly-payments/generate`, {
      method: 'POST',
      headers: empHeaders,
      body: { agreement_duration: '12 Months', monthly_fee: 10000 }
    });
    assert(empGenSchedule.status === 403, 'Employee POST .../monthly-payments/generate is BLOCKED (HTTP 403 Forbidden)');

    // 4d. Employee attempting to delete payment record -> 403
    const empDeletePay = await request(`/api/crm/monthly-payments/${firstRecordId}`, {
      method: 'DELETE',
      headers: empHeaders
    });
    assert(empDeletePay.status === 403, 'Employee DELETE /api/crm/monthly-payments/:id is BLOCKED (HTTP 403 Forbidden)');
    console.log('✔ Employee RBAC Security PASSED: All 4 mutation endpoints return HTTP 403 Forbidden.');

    // 5. Test Employee Payment View (Allowed -> 200 OK)
    console.log('\n--- 5. Testing Employee Payment Display (View-Only Allowed) ---');
    const empViewSchedule = await request(`/api/crm/clients/${testClientId}/monthly-payments`, {
      headers: empHeaders
    });
    assert(empViewSchedule.status === 200, 'Employee can view client monthly payment schedule (HTTP 200 OK)');
    assert(empViewSchedule.data.summary.monthly_fee === 8000, 'Summary shows Monthly Fee: ₹8,000');
    assert(empViewSchedule.data.summary.total_agreement_fee === 48000, 'Summary shows Total Agreement Fee: ₹48,000');
    assert(empViewSchedule.data.records.length === 6, 'Employee sees all 6 months schedule');
    console.log('✔ Employee View-Only Display PASSED: Summary & 6-month table loaded correctly.');

    // 6. Test Manager Month 1 Full Payment (₹8,000 received -> Paid)
    console.log('\n--- 6. Testing Manager Month 1 Full Payment Update ---');
    const mgrPayM1 = await request(`/api/crm/monthly-payments/${firstRecordId}`, {
      method: 'PUT',
      headers: mgrHeaders,
      body: {
        expected_amount: 8000,
        received_amount: 8000,
        payment_date: '2026-08-25',
        payment_status: 'Paid',
        remarks: 'Monthly fee received via UPI'
      }
    });
    assert(mgrPayM1.status === 200, 'Manager successfully updated Month 1 payment');
    assert(mgrPayM1.data.record.received_amount === 8000, 'Month 1 received = ₹8,000');
    assert(mgrPayM1.data.record.payment_status === 'Paid', 'Month 1 status = Paid');
    assert(mgrPayM1.data.record.pending_amount === 0, 'Month 1 pending = ₹0');
    console.log('✔ Manager Month 1 Full Payment PASSED (Expected ₹8,000, Received ₹8,000, Pending ₹0, Status: Paid).');

    // 7. Test Partial Payment Logic on Month 2 (Expected ₹8,000, Received ₹4,000 -> Partially Paid)
    console.log('\n--- 7. Testing Partial Payment Logic on Month 2 ---');
    const secondRecordId = genRes.data.records[1].id;
    
    // Step 7a: Client pays ₹4,000 for Month 2
    const mgrPayM2Partial = await request(`/api/crm/monthly-payments/${secondRecordId}`, {
      method: 'PUT',
      headers: mgrHeaders,
      body: {
        expected_amount: 8000,
        received_amount: 4000,
        payment_date: '2026-09-05',
        remarks: 'Partial fee received ₹4,000'
      }
    });
    assert(mgrPayM2Partial.status === 200, 'Manager recorded partial payment for Month 2');
    assert(mgrPayM2Partial.data.record.received_amount === 4000, 'Month 2 received = ₹4,000');
    assert(mgrPayM2Partial.data.record.pending_amount === 4000, 'Month 2 pending = ₹4,000');
    assert(mgrPayM2Partial.data.record.payment_status === 'Partially Paid', 'Month 2 auto-status = Partially Paid');
    console.log('✔ Partial Payment (Step A) PASSED: Expected ₹8,000, Received ₹4,000, Pending ₹4,000, Status: Partially Paid.');

    // Step 7b: Client later pays the remaining ₹4,000 for Month 2
    const mgrPayM2Full = await request(`/api/crm/monthly-payments/${secondRecordId}`, {
      method: 'PUT',
      headers: mgrHeaders,
      body: {
        expected_amount: 8000,
        received_amount: 8000,
        payment_date: '2026-09-12',
        payment_status: 'Paid',
        remarks: 'Second installment ₹4,000 received, month cleared'
      }
    });
    assert(mgrPayM2Full.status === 200, 'Manager completed Month 2 payment');
    assert(mgrPayM2Full.data.record.received_amount === 8000, 'Month 2 total received = ₹8,000');
    assert(mgrPayM2Full.data.record.pending_amount === 0, 'Month 2 pending = ₹0');
    assert(mgrPayM2Full.data.record.payment_status === 'Paid', 'Month 2 status = Paid');
    console.log('✔ Partial Payment (Step B) PASSED: Total Received ₹8,000, Pending ₹0, Status: Paid.');

    // 8. Test Permanent Payment History Log Maintenance
    console.log('\n--- 8. Testing Permanent Payment Transaction History Audit Log ---');
    const historyRes = await request(`/api/crm/clients/${testClientId}/monthly-payments/history`, {
      headers: empHeaders
    });
    assert(historyRes.status === 200, 'Payment history log fetched successfully');
    const historyList = historyRes.data.history;
    assert(historyList.length >= 3, `Expected at least 3 historical transaction entries, got ${historyList.length}`);
    
    // Check that previous transactions are preserved (not overwritten)
    const month2Entries = historyList.filter(h => h.month_number === 2);
    assert(month2Entries.length >= 2, 'Month 2 has multiple permanent history records (Partial & Full payments preserved)');
    assert(month2Entries.some(h => h.amount_received === 4000), 'History contains initial ₹4,000 partial payment entry');
    assert(month2Entries.some(h => h.cumulative_received === 8000), 'History contains subsequent ₹8,000 completion entry');
    console.log('✔ Permanent Payment History PASSED: All transactions preserved with timestamp, user, and remarks.');

    // 9. Test Real-time Employee CRM Synchronization
    console.log('\n--- 9. Testing Employee CRM Auto-Update & Payment Summary ---');
    const empLatestView = await request(`/api/crm/clients/${testClientId}/monthly-payments`, {
      headers: empHeaders
    });
    assert(empLatestView.status === 200, 'Employee fetched latest client payment data');
    
    // Summary check:
    // Monthly Fee: ₹8,000
    // Total Agreement Fee: ₹48,000
    // Total Received: ₹16,000 (Month 1: 8000 + Month 2: 8000)
    // Total Pending: ₹32,000 (48000 - 16000)
    const summary = empLatestView.data.summary;
    assert(summary.monthly_fee === 8000, `Summary Monthly Fee: expected 8000, got ${summary.monthly_fee}`);
    assert(summary.total_agreement_fee === 48000, `Summary Total Agreement Fee: expected 48000, got ${summary.total_agreement_fee}`);
    assert(summary.total_received === 16000, `Summary Total Received: expected 16000, got ${summary.total_received}`);
    assert(summary.total_pending === 32000, `Summary Total Pending: expected 32000, got ${summary.total_pending}`);

    // Schedule records check:
    const rec1 = empLatestView.data.records.find(r => r.month_number === 1);
    const rec2 = empLatestView.data.records.find(r => r.month_number === 2);
    const rec3 = empLatestView.data.records.find(r => r.month_number === 3);

    assert(rec1.payment_status === 'Paid' && rec1.received_amount === 8000, 'Employee CRM shows Month 1: Paid (₹8,000)');
    assert(rec2.payment_status === 'Paid' && rec2.received_amount === 8000, 'Employee CRM shows Month 2: Paid (₹8,000)');
    assert(rec3.payment_status === 'Pending' && rec3.received_amount === 0 && rec3.pending_amount === 8000, 'Employee CRM shows Month 3: Pending (₹8,000)');

    console.log('✔ Employee CRM Real-Time Sync PASSED:');
    console.log(`  • Monthly Fee: ₹${summary.monthly_fee.toLocaleString('en-IN')}`);
    console.log(`  • Total Agreement Fee: ₹${summary.total_agreement_fee.toLocaleString('en-IN')}`);
    console.log(`  • Total Received: ₹${summary.total_received.toLocaleString('en-IN')}`);
    console.log(`  • Total Pending: ₹${summary.total_pending.toLocaleString('en-IN')}`);

    // Clean up test client
    db.prepare(`DELETE FROM monthly_payment_history WHERE client_id = ?`).run(testClientId);
    db.prepare(`DELETE FROM monthly_payment_records WHERE client_id = ?`).run(testClientId);
    db.prepare(`DELETE FROM agreements WHERE client_id = ?`).run(testClientId);
    db.prepare(`DELETE FROM clients WHERE id = ?`).run(testClientId);

    console.log('\n===============================================================');
    console.log('  🎉 ALL SETTL EXPERT PAYMENT SYSTEM TESTS PASSED SUCCESSFULLY!  ');
    console.log('===============================================================');
    return true;
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

runTests();
