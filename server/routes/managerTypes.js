const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticateToken, requireAdmin, logAudit } = require('../middleware/auth');

// GET /api/manager-types
router.get('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const types = db.prepare(`
      SELECT 
        mt.*,
        (SELECT COUNT(*) FROM users u WHERE u.manager_type_id = mt.id AND u.role = 'manager') as manager_count
      FROM manager_types mt
      ORDER BY mt.name ASC
    `).all();

    res.json({ types });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch manager types' });
  }
});

// POST /api/manager-types
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, code, description, permissions, status = 'active' } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Name and Code are required' });
    }

    const dupName = db.prepare(`SELECT id FROM manager_types WHERE name = ? COLLATE NOCASE`).get(name.trim());
    if (dupName) return res.status(400).json({ error: 'Manager type name already exists' });

    const dupCode = db.prepare(`SELECT id FROM manager_types WHERE code = ? COLLATE NOCASE`).get(code.trim());
    if (dupCode) return res.status(400).json({ error: 'Manager type code already exists' });

    const id = 'mt-' + uuidv4().slice(0, 8);
    const permsJson = typeof permissions === 'object' ? JSON.stringify(permissions) : '{}';

    db.prepare(`
      INSERT INTO manager_types (id, name, code, description, permissions_json, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, name.trim(), code.trim().toUpperCase(), description || null, permsJson, status);

    logAudit(req, 'Manager Type Created', 'Manager Types', id, { name, code });

    res.status(201).json({ message: 'Manager type created successfully', id });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to create manager type' });
  }
});

// PUT /api/manager-types/:id
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, code, description, permissions, status } = req.body;

    const existing = db.prepare(`SELECT * FROM manager_types WHERE id = ?`).get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Manager type not found' });
    }

    if (name && name !== existing.name) {
      const dup = db.prepare(`SELECT id FROM manager_types WHERE name = ? AND id != ?`).get(name.trim(), req.params.id);
      if (dup) return res.status(400).json({ error: 'Manager type name already in use' });
    }

    if (code && code !== existing.code) {
      const dup = db.prepare(`SELECT id FROM manager_types WHERE code = ? AND id != ?`).get(code.trim(), req.params.id);
      if (dup) return res.status(400).json({ error: 'Manager type code already in use' });
    }

    const permsJson = permissions ? (typeof permissions === 'object' ? JSON.stringify(permissions) : permissions) : existing.permissions_json;

    db.prepare(`
      UPDATE manager_types SET
        name = COALESCE(?, name),
        code = COALESCE(?, code),
        description = COALESCE(?, description),
        permissions_json = ?,
        status = COALESCE(?, status)
      WHERE id = ?
    `).run(
      name ? name.trim() : null,
      code ? code.trim().toUpperCase() : null,
      description,
      permsJson,
      status,
      req.params.id
    );

    logAudit(req, 'Manager Type Updated', 'Manager Types', req.params.id, { name, code });

    res.json({ message: 'Manager type updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update manager type' });
  }
});

// DELETE /api/manager-types/:id
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const existing = db.prepare(`SELECT name FROM manager_types WHERE id = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Manager type not found' });

    db.prepare(`DELETE FROM manager_types WHERE id = ?`).run(req.params.id);
    logAudit(req, 'Manager Type Deleted', 'Manager Types', req.params.id, `Deleted manager type ${existing.name}`);

    res.json({ message: 'Manager type deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete manager type' });
  }
});

module.exports = router;
