const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticateToken, requireAdmin, logAudit } = require('../middleware/auth');

// GET /api/departments
router.get('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const departments = db.prepare(`
      SELECT 
        d.*,
        u.name as head_manager_name,
        u.email as head_manager_email,
        (SELECT COUNT(*) FROM users m WHERE m.department_id = d.id AND m.role = 'manager') as manager_count,
        (SELECT COUNT(*) FROM users e WHERE e.department_id = d.id AND e.role = 'employee') as employee_count,
        (SELECT COUNT(*) FROM teams t WHERE t.department_id = d.id) as team_count
      FROM departments d
      LEFT JOIN users u ON d.head_manager_id = u.id
      ORDER BY d.name ASC
    `).all();

    res.json({ departments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// POST /api/departments
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, code, description, head_manager_id, status = 'active' } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Department name and code are required' });
    }

    const dupName = db.prepare(`SELECT id FROM departments WHERE name = ? COLLATE NOCASE`).get(name.trim());
    if (dupName) return res.status(400).json({ error: 'Department name already exists' });

    const dupCode = db.prepare(`SELECT id FROM departments WHERE code = ? COLLATE NOCASE`).get(code.trim());
    if (dupCode) return res.status(400).json({ error: 'Department code already exists' });

    const id = 'dept-' + uuidv4().slice(0, 8);

    db.prepare(`
      INSERT INTO departments (id, name, code, description, head_manager_id, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, name.trim(), code.trim().toUpperCase(), description || null, head_manager_id || null, status);

    logAudit(req, 'Department Created', 'Departments', id, { name, code, head_manager_id });

    res.status(201).json({ message: 'Department created successfully', id });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to create department' });
  }
});

// PUT /api/departments/:id
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, code, description, head_manager_id, status } = req.body;

    const existing = db.prepare(`SELECT * FROM departments WHERE id = ?`).get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Department not found' });
    }

    if (name && name !== existing.name) {
      const dup = db.prepare(`SELECT id FROM departments WHERE name = ? AND id != ?`).get(name.trim(), req.params.id);
      if (dup) return res.status(400).json({ error: 'Department name already in use' });
    }

    if (code && code !== existing.code) {
      const dup = db.prepare(`SELECT id FROM departments WHERE code = ? AND id != ?`).get(code.trim(), req.params.id);
      if (dup) return res.status(400).json({ error: 'Department code already in use' });
    }

    db.prepare(`
      UPDATE departments SET
        name = COALESCE(?, name),
        code = COALESCE(?, code),
        description = COALESCE(?, description),
        head_manager_id = COALESCE(?, head_manager_id),
        status = COALESCE(?, status)
      WHERE id = ?
    `).run(
      name ? name.trim() : null,
      code ? code.trim().toUpperCase() : null,
      description,
      head_manager_id,
      status,
      req.params.id
    );

    logAudit(req, 'Department Updated', 'Departments', req.params.id, { name, code, head_manager_id });

    res.json({ message: 'Department updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update department' });
  }
});

// DELETE /api/departments/:id
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const existing = db.prepare(`SELECT name FROM departments WHERE id = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Department not found' });

    db.prepare(`DELETE FROM departments WHERE id = ?`).run(req.params.id);
    logAudit(req, 'Department Deleted', 'Departments', req.params.id, `Deleted department ${existing.name}`);

    res.json({ message: 'Department deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete department' });
  }
});

module.exports = router;
