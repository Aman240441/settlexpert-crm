const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticateToken, requireAdmin, logAudit } = require('../middleware/auth');
const { syncRecord } = require('../db/supabaseClient');

// GET /api/employees
router.get('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const search = req.query.search && req.query.search !== 'undefined' && req.query.search !== 'null' ? req.query.search.trim() : null;
    const department = req.query.department && req.query.department !== 'undefined' && req.query.department !== 'null' ? req.query.department.trim() : null;
    const manager = req.query.manager && req.query.manager !== 'undefined' && req.query.manager !== 'null' ? req.query.manager.trim() : null;
    const status = req.query.status && req.query.status !== 'undefined' && req.query.status !== 'null' ? req.query.status.trim() : null;
    const team = req.query.team && req.query.team !== 'undefined' && req.query.team !== 'null' ? req.query.team.trim() : null;
    let sql = `
      SELECT 
        u.id, u.name, u.email, u.phone, u.emp_or_mgr_id, u.role,
        u.department_id, u.manager_id, u.team_id, u.profile_image, 
        u.joining_date, u.id_type, u.id_front, u.id_back, u.status, u.created_at,
        d.name as department_name, d.code as department_code,
        m.name as manager_name, m.emp_or_mgr_id as manager_code,
        t.name as team_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN users m ON u.manager_id = m.id
      LEFT JOIN teams t ON u.team_id = t.id
      WHERE u.role = 'employee'
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

    if (manager) {
      sql += ` AND u.manager_id = ?`;
      params.push(manager);
    }

    if (team) {
      sql += ` AND u.team_id = ?`;
      params.push(team);
    }

    if (status) {
      sql += ` AND u.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY u.created_at DESC`;

    const employees = db.prepare(sql).all(...params);
    res.json({ employees });
  } catch (err) {
    console.error('Fetch employees error:', err);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// GET /api/employees/:id
router.get('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const employee = db.prepare(`
      SELECT 
        u.id, u.name, u.email, u.phone, u.emp_or_mgr_id, u.role,
        u.department_id, u.manager_id, u.team_id, u.profile_image, 
        u.joining_date, u.id_type, u.id_front, u.id_back, u.status, u.created_at,
        d.name as department_name,
        m.name as manager_name, m.emp_or_mgr_id as manager_code,
        t.name as team_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN users m ON u.manager_id = m.id
      LEFT JOIN teams t ON u.team_id = t.id
      WHERE u.id = ? AND u.role = 'employee'
    `).get(req.params.id);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({ employee });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch employee details' });
  }
});

// POST /api/employees
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      emp_or_mgr_id,
      password = 'Employee@123456',
      joining_date,
      department_id,
      manager_id,
      team_id,
      status = 'active',
      profile_image,
      id_type,
      id_front,
      id_back
    } = req.body;

    if (!name || !email || !emp_or_mgr_id) {
      return res.status(400).json({ error: 'Name, email, and Employee ID are required' });
    }

    const existingEmail = db.prepare(`SELECT id FROM users WHERE email = ? COLLATE NOCASE`).get(email.trim());
    if (existingEmail) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    const existingCode = db.prepare(`SELECT id FROM users WHERE emp_or_mgr_id = ?`).get(emp_or_mgr_id.trim());
    if (existingCode) {
      return res.status(400).json({ error: 'A user with this Employee ID already exists' });
    }

    const id = 'emp-' + uuidv4().slice(0, 8);
    const password_hash = bcrypt.hashSync(password, 10);

    db.prepare(`
      INSERT INTO users (
        id, name, email, phone, password_hash, role,
        department_id, manager_id, team_id, emp_or_mgr_id,
        profile_image, joining_date, id_type, id_front, id_back, status
      ) VALUES (?, ?, ?, ?, ?, 'employee', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      name.trim(),
      email.trim().toLowerCase(),
      phone || null,
      password_hash,
      department_id || null,
      manager_id || null,
      team_id || null,
      emp_or_mgr_id.trim().toUpperCase(),
      profile_image || null,
      joining_date || new Date().toISOString().split('T')[0],
      id_type || null,
      id_front || null,
      id_back || null,
      status
    );

    logAudit(req, 'Employee Created', 'Employees', id, {
      name,
      email,
      emp_or_mgr_id,
      department_id,
      manager_id
    });

    res.status(201).json({ message: 'Employee created successfully', id });
  } catch (err) {
    console.error('Create employee error:', err);
    res.status(500).json({ error: err.message || 'Failed to create employee' });
  }
});

// PUT /api/employees/:id
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      emp_or_mgr_id,
      joining_date,
      department_id,
      manager_id,
      team_id,
      status,
      profile_image,
      id_type,
      id_front,
      id_back
    } = req.body;

    const existing = db.prepare(`SELECT * FROM users WHERE id = ? AND role = 'employee'`).get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Employee not found' });
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
        return res.status(400).json({ error: 'Employee ID is already in use' });
      }
    }

    db.prepare(`
      UPDATE users SET
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        emp_or_mgr_id = COALESCE(?, emp_or_mgr_id),
        joining_date = COALESCE(?, joining_date),
        department_id = COALESCE(?, department_id),
        manager_id = COALESCE(?, manager_id),
        team_id = COALESCE(?, team_id),
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
      department_id,
      manager_id,
      team_id,
      status,
      profile_image,
      id_type,
      id_front,
      id_back,
      req.params.id
    );

    logAudit(req, 'Employee Updated', 'Employees', req.params.id, { name, email, department_id, manager_id });

    res.json({ message: 'Employee updated successfully' });
  } catch (err) {
    console.error('Update employee error:', err);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// POST /api/employees/:id/assign-manager
router.post('/:id/assign-manager', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { manager_id } = req.body;
    const employee = db.prepare(`SELECT id, name FROM users WHERE id = ? AND role = 'employee'`).get(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    let managerName = 'Unassigned';
    if (manager_id) {
      const manager = db.prepare(`SELECT id, name FROM users WHERE id = ? AND role = 'manager'`).get(manager_id);
      if (!manager) {
        return res.status(400).json({ error: 'Invalid Manager selected' });
      }
      managerName = manager.name;
    }

    db.prepare(`UPDATE users SET manager_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(manager_id || null, req.params.id);

    logAudit(req, 'Employee Assigned', 'Employees', req.params.id, `Assigned employee ${employee.name} to manager ${managerName}`);

    res.json({ message: `Employee assigned to ${managerName} successfully` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to assign manager' });
  }
});

// POST /api/employees/:id/transfer-manager
router.post('/:id/transfer-manager', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { new_manager_id, new_department_id, new_team_id, transfer_reason } = req.body;

    const employee = db.prepare(`SELECT id, name, manager_id FROM users WHERE id = ? AND role = 'employee'`).get(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const newMgr = db.prepare(`SELECT id, name, department_id FROM users WHERE id = ? AND role = 'manager'`).get(new_manager_id);
    if (!newMgr) {
      return res.status(400).json({ error: 'Target manager not found' });
    }

    const deptId = new_department_id || newMgr.department_id;

    db.prepare(`
      UPDATE users 
      SET manager_id = ?, department_id = ?, team_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(new_manager_id, deptId, new_team_id || null, req.params.id);

    logAudit(req, 'Employee Transferred', 'Employees', req.params.id, {
      employee: employee.name,
      new_manager: newMgr.name,
      reason: transfer_reason || 'Administrative transfer'
    });

    res.json({ message: `Employee successfully transferred to ${newMgr.name}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to transfer employee' });
  }
});

// PATCH /api/employees/:id/toggle-status
router.patch('/:id/toggle-status', authenticateToken, requireAdmin, (req, res) => {
  try {
    const user = db.prepare(`SELECT status, name FROM users WHERE id = ? AND role = 'employee'`).get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    db.prepare(`UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(newStatus, req.params.id);

    const action = newStatus === 'active' ? 'User Activated' : 'User Deactivated';
    logAudit(req, action, 'Employees', req.params.id, `Employee ${user.name} status changed to ${newStatus}`);

    res.json({ message: `Employee status changed to ${newStatus}`, status: newStatus });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle employee status' });
  }
});

// POST /api/employees/:id/reset-password
router.post('/:id/reset-password', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { new_password } = req.body;
    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = db.prepare(`SELECT id, name FROM users WHERE id = ? AND role = 'employee'`).get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const hash = bcrypt.hashSync(new_password, 10);
    db.prepare(`UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(hash, req.params.id);

    logAudit(req, 'Employee Password Reset', 'Employees', req.params.id, `Password reset for employee ${user.name}`);

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;
