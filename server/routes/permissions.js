const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticateToken, requireAdmin, logAudit } = require('../middleware/auth');

const MODULE_LIST = [
  'Managers',
  'Employees',
  'Leads',
  'Clients',
  'Agreements',
  'Advocates',
  'Finance',
  'Payments',
  'Tasks',
  'Documents',
  'Reports',
  'Audit'
];

// GET /api/permissions/modules
router.get('/modules', authenticateToken, requireAdmin, (req, res) => {
  res.json({ modules: MODULE_LIST });
});

// GET /api/permissions/:userId
router.get('/:userId', authenticateToken, requireAdmin, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT u.id, u.name, u.email, u.role, u.manager_type_id, mt.permissions_json as default_perms
      FROM users u
      LEFT JOIN manager_types mt ON u.manager_type_id = mt.id
      WHERE u.id = ?
    `).get(req.params.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const explicitPerms = db.prepare(`SELECT * FROM user_permissions WHERE user_id = ?`).all(req.params.userId);

    // Form comprehensive permission matrix
    const matrix = MODULE_LIST.map(mod => {
      const found = explicitPerms.find(p => p.module.toLowerCase() === mod.toLowerCase());
      if (found) {
        return {
          module: mod,
          can_view: Boolean(found.can_view),
          can_create: Boolean(found.can_create),
          can_edit: Boolean(found.can_edit),
          can_delete: Boolean(found.can_delete),
          can_assign: Boolean(found.can_assign),
          can_verify: Boolean(found.can_verify)
        };
      }

      // Default fallbacks
      let defaultView = false;
      let defaultVerify = false;
      try {
        const defObj = JSON.parse(user.default_perms || '{}');
        const key = mod.toLowerCase();
        if (defObj[key]) {
          return {
            module: mod,
            can_view: Boolean(defObj[key].view),
            can_create: Boolean(defObj[key].create),
            can_edit: Boolean(defObj[key].edit),
            can_delete: Boolean(defObj[key].delete),
            can_assign: Boolean(defObj[key].assign),
            can_verify: Boolean(defObj[key].verify)
          };
        }
      } catch (e) {}

      return {
        module: mod,
        can_view: defaultView,
        can_create: false,
        can_edit: false,
        can_delete: false,
        can_assign: false,
        can_verify: defaultVerify
      };
    });

    res.json({ user, matrix });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user permissions' });
  }
});

// PUT /api/permissions/:userId
router.put('/:userId', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { permissions } = req.body;
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Permissions must be an array' });
    }

    const user = db.prepare(`SELECT id, name FROM users WHERE id = ?`).get(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    db.prepare(`DELETE FROM user_permissions WHERE user_id = ?`).run(req.params.userId);

    const insertPerm = db.prepare(`
      INSERT INTO user_permissions (id, user_id, module, can_view, can_create, can_edit, can_delete, can_assign, can_verify)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of permissions) {
      insertPerm.run(
        'perm-' + uuidv4().slice(0, 8),
        req.params.userId,
        p.module,
        p.can_view ? 1 : 0,
        p.can_create ? 1 : 0,
        p.can_edit ? 1 : 0,
        p.can_delete ? 1 : 0,
        p.can_assign ? 1 : 0,
        p.can_verify ? 1 : 0
      );
    }

    logAudit(req, 'Permission Changed', 'Roles & Permissions', req.params.userId, `Updated module permission matrix for ${user.name}`);

    res.json({ message: 'Permissions updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save permissions' });
  }
});

module.exports = router;
