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

async function runTests() {
  console.log('=================================================');
  console.log(' SETTL EXPERT — LEAD IMPORT & SMART DISTRIBUTION TEST SUITE');
  console.log('=================================================');

  // 1. Authentication
  console.log('\n--- 1. Testing Multi-Role Authentication ---');
  const adminLogin = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: 'admin@settlexpert.com', password: 'Admin@123456' },
  });
  assert(adminLogin.status === 200 && adminLogin.data.token, 'Admin login successful');
  const adminToken = adminLogin.data.token;
  const adminHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` };
  console.log(' ✅ PASS: Admin login successful');

  const mgrLogin = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: 'rajesh.legal@settlexpert.com', password: 'Manager@123456' },
  });
  assert(mgrLogin.status === 200 && mgrLogin.data.token, 'Legal Manager login successful');
  const mgrToken = mgrLogin.data.token;
  const mgrHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${mgrToken}` };
  console.log(' ✅ PASS: Manager login successful');

  const empALogin = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: 'vikram.mehta@settlexpert.com', password: 'Employee@123456' },
  });
  assert(empALogin.status === 200 && empALogin.data.token, 'Employee A (Vikram) login successful');
  const empAToken = empALogin.data.token;
  const empAHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${empAToken}` };
  const empAId = empALogin.data.user.id;
  console.log(' ✅ PASS: Employee A login successful');

  const empBLogin = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: 'ananya.roy@settlexpert.com', password: 'Employee@123456' },
  });
  assert(empBLogin.status === 200 && empBLogin.data.token, 'Employee B (Ananya) login successful');
  const empBToken = empBLogin.data.token;
  const empBHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${empBToken}` };
  const empBId = empBLogin.data.user.id;
  console.log(' ✅ PASS: Employee B login successful');

  // 2. Security: Employee Cannot Access Import or Distribution
  console.log('\n--- 2. Testing Employee Role Security Restrictions ---');
  const empPreviewAttempt = await request('/crm/lead-import/preview', {
    method: 'POST',
    headers: empAHeaders,
    body: { rows: [{ Name: 'Test', Phone: '9999999999' }] }
  });
  assert(empPreviewAttempt.status === 403, 'Employee blocked from Lead Import Preview (HTTP 403)');
  console.log(' ✅ PASS: Employee blocked from Lead Import Preview (HTTP 403)');

  const empDistributeAttempt = await request('/crm/lead-import/distribute', {
    method: 'POST',
    headers: empAHeaders,
    body: { lead_ids: ['lead-1'], assignments: [{ employee_id: empAId, count: 1 }] }
  });
  assert(empDistributeAttempt.status === 403, 'Employee blocked from Lead Distribution (HTTP 403)');
  console.log(' ✅ PASS: Employee blocked from Lead Distribution (HTTP 403)');

  // 3. Download Sample Templates
  console.log('\n--- 3. Testing Sample Template Generation ---');
  const tplXlsx = await request('/crm/lead-import/template?format=xlsx', { headers: adminHeaders });
  assert(tplXlsx.status === 200, 'Excel template generated with 200 OK');
  console.log(' ✅ PASS: Excel template generated (.xlsx)');

  const tplCsv = await request('/crm/lead-import/template?format=csv', { headers: adminHeaders });
  assert(tplCsv.status === 200, 'CSV template generated with 200 OK');
  console.log(' ✅ PASS: CSV template generated (.csv)');

  // 4. Excel Preview, Duplicate & Invalid Row Detection
  console.log('\n--- 4. Testing Excel Preview, Validation & Duplicate Detection ---');
  const uniquePhone1 = `91${Math.floor(10000000 + Math.random() * 90000000)}`;
  const uniquePhone2 = `91${Math.floor(10000000 + Math.random() * 90000000)}`;
  const uniquePhone3 = `91${Math.floor(10000000 + Math.random() * 90000000)}`;

  // First create a baseline lead to test database duplicate checking
  const existingDbPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  const existingDbEmail = `existing.db.${Date.now()}@example.com`;
  await request('/crm/leads', {
    method: 'POST',
    headers: adminHeaders,
    body: {
      name: 'Existing Baseline Lead',
      phone: existingDbPhone,
      email: existingDbEmail,
      loan_amount: 500000
    }
  });

  const testUploadRows = [
    { Name: 'Lead Valid 1', Phone: uniquePhone1, Email: `v1.${Date.now()}@test.com`, City: 'Mumbai', 'Total Outstanding Amount': 500000 },
    { Name: 'Lead Valid 2', Phone: uniquePhone2, Email: `v2.${Date.now()}@test.com`, City: 'Delhi', 'Total Outstanding Amount': 750000 },
    { Name: 'Lead Valid 3', Phone: uniquePhone3, Email: `v3.${Date.now()}@test.com`, City: 'Bengaluru', 'Total Outstanding Amount': 300000 },
    { Name: 'Lead Dup Phone DB', Phone: existingDbPhone, Email: `dup.phone.${Date.now()}@test.com`, City: 'Pune' }, // Duplicate Phone in DB
    { Name: 'Lead Dup Email DB', Phone: `95${Math.floor(10000000 + Math.random() * 90000000)}`, Email: existingDbEmail, City: 'Pune' }, // Duplicate Email in DB
    { Name: 'Lead Internal Dup', Phone: uniquePhone1, Email: `internal.dup.${Date.now()}@test.com`, City: 'Chennai' }, // Repeated phone in file
    { Name: '', Phone: '9888888888', Email: 'missing.name@test.com' }, // Invalid: missing name
    { Name: 'Invalid Phone', Phone: '123', Email: 'bad.phone@test.com' }, // Invalid: phone < 10 digits
  ];

  const previewRes = await request('/crm/lead-import/preview', {
    method: 'POST',
    headers: adminHeaders,
    body: { rows: testUploadRows }
  });

  assert(previewRes.status === 200, 'Preview API returned 200 OK');
  assert(previewRes.data.totalRows === 8, 'Total rows analyzed = 8');
  assert(previewRes.data.validCount === 3, `Valid leads count = 3 (Received: ${previewRes.data.validCount})`);
  assert(previewRes.data.duplicateCount === 3, `Duplicate leads count = 3 (Received: ${previewRes.data.duplicateCount})`);
  assert(previewRes.data.invalidCount === 2, `Invalid rows count = 2 (Received: ${previewRes.data.invalidCount})`);
  console.log(' ✅ PASS: Accurate preview validation (3 Valid, 3 Duplicates, 2 Invalid)');

  // 5. Error Report Download
  console.log('\n--- 5. Testing Error Report Generation ---');
  const errorReportRes = await request('/crm/lead-import/error-report', {
    method: 'POST',
    headers: adminHeaders,
    body: {
      invalidRows: previewRes.data.invalidRows,
      duplicateRows: previewRes.data.duplicateRows
    }
  });
  assert(errorReportRes.status === 200, 'Error report Excel generated successfully');
  console.log(' ✅ PASS: Error report Excel generated');

  // 6. Execute Import of 10 Leads
  console.log('\n--- 6. Testing Execute Import (10 Canonical Leads with Permanent IDs) ---');
  const tenLeads = [];
  for (let i = 1; i <= 10; i++) {
    tenLeads.push({
      name: `Imported Lead User ${i}`,
      phone: `92${String(Date.now() + i).slice(-8)}`,
      email: `batch.import.${i}.${Date.now()}@settlexpert.in`,
      city: i % 2 === 0 ? 'Mumbai' : 'Delhi',
      total_debt: 250000 * i,
      monthly_income: 35000 + i * 2000,
      loan_type: 'Credit Card & Personal Loan'
    });
  }

  const importExecRes = await request('/crm/lead-import/execute', {
    method: 'POST',
    headers: adminHeaders,
    body: {
      validRows: tenLeads,
      fileName: 'test_10_leads_upload.xlsx',
      totalRows: 10,
      duplicateCount: 0,
      invalidCount: 0
    }
  });

  assert(importExecRes.status === 201, 'Import execution returned 201 Created');
  assert(importExecRes.data.imported_count === 10, 'Imported count = 10');
  assert(importExecRes.data.imported_leads.length === 10, '10 leads returned');
  assert(importExecRes.data.import_number && importExecRes.data.import_number.startsWith('IMP-'), 'Sequential Import ID generated');
  
  const sampleImportedLead = importExecRes.data.imported_leads[0];
  assert(sampleImportedLead.lead_number && sampleImportedLead.lead_number.startsWith('LEAD-'), `Permanent sequential Lead ID generated: ${sampleImportedLead.lead_number}`);
  console.log(` ✅ PASS: 10 Leads imported successfully with permanent IDs (${sampleImportedLead.lead_number}) under Import Batch ${importExecRes.data.import_number}`);

  const importedLeadIds = importExecRes.data.imported_lead_ids;

  // 7. Employee Workload Matrix
  console.log('\n--- 7. Testing Employee Workload Matrix ---');
  const workloadRes = await request('/crm/lead-import/employees-workload', { headers: adminHeaders });
  assert(workloadRes.status === 200 && Array.isArray(workloadRes.data.employees), 'Employee workload list returned');
  const empList = workloadRes.data.employees;
  assert(empList.length >= 2, 'Found at least 2 active employees');
  console.log(` ✅ PASS: Workload matrix loaded (${empList.length} employees) with live metrics (New, Active, Follow-ups, Converted)`);

  // 8. Equal Distribution: 10 leads to 2 employees (5 + 5)
  console.log('\n--- 8. Testing Mode 1 — Equal Distribution (10 leads / 2 employees = 5 + 5) ---');
  const equalDistRes = await request('/crm/lead-import/distribute', {
    method: 'POST',
    headers: adminHeaders,
    body: {
      lead_ids: importedLeadIds,
      mode: 'equal',
      assignment_method: 'sequential',
      assignments: [
        { employee_id: empAId, count: 5 },
        { employee_id: empBId, count: 5 }
      ],
      import_id: importExecRes.data.import_id
    }
  });

  if (equalDistRes.status !== 200) {
    console.error('Equal Dist Error:', equalDistRes.status, equalDistRes.data);
  }
  assert(equalDistRes.status === 200, `Equal distribution 200 OK (Received ${equalDistRes.status}: ${JSON.stringify(equalDistRes.data)})`);
  assert(equalDistRes.data.total_leads === 10, 'Total leads distributed = 10');
  assert(equalDistRes.data.summary.length === 2, '2 employees received leads');
  assert(equalDistRes.data.summary[0].count === 5 && equalDistRes.data.summary[1].count === 5, 'Exact 5 + 5 equal split achieved');
  console.log(' ✅ PASS: Equal distribution (5 + 5) verified');

  // 9. Equal Distribution with Remainder (10 leads to 3 employees: 4 + 3 + 3)
  console.log('\n--- 9. Testing Mode 1 — Equal Distribution with Remainder (10 leads / 3 employees = 4 + 3 + 3) ---');
  const empC = empList.find(e => e.id !== empAId && e.id !== empBId) || empList[0];
  const equalRemainderRes = await request('/crm/lead-import/distribute', {
    method: 'POST',
    headers: adminHeaders,
    body: {
      lead_ids: importedLeadIds,
      mode: 'equal',
      assignment_method: 'sequential',
      assignments: [
        { employee_id: empAId, count: 0 },
        { employee_id: empBId, count: 0 },
        { employee_id: empC.id, count: 0 }
      ]
    }
  });
  assert(equalRemainderRes.status === 200, 'Equal distribution with remainder 200 OK');
  const counts = equalRemainderRes.data.summary.map(s => s.count);
  const totalAlloc = counts.reduce((a, b) => a + b, 0);
  assert(totalAlloc === 10, `All 10 leads allocated without leaving any remainder (Counts: ${counts.join(', ')})`);
  assert(counts[0] === 4 && counts[1] === 3 && counts[2] === 3, 'Fair remainder distribution: 4 + 3 + 3');
  console.log(` ✅ PASS: Equal distribution with remainder verified (4 + 3 + 3 = 10)`);

  // 10. Custom Distribution (Employee A = 2, Employee B = 8)
  console.log('\n--- 10. Testing Mode 2 — Custom Distribution (Emp A = 2, Emp B = 8) ---');
  const customDistRes = await request('/crm/lead-import/distribute', {
    method: 'POST',
    headers: adminHeaders,
    body: {
      lead_ids: importedLeadIds,
      mode: 'custom',
      assignment_method: 'random',
      assignments: [
        { employee_id: empAId, count: 2 },
        { employee_id: empBId, count: 8 }
      ]
    }
  });
  assert(customDistRes.status === 200, 'Custom distribution 200 OK');
  assert(customDistRes.data.summary[0].count === 2 && customDistRes.data.summary[1].count === 8, 'Exact custom distribution: Emp A = 2, Emp B = 8');
  console.log(' ✅ PASS: Custom distribution verified (Emp A = 2, Emp B = 8)');

  // 11. Custom Distribution Validation (Mismatch blocked)
  console.log('\n--- 11. Testing Custom Distribution Mismatch Block ---');
  const mismatchAttempt = await request('/crm/lead-import/distribute', {
    method: 'POST',
    headers: adminHeaders,
    body: {
      lead_ids: importedLeadIds, // 10 leads
      mode: 'custom',
      assignment_method: 'sequential',
      assignments: [
        { employee_id: empAId, count: 2 },
        { employee_id: empBId, count: 5 } // Sum = 7 != 10
      ]
    }
  });
  assert(mismatchAttempt.status === 400, 'Custom distribution mismatch strictly blocked with HTTP 400');
  console.log(' ✅ PASS: Custom distribution mismatch blocked (HTTP 400)');

  // 12. Employee Data Scoping Verification
  console.log('\n--- 12. Testing Employee Data Scoping (Private Lead Access) ---');
  const empALeadsRes = await request('/crm/leads', { headers: empAHeaders });
  assert(empALeadsRes.status === 200, 'Employee A leads loaded');
  const empALeadIds = empALeadsRes.data.leads.map(l => l.id);

  const empBLeadsRes = await request('/crm/leads', { headers: empBHeaders });
  assert(empBLeadsRes.status === 200, 'Employee B leads loaded');
  const empBLeadIds = empBLeadsRes.data.leads.map(l => l.id);

  const importedSeenByA = empALeadsRes.data.leads.filter(l => importedLeadIds.includes(l.id));
  const importedSeenByB = empBLeadsRes.data.leads.filter(l => importedLeadIds.includes(l.id));
  assert(importedSeenByA.length === 2, `Employee A sees exactly 2 assigned leads (Saw: ${importedSeenByA.length})`);
  assert(importedSeenByB.length === 8, `Employee B sees exactly 8 assigned leads (Saw: ${importedSeenByB.length})`);
  assert(importedSeenByA.every(l => l.employee_id === empAId), 'All imported leads seen by Emp A are assigned to Emp A');
  assert(importedSeenByB.every(l => l.employee_id === empBId), 'All imported leads seen by Emp B are assigned to Emp B');
  
  // Verify isolation
  const overlap = importedSeenByA.filter(la => importedSeenByB.some(lb => lb.id === la.id));
  assert(overlap.length === 0, 'Zero lead overlap between Employee A and Employee B (Strict scoping)');
  console.log(' ✅ PASS: Employee data scoping strictly verified (Zero overlap, total data privacy)');

  // 13. Manager Scoping & Cross-Team Distribution Block
  console.log('\n--- 13. Testing Manager Scoping & Cross-Team Restriction ---');
  const mgrWorkload = await request('/crm/lead-import/employees-workload', { headers: mgrHeaders });
  assert(mgrWorkload.status === 200, 'Manager workload loaded');
  console.log(` ✅ PASS: Manager scoped workload returned ${mgrWorkload.data.employees.length} team members`);

  // Attempt to distribute to an employee outside this manager's team
  const outsideEmp = empList.find(e => !mgrWorkload.data.employees.some(me => me.id === e.id));
  if (outsideEmp) {
    const crossTeamAttempt = await request('/crm/lead-import/distribute', {
      method: 'POST',
      headers: mgrHeaders,
      body: {
        lead_ids: [importedLeadIds[0]],
        mode: 'equal',
        assignments: [{ employee_id: outsideEmp.id, count: 1 }]
      }
    });
    assert(crossTeamAttempt.status === 403, 'Manager blocked from distributing leads to outside team employee (HTTP 403)');
    console.log(' ✅ PASS: Manager blocked from distributing outside authorized team (HTTP 403)');
  }

  // 14. Lead Reassignment & Immutability of Lead ID & created_at
  console.log('\n--- 14. Testing Lead Reassignment & Immutability ---');
  const leadToReassignId = importedLeadIds[0];
  const beforeReassign = db.prepare(`SELECT * FROM leads WHERE id = ?`).get(leadToReassignId);

  const reassignRes = await request('/crm/lead-import/reassign', {
    method: 'POST',
    headers: adminHeaders,
    body: {
      lead_id: leadToReassignId,
      new_employee_id: empAId,
      reason: 'Specialized Legal Consultation'
    }
  });
  assert(reassignRes.status === 200, 'Lead reassignment 200 OK');

  const afterReassign = db.prepare(`SELECT * FROM leads WHERE id = ?`).get(leadToReassignId);
  assert(afterReassign.employee_id === empAId, 'Lead assigned to Employee A');
  assert(afterReassign.lead_number === beforeReassign.lead_number, 'Permanent Lead ID preserved intact');
  assert(afterReassign.created_at === beforeReassign.created_at, 'created_at permanently preserved intact');
  console.log(` ✅ PASS: Lead ${afterReassign.lead_number} reassigned without changing lead_id or created_at`);

  // 15. Verify Assignment History Audit Trail
  console.log('\n--- 15. Testing Assignment History & Audit Trail ---');
  const leadHistoryRes = await request(`/crm/lead-import/lead-history/${leadToReassignId}`, { headers: adminHeaders });
  assert(leadHistoryRes.status === 200 && leadHistoryRes.data.history.length > 0, 'Assignment history recorded for lead');
  const reassignRecord = leadHistoryRes.data.history.find(h => h.reassignment_reason === 'Specialized Legal Consultation') || leadHistoryRes.data.history[0];
  assert(reassignRecord.assigned_employee_id === empAId, 'History records new employee');
  assert(reassignRecord.reassignment_reason === 'Specialized Legal Consultation', `History records reason (Found: ${reassignRecord.reassignment_reason})`);
  console.log(' ✅ PASS: Assignment history and audit trail verified');

  // 16. Distribution History List
  console.log('\n--- 16. Testing Distribution History Logs ---');
  const distHistoryRes = await request('/crm/lead-import/history', { headers: adminHeaders });
  assert(distHistoryRes.status === 200 && distHistoryRes.data.distributions.length > 0, 'Distribution history list returned');
  const topDist = distHistoryRes.data.distributions[0];
  assert(topDist.distribution_number && topDist.distribution_number.startsWith('DIST-'), 'Distribution number present');
  console.log(` ✅ PASS: Distribution history logs verified (Batch ${topDist.distribution_number})`);

  // 17. Imported Leads Canonical Lifecycle (Follow-up, Edit, Convert)
  console.log('\n--- 17. Testing Canonical Lifecycle on Imported Lead ---');
  // Log Follow-up on imported lead
  const fupRes = await request(`/crm/leads/${leadToReassignId}/follow-up`, {
    method: 'POST',
    headers: empAHeaders,
    body: {
      call_status: 'Connected',
      interested_level: 'High',
      final_status: 'interested',
      remark: 'Imported lead confirmed appointment for debt settlement',
      next_follow_up_date: '2026-09-01'
    }
  });
  assert(fupRes.status === 201, 'Follow-up successfully logged on imported lead');

  // Convert imported lead to client
  const convRes = await request(`/crm/leads/${leadToReassignId}/convert`, {
    method: 'POST',
    headers: adminHeaders
  });
  assert(convRes.status === 200 || convRes.status === 201, 'Imported lead converted to Client');
  assert(convRes.data.client_number && convRes.data.client_number.startsWith('CL-'), 'Client ID generated');
  console.log(` ✅ PASS: Imported lead fully supports follow-up & conversion to Client (${convRes.data.client_number})`);

  console.log('\n=================================================');
  console.log(' ALL 17 LEAD IMPORT & DISTRIBUTION TEST SUITES PASSED! (0 FAILURES)');
  console.log('=================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
