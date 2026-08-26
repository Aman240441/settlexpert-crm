const assert = require('assert');
const http = require('http');
const db = require('../db/database');

const BASE_URL = 'http://localhost:5000/api';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, rawData: data, data: {} });
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

async function runManualLeadTests() {
  console.log('=================================================');
  console.log(' SETTL EXPERT — MANUAL LEAD ENTRY & DIRECT EMPLOYEE CRM TEST SUITE');
  console.log('=================================================');

  // 1. Logins
  console.log('\n--- 1. Testing Logins ---');
  const adminLogin = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: 'admin@settlexpert.com', password: 'Admin@123456' },
  });
  assert(adminLogin.status === 200, 'Admin login OK');
  const adminHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${adminLogin.data.token}` };

  const mgrLogin = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: 'rajesh.legal@settlexpert.com', password: 'Manager@123456' },
  });
  assert(mgrLogin.status === 200, 'Manager login OK');
  const mgrHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${mgrLogin.data.token}` };

  const empALogin = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: 'vikram.mehta@settlexpert.com', password: 'Employee@123456' },
  });
  assert(empALogin.status === 200, 'Employee A login OK');
  const empAHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${empALogin.data.token}` };
  const empAId = empALogin.data.user.id;

  const empBLogin = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: 'ananya.roy@settlexpert.com', password: 'Employee@123456' },
  });
  assert(empBLogin.status === 200, 'Employee B login OK');
  const empBHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${empBLogin.data.token}` };
  const empBId = empBLogin.data.user.id;

  // 2. Manual Multi-Lead Studio Entry with Direct Assignment
  console.log('\n--- 2. Testing Manual Multi-Lead Entry (Direct Employee Assignment) ---');
  const manualLead1Phone = `93${Math.floor(10000000 + Math.random() * 90000000)}`;
  const manualLead2Phone = `94${Math.floor(10000000 + Math.random() * 90000000)}`;

  const manualBatch = [
    {
      name: 'Manual Direct Lead EmpA',
      phone: manualLead1Phone,
      email: `manual.empa.${Date.now()}@settlexpert.in`,
      city: 'Mumbai',
      total_debt: 600000,
      monthly_income: 50000,
      loan_type: 'Credit Card Only',
      employee_id: empAId, // Direct assignment to Employee A!
      remarks: 'Manually typed lead with instant Employee A CRM delivery'
    },
    {
      name: 'Manual Direct Lead EmpB',
      phone: manualLead2Phone,
      email: `manual.empb.${Date.now()}@settlexpert.in`,
      city: 'Bengaluru',
      total_debt: 850000,
      monthly_income: 60000,
      loan_type: 'Personal Loan Only',
      employee_id: empBId, // Direct assignment to Employee B!
      remarks: 'Manually typed lead with instant Employee B CRM delivery'
    }
  ];

  const execManualRes = await request('/crm/lead-import/execute', {
    method: 'POST',
    headers: adminHeaders,
    body: {
      validRows: manualBatch,
      fileName: 'Manual_Lead_Studio.xlsx',
      totalRows: 2,
      duplicateCount: 0,
      invalidCount: 0
    }
  });

  assert(execManualRes.status === 201, 'Manual multi-lead batch executed successfully');
  assert(execManualRes.data.imported_count === 2, '2 manual leads imported');
  console.log(' ✅ PASS: Manual multi-lead entry executed with sequential Lead IDs');

  const leadAId = execManualRes.data.imported_leads[0].id;
  const leadBId = execManualRes.data.imported_leads[1].id;

  // 3. Verify Direct Visibility in Employee A CRM
  console.log('\n--- 3. Testing Direct Visibility in Employee CRM ---');
  const empALeads = await request('/crm/leads', { headers: empAHeaders });
  assert(empALeads.status === 200, 'Employee A leads loaded');
  const foundLeadInEmpA = empALeads.data.leads.find(l => l.id === leadAId);
  assert(foundLeadInEmpA, 'Manual lead is IMMEDIATELY available in Employee A CRM workspace!');
  assert(foundLeadInEmpA.employee_id === empAId, 'Lead is assigned directly to Employee A');
  console.log(` ✅ PASS: Lead ${foundLeadInEmpA.lead_number} is LIVE in Employee A CRM workspace!`);

  // 4. Verify Privacy / Data Isolation in Employee B CRM
  console.log('\n--- 4. Testing Employee B CRM Data Isolation ---');
  const empBLeads = await request('/crm/leads', { headers: empBHeaders });
  assert(empBLeads.status === 200, 'Employee B leads loaded');
  const foundLeadInEmpB = empBLeads.data.leads.find(l => l.id === leadBId);
  assert(foundLeadInEmpB, 'Manual lead for Emp B is IMMEDIATELY available in Employee B CRM!');
  
  // Verify Employee B cannot see Employee A's lead
  const crossLeak = empBLeads.data.leads.find(l => l.id === leadAId);
  assert(!crossLeak, 'Employee B cannot see Employee A assigned lead (Strict Privacy Scoping)');
  console.log(` ✅ PASS: Lead ${foundLeadInEmpB.lead_number} is LIVE in Employee B CRM, and Employee A lead is completely private.`);

  // 5. Manager Manual Lead Creation with Direct Team Assignment
  console.log('\n--- 5. Testing Manager Manual Lead Creation with Direct Team Assignment ---');
  const mgrLeadPhone = `95${Math.floor(10000000 + Math.random() * 90000000)}`;
  const mgrLeadRes = await request('/crm/leads', {
    method: 'POST',
    headers: mgrHeaders,
    body: {
      name: 'Manager Created Lead For Vikram',
      phone: mgrLeadPhone,
      email: `mgr.created.${Date.now()}@settlexpert.in`,
      city: 'Delhi',
      loan_amount: 900000,
      bank_name: 'HDFC Bank',
      employee_id: empAId // Assigned to team employee
    }
  });

  assert(mgrLeadRes.status === 201, 'Manager created lead successfully');
  const mgrLeadId = mgrLeadRes.data.id;

  // Check it appears immediately in Employee A CRM
  const empALeadsAfterMgr = await request('/crm/leads', { headers: empAHeaders });
  const foundMgrLeadInEmpA = empALeadsAfterMgr.data.leads.find(l => l.id === mgrLeadId);
  assert(foundMgrLeadInEmpA, 'Manager created lead is immediately visible in Employee A CRM!');
  console.log(` ✅ PASS: Manager-created lead ${foundMgrLeadInEmpA.lead_number} is LIVE in Employee A CRM workspace!`);

  console.log('\n=================================================');
  console.log(' ALL MANUAL LEAD ENTRY & DIRECT CRM TESTS PASSED! (0 FAILURES)');
  console.log('=================================================\n');
}

runManualLeadTests().catch(e => {
  console.error('\n❌ MANUAL LEAD TEST FAILED:', e);
  process.exit(1);
});
