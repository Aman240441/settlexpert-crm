const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticateToken, requireAdmin, logAudit } = require('../middleware/auth');
const { syncRecord } = require('../db/supabaseClient');

// GET /api/managers
router.get('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const search = req.query.search && req.query.search !== 'undefined' && req.query.search !== 'null' ? req.query.search.trim() : null;
    const department = req.query.department && req.query.department !== 'undefined' && req.query.department !== 'null' ? req.query.department.trim() : null;
    const type = req.query.type && req.query.type !== 'undefined' && req.query.type !== 'null' ? req.query.type.trim() : null;
    const status = req.query.status && req.query.status !== 'undefined' && req.query.status !== 'null' ? req.query.status.trim() : null;
    let sql = `
      SELECT 
        u.id, u.name, u.email, u.phone, u.emp_or_mgr_id, u.role,
        u.department_id, u.manager_type_id, u.profile_image, 
        u.joining_date, u.id_type, u.id_front, u.id_back, u.status, u.created_at,
        d.name as department_name, d.code as department_code,
        mt.name as manager_type_name, mt.code as manager_type_code,
        (SELECT COUNT(*) FROM users e WHERE e.manager_id = u.id AND e.role = 'employee') as employee_count,
        (SELECT COUNT(*) FROM leads l WHERE l.manager_id = u.id) as lead_count,
        (SELECT COUNT(*) FROM clients c WHERE c.manager_id = u.id) as client_count
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN manager_types mt ON u.manager_type_id = mt.id
      WHERE u.role = 'manager'
    `;
    const params = [];

    if (search) {
      sql += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR u.emp_or_mgr_id LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    if (department) {
      sql += ` AND u.department_id = ?`;
      params.push(department);
    }

    if (type) {
      sql += ` AND u.manager_type_id = ?`;
      params.push(type);
    }

    if (status) {
      sql += ` AND u.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY u.created_at DESC`;

    const managers = db.prepare(sql).all(...params);
    res.json({ managers });
  } catch (err) {
    console.error('Fetch managers error:', err);
    res.status(500).json({ error: 'Failed to fetch managers' });
  }
});

// GET /api/managers/:id
router.get('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const manager = db.prepare(`
      SELECT 
        u.id, u.name, u.email, u.phone, u.emp_or_mgr_id, u.role,
        u.department_id, u.manager_type_id, u.profile_image, 
        u.joining_date, u.id_type, u.id_front, u.id_back, u.status, u.created_at,
        d.name as department_name, mt.name as manager_type_name, mt.permissions_json
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN manager_types mt ON u.manager_type_id = mt.id
      WHERE u.id = ? AND u.role = 'manager'
    `).get(req.params.id);

    if (!manager) {
      return res.status(404).json({ error: 'Manager not found' });
    }

    const permissions = db.prepare(`SELECT * FROM user_permissions WHERE user_id = ?`).all(req.params.id);
    const assignedEmployees = db.prepare(`SELECT id, name, email, phone, emp_or_mgr_id, status, profile_image FROM users WHERE manager_id = ? AND role = 'employee'`).all(req.params.id);

    res.json({ manager, permissions, assignedEmployees });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve manager profile' });
  }
});

// POST /api/managers
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      emp_or_mgr_id,
      password,
      joining_date,
      manager_type_id,
      department_id,
      status = 'active',
      profile_image,
      id_type,
      id_front,
      id_back,
      permissions
    } = req.body;

    if (!name || !email || !password || !emp_or_mgr_id) {
      return res.status(400).json({ error: 'Name, email, password, and Manager ID are required' });
    }

    const existingEmail = db.prepare(`SELECT id FROM users WHERE email = ? COLLATE NOCASE`).get(email.trim());
    if (existingEmail) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    const existingCode = db.prepare(`SELECT id FROM users WHERE emp_or_mgr_id = ?`).get(emp_or_mgr_id.trim());
    if (existingCode) {
      return res.status(400).json({ error: 'A user with this Manager ID already exists' });
    }

    const id = 'mgr-' + uuidv4().slice(0, 8);
    const password_hash = bcrypt.hashSync(password, 10);

    const insertUser = db.prepare(`
      INSERT INTO users (
        id, name, email, phone, password_hash, role, manager_type_id,
        department_id, emp_or_mgr_id, profile_image, joining_date,
        id_type, id_front, id_back, status
      ) VALUES (?, ?, ?, ?, ?, 'manager', ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertUser.run(
      id,
      name.trim(),
      email.trim().toLowerCase(),
      phone || null,
      password_hash,
      manager_type_id || null,
      department_id || null,
      emp_or_mgr_id.trim().toUpperCase(),
      profile_image || null,
      joining_date || new Date().toISOString().split('T')[0],
      id_type || null,
      id_front || null,
      id_back || null,
      status
    );

    // If permissions array provided, insert into user_permissions
    if (Array.isArray(permissions) && permissions.length > 0) {
      const insertPerm = db.prepare(`
        INSERT INTO user_permissions (id, user_id, module, can_view, can_create, can_edit, can_delete, can_assign, can_verify)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const p of permissions) {
        insertPerm.run(
          'perm-' + uuidv4().slice(0, 8),
          id,
          p.module,
          p.can_view ? 1 : 0,
          p.can_create ? 1 : 0,
          p.can_edit ? 1 : 0,
          p.can_delete ? 1 : 0,
          p.can_assign ? 1 : 0,
          p.can_verify ? 1 : 0
        );
      }
    }

    logAudit(req, 'Manager Created', 'Managers', id, {
      name,
      email,
      emp_or_mgr_id,
      department_id,
      manager_type_id
    });

    try {
      const createdMgr = db.prepare(`SELECT * FROM users WHERE id = ?`).get(id);
      if (createdMgr) syncRecord('users', createdMgr).catch(e => console.warn('[Supabase mgr sync]', e.message));
    } catch (syncErr) {
      console.warn('[Supabase mgr sync error]', syncErr.message);
    }

    res.status(201).json({ message: 'Manager created successfully', id });
  } catch (err) {
    console.error('Create manager error:', err);
    res.status(500).json({ error: err.message || 'Failed to create manager' });
  }
});

// PUT /api/managers/:id
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      emp_or_mgr_id,
      joining_date,
      manager_type_id,
      department_id,
      status,
      profile_image,
      id_type,
      id_front,
      id_back,
      permissions
    } = req.body;

    const existing = db.prepare(`SELECT * FROM users WHERE id = ? AND role = 'manager'`).get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Manager not found' });
    }

    if (email && email !== existing.email) {
      const emailDup = db.prepare(`SELECT id FROM users WHERE email = ? AND id != ?`).get(email.trim(), req.params.id);
      if (emailDup) {
        return res.status(400).json({ error: 'Email is already used by another account' });
      }
    }

    if (emp_or_mgr_id && emp_or_mgr_id !== existing.emp_or_mgr_id) {
      const codeDup = db.prepare(`SELECT id FROM users WHERE emp_or_mgr_id = ? AND id != ?`).get(emp_or_mgr_id.trim(), req.params.id);
      if (codeDup) {
        return res.status(400).json({ error: 'Manager ID is already in use' });
      }
    }

    db.prepare(`
      UPDATE users SET
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        emp_or_mgr_id = COALESCE(?, emp_or_mgr_id),
        joining_date = COALESCE(?, joining_date),
        manager_type_id = COALESCE(?, manager_type_id),
        department_id = COALESCE(?, department_id),
        status = COALESCE(?, status),
        profile_image = COALESCE(?, profile_image),
        id_type = COALESCE(?, id_type),
        id_front = COALESCE(?, id_front),
        id_back = COALESCE(?, id_back),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name ? name.trim() : null,
      email ? email.trim().toLowerCase() : null,
      phone,
      emp_or_mgr_id ? emp_or_mgr_id.trim().toUpperCase() : null,
      joining_date,
      manager_type_id,
      department_id,
      status,
      profile_image,
      id_type,
      id_front,
      id_back,
      req.params.id
    );

    // If permissions array provided, replace
    if (Array.isArray(permissions)) {
      db.prepare(`DELETE FROM user_permissions WHERE user_id = ?`).run(req.params.id);
      const insertPerm = db.prepare(`
        INSERT INTO user_permissions (id, user_id, module, can_view, can_create, can_edit, can_delete, can_assign, can_verify)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const p of permissions) {
        insertPerm.run(
          'perm-' + uuidv4().slice(0, 8),
          req.params.id,
          p.module,
          p.can_view ? 1 : 0,
          p.can_create ? 1 : 0,
          p.can_edit ? 1 : 0,
          p.can_delete ? 1 : 0,
          p.can_assign ? 1 : 0,
          p.can_verify ? 1 : 0
        );
      }
    }

    logAudit(req, 'Manager Updated', 'Managers', req.params.id, { name, email, department_id, manager_type_id });

    try {
      const updatedMgr = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.params.id);
      if (updatedMgr) syncRecord('users', updatedMgr).catch(e => console.warn('[Supabase mgr sync]', e.message));
    } catch (syncErr) {
      console.warn('[Supabase mgr sync error]', syncErr.message);
    }

    res.json({ message: 'Manager updated successfully' });
  } catch (err) {
    console.error('Update manager error:', err);
    res.status(500).json({ error: 'Failed to update manager' });
  }
});

// PATCH /api/managers/:id/toggle-status
router.patch('/:id/toggle-status', authenticateToken, requireAdmin, (req, res) => {
  try {
    const user = db.prepare(`SELECT status, name FROM users WHERE id = ? AND role = 'manager'`).get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Manager not found' });
    }

    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    db.prepare(`UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(newStatus, req.params.id);

    try {
      const updatedMgr = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.params.id);
      if (updatedMgr) syncRecord('users', updatedMgr).catch(e => console.warn('[Supabase mgr sync]', e.message));
    } catch (syncErr) {
      console.warn('[Supabase mgr sync error]', syncErr.message);
    }

    const action = newStatus === 'active' ? 'User Activated' : 'User Deactivated';
    logAudit(req, action, 'Managers', req.params.id, `Manager ${user.name} status changed to ${newStatus}`);

    res.json({ message: `Manager status changed to ${newStatus}`, status: newStatus });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle manager status' });
  }
});

// POST /api/managers/:id/reset-password
router.post('/:id/reset-password', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { new_password } = req.body;
    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = db.prepare(`SELECT id, name FROM users WHERE id = ? AND role = 'manager'`).get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Manager not found' });
    }

    const hash = bcrypt.hashSync(new_password, 10);
    db.prepare(`UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(hash, req.params.id);

    try {
      const updatedMgr = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.params.id);
      if (updatedMgr) syncRecord('users', updatedMgr).catch(e => console.warn('[Supabase mgr sync]', e.message));
    } catch (syncErr) {
      console.warn('[Supabase mgr sync error]', syncErr.message);
    }

    logAudit(req, 'Manager Password Reset', 'Managers', req.params.id, `Password reset performed for ${user.name}`);

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;
