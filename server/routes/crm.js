const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticateToken, requireEmployeeOrAdmin, requireManagerOrAdmin, logAudit } = require('../middleware/auth');

// Bulletproof helper to generate sequential permanent IDs: LEAD-0001, CL-0001, AGR-0001...
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

function generateLeadId() {
  return generateSequentialId('leads', 'lead_number', 'LEAD');
}

function generateClientId() {
  return generateSequentialId('clients', 'client_number', 'CL');
}

function generateAgreementId() {
  return generateSequentialId('agreements', 'agreement_number', 'AGR');
}

// Scoping helper for employee data isolation
function getEmployeeScope(req) {
  if (req.user.role === 'admin') {
    return { isScoped: false, employeeId: null };
  }
  return { isScoped: true, employeeId: req.user.id };
}

// ==========================================
// 1. EMPLOYEE DASHBOARD SUMMARY
// ==========================================
// 1. EMPLOYEE DASHBOARD SUMMARY (EXACT REFERENCE SPECIFICATION)
// ==========================================
router.get('/dashboard/summary', authenticateToken, requireEmployeeOrAdmin, (req, res) => {
  try {
    const { isScoped, employeeId } = getEmployeeScope(req);

    // 1. Leads counts
    let leadFilter = isScoped ? `WHERE (l.employee_id = '${employeeId}' OR l.manager_id = '${employeeId}' OR l.created_by = '${req.user.name}')` : '';
    const totalLeads = db.prepare(`SELECT COUNT(*) as count FROM leads l ${leadFilter}`).get().count;

    // 2. Clients counts
    let clientFilter = isScoped ? `WHERE (c.employee_id = '${employeeId}' OR c.manager_id = '${employeeId}')` : '';
    const totalClients = db.prepare(`SELECT COUNT(*) as count FROM clients c ${clientFilter}`).get().count;

    const activeClientsCount = db.prepare(`
      SELECT COUNT(*) as count FROM clients c
      ${clientFilter ? clientFilter + " AND (c.case_status = 'active' OR c.status = 'active')" : "WHERE (c.case_status = 'active' OR c.status = 'active')"}
    `).get().count;

    const droppedClientsCount = db.prepare(`
      SELECT COUNT(*) as count FROM clients c
      ${clientFilter ? clientFilter + " AND (c.case_status = 'dropped' OR c.status = 'dropped')" : "WHERE (c.case_status = 'dropped' OR c.status = 'dropped')"}
    `).get().count;

    const conversionRate = totalLeads > 0 ? Math.round((totalClients / totalLeads) * 100) : 0;

    // 3. Monthly Financial Metrics
    // This month received (Only verified payments count!)
    const monthReceivedRow = db.prepare(`
      SELECT COALESCE(SUM(p.amount), 0) as total
      FROM payments p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE p.status = 'verified' 
        AND strftime('%Y-%m', p.payment_date) = strftime('%Y-%m', 'now')
        ${isScoped ? `AND (c.employee_id = '${employeeId}' OR c.manager_id = '${employeeId}')` : ''}
    `).get();
    const thisMonthCollection = monthReceivedRow.total;

    // Total Expected this month
    const monthExpectedRow = db.prepare(`
      SELECT COALESCE(SUM(c.sx_fee), 0) as total
      FROM clients c
      ${clientFilter ? clientFilter + " AND (c.case_status = 'active' OR c.status = 'active')" : "WHERE (c.case_status = 'active' OR c.status = 'active')"}
    `).get();
    const thisMonthExpected = monthExpectedRow.total || (thisMonthCollection > 0 ? thisMonthCollection * 1.5 : 0);
    const nextMonthExpected = Math.round(thisMonthExpected * 1.1);
    const thisMonthPending = Math.max(0, thisMonthExpected - thisMonthCollection);

    // Dropped Amount
    const droppedAmountRow = db.prepare(`
      SELECT COALESCE(SUM(c.total_debt), 0) as total
      FROM clients c
      ${clientFilter ? clientFilter + " AND (c.case_status = 'dropped' OR c.status = 'dropped')" : "WHERE (c.case_status = 'dropped' OR c.status = 'dropped')"}
    `).get();
    const thisMonthDropAmount = droppedAmountRow.total;

    // 4. Lead Status Pipeline Summary
    const statusCountsRaw = db.prepare(`
      SELECT l.status, COUNT(*) as count 
      FROM leads l
      ${leadFilter}
      GROUP BY l.status
    `).all();

    const statusMap = {
      new: 0,
      contacted: 0,
      interested: 0,
      follow_up: 0,
      converted: 0,
      not_interested: 0
    };

    statusCountsRaw.forEach(row => {
      const s = (row.status || '').toLowerCase().replace(/[\s-]/g, '_');
      if (statusMap[s] !== undefined) {
        statusMap[s] = row.count;
      }
    });

    // 5. Dynamic Rolling 3 Months for Business Summary
    const currentDate = new Date();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const rollingMonths = [];
    for (let i = 2; i >= 0; i--) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      const mColRow = db.prepare(`
        SELECT COALESCE(SUM(p.amount), 0) as total
        FROM payments p
        LEFT JOIN clients c ON p.client_id = c.id
        WHERE p.status = 'verified' 
          AND strftime('%Y-%m', p.payment_date) = ?
          ${isScoped ? `AND (c.employee_id = '${employeeId}' OR c.manager_id = '${employeeId}')` : ''}
      `).get(mStr);

      const mDropRow = db.prepare(`
        SELECT COALESCE(SUM(c.total_debt), 0) as total_amount, COUNT(*) as count
        FROM clients c
        WHERE (c.case_status = 'dropped' OR c.status = 'dropped')
          AND strftime('%Y-%m', c.updated_at) = ?
          ${isScoped ? `AND (c.employee_id = '${employeeId}' OR c.manager_id = '${employeeId}')` : ''}
      `).get(mStr);

      const defaultTargets = [22500, 23750, 25000];
      rollingMonths.push({
        name: monthNames[d.getMonth()],
        year: d.getFullYear(),
        target: defaultTargets[2 - i] || 25000,
        collection: mColRow ? mColRow.total : 0,
        drop: mDropRow ? mDropRow.total_amount : 0
      });
    }

    // 6. User Wise Summary (Scoped to Logged-in Employee)
    const newClientsThisMonth = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(c.sx_fee), 0) as total_fee
      FROM clients c
      WHERE strftime('%Y-%m', c.created_at) = strftime('%Y-%m', 'now')
        ${isScoped ? `AND (c.employee_id = '${employeeId}' OR c.manager_id = '${employeeId}')` : ''}
    `).get();

    const newClientCollection = db.prepare(`
      SELECT COALESCE(SUM(p.amount), 0) as total
      FROM payments p
      INNER JOIN clients c ON p.client_id = c.id
      WHERE p.status = 'verified'
        AND strftime('%Y-%m', c.created_at) = strftime('%Y-%m', 'now')
        ${isScoped ? `AND (c.employee_id = '${employeeId}' OR c.manager_id = '${employeeId}')` : ''}
    `).get().total;

    const userCityRow = db.prepare(`
      SELECT city FROM clients c 
      ${clientFilter ? clientFilter + " AND (city IS NOT NULL AND city != '')" : "WHERE city IS NOT NULL AND city != ''"} 
      LIMIT 1
    `).get();

    const userWiseSummary = [
      {
        sNo: 1,
        allocated: req.user.name || 'Consultant',
        city: userCityRow ? userCityRow.city : 'Headquarters',
        newClients: newClientsThisMonth.count,
        newClientCollection: newClientCollection,
        activeClient: activeClientsCount,
        dropped: droppedClientsCount,
        droppedAmount: thisMonthDropAmount,
        totalTarget: 0, // Not set
        currentMonthCollection: thisMonthCollection,
        toBeCollected: thisMonthPending,
        nextMonthExpected: nextMonthExpected
      }
    ];

    // 7. Advocate Wise Summary (Strictly only advocates associated with this employee's clients)
    const advocateRows = db.prepare(`
      SELECT a.id, a.name, a.address, a.specialization,
             COUNT(c.id) as total_clients,
             SUM(CASE WHEN c.case_status = 'active' OR c.status = 'active' THEN 1 ELSE 0 END) as active_clients,
             SUM(CASE WHEN c.case_status = 'dropped' OR c.status = 'dropped' THEN 1 ELSE 0 END) as dropped_clients,
             SUM(CASE WHEN c.case_status = 'dropped' OR c.status = 'dropped' THEN c.total_debt ELSE 0 END) as dropped_amount,
             SUM(CASE WHEN strftime('%Y-%m', c.created_at) = strftime('%Y-%m', 'now') THEN 1 ELSE 0 END) as new_clients
      FROM clients c
      INNER JOIN advocates a ON c.advocate_id = a.id
      ${clientFilter}
      GROUP BY a.id
    `).all();

    const advocateWiseSummary = advocateRows.map((adv, idx) => {
      const advCollection = db.prepare(`
        SELECT COALESCE(SUM(p.amount), 0) as total
        FROM payments p
        INNER JOIN clients c ON p.client_id = c.id
        WHERE p.status = 'verified'
          AND c.advocate_id = ?
          AND strftime('%Y-%m', p.payment_date) = strftime('%Y-%m', 'now')
          ${isScoped ? `AND (c.employee_id = '${employeeId}' OR c.manager_id = '${employeeId}')` : ''}
      `).get(adv.id).total;

      const advNewCol = db.prepare(`
        SELECT COALESCE(SUM(p.amount), 0) as total
        FROM payments p
        INNER JOIN clients c ON p.client_id = c.id
        WHERE p.status = 'verified'
          AND c.advocate_id = ?
          AND strftime('%Y-%m', c.created_at) = strftime('%Y-%m', 'now')
          ${isScoped ? `AND (c.employee_id = '${employeeId}' OR c.manager_id = '${employeeId}')` : ''}
      `).get(adv.id).total;

      const advExpected = db.prepare(`
        SELECT COALESCE(SUM(c.sx_fee), 0) as total
        FROM clients c
        WHERE c.advocate_id = ?
          AND (c.case_status = 'active' OR c.status = 'active')
          ${isScoped ? `AND (c.employee_id = '${employeeId}' OR c.manager_id = '${employeeId}')` : ''}
      `).get(adv.id).total;

      const advPending = Math.max(0, advExpected - advCollection);

      return {
        sNo: idx + 1,
        advocate: adv.name,
        address: adv.address || adv.specialization || 'N/A',
        newClients: adv.new_clients || 0,
        newClientCollection: advNewCol,
        activeClient: adv.active_clients || 0,
        dropped: adv.dropped_clients || 0,
        droppedAmount: adv.dropped_amount || 0,
        currentMonthCollection: advCollection,
        toBeCollected: advPending,
        nextMonthExpected: Math.round(advExpected * 1.1)
      };
    });

    // 8. Active Clients Table for Dashboard
    const activeClientsList = db.prepare(`
      SELECT c.*, 
             u.name as employee_name,
             a.name as advocate_name,
             COALESCE((SELECT SUM(amount) FROM payments p WHERE p.client_id = c.id AND p.status = 'verified'), 0) as received_amount
      FROM clients c
      LEFT JOIN users u ON c.employee_id = u.id
      LEFT JOIN advocates a ON c.advocate_id = a.id
      ${clientFilter ? clientFilter + " AND (c.case_status = 'active' OR c.status = 'active')" : "WHERE (c.case_status = 'active' OR c.status = 'active')"}
      ORDER BY c.created_at DESC LIMIT 15
    `).all();

    const processedActiveClients = activeClientsList.map((c, idx) => {
      const fee = c.sx_fee || (c.total_debt ? c.total_debt * 0.1 : 25000);
      const rec = c.received_amount || 0;
      const pending = Math.max(0, fee - rec);
      let fStatus = c.fees_status || (rec >= fee ? 'Paid' : rec > 0 ? 'Partial' : 'Pending');
      return {
        ...c,
        sNo: idx + 1,
        sx_fee: fee,
        pending_amount: pending,
        received_amount: rec,
        fees_status: fStatus,
        fees_date: c.fees_date || (c.created_at ? c.created_at.substring(0, 10) : '2026-08-01')
      };
    });

    const currentMonthName = monthNames[currentDate.getMonth()].toUpperCase();
    const currentYear = currentDate.getFullYear();

    const topSummary = {
      totalLeads,
      totalClients,
      conversionRate,
      activeClients: activeClientsCount,
      totalDropped: droppedClientsCount
    };

    const monthlyData = {
      thisMonthExpected,
      nextMonthExpected,
      thisMonthCollection,
      thisMonthPending,
      thisMonthDrop: droppedClientsCount,
      thisMonthDropped: thisMonthDropAmount
    };

    res.json({
      topSummary,
      monthly: monthlyData,
      leadStatusSummary: statusMap,
      monthlyTarget: {
        month: currentMonthName,
        year: currentYear,
        isSet: true,
        targetAmount: 500000,
        collectionTarget: 250000
      },
      summaryCards: {
        totalLeads,
        totalClients,
        conversionRate,
        activeClients: activeClientsCount,
        totalDropped: droppedClientsCount,
        thisMoExpected: thisMonthExpected,
        nextMoExpected: nextMonthExpected,
        thisMoCollection: thisMonthCollection,
        thisMoPending: thisMonthPending,
        thisMoDrop: droppedClientsCount,
        thisMoDropped: thisMonthDropAmount
      },
      leadPipeline: statusMap,
      businessSummary: {
        totalClients,
        currentlyActive: activeClientsCount,
        dropped: droppedClientsCount,
        months: rollingMonths
      },
      userWiseSummary,
      advocateWiseSummary,
      activeClients: processedActiveClients
    });
  } catch (err) {
    console.error('CRM dashboard summary error:', err);
    res.status(500).json({ error: 'Failed to generate CRM dashboard metrics' });
  }
});

// ==========================================
// 2. LEADS MANAGEMENT
// ==========================================

// GET /api/crm/leads
router.get('/leads', authenticateToken, requireEmployeeOrAdmin, (req, res) => {
  try {
    const { isScoped, employeeId } = getEmployeeScope(req);
    const { search, status, date, calendar_date, from_date, to_date, page = 1, limit = 25 } = req.query;

    const cleanParam = (v) => (v && typeof v === 'string' && v !== 'undefined' && v !== 'null' && v.trim() !== '') ? v.trim() : null;
    const cleanSearch = cleanParam(search);
    const cleanStatus = cleanParam(status);
    const cleanFromDate = cleanParam(from_date);
    const cleanToDate = cleanParam(to_date);
    const cleanDate = cleanParam(calendar_date || date);

    let sql = `
      SELECT l.*,
             COALESCE(u.name, 'Assigned Consultant') as employee_name,
             m.name as manager_name,
             (SELECT COUNT(*) FROM follow_ups f WHERE f.lead_id = l.id) as follow_up_count,
             (SELECT next_follow_up_date FROM follow_ups f WHERE f.lead_id = l.id ORDER BY f.created_at DESC LIMIT 1) as next_follow_up_date
      FROM leads l
      LEFT JOIN users u ON l.employee_id = u.id
      LEFT JOIN users m ON l.manager_id = m.id
      WHERE 1=1
    `;
    const params = [];

    if (isScoped) {
      sql += ` AND (l.employee_id = ? OR l.manager_id = ? OR l.created_by = ?)`;
      params.push(employeeId, employeeId, req.user.name);
    }

    if (cleanSearch) {
      sql += ` AND (l.name LIKE ? OR l.phone LIKE ? OR l.email LIKE ? OR l.lead_number LIKE ? OR l.city LIKE ? OR l.bank_name LIKE ? OR l.service_needed LIKE ?)`;
      const s = `%${cleanSearch}%`;
      params.push(s, s, s, s, s, s, s);
    }

    if (cleanStatus && cleanStatus !== 'all') {
      if (cleanStatus === 'follow_up' || cleanStatus === 'follow-up') {
        sql += ` AND (l.status = 'follow_up' OR l.status = 'follow-up')`;
      } else if (cleanStatus === 'not_interested' || cleanStatus === 'not-interested') {
        sql += ` AND (l.status = 'not_interested' OR l.status = 'not-interested')`;
      } else {
        sql += ` AND l.status = ?`;
        params.push(cleanStatus);
      }
    } else {
      sql += ` AND l.status != 'converted' AND l.status != 'deleted'`;
    }

    // Calendar & Range filter strictly filters by permanent created_at date
    if (cleanFromDate && cleanToDate) {
      sql += ` AND date(l.created_at) >= date(?) AND date(l.created_at) <= date(?)`;
      params.push(cleanFromDate, cleanToDate);
    } else if (cleanFromDate) {
      sql += ` AND date(l.created_at) >= date(?)`;
      params.push(cleanFromDate);
    } else if (cleanToDate) {
      sql += ` AND date(l.created_at) <= date(?)`;
      params.push(cleanToDate);
    } else if (cleanDate) {
      sql += ` AND date(l.created_at) = date(?)`;
      params.push(cleanDate);
    }

    sql += ` ORDER BY l.created_at DESC LIMIT ? OFFSET ?`;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const leads = db.prepare(sql).all(...params);

    // Calculate dynamic status counts for pill badges
    const scopeFilter = isScoped ? `WHERE (l.employee_id = '${employeeId}' OR l.manager_id = '${employeeId}' OR l.created_by = '${req.user.name}')` : '';
    const allCount = db.prepare(`SELECT COUNT(*) as c FROM leads l ${scopeFilter ? scopeFilter + " AND l.status != 'converted'" : "WHERE l.status != 'converted'"} `).get().c;
    const newCount = db.prepare(`SELECT COUNT(*) as c FROM leads l ${scopeFilter ? scopeFilter + " AND l.status = 'new'" : "WHERE l.status = 'new'"} `).get().c;
    const contactedCount = db.prepare(`SELECT COUNT(*) as c FROM leads l ${scopeFilter ? scopeFilter + " AND l.status = 'contacted'" : "WHERE l.status = 'contacted'"} `).get().c;
    const interestedCount = db.prepare(`SELECT COUNT(*) as c FROM leads l ${scopeFilter ? scopeFilter + " AND l.status = 'interested'" : "WHERE l.status = 'interested'"} `).get().c;
    const followUpCount = db.prepare(`SELECT COUNT(*) as c FROM leads l ${scopeFilter ? scopeFilter + " AND (l.status = 'follow_up' OR l.status = 'follow-up')" : "WHERE (l.status = 'follow_up' OR l.status = 'follow-up')"} `).get().c;
    const convertedCount = db.prepare(`SELECT COUNT(*) as c FROM leads l ${scopeFilter ? scopeFilter + " AND l.status = 'converted'" : "WHERE l.status = 'converted'"} `).get().c;
    const notInterestedCount = db.prepare(`SELECT COUNT(*) as c FROM leads l ${scopeFilter ? scopeFilter + " AND (l.status = 'not_interested' OR l.status = 'not-interested')" : "WHERE (l.status = 'not_interested' OR l.status = 'not-interested')"} `).get().c;

    const statusCounts = {
      all: allCount,
      new: newCount,
      contacted: contactedCount,
      interested: interestedCount,
      follow_up: followUpCount,
      converted: convertedCount,
      not_interested: notInterestedCount
    };

    let countStatusClause = '';
    if (cleanStatus && cleanStatus !== 'all') {
      if (cleanStatus === 'follow_up' || cleanStatus === 'follow-up') {
        countStatusClause = ` AND (l.status = 'follow_up' OR l.status = 'follow-up')`;
      } else if (cleanStatus === 'not_interested' || cleanStatus === 'not-interested') {
        countStatusClause = ` AND (l.status = 'not_interested' OR l.status = 'not-interested')`;
      } else {
        countStatusClause = ` AND l.status = '${cleanStatus}'`;
      }
    }

    let countSql = `SELECT COUNT(*) as total FROM leads l WHERE 1=1` +
      (isScoped ? ` AND (l.employee_id = '${employeeId}' OR l.manager_id = '${employeeId}' OR l.created_by = '${req.user.name}')` : '') +
      countStatusClause +
      ((cleanFromDate && cleanToDate) ? ` AND date(l.created_at) >= date('${cleanFromDate}') AND date(l.created_at) <= date('${cleanToDate}')` : '') +
      (cleanDate ? ` AND date(l.created_at) = date('${cleanDate}')` : '');

    const total = db.prepare(countSql).get().total;

    res.json({
      leads,
      statusCounts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Fetch CRM leads error:', err);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// GET /api/crm/leads/:id
router.get('/leads/:id', authenticateToken, requireEmployeeOrAdmin, (req, res) => {
  try {
    const lead = db.prepare(`
      SELECT l.*,
             u.name as employee_name,
             m.name as manager_name
      FROM leads l
      LEFT JOIN users u ON l.employee_id = u.id
      LEFT JOIN users m ON l.manager_id = m.id
      WHERE l.id = ?
    `).get(req.params.id);

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const followUps = db.prepare(`
      SELECT * FROM follow_ups 
      WHERE lead_id = ? 
      ORDER BY created_at DESC
    `).all(req.params.id);

    res.json({ lead, followUps });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve lead details' });
  }
});

// POST /api/crm/leads - Create Lead with Duplicate Prevention & Sequential ID
router.post('/leads', authenticateToken, requireEmployeeOrAdmin, (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      city,
      total_debt = 0,
      monthly_income = 0,
      service_needed,
      paying_emis = 'Yes',
      harassment_calls = 'No',
      employment_status = 'Employed',
      employment_type = 'Salaried',
      settlement_needed = 'Yes',
      consultation_timing,
      credit_card_dues = 0,
      personal_loan_dues = 0,
      service_fee = 0,
      bank_name,
      status = 'new',
      employee_id,
      manager_id,
      department_id
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Full Name and Phone Number are required' });
    }

    const cleanPhone = phone.trim();
    const cleanEmail = email ? email.trim().toLowerCase() : null;

    // Duplicate Check Rule: Phone and Email
    const dupPhone = db.prepare(`SELECT id, lead_number FROM leads WHERE phone = ?`).get(cleanPhone);
    if (dupPhone) {
      return res.status(409).json({ error: `Lead already exists. Phone number is registered under ${dupPhone.lead_number}.` });
    }

    if (cleanEmail) {
      const dupEmail = db.prepare(`SELECT id, lead_number FROM leads WHERE email = ? COLLATE NOCASE`).get(cleanEmail);
      if (dupEmail) {
        return res.status(409).json({ error: `Lead already exists. Email address is registered under ${dupEmail.lead_number}.` });
      }
    }

    const leadId = 'lead-' + uuidv4().slice(0, 8);
    const leadNumber = generateLeadId();

    const assignedEmpId = employee_id || (req.user.role === 'employee' ? req.user.id : null);
    const assignedMgrId = manager_id || (req.user.manager_id || null);
    const assignedDeptId = department_id || (req.user.department_id || null);

    db.prepare(`
      INSERT INTO leads (
        id, lead_number, name, phone, email, city,
        total_debt, monthly_income, service_needed,
        paying_emis, harassment_calls, employment_status, employment_type,
        settlement_needed, consultation_timing, credit_card_dues, personal_loan_dues,
        service_fee, bank_name, status, employee_id, manager_id, department_id,
        created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      leadId,
      leadNumber,
      name.trim(),
      cleanPhone,
      cleanEmail,
      city || null,
      parseFloat(total_debt) || 0,
      parseFloat(monthly_income) || 0,
      service_needed || 'Debt Settlement',
      paying_emis,
      harassment_calls,
      employment_status,
      employment_type,
      settlement_needed,
      consultation_timing || null,
      parseFloat(credit_card_dues) || 0,
      parseFloat(personal_loan_dues) || 0,
      parseFloat(service_fee) || 0,
      bank_name || null,
      status,
      assignedEmpId,
      assignedMgrId,
      assignedDeptId,
      req.user.name
    );

    logAudit(req, 'Lead Created', 'Leads', leadId, { leadNumber, name, phone: cleanPhone });

    res.status(201).json({
      message: 'Lead created successfully',
      id: leadId,
      lead_number: leadNumber
    });
  } catch (err) {
    console.error('Create CRM lead error:', err);
    res.status(500).json({ error: err.message || 'Failed to create lead' });
  }
});

// Helper to ensure an official Agreement record exists for a Client
function ensureAgreementForClient(client, requestingUser) {
  if (!client || !client.id) return null;
  const existingAgr = db.prepare(`SELECT * FROM agreements WHERE client_id = ?`).get(client.id);
  if (existingAgr) return existingAgr;

  const agreementId = 'agr-' + uuidv4().slice(0, 8);
  const agreementNumber = generateAgreementId();
  const today = new Date().toISOString().split('T')[0];
  const totalFee = client.sx_fee || (client.service_fee ? parseFloat(client.service_fee) : 25000);
  const monthlyFee = Math.round(totalFee / 6);
  const monthlyIncome = parseFloat(client.monthly_income) || 35000;
  const clientName = client.name || 'Client';
  const clientAddress = client.city || client.address || 'Delhi NCR, India';
  const clientPhone = client.phone || '—';
  const clientEmail = client.email || '—';

  // Get lenders if available
  const lenders = db.prepare(`SELECT * FROM lenders WHERE client_id = ?`).all(client.id);
  const lenderText = lenders.length > 0
    ? lenders.map((l, i) => `   ${i + 1}. ${l.bank_name || 'Bank'} — ${l.loan_type || 'Loan'} — ₹${(parseFloat(l.outstanding_amount || l.balance || 0)).toLocaleString('en-IN')}`).join('\n')
    : `   1. Designated Banking Accounts & Credit Facilities (Total Debt: ₹${(parseFloat(client.total_debt) || 0).toLocaleString('en-IN')})`;

  const agreementBody = `CONSULTANCY AGREEMENT
This Consultancy Agreement ("Agreement") is executed on ${today} between:
M/s. SettleXpert LLP, having its registered/operations office at CB-201, Naraina Vihar, Ring Road, New Delhi, Delhi, India, hereinafter referred to as the "First Party" or the "Company".
AND
${clientName}, residing at ${clientAddress}, Mobile No.: ${clientPhone}, Email ID: ${clientEmail}, hereinafter referred to as the "Second Party" or the "Client".

1. PURPOSE OF THE AGREEMENT
The purpose of this Agreement is to appoint the Company as the Client's financial consultancy partner for debt resolution advisory.

ANNEXURE A: LIST OF ENROLLED DEBT ACCOUNTS / LENDERS
${lenderText}

ANNEXURE B: CONSULTANCY FEE STRUCTURE
1. Total Agreed Consultancy Fee: ₹${totalFee.toLocaleString('en-IN')}
2. Monthly Installment Fee: ₹${monthlyFee.toLocaleString('en-IN')}
3. Service Tenure: 6 Months`;

  db.prepare(`
    INSERT INTO agreements (
      id, agreement_number, client_id, fee_plan_id,
      name, phone, email, address, pin_number, dob,
      start_date, end_date, total_fee, monthly_fee, resolution_duration,
      prepared_by, executed_date, monthly_income, status, agreement_body, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, NULL, NULL, ?, NULL, ?, ?, '6 Months', ?, ?, ?, 'active', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).run(
    agreementId,
    agreementNumber,
    client.id,
    clientName,
    clientPhone,
    clientEmail,
    clientAddress,
    today,
    totalFee,
    monthlyFee,
    requestingUser?.name || 'SettleXpert Legal Desk',
    today,
    monthlyIncome,
    agreementBody,
    requestingUser?.name || 'System'
  );

  const createdAgr = db.prepare(`SELECT * FROM agreements WHERE id = ?`).get(agreementId);
  syncRecord('agreements', createdAgr).catch(err => console.error('[Supabase Sync Error] Agreement:', err));

  return createdAgr;
}

// Helper to convert lead to client
function convertLeadToClient(leadId, requestingUser) {
  const lead = db.prepare(`SELECT * FROM leads WHERE id = ?`).get(leadId);
  if (!lead) throw new Error('Lead not found');

  // Check if client already exists for this lead
  let client = db.prepare(`SELECT * FROM clients WHERE lead_id = ? OR phone = ?`).get(lead.id, lead.phone);

  if (client) {
    db.prepare(`UPDATE leads SET status = 'converted', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(lead.id);
    ensureAgreementForClient(client, requestingUser);
    return {
      message: 'Client record already linked for this lead',
      client_id: client.id,
      client_number: client.client_number,
      already_existed: true
    };
  }

  const clientId = 'cli-' + uuidv4().slice(0, 8);
  const clientNumber = generateClientId();

  db.prepare(`
    INSERT INTO clients (
      id, client_number, lead_id, name, email, phone, city,
      employment_status, employment_type, total_debt, monthly_income,
      credit_card_dues, personal_loan_dues, loan_type,
      paying_emis, harassment_calls, settlement_needed, consultation_timing,
      settlement_target, sx_fee, fees_date, fees_status, status, case_status,
      employee_id, manager_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', 'active', 'active', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).run(
    clientId,
    clientNumber,
    lead.id,
    lead.name,
    lead.email,
    lead.phone,
    lead.city,
    lead.employment_status,
    lead.employment_type,
    lead.total_debt,
    lead.monthly_income,
    lead.credit_card_dues,
    lead.personal_loan_dues,
    lead.bank_name ? `Credit Card & Loans (${lead.bank_name})` : (lead.service_needed || 'Credit Card & Loans'),
    lead.paying_emis,
    lead.harassment_calls,
    lead.settlement_needed,
    lead.consultation_timing,
    Math.round((lead.total_debt || 0) * 0.45), // 45% standard target
    lead.service_fee || 25000,
    new Date().toISOString().split('T')[0],
    lead.employee_id || (requestingUser?.id || null),
    lead.manager_id || null
  );

  // If bank name exists on lead, add as initial lender
  if (lead.bank_name) {
    db.prepare(`
      INSERT INTO lenders (id, client_id, bank_name, loan_type, balance, status, created_at)
      VALUES (?, ?, ?, 'Credit Card / Personal Loan', ?, 'Defaulted', CURRENT_TIMESTAMP)
    `).run('len-' + uuidv4().slice(0, 8), clientId, lead.bank_name, lead.total_debt || 0);
  }

  // Update lead status to converted
  db.prepare(`UPDATE leads SET status = 'converted', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(lead.id);

  // Automatically create the Agreement for this client
  const createdClient = db.prepare(`SELECT * FROM clients WHERE id = ?`).get(clientId);
  ensureAgreementForClient(createdClient, requestingUser);

  return {
    message: `Lead converted successfully into Client ${clientNumber}`,
    client_id: clientId,
    client_number: clientNumber,
    already_existed: false
  };
}

// PUT /api/crm/leads/:id - Edit Lead without changing created_at or duplicating
router.put('/leads/:id', authenticateToken, requireEmployeeOrAdmin, (req, res) => {
  try {
    const existing = db.prepare(`SELECT * FROM leads WHERE id = ?`).get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const {
      name,
      phone,
      email,
      city,
      total_debt,
      monthly_income,
      service_needed,
      paying_emis,
      harassment_calls,
      employment_status,
      employment_type,
      settlement_needed,
      consultation_timing,
      credit_card_dues,
      personal_loan_dues,
      service_fee,
      bank_name,
      status
    } = req.body;

    const cleanPhone = phone ? phone.trim() : existing.phone;
    const cleanEmail = email !== undefined ? (email ? email.trim().toLowerCase() : null) : existing.email;

    // Check dup if phone changed
    if (phone && cleanPhone !== existing.phone) {
      const dup = db.prepare(`SELECT id, lead_number FROM leads WHERE phone = ? AND id != ?`).get(cleanPhone, req.params.id);
      if (dup) return res.status(409).json({ error: `Phone number is already used in ${dup.lead_number}` });
    }

    if (email && cleanEmail !== existing.email) {
      const dup = db.prepare(`SELECT id, lead_number FROM leads WHERE email = ? AND id != ?`).get(cleanEmail, req.params.id);
      if (dup) return res.status(409).json({ error: `Email is already used in ${dup.lead_number}` });
    }

    db.prepare(`
      UPDATE leads SET
        name = COALESCE(?, name),
        phone = COALESCE(?, phone),
        email = ?,
        city = COALESCE(?, city),
        total_debt = COALESCE(?, total_debt),
        monthly_income = COALESCE(?, monthly_income),
        service_needed = COALESCE(?, service_needed),
        paying_emis = COALESCE(?, paying_emis),
        harassment_calls = COALESCE(?, harassment_calls),
        employment_status = COALESCE(?, employment_status),
        employment_type = COALESCE(?, employment_type),
        settlement_needed = COALESCE(?, settlement_needed),
        consultation_timing = COALESCE(?, consultation_timing),
        credit_card_dues = COALESCE(?, credit_card_dues),
        personal_loan_dues = COALESCE(?, personal_loan_dues),
        service_fee = COALESCE(?, service_fee),
        bank_name = COALESCE(?, bank_name),
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name ? name.trim() : null,
      cleanPhone,
      cleanEmail,
      city,
      total_debt !== undefined ? parseFloat(total_debt) : null,
      monthly_income !== undefined ? parseFloat(monthly_income) : null,
      service_needed,
      paying_emis,
      harassment_calls,
      employment_status,
      employment_type,
      settlement_needed,
      consultation_timing,
      credit_card_dues !== undefined ? parseFloat(credit_card_dues) : null,
      personal_loan_dues !== undefined ? parseFloat(personal_loan_dues) : null,
      service_fee !== undefined ? parseFloat(service_fee) : null,
      bank_name,
      status,
      req.params.id
    );

    logAudit(req, 'Lead Updated', 'Leads', req.params.id, { name: name || existing.name, status });

    // If status is changed to converted, automatically convert to Client record
    let conversionResult = null;
    if (status === 'converted') {
      try {
        conversionResult = convertLeadToClient(req.params.id, req.user);
        logAudit(req, 'Lead Converted', 'Leads', req.params.id, { leadNumber: existing.lead_number, clientNumber: conversionResult.client_number });
      } catch (convErr) {
        console.error('Auto client conversion on lead update failed:', convErr);
      }
    }

    res.json({
      message: 'Lead updated successfully',
      converted: !!conversionResult,
      client_id: conversionResult?.client_id,
      client_number: conversionResult?.client_number
    });
  } catch (err) {
    console.error('Update lead error:', err);
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

// DELETE /api/crm/leads/:id - Hard delete a lead
router.delete('/leads/:id', authenticateToken, requireEmployeeOrAdmin, (req, res) => {
  try {
    const lead = db.prepare(`SELECT * FROM leads WHERE id = ?`).get(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    db.prepare(`DELETE FROM leads WHERE id = ?`).run(req.params.id);
    logAudit(req, 'Lead Deleted', 'Leads', req.params.id, { leadNumber: lead.lead_number, name: lead.name });
    res.json({ message: 'Lead deleted successfully' });
  } catch (err) {
    console.error('Delete lead error:', err);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

// POST /api/crm/leads/:id/follow-up - Create Follow-up Record in History
router.post('/leads/:id/follow-up', authenticateToken, requireEmployeeOrAdmin, (req, res) => {
  try {
    const { call_status, interested_level, final_status, remark, next_follow_up_date } = req.body;
    if (!call_status || !final_status) {
      return res.status(400).json({ error: 'Call Status and Final Status are required' });
    }

    const lead = db.prepare(`SELECT id, name, lead_number FROM leads WHERE id = ?`).get(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const followUpId = 'fup-' + uuidv4().slice(0, 8);

    db.prepare(`
      INSERT INTO follow_ups (
        id, lead_id, user_id, user_name, call_status, interested_level, final_status, remark, next_follow_up_date, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      followUpId,
      req.params.id,
      req.user.id,
      req.user.name,
      call_status,
      interested_level || 'Interested',
      final_status,
      remark || null,
      next_follow_up_date || null
    );

    // Update lead status and updated_at (preserving created_at)
    db.prepare(`UPDATE leads SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(final_status, req.params.id);

    logAudit(req, 'Follow-up Created', 'Leads', req.params.id, {
      lead: lead.lead_number,
      call_status,
      final_status,
      remark
    });

    // If follow-up final status is converted, auto-convert to Client
    let conversionResult = null;
    if (final_status === 'converted') {
      try {
        conversionResult = convertLeadToClient(req.params.id, req.user);
        logAudit(req, 'Lead Converted', 'Leads', req.params.id, { leadNumber: lead.lead_number, clientNumber: conversionResult.client_number });
      } catch (convErr) {
        console.error('Auto client conversion on follow-up failed:', convErr);
      }
    }

    res.status(201).json({
      message: 'Follow-up logged successfully',
      id: followUpId,
      converted: !!conversionResult,
      client_id: conversionResult?.client_id,
      client_number: conversionResult?.client_number
    });
  } catch (err) {
    console.error('Follow-up error:', err);
    res.status(500).json({ error: 'Failed to record follow-up' });
  }
});

// POST /api/crm/leads/:id/convert - Convert Lead to Client
router.post('/leads/:id/convert', authenticateToken, requireEmployeeOrAdmin, (req, res) => {
  try {
    const lead = db.prepare(`SELECT * FROM leads WHERE id = ?`).get(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const result = convertLeadToClient(req.params.id, req.user);

    logAudit(req, 'Lead Converted', 'Leads', lead.id, { leadNumber: lead.lead_number, clientNumber: result.client_number });
    logAudit(req, 'Client Created', 'Clients', result.client_id, { clientNumber: result.client_number, fromLead: lead.lead_number });

    res.status(201).json({
      message: result.message,
      client_id: result.client_id,
      client_number: result.client_number
    });
  } catch (err) {
    console.error('Lead conversion error:', err);
    res.status(500).json({ error: err.message || 'Failed to convert lead' });
  }
});

// ==========================================
// 3. CLIENTS & MULTIPLE LENDERS
// ==========================================

// GET /api/crm/clients
router.get('/clients', authenticateToken, requireEmployeeOrAdmin, (req, res) => {
  try {
    const { isScoped, employeeId } = getEmployeeScope(req);
    const { search, case_status, month, date, calendar_date, from_date, to_date, page = 1, limit = 25 } = req.query;

    const cleanParam = (v) => (v && typeof v === 'string' && v !== 'undefined' && v !== 'null' && v.trim() !== '') ? v.trim() : null;
    const cleanSearch = cleanParam(search);
    const cleanStatus = cleanParam(case_status);
    const cleanMonth = cleanParam(month);
    const cleanFromDate = cleanParam(from_date);
    const cleanToDate = cleanParam(to_date);
    const cleanDate = cleanParam(calendar_date || date);

    let sql = `
      SELECT c.*,
             u.name as employee_name,
             m.name as manager_name,
             a.name as advocate_name,
             agr.resolution_duration,
             COALESCE(agr.monthly_fee, (SELECT expected_amount FROM monthly_payment_records WHERE client_id = c.id LIMIT 1), 8000) as monthly_fee,
             COALESCE(
               (SELECT SUM(received_amount) FROM monthly_payment_records mpr WHERE mpr.client_id = c.id),
               (SELECT SUM(amount) FROM payments p WHERE p.client_id = c.id AND p.status = 'verified'),
               0
             ) as total_received,
             COALESCE(
               (SELECT SUM(expected_amount) FROM monthly_payment_records mpr WHERE mpr.client_id = c.id),
               agr.total_fee,
               c.sx_fee,
               48000
             ) as total_agreement_fee,
             COALESCE(
               (SELECT received_amount FROM monthly_payment_records mpr WHERE mpr.client_id = c.id AND payment_status != 'Paid' ORDER BY month_number ASC LIMIT 1),
               (SELECT received_amount FROM monthly_payment_records mpr WHERE mpr.client_id = c.id ORDER BY month_number DESC LIMIT 1),
               0
             ) as this_month_received,
             (SELECT COUNT(*) FROM lenders len WHERE len.client_id = c.id) as lender_count
      FROM clients c
      LEFT JOIN users u ON c.employee_id = u.id
      LEFT JOIN users m ON c.manager_id = m.id
      LEFT JOIN advocates a ON c.advocate_id = a.id
      LEFT JOIN (
        SELECT * FROM agreements WHERE id IN (SELECT MAX(id) FROM agreements GROUP BY client_id)
      ) agr ON agr.client_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (isScoped) {
      sql += ` AND (c.employee_id = ? OR c.manager_id = ?)`;
      params.push(employeeId, employeeId);
    }

    if (cleanSearch) {
      sql += ` AND (c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ? OR c.client_number LIKE ? OR c.city LIKE ?)`;
      const s = `%${cleanSearch}%`;
      params.push(s, s, s, s, s);
    }

    if (cleanStatus) {
      sql += ` AND (c.case_status = ? OR c.status = ?)`;
      params.push(cleanStatus, cleanStatus);
    }

    if (cleanMonth) {
      sql += ` AND strftime('%Y-%m', c.created_at) = ?`;
      params.push(cleanMonth);
    }

    // Calendar & Range filter strictly filters by permanent created_at date
    if (cleanFromDate && cleanToDate) {
      sql += ` AND date(c.created_at) >= date(?) AND date(c.created_at) <= date(?)`;
      params.push(cleanFromDate, cleanToDate);
    } else if (cleanFromDate) {
      sql += ` AND date(c.created_at) >= date(?)`;
      params.push(cleanFromDate);
    } else if (cleanToDate) {
      sql += ` AND date(c.created_at) <= date(?)`;
      params.push(cleanToDate);
    } else if (cleanDate) {
      sql += ` AND date(c.created_at) = date(?)`;
      params.push(cleanDate);
    }

    sql += ` ORDER BY c.created_at DESC LIMIT ? OFFSET ?`;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const rawClients = db.prepare(sql).all(...params);

    const clients = rawClients.map(c => {
      const durStr = c.resolution_duration || '6 Months';
      const durMatch = durStr.match(/(\d+)/);
      const durNum = durMatch ? parseInt(durMatch[1], 10) : 6;
      const mFee = (c.monthly_fee && c.monthly_fee > 0) ? c.monthly_fee : 8000;
      const totAgrFee = (c.total_agreement_fee && c.total_agreement_fee >= mFee * durNum) ? c.total_agreement_fee : (mFee * durNum);
      const totRec = c.total_received || 0;
      const pendAmt = Math.max(0, totAgrFee - totRec);

      return {
        ...c,
        monthly_fee: mFee,
        duration_months: durNum,
        total_agreement_fee: totAgrFee,
        total_received: totRec,
        pending_amount: pendAmt,
        fees_status: totRec >= totAgrFee && totAgrFee > 0 ? 'Paid' : totRec > 0 ? 'Partially Paid' : 'Pending'
      };
    });

    const countSql = `SELECT COUNT(*) as total FROM clients c WHERE 1=1` +
      (isScoped ? ` AND (c.employee_id = '${employeeId}' OR c.manager_id = '${employeeId}')` : '') +
      (cleanStatus ? ` AND (c.case_status = '${cleanStatus}' OR c.status = '${cleanStatus}')` : '') +
      (cleanMonth ? ` AND strftime('%Y-%m', c.created_at) = '${cleanMonth}'` : '') +
      ((cleanFromDate && cleanToDate) ? ` AND date(c.created_at) >= date('${cleanFromDate}') AND date(c.created_at) <= date('${cleanToDate}')` : '') +
      (cleanDate ? ` AND date(c.created_at) = date('${cleanDate}')` : '');

    const total = db.prepare(countSql).get().total;

    res.json({
      clients,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Fetch CRM clients error:', err);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// GET /api/crm/clients/:id - Full details + Lenders + Agreements + Payments
router.get('/clients/:id', authenticateToken, requireEmployeeOrAdmin, (req, res) => {
  try {
    const client = db.prepare(`
      SELECT c.*,
             u.name as employee_name,
             m.name as manager_name,
             a.name as advocate_name,
             l.lead_number,
             COALESCE((SELECT SUM(amount) FROM payments p WHERE p.client_id = c.id AND p.status = 'verified'), 0) as total_received,
             COALESCE((SELECT SUM(amount) FROM payments p WHERE p.client_id = c.id AND p.status = 'verified' AND strftime('%Y-%m', p.payment_date) = strftime('%Y-%m', 'now')), 0) as this_month_received
      FROM clients c
      LEFT JOIN users u ON c.employee_id = u.id
      LEFT JOIN users m ON c.manager_id = m.id
      LEFT JOIN advocates a ON c.advocate_id = a.id
      LEFT JOIN leads l ON c.lead_id = l.id
      WHERE c.id = ?
    `).get(req.params.id);

    if (!client) return res.status(404).json({ error: 'Client not found' });

    client.pending_amount = Math.max(0, (client.sx_fee || client.total_debt * 0.1) - client.total_received);

    const lenders = db.prepare(`SELECT * FROM lenders WHERE client_id = ? ORDER BY created_at ASC`).all(req.params.id);
    const agreements = db.prepare(`SELECT * FROM agreements WHERE client_id = ? ORDER BY created_at DESC`).all(req.params.id);
    const payments = db.prepare(`SELECT * FROM payments WHERE client_id = ? ORDER BY created_at DESC`).all(req.params.id);

    res.json({ client, lenders, agreements, payments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve client profile' });
  }
});

// POST /api/crm/clients - Directly Add Client
router.post('/clients', authenticateToken, requireEmployeeOrAdmin, (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      city,
      total_debt = 0,
      monthly_income = 0,
      credit_card_dues = 0,
      personal_loan_dues = 0,
      loan_type = 'Credit Card & Personal Loan',
      paying_emis = 'Yes',
      harassment_calls = 'No',
      settlement_needed = 'Yes',
      consultation_timing,
      settlement_target = 0,
      sx_fee = 0,
      fees_date,
      fees_status = 'Pending',
      notes
      // NOTE: advocate_id intentionally NOT accepted here.
      // Advocate assignment is ONLY allowed via PATCH /api/manager/clients/:id/advocate
      // by an authorized Manager or Admin. Employees cannot assign advocates.
    } = req.body;

    if (!name || !phone) return res.status(400).json({ error: 'Name and Phone are required' });

    const dupPhone = db.prepare(`SELECT id, client_number FROM clients WHERE phone = ?`).get(phone.trim());
    if (dupPhone) {
      return res.status(409).json({ error: `Client already exists with this phone (${dupPhone.client_number})` });
    }

    const id = 'cli-' + uuidv4().slice(0, 8);
    const clientNumber = generateClientId();

    db.prepare(`
      INSERT INTO clients (
        id, client_number, name, email, phone, city,
        total_debt, monthly_income, credit_card_dues, personal_loan_dues, loan_type,
        paying_emis, harassment_calls, settlement_needed, consultation_timing,
        settlement_target, sx_fee, fees_date, fees_status, status, case_status, notes,
        employee_id, manager_id, advocate_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 'active', ?, ?, ?, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      id,
      clientNumber,
      name.trim(),
      email ? email.trim().toLowerCase() : null,
      phone.trim(),
      city || null,
      parseFloat(total_debt) || 0,
      parseFloat(monthly_income) || 0,
      parseFloat(credit_card_dues) || 0,
      parseFloat(personal_loan_dues) || 0,
      loan_type,
      paying_emis,
      harassment_calls,
      settlement_needed,
      consultation_timing || null,
      parseFloat(settlement_target) || 0,
      parseFloat(sx_fee) || 0,
      fees_date || new Date().toISOString().split('T')[0],
      fees_status,
      notes || null,
      req.user.role === 'employee' ? req.user.id : null,
      req.user.manager_id || null
      // advocate_id = NULL always — must be assigned via Manager PATCH endpoint
    );

    const createdClient = db.prepare(`SELECT * FROM clients WHERE id = ?`).get(id);
    ensureAgreementForClient(createdClient, req.user);

    logAudit(req, 'Client Created', 'Clients', id, { clientNumber, name });
    res.status(201).json({ message: 'Client onboarded successfully', id, client_number: clientNumber });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to create client' });
  }
});

// PUT /api/crm/clients/:id - Edit Client
router.put('/clients/:id', authenticateToken, requireEmployeeOrAdmin, (req, res) => {
  try {
    const existing = db.prepare(`SELECT * FROM clients WHERE id = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Client not found' });

    const {
      name,
      phone,
      email,
      city,
      total_debt,
      monthly_income,
      credit_card_dues,
      personal_loan_dues,
      loan_type,
      paying_emis,
      harassment_calls,
      settlement_needed,
      consultation_timing,
      settlement_target,
      sx_fee,
      fees_date,
      fees_status,
      case_status,
      notes
    } = req.body;

    // Preserve sx_fee, fees_date, fees_status if employee is editing (Employee is View-Only for payment & fees)
    const isManagerOrAdmin = req.user.role === 'admin' || req.user.role === 'manager';
    const feeToUpdate = isManagerOrAdmin
      ? (sx_fee !== undefined ? parseFloat(sx_fee) : existing.sx_fee)
      : existing.sx_fee;
    const feesDateToUpdate = isManagerOrAdmin ? fees_date : existing.fees_date;
    const feesStatusToUpdate = isManagerOrAdmin ? fees_status : existing.fees_status;

    db.prepare(`
      UPDATE clients SET
        name = COALESCE(?, name),
        phone = COALESCE(?, phone),
        email = ?,
        city = COALESCE(?, city),
        total_debt = COALESCE(?, total_debt),
        monthly_income = COALESCE(?, monthly_income),
        credit_card_dues = COALESCE(?, credit_card_dues),
        personal_loan_dues = COALESCE(?, personal_loan_dues),
        loan_type = COALESCE(?, loan_type),
        paying_emis = COALESCE(?, paying_emis),
        harassment_calls = COALESCE(?, harassment_calls),
        settlement_needed = COALESCE(?, settlement_needed),
        consultation_timing = COALESCE(?, consultation_timing),
        settlement_target = COALESCE(?, settlement_target),
        sx_fee = ?,
        fees_date = COALESCE(?, fees_date),
        fees_status = COALESCE(?, fees_status),
        case_status = COALESCE(?, case_status),
        status = COALESCE(?, status),
        notes = COALESCE(?, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name ? name.trim() : null,
      phone ? phone.trim() : null,
      email !== undefined ? (email ? email.trim().toLowerCase() : null) : existing.email,
      city,
      total_debt !== undefined ? parseFloat(total_debt) : null,
      monthly_income !== undefined ? parseFloat(monthly_income) : null,
      credit_card_dues !== undefined ? parseFloat(credit_card_dues) : null,
      personal_loan_dues !== undefined ? parseFloat(personal_loan_dues) : null,
      loan_type,
      paying_emis,
      harassment_calls,
      settlement_needed,
      consultation_timing,
      settlement_target !== undefined ? parseFloat(settlement_target) : null,
      feeToUpdate,
      feesDateToUpdate,
      feesStatusToUpdate,
      case_status,
      case_status,
      notes,
      req.params.id
    );

    logAudit(req, 'Client Updated', 'Clients', req.params.id, { name: name || existing.name });
    res.json({ message: 'Client details updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// DELETE /api/crm/clients/:id - Hard delete a client
router.delete('/clients/:id', authenticateToken, requireEmployeeOrAdmin, (req, res) => {
  try {
    const client = db.prepare(`SELECT * FROM clients WHERE id = ?`).get(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    db.prepare(`DELETE FROM lenders WHERE client_id = ?`).run(req.params.id);
    db.prepare(`DELETE FROM agreements WHERE client_id = ?`).run(req.params.id);
    db.prepare(`DELETE FROM monthly_payment_records WHERE client_id = ?`).run(req.params.id);
    db.prepare(`DELETE FROM clients WHERE id = ?`).run(req.params.id);
    logAudit(req, 'Client Deleted', 'Clients', req.params.id, { clientNumber: client.client_number, name: client.name });
    res.json({ message: 'Client deleted successfully' });
  } catch (err) {
    console.error('Delete client error:', err);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

// POST /api/crm/clients/:id/lenders - Add Lender
router.post('/clients/:id/lenders', authenticateToken, requireEmployeeOrAdmin, (req, res) => {

  try {
    const { bank_name, loan_type, balance = 0, default_date, status = 'Defaulted', lender_email, pdf_url } = req.body;
    if (!bank_name) return res.status(400).json({ error: 'Bank Name is required' });

    const lenderId = 'len-' + uuidv4().slice(0, 8);

    db.prepare(`
      INSERT INTO lenders (id, client_id, bank_name, loan_type, balance, default_date, status, lender_email, pdf_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      lenderId,
      req.params.id,
      bank_name.trim(),
      loan_type || 'Personal Loan',
      parseFloat(balance) || 0,
      default_date || null,
      status,
      lender_email || null,
      pdf_url || null
    );

    logAudit(req, 'Lender Added', 'Clients', req.params.id, { bank_name, balance });
    res.status(201).json({ message: 'Lender added successfully', id: lenderId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add lender' });
  }
});

// DELETE /api/crm/clients/:id/lenders/:lenderId - Remove Lender
router.delete('/clients/:id/lenders/:lenderId', authenticateToken, requireEmployeeOrAdmin, (req, res) => {
  try {
    db.prepare(`DELETE FROM lenders WHERE id = ? AND client_id = ?`).run(req.params.lenderId, req.params.id);
    logAudit(req, 'Lender Removed', 'Clients', req.params.id, { lenderId: req.params.lenderId });
    res.json({ message: 'Lender removed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove lender' });
  }
});

// ==========================================
// 4. AGREEMENTS
// ==========================================

// GET /api/crm/agreements
router.get('/agreements', authenticateToken, requireEmployeeOrAdmin, (req, res) => {
  try {
    // Auto-ensure agreements for all existing clients so every client appears in Agreements
    try {
      const clientsWithoutAgr = db.prepare(`
        SELECT c.* FROM clients c
        LEFT JOIN agreements a ON c.id = a.client_id
        WHERE a.id IS NULL
      `).all();

      for (const c of clientsWithoutAgr) {
        ensureAgreementForClient(c, req.user);
      }
    } catch (autoErr) {
      console.error('[Auto-Agreement Error]:', autoErr);
    }

    const { isScoped, employeeId } = getEmployeeScope(req);
    const { search, status, date, calendar_date, from_date, to_date, page = 1, limit = 25 } = req.query;

    const cleanParam = (v) => (v && typeof v === 'string' && v !== 'undefined' && v !== 'null' && v.trim() !== '') ? v.trim() : null;
    const cleanSearch = cleanParam(search);
    const cleanStatus = cleanParam(status);
    const cleanFromDate = cleanParam(from_date);
    const cleanToDate = cleanParam(to_date);
    const cleanDate = cleanParam(calendar_date || date);

    let sql = `
      SELECT a.*,
             c.name as client_name, c.client_number, c.phone as client_phone, c.email as client_email,
             c.city as client_city, c.total_debt as client_total_debt,
             c.loan_type as client_loan_type,
             c.monthly_income as client_monthly_income,
             (SELECT GROUP_CONCAT(len.bank_name, ', ') FROM lenders len WHERE len.client_id = c.id) as lender_names,
             (SELECT COUNT(*) FROM lenders len WHERE len.client_id = c.id) as lender_count
      FROM agreements a
      LEFT JOIN clients c ON a.client_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (isScoped) {
      sql += ` AND (c.employee_id = ? OR c.manager_id = ? OR a.created_by = ?)`;
      params.push(employeeId, employeeId, req.user.name);
    }

    if (cleanSearch) {
      sql += ` AND (a.agreement_number LIKE ? OR c.name LIKE ? OR c.phone LIKE ? OR c.client_number LIKE ? OR a.name LIKE ? OR a.phone LIKE ? OR a.email LIKE ?)`;
      const s = `%${cleanSearch}%`;
      params.push(s, s, s, s, s, s, s);
    }

    if (cleanStatus) {
      sql += ` AND a.status = ?`;
      params.push(cleanStatus);
    }

    // Calendar & Range filter strictly filters by permanent created_at / start_date
    if (cleanFromDate && cleanToDate) {
      sql += ` AND date(a.created_at) >= date(?) AND date(a.created_at) <= date(?)`;
      params.push(cleanFromDate, cleanToDate);
    } else if (cleanFromDate) {
      sql += ` AND date(a.created_at) >= date(?)`;
      params.push(cleanFromDate);
    } else if (cleanToDate) {
      sql += ` AND date(a.created_at) <= date(?)`;
      params.push(cleanToDate);
    } else if (cleanDate) {
      sql += ` AND (date(a.created_at) = date(?) OR date(a.start_date) = date(?))`;
      params.push(cleanDate, cleanDate);
    }

    sql += ` ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const agreements = db.prepare(sql).all(...params);

    // Attach full lenders array to each agreement
    for (const a of agreements) {
      if (a.client_id) {
        a.lenders = db.prepare(`SELECT * FROM lenders WHERE client_id = ? ORDER BY created_at ASC`).all(a.client_id);
      }
    }

    const countSql = `SELECT COUNT(*) as total FROM agreements a LEFT JOIN clients c ON a.client_id = c.id WHERE 1=1` +
      (isScoped ? ` AND (c.employee_id = '${employeeId}' OR c.manager_id = '${employeeId}' OR a.created_by = '${req.user.name}')` : '') +
      (cleanStatus ? ` AND a.status = '${cleanStatus}'` : '') +
      (cleanSearch ? ` AND (a.agreement_number LIKE '%${cleanSearch}%' OR c.name LIKE '%${cleanSearch}%' OR c.phone LIKE '%${cleanSearch}%' OR c.client_number LIKE '%${cleanSearch}%' OR a.name LIKE '%${cleanSearch}%' OR a.phone LIKE '%${cleanSearch}%' OR a.email LIKE '%${cleanSearch}%')` : '') +
      ((cleanFromDate && cleanToDate) ? ` AND date(a.created_at) >= date('${cleanFromDate}') AND date(a.created_at) <= date('${cleanToDate}')` : '') +
      (cleanDate ? ` AND (date(a.created_at) = date('${cleanDate}') OR date(a.start_date) = date('${cleanDate}'))` : '');

    const total = db.prepare(countSql).get().total;

    res.json({
      agreements,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Fetch agreements error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch agreements' });
  }
});

// POST /api/crm/agreements - Auto-linked to client / lead
router.post('/agreements', authenticateToken, requireEmployeeOrAdmin, (req, res) => {
  try {
    const {
      client_id,
      lead_id,
      fee_plan_id,
      name,
      phone,
      email,
      address,
      pin_number,
      dob,
      start_date,
      end_date,
      total_fee = 25000,
      monthly_fee = 0,
      resolution_duration = '6 Months',
      prepared_by,
      executed_date,
      monthly_income,
      status = 'draft',
      agreement_body,
      lenders = []
    } = req.body;

    let targetClient = null;

    if (client_id) {
      targetClient = db.prepare(`SELECT * FROM clients WHERE id = ?`).get(client_id);
    }
    if (!targetClient && lead_id) {
      targetClient = db.prepare(`SELECT * FROM clients WHERE lead_id = ?`).get(lead_id);
    }
    if (!targetClient && phone) {
      targetClient = db.prepare(`SELECT * FROM clients WHERE phone = ?`).get(phone.trim());
    }
    if (!targetClient) {
      const clientId = 'cli-' + uuidv4().slice(0, 8);
      const clientNumber = generateClientId();
      db.prepare(`
        INSERT INTO clients (
          id, client_number, lead_id, name, phone, email, city,
          total_debt, monthly_income, employee_id, manager_id, sx_fee, status, case_status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(
        clientId,
        clientNumber,
        lead_id || null,
        name || 'Client',
        phone || '0000000000',
        email || null,
        address || 'New Delhi, India',
        parseFloat(total_fee) * 4 || 100000,
        parseFloat(monthly_income) || 30000,
        req.user.id || null,
        req.user.manager_id || null,
        parseFloat(total_fee) || 25000
      );
      targetClient = db.prepare(`SELECT * FROM clients WHERE id = ?`).get(clientId);
    }

    const agreementId = 'agr-' + uuidv4().slice(0, 8);
    const agreementNumber = generateAgreementId();

    const clientName = name || targetClient.name;
    const clientPhone = phone || targetClient.phone;
    const clientEmail = email || targetClient.email;
    const finalStartDate = start_date || executed_date || new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO agreements (
        id, agreement_number, client_id, fee_plan_id,
        name, phone, email, address, pin_number, dob,
        start_date, end_date, total_fee, monthly_fee, resolution_duration,
        prepared_by, executed_date, monthly_income, status, agreement_body, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      agreementId,
      agreementNumber,
      targetClient.id,
      fee_plan_id || null,
      clientName,
      clientPhone,
      clientEmail,
      address || targetClient.city || null,
      pin_number || null,
      dob || null,
      finalStartDate,
      end_date || null,
      parseFloat(total_fee) || 0,
      parseFloat(monthly_fee) || 0,
      resolution_duration,
      prepared_by || req.user.name,
      finalStartDate,
      parseFloat(monthly_income) || 30000,
      status,
      agreement_body || null,
      req.user.name
    );

    // Save attached lenders if provided
    if (Array.isArray(lenders) && lenders.length > 0) {
      const insertLender = db.prepare(`
        INSERT INTO lenders (id, client_id, bank_name, loan_type, balance, status, created_at)
        VALUES (?, ?, ?, ?, ?, 'Defaulted', CURRENT_TIMESTAMP)
      `);
      for (const len of lenders) {
        if (len.bank_name) {
          const lenId = 'len-' + uuidv4().slice(0, 8);
          insertLender.run(
            lenId,
            targetClient.id,
            len.bank_name.trim(),
            len.loan_type || 'Personal Loan',
            parseFloat(len.balance || len.amount) || 0
          );
        }
      }
    }

    logAudit(req, 'Agreement Created', 'Agreements', agreementId, { agreementNumber, client: targetClient.client_number });

    res.status(201).json({
      message: 'Agreement created successfully',
      id: agreementId,
      agreement_number: agreementNumber,
      client_id: targetClient.id
    });
  } catch (err) {
    console.error('Create agreement error:', err);
    res.status(500).json({ error: err.message || 'Failed to create agreement' });
  }
});

// PUT /api/crm/agreements/:id
router.put('/agreements/:id', authenticateToken, requireEmployeeOrAdmin, (req, res) => {
  try {
    const existing = db.prepare(`SELECT * FROM agreements WHERE id = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Agreement not found' });

    const {
      name,
      phone,
      email,
      address,
      pin_number,
      dob,
      start_date,
      end_date,
      total_fee,
      monthly_fee,
      resolution_duration,
      prepared_by,
      executed_date,
      monthly_income,
      status,
      agreement_body,
      lenders
    } = req.body;

    const finalName = name || existing.name;
    const finalPhone = phone || existing.phone;
    const finalEmail = email || existing.email;
    const finalAddress = address || existing.address;
    const finalPin = pin_number || existing.pin_number;
    const finalDob = dob || existing.dob;
    const finalStartDate = start_date || executed_date || existing.start_date;
    const finalExecutedDate = executed_date || start_date || existing.executed_date || finalStartDate;
    const finalEndDate = end_date || existing.end_date;
    const finalTotalFee = total_fee !== undefined ? parseFloat(total_fee) : existing.total_fee;
    const finalMonthlyFee = monthly_fee !== undefined ? parseFloat(monthly_fee) : existing.monthly_fee;
    const finalResolutionDuration = resolution_duration || existing.resolution_duration;
    const finalPreparedBy = prepared_by || existing.prepared_by;
    const finalMonthlyIncome = monthly_income !== undefined ? parseFloat(monthly_income) : existing.monthly_income;
    const finalStatus = status || existing.status;
    const finalAgreementBody = agreement_body || existing.agreement_body;

    // 1. Update Agreements Table
    db.prepare(`
      UPDATE agreements SET
        name = ?,
        phone = ?,
        email = ?,
        address = ?,
        pin_number = ?,
        dob = ?,
        start_date = ?,
        end_date = ?,
        total_fee = ?,
        monthly_fee = ?,
        resolution_duration = ?,
        prepared_by = ?,
        executed_date = ?,
        monthly_income = ?,
        status = ?,
        agreement_body = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      finalName,
      finalPhone,
      finalEmail,
      finalAddress,
      finalPin,
      finalDob,
      finalStartDate,
      finalEndDate,
      finalTotalFee,
      finalMonthlyFee,
      finalResolutionDuration,
      finalPreparedBy,
      finalExecutedDate,
      finalMonthlyIncome,
      finalStatus,
      finalAgreementBody,
      req.params.id
    );

    // 2. If client is linked, update Clients Table and Lenders Table
    const clientId = existing.client_id;
    if (clientId) {
      db.prepare(`
        UPDATE clients SET
          name = ?,
          phone = ?,
          email = ?,
          city = ?,
          monthly_income = COALESCE(?, monthly_income),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        finalName,
        finalPhone,
        finalEmail,
        finalAddress,
        finalMonthlyIncome !== undefined ? finalMonthlyIncome : null,
        clientId
      );

      // Sync Lenders if provided
      if (Array.isArray(lenders) && lenders.length > 0) {
        db.prepare(`DELETE FROM lenders WHERE client_id = ?`).run(clientId);
        const insertLender = db.prepare(`
          INSERT INTO lenders (id, client_id, bank_name, loan_type, balance, status, created_at)
          VALUES (?, ?, ?, ?, ?, 'Defaulted', CURRENT_TIMESTAMP)
        `);
        let totalDebtCalc = 0;
        for (const len of lenders) {
          if (len.bank_name && len.bank_name.trim()) {
            const bal = parseFloat(len.balance || len.amount) || 0;
            totalDebtCalc += bal;
            insertLender.run(
              'len-' + uuidv4().slice(0, 8),
              clientId,
              len.bank_name.trim(),
              len.loan_type || 'Personal Loan',
              bal
            );
          }
        }
        db.prepare(`UPDATE clients SET total_debt = ? WHERE id = ?`).run(totalDebtCalc, clientId);
      }

      // Sync linked lead if exists
      const targetClient = db.prepare(`SELECT lead_id FROM clients WHERE id = ?`).get(clientId);
      if (targetClient && targetClient.lead_id) {
        db.prepare(`
          UPDATE leads SET
            name = ?,
            phone = ?,
            email = ?,
            city = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(finalName, finalPhone, finalEmail, finalAddress, targetClient.lead_id);
      }
    }

    logAudit(req, 'Agreement Updated', 'Agreements', req.params.id, { agreementNumber: existing.agreement_number });
    res.json({ message: 'Agreement updated successfully' });
  } catch (err) {
    console.error('Update agreement error:', err);
    res.status(500).json({ error: err.message || 'Failed to update agreement' });
  }
});

// DELETE /api/crm/agreements/:id
router.delete('/agreements/:id', authenticateToken, requireEmployeeOrAdmin, (req, res) => {
  try {
    const agreement = db.prepare(`SELECT * FROM agreements WHERE id = ?`).get(req.params.id);
    if (!agreement) return res.status(404).json({ error: 'Agreement not found' });

    db.prepare(`DELETE FROM agreements WHERE id = ?`).run(req.params.id);
    logAudit(req, 'Agreement Deleted', 'Agreements', req.params.id, { agreementNumber: agreement.agreement_number });
    res.json({ message: 'Agreement deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete agreement' });
  }
});

// ==========================================
// 5. PAYMENT RECORD SUBMISSION (MANAGER / ADMIN ONLY)
// ==========================================
router.post('/payments', authenticateToken, (req, res) => {
  try {
    // Strict RBAC: Employees are strictly forbidden from creating payments (403 Forbidden)
    if (req.user.role === 'employee') {
      return res.status(403).json({
        error: 'Forbidden: Payment creation is restricted to authorized Manager and Admin roles. Employee CRM is view-only for payments.'
      });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Forbidden: Manager or Administrator access required' });
    }

    const { client_id, agreement_id, amount, payment_method, transaction_id, payment_date } = req.body;
    if (!client_id || !amount || !payment_method) {
      return res.status(400).json({ error: 'Client, Amount, and Payment Method are required' });
    }

    const client = db.prepare(`SELECT * FROM clients WHERE id = ?`).get(client_id);
    if (!client) return res.status(404).json({ error: 'Client not found' });

    const payId = 'pay-' + uuidv4().slice(0, 8);
    const count = db.prepare(`SELECT COUNT(*) as count FROM payments`).get().count + 1;
    const receiptNumber = `REC-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;

    db.prepare(`
      INSERT INTO payments (
        id, receipt_number, client_id, agreement_id, amount, payment_method, transaction_id, status, payment_date, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'verified', ?, CURRENT_TIMESTAMP)
    `).run(
      payId,
      receiptNumber,
      client_id,
      agreement_id || null,
      parseFloat(amount),
      payment_method,
      transaction_id || null,
      payment_date || new Date().toISOString().split('T')[0]
    );

    // Sync client total received
    const sumRow = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE client_id = ? AND status = 'verified'`).get(client_id);
    const totalRec = sumRow ? sumRow.total : parseFloat(amount);
    const sxFee = client.sx_fee || (client.total_debt * 0.1) || 0;
    const feeStatus = totalRec >= sxFee && sxFee > 0 ? 'Paid' : totalRec > 0 ? 'Partial' : 'Pending';
    db.prepare(`UPDATE clients SET total_received = ?, fees_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(totalRec, feeStatus, client_id);

    logAudit(req, 'Payment Submitted & Verified', 'Payments', payId, { receiptNumber, client: client.client_number, amount });

    res.status(201).json({ message: 'Payment recorded and verified successfully', id: payId, receipt_number: receiptNumber });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit payment' });
  }
});

// ==========================================
// 6. MONTHLY SETTL EXPERT PAYMENT RECORDS
// ==========================================

// Helper to compute payment summary and ensure schedule exists
function getClientPaymentSummaryAndRecords(clientId) {
  const client = db.prepare(`SELECT * FROM clients WHERE id = ?`).get(clientId);
  if (!client) return null;

  const agreement = db.prepare(`
    SELECT * FROM agreements 
    WHERE client_id = ? 
    ORDER BY created_at DESC LIMIT 1
  `).get(clientId);

  let records = db.prepare(`
    SELECT * FROM monthly_payment_records 
    WHERE client_id = ? 
    ORDER BY month_number ASC
  `).all(clientId);

  // Auto-generate if agreement exists but monthly records not yet created
  if ((!records || records.length === 0) && agreement) {
    const durStr = agreement.resolution_duration || '6 Months';
    const durMatch = durStr.match(/(\d+)/);
    const durNum = durMatch ? parseInt(durMatch[1], 10) : 6;
    // Fixed monthly fee logic: e.g. 8000 per month. Do NOT divide into 6 parts!
    const monthlyFee = (agreement.monthly_fee && agreement.monthly_fee > 0)
      ? agreement.monthly_fee
      : (agreement.total_fee && durNum > 0 ? (agreement.total_fee / durNum) : 8000);

    const baseDate = new Date(agreement.start_date || agreement.created_at || new Date().toISOString().split('T')[0]);
    const insertStmt = db.prepare(`
      INSERT INTO monthly_payment_records (
        id, client_id, agreement_id, month_number, due_date, expected_amount, received_amount, payment_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 0, 'Pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    for (let i = 0; i < durNum; i++) {
      const d = new Date(baseDate);
      d.setMonth(baseDate.getMonth() + i);
      const dueDateStr = d.toISOString().split('T')[0];
      const recId = 'mpr-' + (clientId.slice(-6)) + '-m' + (i + 1) + '-' + uuidv4().slice(0, 4);
      insertStmt.run(recId, clientId, agreement.id, i + 1, dueDateStr, monthlyFee);
    }

    records = db.prepare(`
      SELECT * FROM monthly_payment_records 
      WHERE client_id = ? 
      ORDER BY month_number ASC
    `).all(clientId);
  }

  // Calculate totals and duration
  const totalMonths = records && records.length > 0 ? records.length : (agreement ? 6 : 0);
  const monthlyFee = records && records.length > 0
    ? records[0].expected_amount
    : (agreement?.monthly_fee || 8000);
  const totalAgreementFee = records && records.length > 0
    ? records.reduce((acc, r) => acc + (r.expected_amount || 0), 0)
    : (monthlyFee * (totalMonths || 6));
  const totalReceived = records && records.length > 0
    ? records.reduce((acc, r) => acc + (r.received_amount || 0), 0)
    : 0;
  const totalPending = Math.max(0, totalAgreementFee - totalReceived);

  // Map records with computed pending per month
  const mappedRecords = (records || []).map((r) => {
    const pending = Math.max(0, (r.expected_amount || 0) - (r.received_amount || 0));
    return {
      ...r,
      pending_amount: pending,
      // Ensure payment status matches received amount accurately
      payment_status: r.payment_status || (r.received_amount >= r.expected_amount && r.expected_amount > 0 ? 'Paid' : r.received_amount > 0 ? 'Partially Paid' : 'Pending')
    };
  });

  // Fetch permanent history
  const history = db.prepare(`
    SELECT * FROM monthly_payment_history 
    WHERE client_id = ? 
    ORDER BY created_at DESC
  `).all(clientId);

  return {
    client,
    agreement,
    summary: {
      monthly_fee: monthlyFee,
      agreement_duration: agreement?.resolution_duration || `${totalMonths || 6} Months`,
      duration_months: totalMonths,
      total_agreement_fee: totalAgreementFee,
      total_received: totalReceived,
      total_pending: totalPending,
      fees_status: totalReceived >= totalAgreementFee && totalAgreementFee > 0 ? 'Paid' : totalReceived > 0 ? 'Partially Paid' : 'Pending'
    },
    records: mappedRecords,
    history
  };
}

// GET /api/crm/clients/:id/monthly-payments
// VIEW ONLY: Accessible to Employee, Manager, Admin
router.get('/clients/:id/monthly-payments', authenticateToken, requireEmployeeOrAdmin, (req, res) => {
  try {
    const result = getClientPaymentSummaryAndRecords(req.params.id);
    if (!result) return res.status(404).json({ error: 'Client not found' });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch monthly payment records' });
  }
});

// GET /api/crm/clients/:id/monthly-payments/history
// VIEW ONLY: Permanent Payment History Log
router.get('/clients/:id/monthly-payments/history', authenticateToken, requireEmployeeOrAdmin, (req, res) => {
  try {
    const history = db.prepare(`
      SELECT * FROM monthly_payment_history 
      WHERE client_id = ? 
      ORDER BY created_at DESC
    `).all(req.params.id);

    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// POST /api/crm/clients/:id/monthly-payments/generate
// MUTATION: Manager / Admin Only (Employees receive 403 Forbidden)
router.post('/clients/:id/monthly-payments/generate', authenticateToken, requireManagerOrAdmin, (req, res) => {
  try {
    const { agreement_id, agreement_duration, monthly_fee, start_date } = req.body;
    const client = db.prepare(`SELECT id, client_number FROM clients WHERE id = ?`).get(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });

    const durNum = agreement_duration === '1 Month' ? 1 : agreement_duration === '2 Months' ? 2 : agreement_duration === '4 Months' ? 4 : agreement_duration === '12 Months' ? 12 : 6;
    // Fixed monthly fee: e.g. 8000 per month. Do NOT divide by months!
    const fee = parseFloat(monthly_fee) || 8000;
    const baseDate = new Date(start_date || new Date().toISOString().split('T')[0]);

    // Check if records already exist; if not or forced, delete old and generate fresh
    db.prepare(`DELETE FROM monthly_payment_records WHERE client_id = ?`).run(req.params.id);

    const insertStmt = db.prepare(`
      INSERT INTO monthly_payment_records (
        id, client_id, agreement_id, month_number, due_date, expected_amount, received_amount, payment_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 0, 'Pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    const createdRecords = [];
    for (let i = 0; i < durNum; i++) {
      const d = new Date(baseDate);
      d.setMonth(baseDate.getMonth() + i);
      const dueDateStr = d.toISOString().split('T')[0];
      const recId = 'mpr-' + (client.id.slice(-6)) + '-m' + (i + 1) + '-' + uuidv4().slice(0, 4);

      insertStmt.run(
        recId,
        client.id,
        agreement_id || null,
        i + 1,
        dueDateStr,
        fee
      );

      createdRecords.push({
        id: recId,
        month_number: i + 1,
        due_date: dueDateStr,
        expected_amount: fee,
        received_amount: 0,
        pending_amount: fee,
        payment_status: 'Pending'
      });
    }

    const totalAgreementFee = fee * durNum;
    db.prepare(`UPDATE clients SET sx_fee = ?, pending_amount = ?, fees_status = 'Pending', updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(totalAgreementFee, totalAgreementFee, client.id);

    logAudit(req, 'Payment Schedule Generated', 'Payments', client.id, {
      totalMonths: durNum,
      monthlyFee: fee,
      totalAgreementFee
    });

    res.status(201).json({
      message: `Monthly payment schedule generated: ${durNum} months @ ₹${fee}/month (Total ₹${totalAgreementFee})`,
      records: createdRecords
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate monthly payment records' });
  }
});

// PUT /api/crm/monthly-payments/:id
// MUTATION: Manager / Admin Only (Employees receive 403 Forbidden)
router.put('/monthly-payments/:id', authenticateToken, requireManagerOrAdmin, (req, res) => {
  try {
    const existing = db.prepare(`SELECT * FROM monthly_payment_records WHERE id = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Payment record not found' });

    const { received_amount, expected_amount, payment_date, remarks, payment_status, payment_type } = req.body;

    // Expected amount update if needed (manager control)
    const expected = expected_amount !== undefined ? parseFloat(expected_amount) : existing.expected_amount;

    // Received amount calculation
    let newReceived = existing.received_amount;
    let paymentDelta = 0;

    if (received_amount !== undefined) {
      const inputAmt = parseFloat(received_amount);
      if (payment_type === 'add_to_received') {
        // Increment payment (e.g. client pays another 4000)
        paymentDelta = inputAmt;
        newReceived = existing.received_amount + inputAmt;
      } else {
        // Direct set received amount
        paymentDelta = inputAmt - existing.received_amount;
        newReceived = inputAmt;
      }
    }

    // Determine status
    let computedStatus = payment_status;
    if (!computedStatus) {
      if (newReceived >= expected && expected > 0) {
        computedStatus = 'Paid';
      } else if (newReceived > 0) {
        computedStatus = 'Partially Paid';
      } else {
        computedStatus = new Date(existing.due_date) < new Date() ? 'Overdue' : 'Pending';
      }
    }

    const payDate = payment_date || (newReceived > 0 ? new Date().toISOString().split('T')[0] : null);
    const payRemarks = remarks !== undefined ? remarks : (existing.remarks || '');

    // 1. Update Monthly Payment Record
    db.prepare(`
      UPDATE monthly_payment_records SET
        expected_amount = ?,
        received_amount = ?,
        payment_date = ?,
        payment_status = ?,
        remarks = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      expected,
      newReceived,
      payDate,
      computedStatus,
      payRemarks,
      req.params.id
    );

    // 2. Permanent Payment History Recording (NEVER Overwrite Previous History)
    const historyId = 'mph-' + uuidv4().slice(0, 8);
    const client = db.prepare(`SELECT * FROM clients WHERE id = ?`).get(existing.client_id);

    db.prepare(`
      INSERT INTO monthly_payment_history (
        id, monthly_record_id, client_id, agreement_id, month_number, payment_date, amount_received, cumulative_received, payment_status, remarks, updated_by_id, updated_by_name, updated_by_role, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      historyId,
      existing.id,
      existing.client_id,
      existing.agreement_id || null,
      existing.month_number,
      payDate || new Date().toISOString().split('T')[0],
      paymentDelta !== 0 ? Math.abs(paymentDelta) : newReceived,
      newReceived,
      computedStatus,
      payRemarks || (computedStatus === 'Paid' ? 'Monthly fee received' : 'Payment update recorded'),
      req.user.id || 'mgr-fin',
      req.user.name || 'Finance Manager',
      req.user.role || 'manager'
    );

    // 3. Auto-sync Client Total Received, Pending & Fee Status
    const allRecords = db.prepare(`SELECT * FROM monthly_payment_records WHERE client_id = ?`).all(existing.client_id);
    const totalReceivedSum = allRecords.reduce((sum, r) => sum + (r.received_amount || 0), 0);
    const totalExpectedSum = allRecords.reduce((sum, r) => sum + (r.expected_amount || 0), 0);
    const pendingBalance = Math.max(0, totalExpectedSum - totalReceivedSum);
    const overallFeeStatus = totalReceivedSum >= totalExpectedSum && totalExpectedSum > 0 ? 'Paid' : totalReceivedSum > 0 ? 'Partial' : 'Pending';

    db.prepare(`
      UPDATE clients SET
        total_received = ?,
        sx_fee = ?,
        pending_amount = ?,
        fees_status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(totalReceivedSum, totalExpectedSum, pendingBalance, overallFeeStatus, existing.client_id);

    // Also record receipt into payments table for financial verification tracking
    if (newReceived > existing.received_amount) {
      const addedAmt = newReceived - existing.received_amount;
      const count = db.prepare(`SELECT COUNT(*) as count FROM payments`).get().count + 1;
      const receiptNum = `REC-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;
      const paymentReceiptId = 'pay-' + uuidv4().slice(0, 8);

      db.prepare(`
        INSERT INTO payments (
          id, receipt_number, client_id, agreement_id, amount, payment_method, transaction_id, status, verified_by, verified_at, payment_date, created_at
        ) VALUES (?, ?, ?, ?, ?, 'Manager Direct Entry', ?, 'verified', ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP)
      `).run(
        paymentReceiptId,
        receiptNum,
        existing.client_id,
        existing.agreement_id || null,
        addedAmt,
        `MGR-UPDATE-M${existing.month_number}`,
        req.user.name,
        payDate || new Date().toISOString().split('T')[0]
      );
    }

    logAudit(req, 'Monthly Payment Updated', 'Payments', req.params.id, {
      client: client?.client_number,
      monthNumber: existing.month_number,
      expected,
      received: newReceived,
      status: computedStatus,
      updatedBy: req.user.name
    });

    // Re-evaluate payment due & overdue notifications in real time
    if (typeof db.runPaymentDueCheck === 'function') {
      db.runPaymentDueCheck();
    }

    res.json({
      message: `Month ${existing.month_number} payment updated successfully. Status: ${computedStatus}, Received: ₹${newReceived}`,
      record: {
        id: existing.id,
        month_number: existing.month_number,
        expected_amount: expected,
        received_amount: newReceived,
        pending_amount: Math.max(0, expected - newReceived),
        payment_status: computedStatus,
        payment_date: payDate,
        remarks: payRemarks
      },
      summary: {
        total_agreement_fee: totalExpectedSum,
        total_received: totalReceivedSum,
        total_pending: pendingBalance,
        fees_status: overallFeeStatus
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update monthly payment record' });
  }
});

// DELETE /api/crm/monthly-payments/:id
// MUTATION: Manager / Admin Only
router.delete('/monthly-payments/:id', authenticateToken, requireManagerOrAdmin, (req, res) => {
  try {
    const existing = db.prepare(`SELECT * FROM monthly_payment_records WHERE id = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Payment record not found' });

    db.prepare(`DELETE FROM monthly_payment_records WHERE id = ?`).run(req.params.id);
    logAudit(req, 'Monthly Payment Record Deleted', 'Payments', req.params.id, { client_id: existing.client_id, month: existing.month_number });

    if (typeof db.runPaymentDueCheck === 'function') {
      db.runPaymentDueCheck();
    }

    res.json({ message: `Month ${existing.month_number} payment record removed` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete payment record' });
  }
});

// ============================================================
// PAYMENT DUE DATE NOTIFICATIONS API
// ============================================================

// GET /api/crm/notifications — Scoped Notification Bell Feed & Badges
router.get('/notifications', authenticateToken, (req, res) => {
  try {
    if (typeof db.runPaymentDueCheck === 'function') {
      db.runPaymentDueCheck();
    }

    const { status, type, is_read } = req.query;
    let sql = `
      SELECT 
        n.*,
        c.name as client_name,
        c.client_number,
        c.phone as client_phone,
        c.city as client_city,
        u.name as employee_name
      FROM payment_due_notifications n
      JOIN clients c ON n.client_id = c.id
      LEFT JOIN users u ON n.employee_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // Role Scoping:
    // Employee: Only notifications for assigned clients
    if (req.user.role === 'employee') {
      sql += ` AND (n.employee_id = ? OR c.employee_id = ?)`;
      params.push(req.user.id, req.user.id);
    }
    // Manager: Notifications for clients within team/department scope
    else if (req.user.role === 'manager') {
      sql += ` AND (
        n.employee_id = ? 
        OR c.manager_id = ? 
        OR n.employee_id IN (SELECT id FROM users WHERE manager_id = ? OR department_id = (SELECT department_id FROM users WHERE id = ?))
        OR c.employee_id IN (SELECT id FROM users WHERE manager_id = ? OR department_id = (SELECT department_id FROM users WHERE id = ?))
      )`;
      params.push(req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id);
    }

    if (status && status !== 'all') {
      sql += ` AND n.status = ?`;
      params.push(status);
    }

    if (type && type !== 'all') {
      sql += ` AND n.notification_type = ?`;
      params.push(type);
    }

    if (is_read !== undefined && is_read !== '') {
      sql += ` AND n.is_read = ?`;
      params.push(parseInt(is_read, 10));
    }

    sql += ` ORDER BY 
      CASE 
        WHEN n.notification_type = 'PAYMENT_DUE_TODAY' AND n.status = 'active' THEN 1
        WHEN n.notification_type = 'PAYMENT_OVERDUE' AND n.status = 'active' THEN 2
        WHEN n.notification_type = 'PARTIAL_PAYMENT' AND n.status = 'active' THEN 3
        ELSE 4
      END,
      n.due_date DESC,
      n.created_at DESC
      LIMIT 100`;

    const notifications = db.prepare(sql).all(...params);

    // Summary counts for badges
    let countSql = `
      SELECT 
        COUNT(CASE WHEN n.is_read = 0 AND n.status = 'active' THEN 1 END) as unread_count,
        COUNT(CASE WHEN n.notification_type = 'PAYMENT_DUE_TODAY' AND n.status = 'active' THEN 1 END) as due_today_count,
        COUNT(CASE WHEN n.notification_type = 'PAYMENT_OVERDUE' AND n.status = 'active' THEN 1 END) as overdue_count,
        COUNT(CASE WHEN n.notification_type = 'PARTIAL_PAYMENT' AND n.status = 'active' THEN 1 END) as partial_count,
        COUNT(CASE WHEN n.notification_type = 'PAYMENT_RECEIVED' THEN 1 END) as received_count
      FROM payment_due_notifications n
      JOIN clients c ON n.client_id = c.id
      WHERE 1=1
    `;
    const countParams = [];
    if (req.user.role === 'employee') {
      countSql += ` AND (n.employee_id = ? OR c.employee_id = ?)`;
      countParams.push(req.user.id, req.user.id);
    } else if (req.user.role === 'manager') {
      countSql += ` AND (
        n.employee_id = ? 
        OR c.manager_id = ? 
        OR n.employee_id IN (SELECT id FROM users WHERE manager_id = ? OR department_id = (SELECT department_id FROM users WHERE id = ?))
        OR c.employee_id IN (SELECT id FROM users WHERE manager_id = ? OR department_id = (SELECT department_id FROM users WHERE id = ?))
      )`;
      countParams.push(req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id);
    }

    const counts = db.prepare(countSql).get(...countParams) || {
      unread_count: 0,
      due_today_count: 0,
      overdue_count: 0,
      partial_count: 0,
      received_count: 0
    };

    res.json({
      notifications,
      counts
    });
  } catch (err) {
    console.error('Failed to get notifications', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// POST /api/crm/notifications/run-due-check — Trigger Daily Check On Demand
router.post('/notifications/run-due-check', authenticateToken, (req, res) => {
  try {
    const { target_date } = req.body || {};
    if (typeof db.runPaymentDueCheck === 'function') {
      db.runPaymentDueCheck(target_date);
    }
    res.json({ message: 'Payment due date check completed successfully', target_date: target_date || 'Today' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to run payment due check' });
  }
});

// PATCH /api/crm/notifications/:id/read — Mark single notification read
router.patch('/notifications/:id/read', authenticateToken, (req, res) => {
  try {
    db.prepare(`UPDATE payment_due_notifications SET is_read = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(req.params.id);
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// POST /api/crm/notifications/mark-all-read — Mark all accessible notifications read
router.post('/notifications/mark-all-read', authenticateToken, (req, res) => {
  try {
    let sql = `UPDATE payment_due_notifications SET is_read = 1, updated_at = CURRENT_TIMESTAMP WHERE is_read = 0`;
    const params = [];
    if (req.user.role === 'employee') {
      sql += ` AND (employee_id = ? OR client_id IN (SELECT id FROM clients WHERE employee_id = ?))`;
      params.push(req.user.id, req.user.id);
    }
    db.prepare(sql).run(...params);
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});
// ==========================================
// 8. PAYMENTS MANAGEMENT & VERIFICATION (ADMIN & MANAGER)
// ==========================================
router.get('/payments', authenticateToken, (req, res) => {
  try {
    const { search, status, date } = req.query;
    let sql = `
      SELECT p.*, 
             c.name as client_name, c.client_number, c.phone as client_phone,
             a.agreement_number,
             u.name as employee_name
      FROM payments p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN agreements a ON p.agreement_id = a.id
      LEFT JOIN users u ON c.employee_id = u.id
      WHERE 1=1
    `;
    const params = [];
    if (status && status !== 'all') {
      sql += ` AND p.status = ?`;
      params.push(status);
    }
    if (date) {
      sql += ` AND date(p.payment_date) = date(?)`;
      params.push(date);
    }
    if (search) {
      sql += ` AND (p.receipt_number LIKE ? OR c.name LIKE ? OR c.client_number LIKE ? OR p.transaction_id LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    sql += ` ORDER BY p.created_at DESC`;
    const payments = db.prepare(sql).all(...params);
    res.json({ payments });
  } catch (err) {
    console.error('Failed to fetch payments', err);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

router.patch('/payments/:id/verify', authenticateToken, (req, res) => {
  try {
    const { status = 'verified', notes } = req.body;
    const payment = db.prepare(`SELECT * FROM payments WHERE id = ?`).get(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    db.prepare(`
      UPDATE payments 
      SET status = ?, verified_by = ?, verified_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, req.user.name, req.params.id);

    if (payment.client_id && status === 'verified') {
      const sumRow = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE client_id = ? AND status = 'verified'`).get(payment.client_id);
      const totalRec = sumRow ? sumRow.total : payment.amount;
      const client = db.prepare(`SELECT * FROM clients WHERE id = ?`).get(payment.client_id);
      if (client) {
        const sxFee = client.sx_fee || (client.total_debt * 0.1) || 0;
        const feeStatus = totalRec >= sxFee && sxFee > 0 ? 'Paid' : totalRec > 0 ? 'Partial' : 'Pending';
        db.prepare(`UPDATE clients SET total_received = ?, fees_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(totalRec, feeStatus, payment.client_id);
      }
    }

    logAudit(req, 'Payment Verified', 'Payments', req.params.id, { receipt: payment.receipt_number, amount: payment.amount, status, notes });
    res.json({ message: `Payment marked as ${status}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// ==========================================
// 9. OPERATIONS TASKS QUEUE
// ==========================================
router.get('/tasks', authenticateToken, (req, res) => {
  try {
    const { status, module: mod } = req.query;
    let sql = `
      SELECT t.*, 
             u.name as assigned_to_name, u.emp_or_mgr_id as assigned_to_code
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE 1=1
    `;
    const params = [];
    if (status && status !== 'all') {
      sql += ` AND t.status = ?`;
      params.push(status);
    }
    if (mod && mod !== 'all') {
      sql += ` AND t.module = ?`;
      params.push(mod);
    }
    sql += ` ORDER BY t.created_at DESC`;
    const tasks = db.prepare(sql).all(...params);
    res.json({ tasks });
  } catch (err) {
    console.error('Failed to fetch tasks', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

router.post('/tasks', authenticateToken, (req, res) => {
  try {
    const { title, description, module: mod, priority = 'medium', due_date, assigned_to } = req.body;
    if (!title) return res.status(400).json({ error: 'Task title is required' });

    const id = 'task-' + uuidv4().slice(0, 8);
    db.prepare(`
      INSERT INTO tasks (id, title, description, module, priority, due_date, status, assigned_to, created_by)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).run(id, title.trim(), description || null, mod || 'General', priority, due_date || null, assigned_to || null, req.user.name);

    logAudit(req, 'Task Created', 'Tasks', id, { title, priority, due_date });
    res.status(201).json({ message: 'Task created successfully', id });
  } catch (err) {
    console.error('Failed to create task', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

router.patch('/tasks/:id/status', authenticateToken, (req, res) => {
  try {
    const { status } = req.body;
    db.prepare(`UPDATE tasks SET status = ? WHERE id = ?`).run(status, req.params.id);
    res.json({ message: 'Task status updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task status' });
  }
});

// ==========================================
// 10. REPORTS SUMMARY
// ==========================================
const handleReportsSummary = (req, res) => {
  try {
    const deptStats = db.prepare(`
      SELECT d.name as department, 
             COUNT(DISTINCT u.id) as total_staff,
             COUNT(DISTINCT l.id) as total_leads,
             COUNT(DISTINCT c.id) as total_clients
      FROM departments d
      LEFT JOIN users u ON u.department_id = d.id
      LEFT JOIN leads l ON l.department_id = d.id
      LEFT JOIN clients c ON c.manager_id = u.id
      GROUP BY d.id, d.name
    `).all();

    const planStats = db.prepare(`
      SELECT fp.name as plan_name, fp.duration, fp.default_fee,
             COUNT(c.id) as client_count,
             COALESCE(SUM(a.total_fee), 0) as total_revenue
      FROM fee_plans fp
      LEFT JOIN clients c ON c.fee_plan_id = fp.id
      LEFT JOIN agreements a ON a.fee_plan_id = fp.id
      GROUP BY fp.id, fp.name
    `).all();

    res.json({ deptStats, planStats });
  } catch (err) {
    console.error('Failed to generate reports', err);
    res.status(500).json({ error: 'Failed to generate reports' });
  }
};

router.get('/reports-summary', authenticateToken, handleReportsSummary);
router.get('/reports/summary', authenticateToken, handleReportsSummary);

// POST /api/crm/wipe-data - Admin endpoint to wipe all transactional CRM data cleanly from local SQLite & Supabase
router.post('/wipe-data', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { wipeAllData } = require('../scripts/wipe_all_data');
    await wipeAllData();
    logAudit(req, 'RESET', 'System', 'ALL', 'Wiped all transactional CRM data while preserving user accounts');
    res.json({ success: true, message: 'All transactional CRM data successfully wiped from SQLite and Supabase.' });
  } catch (err) {
    console.error('Wipe data error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// BUILD: 2026-09-04T07:54:13.516Z

module.exports = router;

