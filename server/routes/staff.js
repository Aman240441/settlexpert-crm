const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticateToken, requireAdmin, logAudit } = require('../middleware/auth');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function maskAadhaar(num) {
  if (!num) return null;
  const clean = num.replace(/\s/g, '');
  if (clean.length < 4) return 'XXXX XXXX XXXX';
  return 'XXXX XXXX ' + clean.slice(-4);
}

function generateStaffId(role) {
  const prefix = role === 'manager' ? 'MGR' : role === 'advocate' ? 'ADV' : role === 'admin' ? 'ADM' : 'EMP';
  const suffix = uuidv4().slice(0, 6).toUpperCase();
  return `${prefix}-${suffix}`;
}

function getStaffWithProfile(userId) {
  return db.prepare(`
    SELECT
      u.id, u.name, u.email, u.phone, u.role, u.emp_or_mgr_id, u.profile_image,
      u.department_id, u.manager_id, u.team_id, u.manager_type_id,
      u.joining_date, u.status, u.created_at, u.updated_at,
      d.name as department_name, d.code as department_code,
      m.name as manager_name, m.emp_or_mgr_id as manager_code,
      mt.name as manager_type_name, mt.code as manager_type_code,
      t.name as team_name,
      sep.date_of_birth, sep.gender, sep.father_name, sep.mother_name,
      sep.alt_phone, sep.whatsapp_number,
      sep.current_address, sep.permanent_address, sep.city, sep.state, sep.pin_code,
      sep.designation, sep.employment_status, sep.staff_type,
      sep.reporting_manager_id,
      rm.name as reporting_manager_name,
      sad.registration_number, sad.bar_council_state, sad.specialization, sad.years_experience,
      sk.id as kyc_id, sk.kyc_status, sk.aadhaar_number as aadhaar_masked_raw,
      sk.verified_by as kyc_verified_by, sk.verified_at as kyc_verified_at
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN users m ON u.manager_id = m.id
    LEFT JOIN manager_types mt ON u.manager_type_id = mt.id
    LEFT JOIN teams t ON u.team_id = t.id
    LEFT JOIN staff_extended_profiles sep ON sep.user_id = u.id
    LEFT JOIN staff_advocate_details sad ON sad.user_id = u.id
    LEFT JOIN staff_kyc sk ON sk.user_id = u.id
    LEFT JOIN users rm ON rm.id = sep.reporting_manager_id
    WHERE u.id = ?
  `).get(userId);
}

function formatStaffProfile(row, includeFullAadhaar = false) {
  if (!row) return null;
  const result = { ...row };
  // Always mask Aadhaar in the response unless explicitly requested
  result.aadhaar_masked = maskAadhaar(row.aadhaar_masked_raw);
  if (!includeFullAadhaar) {
    delete result.aadhaar_masked_raw;
    // Never expose documents in list views; only in profile view with auth check
    delete result.aadhaar_front_doc;
    delete result.aadhaar_back_doc;
  }
  return result;
}

// ─── GET /api/staff ─── Staff Directory ───────────────────────────────────────
router.get('/', authenticateToken, (req, res) => {
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { search, role, department, status, staff_type } = req.query;
    let sql = `
      SELECT
        u.id, u.name, u.email, u.phone, u.role, u.emp_or_mgr_id, u.profile_image,
        u.joining_date, u.status, u.created_at,
        d.name as department_name, d.code as department_code,
        sep.designation, sep.employment_status, sep.staff_type, sep.city
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN staff_extended_profiles sep ON sep.user_id = u.id
      WHERE u.role != 'admin'
    `;
    const params = [];

    if (search) {
      sql += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR u.emp_or_mgr_id LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }
    if (role) { sql += ` AND u.role = ?`; params.push(role); }
    if (department) { sql += ` AND u.department_id = ?`; params.push(department); }
    if (status) { sql += ` AND u.status = ?`; params.push(status); }
    if (staff_type) { sql += ` AND sep.staff_type = ?`; params.push(staff_type); }

    // Manager scoping — only see their team
    if (req.user.role === 'manager') {
      sql += ` AND (u.manager_id = ? OR u.department_id = (SELECT department_id FROM users WHERE id = ?))`;
      params.push(req.user.id, req.user.id);
    }

    sql += ` ORDER BY u.created_at DESC`;

    const staff = db.prepare(sql).all(...params);
    // Never include Aadhaar in directory listing
    res.json({ staff });
  } catch (err) {
    console.error('Staff directory error:', err);
    res.status(500).json({ error: 'Failed to fetch staff directory' });
  }
});

// ─── GET /api/staff/:id ─── Staff Profile (masked Aadhaar) ────────────────────
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const isSelf = req.user.id === req.params.id;
    const isManager = req.user.role === 'manager';

    if (!isAdmin && !isSelf && !isManager) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    const row = getStaffWithProfile(req.params.id);
    if (!row) return res.status(404).json({ error: 'Staff member not found' });

    // Manager can only view their own team members
    if (isManager && !isSelf) {
      const isTeamMember = db.prepare(`
        SELECT 1 FROM users WHERE id = ? AND (manager_id = ? OR department_id = (SELECT department_id FROM users WHERE id = ?))
      `).get(req.params.id, req.user.id, req.user.id);
      if (!isTeamMember) {
        return res.status(403).json({ error: 'Forbidden: Not in your team scope' });
      }
    }

    logAudit(req, 'Profile Viewed', 'Staff', req.params.id, { staff_name: row.name });

    const profile = formatStaffProfile(row, false);
    // Include KYC doc meta (but not image data) for authorized profile view
    if (isAdmin || isSelf) {
      const kyc = db.prepare(`SELECT kyc_status, aadhaar_front_doc IS NOT NULL as has_front, aadhaar_back_doc IS NOT NULL as has_back FROM staff_kyc WHERE user_id = ?`).get(req.params.id);
      profile.kyc_meta = kyc || { kyc_status: 'pending', has_front: 0, has_back: 0 };
    }

    res.json({ staff: profile });
  } catch (err) {
    console.error('Get staff profile error:', err);
    res.status(500).json({ error: 'Failed to fetch staff profile' });
  }
});

// ─── GET /api/staff/:id/aadhaar-reveal ─── Authorized full Aadhaar reveal ─────
router.get('/:id/aadhaar-reveal', authenticateToken, requireAdmin, (req, res) => {
  try {
    const kyc = db.prepare(`SELECT aadhaar_number FROM staff_kyc WHERE user_id = ?`).get(req.params.id);
    if (!kyc || !kyc.aadhaar_number) {
      return res.status(404).json({ error: 'No Aadhaar on record for this staff member' });
    }

    const staff = db.prepare(`SELECT name, emp_or_mgr_id FROM users WHERE id = ?`).get(req.params.id);

    // Audit every single reveal action — security critical
    logAudit(req, 'Aadhaar Revealed', 'Staff KYC', req.params.id, {
      staff_name: staff ? staff.name : req.params.id,
      staff_id: staff ? staff.emp_or_mgr_id : req.params.id,
      revealed_by: req.user.name,
      note: 'Full Aadhaar number accessed by authorized admin'
    });

    res.json({ aadhaar_number: kyc.aadhaar_number });
  } catch (err) {
    console.error('Aadhaar reveal error:', err);
    res.status(500).json({ error: 'Failed to retrieve Aadhaar' });
  }
});

// ─── GET /api/staff/:id/document/:type ─── Serve Aadhaar doc (admin only) ─────
router.get('/:id/document/:type', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { type } = req.params;
    if (!['front', 'back'].includes(type)) {
      return res.status(400).json({ error: 'Invalid document type. Use front or back.' });
    }

    const field = type === 'front' ? 'aadhaar_front_doc' : 'aadhaar_back_doc';
    const kyc = db.prepare(`SELECT ${field} as doc_data FROM staff_kyc WHERE user_id = ?`).get(req.params.id);

    if (!kyc || !kyc.doc_data) {
      return res.status(404).json({ error: `Aadhaar ${type} document not found` });
    }

    const staff = db.prepare(`SELECT name, emp_or_mgr_id FROM users WHERE id = ?`).get(req.params.id);
    const actionLabel = type === 'front' ? 'Aadhaar Front Viewed' : 'Aadhaar Back Viewed';
    logAudit(req, actionLabel, 'Staff KYC', req.params.id, {
      staff_name: staff ? staff.name : req.params.id,
      viewed_by: req.user.name
    });

    // Return base64 data or URL
    res.json({ doc_data: kyc.doc_data, type });
  } catch (err) {
    console.error('Document serve error:', err);
    res.status(500).json({ error: 'Failed to retrieve document' });
  }
});

// ─── POST /api/staff ─── Create Staff ─────────────────────────────────────────
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const {
      // Personal
      name, date_of_birth, gender, father_name, mother_name,
      // Contact
      email, phone, alt_phone, whatsapp_number,
      current_address, permanent_address, city, state, pin_code,
      // Professional
      role = 'employee', staff_type = 'Employee', department_id, manager_id,
      team_id, manager_type_id, joining_date, employment_status = 'Active',
      designation, reporting_manager_id, profile_image, emp_or_mgr_id,
      // Advocate
      registration_number, bar_council_state, specialization, years_experience,
      // Aadhaar KYC
      aadhaar_number, aadhaar_front_doc, aadhaar_back_doc,
      // Login
      password = 'Staff@123456',
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    if (!['admin', 'manager', 'employee', 'advocate'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be admin, manager, employee, or advocate.' });
    }

    // Duplicate checks
    const emailDup = db.prepare(`SELECT id FROM users WHERE email = ? COLLATE NOCASE`).get(email.trim());
    if (emailDup) return res.status(400).json({ error: 'A user with this email already exists' });

    if (phone) {
      const phoneDup = db.prepare(`SELECT id FROM users WHERE phone = ?`).get(phone.trim());
      if (phoneDup) return res.status(400).json({ error: 'A user with this phone number already exists' });
    }

    if (aadhaar_number) {
      const cleanAadhaar = aadhaar_number.replace(/\s/g, '');
      const aadhaarDup = db.prepare(`SELECT user_id FROM staff_kyc WHERE replace(aadhaar_number,' ','') = ?`).get(cleanAadhaar);
      if (aadhaarDup) return res.status(400).json({ error: 'This Aadhaar number is already registered' });
    }

    // Generate Staff ID if not provided
    const staffId = emp_or_mgr_id ? emp_or_mgr_id.trim().toUpperCase() : generateStaffId(role);

    if (staffId) {
      const idDup = db.prepare(`SELECT id FROM users WHERE emp_or_mgr_id = ?`).get(staffId);
      if (idDup) return res.status(400).json({ error: 'This Staff ID is already in use' });
    }

    const userId = (role === 'manager' ? 'mgr-' : role === 'advocate' ? 'adv-' : 'emp-') + uuidv4().slice(0, 8);
    const passwordHash = bcrypt.hashSync(password, 10);

    // Begin transaction
    const createStaff = db.transaction(() => {
      // 1. Create user record
      db.prepare(`
        INSERT INTO users (id, name, email, phone, password_hash, role,
          department_id, manager_id, team_id, manager_type_id, emp_or_mgr_id,
          profile_image, joining_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
      `).run(
        userId, name.trim(), email.trim().toLowerCase(), phone || null,
        passwordHash, role,
        department_id || null, manager_id || null, team_id || null,
        manager_type_id || null, staffId,
        profile_image || null,
        joining_date || new Date().toISOString().split('T')[0]
      );

      // 2. Extended profile
      db.prepare(`
        INSERT INTO staff_extended_profiles (
          user_id, date_of_birth, gender, father_name, mother_name,
          alt_phone, whatsapp_number, current_address, permanent_address,
          city, state, pin_code, designation, employment_status, staff_type,
          reporting_manager_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        date_of_birth || null, gender || null, father_name || null, mother_name || null,
        alt_phone || null, whatsapp_number || null,
        current_address || null, permanent_address || null,
        city || null, state || null, pin_code || null,
        designation || null, employment_status, staff_type,
        reporting_manager_id || manager_id || null
      );

      // 3. Aadhaar KYC
      if (aadhaar_number || aadhaar_front_doc || aadhaar_back_doc) {
        const kycId = 'kyc-' + uuidv4().slice(0, 8);
        db.prepare(`
          INSERT INTO staff_kyc (id, user_id, aadhaar_number, aadhaar_front_doc, aadhaar_back_doc, kyc_status)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          kycId, userId,
          aadhaar_number || null, aadhaar_front_doc || null, aadhaar_back_doc || null,
          (aadhaar_number && aadhaar_front_doc && aadhaar_back_doc) ? 'uploaded' : 'pending'
        );
      }

      // 4. Advocate details
      if (role === 'advocate' || staff_type === 'Advocate') {
        db.prepare(`
          INSERT INTO staff_advocate_details (user_id, registration_number, bar_council_state, specialization, years_experience)
          VALUES (?, ?, ?, ?, ?)
        `).run(userId, registration_number || null, bar_council_state || null, specialization || null, years_experience || 0);
      }
    });

    createStaff();

    logAudit(req, 'Staff Created', 'Staff', userId, {
      name, email, role, staff_type, designation,
      department_id, emp_or_mgr_id: staffId,
      has_aadhaar: !!aadhaar_number
    });

    res.status(201).json({
      message: 'Staff member created successfully',
      id: userId,
      emp_or_mgr_id: staffId
    });
  } catch (err) {
    console.error('Create staff error:', err);
    res.status(500).json({ error: err.message || 'Failed to create staff member' });
  }
});

// ─── PUT /api/staff/:id ─── Update Staff Profile ──────────────────────────────
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const existing = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Staff member not found' });

    const {
      name, email, phone, emp_or_mgr_id, department_id, manager_id,
      team_id, manager_type_id, joining_date, status, profile_image,
      // Extended
      date_of_birth, gender, father_name, mother_name,
      alt_phone, whatsapp_number, current_address, permanent_address,
      city, state, pin_code, designation, employment_status, staff_type, reporting_manager_id,
      // Advocate
      registration_number, bar_council_state, specialization, years_experience
    } = req.body;

    // Email uniqueness check
    if (email && email.toLowerCase() !== existing.email) {
      const dup = db.prepare(`SELECT id FROM users WHERE email = ? AND id != ?`).get(email.trim().toLowerCase(), req.params.id);
      if (dup) return res.status(400).json({ error: 'Email is already used by another account' });
    }

    const update = db.transaction(() => {
      // Update core user
      db.prepare(`
        UPDATE users SET
          name = COALESCE(?, name), email = COALESCE(?, email),
          phone = COALESCE(?, phone), emp_or_mgr_id = COALESCE(?, emp_or_mgr_id),
          department_id = COALESCE(?, department_id), manager_id = COALESCE(?, manager_id),
          team_id = COALESCE(?, team_id), manager_type_id = COALESCE(?, manager_type_id),
          joining_date = COALESCE(?, joining_date), status = COALESCE(?, status),
          profile_image = COALESCE(?, profile_image), updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        name ? name.trim() : null,
        email ? email.trim().toLowerCase() : null,
        phone || null, emp_or_mgr_id ? emp_or_mgr_id.trim().toUpperCase() : null,
        department_id || null, manager_id || null, team_id || null,
        manager_type_id || null, joining_date || null, status || null,
        profile_image || null, req.params.id
      );

      // Upsert extended profile
      db.prepare(`
        INSERT INTO staff_extended_profiles (
          user_id, date_of_birth, gender, father_name, mother_name,
          alt_phone, whatsapp_number, current_address, permanent_address,
          city, state, pin_code, designation, employment_status, staff_type, reporting_manager_id, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET
          date_of_birth = COALESCE(excluded.date_of_birth, date_of_birth),
          gender = COALESCE(excluded.gender, gender),
          father_name = COALESCE(excluded.father_name, father_name),
          mother_name = COALESCE(excluded.mother_name, mother_name),
          alt_phone = COALESCE(excluded.alt_phone, alt_phone),
          whatsapp_number = COALESCE(excluded.whatsapp_number, whatsapp_number),
          current_address = COALESCE(excluded.current_address, current_address),
          permanent_address = COALESCE(excluded.permanent_address, permanent_address),
          city = COALESCE(excluded.city, city),
          state = COALESCE(excluded.state, state),
          pin_code = COALESCE(excluded.pin_code, pin_code),
          designation = COALESCE(excluded.designation, designation),
          employment_status = COALESCE(excluded.employment_status, employment_status),
          staff_type = COALESCE(excluded.staff_type, staff_type),
          reporting_manager_id = COALESCE(excluded.reporting_manager_id, reporting_manager_id),
          updated_at = CURRENT_TIMESTAMP
      `).run(
        req.params.id,
        date_of_birth || null, gender || null, father_name || null, mother_name || null,
        alt_phone || null, whatsapp_number || null, current_address || null, permanent_address || null,
        city || null, state || null, pin_code || null, designation || null,
        employment_status || null, staff_type || null, reporting_manager_id || null
      );

      // Advocate details upsert if needed
      if (registration_number !== undefined || bar_council_state !== undefined || specialization !== undefined) {
        db.prepare(`
          INSERT INTO staff_advocate_details (user_id, registration_number, bar_council_state, specialization, years_experience, updated_at)
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(user_id) DO UPDATE SET
            registration_number = COALESCE(excluded.registration_number, registration_number),
            bar_council_state = COALESCE(excluded.bar_council_state, bar_council_state),
            specialization = COALESCE(excluded.specialization, specialization),
            years_experience = COALESCE(excluded.years_experience, years_experience),
            updated_at = CURRENT_TIMESTAMP
        `).run(req.params.id, registration_number || null, bar_council_state || null, specialization || null, years_experience || null);
      }
    });

    update();
    logAudit(req, 'Staff Updated', 'Staff', req.params.id, { name, email, department_id });
    res.json({ message: 'Staff profile updated successfully' });
  } catch (err) {
    console.error('Update staff error:', err);
    res.status(500).json({ error: 'Failed to update staff profile' });
  }
});

// ─── POST /api/staff/:id/kyc ─── Upload / Update Aadhaar KYC ─────────────────
router.post('/:id/kyc', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { aadhaar_number, aadhaar_front_doc, aadhaar_back_doc } = req.body;

    const staffExists = db.prepare(`SELECT id, name FROM users WHERE id = ?`).get(req.params.id);
    if (!staffExists) return res.status(404).json({ error: 'Staff member not found' });

    const existingKyc = db.prepare(`SELECT id FROM staff_kyc WHERE user_id = ?`).get(req.params.id);

    const kycStatus = (aadhaar_number && aadhaar_front_doc && aadhaar_back_doc) ? 'uploaded' : 'pending';

    if (existingKyc) {
      // Update
      const updates = [];
      const params = [];
      if (aadhaar_number !== undefined) { updates.push('aadhaar_number = ?'); params.push(aadhaar_number); }
      if (aadhaar_front_doc !== undefined) { updates.push('aadhaar_front_doc = ?'); params.push(aadhaar_front_doc); }
      if (aadhaar_back_doc !== undefined) { updates.push('aadhaar_back_doc = ?'); params.push(aadhaar_back_doc); }
      updates.push('kyc_status = ?', 'updated_at = CURRENT_TIMESTAMP');
      params.push(kycStatus, req.params.id);

      db.prepare(`UPDATE staff_kyc SET ${updates.join(', ')} WHERE user_id = ?`).run(...params);
      logAudit(req, 'Aadhaar Updated', 'Staff KYC', req.params.id, { staff_name: staffExists.name, updated_by: req.user.name });
    } else {
      // Insert
      const kycId = 'kyc-' + uuidv4().slice(0, 8);
      db.prepare(`
        INSERT INTO staff_kyc (id, user_id, aadhaar_number, aadhaar_front_doc, aadhaar_back_doc, kyc_status)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(kycId, req.params.id, aadhaar_number || null, aadhaar_front_doc || null, aadhaar_back_doc || null, kycStatus);
      logAudit(req, 'Aadhaar Added', 'Staff KYC', req.params.id, { staff_name: staffExists.name, updated_by: req.user.name });
    }

    res.json({ message: 'Aadhaar KYC updated successfully' });
  } catch (err) {
    console.error('KYC update error:', err);
    res.status(500).json({ error: 'Failed to update Aadhaar KYC' });
  }
});

// ─── PATCH /api/staff/:id/status ─── Activate/Deactivate/Suspend ──────────────
router.patch('/:id/status', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['active', 'inactive', 'suspended', 'resigned'];
    if (!status || !valid.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${valid.join(', ')}` });
    }
    const staff = db.prepare(`SELECT id, name, status FROM users WHERE id = ?`).get(req.params.id);
    if (!staff) return res.status(404).json({ error: 'Staff member not found' });

    db.prepare(`UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(status, req.params.id);
    const action = status === 'active' ? 'Staff Activated' : status === 'suspended' ? 'Staff Suspended' : status === 'resigned' ? 'Staff Resigned' : 'Staff Deactivated';
    logAudit(req, action, 'Staff', req.params.id, { name: staff.name, previous_status: staff.status, new_status: status });

    res.json({ message: `Staff status updated to ${status}`, status });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// ─── POST /api/staff/:id/reset-password ────────────────────────────────────────
router.post('/:id/reset-password', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { new_password } = req.body;
    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const staff = db.prepare(`SELECT id, name FROM users WHERE id = ?`).get(req.params.id);
    if (!staff) return res.status(404).json({ error: 'Staff member not found' });

    const hash = bcrypt.hashSync(new_password, 10);
    db.prepare(`UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(hash, req.params.id);
    logAudit(req, 'Staff Password Reset', 'Staff', req.params.id, { staff_name: staff.name, reset_by: req.user.name });
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;

