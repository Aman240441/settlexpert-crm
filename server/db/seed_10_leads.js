const db = require('./database');
const { v4: uuidv4 } = require('uuid');

// Bulletproof helper to generate sequential permanent IDs: LEAD-0001, LEAD-0002...
function generateLeadId() {
  const rows = db.prepare(`SELECT lead_number as num FROM leads WHERE lead_number LIKE 'LEAD-%'`).all();
  let maxNum = 0;
  for (const row of rows) {
    const match = row.num && row.num.match(/^LEAD-(\d+)$/);
    if (match) {
      const val = parseInt(match[1], 10);
      if (!isNaN(val) && val > maxNum) {
        maxNum = val;
      }
    }
  }
  return `LEAD-${String(maxNum + 1).padStart(4, '0')}`;
}

const testLeads = [
  {
    name: 'Aman Sharma',
    phone: '+91 9811234501',
    email: 'aman.sharma@gmail.com',
    city: 'New Delhi',
    total_debt: 450000,
    monthly_income: 42000,
    service_needed: 'personal_loan_settlement',
    paying_emis: 'Paying With Difficulty',
    harassment_calls: 'Yes',
    employment_status: 'Employed',
    employment_type: 'Salaried',
    status: 'new',
    manager_id: 'mgr-03',
    employee_id: 'emp-03' // Karan Malhotra (Sales)
  },
  {
    name: 'Neha Verma',
    phone: '+91 9811234502',
    email: 'neha.verma@outlook.com',
    city: 'Mumbai',
    total_debt: 820000,
    monthly_income: 65000,
    service_needed: 'credit_card_settlement',
    paying_emis: 'Not Paying',
    harassment_calls: 'Yes',
    employment_status: 'Employed',
    employment_type: 'Salaried',
    status: 'contacted',
    manager_id: 'mgr-03',
    employee_id: 'emp-03'
  },
  {
    name: 'Rahul Singhania',
    phone: '+91 9811234503',
    email: 'rahul.s@yahoo.com',
    city: 'Bengaluru',
    total_debt: 1250000,
    monthly_income: 90000,
    service_needed: 'multiple_loans_settlement',
    paying_emis: 'Paying With Difficulty',
    harassment_calls: 'No',
    employment_status: 'Self Employed',
    employment_type: 'Business',
    status: 'interested',
    manager_id: 'mgr-03',
    employee_id: 'emp-03'
  },
  {
    name: 'Priyanka Patel',
    phone: '+91 9811234504',
    email: 'priyanka.p@gmail.com',
    city: 'Ahmedabad',
    total_debt: 380000,
    monthly_income: 38000,
    service_needed: 'personal_loan_settlement',
    paying_emis: 'Not Paying',
    harassment_calls: 'Yes',
    employment_status: 'Employed',
    employment_type: 'Salaried',
    status: 'follow_up',
    manager_id: 'mgr-03',
    employee_id: 'emp-03'
  },
  {
    name: 'Suresh Iyer',
    phone: '+91 9811234505',
    email: 'suresh.iyer@rediffmail.com',
    city: 'Chennai',
    total_debt: 950000,
    monthly_income: 75000,
    service_needed: 'multiple_loans_settlement',
    paying_emis: 'Paying',
    harassment_calls: 'No',
    employment_status: 'Employed',
    employment_type: 'Salaried',
    status: 'converted',
    manager_id: 'mgr-03',
    employee_id: 'emp-03'
  },
  {
    name: 'Amitabh Sen',
    phone: '+91 9811234506',
    email: 'amitabh.sen@gmail.com',
    city: 'Kolkata',
    total_debt: 290000,
    monthly_income: 32000,
    service_needed: 'credit_card_settlement',
    paying_emis: 'Paying',
    harassment_calls: 'No',
    employment_status: 'Employed',
    employment_type: 'Salaried',
    status: 'not_interested',
    manager_id: 'mgr-03',
    employee_id: 'emp-03'
  },
  {
    name: 'Deepak Choudhary',
    phone: '+91 9811234507',
    email: 'deepak.c@hotmail.com',
    city: 'Jaipur',
    total_debt: 670000,
    monthly_income: 50000,
    service_needed: 'personal_loan_settlement',
    paying_emis: 'Paying With Difficulty',
    harassment_calls: 'Yes',
    employment_status: 'Employed',
    employment_type: 'Salaried',
    status: 'new',
    manager_id: 'mgr-01',
    employee_id: 'emp-01' // Vikram Mehta (Legal/Consultant)
  },
  {
    name: 'Ankita Kulkarni',
    phone: '+91 9811234508',
    email: 'ankita.k@gmail.com',
    city: 'Pune',
    total_debt: 1100000,
    monthly_income: 82000,
    service_needed: 'multiple_loans_settlement',
    paying_emis: 'Not Paying',
    harassment_calls: 'Yes',
    employment_status: 'Employed',
    employment_type: 'Salaried',
    status: 'contacted',
    manager_id: 'mgr-01',
    employee_id: 'emp-01'
  },
  {
    name: 'Manish Rawat',
    phone: '+91 9811234509',
    email: 'manish.rawat@gmail.com',
    city: 'Dehradun',
    total_debt: 520000,
    monthly_income: 45000,
    service_needed: 'personal_loan_settlement',
    paying_emis: 'Paying With Difficulty',
    harassment_calls: 'No',
    employment_status: 'Self Employed',
    employment_type: 'Business',
    status: 'interested',
    manager_id: 'mgr-01',
    employee_id: 'emp-01'
  },
  {
    name: 'Sunita Mehra',
    phone: '+91 9811234510',
    email: 'sunita.mehra@gmail.com',
    city: 'Lucknow',
    total_debt: 780000,
    monthly_income: 58000,
    service_needed: 'credit_card_settlement',
    paying_emis: 'Not Paying',
    harassment_calls: 'Yes',
    employment_status: 'Employed',
    employment_type: 'Salaried',
    status: 'follow_up',
    manager_id: 'mgr-01',
    employee_id: 'emp-01'
  }
];

const insertLead = db.prepare(`
  INSERT INTO leads (
    id, lead_number, name, phone, email, city, total_debt, monthly_income,
    service_needed, paying_emis, harassment_calls, employment_status, employment_type,
    status, manager_id, employee_id, created_by, created_at, updated_at
  ) VALUES (
    ?, ?, ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?, ?, 'System Seed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  )
`);

const insertFollowUp = db.prepare(`
  INSERT INTO follow_ups (
    id, lead_id, user_id, user_name, call_status, interested_level,
    final_status, remark, next_follow_up_date, created_at
  ) VALUES (
    ?, ?, ?, ?, ?, ?,
    ?, ?, ?, CURRENT_TIMESTAMP
  )
`);

console.log('Inserting 10 test leads into Employee CRM database...');

let insertedCount = 0;
for (const lead of testLeads) {
  // Check if lead with this phone already exists
  const existing = db.prepare('SELECT id FROM leads WHERE phone = ?').get(lead.phone);
  if (!existing) {
    const leadId = `lead-test-${uuidv4().substring(0, 8)}`;
    const leadNumber = generateLeadId();
    insertLead.run(
      leadId,
      leadNumber,
      lead.name,
      lead.phone,
      lead.email,
      lead.city,
      lead.total_debt,
      lead.monthly_income,
      lead.service_needed,
      lead.paying_emis,
      lead.harassment_calls,
      lead.employment_status,
      lead.employment_type,
      lead.status,
      lead.manager_id,
      lead.employee_id
    );

    // If status is follow_up or contacted, add initial follow up record
    if (lead.status === 'follow_up' || lead.status === 'contacted' || lead.status === 'interested') {
      insertFollowUp.run(
        `fu-${uuidv4().substring(0, 8)}`,
        leadId,
        lead.employee_id,
        'Consultant',
        'Connected',
        lead.status === 'interested' ? 'High' : 'Medium',
        lead.status,
        'Initial client discovery call completed. Discussed personal loan debt settlement relief.',
        '2026-08-25'
      );
    }

    console.log(`✓ Inserted: ${leadNumber} - ${lead.name} (${lead.city}) [${lead.status}]`);
    insertedCount++;
  } else {
    console.log(`- Lead with phone ${lead.phone} already exists.`);
  }
}

console.log(`\nSuccessfully inserted ${insertedCount} test leads!`);
