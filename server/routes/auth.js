const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { JWT_SECRET, authenticateToken, logAudit } = require('../middleware/auth');

// Server-side sliding-window IP rate limiter
const ipLoginAttempts = new Map();
const IP_RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_IP_ATTEMPTS_PER_WINDOW = 30; // Max 30 attempts/min per IP

function checkIpRateLimit(ip) {
  const now = Date.now();
  const record = ipLoginAttempts.get(ip) || { count: 0, resetAt: now + IP_RATE_LIMIT_WINDOW_MS };

  if (now > record.resetAt) {
    record.count = 1;
    record.resetAt = now + IP_RATE_LIMIT_WINDOW_MS;
  } else {
    record.count += 1;
  }

  ipLoginAttempts.set(ip, record);
  return record.count <= MAX_IP_ATTEMPTS_PER_WINDOW;
}

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    // 1. IP Rate Limiting Check
    if (!checkIpRateLimit(clientIp)) {
      return res.status(429).json({
        error: 'Too many login requests from this IP address. Please wait a moment and try again.'
      });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email/Employee ID and password are required' });
    }

    const trimmedInput = email.trim();
    const user = db.prepare(`
      SELECT * FROM users 
      WHERE email = ? COLLATE NOCASE 
         OR emp_or_mgr_id = ? COLLATE NOCASE
    `).get(trimmedInput, trimmedInput);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email/employee ID or password' });
    }

    // 2. Super Admin Lockout Enforcement (Applied exclusively to Super Admin)
    if (user.role === 'admin') {
      const now = new Date();

      // Check if account is currently locked
      if (user.locked_until) {
        const lockExpiry = new Date(user.locked_until);
        if (lockExpiry > now) {
          // Lock is still active
          logAudit(
            { user, ip: clientIp, headers: req.headers },
            'Admin Login Blocked (Account Locked)',
            'Auth',
            user.id,
            { locked_until: user.locked_until, client_ip: clientIp }
          );
          return res.status(403).json({
            error: 'Too many failed login attempts. Your account has been temporarily locked. Please try again after 15 minutes.'
          });
        } else {
          // 15-minute lock expired -> Automatically unlock account
          db.prepare(`
            UPDATE users 
            SET locked_until = NULL, failed_login_attempts = 0, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
          `).run(user.id);
          user.failed_login_attempts = 0;
          user.locked_until = null;
        }
      }

      // Check user active status
      if (user.status !== 'active') {
        return res.status(403).json({ error: 'Account is deactivated. Please contact Super Administrator.' });
      }

      // Verify Admin Password Hash
      const isMatch = bcrypt.compareSync(password, user.password_hash);

      if (!isMatch) {
        const newFailedCount = (user.failed_login_attempts || 0) + 1;

        if (newFailedCount >= 5) {
          // Lock Admin Account for exactly 15 minutes
          const lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
          db.prepare(`
            UPDATE users 
            SET failed_login_attempts = ?, locked_until = ?, last_failed_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
          `).run(newFailedCount, lockUntil, user.id);

          logAudit(
            { user, ip: clientIp, headers: req.headers },
            'Admin Account Temporarily Locked',
            'Auth',
            user.id,
            { reason: '5 consecutive failed attempts', locked_until: lockUntil, client_ip: clientIp }
          );

          return res.status(403).json({
            error: 'Too many failed login attempts. Your account has been temporarily locked. Please try again after 15 minutes.'
          });
        } else {
          // Record failed attempt (< 5)
          db.prepare(`
            UPDATE users 
            SET failed_login_attempts = ?, last_failed_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
          `).run(newFailedCount, user.id);

          logAudit(
            { user, ip: clientIp, headers: req.headers },
            'Failed Admin Login',
            'Auth',
            user.id,
            { failed_attempts: newFailedCount, client_ip: clientIp }
          );

          return res.status(401).json({ error: 'Invalid email or password' });
        }
      }

      // Successful Admin Login -> Reset failed attempts and clear lock
      db.prepare(`
        UPDATE users 
        SET failed_login_attempts = 0, locked_until = NULL, last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(user.id);

      logAudit(
        { user, ip: clientIp, headers: req.headers },
        'Successful Admin Login',
        'Auth',
        user.id,
        { client_ip: clientIp }
      );
    } else {
      // 3. Employee, Manager, Advocate standard authentication flow (Unmodified)
      if (user.status !== 'active') {
        return res.status(403).json({ error: 'Account is deactivated. Please contact Super Administrator.' });
      }

      const isMatch = bcrypt.compareSync(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      logAudit(
        { user, ip: clientIp, headers: req.headers },
        'User Login',
        'Auth',
        user.id,
        `Logged in successfully from ${clientIp}`
      );
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emp_or_mgr_id: user.emp_or_mgr_id,
        department_id: user.department_id,
        manager_type_id: user.manager_type_id
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      emp_or_mgr_id: user.emp_or_mgr_id,
      profile_image: user.profile_image,
      department_id: user.department_id,
      status: user.status
    };

    res.json({
      message: 'Login successful',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT u.id, u.name, u.email, u.phone, u.role, u.emp_or_mgr_id, 
             u.profile_image, u.department_id, u.team_id, u.manager_id, 
             u.manager_type_id, u.status, u.joining_date, u.id_type,
             d.name as department_name, mt.name as manager_type_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN manager_types mt ON u.manager_type_id = mt.id
      WHERE u.id = ?
    `).get(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// PUT /api/auth/profile (Update Admin Profile)
router.put('/profile', authenticateToken, (req, res) => {
  try {
    const { name, phone, profile_image, current_password, new_password } = req.body;

    const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let passwordHash = user.password_hash;
    if (new_password) {
      if (!current_password || !bcrypt.compareSync(current_password, user.password_hash)) {
        return res.status(400).json({ error: 'Current password does not match' });
      }
      passwordHash = bcrypt.hashSync(new_password, 10);
    }

    db.prepare(`
      UPDATE users 
      SET name = ?, phone = ?, profile_image = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name || user.name, phone || user.phone, profile_image || user.profile_image, passwordHash, req.user.id);

    logAudit(req, 'Profile Updated', 'Profile', req.user.id, 'Admin updated profile details');

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
