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

async function runTests() {
  console.log('🚀 STARTING SETTL EXPERT ADMIN PANEL BACKEND VERIFICATION...');
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
    // 1. Admin Login
    console.log('\n--- 1. Testing Admin Authentication ---');
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@settlexpert.com', password: 'Admin@123456' }
    });
    assert(loginRes.status === 200 && loginRes.data.token, 'Admin Login successful');
    const adminToken = loginRes.data.token;
    const authHeaders = { Authorization: `Bearer ${adminToken}` };

    // 2. RBAC Security Check (Manager cannot access admin endpoints)
    console.log('\n--- 2. Testing RBAC Security (403 for non-admins) ---');
    const mgrLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'rajesh.legal@settlexpert.com', password: 'Manager@123456' }
    });
    assert(mgrLoginRes.status === 200, 'Manager login successful');
    const mgrToken = mgrLoginRes.data.token;

    const forbiddenRes = await request('/api/managers', {
      headers: { Authorization: `Bearer ${mgrToken}` }
    });
    assert(forbiddenRes.status === 403, 'Manager accessing Admin endpoint receives HTTP 403 Forbidden');

    // 3. Dashboard Metrics
    console.log('\n--- 3. Testing Admin Dashboard Metrics ---');
    const dashRes = await request('/api/dashboard/stats', { headers: authHeaders });
    assert(dashRes.status === 200 && dashRes.data.counts.totalManagers >= 4, 'Dashboard totals returned');
    assert(dashRes.data.finance && dashRes.data.managerOverview.length > 0, 'Dashboard finance & Manager Overview returned');

    // 4. Department Management
    console.log('\n--- 4. Testing Departments ---');
    const deptListRes = await request('/api/departments', { headers: authHeaders });
    assert(deptListRes.status === 200 && deptListRes.data.departments.length >= 6, 'Departments list returned (defaults exist)');

    const newDeptRes = await request('/api/departments', {
      method: 'POST',
      headers: authHeaders,
      body: { name: 'Test Department ' + Date.now(), code: 'TD' + Math.floor(Math.random()*1000), description: 'Auto test dept' }
    });
    assert(newDeptRes.status === 201, 'Department creation successful');

    // 5. Manager Types
    console.log('\n--- 5. Testing Manager Types ---');
    const typeListRes = await request('/api/manager-types', { headers: authHeaders });
    assert(typeListRes.status === 200 && typeListRes.data.types.length >= 7, 'Default manager types returned');

    // 6. Manager Creation & Management
    console.log('\n--- 6. Testing Manager Management ---');
    const newMgrCode = 'MGR-TEST-' + Math.floor(Math.random()*10000);
    const newMgrRes = await request('/api/managers', {
      method: 'POST',
      headers: authHeaders,
      body: {
        name: 'Dev Test Manager',
        email: `testmgr_${Date.now()}@settlexpert.com`,
        phone: '+91 9988776655',
        emp_or_mgr_id: newMgrCode,
        password: 'Manager@Test123',
        department_id: deptListRes.data.departments[0].id,
        manager_type_id: typeListRes.data.types[0].id,
        joining_date: '2025-04-01',
        id_type: 'Aadhaar Card'
      }
    });
    assert(newMgrRes.status === 201 && newMgrRes.data.id, 'Manager creation successful');
    const createdMgrId = newMgrRes.data.id;

    // Toggle Manager Status
    const toggleMgrRes = await request(`/api/managers/${createdMgrId}/toggle-status`, {
      method: 'PATCH',
      headers: authHeaders
    });
    assert(toggleMgrRes.status === 200 && toggleMgrRes.data.status === 'inactive', 'Manager toggle status (inactive)');

    // Reset Manager Password
    const resetMgrPass = await request(`/api/managers/${createdMgrId}/reset-password`, {
      method: 'POST',
      headers: authHeaders,
      body: { new_password: 'NewPassword@123' }
    });
    assert(resetMgrPass.status === 200, 'Manager password reset');

    // 7. Employee Creation, Assign, Transfer
    console.log('\n--- 7. Testing Employee Management ---');
    const newEmpCode = 'EMP-TEST-' + Math.floor(Math.random()*10000);
    const newEmpRes = await request('/api/employees', {
      method: 'POST',
      headers: authHeaders,
      body: {
        name: 'Dev Test Employee',
        email: `testemp_${Date.now()}@settlexpert.com`,
        phone: '+91 9112233445',
        emp_or_mgr_id: newEmpCode,
        department_id: deptListRes.data.departments[0].id,
        manager_id: createdMgrId,
        joining_date: '2025-04-05',
        id_type: 'PAN'
      }
    });
    assert(newEmpRes.status === 201 && newEmpRes.data.id, 'Employee creation successful');
    const createdEmpId = newEmpRes.data.id;

    // Transfer Employee to manager
    const transferEmpRes = await request(`/api/employees/${createdEmpId}/transfer-manager`, {
      method: 'POST',
      headers: authHeaders,
      body: {
        new_manager_id: createdMgrId,
        transfer_reason: 'Automated test reallocation'
      }
    });
    assert(transferEmpRes.status === 200, 'Employee transferred to new manager');

    // 8. Advocates Management
    console.log('\n--- 8. Testing Advocates ---');
    const advListRes = await request('/api/advocates', { headers: authHeaders });
    assert(advListRes.status === 200 && advListRes.data.advocates.length >= 3, 'Advocates list returned');

    const newAdvRes = await request('/api/advocates', {
      method: 'POST',
      headers: authHeaders,
      body: {
        name: 'Adv. Test Counsel',
        advocate_id: 'ADV-TEST-' + Math.floor(Math.random()*10000),
        mobile: '+91 98' + Math.floor(10000000 + Math.random()*90000000),
        email: `testadv_${Date.now()}@legalcorp.in`,
        registration_number: 'BAR/' + Math.floor(Math.random()*90000) + '/2024',
        specialization: 'Insolvency & Bankruptcy Code (IBC)',
        address: 'High Court Complex'
      }
    });
    assert(newAdvRes.status === 201, 'Advocate created successfully');

    // 9. Teams
    console.log('\n--- 9. Testing Teams ---');
    const teamsRes = await request('/api/teams', { headers: authHeaders });
    assert(teamsRes.status === 200, 'Teams list returned');

    // 10. Permissions Matrix
    console.log('\n--- 10. Testing Permissions Matrix ---');
    const permRes = await request(`/api/permissions/${createdMgrId}`, { headers: authHeaders });
    assert(permRes.status === 200 && permRes.data.matrix.length === 12, 'Permissions matrix returned for all 12 modules');

    const updatePermRes = await request(`/api/permissions/${createdMgrId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: {
        permissions: [
          { module: 'Leads', can_view: true, can_create: true, can_edit: true, can_delete: false, can_assign: true, can_verify: false },
          { module: 'Finance', can_view: true, can_create: false, can_edit: false, can_delete: false, can_assign: false, can_verify: true }
        ]
      }
    });
    assert(updatePermRes.status === 200, 'Permissions matrix updated');

    // 11. Fee Plans
    console.log('\n--- 11. Testing Fee Plans ---');
    const plansRes = await request('/api/fee-plans', { headers: authHeaders });
    assert(plansRes.status === 200 && plansRes.data.plans.length >= 7, 'Fee plans list returned with defaults');

    // 12. Audit Logs
    console.log('\n--- 12. Testing Audit Logs ---');
    const auditRes = await request('/api/audit-logs', { headers: authHeaders });
    assert(auditRes.status === 200 && auditRes.data.logs.length > 5, 'Audit logs captured user actions and system changes');

    console.log(`\n=================================================`);
    console.log(` BACKEND VERIFICATION RESULT: ${passed} PASSED, ${failed} FAILED`);
    console.log(`=================================================`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

// Allow standalone execution if server is already running, or start embedded server
if (require.main === module) {
  const app = require('../index');
  // wait brief moment for port binding
  setTimeout(() => {
    runTests().then(() => {
      console.log('All backend verification tests passed!');
      process.exit(0);
    }).catch(err => {
      console.error(err);
      process.exit(1);
    });
  }, 1000);
}

module.exports = { runTests };
