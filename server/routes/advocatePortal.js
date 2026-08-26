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

// GET /api/advocate-portal/profile
router.get('/profile', authenticateToken, requireAdvocateOrAdmin, (req, res) => {
  try {
    const { advocateRecord } = getAdvocateScope(req);
    res.json({
      user: req.user,
      advocate: advocateRecord
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch advocate profile' });
  }
});

module.exports = router;
