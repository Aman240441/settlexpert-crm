const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { JWT_SECRET } = require('../middleware/auth');
const http = require('http');
const express = require('express');

// Setup express app with routes
const app = express();
app.use(express.json({ limit: '10mb' }));
const staffRoutes = require('../routes/staff');
app.use('/api/staff', staffRoutes);

let server;
const PORT = 54321;

function makeRequest(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(dataString),
          ...headers,
        },
      },
      (res) => {
        let respData = '';
        res.on('data', (chunk) => (respData += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(respData);
          } catch (e) {
            parsed = respData;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );
    req.on('error', reject);
    if (dataString) req.write(dataString);
    req.end();
  });
}


function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

async function runTests() {
  server = app.listen(PORT);
  try {
    console.log('===============================================================');
    console.log('  SETTL EXPERT — STAFF PROFILE & AADHAAR KYC SYSTEM TEST SUITE ');
    console.log('===============================================================\n');

    // Tokens
    const adminUser = db.prepare(`SELECT * FROM users WHERE role = 'admin' LIMIT 1`).get() || { id: 'user-admin-01', name: 'Admin', role: 'admin' };
    const adminToken = createToken({ id: adminUser.id, name: adminUser.name, role: 'admin' });

    const empUser = db.prepare(`SELECT * FROM users WHERE role = 'employee' LIMIT 1`).get() || { id: 'emp-01', name: 'Test Emp', role: 'employee' };
    const empToken = createToken({ id: empUser.id, name: empUser.name, role: 'employee' });

    const testSuffix = Date.now().toString().slice(-4);

    // ─── Test 1: Admin creates Employee with full details & Aadhaar KYC ───
    console.log('--- 1. Testing Admin Create Employee with Aadhaar KYC ---');
    const empPayload = {
      name: `Kavita Sharma ${testSuffix}`,
      date_of_birth: '1995-04-12',
      gender: 'Female',
      father_name: 'Manoj Sharma',
      mother_name: 'Sharda Sharma',
      email: `kavita.sharma.${testSuffix}@settlexpert.com`,
      phone: `+91 98200${testSuffix}`,
      alt_phone: `+91 98201${testSuffix}`,
      whatsapp_number: `+91 98200${testSuffix}`,
      current_address: 'B-402, Lotus Tower, Andheri West',
      permanent_address: 'Flat 12, Sharma Niwas, Jaipur',
      city: 'Mumbai',
      state: 'Maharashtra',
      pin_code: '400053',
      staff_type: 'Employee',
      role: 'employee',
      department_id: 'dept-ops',
      designation: 'Senior Legal Case Associate',
      emp_or_mgr_id: `EMP-KYC-${testSuffix}`,
      joining_date: '2025-01-15',
      employment_status: 'Active',
      aadhaar_number: `4589 1234 ${testSuffix}`,
      aadhaar_front_doc: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBD...',
      aadhaar_back_doc: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBD...'
    };

    const createEmpRes = await makeRequest('POST', '/api/staff', { Authorization: `Bearer ${adminToken}` }, empPayload);

    if (createEmpRes.status !== 201) {
      throw new Error(`Failed to create employee: ${JSON.stringify(createEmpRes.body)}`);
    }
    const createdEmpId = createEmpRes.body.id;
    console.log(`✔ Employee Created Successfully: ID = ${createdEmpId}, Staff ID = ${createEmpRes.body.emp_or_mgr_id}`);

    // ─── Test 2: Admin creates Manager with Manager Type ───
    console.log('\n--- 2. Testing Admin Create Manager with Manager Type ---');
    const mgrPayload = {
      name: `Arun Singhania ${testSuffix}`,
      date_of_birth: '1988-11-20',
      gender: 'Male',
      email: `arun.singh.${testSuffix}@settlexpert.com`,
      phone: `+91 98300${testSuffix}`,
      city: 'Delhi',
      staff_type: 'Manager',
      role: 'manager',
      department_id: 'dept-fin',
      manager_type_id: 'mt-fin',
      designation: 'Finance & Reconciliation Head',
      emp_or_mgr_id: `MGR-FIN-${testSuffix}`,
      joining_date: '2024-06-01',
      employment_status: 'Active',
      aadhaar_number: `6789 5432 ${testSuffix}`
    };

    const createMgrRes = await makeRequest('POST', '/api/staff', { Authorization: `Bearer ${adminToken}` }, mgrPayload);

    if (createMgrRes.status !== 201) {
      throw new Error(`Failed to create manager: ${JSON.stringify(createMgrRes.body)}`);
    }
    const createdMgrId = createMgrRes.body.id;
    console.log(`✔ Manager Created Successfully: ID = ${createdMgrId}, Staff ID = ${createMgrRes.body.emp_or_mgr_id}`);

    // ─── Test 3: Admin creates Advocate with Legal Credentials ───
    console.log('\n--- 3. Testing Admin Create Advocate with Legal Credentials ---');
    const advPayload = {
      name: `Adv. Priya Deshmukh ${testSuffix}`,
      date_of_birth: '1986-08-14',
      gender: 'Female',
      email: `adv.priya.${testSuffix}@settlexpert.com`,
      phone: `+91 98400${testSuffix}`,
      city: 'Pune',
      staff_type: 'Advocate',
      role: 'advocate',
      department_id: 'dept-legal',
      designation: 'Senior Legal Counsel',
      joining_date: '2024-01-10',
      employment_status: 'Active',
      registration_number: `MAH/7892/${testSuffix}`,
      bar_council_state: 'Bar Council of Maharashtra & Goa',
      specialization: 'Banking DRT & Insolvency',
      years_experience: 12,
      aadhaar_number: `9123 4567 ${testSuffix}`
    };

    const createAdvRes = await makeRequest('POST', '/api/staff', { Authorization: `Bearer ${adminToken}` }, advPayload);

    if (createAdvRes.status !== 201) {
      throw new Error(`Failed to create advocate: ${JSON.stringify(createAdvRes.body)}`);
    }
    const createdAdvId = createAdvRes.body.id;
    console.log(`✔ Advocate Created with Bar Council credentials: ID = ${createdAdvId}`);

    // ─── Test 4: Verify Default Masked Aadhaar in Profile ───
    console.log('\n--- 4. Testing Masked Aadhaar by Default (XXXX XXXX 1234) ---');
    const getProfileRes = await makeRequest('GET', `/api/staff/${createdEmpId}`, { Authorization: `Bearer ${adminToken}` });

    if (getProfileRes.status !== 200) {
      throw new Error(`Failed to fetch staff profile: ${JSON.stringify(getProfileRes.body)}`);
    }
    const profile = getProfileRes.body.staff;
    if (!profile.aadhaar_masked || !profile.aadhaar_masked.startsWith('XXXX XXXX')) {
      throw new Error(`Aadhaar not masked properly: ${profile.aadhaar_masked}`);
    }
    if (profile.aadhaar_number_raw || profile.aadhaar_masked_raw) {
      throw new Error(`Raw Aadhaar leaked in normal profile response!`);
    }
    console.log(`✔ Masked Aadhaar verification PASSED: ${profile.aadhaar_masked}`);
    console.log(`✔ Verified Documents meta loaded: Front = ${profile.kyc_meta?.has_front}, Back = ${profile.kyc_meta?.has_back}`);

    // ─── Test 5: Authorized Admin Aadhaar Reveal & Audit Log ───
    console.log('\n--- 5. Testing Authorized Aadhaar Reveal (Admin Only) & Audit Trail ---');
    const revealRes = await makeRequest('GET', `/api/staff/${createdEmpId}/aadhaar-reveal`, { Authorization: `Bearer ${adminToken}` });

    if (revealRes.status !== 200) {
      throw new Error(`Failed to reveal Aadhaar: ${JSON.stringify(revealRes.body)}`);
    }
    const expectedAadhaar = `4589 1234 ${testSuffix}`;
    if (revealRes.body.aadhaar_number !== expectedAadhaar) {
      throw new Error(`Revealed Aadhaar mismatch: Expected "${expectedAadhaar}", got "${revealRes.body.aadhaar_number}"`);
    }

    // Check audit log
    const auditEntry = db.prepare(`
      SELECT * FROM audit_logs WHERE module = 'Staff KYC' AND action = 'Aadhaar Revealed' AND record_id = ?
    `).get(createdEmpId);

    if (!auditEntry) {
      throw new Error('Aadhaar reveal was not recorded in audit_logs!');
    }
    console.log(`✔ Aadhaar Reveal PASSED: ${revealRes.body.aadhaar_number}`);
    console.log(`✔ Audit log confirmed: Action="${auditEntry.action}", User="${auditEntry.user_name}", Log ID=${auditEntry.id}`);

    // ─── Test 6: RBAC Protection — Non-Admin cannot reveal Aadhaar ───
    console.log('\n--- 6. Testing RBAC Security — Non-Admin Blocked from Reveal ---');
    const unauthReveal = await makeRequest('GET', `/api/staff/${createdEmpId}/aadhaar-reveal`, { Authorization: `Bearer ${empToken}` });

    if (unauthReveal.status !== 403) {
      throw new Error(`Security breach: Employee was able to access Aadhaar reveal! Status = ${unauthReveal.status}`);
    }
    console.log('✔ RBAC Security PASSED: Employee blocked with HTTP 403 Forbidden');

    // ─── Test 7: Secure Document Serving ───
    console.log('\n--- 7. Testing Authorized Aadhaar Document Serving ---');
    const docRes = await makeRequest('GET', `/api/staff/${createdEmpId}/document/front`, { Authorization: `Bearer ${adminToken}` });

    if (docRes.status !== 200 || !docRes.body.doc_data) {
      throw new Error(`Failed to serve document: ${JSON.stringify(docRes.body)}`);
    }
    console.log('✔ Aadhaar Document Serve PASSED: Front document retrieved successfully');

    // ─── Test 8: Staff Directory Filter & Search ───
    console.log('\n--- 8. Testing Staff Directory Query & Filtering ---');
    const dirRes = await makeRequest('GET', `/api/staff?search=Kavita`, { Authorization: `Bearer ${adminToken}` });

    if (dirRes.status !== 200 || !dirRes.body.staff || dirRes.body.staff.length === 0) {
      throw new Error('Staff directory search returned 0 records');
    }
    const found = dirRes.body.staff.find(s => s.id === createdEmpId);
    if (!found) throw new Error('Created employee not found in directory search');
    console.log(`✔ Staff Directory PASSED: Found ${dirRes.body.staff.length} matching staff records`);

    // ─── Test 9: Status Toggle & Audit ───
    console.log('\n--- 9. Testing Status Toggle (Deactivate / Activate) ---');
    const statusRes = await makeRequest('PATCH', `/api/staff/${createdEmpId}/status`, { Authorization: `Bearer ${adminToken}` }, { status: 'inactive' });

    if (statusRes.status !== 200 || statusRes.body.status !== 'inactive') {
      throw new Error(`Failed to toggle status: ${JSON.stringify(statusRes.body)}`);
    }
    console.log('✔ Status Toggle PASSED: Employee deactivated successfully');

    // ─── Test 10: Password Reset ───
    console.log('\n--- 10. Testing Staff Password Reset ---');
    const passRes = await makeRequest('POST', `/api/staff/${createdEmpId}/reset-password`, { Authorization: `Bearer ${adminToken}` }, { new_password: 'NewPassword@2025' });

    if (passRes.status !== 200) {
      throw new Error(`Failed to reset password: ${JSON.stringify(passRes.body)}`);
    }
    console.log('✔ Staff Password Reset PASSED');

    console.log('\n===============================================================');
    console.log('  🎉 ALL STAFF PROFILE & AADHAAR KYC TESTS PASSED (10/10)!      ');
    console.log('===============================================================\n');
  } finally {
    if (server) server.close();
  }
}

runTests().catch(err => {
  if (server) server.close();
  console.error('\n❌ TEST FAILED:', err.message);
  process.exit(1);
});


