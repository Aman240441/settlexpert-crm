const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticateToken, requireAdmin, logAudit } = require('../middleware/auth');

// --- LEADS ---
router.get('/leads', authenticateToken, requireAdmin, (req, res) => {
  try {
    const leads = db.prepare(`
      SELECT l.*, 
             m.name as manager_name,
             e.name as employee_name,
             d.name as department_name
      FROM leads l
      LEFT JOIN users m ON l.manager_id = m.id
      LEFT JOIN users e ON l.employee_id = e.id
      LEFT JOIN departments d ON l.department_id = d.id
      ORDER BY l.created_at DESC
    `).all();
    res.json({ leads });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

router.post('/leads', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, phone, email, loan_amount, bank_name, status = 'new', manager_id, employee_id, department_id } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'Name and phone are required' });

    const id = 'lead-' + uuidv4().slice(0, 8);
    const count = db.prepare(`SELECT COUNT(*) as count FROM leads`).get().count + 1;
    const leadNumber = `LD-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;

    db.prepare(`
      INSERT INTO leads (id, lead_number, name, email, phone, loan_amount, bank_name, status, manager_id, employee_id, department_id, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, leadNumber, name, email || null, phone, parseFloat(loan_amount) || 0, bank_name || null, status, manager_id || null, employee_id || null, department_id || null, req.user.name);

    logAudit(req, 'Lead Created', 'Leads', id, { leadNumber, name, loan_amount });
    res.status(201).json({ message: 'Lead created successfully', id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

// --- CLIENTS ---
router.get('/clients', authenticateToken, requireAdmin, (req, res) => {
  try {
    const clients = db.prepare(`
      SELECT c.*, 
             fp.name as fee_plan_name,
             m.name as manager_name,
             e.name as employee_name,
             a.name as advocate_name
      FROM clients c
      LEFT JOIN fee_plans fp ON c.fee_plan_id = fp.id
      LEFT JOIN users m ON c.manager_id = m.id
      LEFT JOIN users e ON c.employee_id = e.id
      LEFT JOIN advocates a ON c.advocate_id = a.id
      ORDER BY c.created_at DESC
    `).all();
    res.json({ clients });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

router.post('/clients', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, phone, email, total_debt, settlement_target, fee_plan_id, status = 'active', manager_id, employee_id, advocate_id } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'Name and phone are required' });

    const id = 'cli-' + uuidv4().slice(0, 8);
    const count = db.prepare(`SELECT COUNT(*) as count FROM clients`).get().count + 1;
    const clientNumber = `CL-${String(8800 + count)}`;

    db.prepare(`
      INSERT INTO clients (id, client_number, name, email, phone, total_debt, settlement_target, fee_plan_id, status, manager_id, employee_id, advocate_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, clientNumber, name, email || null, phone, parseFloat(total_debt) || 0, parseFloat(settlement_target) || 0, fee_plan_id || null, status, manager_id || null, employee_id || null, advocate_id || null);

    logAudit(req, 'Client Created', 'Clients', id, { clientNumber, name, total_debt });
    res.status(201).json({ message: 'Client created successfully', id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// --- AGREEMENTS ---
router.get('/agreements', authenticateToken, requireAdmin, (req, res) => {
  try {
    const agreements = db.prepare(`
      SELECT a.*, 
             c.name as client_name, c.client_number, c.phone as client_phone,
             fp.name as fee_plan_name, fp.duration as fee_plan_duration
      FROM agreements a
      LEFT JOIN clients c ON a.client_id = c.id
      LEFT JOIN fee_plans fp ON a.fee_plan_id = fp.id
      ORDER BY a.created_at DESC
    `).all();
    res.json({ agreements });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch agreements' });
  }
});

router.post('/agreements', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { client_id, fee_plan_id, total_fee, status = 'active', start_date, end_date } = req.body;
    if (!client_id || total_fee === undefined) return res.status(400).json({ error: 'Client ID and total fee are required' });

    const id = 'agr-' + uuidv4().slice(0, 8);
    const count = db.prepare(`SELECT COUNT(*) as count FROM agreements`).get().count + 1;
    const agreementNumber = `AGR-${new Date().getFullYear()}-${String(count).padStart(2, '0')}`;

    db.prepare(`
      INSERT INTO agreements (id, agreement_number, client_id, fee_plan_id, total_fee, status, start_date, end_date, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, agreementNumber, client_id, fee_plan_id || null, parseFloat(total_fee) || 0, status, start_date || null, end_date || null, req.user.name);

    logAudit(req, 'Agreement Created', 'Agreements', id, { agreementNumber, client_id, total_fee });
    res.status(201).json({ message: 'Agreement created successfully', id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create agreement' });
  }
});

// --- PAYMENTS ---
router.get('/payments', authenticateToken, requireAdmin, (req, res) => {
  try {
    const payments = db.prepare(`
      SELECT p.*, 
             c.name as client_name, c.client_number,
             a.agreement_number
      FROM payments p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN agreements a ON p.agreement_id = a.id
      ORDER BY p.created_at DESC
    `).all();
    res.json({ payments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

router.post('/payments', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { client_id, agreement_id, amount, payment_method, transaction_id, status = 'pending_verification', payment_date } = req.body;
    if (!client_id || !amount || !payment_method) return res.status(400).json({ error: 'Client, amount, and payment method are required' });

    const id = 'pay-' + uuidv4().slice(0, 8);
    const count = db.prepare(`SELECT COUNT(*) as count FROM payments`).get().count + 1;
    const receiptNumber = `REC-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;

    db.prepare(`
      INSERT INTO payments (id, receipt_number, client_id, agreement_id, amount, payment_method, transaction_id, status, payment_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, receiptNumber, client_id, agreement_id || null, parseFloat(amount), payment_method, transaction_id || null, status, payment_date || new Date().toISOString().split('T')[0]);

    logAudit(req, 'Payment Recorded', 'Payments', id, { receiptNumber, amount, method: payment_method });
    res.status(201).json({ message: 'Payment recorded successfully', id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

// PATCH /api/crm/payments/:id/verify
router.patch('/payments/:id/verify', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { status = 'verified' } = req.body;
    const payment = db.prepare(`SELECT * FROM payments WHERE id = ?`).get(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    db.prepare(`
      UPDATE payments 
      SET status = ?, verified_by = ?, verified_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, req.user.name, req.params.id);

    logAudit(req, 'Payment Verified', 'Payments', req.params.id, { receipt: payment.receipt_number, amount: payment.amount, status });
    res.json({ message: `Payment marked as ${status}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// --- TASKS & OPERATIONS ---
router.get('/tasks', authenticateToken, requireAdmin, (req, res) => {
  try {
    const tasks = db.prepare(`
      SELECT t.*, 
             u.name as assigned_to_name, u.emp_or_mgr_id as assigned_to_code
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      ORDER BY t.created_at DESC
    `).all();
    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

router.post('/tasks', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { title, description, module, priority = 'medium', due_date, assigned_to } = req.body;
    if (!title) return res.status(400).json({ error: 'Task title is required' });

    const id = 'task-' + uuidv4().slice(0, 8);
    db.prepare(`
      INSERT INTO tasks (id, title, description, module, priority, due_date, status, assigned_to, created_by)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).run(id, title.trim(), description || null, module || 'General', priority, due_date || null, assigned_to || null, req.user.name);

    logAudit(req, 'Task Created', 'Tasks', id, { title, priority, due_date });
    res.status(201).json({ message: 'Task created successfully', id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

router.patch('/tasks/:id/status', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { status } = req.body;
    db.prepare(`UPDATE tasks SET status = ? WHERE id = ?`).run(status, req.params.id);
    res.json({ message: 'Task status updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task status' });
  }
});

// --- REPORTS SUMMARY ---
router.get('/reports/summary', authenticateToken, requireAdmin, (req, res) => {
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
    res.status(500).json({ error: 'Failed to generate reports' });
  }
});

module.exports = router;
