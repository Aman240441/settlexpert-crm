const db = require('../db/database');
const bcrypt = require('bcryptjs');

const email = 'settlexperts@gmail.com';
const plainPassword = 'settlexpert931075@Abc';
const passwordHash = bcrypt.hashSync(plainPassword, 10);

// Check if user already exists
const existing = db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(email);

if (existing) {
  db.prepare("UPDATE users SET name = 'Super Administrator', password_hash = ?, role = 'admin', status = 'active' WHERE id = ?").run(passwordHash, existing.id);
  console.log('Updated existing Super Admin user:', existing.email);
} else {
  // Update old admin user if present or create new
  const oldAdmin = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@settlexpert.com');
  if (oldAdmin) {
    db.prepare("UPDATE users SET email = ?, name = 'Super Administrator', password_hash = ?, role = 'admin', status = 'active' WHERE id = ?").run(email, passwordHash, oldAdmin.id);
    console.log('Migrated admin@settlexpert.com to:', email);
  } else {
    db.prepare(`
      INSERT INTO users (id, name, email, phone, password_hash, role, emp_or_mgr_id, status, joining_date)
      VALUES (?, 'Super Administrator', ?, '+91 9876543210', ?, 'admin', 'ADM-001', 'active', '2025-01-01')
    `).run('user-admin-01', email, passwordHash);
    console.log('Created new Super Admin account:', email);
  }
}

// Verify password verification
const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
const valid = bcrypt.compareSync(plainPassword, user.password_hash);
console.log('Super Admin Verification:', {
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  status: user.status,
  isPasswordHashValid: valid,
  isPlaintextStored: user.password_hash === plainPassword ? 'FAIL' : 'SECURE_HASH'
});
