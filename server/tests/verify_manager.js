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

async function runManagerTests() {
  console.log('🚀 STARTING SETTL EXPERT STEP 3 — MANAGER PANEL VERIFICATION...');
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
    // 1. Manager Login & Context Loading
    console.log('\n--- 1. Testing Manager Login & Context (Legal, Finance, Sales, Ops) ---');
    const legalLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'rajesh.legal@settlexpert.com', password: 'Manager@123456' }
    });
    assert(legalLogin.status === 200 && legalLogin.data.token, 'Legal Manager (Rajesh Kumar) login successful');
    const legalHeaders = { Authorization: `Bearer ${legalLogin.data.token}` };

    const legalContext = await request('/api/manager/context', { headers: legalHeaders });
    assert(legalContext.status === 200 && legalContext.data.managerType === 'LEGAL', 'Legal Manager context & managerType loaded as LEGAL');
    assert(legalContext.data.assignedEmployees !== undefined, 'Assigned team employees list returned');

    const finLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'pooja.finance@settlexpert.com', password: 'Manager@123456' }
    });
    assert(finLogin.status === 200 && finLogin.data.token, 'Finance Manager (Pooja Sharma) login successful');
    const finHeaders = { Authorization: `Bearer ${finLogin.data.token}` };

    const finContext = await request('/api/manager/context', { headers: finHeaders });
    assert(finContext.status === 200 && finContext.data.managerType === 'FIN', 'Finance Manager context & managerType loaded as FIN');

    // 2. Manager Dashboard
    console.log('\n--- 2. Testing Manager Dashboard (Scoped Metrics) ---');
    const dashRes = await request('/api/manager/dashboard', { headers: legalHeaders });
    assert(dashRes.status === 200, 'Manager dashboard 200 OK');
    assert(dashRes.data.topCards && dashRes.data.topCards.myEmployees !== undefined, 'Top Cards (My Employees, Leads, Clients, Tasks) returned');
    assert(dashRes.data.pipeline && dashRes.data.pipeline.new !== undefined, 'Team Lead Pipeline returned');

    // 3. Legal Manager Advocate Control & Employee Block
    console.log('\n--- 3. Testing Legal Manager Advocate Control & Employee View-Only Restriction ---');
    const advList = await request('/api/manager/advocates', { headers: legalHeaders });
    assert(advList.status === 200 && advList.data.advocates && advList.data.advocates.length > 0, 'Legal Manager can view Advocates Directory');
    const targetAdv = advList.data.advocates[0];

    // Get a client
    const clientList = await request('/api/manager/clients', { headers: legalHeaders });
    assert(clientList.status === 200 && clientList.data.clients.length > 0, 'Manager clients returned');
    const targetClient = clientList.data.clients[0];

    // Legal Manager assigns advocate
    const assignAdvRes = await request(`/api/manager/clients/${targetClient.id}/advocate`, {
      method: 'PATCH',
      headers: legalHeaders,
      body: { advocate_id: targetAdv.id }
    });
    assert(assignAdvRes.status === 200, `Legal Manager assigned Advocate ${targetAdv.name} to Client ${targetClient.client_number}`);

    // Employee attempts to call advocate assignment endpoint
    const empLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'vikram.mehta@settlexpert.com', password: 'Employee@123456' }
    });
    const empHeaders = { Authorization: `Bearer ${empLogin.data.token}` };

    const empAdvAttempt = await request(`/api/manager/clients/${targetClient.id}/advocate`, {
      method: 'PATCH',
      headers: empHeaders,
      body: { advocate_id: targetAdv.id }
    });
    assert(empAdvAttempt.status === 403, 'Employee attempting Manager Advocate assignment is BLOCKED (HTTP 403 Forbidden)');

    // 4. Finance Manager Payment Verification & Balance Update
    console.log('\n--- 4. Testing Finance Manager Payment Verification & Security ---');
    const queueRes = await request('/api/manager/payments/verification-queue', { headers: finHeaders });
    assert(queueRes.status === 200, 'Finance Manager can access Payment Verification Queue');

    // Non-finance manager (Legal) attempts to access verification queue
    const legalQueueAttempt = await request('/api/manager/payments/verification-queue', { headers: legalHeaders });
    assert(legalQueueAttempt.status === 403, 'Non-Finance Manager accessing Payment Verification is BLOCKED (HTTP 403 Forbidden)');

    // Submit a payment via authorized manager
    const newPayRes = await request('/api/crm/payments', {
      method: 'POST',
      headers: finHeaders,
      body: {
        client_id: targetClient.id,
        amount: 25000,
        payment_method: 'UPI / Bank Transfer',
        transaction_id: 'UPI/MGR_TEST_9981'
      }
    });
    assert(newPayRes.status === 201 && newPayRes.data.id, 'New payment receipt submitted as pending_verification');
    const paymentId = newPayRes.data.id;

    // Finance Manager verifies payment
    const verifyPayRes = await request(`/api/manager/payments/${paymentId}/verify`, {
      method: 'PATCH',
      headers: finHeaders,
      body: { status: 'verified', notes: 'Verified in HDFC settlement account' }
    });
    assert(verifyPayRes.status === 200, 'Finance Manager verified payment receipt (Status = Verified)');

    // 5. Operations / Sales Manager Lead Assignment within Team vs Cross-Team Block
    console.log('\n--- 5. Testing Lead Reassignment (Team Scoping & Cross-Manager Block) ---');
    const opsLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'sneha.ops@settlexpert.com', password: 'Manager@123456' }
    });
    assert(opsLogin.status === 200, 'Operations Manager (Sneha Patel) login successful');
    const opsHeaders = { Authorization: `Bearer ${opsLogin.data.token}` };

    const opsContext = await request('/api/manager/context', { headers: opsHeaders });
    const opsEmployees = opsContext.data.assignedEmployees;

    // Create test lead
    const testPhone = `+91 95${Math.floor(10000000 + Math.random() * 90000000)}`;
    const newLeadRes = await request('/api/crm/leads', {
      method: 'POST',
      headers: empHeaders,
      body: {
        name: 'Kunal Singhania',
        phone: testPhone,
        total_debt: 750000,
        status: 'new'
      }
    });
    assert(newLeadRes.status === 201 && newLeadRes.data.id, 'New lead created');
    const testLeadId = newLeadRes.data.id;

    if (opsEmployees && opsEmployees.length > 0) {
      const teamEmp = opsEmployees[0];
      const assignRes = await request(`/api/manager/leads/${testLeadId}/assign`, {
        method: 'POST',
        headers: opsHeaders,
        body: { new_employee_id: teamEmp.id, reason: 'Case load balancing' }
      });
      assert(assignRes.status === 200, `Lead assigned to team member ${teamEmp.name}`);
    }

    // Cross-manager employee assignment attempt: Legal Manager Rajesh attempts to assign to Sales employee
    const salesEmp = db.prepare(`SELECT id, name FROM users WHERE role = 'employee' AND email LIKE '%sales%' LIMIT 1`).get();
    if (salesEmp) {
      const crossAssignRes = await request(`/api/manager/leads/${testLeadId}/assign`, {
        method: 'POST',
        headers: legalHeaders,
        body: { new_employee_id: salesEmp.id, reason: 'Cross assignment' }
      });
      assert(crossAssignRes.status === 403, 'Manager assigning lead to an employee outside their team is BLOCKED (HTTP 403 Forbidden)');
    }

    // 6. Cross-Manager Employee Password Reset Block
    console.log('\n--- 6. Testing Cross-Manager Employee Security (403 Block) ---');
    if (salesEmp) {
      const crossPwReset = await request(`/api/manager/team/${salesEmp.id}/reset-password`, {
        method: 'POST',
        headers: legalHeaders,
        body: { new_password: 'NewPassword@123' }
      });
      assert(crossPwReset.status === 403, 'Manager resetting password for an employee belonging to another manager is BLOCKED (HTTP 403 Forbidden)');
    }

    // 7. Follow-ups Monitoring & Tasks
    console.log('\n--- 7. Testing Follow-ups Monitoring & Manager Tasks ---');
    const fupRes = await request('/api/manager/follow-ups?filter=all', { headers: legalHeaders });
    assert(fupRes.status === 200 && fupRes.data.followUps !== undefined, 'Manager follow-ups list returned');

    const createTaskRes = await request('/api/manager/tasks', {
      method: 'POST',
      headers: legalHeaders,
      body: {
        title: 'Review legal reply for DRT application',
        description: 'Prepare rejoinder notice before Tuesday',
        priority: 'high',
        due_date: '2025-05-01'
      }
    });
    assert(createTaskRes.status === 201 && createTaskRes.data.id, 'Manager task created and queued');

    // 8. Manager Activity Feed
    console.log('\n--- 8. Testing Manager Activity Stream ---');
    const actRes = await request('/api/manager/activity', { headers: legalHeaders });
    assert(actRes.status === 200 && actRes.data.logs !== undefined, 'Manager activity feed returned scoped logs');

    console.log(`\n=================================================`);
    console.log(` STEP 3 MANAGER PANEL VERIFICATION RESULT: ${passed} PASSED, ${failed} FAILED`);
    console.log(`=================================================`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Manager test execution error:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  setTimeout(() => {
    runManagerTests().then(() => {
      console.log('All Manager Panel tests passed!');
      process.exit(0);
    }).catch(err => {
      console.error(err);
      process.exit(1);
    });
  }, 1000);
}

module.exports = { runManagerTests };
