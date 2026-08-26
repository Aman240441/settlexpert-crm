const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const XLSX = require('xlsx');
const db = require('../db/database');
const { authenticateToken, requireManagerOrAdmin, logAudit, getManagerScope } = require('../middleware/auth');

// Sequential ID helper for LEAD-XXXX, IMP-XXXX, DIST-XXXX
function generateSequentialId(table, column, prefix) {
  const rows = db.prepare(`SELECT ${column} as num FROM ${table} WHERE ${column} LIKE '${prefix}-%'`).all();
  let maxNum = 0;
  for (const row of rows) {
    const match = row.num && row.num.match(new RegExp(`^${prefix}-(\\d+)$`));
    if (match) {
      const val = parseInt(match[1], 10);
      if (!isNaN(val) && val > maxNum) {
        maxNum = val;
      }
    }
  }
  return `${prefix}-${String(maxNum + 1).padStart(4, '0')}`;
}

function normalizePhone(phone) {
  if (!phone) return '';
  let str = String(phone).trim();
  // Keep digits and leading plus
  str = str.replace(/[^\d+]/g, '');
  if (str.startsWith('+91')) {
    const digits = str.slice(3);
    if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  } else if (str.length === 10 && /^\d+$/.test(str)) {
    return `+91 ${str.slice(0, 5)} ${str.slice(5)}`;
  }
  return str;
}

function cleanPhoneForComparison(phone) {
  if (!phone) return '';
  return String(phone).replace(/[^\d]/g, '').slice(-10); // Last 10 digits for accurate matching
}

// ─── 1. DOWNLOAD SAMPLE EXCEL TEMPLATE ───────────────────────────────────────
router.get('/template', authenticateToken, requireManagerOrAdmin, (req, res) => {
  try {
    const format = (req.query.format || 'xlsx').toLowerCase();
    
    const sampleData = [
      {
        'Name': 'Rahul Verma',
        'Phone': '+91 9876543210',
        'Email': 'rahul.verma@example.com',
        'City': 'Mumbai',
        'Total Outstanding Amount': 850000,
        'Monthly Income': 45000,
        'Loan Type': 'Credit Card & Personal Loan',
        'Default Status': 'Defaulted',
        'Harassment Calls': 'Yes',
        'Employment Status': 'Employed',
        'Employment Type': 'Salaried',
        'Settlement Needed': 'Yes',
        'Consultation Timing': 'Evening 4 PM - 7 PM',
        'Credit Card Dues': 350000,
        'Personal Loan Dues': 500000,
        'Service Fee': 0,
        'Lead Status': 'new',
        'Remarks': 'Needs urgent debt resolution for 3 credit cards and 1 personal loan'
      },
      {
        'Name': 'Pooja Agarwal',
        'Phone': '+91 9812345678',
        'Email': 'pooja.agarwal@example.com',
        'City': 'Delhi',
        'Total Outstanding Amount': 1200000,
        'Monthly Income': 65000,
        'Loan Type': 'Personal Loan',
        'Default Status': 'Notice Received',
        'Harassment Calls': 'Yes',
        'Employment Status': 'Employed',
        'Employment Type': 'Salaried',
        'Settlement Needed': 'Yes',
        'Consultation Timing': 'Morning 10 AM - 1 PM',
        'Credit Card Dues': 200000,
        'Personal Loan Dues': 1000000,
        'Service Fee': 0,
        'Lead Status': 'new',
        'Remarks': 'Looking for one-time settlement with HDFC Bank'
      },
      {
        'Name': 'Suresh Nair',
        'Phone': '+91 9745612345',
        'Email': 'suresh.nair@example.com',
        'City': 'Bengaluru',
        'Total Outstanding Amount': 600000,
        'Monthly Income': 38000,
        'Loan Type': 'Credit Card',
        'Default Status': 'Under Stress',
        'Harassment Calls': 'No',
        'Employment Status': 'Self Employed',
        'Employment Type': 'Business',
        'Settlement Needed': 'Yes',
        'Consultation Timing': 'Afternoon 2 PM - 4 PM',
        'Credit Card Dues': 600000,
        'Personal Loan Dues': 0,
        'Service Fee': 0,
        'Lead Status': 'new',
        'Remarks': 'Facing high interest burden, seeking monthly repayment plan'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    
    // Set auto column widths
    const colWidths = [
      { wch: 18 }, { wch: 16 }, { wch: 25 }, { wch: 14 },
      { wch: 24 }, { wch: 16 }, { wch: 28 }, { wch: 16 },
      { wch: 16 }, { wch: 18 }, { wch: 16 }, { wch: 18 },
      { wch: 22 }, { wch: 18 }, { wch: 18 }, { wch: 14 },
      { wch: 14 }, { wch: 40 }
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Lead_Import_Template');

    if (format === 'csv') {
      const csvData = XLSX.utils.sheet_to_csv(worksheet);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="settl_expert_leads_template.csv"');
      return res.send(csvData);
    }

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="settl_expert_leads_template.xlsx"');
    return res.send(buffer);
  } catch (err) {
    console.error('Error generating lead template:', err);
    res.status(500).json({ error: 'Failed to generate template', details: err.message });
  }
});

// ─── 2. PREVIEW LEADS (VALIDATION & DUPLICATE DETECTION) ─────────────────────
router.post('/preview', authenticateToken, requireManagerOrAdmin, (req, res) => {
  try {
    let rawRows = req.body.rows;

    // Support Base64 file payload if passed directly
    if (req.body.fileData) {
      const buffer = Buffer.from(req.body.fileData, 'base64');
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    }

    if (!Array.isArray(rawRows) || rawRows.length === 0) {
      return res.status(400).json({ error: 'No data rows found in uploaded file' });
    }

    // Fetch all existing phones & emails from database for high-performance in-memory lookup
    const existingLeads = db.prepare(`SELECT id, lead_number, phone, email, name FROM leads`).all();
    
    const existingPhoneMap = new Map(); // last 10 digits -> lead info
    const existingEmailMap = new Map(); // lowercase email -> lead info

    for (const lead of existingLeads) {
      if (lead.phone) {
        const cleanP = cleanPhoneForComparison(lead.phone);
        if (cleanP.length >= 10) existingPhoneMap.set(cleanP, lead);
      }
      if (lead.email) {
        existingEmailMap.set(lead.email.trim().toLowerCase(), lead);
      }
    }

    const seenFilePhones = new Set();
    const seenFileEmails = new Set();

    const previewRows = [];
    const validRows = [];
    const duplicateRows = [];
    const invalidRows = [];

    rawRows.forEach((row, index) => {
      const rowNumber = index + 1;
      
      // Column normalization (Case-insensitive & flexible header mapping)
      const getVal = (...keys) => {
        for (const k of keys) {
          for (const rowKey of Object.keys(row)) {
            if (rowKey.trim().toLowerCase() === k.trim().toLowerCase()) {
              return row[rowKey];
            }
          }
        }
        return '';
      };

      const name = String(getVal('Name', 'Full Name', 'Customer Name', 'Client Name', 'Lead Name') || '').trim();
      const rawPhone = String(getVal('Phone', 'Mobile', 'Phone Number', 'Mobile Number', 'Contact', 'Contact Number') || '').trim();
      const rawEmail = String(getVal('Email', 'Email Address', 'Mail') || '').trim();
      const city = String(getVal('City', 'Location', 'Town') || '').trim();
      
      const totalDebt = parseFloat(String(getVal('Total Outstanding Amount', 'Total Debt', 'Outstanding Amount', 'Debt Amount', 'Amount') || 0).replace(/[^0-9.]/g, '')) || 0;
      const monthlyIncome = parseFloat(String(getVal('Monthly Income', 'Income', 'Salary') || 0).replace(/[^0-9.]/g, '')) || 0;
      const creditCardDues = parseFloat(String(getVal('Credit Card Dues', 'Credit Card Debt', 'CC Dues') || 0).replace(/[^0-9.]/g, '')) || 0;
      const personalLoanDues = parseFloat(String(getVal('Personal Loan Dues', 'Personal Loan Debt', 'PL Dues') || 0).replace(/[^0-9.]/g, '')) || 0;
      const serviceFee = parseFloat(String(getVal('Service Fee', 'SX Fee', 'Fee') || 0).replace(/[^0-9.]/g, '')) || 0;

      const loanType = String(getVal('Loan Type', 'Type of Loan', 'Service Needed') || 'Credit Card & Personal Loan').trim();
      const defaultStatus = String(getVal('Default Status', 'Status of Default') || 'Defaulted').trim();
      const harassmentCalls = String(getVal('Harassment Calls', 'Recovery Calls') || 'No').trim();
      const employmentStatus = String(getVal('Employment Status') || 'Employed').trim();
      const employmentType = String(getVal('Employment Type') || 'Salaried').trim();
      const settlementNeeded = String(getVal('Settlement Needed') || 'Yes').trim();
      const consultationTiming = String(getVal('Consultation Timing', 'Preferred Timing') || 'Anytime').trim();
      const leadStatus = String(getVal('Lead Status', 'Status') || 'new').trim().toLowerCase();
      const remarks = String(getVal('Remarks', 'Notes', 'Comment') || '').trim();

      const cleanPhone = cleanPhoneForComparison(rawPhone);
      const cleanEmail = rawEmail.toLowerCase();

      let isValid = true;
      let isDuplicate = false;
      let reason = '';

      // 1. Validation Rules
      if (!name) {
        isValid = false;
        reason = 'Missing Name (Required)';
      } else if (!rawPhone || cleanPhone.length < 10) {
        isValid = false;
        reason = 'Invalid Phone Number (Must be at least 10 digits)';
      } else if (rawEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        isValid = false;
        reason = 'Invalid Email format';
      }

      // 2. Duplicate Detection (DB & Within File)
      if (isValid) {
        if (existingPhoneMap.has(cleanPhone)) {
          isDuplicate = true;
          isValid = false;
          const match = existingPhoneMap.get(cleanPhone);
          reason = `Duplicate Phone: already exists in CRM as ${match.lead_number} (${match.name})`;
        } else if (cleanEmail && existingEmailMap.has(cleanEmail)) {
          isDuplicate = true;
          isValid = false;
          const match = existingEmailMap.get(cleanEmail);
          reason = `Duplicate Email: already exists in CRM as ${match.lead_number} (${match.name})`;
        } else if (seenFilePhones.has(cleanPhone)) {
          isDuplicate = true;
          isValid = false;
          reason = `Duplicate Phone: repeated in uploaded file`;
        } else if (cleanEmail && seenFileEmails.has(cleanEmail)) {
          isDuplicate = true;
          isValid = false;
          reason = `Duplicate Email: repeated in uploaded file`;
        }
      }

      if (cleanPhone) seenFilePhones.add(cleanPhone);
      if (cleanEmail) seenFileEmails.add(cleanEmail);

      const normalizedRecord = {
        rowNumber,
        name,
        phone: normalizePhone(rawPhone) || rawPhone,
        rawPhone,
        email: rawEmail,
        city,
        total_debt: totalDebt,
        monthly_income: monthlyIncome,
        credit_card_dues: creditCardDues,
        personal_loan_dues: personalLoanDues,
        service_fee: serviceFee,
        loan_type: loanType,
        default_status: defaultStatus,
        harassment_calls: harassmentCalls,
        employment_status: employmentStatus,
        employment_type: employmentType,
        settlement_needed: settlementNeeded,
        consultation_timing: consultationTiming,
        status: leadStatus || 'new',
        remarks,
        validationStatus: isValid ? 'valid' : isDuplicate ? 'duplicate' : 'invalid',
        validationReason: reason || 'Valid Lead'
      };

      previewRows.push(normalizedRecord);

      if (isValid) {
        validRows.push(normalizedRecord);
      } else if (isDuplicate) {
        duplicateRows.push(normalizedRecord);
      } else {
        invalidRows.push(normalizedRecord);
      }
    });

    return res.json({
      totalRows: previewRows.length,
      validCount: validRows.length,
      duplicateCount: duplicateRows.length,
      invalidCount: invalidRows.length,
      previewRows: previewRows.slice(0, 500), // Preview top 500 rows
      validRows,
      duplicateRows,
      invalidRows
    });
  } catch (err) {
    console.error('Error previewing lead import:', err);
    res.status(500).json({ error: 'Failed to process preview', details: err.message });
  }
});

// ─── 3. EXECUTE IMPORT (BULK INSERT CANONICAL LEADS) ─────────────────────────
router.post('/execute', authenticateToken, requireManagerOrAdmin, (req, res) => {
  try {
    const { validRows, fileName } = req.body;

    if (!Array.isArray(validRows) || validRows.length === 0) {
      return res.status(400).json({ error: 'No valid leads provided for import' });
    }

    const importId = 'imp-' + uuidv4().slice(0, 8);
    const importNumber = generateSequentialId('lead_imports', 'import_number', 'IMP');
    const uploadedBy = req.user.id;
    const uploadedByName = req.user.name || 'Admin';
    const uploadedByRole = req.user.role;

    const importedLeads = [];

    const insertLeadStmt = db.prepare(`
      INSERT INTO leads (
        id, lead_number, name, email, phone, city,
        total_debt, monthly_income, service_needed, paying_emis,
        harassment_calls, employment_status, employment_type,
        settlement_needed, consultation_timing, credit_card_dues,
        personal_loan_dues, service_fee, bank_name, status,
        manager_id, employee_id, department_id, created_by,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `);

    // Run in a single atomic transaction
    const insertTransaction = db.transaction(() => {
      // Find starting sequential number for leads
      const rows = db.prepare(`SELECT lead_number as num FROM leads WHERE lead_number LIKE 'LEAD-%'`).all();
      let maxNum = 0;
      for (const r of rows) {
        const match = r.num && r.num.match(/^LEAD-(\d+)$/);
        if (match) {
          const val = parseInt(match[1], 10);
          if (!isNaN(val) && val > maxNum) maxNum = val;
        }
      }

      for (let i = 0; i < validRows.length; i++) {
        const item = validRows[i];
        maxNum++;
        const leadId = 'lead-' + uuidv4().slice(0, 8);
        const leadNumber = `LEAD-${String(maxNum).padStart(4, '0')}`;

        insertLeadStmt.run(
          leadId,
          leadNumber,
          item.name.trim(),
          item.email ? item.email.trim().toLowerCase() : null,
          item.phone ? item.phone.trim() : item.rawPhone,
          item.city ? item.city.trim() : null,
          Number(item.total_debt) || 0,
          Number(item.monthly_income) || 0,
          item.loan_type || 'Credit Card & Personal Loan',
          'Yes',
          item.harassment_calls || 'No',
          item.employment_status || 'Employed',
          item.employment_type || 'Salaried',
          item.settlement_needed || 'Yes',
          item.consultation_timing || 'Anytime',
          Number(item.credit_card_dues) || 0,
          Number(item.personal_loan_dues) || 0,
          Number(item.service_fee) || 0,
          item.loan_type || null,
          item.status || 'new',
          req.user.role === 'manager' ? req.user.id : (item.manager_id || null),
          item.employee_id || null, // employee_id assigned directly if selected
          null,
          req.user.id
        );

        if (item.employee_id) {
          const emp = db.prepare(`SELECT id, name FROM users WHERE id = ?`).get(item.employee_id);
          if (emp) {
            db.prepare(`
              INSERT INTO lead_assignment_history (
                id, lead_id, distribution_id, previous_employee_id,
                previous_employee_name, assigned_employee_id, assigned_employee_name,
                assigned_by, assigned_by_name, assigned_by_role, reassignment_reason
              ) VALUES (?, ?, NULL, NULL, NULL, ?, ?, ?, ?, ?, 'Direct Manual Assignment')
            `).run(
              'ah-' + uuidv4().slice(0, 8),
              leadId,
              emp.id,
              emp.name,
              req.user.id,
              req.user.name || 'Admin',
              req.user.role
            );
          }
        }

        importedLeads.push({
          id: leadId,
          lead_number: leadNumber,
          name: item.name,
          phone: item.phone,
          email: item.email,
          city: item.city,
          total_debt: item.total_debt,
          employee_id: item.employee_id || null,
          status: item.status || 'new'
        });
      }

      // Record in lead_imports table
      db.prepare(`
        INSERT INTO lead_imports (
          id, import_number, file_name, uploaded_by, uploaded_by_name,
          uploaded_by_role, total_rows, valid_leads, duplicate_leads,
          invalid_rows, imported_leads, distribution_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `).run(
        importId,
        importNumber,
        fileName || 'leads_import.xlsx',
        uploadedBy,
        uploadedByName,
        uploadedByRole,
        Number(req.body.totalRows) || validRows.length,
        validRows.length,
        Number(req.body.duplicateCount) || 0,
        Number(req.body.invalidCount) || 0,
        validRows.length
      );
    });

    insertTransaction();

    logAudit(req, 'Excel Leads Imported', 'Leads', importId, {
      import_number: importNumber,
      imported_count: validRows.length,
      file_name: fileName
    });

    return res.status(201).json({
      message: `${validRows.length} leads successfully imported`,
      import_id: importId,
      import_number: importNumber,
      imported_count: validRows.length,
      imported_lead_ids: importedLeads.map(l => l.id),
      imported_leads: importedLeads
    });
  } catch (err) {
    console.error('Error executing lead import:', err);
    res.status(500).json({ error: 'Failed to import leads', details: err.message });
  }
});

// ─── 4. EMPLOYEES WORKLOAD VIEW ─────────────────────────────────────────────
router.get('/employees-workload', authenticateToken, requireManagerOrAdmin, (req, res) => {
  try {
    const mgrScope = getManagerScope(req);

    let employeesQuery = `
      SELECT u.id, u.name, u.email, u.phone, u.emp_or_mgr_id, u.department_id,
             u.manager_id, d.name as department_name, m.name as manager_name,
             u.status
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN users m ON u.manager_id = m.id
      WHERE u.role = 'employee' AND u.status = 'active'
    `;

    const queryParams = [];

    // Enforce Manager Scoping
    if (!mgrScope.isAdmin) {
      employeesQuery += ` AND (u.manager_id = ? OR u.department_id = ?)`;
      queryParams.push(mgrScope.managerId, mgrScope.departmentId);
    }

    employeesQuery += ` ORDER BY u.name ASC`;
    const employees = db.prepare(employeesQuery).all(...queryParams);

    // Calculate real-time workload metrics for each employee
    const workloadList = employees.map(emp => {
      // 1. Total Leads Assigned
      const totalAssigned = db.prepare(`SELECT COUNT(*) as c FROM leads WHERE employee_id = ?`).get(emp.id).c;
      
      // 2. New Leads
      const newLeads = db.prepare(`SELECT COUNT(*) as c FROM leads WHERE employee_id = ? AND status = 'new'`).get(emp.id).c;
      
      // 3. Active Leads
      const activeLeads = db.prepare(`
        SELECT COUNT(*) as c FROM leads 
        WHERE employee_id = ? AND status IN ('new', 'contacted', 'interested', 'follow_up', 'in_progress', 'negotiating')
      `).get(emp.id).c;

      // 4. Follow-ups logged
      const followUpsCount = db.prepare(`
        SELECT COUNT(*) as c FROM follow_ups WHERE user_id = ?
      `).get(emp.id).c;

      // 5. Converted Clients
      const convertedClients = db.prepare(`
        SELECT COUNT(*) as c FROM clients WHERE employee_id = ?
      `).get(emp.id).c;

      return {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        phone: emp.phone,
        emp_or_mgr_id: emp.emp_or_mgr_id || emp.id,
        department_name: emp.department_name || 'General',
        manager_name: emp.manager_name || 'Direct',
        new_leads: newLeads,
        active_leads: activeLeads,
        follow_ups: followUpsCount,
        converted_clients: convertedClients,
        total_assigned: totalAssigned
      };
    });

    return res.json({ employees: workloadList });
  } catch (err) {
    console.error('Error fetching employee workload:', err);
    res.status(500).json({ error: 'Failed to load employee workload', details: err.message });
  }
});

// ─── 5. DISTRIBUTE LEADS (EQUAL & CUSTOM MODES) ──────────────────────────────
router.post('/distribute', authenticateToken, requireManagerOrAdmin, (req, res) => {
  try {
    const {
      lead_ids,
      mode = 'equal', // 'equal' | 'custom'
      assignment_method = 'sequential', // 'sequential' | 'random'
      assignments = [], // [{ employee_id: string, count: number }]
      import_id = null
    } = req.body;

    if (!Array.isArray(lead_ids) || lead_ids.length === 0) {
      return res.status(400).json({ error: 'Please select at least one lead to distribute' });
    }

    if (!Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({ error: 'Please select at least one employee for distribution' });
    }

    const mgrScope = getManagerScope(req);

    // Validate employee permissions for Managers
    if (!mgrScope.isAdmin) {
      for (const a of assignments) {
        if (!mgrScope.employeeIds.includes(a.employee_id)) {
          return res.status(403).json({
            error: `Unauthorized: Employee (${a.employee_id}) does not belong to your authorized team.`
          });
        }
      }
    }

    const totalLeads = lead_ids.length;
    let distributionPlan = [];

    if (mode === 'equal') {
      const empCount = assignments.length;
      const basePerEmp = Math.floor(totalLeads / empCount);
      let remainder = totalLeads % empCount;

      distributionPlan = assignments.map((a, idx) => {
        let count = basePerEmp;
        if (idx < remainder) {
          count += 1;
        }
        return {
          employee_id: a.employee_id,
          count
        };
      });
    } else {
      // Custom distribution: Verify exact sum
      const totalCustomAssigned = assignments.reduce((sum, a) => sum + (Number(a.count) || 0), 0);
      if (totalCustomAssigned !== totalLeads) {
        return res.status(400).json({
          error: `Distribution quantity does not match available leads. Assigned: ${totalCustomAssigned}, Available: ${totalLeads}`
        });
      }
      distributionPlan = assignments.map(a => ({
        employee_id: a.employee_id,
        count: Number(a.count) || 0
      }));
    }

    // Prepare leads order: sequential or random
    let orderedLeadIds = [...lead_ids];
    if (assignment_method === 'random') {
      // Fisher-Yates Shuffle
      for (let i = orderedLeadIds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [orderedLeadIds[i], orderedLeadIds[j]] = [orderedLeadIds[j], orderedLeadIds[i]];
      }
    }

    const distId = 'dist-' + uuidv4().slice(0, 8);
    const distNumber = generateSequentialId('lead_distributions', 'distribution_number', 'DIST');

    const updateLeadStmt = db.prepare(`
      UPDATE leads 
      SET employee_id = ?, 
          manager_id = COALESCE(?, manager_id),
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);

    const insertHistoryStmt = db.prepare(`
      INSERT INTO lead_assignment_history (
        id, lead_id, distribution_id, previous_employee_id,
        previous_employee_name, assigned_employee_id, assigned_employee_name,
        assigned_by, assigned_by_name, assigned_by_role, reassignment_reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const validImport = import_id ? db.prepare(`SELECT id FROM lead_imports WHERE id = ?`).get(import_id) : null;
    const safeImportId = validImport ? validImport.id : null;

    const validUser = req.user && req.user.id ? db.prepare(`SELECT id FROM users WHERE id = ?`).get(req.user.id) : null;
    const safeUserId = validUser ? validUser.id : null;

    const summaryReport = [];
    let leadIndex = 0;

    const distributeTransaction = db.transaction(() => {
      // 1. Insert parent distribution record first to satisfy foreign key constraints
      db.prepare(`
        INSERT INTO lead_distributions (
          id, distribution_number, import_id, distributed_by,
          distributed_by_name, distributed_by_role, distribution_mode,
          assignment_method, total_leads, employee_count, summary_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        distId,
        distNumber,
        safeImportId,
        safeUserId,
        req.user.name || 'Admin',
        req.user.role,
        mode,
        assignment_method,
        totalLeads,
        distributionPlan.length,
        '[]'
      );

      // 2. Assign leads and create history records
      for (const item of distributionPlan) {
        if (item.count <= 0) continue;

        const emp = db.prepare(`SELECT id, name, manager_id FROM users WHERE id = ?`).get(item.employee_id);
        const empName = emp ? emp.name : 'Employee';
        const validMgr = emp && emp.manager_id ? db.prepare(`SELECT id FROM users WHERE id = ?`).get(emp.manager_id) : null;
        const safeMgrId = req.user.role === 'manager' ? safeUserId : (validMgr ? validMgr.id : null);

        const assignedLeadsForEmp = [];

        for (let c = 0; c < item.count; c++) {
          if (leadIndex >= orderedLeadIds.length) break;
          const currentLeadId = orderedLeadIds[leadIndex];
          leadIndex++;

          // Fetch previous assignment if any
          const prevLead = db.prepare(`
            SELECT l.id, l.employee_id, u.name as employee_name 
            FROM leads l 
            LEFT JOIN users u ON l.employee_id = u.id 
            WHERE l.id = ?
          `).get(currentLeadId);

          const prevEmpId = prevLead && prevLead.employee_id ? prevLead.employee_id : null;
          const validPrevEmp = prevEmpId ? db.prepare(`SELECT id FROM users WHERE id = ?`).get(prevEmpId) : null;
          const safePrevEmpId = validPrevEmp ? validPrevEmp.id : null;
          const prevEmpName = prevLead ? prevLead.employee_name : null;

          // Update Lead
          updateLeadStmt.run(
            emp.id,
            safeMgrId,
            currentLeadId
          );

          // Record Assignment History
          const historyId = 'ah-' + uuidv4().slice(0, 8);
          insertHistoryStmt.run(
            historyId,
            currentLeadId,
            distId,
            safePrevEmpId,
            prevEmpName,
            emp.id,
            empName,
            safeUserId,
            req.user.name || 'Admin',
            req.user.role,
            mode === 'equal' ? 'Bulk Equal Distribution' : 'Bulk Custom Distribution'
          );

          assignedLeadsForEmp.push(currentLeadId);
        }

        summaryReport.push({
          employee_id: emp.id,
          employee_name: empName,
          count: assignedLeadsForEmp.length
        });
      }

      // 3. Update summary_json on parent distribution record
      db.prepare(`
        UPDATE lead_distributions 
        SET summary_json = ? 
        WHERE id = ?
      `).run(JSON.stringify(summaryReport), distId);

      // 4. If tied to an import, update import status
      if (import_id) {
        db.prepare(`UPDATE lead_imports SET distribution_status = 'distributed' WHERE id = ?`).run(import_id);
      }
    });

    distributeTransaction();

    logAudit(req, 'Leads Distributed', 'Leads', distId, {
      distribution_number: distNumber,
      total_leads: totalLeads,
      mode,
      method: assignment_method,
      summary: summaryReport
    });

    return res.status(200).json({
      message: `${totalLeads} leads successfully assigned to ${summaryReport.length} employees`,
      distribution_id: distId,
      distribution_number: distNumber,
      total_leads: totalLeads,
      summary: summaryReport
    });
  } catch (err) {
    console.error('Error distributing leads detailed stack:', err);
    res.status(500).json({ error: 'Failed to distribute leads', details: err.message, stack: err.stack });
  }
});

// ─── 6. SINGLE / BATCH REASSIGNMENT ─────────────────────────────────────────
router.post('/reassign', authenticateToken, requireManagerOrAdmin, (req, res) => {
  try {
    const { lead_id, lead_ids, new_employee_id, reason = 'Workload Rebalancing' } = req.body;

    const targetLeadIds = lead_ids || (lead_id ? [lead_id] : []);
    if (targetLeadIds.length === 0) {
      return res.status(400).json({ error: 'Please provide lead_id or lead_ids to reassign' });
    }

    if (!new_employee_id) {
      return res.status(400).json({ error: 'Target new_employee_id is required' });
    }

    const mgrScope = getManagerScope(req);
    if (!mgrScope.isAdmin && !mgrScope.employeeIds.includes(new_employee_id)) {
      return res.status(403).json({ error: 'Unauthorized: Cannot reassign to an employee outside your team' });
    }

    const newEmp = db.prepare(`SELECT id, name, manager_id FROM users WHERE id = ?`).get(new_employee_id);
    if (!newEmp) {
      return res.status(404).json({ error: 'Target employee not found' });
    }

    const updateLeadStmt = db.prepare(`
      UPDATE leads 
      SET employee_id = ?, 
          manager_id = COALESCE(?, manager_id),
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);

    const insertHistoryStmt = db.prepare(`
      INSERT INTO lead_assignment_history (
        id, lead_id, distribution_id, previous_employee_id,
        previous_employee_name, assigned_employee_id, assigned_employee_name,
        assigned_by, assigned_by_name, assigned_by_role, reassignment_reason
      ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const reassignedLeads = [];

    const reassignTx = db.transaction(() => {
      for (const id of targetLeadIds) {
        const lead = db.prepare(`
          SELECT l.id, l.lead_number, l.employee_id, u.name as employee_name 
          FROM leads l 
          LEFT JOIN users u ON l.employee_id = u.id 
          WHERE l.id = ?
        `).get(id);

        if (lead) {
          const validPrevEmp = lead.employee_id ? db.prepare(`SELECT id FROM users WHERE id = ?`).get(lead.employee_id) : null;
          const safePrevEmpId = validPrevEmp ? validPrevEmp.id : null;

          const validMgr = newEmp.manager_id ? db.prepare(`SELECT id FROM users WHERE id = ?`).get(newEmp.manager_id) : null;
          const safeMgrId = req.user.role === 'manager' ? req.user.id : (validMgr ? validMgr.id : null);

          updateLeadStmt.run(
            newEmp.id,
            safeMgrId,
            id
          );

          const historyId = 'ah-' + uuidv4().slice(0, 8);
          insertHistoryStmt.run(
            historyId,
            id,
            safePrevEmpId,
            lead.employee_name || null,
            newEmp.id,
            newEmp.name,
            req.user.id,
            req.user.name || 'Admin',
            req.user.role,
            reason
          );

          reassignedLeads.push(lead.lead_number || id);
        }
      }
    });

    reassignTx();

    logAudit(req, 'Leads Reassigned', 'Leads', targetLeadIds[0], {
      reassigned_count: reassignedLeads.length,
      target_employee: newEmp.name,
      reason
    });

    return res.json({
      message: `${reassignedLeads.length} lead(s) successfully reassigned to ${newEmp.name}`,
      reassigned_leads: reassignedLeads
    });
  } catch (err) {
    console.error('Error reassigning leads:', err);
    res.status(500).json({ error: 'Failed to reassign leads', details: err.message });
  }
});

// ─── 7. DISTRIBUTION HISTORY & AUDIT LOGS ───────────────────────────────────
router.get('/history', authenticateToken, requireManagerOrAdmin, (req, res) => {
  try {
    const mgrScope = getManagerScope(req);
    let query = `SELECT * FROM lead_distributions ORDER BY created_at DESC LIMIT 100`;
    let distributions = db.prepare(query).all();

    if (!mgrScope.isAdmin) {
      distributions = distributions.filter(d => d.distributed_by === req.user.id);
    }

    const formatted = distributions.map(d => {
      let summary = [];
      try {
        summary = JSON.parse(d.summary_json || '[]');
      } catch (e) {
        summary = [];
      }
      return {
        ...d,
        summary
      };
    });

    return res.json({ distributions: formatted });
  } catch (err) {
    console.error('Error fetching distribution history:', err);
    res.status(500).json({ error: 'Failed to load history', details: err.message });
  }
});

// ─── 8. LEAD ASSIGNMENT HISTORY (FOR SPECIFIC LEAD) ──────────────────────────
router.get('/lead-history/:leadId', authenticateToken, requireManagerOrAdmin, (req, res) => {
  try {
    const { leadId } = req.params;
    const history = db.prepare(`
      SELECT ah.*, d.distribution_number 
      FROM lead_assignment_history ah 
      LEFT JOIN lead_distributions d ON ah.distribution_id = d.id 
      WHERE ah.lead_id = ? 
      ORDER BY ah.assigned_at DESC, ah.rowid DESC
    `).all(leadId);

    return res.json({ history });
  } catch (err) {
    console.error('Error fetching lead assignment history:', err);
    res.status(500).json({ error: 'Failed to load lead assignment history', details: err.message });
  }
});

// ─── 9. UNASSIGNED LEADS (AVAILABLE FOR BULK DISTRIBUTION) ───────────────────
router.get('/unassigned-leads', authenticateToken, requireManagerOrAdmin, (req, res) => {
  try {
    const mgrScope = getManagerScope(req);
    let query = `
      SELECT l.id, l.lead_number, l.name, l.phone, l.email, l.city,
             l.total_debt, l.status, l.created_at, l.employee_id,
             u.name as employee_name
      FROM leads l
      LEFT JOIN users u ON l.employee_id = u.id
      WHERE l.employee_id IS NULL
    `;
    const params = [];

    if (!mgrScope.isAdmin) {
      query += ` AND (l.manager_id = ? OR l.manager_id IS NULL)`;
      params.push(mgrScope.managerId);
    }

    query += ` ORDER BY l.created_at DESC LIMIT 500`;
    const leads = db.prepare(query).all(...params);

    return res.json({ leads });
  } catch (err) {
    console.error('Error fetching unassigned leads:', err);
    res.status(500).json({ error: 'Failed to load unassigned leads', details: err.message });
  }
});

// ─── 10. DOWNLOAD ERROR REPORT EXCEL / CSV ──────────────────────────────────
router.post('/error-report', authenticateToken, requireManagerOrAdmin, (req, res) => {
  try {
    const { invalidRows = [], duplicateRows = [] } = req.body;
    const allErrors = [...invalidRows, ...duplicateRows];

    if (allErrors.length === 0) {
      return res.status(400).json({ error: 'No errors to generate report' });
    }

    const reportData = allErrors.map(e => ({
      'Row Number': e.rowNumber || '',
      'Error Type': e.validationStatus === 'duplicate' ? 'DUPLICATE LEAD' : 'INVALID ROW',
      'Reason / Details': e.validationReason || '',
      'Name': e.name || '',
      'Phone': e.phone || e.rawPhone || '',
      'Email': e.email || '',
      'City': e.city || '',
      'Total Debt': e.total_debt || '',
      'Remarks': e.remarks || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(reportData);
    worksheet['!cols'] = [
      { wch: 12 }, { wch: 18 }, { wch: 45 }, { wch: 20 },
      { wch: 18 }, { wch: 25 }, { wch: 14 }, { wch: 16 },
      { wch: 30 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Import_Errors');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="lead_import_error_report.xlsx"');
    return res.send(buffer);
  } catch (err) {
    console.error('Error generating error report:', err);
    res.status(500).json({ error: 'Failed to generate error report', details: err.message });
  }
});

module.exports = router;
