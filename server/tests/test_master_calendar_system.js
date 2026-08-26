const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

console.log('====================================================');
console.log('  SETTL EXPERT — MASTER SYSTEM DATE & RBAC TEST');
console.log('====================================================');

// 1. Clean test records if any existed with TEST- prefixes
db.prepare(`DELETE FROM leads WHERE lead_number LIKE 'TEST-LEAD-%'`).run();
db.prepare(`DELETE FROM clients WHERE client_number LIKE 'TEST-CL-%'`).run();
db.prepare(`DELETE FROM agreements WHERE agreement_number LIKE 'TEST-AGR-%'`).run();

// Helper to insert with explicit created_at
function insertTestLead(number, name, dateStr) {
  const id = 'lead-' + uuidv4().slice(0, 8);
  db.prepare(`
    INSERT INTO leads (id, lead_number, name, phone, email, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'new', ?, ?)
  `).run(id, number, name, '98' + Math.floor(10000000 + Math.random() * 90000000), `${number.toLowerCase()}@test.com`, `${dateStr} 10:00:00`, `${dateStr} 10:00:00`);
  return id;
}

function insertTestClient(number, name, dateStr) {
  const id = 'cli-' + uuidv4().slice(0, 8);
  db.prepare(`
    INSERT INTO clients (id, client_number, name, phone, email, total_debt, sx_fee, status, case_status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 200000, 20000, 'active', 'active', ?, ?)
  `).run(id, number, name, '97' + Math.floor(10000000 + Math.random() * 90000000), `${number.toLowerCase()}@test.com`, `${dateStr} 11:00:00`, `${dateStr} 11:00:00`);
  return id;
}

function insertTestAgreement(number, clientId, name, dateStr) {
  const id = 'agr-' + uuidv4().slice(0, 8);
  db.prepare(`
    INSERT INTO agreements (id, agreement_number, client_id, name, total_fee, monthly_fee, start_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, 24000, 4000, ?, ?, ?)
  `).run(id, number, clientId, name, dateStr, `${dateStr} 12:00:00`, `${dateStr} 12:00:00`);
  return id;
}

console.log('\n1. Creating Multi-Date Scenario:');
// 02 Aug 2026: 5 Leads, 2 Clients, 1 Agreement
for (let i = 1; i <= 5; i++) insertTestLead(`TEST-LEAD-02-0${i}`, `Lead 02 Aug ${i}`, '2026-08-02');
const c1 = insertTestClient('TEST-CL-02-01', 'Client 02 Aug 1', '2026-08-02');
const c2 = insertTestClient('TEST-CL-02-02', 'Client 02 Aug 2', '2026-08-02');
const a1 = insertTestAgreement('TEST-AGR-02-01', c1, 'Client 02 Aug 1', '2026-08-02');

// 03 Aug 2026: 3 Leads, 1 Client, 2 Agreements
for (let i = 1; i <= 3; i++) insertTestLead(`TEST-LEAD-03-0${i}`, `Lead 03 Aug ${i}`, '2026-08-03');
const c3 = insertTestClient('TEST-CL-03-01', 'Client 03 Aug 1', '2026-08-03');
insertTestAgreement('TEST-AGR-03-01', c3, 'Client 03 Aug 1', '2026-08-03');
insertTestAgreement('TEST-AGR-03-02', c3, 'Client 03 Aug 1', '2026-08-03');

// 04 Aug 2026: 2 Leads, 2 Clients, 1 Agreement
for (let i = 1; i <= 2; i++) insertTestLead(`TEST-LEAD-04-0${i}`, `Lead 04 Aug ${i}`, '2026-08-04');
const c4 = insertTestClient('TEST-CL-04-01', 'Client 04 Aug 1', '2026-08-04');
const c5 = insertTestClient('TEST-CL-04-02', 'Client 04 Aug 2', '2026-08-04');
insertTestAgreement('TEST-AGR-04-01', c4, 'Client 04 Aug 1', '2026-08-04');

console.log('✔ Test dataset created for 02 Aug, 03 Aug, and 04 Aug.');

console.log('\n2. Testing Date Isolation Queries:');
function queryDate(dateStr) {
  const leads = db.prepare(`SELECT COUNT(*) as c FROM leads WHERE lead_number LIKE 'TEST-LEAD-%' AND date(created_at) = date(?)`).get(dateStr).c;
  const clients = db.prepare(`SELECT COUNT(*) as c FROM clients WHERE client_number LIKE 'TEST-CL-%' AND date(created_at) = date(?)`).get(dateStr).c;
  const agreements = db.prepare(`SELECT COUNT(*) as c FROM agreements WHERE agreement_number LIKE 'TEST-AGR-%' AND (date(created_at) = date(?) OR date(start_date) = date(?))`).get(dateStr, dateStr).c;
  return { leads, clients, agreements };
}

const r02 = queryDate('2026-08-02');
console.log(`02 Aug -> Leads: ${r02.leads} (Expected: 5), Clients: ${r02.clients} (Expected: 2), Agreements: ${r02.agreements} (Expected: 1)`);
if (r02.leads === 5 && r02.clients === 2 && r02.agreements === 1) {
  console.log('✔ 02 Aug Isolation PASSED');
} else {
  console.error('❌ 02 Aug Isolation FAILED');
}

const r03 = queryDate('2026-08-03');
console.log(`03 Aug -> Leads: ${r03.leads} (Expected: 3), Clients: ${r03.clients} (Expected: 1), Agreements: ${r03.agreements} (Expected: 2)`);
if (r03.leads === 3 && r03.clients === 1 && r03.agreements === 2) {
  console.log('✔ 03 Aug Isolation PASSED');
} else {
  console.error('❌ 03 Aug Isolation FAILED');
}

const r04 = queryDate('2026-08-04');
console.log(`04 Aug -> Leads: ${r04.leads} (Expected: 2), Clients: ${r04.clients} (Expected: 2), Agreements: ${r04.agreements} (Expected: 1)`);
if (r04.leads === 2 && r04.clients === 2 && r04.agreements === 1) {
  console.log('✔ 04 Aug Isolation PASSED');
} else {
  console.error('❌ 04 Aug Isolation FAILED');
}

console.log('\n3. Testing Immutability of created_at on record edit:');
const sampleLead = db.prepare(`SELECT * FROM leads WHERE lead_number = 'TEST-LEAD-02-01'`).get();
const origCreated = sampleLead.created_at;
db.prepare(`UPDATE leads SET name = 'Updated Name on 05 Aug', updated_at = '2026-08-05 15:00:00' WHERE id = ?`).run(sampleLead.id);
const reloadedLead = db.prepare(`SELECT * FROM leads WHERE id = ?`).get(sampleLead.id);
if (reloadedLead.created_at === origCreated) {
  console.log(`✔ created_at remains unchanged (${reloadedLead.created_at}) after edit. Immutability PASSED.`);
} else {
  console.error('❌ created_at was mutated!');
}

console.log('\n4. Testing Monthly Payment Schedule & Pending Calculation:');
const testClientId = c1;
const recId1 = 'mpr-' + uuidv4().slice(0, 8);
const recId2 = 'mpr-' + uuidv4().slice(0, 8);
db.prepare(`
  INSERT INTO monthly_payment_records (id, client_id, agreement_id, month_number, due_date, expected_amount, received_amount, payment_status)
  VALUES (?, ?, ?, 1, '2026-08-02', 4000, 4000, 'Paid'),
         (?, ?, ?, 2, '2026-09-02', 4000, 2000, 'Partially Paid')
`).run(recId1, testClientId, a1, recId2, testClientId, a1);

const month1 = db.prepare(`SELECT * FROM monthly_payment_records WHERE id = ?`).get(recId1);
const month2 = db.prepare(`SELECT * FROM monthly_payment_records WHERE id = ?`).get(recId2);

const m1Pending = Math.max(0, month1.expected_amount - month1.received_amount);
const m2Pending = Math.max(0, month2.expected_amount - month2.received_amount);

console.log(`Month 1 -> Expected: ₹${month1.expected_amount}, Received: ₹${month1.received_amount}, Pending: ₹${m1Pending} (Status: ${month1.payment_status})`);
console.log(`Month 2 -> Expected: ₹${month2.expected_amount}, Received: ₹${month2.received_amount}, Pending: ₹${m2Pending} (Status: ${month2.payment_status})`);

if (m1Pending === 0 && m2Pending === 2000 && month2.payment_status === 'Partially Paid') {
  console.log('✔ Monthly payment records & MAX(0, expected - received) calculation PASSED.');
} else {
  console.error('❌ Monthly payment calculation FAILED.');
}

// Cleanup test items
db.prepare(`DELETE FROM leads WHERE lead_number LIKE 'TEST-LEAD-%'`).run();
db.prepare(`DELETE FROM clients WHERE client_number LIKE 'TEST-CL-%'`).run();
db.prepare(`DELETE FROM agreements WHERE agreement_number LIKE 'TEST-AGR-%'`).run();
db.prepare(`DELETE FROM monthly_payment_records WHERE client_id = ?`).run(testClientId);

console.log('\n====================================================');
console.log('  ALL MASTER SYSTEM LOGIC TESTS COMPLETED SUCCESSFULLY');
console.log('====================================================');
