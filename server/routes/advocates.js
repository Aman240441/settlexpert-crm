const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticateToken, requireAdmin, logAudit } = require('../middleware/auth');

// GET /api/advocates
router.get('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { search, status } = req.query;
    let sql = `
      SELECT a.*, 
        (SELECT COUNT(*) FROM clients c WHERE c.advocate_id = a.id) as assigned_clients_count
      FROM advocates a
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += ` AND (a.name LIKE ? OR a.advocate_id LIKE ? OR a.email LIKE ? OR a.mobile LIKE ? OR a.registration_number LIKE ? OR a.specialization LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s, s, s);
    }

    if (status) {
      sql += ` AND a.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY a.created_at DESC`;

    const advocates = db.prepare(sql).all(...params);
    res.json({ advocates });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch advocates' });
  }
});

// GET /api/advocates/:id
router.get('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const advocate = db.prepare(`SELECT * FROM advocates WHERE id = ?`).get(req.params.id);
    if (!advocate) {
      return res.status(404).json({ error: 'Advocate not found' });
    }
    const assignedClients = db.prepare(`SELECT id, client_number, name, phone, status, total_debt FROM clients WHERE advocate_id = ?`).all(req.params.id);
    res.json({ advocate, assignedClients });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch advocate details' });
  }
});

// POST /api/advocates
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const {
      name,
      advocate_id,
      mobile,
      email,
      registration_number,
      specialization,
      address,
      profile_image,
      status = 'active',
      notes
    } = req.body;

    if (!name || !advocate_id || !mobile || !email || !registration_number || !specialization) {
      return res.status(400).json({ error: 'Name, Advocate ID, mobile, email, registration number, and specialization are required' });
    }

    const dupEmail = db.prepare(`SELECT id FROM advocates WHERE email = ? COLLATE NOCASE`).get(email.trim());
    if (dupEmail) {
      return res.status(400).json({ error: 'An advocate with this email already exists' });
    }

    const dupId = db.prepare(`SELECT id FROM advocates WHERE advocate_id = ?`).get(advocate_id.trim());
    if (dupId) {
      return res.status(400).json({ error: 'An advocate with this Advocate ID already exists' });
    }

    const dupReg = db.prepare(`SELECT id FROM advocates WHERE registration_number = ?`).get(registration_number.trim());
    if (dupReg) {
      return res.status(400).json({ error: 'An advocate with this Bar Registration Number already exists' });
    }

    const id = 'adv-' + uuidv4().slice(0, 8);

    db.prepare(`
      INSERT INTO advocates (
        id, name, advocate_id, mobile, email, registration_number,
        specialization, address, profile_image, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      name.trim(),
      advocate_id.trim().toUpperCase(),
      mobile.trim(),
      email.trim().toLowerCase(),
      registration_number.trim().toUpperCase(),
      specialization.trim(),
      address || null,
      profile_image || null,
      status,
      notes || null
    );

    logAudit(req, 'Advocate Created', 'Advocates', id, { name, advocate_id, registration_number, specialization });

    res.status(201).json({ message: 'Advocate created successfully', id });
  } catch (err) {
    console.error('Create advocate error:', err);
    res.status(500).json({ error: err.message || 'Failed to create advocate' });
  }
});

// PUT /api/advocates/:id
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const {
      name,
      advocate_id,
      mobile,
      email,
      registration_number,
      specialization,
      address,
      profile_image,
      status,
      notes
    } = req.body;

    const existing = db.prepare(`SELECT * FROM advocates WHERE id = ?`).get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Advocate not found' });
    }

    if (email && email !== existing.email) {
      const dup = db.prepare(`SELECT id FROM advocates WHERE email = ? AND id != ?`).get(email.trim(), req.params.id);
      if (dup) return res.status(400).json({ error: 'Email already in use' });
    }

    if (advocate_id && advocate_id !== existing.advocate_id) {
      const dup = db.prepare(`SELECT id FROM advocates WHERE advocate_id = ? AND id != ?`).get(advocate_id.trim(), req.params.id);
      if (dup) return res.status(400).json({ error: 'Advocate ID already in use' });
    }

    if (registration_number && registration_number !== existing.registration_number) {
      const dup = db.prepare(`SELECT id FROM advocates WHERE registration_number = ? AND id != ?`).get(registration_number.trim(), req.params.id);
      if (dup) return res.status(400).json({ error: 'Bar Registration Number already in use' });
    }

    db.prepare(`
      UPDATE advocates SET
        name = COALESCE(?, name),
        advocate_id = COALESCE(?, advocate_id),
        mobile = COALESCE(?, mobile),
        email = COALESCE(?, email),
        registration_number = COALESCE(?, registration_number),
        specialization = COALESCE(?, specialization),
        address = COALESCE(?, address),
        profile_image = COALESCE(?, profile_image),
        status = COALESCE(?, status),
        notes = COALESCE(?, notes)
      WHERE id = ?
    `).run(
      name ? name.trim() : null,
      advocate_id ? advocate_id.trim().toUpperCase() : null,
      mobile,
      email ? email.trim().toLowerCase() : null,
      registration_number ? registration_number.trim().toUpperCase() : null,
      specialization,
      address,
      profile_image,
      status,
      notes,
      req.params.id
    );

    logAudit(req, 'Advocate Updated', 'Advocates', req.params.id, { name, advocate_id });

    res.json({ message: 'Advocate updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update advocate' });
  }
});

// PATCH /api/advocates/:id/toggle-status
router.patch('/:id/toggle-status', authenticateToken, requireAdmin, (req, res) => {
  try {
    const adv = db.prepare(`SELECT status, name FROM advocates WHERE id = ?`).get(req.params.id);
    if (!adv) {
      return res.status(404).json({ error: 'Advocate not found' });
    }

    const newStatus = adv.status === 'active' ? 'inactive' : 'active';
    db.prepare(`UPDATE advocates SET status = ? WHERE id = ?`).run(newStatus, req.params.id);

    const action = newStatus === 'active' ? 'User Activated' : 'User Deactivated';
    logAudit(req, action, 'Advocates', req.params.id, `Advocate ${adv.name} status changed to ${newStatus}`);

    res.json({ message: `Advocate status updated to ${newStatus}`, status: newStatus });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle advocate status' });
  }
});

module.exports = router;
