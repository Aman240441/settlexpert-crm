const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticateToken, requireAdmin, logAudit } = require('../middleware/auth');

// GET /api/fee-plans
router.get('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const plans = db.prepare(`
      SELECT 
        fp.*,
        (SELECT COUNT(*) FROM clients c WHERE c.fee_plan_id = fp.id) as active_clients_count,
        (SELECT COUNT(*) FROM agreements a WHERE a.fee_plan_id = fp.id) as agreements_count
      FROM fee_plans fp
      ORDER BY fp.default_fee ASC
    `).all();

    res.json({ plans });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch fee plans' });
  }
});

// POST /api/fee-plans
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, duration, default_fee, status = 'active' } = req.body;

    if (!name || !duration || default_fee === undefined) {
      return res.status(400).json({ error: 'Plan name, duration, and default fee are required' });
    }

    const id = 'plan-' + uuidv4().slice(0, 8);
    const feeNum = parseFloat(default_fee) || 0;

    db.prepare(`
      INSERT INTO fee_plans (id, name, duration, default_fee, status)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, name.trim(), duration, feeNum, status);

    logAudit(req, 'Fee Plan Created', 'Fee Plans', id, { name, duration, default_fee: feeNum });

    res.status(201).json({ message: 'Fee plan created successfully', id });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to create fee plan' });
  }
});

// PUT /api/fee-plans/:id
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, duration, default_fee, status } = req.body;

    const existing = db.prepare(`SELECT * FROM fee_plans WHERE id = ?`).get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Fee plan not found' });
    }

    db.prepare(`
      UPDATE fee_plans SET
        name = COALESCE(?, name),
        duration = COALESCE(?, duration),
        default_fee = COALESCE(?, default_fee),
        status = COALESCE(?, status)
      WHERE id = ?
    `).run(
      name ? name.trim() : null,
      duration,
      default_fee !== undefined ? parseFloat(default_fee) : null,
      status,
      req.params.id
    );

    logAudit(req, 'Fee Plan Updated', 'Fee Plans', req.params.id, { name, duration, default_fee });

    res.json({ message: 'Fee plan updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update fee plan' });
  }
});

// PATCH /api/fee-plans/:id/toggle-status
router.patch('/:id/toggle-status', authenticateToken, requireAdmin, (req, res) => {
  try {
    const plan = db.prepare(`SELECT * FROM fee_plans WHERE id = ?`).get(req.params.id);
    if (!plan) {
      return res.status(404).json({ error: 'Fee plan not found' });
    }

    const newStatus = plan.status === 'active' ? 'inactive' : 'active';
    db.prepare(`UPDATE fee_plans SET status = ? WHERE id = ?`).run(newStatus, req.params.id);

    logAudit(req, 'Fee Plan Updated', 'Fee Plans', req.params.id, `Status set to ${newStatus}`);

    res.json({ message: `Fee plan status changed to ${newStatus}`, status: newStatus });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle fee plan status' });
  }
});

module.exports = router;
