const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticateToken, requireAdmin, logAudit } = require('../middleware/auth');

// GET /api/teams
router.get('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const teams = db.prepare(`
      SELECT 
        t.*,
        d.name as department_name,
        d.code as department_code,
        m.name as manager_name,
        m.emp_or_mgr_id as manager_code,
        (SELECT COUNT(*) FROM users e WHERE e.team_id = t.id AND e.role = 'employee') as member_count
      FROM teams t
      LEFT JOIN departments d ON t.department_id = d.id
      LEFT JOIN users m ON t.manager_id = m.id
      ORDER BY t.created_at DESC
    `).all();

    for (const team of teams) {
      team.members = db.prepare(`
        SELECT id, name, email, phone, emp_or_mgr_id, status 
        FROM users 
        WHERE team_id = ? AND role = 'employee'
      `).all(team.id);
    }

    res.json({ teams });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// POST /api/teams
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, department_id, manager_id, status = 'active', employee_ids = [] } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Team name is required' });
    }

    const id = 'team-' + uuidv4().slice(0, 8);

    db.prepare(`
      INSERT INTO teams (id, name, department_id, manager_id, status)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, name.trim(), department_id || null, manager_id || null, status);

    // Assign employees if provided
    if (Array.isArray(employee_ids) && employee_ids.length > 0) {
      const updateEmp = db.prepare(`UPDATE users SET team_id = ?, department_id = COALESCE(?, department_id), manager_id = COALESCE(?, manager_id) WHERE id = ?`);
      for (const empId of employee_ids) {
        updateEmp.run(id, department_id || null, manager_id || null, empId);
      }
    }

    logAudit(req, 'Team Created', 'Teams', id, { name, department_id, manager_id, memberCount: employee_ids.length });

    res.status(201).json({ message: 'Team created successfully', id });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to create team' });
  }
});

// PUT /api/teams/:id
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, department_id, manager_id, status, employee_ids } = req.body;

    const existing = db.prepare(`SELECT * FROM teams WHERE id = ?`).get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Team not found' });
    }

    db.prepare(`
      UPDATE teams SET
        name = COALESCE(?, name),
        department_id = COALESCE(?, department_id),
        manager_id = COALESCE(?, manager_id),
        status = COALESCE(?, status)
      WHERE id = ?
    `).run(name ? name.trim() : null, department_id, manager_id, status, req.params.id);

    if (Array.isArray(employee_ids)) {
      // Clear team assignment for previous members not in new list
      db.prepare(`UPDATE users SET team_id = NULL WHERE team_id = ?`).run(req.params.id);
      
      const updateEmp = db.prepare(`UPDATE users SET team_id = ?, department_id = COALESCE(?, department_id), manager_id = COALESCE(?, manager_id) WHERE id = ?`);
      for (const empId of employee_ids) {
        updateEmp.run(req.params.id, department_id || null, manager_id || null, empId);
      }
    }

    logAudit(req, 'Team Updated', 'Teams', req.params.id, { name, department_id, manager_id });

    res.json({ message: 'Team updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update team' });
  }
});

// DELETE /api/teams/:id
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const existing = db.prepare(`SELECT name FROM teams WHERE id = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Team not found' });

    db.prepare(`UPDATE users SET team_id = NULL WHERE team_id = ?`).run(req.params.id);
    db.prepare(`DELETE FROM teams WHERE id = ?`).run(req.params.id);

    logAudit(req, 'Team Deleted', 'Teams', req.params.id, `Deleted team ${existing.name}`);

    res.json({ message: 'Team deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete team' });
  }
});

module.exports = router;
