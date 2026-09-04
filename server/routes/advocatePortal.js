const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticateToken, requireAdvocateOrAdmin, getAdvocateScope, logAudit } = require('../middleware/auth');

// GET /api/advocate-portal/dashboard
router.get('/dashboard', authenticateToken, requireAdvocateOrAdmin, (req, res) => {
  try {
    const { isAdmin, advocateId } = getAdvocateScope(req);
    const advFilter = isAdmin ? '' : `WHERE c.advocate_id = '${advocateId}'`;

    const totalCases = db.prepare(`SELECT COUNT(*) as count FROM clients c ${advFilter}`).get().count;

    const activeCases = db.prepare(`
      SELECT COUNT(*) as count FROM clients c 
      ${advFilter ? advFilter + " AND (c.case_status = 'active' OR c.status = 'active')" : "WHERE (c.case_status = 'active' OR c.status = 'active')"}
    `).get().count;

    const closedCases = db.prepare(`
      SELECT COUNT(*) as count FROM clients c 
      ${advFilter ? advFilter + " AND (c.case_status = 'closed' OR c.case_status = 'dropped' OR c.status = 'closed' OR c.status = 'dropped')" : "WHERE (c.case_status = 'closed' OR c.case_status = 'dropped' OR c.status = 'closed' OR c.status = 'dropped')"}
    `).get().count;

    const totalDebtRow = db.prepare(`
      SELECT COALESCE(SUM(c.total_debt), 0) as total 
      FROM clients c 
      ${advFilter}
    `).get();

    const recentCases = db.prepare(`
      SELECT c.id, c.client_number, c.name, c.phone, c.city, c.total_debt, 
             c.case_status, c.updated_at,
             u.name as consultant_name, u.phone as consultant_phone
      FROM clients c
      LEFT JOIN users u ON c.employee_id = u.id
      ${advFilter}
      ORDER BY c.updated_at DESC
      LIMIT 8
    `).all();

    res.json({
      summaryCards: {
        totalAssignedCases: totalCases,
        activeCases: activeCases,
        closedCases: closedCases,
        totalDebtManaged: totalDebtRow.total
      },
      recentCases
    });
  } catch (err) {
    console.error('Advocate dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch advocate dashboard' });
  }
});

// GET /api/advocate-portal/cases
router.get('/cases', authenticateToken, requireAdvocateOrAdmin, (req, res) => {
  try {
    const { isAdmin, advocateId } = getAdvocateScope(req);
    const { search, case_status, date, from_date, to_date, page = 1, limit = 25 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereConditions = [];
    let params = [];

    if (!isAdmin) {
      whereConditions.push(`c.advocate_id = ?`);
      params.push(advocateId);
    }

    if (search) {
      whereConditions.push(`(c.name LIKE ? OR c.client_number LIKE ? OR c.phone LIKE ? OR c.city LIKE ? OR c.email LIKE ?)`);
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }

    if (case_status && case_status !== 'all') {
      whereConditions.push(`(c.case_status = ? OR c.status = ?)`);
      params.push(case_status, case_status);
    }

    if (date) {
      whereConditions.push(`date(c.created_at) = date(?)`);
      params.push(date);
    } else if (from_date && to_date) {
      whereConditions.push(`date(c.created_at) >= date(?) AND date(c.created_at) <= date(?)`);
      params.push(from_date, to_date);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countRow = db.prepare(`SELECT COUNT(*) as count FROM clients c ${whereClause}`).get(...params);
    const total = countRow.count;

    const cases = db.prepare(`
      SELECT c.id, c.client_number, c.name, c.email, c.phone, c.city,
             c.total_debt, c.settlement_target, c.case_status, c.status,
             c.created_at, c.updated_at,
             u.name as consultant_name, u.phone as consultant_phone,
             (SELECT COUNT(*) FROM lenders l WHERE l.client_id = c.id) as lender_count,
             (SELECT COUNT(*) FROM agreements a WHERE a.client_id = c.id) as agreement_count
      FROM clients c
      LEFT JOIN users u ON c.employee_id = u.id
      ${whereClause}
      ORDER BY c.updated_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, Number(limit), offset);

    res.json({
      cases,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    console.error('Advocate cases error:', err);
    res.status(500).json({ error: 'Failed to fetch assigned cases' });
  }
});

// GET /api/advocate-portal/cases/:id
router.get('/cases/:id', authenticateToken, requireAdvocateOrAdmin, (req, res) => {
  try {
    const { isAdmin, advocateId } = getAdvocateScope(req);

    const client = db.prepare(`
      SELECT c.*,
             u.name as consultant_name, u.phone as consultant_phone, u.email as consultant_email,
             a.name as advocate_name, a.advocate_id as advocate_code, a.registration_number as advocate_reg
      FROM clients c
      LEFT JOIN users u ON c.employee_id = u.id
      LEFT JOIN advocates a ON c.advocate_id = a.id
      WHERE c.id = ?
    `).get(req.params.id);

    if (!client) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Security: Advocate can only see their own assigned case
    if (!isAdmin && client.advocate_id !== advocateId) {
      return res.status(403).json({ error: 'Forbidden: You are not assigned to this case' });
    }

    const lenders = db.prepare(`SELECT * FROM lenders WHERE client_id = ? ORDER BY created_at ASC`).all(client.id);
    const agreements = db.prepare(`SELECT * FROM agreements WHERE client_id = ? ORDER BY created_at DESC`).all(client.id);
    const history = db.prepare(`SELECT * FROM advocate_assignment_history WHERE client_id = ? ORDER BY created_at DESC`).all(client.id);
    const tasks = db.prepare(`SELECT * FROM tasks WHERE module = 'Legal' AND (title LIKE ? OR description LIKE ?) ORDER BY created_at DESC`).all(`%${client.client_number}%`, `%${client.name}%`);

    res.json({
      case: client,
      lenders,
      agreements,
      assignmentHistory: history,
      tasks
    });
  } catch (err) {
    console.error('Advocate single case error:', err);
    res.status(500).json({ error: 'Failed to fetch case details' });
  }
});

// POST /api/advocate-portal/cases/:id/tasks
router.post('/cases/:id/tasks', authenticateToken, requireAdvocateOrAdmin, (req, res) => {
  try {
    const { isAdmin, advocateId } = getAdvocateScope(req);
    const client = db.prepare(`SELECT id, client_number, name, advocate_id FROM clients WHERE id = ?`).get(req.params.id);

    if (!client) return res.status(404).json({ error: 'Case not found' });
    if (!isAdmin && client.advocate_id !== advocateId) {
      return res.status(403).json({ error: 'Forbidden: You are not assigned to this case' });
    }

    const { title, description, priority = 'medium', due_date } = req.body;
    if (!title) return res.status(400).json({ error: 'Task title is required' });

    const taskId = 'task-' + uuidv4().slice(0, 8);
    db.prepare(`
      INSERT INTO tasks (id, title, description, module, priority, due_date, status, created_by)
      VALUES (?, ?, ?, 'Legal', ?, ?, 'pending', ?)
    `).run(taskId, `[${client.client_number}] ${title}`, description || null, priority, due_date || null, req.user.name);

    logAudit(req, 'Legal Task Created', 'Tasks', taskId, {
      client: client.client_number,
      title
    });

    res.status(201).json({ message: 'Task logged successfully', taskId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// =====================================================
// SEQUENTIAL NUMBER GENERATORS
// =====================================================
function generateLegalNoticeNumber() {
  const rows = db.prepare(`SELECT notice_number as num FROM legal_notices WHERE notice_number LIKE 'LN-%'`).all();
  let maxNum = 0;
  for (const r of rows) {
    if (r.num) {
      const match = r.num.match(/^LN-(\d+)/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    }
  }
  return `LN-${String(maxNum + 1).padStart(4, '0')}`;
}

function generateDemandNoticeNumber() {
  const rows = db.prepare(`SELECT demand_number as num FROM demand_notices WHERE demand_number LIKE 'DN-%'`).all();
  let maxNum = 0;
  for (const r of rows) {
    if (r.num) {
      const match = r.num.match(/^DN-(\d+)/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    }
  }
  return `DN-${String(maxNum + 1).padStart(4, '0')}`;
}

// =====================================================
// LEGAL NOTICES CRUD
// =====================================================
// GET /api/advocate-portal/legal-notices
router.get('/legal-notices', authenticateToken, requireAdvocateOrAdmin, (req, res) => {
  try {
    const { isAdmin, advocateId } = getAdvocateScope(req);
    const { search, status, notice_type, client_id, date, from_date, to_date, page = 1, limit = 25 } = req.query;

    let sql = `
      SELECT ln.*, c.name as client_name, c.client_number, c.phone as client_phone, c.city as client_city
      FROM legal_notices ln
      LEFT JOIN clients c ON ln.client_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (!isAdmin && advocateId) {
      sql += ` AND (ln.advocate_id = ? OR c.advocate_id = ?)`;
      params.push(advocateId, advocateId);
    }

    if (search) {
      const cleanSearch = `%${search.trim().toLowerCase()}%`;
      sql += ` AND (ln.notice_number LIKE ? OR ln.bank_name LIKE ? OR c.name LIKE ? OR c.phone LIKE ? OR ln.speed_post_number LIKE ?)`;
      params.push(cleanSearch, cleanSearch, cleanSearch, cleanSearch, cleanSearch);
    }

    if (status && status !== 'all') {
      sql += ` AND ln.status = ?`;
      params.push(status);
    }

    if (notice_type && notice_type !== 'all') {
      sql += ` AND ln.notice_type = ?`;
      params.push(notice_type);
    }

    if (client_id) {
      sql += ` AND ln.client_id = ?`;
      params.push(client_id);
    }

    if (from_date && to_date) {
      sql += ` AND date(ln.notice_date) >= date(?) AND date(ln.notice_date) <= date(?)`;
      params.push(from_date, to_date);
    } else if (date) {
      sql += ` AND date(ln.notice_date) = date(?)`;
      params.push(date);
    }

    // Counts by status
    const allCount = db.prepare(`SELECT COUNT(*) as c FROM legal_notices`).get().c;
    const dispatchedCount = db.prepare(`SELECT COUNT(*) as c FROM legal_notices WHERE status = 'Dispatched'`).get().c;
    const deliveredCount = db.prepare(`SELECT COUNT(*) as c FROM legal_notices WHERE status = 'Delivered'`).get().c;
    const draftCount = db.prepare(`SELECT COUNT(*) as c FROM legal_notices WHERE status = 'Draft'`).get().c;

    sql += ` ORDER BY ln.created_at DESC LIMIT ? OFFSET ?`;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const notices = db.prepare(sql).all(...params);

    res.json({
      notices,
      statusCounts: {
        all: allCount,
        dispatched: dispatchedCount,
        delivered: deliveredCount,
        draft: draftCount
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: notices.length
      }
    });
  } catch (err) {
    console.error('Fetch legal notices error:', err);
    res.status(500).json({ error: 'Failed to fetch legal notices' });
  }
});

// POST /api/advocate-portal/legal-notices
router.post('/legal-notices', authenticateToken, requireAdvocateOrAdmin, (req, res) => {
  try {
    const {
      client_id,
      bank_name,
      loan_account_no,
      notice_type = 'Anti-Harassment Notice',
      notice_subject,
      notice_content,
      notice_date,
      dispatch_date,
      speed_post_number,
      tracking_url,
      status = 'Draft'
    } = req.body;

    if (!bank_name) return res.status(400).json({ error: 'Bank Name is required' });

    let client = null;
    if (client_id) {
      client = db.prepare(`SELECT id, name, client_number, phone FROM clients WHERE id = ?`).get(client_id);
    }

    const id = 'ln-' + uuidv4().slice(0, 8);
    const notice_number = generateLegalNoticeNumber();
    const finalNoticeDate = notice_date || new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO legal_notices (
        id, notice_number, client_id, client_name, bank_name, loan_account_no,
        notice_type, notice_subject, notice_content, notice_date, dispatch_date,
        speed_post_number, tracking_url, status, advocate_id, advocate_name, created_by,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      id,
      notice_number,
      client?.id || null,
      client?.name || req.body.client_name || 'Client',
      bank_name.trim(),
      loan_account_no || null,
      notice_type,
      notice_subject || `Legal Notice regarding Loan Accounts with ${bank_name}`,
      notice_content || null,
      finalNoticeDate,
      dispatch_date || null,
      speed_post_number || null,
      tracking_url || (speed_post_number ? `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx` : null),
      status,
      req.user.id,
      req.user.name,
      req.user.name
    );

    logAudit(req, 'Legal Notice Issued', 'Legal Notices', id, { notice_number, bank_name });
    res.status(201).json({ message: `Legal Notice ${notice_number} generated successfully`, id, notice_number });
  } catch (err) {
    console.error('Create legal notice error:', err);
    res.status(500).json({ error: err.message || 'Failed to create legal notice' });
  }
});

// PUT /api/advocate-portal/legal-notices/:id
router.put('/legal-notices/:id', authenticateToken, requireAdvocateOrAdmin, (req, res) => {
  try {
    const existing = db.prepare(`SELECT * FROM legal_notices WHERE id = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Legal notice not found' });

    const {
      bank_name,
      loan_account_no,
      notice_type,
      notice_subject,
      notice_content,
      notice_date,
      dispatch_date,
      speed_post_number,
      tracking_url,
      status
    } = req.body;

    db.prepare(`
      UPDATE legal_notices SET
        bank_name = COALESCE(?, bank_name),
        loan_account_no = COALESCE(?, loan_account_no),
        notice_type = COALESCE(?, notice_type),
        notice_subject = COALESCE(?, notice_subject),
        notice_content = COALESCE(?, notice_content),
        notice_date = COALESCE(?, notice_date),
        dispatch_date = COALESCE(?, dispatch_date),
        speed_post_number = COALESCE(?, speed_post_number),
        tracking_url = COALESCE(?, tracking_url),
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      bank_name,
      loan_account_no,
      notice_type,
      notice_subject,
      notice_content,
      notice_date,
      dispatch_date,
      speed_post_number,
      tracking_url,
      status,
      req.params.id
    );

    res.json({ message: 'Legal notice updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update legal notice' });
  }
});

// DELETE /api/advocate-portal/legal-notices/:id
router.delete('/legal-notices/:id', authenticateToken, requireAdvocateOrAdmin, (req, res) => {
  try {
    db.prepare(`DELETE FROM legal_notices WHERE id = ?`).run(req.params.id);
    res.json({ message: 'Legal notice deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete legal notice' });
  }
});

// =====================================================
// DEMAND NOTICES CRUD
// =====================================================
// GET /api/advocate-portal/demand-notices
router.get('/demand-notices', authenticateToken, requireAdvocateOrAdmin, (req, res) => {
  try {
    const { isAdmin, advocateId } = getAdvocateScope(req);
    const { search, status, demand_type, client_id, page = 1, limit = 25 } = req.query;

    let sql = `
      SELECT dn.*, c.name as client_name, c.client_number, c.phone as client_phone, c.city as client_city
      FROM demand_notices dn
      LEFT JOIN clients c ON dn.client_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (!isAdmin && advocateId) {
      sql += ` AND (dn.advocate_id = ? OR c.advocate_id = ?)`;
      params.push(advocateId, advocateId);
    }

    if (search) {
      const cleanSearch = `%${search.trim().toLowerCase()}%`;
      sql += ` AND (dn.demand_number LIKE ? OR dn.bank_name LIKE ? OR c.name LIKE ? OR c.phone LIKE ? OR dn.loan_account_no LIKE ?)`;
      params.push(cleanSearch, cleanSearch, cleanSearch, cleanSearch, cleanSearch);
    }

    if (status && status !== 'all') {
      sql += ` AND dn.status = ?`;
      params.push(status);
    }

    if (demand_type && demand_type !== 'all') {
      sql += ` AND dn.demand_type = ?`;
      params.push(demand_type);
    }

    if (client_id) {
      sql += ` AND dn.client_id = ?`;
      params.push(client_id);
    }

    const allCount = db.prepare(`SELECT COUNT(*) as c FROM demand_notices`).get().c;
    const pendingCount = db.prepare(`SELECT COUNT(*) as c FROM demand_notices WHERE status = 'Pending Review'`).get().c;
    const repliedCount = db.prepare(`SELECT COUNT(*) as c FROM demand_notices WHERE status = 'Reply Dispatched' OR status = 'Reply Drafted'`).get().c;
    const settledCount = db.prepare(`SELECT COUNT(*) as c FROM demand_notices WHERE status = 'Settlement Agreed'`).get().c;

    sql += ` ORDER BY dn.created_at DESC LIMIT ? OFFSET ?`;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const notices = db.prepare(sql).all(...params);

    res.json({
      demandNotices: notices,
      statusCounts: {
        all: allCount,
        pending: pendingCount,
        replied: repliedCount,
        settled: settledCount
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: notices.length
      }
    });
  } catch (err) {
    console.error('Fetch demand notices error:', err);
    res.status(500).json({ error: 'Failed to fetch demand notices' });
  }
});

// POST /api/advocate-portal/demand-notices
router.post('/demand-notices', authenticateToken, requireAdvocateOrAdmin, (req, res) => {
  try {
    const {
      client_id,
      bank_name,
      loan_account_no,
      demand_type = 'Incoming Loan Recall Demand',
      demand_amount = 0,
      settlement_offer_amount = 0,
      notice_date,
      reply_due_date,
      status = 'Pending Review',
      remarks,
      file_attachment
    } = req.body;

    if (!bank_name) return res.status(400).json({ error: 'Bank Name is required' });

    let client = null;
    if (client_id) {
      client = db.prepare(`SELECT id, name, client_number, phone FROM clients WHERE id = ?`).get(client_id);
    }

    const id = 'dn-' + uuidv4().slice(0, 8);
    const demand_number = generateDemandNoticeNumber();
    const finalNoticeDate = notice_date || new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO demand_notices (
        id, demand_number, client_id, client_name, bank_name, loan_account_no,
        demand_type, demand_amount, settlement_offer_amount, notice_date, reply_due_date,
        status, remarks, file_attachment, advocate_id, advocate_name, created_by,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      id,
      demand_number,
      client?.id || null,
      client?.name || req.body.client_name || 'Client',
      bank_name.trim(),
      loan_account_no || null,
      demand_type,
      parseFloat(demand_amount) || 0,
      parseFloat(settlement_offer_amount) || Math.round((parseFloat(demand_amount) || 0) * 0.45),
      finalNoticeDate,
      reply_due_date || null,
      status,
      remarks || null,
      file_attachment || null,
      req.user.id,
      req.user.name,
      req.user.name
    );

    logAudit(req, 'Demand Notice Logged', 'Demand Notices', id, { demand_number, bank_name, demand_amount });
    res.status(201).json({ message: `Demand Notice ${demand_number} recorded successfully`, id, demand_number });
  } catch (err) {
    console.error('Create demand notice error:', err);
    res.status(500).json({ error: err.message || 'Failed to create demand notice' });
  }
});

// PUT /api/advocate-portal/demand-notices/:id
router.put('/demand-notices/:id', authenticateToken, requireAdvocateOrAdmin, (req, res) => {
  try {
    const existing = db.prepare(`SELECT * FROM demand_notices WHERE id = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Demand notice not found' });

    const {
      bank_name,
      loan_account_no,
      demand_type,
      demand_amount,
      settlement_offer_amount,
      notice_date,
      reply_due_date,
      status,
      remarks
    } = req.body;

    db.prepare(`
      UPDATE demand_notices SET
        bank_name = COALESCE(?, bank_name),
        loan_account_no = COALESCE(?, loan_account_no),
        demand_type = COALESCE(?, demand_type),
        demand_amount = COALESCE(?, demand_amount),
        settlement_offer_amount = COALESCE(?, settlement_offer_amount),
        notice_date = COALESCE(?, notice_date),
        reply_due_date = COALESCE(?, reply_due_date),
        status = COALESCE(?, status),
        remarks = COALESCE(?, remarks),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      bank_name,
      loan_account_no,
      demand_type,
      demand_amount !== undefined ? parseFloat(demand_amount) : null,
      settlement_offer_amount !== undefined ? parseFloat(settlement_offer_amount) : null,
      notice_date,
      reply_due_date,
      status,
      remarks,
      req.params.id
    );

    res.json({ message: 'Demand notice updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update demand notice' });
  }
});

// DELETE /api/advocate-portal/demand-notices/:id
router.delete('/demand-notices/:id', authenticateToken, requireAdvocateOrAdmin, (req, res) => {
  try {
    db.prepare(`DELETE FROM demand_notices WHERE id = ?`).run(req.params.id);
    res.json({ message: 'Demand notice deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete demand notice' });
  }
});

module.exports = router;
