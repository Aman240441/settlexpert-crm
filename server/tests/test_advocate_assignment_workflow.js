const http = require('http');

console.log('====================================================');
console.log('  SETTL EXPERT — ADVOCATE ASSIGNMENT WORKFLOW TEST');
console.log('====================================================\n');

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(body);
        } catch {
          parsed = body;
        }
        resolve({ status: res.statusCode, data: parsed });
      });
    });
    req.on('error', reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

async function runTest() {
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
    // 1. Log in as Employee, Manager (Legal), Advocate Rahul Sharma, Advocate Amit Verma
    console.log('--- 1. Authenticating Roles ---');
    const empLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'vikram.mehta@settlexpert.com', password: 'Employee@123456' }
    });
    assert(empLogin.status === 200 && empLogin.data.token, 'Employee (Vikram Mehta) logged in');
    const empToken = empLogin.data.token;

    const mgrLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'rajesh.legal@settlexpert.com', password: 'Manager@123456' }
    });
    assert(mgrLogin.status === 200 && mgrLogin.data.token, 'Legal Manager (Rajesh Kumar) logged in');
    const mgrToken = mgrLogin.data.token;

    const rahulLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'rahul.sharma@settlexpert.com', password: 'Advocate@123456' }
    });
    assert(rahulLogin.status === 200 && rahulLogin.data.token, 'Advocate Rahul Sharma logged in');
    const rahulToken = rahulLogin.data.token;

    const amitLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'amit.verma@settlexpert.com', password: 'Advocate@123456' }
    });
    assert(amitLogin.status === 200 && amitLogin.data.token, 'Advocate Amit Verma logged in');
    const amitToken = amitLogin.data.token;

    // Step 1: Employee creates Lead and converts to Client
    console.log('\n--- Step 1: Employee Creates Lead & Converts to Client ---');
    const randPhone = `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`;
    const randEmail = `client_${Date.now()}@test.com`;

    const leadRes = await request('/api/crm/leads', {
      method: 'POST',
      headers: { Authorization: `Bearer ${empToken}` },
      body: {
        name: 'Suresh Raina',
        phone: randPhone,
        email: randEmail,
        city: 'Delhi NCR',
        total_debt: 750000,
        monthly_income: 60000
      }
    });
    assert(leadRes.status === 201 && (leadRes.data.id || leadRes.data.lead?.id), 'Lead created by Employee');
    const leadId = leadRes.data.id || leadRes.data.lead?.id;
    const leadNumber = leadRes.data.lead_number || leadRes.data.lead?.lead_number;

    const convertRes = await request(`/api/crm/leads/${leadId}/convert`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${empToken}` }
    });
    assert(convertRes.status === 201 && (convertRes.data.client_id || convertRes.data.client?.id), `Lead ${leadNumber} converted to Client`);
    const clientId = convertRes.data.client_id || convertRes.data.client?.id;
    const clientNumber = convertRes.data.client_number || convertRes.data.client?.client_number;

    // Step 2 & 3: Manager views existing advocates & searches for "Rahul"
    console.log('\n--- Step 2 & 3: Manager Searches for Advocate "Rahul" ---');
    const advListRes = await request('/api/manager/advocates', {
      headers: { Authorization: `Bearer ${mgrToken}` }
    });
    assert(advListRes.status === 200 && advListRes.data.advocates?.length > 0, 'Manager retrieved advocate list');
    const matchingAdvocates = advListRes.data.advocates.filter(a => a.name.toLowerCase().includes('rahul'));
    assert(matchingAdvocates.length >= 2, `Found ${matchingAdvocates.length} advocates matching "Rahul" (Adv. Rahul Sharma, Adv. Rahul Verma, etc.)`);

    const rahulAdvocate = advListRes.data.advocates.find(a => a.name.includes('Rahul Sharma'));
    const amitAdvocate = advListRes.data.advocates.find(a => a.name.includes('Amit Verma'));
    assert(!!rahulAdvocate, 'Found Adv. Rahul Sharma in empanelled directory');
    assert(!!amitAdvocate, 'Found Adv. Amit Verma in empanelled directory');

    // Step 4 & 5: Manager assigns Adv. Rahul Sharma
    console.log('\n--- Step 4 & 5: Manager Assigns Adv. Rahul Sharma to Client ---');
    const assignRahulRes = await request(`/api/manager/clients/${clientId}/advocate`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${mgrToken}` },
      body: { advocate_id: rahulAdvocate.id, notes: 'Initial legal notice representation' }
    });
    assert(assignRahulRes.status === 200, `Advocate Rahul Sharma assigned to Client ${clientNumber}`);

    // Verify Three Views Immediately:
    // A. Employee CRM
    const empClientRes = await request(`/api/crm/clients/${clientId}`, {
      headers: { Authorization: `Bearer ${empToken}` }
    });
    assert(empClientRes.status === 200 && empClientRes.data.client.advocate_name === rahulAdvocate.name,
      `Employee CRM displays Assigned Advocate: ${empClientRes.data.client.advocate_name}`);

    // B. Manager CRM
    const mgrClientRes = await request(`/api/manager/clients?search=${clientNumber}`, {
      headers: { Authorization: `Bearer ${mgrToken}` }
    });
    const foundInMgr = mgrClientRes.data.clients.find(c => c.id === clientId);
    assert(foundInMgr && foundInMgr.advocate_name === rahulAdvocate.name,
      `Manager CRM displays Client ${clientNumber} -> Advocate: ${foundInMgr?.advocate_name}`);

    // C. Rahul Sharma Advocate CRM
    const rahulCasesRes = await request('/api/advocate-portal/cases', {
      headers: { Authorization: `Bearer ${rahulToken}` }
    });
    const foundInRahul = rahulCasesRes.data.cases.find(c => c.id === clientId);
    assert(foundInRahul && foundInRahul.client_number === clientNumber,
      `Rahul Sharma Advocate CRM: Client ${clientNumber} appears under "My Assigned Cases"`);

    // D. Amit Verma Advocate CRM (Should NOT see this case yet)
    const amitCasesRes1 = await request('/api/advocate-portal/cases', {
      headers: { Authorization: `Bearer ${amitToken}` }
    });
    const foundInAmit1 = amitCasesRes1.data.cases.find(c => c.id === clientId);
    assert(!foundInAmit1, `Amit Verma Advocate CRM: Client ${clientNumber} IS NOT in current cases (Isolated correctly)`);

    // Step 6: Manager Reassigns from Rahul Sharma -> Amit Verma
    console.log('\n--- Step 6: Manager Reassigns Client from Rahul Sharma -> Amit Verma ---');
    const reassignAmitRes = await request(`/api/manager/clients/${clientId}/advocate`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${mgrToken}` },
      body: { advocate_id: amitAdvocate.id, notes: 'Case transferred to DRT specialist' }
    });
    assert(reassignAmitRes.status === 200, `Reassigned Client ${clientNumber} to Adv. Amit Verma`);

    // Verify Reassignment across all 3 portals:
    // A. Employee CRM shows Amit Verma
    const empClientRes2 = await request(`/api/crm/clients/${clientId}`, {
      headers: { Authorization: `Bearer ${empToken}` }
    });
    assert(empClientRes2.data.client.advocate_name === amitAdvocate.name,
      `Employee CRM updated: Client ${clientNumber} -> ${empClientRes2.data.client.advocate_name}`);

    // B. Manager CRM shows Amit Verma
    const mgrClientRes2 = await request(`/api/manager/clients?search=${clientNumber}`, {
      headers: { Authorization: `Bearer ${mgrToken}` }
    });
    const foundInMgr2 = mgrClientRes2.data.clients.find(c => c.id === clientId);
    assert(foundInMgr2.advocate_name === amitAdvocate.name,
      `Manager CRM updated: Client ${clientNumber} -> ${foundInMgr2.advocate_name}`);

    // C. Rahul Sharma Advocate CRM: Case is REMOVED from current assignments
    const rahulCasesRes2 = await request('/api/advocate-portal/cases', {
      headers: { Authorization: `Bearer ${rahulToken}` }
    });
    const foundInRahul2 = rahulCasesRes2.data.cases.find(c => c.id === clientId);
    assert(!foundInRahul2, `Rahul Sharma Advocate CRM: Case ${clientNumber} automatically removed from current active cases`);

    // D. Amit Verma Advocate CRM: Case APPEARS immediately
    const amitCasesRes2 = await request('/api/advocate-portal/cases', {
      headers: { Authorization: `Bearer ${amitToken}` }
    });
    const foundInAmit2 = amitCasesRes2.data.cases.find(c => c.id === clientId);
    assert(foundInAmit2 && foundInAmit2.client_number === clientNumber,
      `Amit Verma Advocate CRM: Case ${clientNumber} appears immediately under "My Assigned Cases"`);

    // E. Assignment History is permanently retained
    console.log('\n--- Step 7: Verifying Permanent Assignment History ---');
    const historyRes = await request(`/api/manager/clients/${clientId}/advocate-history`, {
      headers: { Authorization: `Bearer ${mgrToken}` }
    });
    assert(historyRes.status === 200 && historyRes.data.history?.length >= 2,
      `Assignment History captured ${historyRes.data.history?.length} permanent transition logs`);

    const latestLog = historyRes.data.history[0];
    const firstLog = historyRes.data.history[1];
    assert(latestLog.previous_advocate_name === rahulAdvocate.name && latestLog.new_advocate_name === amitAdvocate.name,
      `History Log 1: ${latestLog.previous_advocate_name} ➔ ${latestLog.new_advocate_name} (By ${latestLog.assigned_by_name})`);
    assert(firstLog.new_advocate_name === rahulAdvocate.name,
      `History Log 2: Initial Assignment ➔ ${firstLog.new_advocate_name}`);

    // Step 8: Security Test — Employee attempting to mutate advocate_id is BLOCKED
    console.log('\n--- Step 8: Security Matrix Validation ---');
    const empBlockRes = await request(`/api/manager/clients/${clientId}/advocate`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${empToken}` },
      body: { advocate_id: rahulAdvocate.id }
    });
    assert(empBlockRes.status === 403, 'Employee attempting to assign/reassign advocate is BLOCKED (HTTP 403 Forbidden)');

    // Non-assigned advocate trying to read full case dossier
    const rahulForbiddenRes = await request(`/api/advocate-portal/cases/${clientId}`, {
      headers: { Authorization: `Bearer ${rahulToken}` }
    });
    assert(rahulForbiddenRes.status === 403, 'Previous Advocate attempting direct API access to unassigned case is BLOCKED (HTTP 403 Forbidden)');

    console.log('\n====================================================');
    console.log(`  RESULT: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTest();
