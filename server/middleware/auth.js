const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'settl_expert_super_secure_jwt_secret_key_2025';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Administrator access required' });
  }
  next();
}

function requireEmployeeOrAdmin(req, res, next) {
  if (!req.user || (req.user.role !== 'employee' && req.user.role !== 'admin' && req.user.role !== 'manager')) {
    return res.status(403).json({ error: 'Forbidden: Authorized CRM access required' });
  }
  next();
}

function requireManagerOrAdmin(req, res, next) {
  if (!req.user || (req.user.role !== 'manager' && req.user.role !== 'admin')) {
    return res.status(403).json({ error: 'Forbidden: Manager or Administrator access required' });
  }
  next();
}

function getManagerScope(req) {
  if (req.user.role === 'admin') {
    return {
      isAdmin: true,
      managerId: null,
      departmentId: null,
      managerType: 'ADMIN',
      permissions: null,
      employeeIds: []
    };
  }

  const managerUser = db.prepare(`
    SELECT u.*, mt.code as type_code, mt.name as type_name, mt.permissions_json, d.code as dept_code, d.name as dept_name
    FROM users u
    LEFT JOIN manager_types mt ON u.manager_type_id = mt.id
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.id = ?
  `).get(req.user.id);

  const employees = db.prepare(`
    SELECT id FROM users 
    WHERE manager_id = ? OR department_id = ?
  `).all(req.user.id, managerUser ? managerUser.department_id : null);

  const employeeIds = employees.map(e => e.id);

  let permissions = {};
  try {
    if (managerUser && managerUser.permissions_json) {
      permissions = JSON.parse(managerUser.permissions_json);
    }
  } catch (e) {
    permissions = {};
  }

  return {
    isAdmin: false,
    managerId: req.user.id,
    departmentId: managerUser ? managerUser.department_id : null,
    managerType: managerUser ? (managerUser.type_code || 'CUSTOM').toUpperCase() : 'CUSTOM',
    permissions,
    employeeIds
  };
}

function logAudit(req, action, module, recordId, details) {
  try {
    const logId = 'aud-' + uuidv4().slice(0, 8);
    const userId = (req && req.user) ? req.user.id : (typeof req === 'object' && req.user_id ? req.user_id : 'system');
    const userName = (req && req.user) ? req.user.name : (typeof req === 'object' && req.user_name ? req.user_name : 'System');
    const role = (req && req.user) ? req.user.role : (typeof req === 'object' && req.role ? req.role : 'admin');
    const detailsStr = typeof details === 'object' ? JSON.stringify(details) : String(details || '');
    const ipAddress = (req && req.ip) ? req.ip : (req && req.headers && req.headers['x-forwarded-for']) ? req.headers['x-forwarded-for'] : '127.0.0.1';
    const userAgent = (req && req.headers && req.headers['user-agent']) ? req.headers['user-agent'] : 'System/API';

    db.prepare(`
      INSERT INTO audit_logs (id, user_id, user_name, role, action, module, record_id, details_json, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(logId, userId, userName, role, action, module, String(recordId || ''), detailsStr, ipAddress, userAgent);
  } catch (err) {
    console.error('Audit Log Error:', err.message);
  }
}

function requireAdvocateOrAdmin(req, res, next) {
  if (!req.user || (req.user.role !== 'advocate' && req.user.role !== 'admin')) {
    return res.status(403).json({ error: 'Forbidden: Advocate or Administrator access required' });
  }
  next();
}

function getAdvocateScope(req) {
  if (req.user.role === 'admin') {
    return {
      isAdmin: true,
      advocateId: null,
      advocateRecord: null
    };
  }

  let adv = null;
  if (req.user.emp_or_mgr_id) {
    adv = db.prepare(`SELECT * FROM advocates WHERE id = ? OR advocate_id = ?`).get(req.user.emp_or_mgr_id, req.user.emp_or_mgr_id);
  }
  if (!adv && req.user.email) {
    adv = db.prepare(`SELECT * FROM advocates WHERE email = ? COLLATE NOCASE`).get(req.user.email);
  }

  return {
    isAdmin: false,
    advocateId: adv ? adv.id : (req.user.emp_or_mgr_id || req.user.id),
    advocateRecord: adv
  };
}

module.exports = {
  JWT_SECRET,
  authenticateToken,
  requireAdmin,
  requireEmployeeOrAdmin,
  requireManagerOrAdmin,
  requireAdvocateOrAdmin,
  getManagerScope,
  getAdvocateScope,
  logAudit
};
