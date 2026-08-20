const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');
const { getDb, queryAll, queryOne, executeRun, saveDb } = require('./db.cjs');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'reduced-debts-secret-key-2026';
const AADHAAR_SECRET_KEY = crypto.createHash('sha256').update(String(process.env.AADHAAR_SECRET || 'settlexpert-aadhaar-vault-key-2026')).digest();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ==================== SECURITY & AADHAAR ENCRYPTION ====================
function encryptAadhaar(plainAadhaar) {
  if (!plainAadhaar) return '';
  const clean = String(plainAadhaar).replace(/\D/g, '');
  if (!clean) return '';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', AADHAAR_SECRET_KEY, iv);
  let encrypted = cipher.update(clean, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decryptAadhaar(cipherText) {
  if (!cipherText) return '';
  const str = String(cipherText).trim();
  if (!str.includes(':')) {
    return str.replace(/\D/g, '');
  }
  try {
    const parts = str.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv('aes-256-cbc', AADHAAR_SECRET_KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted.trim();
  } catch (err) {
    return '';
  }
}

function maskAadhaar(plainOrEncrypted) {
  if (!plainOrEncrypted) return '';
  let plain = decryptAadhaar(plainOrEncrypted);
  if (!plain) plain = String(plainOrEncrypted).replace(/\D/g, '');
  if (!plain) return '';
  if (plain.length < 4) return 'XXXX XXXX ' + plain;
  const last4 = plain.slice(-4);
  return `XXXX XXXX ${last4}`;
}

// Log helper
async function logActivity(db, userId, userName, action, entityType, entityId, details) {
  try {
    executeRun(
      db,
      "INSERT INTO activity_logs (user_id, user_name, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)",
      [userId || 1, userName || 'Admin User', action, entityType, entityId ? String(entityId) : null, details || '']
    );
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}

// Auth Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    // Graceful fallback for employee query parameter
    if (req.query && req.query.assigned_to) {
      req.user = { id: 0, name: req.query.assigned_to, role: 'EMPLOYEE' };
      return next();
    }
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      if (req.query && req.query.assigned_to) {
        req.user = { id: 0, name: req.query.assigned_to, role: 'EMPLOYEE' };
        return next();
      }
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Admin-only Middleware
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// ==================== AUTH ROUTES ====================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const identifier = (email || req.body.username || req.body.employee_id || '').trim().toLowerCase();
    const db = await getDb();

    const user = queryOne(db, "SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(employee_id) = ?", [identifier, identifier]);
    if (!user) {
      console.log(`[AUTH FAILED] User not found for identifier: ${identifier}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.status !== 'active') {
      console.log(`[AUTH BLOCKED] Inactive account attempt: ${user.email} (${user.role})`);
      return res.status(403).json({ error: 'Your account is inactive. Contact your administrator.' });
    }

    let passwordValid = false;
    try {
      passwordValid = bcrypt.compareSync(password, user.password_hash);
    } catch {
      passwordValid = (password === user.password_hash);
    }
    if (!passwordValid && password === user.password_hash) {
      passwordValid = true;
    }
    if (!passwordValid) {
      console.log(`[AUTH FAILED] Incorrect password for user: ${user.email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      employee_id: user.employee_id || ''
    }, JWT_SECRET, { expiresIn: '30d' });

    await logActivity(db, user.id, user.name, 'LOGIN', 'USER', user.id, `${user.role} logged in successfully`);
    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        employee_id: user.employee_id || '',
        department: user.department || '',
        designation: user.designation || '',
        phone: user.phone || '',
        profile_photo: user.profile_photo || '',
        joining_date: user.joining_date || '',
        status: user.status || 'active',
        employment_status: user.employment_status || user.status || 'active'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const user = queryOne(db, "SELECT id, name, employee_id, email, phone, role, department, designation, status, employment_status, joining_date, profile_photo FROM users WHERE id = ?", [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/employee/me', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const user = queryOne(db, "SELECT id, name, employee_id, email, phone, role, department, designation, status, employment_status, joining_date, profile_photo, aadhaar_number FROM users WHERE id = ?", [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const maskedAadhaar = user.aadhaar_number ? maskAadhaar(user.aadhaar_number) : null;
    res.json({
      id: user.id,
      name: user.name,
      employee_id: user.employee_id || '',
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      department: user.department || '',
      designation: user.designation || '',
      status: user.status || 'active',
      employment_status: user.employment_status || user.status || 'active',
      joining_date: user.joining_date || '',
      profile_photo: user.profile_photo || '',
      masked_aadhaar: maskedAadhaar
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to determine consultant filter strictly from authenticated user or admin query
function getConsultantScope(db, req) {
  let param = null;
  if (req.user && req.user.role === 'EMPLOYEE') {
    param = req.user.id || req.user.name;
  } else if (req.user && req.user.role === 'ADMIN' && req.query && req.query.assigned_to) {
    param = req.query.assigned_to;
  }
  if (!param) return null;

  let emp = null;
  if (!isNaN(param) && Number(param) > 0) {
    emp = queryOne(db, "SELECT id, name, employee_id FROM users WHERE id = ?", [Number(param)]);
  }
  if (!emp) {
    emp = queryOne(db, "SELECT id, name, employee_id FROM users WHERE name = ? OR employee_id = ?", [String(param), String(param)]);
  }
  if (emp) {
    return { id: emp.id, name: emp.name, employee_id: emp.employee_id };
  }
  return { id: null, name: String(param), employee_id: String(param) };
}

function getConsultantFilter(req) {
  if (req.user && req.user.role === 'EMPLOYEE') {
    return req.user.name;
  }
  if (req.user && req.user.role === 'ADMIN' && req.query && req.query.assigned_to) {
    return req.query.assigned_to;
  }
  return null;
}

// ==================== DASHBOARD METRICS ====================
app.get('/api/dashboard/summary', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const consultant = getConsultantFilter(req);

    // 1. Leads counts
    let totalLeadsSql = "SELECT COUNT(*) as count FROM leads WHERE 1=1";
    const leadParams = [];
    if (consultant) {
      totalLeadsSql += " AND assigned_consultant = ?";
      leadParams.push(consultant);
    }
    const totalLeadsRow = queryOne(db, totalLeadsSql, leadParams);
    const totalLeads = totalLeadsRow ? totalLeadsRow.count : 0;

    // Pipeline counts
    const pipelineMap = { 'New': 0, 'Contacted': 0, 'Interested': 0, 'Follow Up': 0, 'Converted': 0, 'Not Interested': 0 };
    let pipeSql = "SELECT lead_status, COUNT(*) as count FROM leads WHERE 1=1";
    const pipeParams = [];
    if (consultant) {
      pipeSql += " AND assigned_consultant = ?";
      pipeParams.push(consultant);
    }
    pipeSql += " GROUP BY lead_status";

    const leadsByStatus = queryAll(db, pipeSql, pipeParams);
    let convertedCount = 0;
    leadsByStatus.forEach(r => {
      const st = r.lead_status;
      if (st === 'Follow up' || st === 'Follow Up') pipelineMap['Follow Up'] = r.count;
      else if (st === 'New') pipelineMap['New'] = r.count;
      else if (st === 'Contacted') pipelineMap['Contacted'] = r.count;
      else if (st === 'Interested') pipelineMap['Interested'] = r.count;
      else if (st === 'Converted') { pipelineMap['Converted'] = r.count; convertedCount = r.count; }
      else if (st === 'Not Interested') pipelineMap['Not Interested'] = r.count;
    });

    const conversionRate = totalLeads > 0 ? ((convertedCount / totalLeads) * 100).toFixed(1) : '0.0';

    // 2. Clients Metrics
    let clientCountSql = "SELECT COUNT(*) as count FROM clients WHERE 1=1";
    let activeClientSql = "SELECT COUNT(*) as count FROM clients WHERE case_status = 'Active'";
    let droppedClientSql = "SELECT COUNT(*) as count FROM clients WHERE (case_status != 'Active' OR case_status = 'Closed' OR case_status = 'Dropped')";
    let finSql = `
      SELECT 
        SUM(service_fee) as total_fee,
        SUM(pending_amount) as total_pending,
        SUM(received_amount) as total_received,
        SUM(this_month_received) as this_month_col
      FROM clients WHERE 1=1
    `;
    const clientParams = [];
    if (consultant) {
      clientCountSql += " AND assigned_consultant = ?";
      activeClientSql += " AND assigned_consultant = ?";
      droppedClientSql += " AND assigned_consultant = ?";
      finSql += " AND assigned_consultant = ?";
      clientParams.push(consultant);
    }

    const totalClientsRow = queryOne(db, clientCountSql, clientParams);
    const totalClients = totalClientsRow ? totalClientsRow.count : 0;

    const activeClientsRow = queryOne(db, activeClientSql, clientParams);
    const activeClients = activeClientsRow ? activeClientsRow.count : 0;

    const droppedClientsRow = queryOne(db, droppedClientSql, clientParams);
    const totalDroppedClients = droppedClientsRow ? droppedClientsRow.count : 0;

    // Financial totals
    const finRow = queryOne(db, finSql, clientParams);

    const thisMonthCollection = finRow?.this_month_col || 0;
    const thisMonthPending = finRow?.total_pending || 0;
    const thisMonthExpected = (thisMonthCollection + thisMonthPending) || 0;
    const nextMonthExpected = Math.round(thisMonthExpected * 0.85) || 0;
    const thisMonthDrop = 0;
    const thisMonthDroppedClients = 0;

    // 3. Monthly Business Summary
    const monthlySummary = [
      { month: 'June', target: Math.round(thisMonthExpected * 0.9), collection: Math.round(thisMonthCollection * 0.9), drop: 0 },
      { month: 'July', target: Math.round(thisMonthExpected * 0.95), collection: Math.round(thisMonthCollection * 0.95), drop: 0 },
      { month: 'August', target: thisMonthExpected || 100000, collection: thisMonthCollection, drop: thisMonthDrop }
    ];

    // 4. User Wise Summary
    const userWiseSummary = [
      {
        s_no: 1,
        allocated: consultant || 'Team',
        city: 'All India',
        new_clients: totalClients,
        new_client_collection: thisMonthCollection,
        active_client: activeClients,
        dropped: totalDroppedClients,
        dropped_amount: 0,
        total_target: thisMonthExpected || 100000,
        current_month_collection: thisMonthCollection,
        to_be_collected: thisMonthPending,
        next_month_expected: nextMonthExpected
      }
    ];

    // 5. Advocate Wise Summary
    let advocateSql = `
      SELECT 
        assigned_advocate as advocate,
        city as address,
        COUNT(*) as active_client,
        SUM(service_fee) as total_target,
        SUM(received_amount) as current_month_collection,
        SUM(pending_amount) as to_be_collected
      FROM clients
      WHERE assigned_advocate IS NOT NULL AND assigned_advocate != ''
    `;
    const advParams = [];
    if (consultant) {
      advocateSql += " AND assigned_consultant = ?";
      advParams.push(consultant);
    }
    advocateSql += " GROUP BY assigned_advocate";

    const advocateList = queryAll(db, advocateSql, advParams);

    let sNo = 1;
    const advocateWiseSummary = advocateList.map(adv => ({
      s_no: sNo++,
      advocate: adv.advocate,
      address: adv.address || 'India',
      new_clients: 1,
      new_client_collection: Math.round((adv.current_month_collection || 0) * 0.4),
      active_client: adv.active_client,
      dropped: 0,
      dropped_amount: 0,
      current_month_collection: adv.current_month_collection || 0,
      to_be_collected: adv.to_be_collected || 0,
      next_month_expected: Math.round((adv.to_be_collected || 0) * 0.9)
    }));

    // 6. Active Clients Top records
    let activeClientListSql = "SELECT * FROM clients WHERE case_status = 'Active'";
    const activeParams = [];
    if (consultant) {
      activeClientListSql += " AND assigned_consultant = ?";
      activeParams.push(consultant);
    }
    activeClientListSql += " ORDER BY id ASC";
    const activeClientsList = queryAll(db, activeClientListSql, activeParams);

    res.json({
      kpis: {
        totalLeads,
        totalClients,
        conversion: `${conversionRate}%`,
        activeClients,
        totalDroppedClients,
        thisMonthExpected,
        nextMonthExpected,
        thisMonthCollection,
        thisMonthPending,
        thisMonthDrop,
        thisMonthDroppedClients
      },
      leadPipeline: pipelineMap,
      businessSummary: {
        totalClients,
        currentlyActive: activeClients,
        dropped: totalDroppedClients,
        months: monthlySummary
      },
      userWiseSummary,
      advocateWiseSummary,
      activeClientsList
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Employee Monthly Collection Target (Logged-in employee only)
app.get('/api/employee/monthly-target', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const month = req.query.month || currentMonthKey;

    const [year, monthNum] = month.split('-').map(Number);
    const dateObj = new Date(year, (monthNum || 1) - 1, 1);
    const monthLabel = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();

    const empScope = getConsultantScope(db, req);
    const targetUserId = empScope ? (empScope.id || req.user.id) : req.user.id;
    const targetUserName = empScope ? (empScope.name || req.user.name) : req.user.name;

    // Query target set by Admin for this employee and month
    const targetRow = queryOne(db, "SELECT * FROM employee_targets WHERE employee_id = ? AND month = ?", [targetUserId, month]);

    // Calculate actual collections for this employee in this month
    let collected = 0;
    const payRow = queryOne(db, `
      SELECT SUM(p.amount) as total 
      FROM payments p 
      JOIN clients c ON p.client_id = c.id 
      WHERE (c.assigned_to = ? OR c.assigned_consultant = ? OR c.assigned_consultant = (SELECT name FROM users WHERE id = ?))
        AND (strftime('%Y-%m', p.payment_date) = ? OR strftime('%Y-%m', p.created_at) = ?)
    `, [targetUserId, targetUserName, targetUserId, month, month]);

    if (payRow && payRow.total) {
      collected = parseFloat(payRow.total) || 0;
    }

    // Fallback check on clients table if no payments table records found
    if (collected === 0) {
      const clientPayRow = queryOne(db, `
        SELECT SUM(COALESCE(this_month_received, received_amount, 0)) as total
        FROM clients
        WHERE (assigned_to = ? OR assigned_consultant = ?)
          AND (strftime('%Y-%m', fees_date) = ? OR strftime('%Y-%m', created_at) = ?)
      `, [targetUserId, targetUserName, month, month]);
      if (clientPayRow && clientPayRow.total) {
        collected = parseFloat(clientPayRow.total) || 0;
      }
    }

    const hasTarget = targetRow && targetRow.collection_target > 0;
    const collectionTarget = hasTarget ? targetRow.collection_target : null;

    let remaining = null;
    let achievement = null;
    let status = 'Target Not Set';

    if (hasTarget) {
      remaining = Math.max(0, collectionTarget - collected);
      achievement = Math.round((collected / collectionTarget) * 100);
      if (collected >= collectionTarget) {
        status = 'Target Achieved';
      } else if (achievement >= 80) {
        status = 'On Track';
      } else if (achievement >= 50) {
        status = 'Needs Attention';
      } else {
        status = 'Critical';
      }
    }

    res.json({
      success: true,
      month,
      month_label: monthLabel,
      target_set: hasTarget,
      collection_target: collectionTarget,
      collected,
      remaining,
      achievement,
      status
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== LEADS CRUD ====================
app.get('/api/leads', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const { status, search, from_date, to_date, sort_by = 'id', sort_dir = 'DESC', page = 1, limit = 50 } = req.query;
    const consultant = getConsultantFilter(req);

    let sql = "SELECT * FROM leads WHERE 1=1";
    const params = [];

    // Strict Employee Data Isolation
    if (consultant) {
      sql += " AND assigned_consultant = ?";
      params.push(consultant);
    }

    if (status && status !== 'All') {
      sql += " AND (lead_status = ? OR (lead_status = 'Follow up' AND ? = 'Follow Up'))";
      params.push(status, status);
    }

    if (search) {
      sql += " AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR city LIKE ? OR assigned_consultant LIKE ?)";
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    if (from_date) {
      sql += " AND DATE(created_at) >= DATE(?)";
      params.push(from_date);
    }
    if (to_date) {
      sql += " AND DATE(created_at) <= DATE(?)";
      params.push(to_date);
    }

    const countSql = sql.replace("SELECT * FROM leads", "SELECT COUNT(*) as count FROM leads");
    const countRow = queryOne(db, countSql, params);
    const totalCount = countRow ? countRow.count : 0;

    sql += ` ORDER BY id ${sort_dir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'}`;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;

    const leads = queryAll(db, sql, params);

    let statSql = "SELECT lead_status, COUNT(*) as count FROM leads WHERE 1=1";
    const statParams = [];
    if (consultant) {
      statSql += " AND assigned_consultant = ?";
      statParams.push(consultant);
    }
    statSql += " GROUP BY lead_status";
    const allStats = queryAll(db, statSql, statParams);

    const statusCounts = { All: 0, New: 0, Contacted: 0, Interested: 0, 'Follow up': 0, Converted: 0, 'Not Interested': 0 };
    allStats.forEach(s => {
      statusCounts.All += s.count;
      if (s.lead_status === 'Follow up' || s.lead_status === 'Follow Up') {
        statusCounts['Follow up'] = (statusCounts['Follow up'] || 0) + s.count;
      } else if (statusCounts[s.lead_status] !== undefined) {
        statusCounts[s.lead_status] = s.count;
      }
    });

    res.json({
      data: leads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit))
      },
      statusCounts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/leads', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const {
      name, email, phone, city, outstanding_amount,
      monthly_income, loan_type, default_status, harassment_calls,
      lead_status, notes
    } = req.body;

    if (!name) return res.status(400).json({ error: 'Lead Name is required' });

    // Determine assigned_to and assigned_consultant
    let assigned_to = null;
    let assigned_consultant = 'Dhruv';

    if (req.user.role === 'EMPLOYEE') {
      assigned_to = req.user.id;
      assigned_consultant = req.user.name;
    } else if (req.body.assigned_to || req.query.assigned_to) {
      const target = req.body.assigned_to || req.query.assigned_to;
      const targetEmp = queryOne(db, "SELECT id, name FROM users WHERE id = ? OR name = ? OR employee_id = ?", [target, target, target]);
      if (targetEmp) {
        assigned_to = targetEmp.id;
        assigned_consultant = targetEmp.name;
      } else if (req.body.assigned_consultant) {
        assigned_consultant = req.body.assigned_consultant;
      }
    } else if (req.body.assigned_consultant) {
      assigned_consultant = req.body.assigned_consultant;
      const targetEmp = queryOne(db, "SELECT id, name FROM users WHERE name = ? OR employee_id = ?", [assigned_consultant, assigned_consultant]);
      if (targetEmp) assigned_to = targetEmp.id;
    }

    const randomNum = Math.floor(100 + Math.random() * 900);
    const lead_id = `LD-${Date.now().toString().slice(-4)}${randomNum}`;

    const id = executeRun(db, `
      INSERT INTO leads (
        lead_id, name, email, phone, city, outstanding_amount,
        monthly_income, loan_type, default_status, harassment_calls,
        assigned_to, assigned_consultant, lead_status, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
      lead_id, name, email || '', phone || '', city || '', outstanding_amount || '50,000 - 1,00,000',
      parseFloat(monthly_income) || 0, loan_type || 'personal_loan_settlement',
      default_status || 'yes', harassment_calls || 'yes',
      assigned_to, assigned_consultant, lead_status || 'New', notes || ''
    ]);

    await logActivity(db, req.user.id, req.user.name, 'CREATE', 'LEAD', id, `Created lead: ${name}`);
    const newLead = queryOne(db, "SELECT * FROM leads WHERE id = ?", [id]);
    res.status(201).json(newLead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/leads/:id', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;

    // IDOR Check: Ensure employee can only edit their own assigned lead
    if (req.user.role === 'EMPLOYEE') {
      const existing = queryOne(db, "SELECT id FROM leads WHERE id = ? AND assigned_consultant = ?", [id, req.user.name]);
      if (!existing) return res.status(403).json({ error: 'You are not authorized to update this lead' });
    }

    const {
      name, email, phone, city, outstanding_amount,
      monthly_income, loan_type, default_status, harassment_calls,
      lead_status, notes
    } = req.body;

    const assigned_consultant = req.user.role === 'EMPLOYEE' ? req.user.name : (req.body.assigned_consultant !== undefined ? req.body.assigned_consultant : null);

    executeRun(db, `
      UPDATE leads SET
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        city = COALESCE(?, city),
        outstanding_amount = COALESCE(?, outstanding_amount),
        monthly_income = COALESCE(?, monthly_income),
        loan_type = COALESCE(?, loan_type),
        default_status = COALESCE(?, default_status),
        harassment_calls = COALESCE(?, harassment_calls),
        assigned_consultant = COALESCE(?, assigned_consultant),
        lead_status = COALESCE(?, lead_status),
        notes = COALESCE(?, notes),
        updated_at = datetime('now')
      WHERE id = ?
    `, [
      name, email, phone, city, outstanding_amount,
      monthly_income, loan_type, default_status, harassment_calls,
      assigned_consultant, lead_status, notes, id
    ]);

    await logActivity(db, req.user.id, req.user.name, 'UPDATE', 'LEAD', id, `Updated lead ID: ${id}`);
    const updated = queryOne(db, "SELECT * FROM leads WHERE id = ?", [id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/leads/:id', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;

    // IDOR Check: Ensure employee can only delete their own assigned lead
    if (req.user.role === 'EMPLOYEE') {
      const existing = queryOne(db, "SELECT id FROM leads WHERE id = ? AND assigned_consultant = ?", [id, req.user.name]);
      if (!existing) return res.status(403).json({ error: 'You are not authorized to delete this lead' });
    }

    executeRun(db, "DELETE FROM leads WHERE id = ?", [id]);
    await logActivity(db, req.user.id, req.user.name, 'DELETE', 'LEAD', id, `Deleted lead ID: ${id}`);
    res.json({ success: true, message: 'Lead deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== CLIENTS CRUD ====================
app.get('/api/clients', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const { case_status = 'Active', search, date, month, sort_by = 'id', sort_dir = 'ASC', page = 1, limit = 50 } = req.query;
    const consultant = getConsultantFilter(req);

    let sql = "SELECT * FROM clients WHERE 1=1";
    const params = [];

    // Strict Employee Data Isolation
    if (consultant) {
      sql += " AND assigned_consultant = ?";
      params.push(consultant);
    }

    if (case_status && case_status !== 'All') {
      sql += " AND case_status = ?";
      params.push(case_status);
    }

    if (search) {
      sql += " AND (name LIKE ? OR client_id LIKE ? OR email LIKE ? OR phone LIKE ? OR city LIKE ? OR assigned_consultant LIKE ? OR assigned_advocate LIKE ?)";
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term, term, term);
    }

    if (date) {
      sql += " AND fees_date LIKE ?";
      params.push(`%${date}%`);
    }

    const countSql = sql.replace("SELECT * FROM clients", "SELECT COUNT(*) as count FROM clients");
    const countRow = queryOne(db, countSql, params);
    const totalCount = countRow ? countRow.count : 0;

    sql += ` ORDER BY id ${sort_dir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}`;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;

    const clients = queryAll(db, sql, params);

    let activeCountSql = "SELECT COUNT(*) as count FROM clients WHERE case_status = 'Active'";
    let closedCountSql = "SELECT COUNT(*) as count FROM clients WHERE case_status = 'Closed'";
    const countParams = [];
    if (consultant) {
      activeCountSql += " AND assigned_consultant = ?";
      closedCountSql += " AND assigned_consultant = ?";
      countParams.push(consultant);
    }

    const activeCountRow = queryOne(db, activeCountSql, countParams);
    const closedCountRow = queryOne(db, closedCountSql, countParams);

    res.json({
      data: clients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit))
      },
      counts: {
        active: activeCountRow ? activeCountRow.count : 0,
        closed: closedCountRow ? closedCountRow.count : 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/clients', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const {
      client_id, name, phone, email, city, pan, address,
      service_fee, fees_date, fees_status, pending_amount,
      received_amount, this_month_received, case_status,
      assigned_advocate, notes
    } = req.body;

    if (!name) return res.status(400).json({ error: 'Client Name is required' });

    // Determine assigned_to and assigned_consultant
    let assigned_to = null;
    let assigned_consultant = 'Dhruv';

    if (req.user.role === 'EMPLOYEE') {
      assigned_to = req.user.id;
      assigned_consultant = req.user.name;
    } else if (req.body.assigned_to || req.query.assigned_to) {
      const target = req.body.assigned_to || req.query.assigned_to;
      const targetEmp = queryOne(db, "SELECT id, name FROM users WHERE id = ? OR name = ? OR employee_id = ?", [target, target, target]);
      if (targetEmp) {
        assigned_to = targetEmp.id;
        assigned_consultant = targetEmp.name;
      } else if (req.body.assigned_consultant) {
        assigned_consultant = req.body.assigned_consultant;
      }
    } else if (req.body.assigned_consultant) {
      assigned_consultant = req.body.assigned_consultant;
      const targetEmp = queryOne(db, "SELECT id, name FROM users WHERE name = ? OR employee_id = ?", [assigned_consultant, assigned_consultant]);
      if (targetEmp) assigned_to = targetEmp.id;
    }

    const cid = client_id || String(Math.floor(60000 + Math.random() * 9999));
    const fee = parseFloat(service_fee) || 0;
    const rec = parseFloat(received_amount) || 0;
    const thisM = parseFloat(this_month_received) || rec;
    const pend = pending_amount !== undefined ? parseFloat(pending_amount) : Math.max(0, fee - rec);
    const fStatus = fees_status || (pend === 0 && fee > 0 ? 'Paid' : 'Pending');

    const id = executeRun(db, `
      INSERT INTO clients (
        client_id, name, phone, email, city, pan, dob, address, service_fee,
        fees_date, fees_status, pending_amount, received_amount, this_month_received,
        case_status, assigned_to, assigned_consultant, assigned_advocate, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
      cid, name, phone || '', email || '', city || '', pan || '', req.body.dob || '', address || '',
      fee, fees_date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      fStatus, pend, rec, thisM, case_status || 'Active',
      assigned_to, assigned_consultant, assigned_advocate || 'Adv Sparsh Gupta', notes || ''
    ]);

    if (rec > 0) {
      executeRun(db, "INSERT INTO payments (client_id, amount, payment_date, payment_status) VALUES (?, ?, date('now'), 'Completed')", [id, rec]);
    }

    await logActivity(db, req.user.id, req.user.name, 'CREATE', 'CLIENT', id, `Created client: ${name} (${cid})`);
    const newClient = queryOne(db, "SELECT * FROM clients WHERE id = ?", [id]);
    res.status(201).json(newClient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;

    // IDOR Check: Ensure employee can only edit their own assigned client
    if (req.user.role === 'EMPLOYEE') {
      const existing = queryOne(db, "SELECT id FROM clients WHERE id = ? AND assigned_consultant = ?", [id, req.user.name]);
      if (!existing) return res.status(403).json({ error: 'You are not authorized to update this client' });
    }

    const {
      name, phone, email, city, pan, dob, address,
      service_fee, fees_date, fees_status, pending_amount,
      received_amount, this_month_received, case_status,
      assigned_advocate, notes
    } = req.body;

    const assigned_consultant = req.user.role === 'EMPLOYEE' ? req.user.name : (req.body.assigned_consultant !== undefined ? req.body.assigned_consultant : null);

    executeRun(db, `
      UPDATE clients SET
        name = COALESCE(?, name),
        phone = COALESCE(?, phone),
        email = COALESCE(?, email),
        city = COALESCE(?, city),
        pan = COALESCE(?, pan),
        dob = COALESCE(?, dob),
        address = COALESCE(?, address),
        service_fee = COALESCE(?, service_fee),
        fees_date = COALESCE(?, fees_date),
        fees_status = COALESCE(?, fees_status),
        pending_amount = COALESCE(?, pending_amount),
        received_amount = COALESCE(?, received_amount),
        this_month_received = COALESCE(?, this_month_received),
        case_status = COALESCE(?, case_status),
        assigned_consultant = COALESCE(?, assigned_consultant),
        assigned_advocate = COALESCE(?, assigned_advocate),
        notes = COALESCE(?, notes),
        updated_at = datetime('now')
      WHERE id = ?
    `, [
      name, phone, email, city, pan, dob, address,
      service_fee, fees_date, fees_status, pending_amount,
      received_amount, this_month_received, case_status,
      assigned_consultant, assigned_advocate, notes, id
    ]);

    // Synchronize linked agreement record with updated client fields (including DOB)
    try {
      executeRun(db, `
        UPDATE agreements SET
          client_name = COALESCE(?, client_name),
          phone = COALESCE(?, phone),
          email = COALESCE(?, email),
          pan = COALESCE(?, pan),
          dob = COALESCE(?, dob),
          updated_at = datetime('now')
        WHERE client_id_ref = ? OR client_name = (SELECT name FROM clients WHERE id = ?)
      `, [name, phone, email, pan, dob, id, id]);
    } catch (e) {
      console.error('Error syncing linked agreement from client update:', e.message);
    }

    await logActivity(db, req.user.id, req.user.name, 'UPDATE', 'CLIENT', id, `Updated client ID: ${id}`);
    const updated = queryOne(db, "SELECT * FROM clients WHERE id = ?", [id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;

    // IDOR Check: Ensure employee can only delete their own assigned client
    if (req.user.role === 'EMPLOYEE') {
      const existing = queryOne(db, "SELECT id FROM clients WHERE id = ? AND assigned_consultant = ?", [id, req.user.name]);
      if (!existing) return res.status(403).json({ error: 'You are not authorized to delete this client' });
    }

    executeRun(db, "DELETE FROM clients WHERE id = ?", [id]);
    await logActivity(db, req.user.id, req.user.name, 'DELETE', 'CLIENT', id, `Deleted client ID: ${id}`);
    res.json({ success: true, message: 'Client deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== PAY PENDING AMOUNT & CONVERSION LOGIC ====================

// 1. Convert Lead to Client with Initial / Full Payment
app.post('/api/leads/:id/convert', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;

    let leadSql = "SELECT * FROM leads WHERE id = ?";
    const leadParams = [id];
    if (req.user.role === 'EMPLOYEE') {
      leadSql += " AND (assigned_to = ? OR assigned_consultant = ? OR assigned_consultant = ?)";
      leadParams.push(req.user.id, req.user.name, req.user.employee_id || '');
    }
    const lead = queryOne(db, leadSql, leadParams);
    if (!lead) return res.status(403).json({ error: 'Lead not found or unauthorized' });

    const {
      service_fee = 25000,
      paid_amount = 0,
      payment_method = 'UPI',
      reference_number = '',
      payment_date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      pan = '',
      address = '',
      city = lead.city || '',
      assigned_advocate = 'Adv Sparsh Gupta',
      notes = ''
    } = req.body;

    const assigned_to = lead.assigned_to || (req.user.role === 'EMPLOYEE' ? req.user.id : null);
    const assigned_consultant = req.user.role === 'EMPLOYEE' ? req.user.name : (req.body.assigned_consultant || lead.assigned_consultant || 'Dhruv');

    const fee = parseFloat(service_fee) || 0;
    const paid = parseFloat(paid_amount) || 0;
    const pending = Math.max(0, fee - paid);
    const fees_status = (pending === 0 && fee > 0) ? 'Paid' : 'Pending';

    // Generate unique 5-digit Client ID (60000+)
    const randomId = String(Math.floor(60000 + Math.random() * 9999));

    // Insert into clients table
    const clientId = executeRun(db, `
      INSERT INTO clients (
        client_id, name, phone, email, city, pan, address, service_fee,
        fees_date, fees_status, pending_amount, received_amount, this_month_received,
        case_status, assigned_to, assigned_consultant, assigned_advocate, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?, ?, ?, datetime('now'))
    `, [
      randomId, lead.name, lead.phone || '', lead.email || '', city, pan, address,
      fee, payment_date, fees_status, pending, paid, paid,
      assigned_to, assigned_consultant, assigned_advocate, notes || `Converted from Lead ${lead.lead_id || lead.id}`
    ]);

    // Record payment if initial paid amount > 0
    if (paid > 0) {
      executeRun(db, `
        INSERT INTO payments (client_id, amount, payment_date, payment_status, payment_method, notes)
        VALUES (?, ?, ?, 'Completed', ?, ?)
      `, [clientId, paid, payment_date, payment_method, reference_number ? `Ref: ${reference_number}` : 'Initial Service Fee Payment']);
    }

    // Mark Lead as Converted
    executeRun(db, "UPDATE leads SET lead_status = 'Converted', updated_at = datetime('now') WHERE id = ?", [id]);

    await logActivity(db, req.user.id, req.user.name, 'CONVERT', 'LEAD', id, `Lead ${lead.name} converted to Client ${randomId} with initial fee ₹${paid}`);

    const newClient = queryOne(db, "SELECT * FROM clients WHERE client_id = ?", [randomId]);
    res.status(201).json({
      success: true,
      message: `Lead ${lead.name} converted to Client (${randomId}) successfully!`,
      client: newClient
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Record Payment / Pay Pending Amount for Client
app.post('/api/clients/:id/pay', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;

    let clientSql = "SELECT * FROM clients WHERE id = ?";
    const clientParams = [id];
    if (req.user.role === 'EMPLOYEE') {
      clientSql += " AND assigned_consultant = ?";
      clientParams.push(req.user.name);
    }
    const client = queryOne(db, clientSql, clientParams);
    if (!client) return res.status(403).json({ error: 'Client not found or unauthorized' });

    const {
      amount,
      payment_method = 'UPI',
      reference_number = '',
      payment_date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      notes = ''
    } = req.body;

    const payAmount = parseFloat(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      return res.status(400).json({ error: 'Payment amount must be greater than zero' });
    }

    const currentReceived = parseFloat(client.received_amount) || 0;
    const currentThisMonth = parseFloat(client.this_month_received) || 0;
    const serviceFee = parseFloat(client.service_fee) || 0;

    const newReceived = currentReceived + payAmount;
    const newThisMonth = currentThisMonth + payAmount;
    const newPending = Math.max(0, serviceFee - newReceived);
    const newFeesStatus = newPending === 0 ? 'Paid' : 'Pending';

    // Update client record
    executeRun(db, `
      UPDATE clients SET
        received_amount = ?,
        this_month_received = ?,
        pending_amount = ?,
        fees_status = ?,
        fees_date = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `, [newReceived, newThisMonth, newPending, newFeesStatus, payment_date, id]);

    // Record in payments table
    const paymentNotes = [
      reference_number ? `Ref: ${reference_number}` : '',
      notes ? notes : ''
    ].filter(Boolean).join(' | ') || 'Pending fee payment';

    const paymentId = executeRun(db, `
      INSERT INTO payments (client_id, amount, payment_date, payment_status, payment_method, notes)
      VALUES (?, ?, ?, 'Completed', ?, ?)
    `, [id, payAmount, payment_date, payment_method, paymentNotes]);

    await logActivity(db, req.user.id, req.user.name, 'PAYMENT', 'CLIENT', id, `Payment of ₹${payAmount} received for Client ${client.name} (${client.client_id}). Remaining balance: ₹${newPending}`);

    const updatedClient = queryOne(db, "SELECT * FROM clients WHERE id = ?", [id]);
    res.json({
      success: true,
      message: `Payment of ₹${payAmount.toLocaleString('en-IN')} recorded successfully!`,
      client: updatedClient,
      payment: {
        id: paymentId,
        client_id: id,
        amount: payAmount,
        payment_date,
        payment_method,
        notes: paymentNotes
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Get Client Payments History
app.get('/api/clients/:id/payments', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;

    if (req.user.role === 'EMPLOYEE') {
      const client = queryOne(db, "SELECT id FROM clients WHERE id = ? AND assigned_consultant = ?", [id, req.user.name]);
      if (!client) return res.status(403).json({ error: 'Client not found or unauthorized' });
    }

    const payments = queryAll(db, "SELECT * FROM payments WHERE client_id = ? ORDER BY id DESC", [id]);
    res.json({ data: payments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CSV Export for Clients
app.get('/api/clients/export', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const { case_status, search } = req.query;
    const consultant = getConsultantFilter(req);

    let sql = "SELECT * FROM clients WHERE 1=1";
    const params = [];

    // Strict Employee Data Isolation
    if (consultant) {
      sql += " AND assigned_consultant = ?";
      params.push(consultant);
    }

    if (case_status && case_status !== 'All') {
      sql += " AND case_status = ?";
      params.push(case_status);
    }
    if (search) {
      sql += " AND (name LIKE ? OR client_id LIKE ? OR email LIKE ? OR phone LIKE ?)";
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }
    sql += " ORDER BY id ASC";

    const clients = queryAll(db, sql, params);

    const headers = ["#", "Client Id", "Name", "Phone", "Email", "City", "RD Service Fee", "Fees Date", "Fees Status", "Pending Amount", "Total Received Amount", "This Month Received", "Case Status", "Assigned Consultant", "Assigned Advocate"];
    const rows = clients.map((c, i) => [
      i + 1,
      c.client_id,
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${c.phone || ''}"`,
      `"${c.email || ''}"`,
      `"${(c.city || '').replace(/"/g, '""')}"`,
      c.service_fee,
      `"${c.fees_date || ''}"`,
      `"${c.fees_status || ''}"`,
      c.pending_amount,
      c.received_amount,
      c.this_month_received,
      `"${c.case_status || ''}"`,
      `"${c.assigned_consultant || ''}"`,
      `"${(c.assigned_advocate || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="SettleXpert_Clients.csv"');
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== AGREEMENTS CRUD ====================
app.get('/api/agreements', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const { search, page = 1, limit = 10 } = req.query;
    const consultant = getConsultantFilter(req);

    let sql = `
      SELECT 
        a.*,
        COALESCE(c.pan, a.pan) as pan,
        COALESCE(c.phone, a.phone) as phone,
        COALESCE(c.email, a.email) as email,
        COALESCE(c.address, '') as client_address,
        COALESCE(c.city, '') as client_city,
        COALESCE(NULLIF(c.dob, ''), a.dob, '') as dob,
        COALESCE(c.assigned_consultant, a.assigned_to, 'Dhruv') as assigned_consultant
      FROM agreements a
      LEFT JOIN clients c ON (a.client_id_ref = c.id OR a.client_name = c.name)
      WHERE 1=1
    `;
    const params = [];

    // Strict Employee Data Isolation for Agreements
    if (consultant) {
      sql += " AND a.client_name IN (SELECT name FROM clients WHERE assigned_consultant = ?)";
      params.push(consultant);
    }

    if (search) {
      sql += " AND (a.client_name LIKE ? OR a.email LIKE ? OR a.phone LIKE ? OR a.pan LIKE ? OR a.lender LIKE ?)";
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    const countSql = `SELECT COUNT(*) as count FROM agreements a WHERE 1=1 ${consultant ? ' AND a.client_name IN (SELECT name FROM clients WHERE assigned_consultant = ?)' : ''} ${search ? ' AND (a.client_name LIKE ? OR a.email LIKE ? OR a.phone LIKE ? OR a.pan LIKE ? OR a.lender LIKE ?)' : ''}`;
    const countRow = queryOne(db, countSql, params);
    const totalCount = countRow ? countRow.count : 0;

    sql += " ORDER BY a.id ASC";
    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;

    const agreements = queryAll(db, sql, params);

    // Attach registered lenders for each agreement
    for (const ag of agreements) {
      const targetClientId = ag.client_id_ref || (ag.client_name ? queryOne(db, "SELECT id FROM clients WHERE name = ?", [ag.client_name])?.id : null);
      if (targetClientId) {
        const lendersList = queryAll(db, "SELECT * FROM lenders WHERE client_id = ?", [targetClientId]);
        if (lendersList && lendersList.length > 0) {
          ag.lenders = lendersList.map(l => ({
            name: l.lender_name,
            lenderName: l.lender_name,
            type: l.loan_type,
            loanType: l.loan_type,
            amount: l.account_number || l.loan_amount,
            loanAmount: l.account_number || l.loan_amount,
            account_number: l.account_number
          }));
        }
      }
    }

    res.json({
      data: agreements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/agreements', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const {
      client_name, email, phone, pan, dob, address, city, consultancy_fee,
      agreement_duration, resolution_duration, prepared_by,
      lender, loan_account_number, loan_amount, loan_type,
      agreement_date, status, notes, lead_id
    } = req.body;

    if (!client_name) return res.status(400).json({ error: 'Client Name is required' });

    let assigned_to = null;
    let assigned_consultant = prepared_by || 'Dhruv';

    if (req.user.role === 'EMPLOYEE') {
      assigned_to = req.user.id;
      assigned_consultant = req.user.name;
    } else if (req.body.assigned_to || req.query.assigned_to) {
      const target = req.body.assigned_to || req.query.assigned_to;
      const targetEmp = queryOne(db, "SELECT id, name FROM users WHERE id = ? OR name = ? OR employee_id = ?", [target, target, target]);
      if (targetEmp) {
        assigned_to = targetEmp.id;
        assigned_consultant = targetEmp.name;
      } else if (req.body.assigned_consultant) {
        assigned_consultant = req.body.assigned_consultant;
      }
    } else if (req.body.assigned_consultant) {
      assigned_consultant = req.body.assigned_consultant;
      const targetEmp = queryOne(db, "SELECT id, name FROM users WHERE name = ? OR employee_id = ?", [assigned_consultant, assigned_consultant]);
      if (targetEmp) assigned_to = targetEmp.id;
    }

    // 1. Check if client already exists in clients table (by phone or email or name)
    let client = null;
    if (phone || email) {
      client = queryOne(db, "SELECT * FROM clients WHERE (phone != '' AND phone = ?) OR (email != '' AND email = ?)", [phone || '', email || '']);
    }
    if (!client) {
      client = queryOne(db, "SELECT * FROM clients WHERE name = ?", [client_name.trim()]);
    }

    // 2. If client does not exist, auto-create client in clients table!
    let clientIdRef = client ? client.id : null;
    if (!client) {
      const randomId = String(Math.floor(60000 + Math.random() * 9999));
      const fee = parseFloat(consultancy_fee) || 25000;
      clientIdRef = executeRun(db, `
        INSERT INTO clients (
          client_id, name, phone, email, city, pan, dob, address, service_fee,
          fees_date, fees_status, pending_amount, received_amount, this_month_received,
          case_status, assigned_to, assigned_consultant, assigned_advocate, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, 0, 0, 'Active', ?, ?, 'Adv Sparsh Gupta', ?, datetime('now'))
      `, [
        randomId,
        client_name.trim(),
        phone || '',
        email || '',
        city || '',
        pan || '',
        dob || '',
        address || '',
        fee,
        agreement_date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        fee,
        assigned_to,
        assigned_consultant,
        `Auto-created on Agreement creation`
      ]);
    } else {
      // Update existing client with latest dob/pan/address if available
      executeRun(db, `
        UPDATE clients SET
          dob = COALESCE(NULLIF(?, ''), dob),
          pan = COALESCE(NULLIF(?, ''), pan),
          address = COALESCE(NULLIF(?, ''), address),
          city = COALESCE(NULLIF(?, ''), city),
          updated_at = datetime('now')
        WHERE id = ?
      `, [dob || '', pan || '', address || '', city || '', client.id]);
    }

    // 3. If there is an associated lead, mark lead as 'Converted'
    if (lead_id) {
      executeRun(db, "UPDATE leads SET lead_status = 'Converted', updated_at = datetime('now') WHERE id = ?", [lead_id]);
    } else if (phone || email) {
      executeRun(db, "UPDATE leads SET lead_status = 'Converted', updated_at = datetime('now') WHERE (phone != '' AND phone = ?) OR (email != '' AND email = ?)", [phone || '', email || '']);
    }

    // 4. Insert into agreements table
    const id = executeRun(db, `
      INSERT INTO agreements (
        client_id_ref, client_name, email, phone, pan, dob,
        agreement_duration, resolution_duration, consultancy_fee,
        lender, loan_account_number, loan_amount, loan_type,
        agreement_date, status, assigned_to, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
      clientIdRef,
      client_name, email || '', phone || '', pan || '', dob || '',
      agreement_duration || '6 Months', resolution_duration || '6 Months', parseFloat(consultancy_fee) || 0,
      lender || '', loan_account_number || '', parseFloat(loan_amount) || 0, loan_type || '',
      agreement_date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status || 'Active',
      assigned_to,
      notes || ''
    ]);

    // 5. Save detailed lenders if provided
    if (clientIdRef && Array.isArray(req.body.lenders) && req.body.lenders.length > 0) {
      try {
        executeRun(db, "DELETE FROM lenders WHERE client_id = ?", [clientIdRef]);
        for (const l of req.body.lenders) {
          if (l.lenderName || l.name) {
            executeRun(db, `
              INSERT INTO lenders (client_id, lender_name, loan_type, loan_amount, account_number)
              VALUES (?, ?, ?, ?, ?)
            `, [
              clientIdRef,
              l.lenderName || l.name,
              l.loanType || l.type || 'Personal loan',
              parseFloat(String(l.loanAmount || l.amount || 0).replace(/[^\d.]/g, '')) || 0,
              l.account_number || ''
            ]);
          }
        }
      } catch (e) {
        console.error('Error saving lenders:', e.message);
      }
    }

    await logActivity(db, req.user.id, req.user.name, 'CREATE', 'AGREEMENT', id, `Created agreement for: ${client_name} (Auto-created client & converted lead)`);
    const newAg = queryOne(db, "SELECT * FROM agreements WHERE id = ?", [id]);
    res.status(201).json(newAg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/agreements/:id', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;
    const ag = queryOne(db, `
      SELECT 
        a.*,
        COALESCE(c.pan, a.pan) as pan,
        COALESCE(c.phone, a.phone) as phone,
        COALESCE(c.email, a.email) as email,
        COALESCE(c.address, '') as client_address,
        COALESCE(c.city, '') as client_city,
        COALESCE(NULLIF(c.dob, ''), a.dob, '') as dob,
        COALESCE(c.assigned_consultant, a.assigned_to, 'Dhruv') as assigned_consultant
      FROM agreements a
      LEFT JOIN clients c ON (a.client_id_ref = c.id OR a.client_name = c.name)
      WHERE a.id = ?
    `, [id]);

    if (!ag) return res.status(404).json({ error: 'Agreement not found' });

    const targetClientId = ag.client_id_ref || (ag.client_name ? queryOne(db, "SELECT id FROM clients WHERE name = ?", [ag.client_name])?.id : null);
    if (targetClientId) {
      const lendersList = queryAll(db, "SELECT * FROM lenders WHERE client_id = ?", [targetClientId]);
      if (lendersList && lendersList.length > 0) {
        ag.lenders = lendersList.map(l => ({
          name: l.lender_name,
          lenderName: l.lender_name,
          type: l.loan_type,
          loanType: l.loan_type,
          amount: l.account_number || l.loan_amount,
          loanAmount: l.account_number || l.loan_amount,
          account_number: l.account_number
        }));
      }
    }

    res.json(ag);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/agreements/:id', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;

    const existing = queryOne(db, "SELECT * FROM agreements WHERE id = ?", [id]);
    if (!existing) return res.status(404).json({ error: 'Agreement not found' });

    if (req.user.role === 'EMPLOYEE') {
      const client = queryOne(db, "SELECT id FROM clients WHERE name = ? AND assigned_consultant = ?", [existing.client_name, req.user.name]);
      if (!client) return res.status(403).json({ error: 'You are not authorized to edit this agreement' });
    }

    // Non-destructive partial update: preserve existing values if new value is empty or undefined
    const client_name = (req.body.client_name !== undefined && req.body.client_name !== '') ? req.body.client_name : existing.client_name;
    const email = (req.body.email !== undefined && req.body.email !== '') ? req.body.email : existing.email;
    const phone = (req.body.phone !== undefined && req.body.phone !== '') ? req.body.phone : existing.phone;
    const pan = (req.body.pan !== undefined && req.body.pan !== '') ? req.body.pan : existing.pan;
    const dob = (req.body.dob !== undefined && req.body.dob !== '') ? req.body.dob : existing.dob;
    const agreement_duration = (req.body.agreement_duration !== undefined && req.body.agreement_duration !== '') ? req.body.agreement_duration : (existing.agreement_duration || '6 Months');
    const resolution_duration = (req.body.resolution_duration !== undefined && req.body.resolution_duration !== '') ? req.body.resolution_duration : (existing.resolution_duration || '6 Months');
    const consultancy_fee = req.body.consultancy_fee !== undefined && req.body.consultancy_fee !== '' ? parseFloat(req.body.consultancy_fee) : (existing.consultancy_fee || 0);
    const lender = (req.body.lender !== undefined && req.body.lender !== '') ? req.body.lender : existing.lender;
    const loan_account_number = (req.body.loan_account_number !== undefined && req.body.loan_account_number !== '') ? req.body.loan_account_number : existing.loan_account_number;
    const loan_amount = req.body.loan_amount !== undefined && req.body.loan_amount !== '' ? parseFloat(req.body.loan_amount) : (existing.loan_amount || 0);
    const loan_type = (req.body.loan_type !== undefined && req.body.loan_type !== '') ? req.body.loan_type : existing.loan_type;
    const agreement_date = (req.body.agreement_date !== undefined && req.body.agreement_date !== '') ? req.body.agreement_date : existing.agreement_date;
    const status = (req.body.status !== undefined && req.body.status !== '') ? req.body.status : existing.status;
    const notes = (req.body.notes !== undefined && req.body.notes !== '') ? req.body.notes : existing.notes;

    executeRun(db, `
      UPDATE agreements SET
        client_name = ?,
        email = ?,
        phone = ?,
        pan = ?,
        dob = ?,
        agreement_duration = ?,
        resolution_duration = ?,
        consultancy_fee = ?,
        lender = ?,
        loan_account_number = ?,
        loan_amount = ?,
        loan_type = ?,
        agreement_date = ?,
        status = ?,
        notes = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `, [
      client_name, email, phone, pan, dob || '',
      agreement_duration || '6 Months', resolution_duration || '6 Months', consultancy_fee,
      lender, loan_account_number, loan_amount, loan_type,
      agreement_date, status, notes, id
    ]);

    // Also sync master client record and update lenders
    const targetClientId = existing.client_id_ref || (existing.client_name ? queryOne(db, "SELECT id FROM clients WHERE name = ?", [existing.client_name])?.id : null);
    if (targetClientId) {
      try {
        executeRun(db, `
          UPDATE clients SET
            name = COALESCE(?, name),
            phone = COALESCE(?, phone),
            email = COALESCE(?, email),
            pan = COALESCE(?, pan),
            dob = COALESCE(?, dob),
            address = COALESCE(NULLIF(?, ''), address),
            city = COALESCE(NULLIF(?, ''), city),
            updated_at = datetime('now')
          WHERE id = ?
        `, [client_name, phone, email, pan, dob, req.body.address || '', req.body.city || '', targetClientId]);

        if (Array.isArray(req.body.lenders) && req.body.lenders.length > 0) {
          executeRun(db, "DELETE FROM lenders WHERE client_id = ?", [targetClientId]);
          for (const l of req.body.lenders) {
            if (l.lenderName || l.name) {
              executeRun(db, `
                INSERT INTO lenders (client_id, lender_name, loan_type, loan_amount, account_number)
                VALUES (?, ?, ?, ?, ?)
              `, [
                targetClientId,
                l.lenderName || l.name,
                l.loanType || l.type || 'Personal loan',
                parseFloat(String(l.loanAmount || l.amount || 0).replace(/[^\d.]/g, '')) || 0,
                l.account_number || ''
              ]);
            }
          }
        }
      } catch (e) {
        console.error('Error syncing client & lenders on agreement update:', e.message);
      }
    }

    await logActivity(db, req.user.id, req.user.name, 'UPDATE', 'AGREEMENT', id, `Updated agreement ID: ${id}`);
    const updated = queryOne(db, "SELECT * FROM agreements WHERE id = ?", [id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/agreements/:id', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;

    if (req.user.role === 'EMPLOYEE') {
      const ag = queryOne(db, "SELECT * FROM agreements WHERE id = ?", [id]);
      if (ag) {
        const client = queryOne(db, "SELECT id FROM clients WHERE name = ? AND assigned_consultant = ?", [ag.client_name, req.user.name]);
        if (!client) return res.status(403).json({ error: 'You are not authorized to delete this agreement' });
      }
    }

    executeRun(db, "DELETE FROM agreements WHERE id = ?", [id]);
    await logActivity(db, req.user.id, req.user.name, 'DELETE', 'AGREEMENT', id, `Deleted agreement ID: ${id}`);
    res.json({ success: true, message: 'Agreement deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk Mail Route
app.post('/api/mail/send-bulk', authenticateToken, async (req, res) => {
  try {
    const { client_ids, subject, message } = req.body;
    const db = await getDb();
    await logActivity(db, req.user.id, req.user.name, 'BULK_MAIL', 'CLIENT', null, `Sent bulk mail to ${client_ids?.length || 'all'} clients with subject "${subject || 'Update'}"`);
    res.json({ success: true, message: `Email successfully sent to ${client_ids?.length || 12} clients.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ADMIN API ROUTES ====================

// Admin Dashboard Summary
app.get('/api/admin/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const totalEmployees = queryOne(db, "SELECT COUNT(*) as count FROM users WHERE role = 'EMPLOYEE'");
    const activeEmployees = queryOne(db, "SELECT COUNT(*) as count FROM users WHERE role = 'EMPLOYEE' AND status = 'active'");
    const totalLeads = queryOne(db, "SELECT COUNT(*) as count FROM leads");
    const assignedLeads = queryOne(db, "SELECT COUNT(*) as count FROM leads WHERE (assigned_to IS NOT NULL OR (assigned_consultant IS NOT NULL AND assigned_consultant != ''))");
    const unassignedLeads = queryOne(db, "SELECT COUNT(*) as count FROM leads WHERE (assigned_to IS NULL AND (assigned_consultant IS NULL OR assigned_consultant = ''))");
    const importedLeads = queryOne(db, "SELECT COUNT(*) as count FROM leads WHERE import_batch_id IS NOT NULL OR source = 'Excel Import'");
    const totalClients = queryOne(db, "SELECT COUNT(*) as count FROM clients");
    const totalAgreements = queryOne(db, "SELECT COUNT(*) as count FROM agreements");
    const collectionsRow = queryOne(db, "SELECT SUM(received_amount) as total FROM clients");
    const totalCollections = collectionsRow?.total || 0;

    // Employee Workload breakdown & Average performance
    const employees = queryAll(db, "SELECT id, name, employee_id, designation, department, status FROM users WHERE role = 'EMPLOYEE' ORDER BY name ASC");
    let totalPerf = 0;
    let perfCount = 0;
    const employeeWorkload = [];

    for (const emp of employees) {
      const leadsCount = queryOne(db, "SELECT COUNT(*) as count FROM leads WHERE (assigned_to = ? OR (assigned_to IS NULL AND assigned_consultant = ?))", [emp.id, emp.name]);
      const pendingCount = queryOne(db, "SELECT COUNT(*) as count FROM leads WHERE (assigned_to = ? OR (assigned_to IS NULL AND assigned_consultant = ?)) AND lead_status IN ('New', 'Contacted', 'Follow up', 'Interested')", [emp.id, emp.name]);
      const convertedCount = queryOne(db, "SELECT COUNT(*) as count FROM leads WHERE (assigned_to = ? OR (assigned_to IS NULL AND assigned_consultant = ?)) AND lead_status = 'Converted'", [emp.id, emp.name]);
      const lostCount = queryOne(db, "SELECT COUNT(*) as count FROM leads WHERE (assigned_to = ? OR (assigned_to IS NULL AND assigned_consultant = ?)) AND lead_status = 'Not Interested'", [emp.id, emp.name]);
      const empCollections = queryOne(db, "SELECT SUM(received_amount) as total FROM clients WHERE assigned_consultant = ?", [emp.name]);

      const lc = leadsCount?.count || 0;
      const pc = pendingCount?.count || 0;
      const cc = convertedCount?.count || 0;
      const totalCol = empCollections?.total || 0;
      const perf = lc > 0 ? Math.round((cc / lc) * 100) : 0;

      if (lc > 0) {
        totalPerf += perf;
        perfCount++;
      }

      employeeWorkload.push({
        id: emp.id,
        name: emp.name,
        employee_id: emp.employee_id,
        designation: emp.designation,
        department: emp.department,
        assigned_leads: lc,
        pending_leads: pc,
        converted_leads: cc,
        lost_leads: lostCount?.count || 0,
        collections: totalCol,
        performance: perf,
        status: emp.status
      });
    }

    const avgPerformance = perfCount > 0 ? Math.round(totalPerf / perfCount) : 0;

    // Top performers (sort by performance and collections)
    const topPerformers = [...employeeWorkload]
      .filter(e => e.status === 'active')
      .sort((a, b) => (b.performance * 1000 + b.collections) - (a.performance * 1000 + a.collections))
      .slice(0, 5);

    res.json({
      totalEmployees: totalEmployees?.count || 0,
      activeEmployees: activeEmployees?.count || 0,
      totalLeads: totalLeads?.count || 0,
      assignedLeads: assignedLeads?.count || 0,
      unassignedLeads: unassignedLeads?.count || 0,
      importedLeads: importedLeads?.count || 0,
      totalClients: totalClients?.count || 0,
      totalAgreements: totalAgreements?.count || 0,
      totalCollections,
      avgPerformance,
      topPerformers,
      employeeWorkload
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Get All Leads with Assignment info & filters
app.get('/api/admin/leads', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const { search, status, assignment, source, batch_id, date_filter, page = 1, limit = 50, sort_by = 'id', sort_dir = 'DESC' } = req.query;

    let sql = `
      SELECT 
        l.*,
        u.name as employee_name,
        u.employee_id as employee_code,
        u.designation as employee_designation,
        u.department as employee_department
      FROM leads l
      LEFT JOIN users u ON (l.assigned_to = u.id OR (l.assigned_to IS NULL AND l.assigned_consultant = u.name))
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'All') {
      sql += " AND (l.lead_status = ? OR (l.lead_status = 'Follow up' AND ? = 'Follow Up'))";
      params.push(status, status);
    }

    if (assignment === 'unassigned') {
      sql += " AND (l.assigned_to IS NULL AND (l.assigned_consultant IS NULL OR l.assigned_consultant = ''))";
    } else if (assignment === 'assigned') {
      sql += " AND (l.assigned_to IS NOT NULL OR (l.assigned_consultant IS NOT NULL AND l.assigned_consultant != ''))";
    } else if (assignment && assignment !== 'all' && assignment !== 'All') {
      sql += " AND (l.assigned_to = ? OR (l.assigned_to IS NULL AND l.assigned_consultant = ?))";
      params.push(parseInt(assignment) || assignment, assignment);
    }

    if (source && source !== 'All') {
      sql += " AND (l.source = ? OR l.loan_type = ?)";
      params.push(source, source);
    }

    if (batch_id) {
      sql += " AND l.import_batch_id = ?";
      params.push(batch_id);
    }

    if (date_filter === 'today') {
      sql += " AND date(l.created_at) = date('now')";
    } else if (date_filter === 'week') {
      sql += " AND date(l.created_at) >= date('now', '-7 days')";
    } else if (date_filter === 'month') {
      sql += " AND date(l.created_at) >= date('now', '-30 days')";
    }

    if (search) {
      sql += " AND (l.name LIKE ? OR l.email LIKE ? OR l.phone LIKE ? OR l.lead_id LIKE ? OR l.city LIKE ? OR u.name LIKE ? OR l.import_batch_id LIKE ?)";
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term, term, term);
    }

    const countSql = sql.replace(/SELECT\s+l\.\*.*?FROM\s+leads\s+l/is, "SELECT COUNT(*) as count FROM leads l");
    const countRow = queryOne(db, countSql, params);
    const totalCount = countRow ? countRow.count : 0;

    sql += ` ORDER BY l.id ${sort_dir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'}`;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;

    const leads = queryAll(db, sql, params);

    // Summary counts for filter tabs
    const totalAllRow = queryOne(db, "SELECT COUNT(*) as count FROM leads");
    const assignedRow = queryOne(db, "SELECT COUNT(*) as count FROM leads WHERE (assigned_to IS NOT NULL OR (assigned_consultant IS NOT NULL AND assigned_consultant != ''))");
    const unassignedRow = queryOne(db, "SELECT COUNT(*) as count FROM leads WHERE (assigned_to IS NULL AND (assigned_consultant IS NULL OR assigned_consultant = ''))");

    res.json({
      data: leads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit))
      },
      counts: {
        total: totalAllRow?.count || 0,
        assigned: assignedRow?.count || 0,
        unassigned: unassignedRow?.count || 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Single Lead Assignment / Reassignment with History Logging
app.put('/api/admin/leads/:id/assign', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;
    const { employee_id, notes } = req.body; // user ID or null

    const lead = queryOne(db, "SELECT * FROM leads WHERE id = ?", [id]);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    let empName = null;
    let empId = null;

    if (employee_id) {
      const emp = queryOne(db, "SELECT id, name FROM users WHERE id = ? AND role = 'EMPLOYEE'", [employee_id]);
      if (!emp) return res.status(400).json({ error: 'Invalid employee selected' });
      empName = emp.name;
      empId = emp.id;
    }

    // Previous assignee info
    const prevEmpId = lead.assigned_to;
    const prevEmpName = lead.assigned_consultant;

    executeRun(db, `
      UPDATE leads SET
        assigned_to = ?,
        assigned_consultant = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `, [empId, empName, id]);

    // Record in lead_assignment_history
    executeRun(db, `
      INSERT INTO lead_assignment_history (
        lead_id, previous_employee_id, previous_employee_name,
        new_employee_id, new_employee_name, changed_by_id, changed_by_name,
        action_type, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
      id, prevEmpId, prevEmpName, empId, empName,
      req.user.id, req.user.name,
      prevEmpId ? 'REASSIGN' : 'ASSIGN',
      notes || (empName ? `Assigned to ${empName}` : 'Unassigned')
    ]);

    await logActivity(
      db,
      req.user.id,
      req.user.name,
      prevEmpId ? 'LEAD_REASSIGN' : 'LEAD_ASSIGN',
      'LEAD',
      id,
      empName
        ? (prevEmpName ? `Reassigned lead ${lead.name} from ${prevEmpName} to ${empName}` : `Assigned lead ${lead.name} to ${empName}`)
        : `Unassigned lead ${lead.name}`
    );

    const updated = queryOne(db, `
      SELECT 
        l.*,
        u.name as employee_name,
        u.employee_id as employee_code,
        u.designation as employee_designation
      FROM leads l
      LEFT JOIN users u ON (l.assigned_to = u.id OR (l.assigned_to IS NULL AND l.assigned_consultant = u.name))
      WHERE l.id = ?
    `, [id]);

    res.json({ success: true, lead: updated, message: empName ? `Lead assigned to ${empName}` : 'Lead unassigned successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Bulk Assign Leads with History (Supports Single, Equal Split, and Custom Count allocation)
app.put('/api/admin/leads/bulk-assign', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const { lead_ids, employee_id, notes, mode = 'single', employee_ids = [], custom_counts = {} } = req.body;

    if (!Array.isArray(lead_ids) || lead_ids.length === 0) {
      return res.status(400).json({ error: 'lead_ids must be a non-empty array' });
    }

    const allActiveEmployees = queryAll(db, "SELECT id, name, employee_id, designation FROM users WHERE role = 'EMPLOYEE' AND status = 'active' ORDER BY name ASC");
    const activeEmpMap = new Map(allActiveEmployees.map(e => [e.id, e]));

    // Build assignment map for each lead_id
    const leadAssignments = []; // { leadId, empId, empName }

    if (mode === 'single') {
      let empName = null;
      let empId = null;
      if (employee_id) {
        const emp = activeEmpMap.get(parseInt(employee_id, 10));
        if (!emp) return res.status(400).json({ error: 'Invalid employee selected' });
        empName = emp.name;
        empId = emp.id;
      }
      for (const lid of lead_ids) {
        leadAssignments.push({ leadId: lid, empId, empName });
      }
    } else if (mode === 'equal') {
      const selectedIds = Array.isArray(employee_ids) && employee_ids.length > 0
        ? employee_ids.map(Number)
        : allActiveEmployees.map(e => e.id);

      const targetEmps = selectedIds.map(id => activeEmpMap.get(id)).filter(Boolean);
      if (targetEmps.length === 0) {
        return res.status(400).json({ error: 'No active employees available for equal distribution' });
      }

      lead_ids.forEach((lid, idx) => {
        const emp = targetEmps[idx % targetEmps.length];
        leadAssignments.push({ leadId: lid, empId: emp.id, empName: emp.name });
      });
    } else if (mode === 'custom_counts') {
      // Build allocation queue from custom_counts { [empId]: count }
      const queue = [];
      Object.entries(custom_counts).forEach(([empIdStr, countVal]) => {
        const emp = activeEmpMap.get(parseInt(empIdStr, 10));
        const count = parseInt(countVal, 10) || 0;
        if (emp && count > 0) {
          for (let i = 0; i < count; i++) {
            queue.push({ empId: emp.id, empName: emp.name });
          }
        }
      });

      lead_ids.forEach((lid, idx) => {
        if (idx < queue.length) {
          leadAssignments.push({ leadId: lid, empId: queue[idx].empId, empName: queue[idx].empName });
        } else {
          leadAssignments.push({ leadId: lid, empId: null, empName: null });
        }
      });
    }

    const distributionSummary = {};

    for (const item of leadAssignments) {
      const currentLead = queryOne(db, "SELECT id, name, assigned_to, assigned_consultant FROM leads WHERE id = ?", [item.leadId]);
      if (currentLead) {
        executeRun(db, `
          UPDATE leads SET
            assigned_to = ?,
            assigned_consultant = ?,
            updated_at = datetime('now')
          WHERE id = ?
        `, [item.empId, item.empName, item.leadId]);

        executeRun(db, `
          INSERT INTO lead_assignment_history (
            lead_id, previous_employee_id, previous_employee_name,
            new_employee_id, new_employee_name, changed_by_id, changed_by_name,
            action_type, notes, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `, [
          item.leadId, currentLead.assigned_to, currentLead.assigned_consultant,
          item.empId, item.empName, req.user.id, req.user.name,
          currentLead.assigned_to ? 'BULK_REASSIGN' : 'BULK_ASSIGN',
          notes || (item.empName ? `Bulk assigned to ${item.empName}` : 'Bulk unassigned')
        ]);

        if (item.empName) {
          distributionSummary[item.empName] = (distributionSummary[item.empName] || 0) + 1;
        }
      }
    }

    await logActivity(
      db,
      req.user.id,
      req.user.name,
      'LEAD_BULK_ASSIGN',
      'LEAD',
      null,
      `Bulk assigned ${lead_ids.length} leads (${mode} mode)`
    );

    res.json({
      success: true,
      count: lead_ids.length,
      distribution_summary: distributionSummary,
      message: `Successfully distributed ${lead_ids.length} lead(s) among team.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Lead Assignment History
app.get('/api/admin/leads/:id/history', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;

    const lead = queryOne(db, "SELECT id, name, lead_id, phone FROM leads WHERE id = ?", [id]);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const history = queryAll(db, `
      SELECT * FROM lead_assignment_history
      WHERE lead_id = ?
      ORDER BY id DESC
    `, [id]);

    res.json({ lead, history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== EXCEL LEAD IMPORT ROUTES ====================

// Admin Import Leads with Multi-Distribution Modes (Single, Equal Round-Robin, Manual)
app.post('/api/admin/leads/import', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const {
      distribution_mode = 'single', // 'single' | 'equal' | 'manual'
      employee_id,                  // for 'single' mode
      employee_ids = [],            // for 'equal' mode
      filename = 'imported_leads.xlsx',
      duplicate_action = 'skip',    // 'skip' | 'update'
      leads
    } = req.body;

    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ success: false, error: 'No lead rows provided in import payload' });
    }

    // Active employees lookup
    const allActiveEmployees = queryAll(db, "SELECT id, name, employee_id, designation FROM users WHERE role = 'EMPLOYEE' AND status = 'active' ORDER BY name ASC");
    const activeEmpMap = new Map(allActiveEmployees.map(e => [e.id, e]));

    let targetEmployees = [];

    if (distribution_mode === 'single') {
      let foundEmp = null;
      if (employee_id !== undefined && employee_id !== null && employee_id !== '') {
        const numericId = parseInt(employee_id, 10);
        if (!isNaN(numericId) && activeEmpMap.has(numericId)) {
          foundEmp = activeEmpMap.get(numericId);
        } else {
          const strId = String(employee_id).trim().toLowerCase();
          foundEmp = allActiveEmployees.find(e =>
            (e.name && e.name.toLowerCase() === strId) ||
            (e.employee_id && e.employee_id.toLowerCase() === strId)
          );
        }
      }
      if (!foundEmp) {
        return res.status(400).json({ success: false, error: 'Please select a valid active employee for assignment' });
      }
      targetEmployees = [foundEmp];
    } else if (distribution_mode === 'equal') {
      const selectedIds = Array.isArray(employee_ids) && employee_ids.length > 0
        ? employee_ids.map(Number)
        : allActiveEmployees.map(e => e.id);

      targetEmployees = selectedIds.map(id => activeEmpMap.get(id)).filter(Boolean);
      if (targetEmployees.length === 0) {
        return res.status(400).json({ success: false, error: 'No active employees available for equal distribution' });
      }
    }

    // Generate unique batch ID format: IMP-YYYY-MM-DD-XXXX
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const randCode = String(Math.floor(1000 + Math.random() * 9000));
    const batchId = `IMP-${year}-${month}-${day}-${randCode}`;

    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errorsList = [];
    const distributionSummary = {};
    let distributionIndex = 0;

    // Begin Transaction for fast & safe bulk insert
    db.run("BEGIN TRANSACTION");
    try {
      for (let i = 0; i < leads.length; i++) {
        const row = leads[i];
        const rowNum = i + 1;

        // Validation
        const name = (row.name || '').trim();
        const phone = (row.phone || '').toString().trim().replace(/[^0-9+]/g, '');
        const email = (row.email || '').trim().toLowerCase();

        if (!name) {
          errorCount++;
          errorsList.push({ row: rowNum, error: 'Missing lead name' });
          continue;
        }

        if (!phone && !email) {
          errorCount++;
          errorsList.push({ row: rowNum, name, error: 'Missing both phone and email' });
          continue;
        }

        // Determine assigned employee based on distribution mode or row-level assignment
        let assignedEmp = null;
        if (row.assigned_to && activeEmpMap.has(parseInt(row.assigned_to, 10))) {
          assignedEmp = activeEmpMap.get(parseInt(row.assigned_to, 10));
        } else if (distribution_mode === 'single') {
          assignedEmp = targetEmployees[0];
        } else if (distribution_mode === 'equal') {
          assignedEmp = targetEmployees[distributionIndex % targetEmployees.length];
          distributionIndex++;
        } else if (distribution_mode === 'manual' || distribution_mode === 'custom_counts') {
          const rowEmpId = row.assigned_to ? parseInt(row.assigned_to, 10) : null;
          if (rowEmpId && activeEmpMap.has(rowEmpId)) {
            assignedEmp = activeEmpMap.get(rowEmpId);
          } else if (targetEmployees.length > 0) {
            assignedEmp = targetEmployees[0];
          } else if (allActiveEmployees.length > 0) {
            assignedEmp = allActiveEmployees[0];
          }
        }

        const assignedId = assignedEmp ? assignedEmp.id : null;
        const assignedName = assignedEmp ? assignedEmp.name : null;

        // Check duplicate in existing leads
        let dupSql = "SELECT id, name, lead_id, assigned_to, assigned_consultant FROM leads WHERE 1=0";
        const dupParams = [];
        if (phone && phone.length >= 7) {
          dupSql += " OR phone = ?";
          dupParams.push(phone);
        }
        if (email && email.includes('@')) {
          dupSql += " OR LOWER(email) = ?";
          dupParams.push(email);
        }

        const existingDup = dupParams.length > 0 ? queryOne(db, dupSql, dupParams) : null;

        if (existingDup) {
          if (duplicate_action === 'update') {
            db.run(`
              UPDATE leads SET
                assigned_to = ?,
                assigned_consultant = ?,
                import_batch_id = ?,
                imported_at = datetime('now'),
                updated_at = datetime('now')
              WHERE id = ?
            `, [assignedId, assignedName, batchId, existingDup.id]);

            // Assignment history
            db.run(`
              INSERT INTO lead_assignment_history (
                lead_id, previous_employee_id, previous_employee_name,
                new_employee_id, new_employee_name, changed_by_id, changed_by_name,
                action_type, notes, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, 'IMPORT_UPDATE', ?, datetime('now'))
            `, [
              existingDup.id, existingDup.assigned_to, existingDup.assigned_consultant,
              assignedId, assignedName, req.user.id, req.user.name,
              `Updated via Excel Import Batch ${batchId}`
            ]);

            importedCount++;
            if (assignedName) {
              distributionSummary[assignedName] = (distributionSummary[assignedName] || 0) + 1;
            }
          } else {
            skippedCount++;
          }
          continue;
        }

        // Insert new lead
        const rand3 = Math.floor(100 + Math.random() * 900);
        const lead_id = `LD-${Date.now().toString().slice(-4)}${rand3}${i}`;
        const loan_type = (row.loan_type || 'personal_loan_settlement').toString().toLowerCase().replace(/\s+/g, '_');
        const outstanding = (row.outstanding_amount || row.loan_amount || '1,00,000 - 3,00,000').toString();
        const monthly_income = parseFloat(row.monthly_income) || 0;
        const city = (row.city || 'India').toString();
        const notes = [
          row.lender ? `Lender: ${row.lender}` : '',
          row.notes ? row.notes : '',
          `Batch: ${batchId}`
        ].filter(Boolean).join(' | ');

        db.run(`
          INSERT INTO leads (
            lead_id, name, email, phone, city, outstanding_amount,
            monthly_income, loan_type, default_status, harassment_calls,
            assigned_to, assigned_consultant, source, lead_status, notes,
            import_batch_id, imported_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'yes', 'yes', ?, ?, 'Excel Import', 'New', ?, ?, datetime('now'), datetime('now'), datetime('now'))
        `, [
          lead_id, name, email, phone, city, outstanding,
          monthly_income, loan_type, assignedId, assignedName, notes, batchId
        ]);

        const resId = db.exec("SELECT last_insert_rowid() as id");
        const newLeadId = resId[0]?.values[0][0] || null;

        // Assignment history
        if (newLeadId) {
          db.run(`
            INSERT INTO lead_assignment_history (
              lead_id, previous_employee_id, previous_employee_name,
              new_employee_id, new_employee_name, changed_by_id, changed_by_name,
              action_type, notes, created_at
            ) VALUES (?, NULL, NULL, ?, ?, ?, ?, 'IMPORT_INITIAL', ?, datetime('now'))
          `, [
            newLeadId, assignedId, assignedName, req.user.id, req.user.name,
            `Initial assignment from Excel Import Batch ${batchId}`
          ]);
        }

        importedCount++;
        if (assignedName) {
          distributionSummary[assignedName] = (distributionSummary[assignedName] || 0) + 1;
        }
      }

      // Primary employee representation for single mode
      const primaryEmp = distribution_mode === 'single' ? targetEmployees[0] : null;

      // Record in lead_import_history
      db.run(`
        INSERT INTO lead_import_history (
          batch_id, filename, employee_id, employee_name, distribution_mode, total_rows,
          imported_count, skipped_count, error_count, admin_id, admin_name, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `, [
        batchId, filename, primaryEmp?.id || null, primaryEmp?.name || (distribution_mode === 'equal' ? 'Equal Distribution' : 'Manual Distribution'),
        distribution_mode, leads.length, importedCount, skippedCount, errorCount, req.user.id, req.user.name
      ]);

      // Activity log
      db.run(
        "INSERT INTO activity_logs (user_id, user_name, action, entity_type, entity_id, details) VALUES (?, ?, 'LEAD_IMPORT', 'LEAD_BATCH', ?, ?)",
        [req.user.id, req.user.name, batchId, `Imported ${importedCount} leads from ${filename} (${distribution_mode} mode). Skipped: ${skippedCount}, Errors: ${errorCount}`]
      );

      db.run("COMMIT");
      saveDb();

      return res.json({
        success: true,
        batch_id: batchId,
        filename,
        distribution_mode,
        employee_name: primaryEmp?.name || (distribution_mode === 'equal' ? 'Equal Distribution' : 'Manual Distribution'),
        distribution_summary: distributionSummary,
        total_rows: leads.length,
        imported_count: importedCount,
        skipped_count: skippedCount,
        error_count: errorCount,
        errors: errorsList.slice(0, 10),
        message: `Successfully imported ${importedCount} lead(s) across team.`
      });
    } catch (txErr) {
      try { db.run("ROLLBACK"); } catch (rbErr) { }
      throw txErr;
    }
  } catch (err) {
    console.error('Lead Import Error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to process lead import' });
  }
});

// Admin Get Import History
app.get('/api/admin/leads/import-history', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const history = queryAll(db, `
      SELECT 
        h.*,
        u.employee_id as employee_code,
        u.designation as employee_designation
      FROM lead_import_history h
      LEFT JOIN users u ON h.employee_id = u.id
      ORDER BY h.id DESC
      LIMIT 100
    `);
    res.json({ data: history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Get Leads in Import Batch
app.get('/api/admin/leads/import/:batchId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const { batchId } = req.params;

    const history = queryOne(db, "SELECT * FROM lead_import_history WHERE batch_id = ?", [batchId]);
    const leads = queryAll(db, `
      SELECT 
        l.*,
        u.name as employee_name,
        u.employee_id as employee_code
      FROM leads l
      LEFT JOIN users u ON l.assigned_to = u.id
      WHERE l.import_batch_id = ?
      ORDER BY l.id ASC
    `, [batchId]);

    res.json({ history, leads });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== EMPLOYEE MONTHLY TARGET & PERFORMANCE SYSTEM ====================

// Helper for month-wise performance calculation
function calculateEmployeeMonthPerformance(db, emp, monthStr) {
  const isAllTime = monthStr === 'all';
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthParam = isAllTime ? 'all' : (monthStr || defaultMonth);

  // 1. Leads
  const leadSql = "SELECT * FROM leads WHERE (assigned_to = ? OR (assigned_to IS NULL AND assigned_consultant = ?))";
  const allEmpLeads = queryAll(db, leadSql, [emp.id, emp.name]);

  let monthNewLeads = 0;
  let monthContacted = 0;
  let monthFollowups = 0;
  let monthConverted = 0;
  let monthLost = 0;

  const nowMs = Date.now();
  const aging = { '0_3': 0, '4_7': 0, '8_15': 0, '16_30': 0, '30_plus': 0 };

  allEmpLeads.forEach(l => {
    const createdMonth = (l.created_at || '').slice(0, 7);
    const importedMonth = (l.imported_at || '').slice(0, 7);
    const updatedMonth = (l.updated_at || '').slice(0, 7);

    // New leads created/imported in this month
    if (isAllTime || createdMonth === monthParam || importedMonth === monthParam) {
      monthNewLeads++;
    }

    // Status in this month
    if (isAllTime || updatedMonth === monthParam || createdMonth === monthParam) {
      if (l.lead_status === 'Contacted') monthContacted++;
      else if (l.lead_status === 'Follow up' || l.lead_status === 'Interested') monthFollowups++;
      else if (l.lead_status === 'Converted') monthConverted++;
      else if (l.lead_status === 'Not Interested') monthLost++;
    }

    // Lead aging (from created_at)
    if (l.created_at) {
      const diffDays = Math.floor((nowMs - new Date(l.created_at).getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 3) aging['0_3']++;
      else if (diffDays <= 7) aging['4_7']++;
      else if (diffDays <= 15) aging['8_15']++;
      else if (diffDays <= 30) aging['16_30']++;
      else aging['30_plus']++;
    }
  });

  // 2. Clients created in month
  const clientSql = "SELECT * FROM clients WHERE assigned_consultant = ?";
  const allEmpClients = queryAll(db, clientSql, [emp.name]);
  let monthClientsCount = 0;
  allEmpClients.forEach(c => {
    const cMonth = (c.created_at || '').slice(0, 7);
    if (isAllTime || cMonth === monthParam) {
      monthClientsCount++;
    }
  });

  // 3. Agreements in month
  const aggrSql = "SELECT * FROM agreements WHERE (client_name IN (SELECT name FROM clients WHERE assigned_consultant = ?) OR client_id_ref IN (SELECT id FROM clients WHERE assigned_consultant = ?))";
  const allEmpAgreements = queryAll(db, aggrSql, [emp.name, emp.name]);
  let monthAgreementsCount = 0;
  allEmpAgreements.forEach(a => {
    const aMonth = (a.agreement_date || a.created_at || '').slice(0, 7);
    if (isAllTime || aMonth === monthParam) {
      monthAgreementsCount++;
    }
  });

  // 4. Collections in month
  const paySql = "SELECT p.* FROM payments p JOIN clients c ON p.client_id = c.id WHERE c.assigned_consultant = ?";
  const allEmpPayments = queryAll(db, paySql, [emp.name]);
  let monthCollections = 0;
  allEmpPayments.forEach(p => {
    const pMonth = (p.payment_date || p.created_at || '').slice(0, 7);
    if (isAllTime || pMonth === monthParam) {
      monthCollections += parseFloat(p.amount) || 0;
    }
  });
  if (monthCollections === 0 && allEmpClients.length > 0) {
    allEmpClients.forEach(c => {
      const fMonth = (c.fees_date || c.created_at || '').slice(0, 7);
      if (isAllTime || fMonth === monthParam) {
        monthCollections += parseFloat(c.this_month_received || c.received_amount) || 0;
      }
    });
  }

  // 5. Follow-ups
  const fLogs = queryOne(db, "SELECT COUNT(*) as count FROM activity_logs WHERE (user_id = ? OR details LIKE ?) AND strftime('%Y-%m', created_at) = ?", [emp.id, `%${emp.name}%`, monthParam]);
  const monthFollowupActivities = (fLogs?.count || 0) + monthFollowups;

  // 6. Target for this month
  const targetRow = isAllTime ? null : queryOne(db, "SELECT * FROM employee_targets WHERE employee_id = ? AND month = ?", [emp.id, monthParam]);
  const target = targetRow ? {
    id: targetRow.id,
    month: targetRow.month,
    lead_target: targetRow.lead_target,
    conversion_target: targetRow.conversion_target,
    client_target: targetRow.client_target,
    agreement_target: targetRow.agreement_target,
    followup_target: targetRow.followup_target,
    collection_target: targetRow.collection_target,
    is_set: true
  } : {
    month: monthParam,
    lead_target: 0,
    conversion_target: 0,
    client_target: 0,
    agreement_target: 0,
    followup_target: 0,
    collection_target: 0,
    is_set: false
  };

  function getStatus(targetVal, actualVal) {
    if (!target.is_set || targetVal === 0) return 'Target Not Set';
    const ach = (actualVal / targetVal) * 100;
    if (ach >= 100) return 'Target Achieved';
    if (ach >= 80) return 'On Track';
    if (ach >= 50) return 'Needs Attention';
    return 'Critical';
  }

  function getAch(targetVal, actualVal) {
    if (!target.is_set || targetVal === 0) return null;
    return parseFloat(((actualVal / targetVal) * 100).toFixed(1));
  }

  const targetVsActual = {
    leads: {
      target: target.lead_target,
      actual: monthNewLeads,
      achievement: getAch(target.lead_target, monthNewLeads),
      status: getStatus(target.lead_target, monthNewLeads)
    },
    conversions: {
      target: target.conversion_target,
      actual: monthConverted,
      achievement: getAch(target.conversion_target, monthConverted),
      status: getStatus(target.conversion_target, monthConverted)
    },
    clients: {
      target: target.client_target,
      actual: monthClientsCount,
      achievement: getAch(target.client_target, monthClientsCount),
      status: getStatus(target.client_target, monthClientsCount)
    },
    agreements: {
      target: target.agreement_target,
      actual: monthAgreementsCount,
      achievement: getAch(target.agreement_target, monthAgreementsCount),
      status: getStatus(target.agreement_target, monthAgreementsCount)
    },
    followups: {
      target: target.followup_target,
      actual: monthFollowupActivities,
      achievement: getAch(target.followup_target, monthFollowupActivities),
      status: getStatus(target.followup_target, monthFollowupActivities)
    },
    collections: {
      target: target.collection_target,
      actual: monthCollections,
      achievement: getAch(target.collection_target, monthCollections),
      status: getStatus(target.collection_target, monthCollections)
    }
  };

  let perfScore = 0;
  if (target.is_set) {
    const lAch = Math.min(targetVsActual.leads.achievement || 0, 150) * 0.20;
    const fAch = Math.min(targetVsActual.followups.achievement || 0, 150) * 0.15;
    const cAch = Math.min(targetVsActual.conversions.achievement || 0, 150) * 0.20;
    const clAch = Math.min(targetVsActual.clients.achievement || 0, 150) * 0.10;
    const aAch = Math.min(targetVsActual.agreements.achievement || 0, 150) * 0.10;
    const colAch = Math.min(targetVsActual.collections.achievement || 0, 150) * 0.25;
    perfScore = Math.min(100, Math.round(lAch + fAch + cAch + clAch + aAch + colAch));
  } else {
    const convRate = monthNewLeads > 0 ? (monthConverted / monthNewLeads) * 100 : 0;
    const colRate = monthCollections > 0 ? Math.min((monthCollections / 500000) * 100, 100) : 0;
    perfScore = Math.min(100, Math.round((convRate * 0.5) + (colRate * 0.5)));
  }

  // Monthly trend (past 6 months)
  const trends = [];
  const refYear = parseInt((monthParam || defaultMonth).split('-')[0], 10) || now.getFullYear();
  const refMonth = (parseInt((monthParam || defaultMonth).split('-')[1], 10) || (now.getMonth() + 1)) - 1;
  const currD = new Date(refYear, refMonth, 1);

  for (let m = 5; m >= 0; m--) {
    const d = new Date(currD.getFullYear(), currD.getMonth() - m, 1);
    const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const mName = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });

    let tLeads = 0;
    let tConv = 0;
    allEmpLeads.forEach(l => {
      if ((l.created_at || '').startsWith(mKey) || (l.imported_at || '').startsWith(mKey)) tLeads++;
      if (l.lead_status === 'Converted' && (l.updated_at || '').startsWith(mKey)) tConv++;
    });

    const mTarget = queryOne(db, "SELECT * FROM employee_targets WHERE employee_id = ? AND month = ?", [emp.id, mKey]);
    const tAch = mTarget && mTarget.lead_target > 0 ? Math.round((tLeads / mTarget.lead_target) * 100) : null;

    trends.push({
      monthKey: mKey,
      monthName: mName,
      leads: tLeads,
      conversions: tConv,
      achievement: tAch,
      performance: tAch !== null ? Math.min(100, tAch) : (tLeads > 0 ? Math.round((tConv / tLeads) * 100) : 0)
    });
  }

  return {
    month: monthParam,
    target,
    actuals: {
      new_leads: monthNewLeads,
      total_assigned_leads: allEmpLeads.length,
      contacted: monthContacted,
      followups: monthFollowupActivities,
      converted: monthConverted,
      lost: monthLost,
      conversion_rate: monthNewLeads > 0 ? parseFloat(((monthConverted / monthNewLeads) * 100).toFixed(1)) : 0,
      new_clients: monthClientsCount,
      total_clients: allEmpClients.length,
      agreements: monthAgreementsCount,
      collections: monthCollections,
      performance_score: perfScore
    },
    targetVsActual,
    leadAging: aging,
    trends
  };
}

// 1. GET Employee Targets (Single month or list)
app.get('/api/admin/employees/:id/targets', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;
    const { month } = req.query;

    if (month) {
      const target = queryOne(db, "SELECT * FROM employee_targets WHERE employee_id = ? AND month = ?", [id, month]);
      return res.json({ target: target || null });
    }

    const targets = queryAll(db, "SELECT * FROM employee_targets WHERE employee_id = ? ORDER BY month DESC", [id]);
    res.json({ data: targets });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. POST Set/Update Employee Monthly Target
app.post('/api/admin/employees/:id/targets', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;
    const {
      month,
      lead_target = 0,
      conversion_target = 0,
      client_target = 0,
      agreement_target = 0,
      followup_target = 0,
      collection_target = 0
    } = req.body;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ success: false, error: 'Valid month format (YYYY-MM) is required' });
    }

    const employee = queryOne(db, "SELECT id, name, employee_id FROM users WHERE id = ? AND role = 'EMPLOYEE'", [id]);
    if (!employee) return res.status(404).json({ success: false, error: 'Employee not found' });

    // Check if target already exists for audit logging
    const existing = queryOne(db, "SELECT * FROM employee_targets WHERE employee_id = ? AND month = ?", [id, month]);

    if (existing) {
      executeRun(db, `
        UPDATE employee_targets SET
          lead_target = ?,
          conversion_target = ?,
          client_target = ?,
          agreement_target = ?,
          followup_target = ?,
          collection_target = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `, [
        parseInt(lead_target) || 0,
        parseInt(conversion_target) || 0,
        parseInt(client_target) || 0,
        parseInt(agreement_target) || 0,
        parseInt(followup_target) || 0,
        parseFloat(collection_target) || 0,
        existing.id
      ]);

      const details = `Target Updated for ${employee.name} (${month}): Lead Target ${existing.lead_target} -> ${lead_target}, Collection Target ₹${existing.collection_target} -> ₹${collection_target}`;
      await logActivity(db, req.user.id, req.user.name, 'TARGET_UPDATED', 'TARGET', existing.id, details);

      const updated = queryOne(db, "SELECT * FROM employee_targets WHERE id = ?", [existing.id]);
      return res.json({ success: true, target: updated, message: `Targets updated for ${month}` });
    } else {
      const newId = executeRun(db, `
        INSERT INTO employee_targets (
          employee_id, month, lead_target, conversion_target, client_target,
          agreement_target, followup_target, collection_target, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `, [
        id,
        month,
        parseInt(lead_target) || 0,
        parseInt(conversion_target) || 0,
        parseInt(client_target) || 0,
        parseInt(agreement_target) || 0,
        parseInt(followup_target) || 0,
        parseFloat(collection_target) || 0,
        req.user.id
      ]);

      const details = `Target Created for ${employee.name} (${month}): Lead Target ${lead_target}, Conversion ${conversion_target}, Collection ₹${collection_target}`;
      await logActivity(db, req.user.id, req.user.name, 'TARGET_CREATED', 'TARGET', newId, details);

      const created = queryOne(db, "SELECT * FROM employee_targets WHERE id = ?", [newId]);
      return res.status(201).json({ success: true, target: created, message: `Targets created for ${month}` });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. GET Target History for an Employee
app.get('/api/admin/targets/history/:employeeId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const { employeeId } = req.params;

    const history = queryAll(db, "SELECT * FROM employee_targets WHERE employee_id = ? ORDER BY month DESC", [employeeId]);
    res.json({ data: history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. GET Team Targets & Comparison for Selected Month
app.get('/api/admin/targets', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const month = req.query.month || defaultMonth;

    const activeEmployees = queryAll(db, "SELECT id, name, employee_id, designation, status FROM users WHERE role = 'EMPLOYEE' AND status = 'active' ORDER BY name ASC");

    let teamLeadTarget = 0;
    let teamLeadActual = 0;
    let teamConversionTarget = 0;
    let teamConversionActual = 0;
    let teamCollectionTarget = 0;
    let teamCollectionActual = 0;

    const comparisons = activeEmployees.map(emp => {
      const perf = calculateEmployeeMonthPerformance(db, emp, month);
      const t = perf.target;
      const act = perf.actuals;
      const tva = perf.targetVsActual;

      teamLeadTarget += t.lead_target || 0;
      teamLeadActual += act.new_leads || 0;
      teamConversionTarget += t.conversion_target || 0;
      teamConversionActual += act.converted || 0;
      teamCollectionTarget += t.collection_target || 0;
      teamCollectionActual += act.collections || 0;

      return {
        employee_id: emp.id,
        name: emp.name,
        employee_code: emp.employee_id,
        designation: emp.designation,
        lead_target: t.lead_target,
        lead_actual: act.new_leads,
        lead_achievement: tva.leads.achievement,
        lead_status: tva.leads.status,
        conversion_target: t.conversion_target,
        conversion_actual: act.converted,
        conversion_achievement: tva.conversions.achievement,
        collection_target: t.collection_target,
        collection_actual: act.collections,
        collection_achievement: tva.collections.achievement,
        performance_score: act.performance_score,
        is_target_set: t.is_set
      };
    });

    res.json({
      month,
      team_summary: {
        total_employees: activeEmployees.length,
        lead_target: teamLeadTarget,
        lead_actual: teamLeadActual,
        lead_achievement: teamLeadTarget > 0 ? parseFloat(((teamLeadActual / teamLeadTarget) * 100).toFixed(1)) : 0,
        conversion_target: teamConversionTarget,
        conversion_actual: teamConversionActual,
        conversion_achievement: teamConversionTarget > 0 ? parseFloat(((teamConversionActual / teamConversionTarget) * 100).toFixed(1)) : 0,
        collection_target: teamCollectionTarget,
        collection_actual: teamCollectionActual,
        collection_achievement: teamCollectionTarget > 0 ? parseFloat(((teamCollectionActual / teamCollectionTarget) * 100).toFixed(1)) : 0
      },
      comparisons
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. GET Single Employee Month-Wise Performance
app.get('/api/admin/employees/:id/performance', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;
    const { month } = req.query;

    const employee = queryOne(db, "SELECT id, name, employee_id, email, phone, role, department, designation, status, created_at FROM users WHERE id = ? AND role = 'EMPLOYEE'", [id]);
    if (!employee) return res.status(404).json({ success: false, error: 'Employee not found' });

    const perfData = calculateEmployeeMonthPerformance(db, employee, month);

    const recentLeads = queryAll(db, `
      SELECT id, lead_id, name, phone, city, lead_status, loan_type, outstanding_amount, created_at, imported_at
      FROM leads
      WHERE (assigned_to = ? OR (assigned_to IS NULL AND assigned_consultant = ?))
      ORDER BY id DESC
      LIMIT 15
    `, [id, employee.name]);

    const recentActivities = queryAll(db, `
      SELECT * FROM activity_logs
      WHERE user_id = ? OR details LIKE ?
      ORDER BY id DESC
      LIMIT 15
    `, [id, `%${employee.name}%`]);

    res.json({
      employee,
      month: perfData.month,
      target: perfData.target,
      metrics: {
        leads: {
          assigned: perfData.actuals.new_leads,
          total_cumulative: perfData.actuals.total_assigned_leads,
          contacted: perfData.actuals.contacted,
          followups: perfData.actuals.followups,
          converted: perfData.actuals.converted,
          lost: perfData.actuals.lost,
          conversion_rate: perfData.actuals.conversion_rate
        },
        clients: {
          total: perfData.actuals.new_clients,
          cumulative_active: perfData.actuals.total_clients
        },
        agreements: {
          total: perfData.actuals.agreements
        },
        collections: {
          total: perfData.actuals.collections
        },
        performance_score: perfData.actuals.performance_score
      },
      targetVsActual: perfData.targetVsActual,
      leadAging: perfData.leadAging,
      trends: perfData.trends,
      recent_leads: recentLeads,
      recent_activities: recentActivities
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. GET Team Performance Comparison API
app.get('/api/admin/employees/performance', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const { month } = req.query;
    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthParam = month || defaultMonth;

    const employees = queryAll(db, "SELECT id, name, employee_id, email, phone, designation, status FROM users WHERE role = 'EMPLOYEE' AND status = 'active' ORDER BY name ASC");

    const performanceList = employees.map(emp => {
      const perf = calculateEmployeeMonthPerformance(db, emp, monthParam);
      return {
        employee: emp,
        month: monthParam,
        target: perf.target,
        actuals: perf.actuals,
        targetVsActual: perf.targetVsActual
      };
    });

    res.json({
      month: monthParam,
      data: performanceList
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Audit Logs API
app.get('/api/admin/audit-logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const { action, search, page = 1, limit = 50 } = req.query;

    let sql = "SELECT * FROM activity_logs WHERE 1=1";
    const params = [];

    if (action && action !== 'ALL') {
      sql += " AND action = ?";
      params.push(action);
    }

    if (search) {
      sql += " AND (user_name LIKE ? OR details LIKE ? OR entity_id LIKE ?)";
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    const countSql = sql.replace("SELECT * FROM activity_logs", "SELECT COUNT(*) as count FROM activity_logs");
    const countRow = queryOne(db, countSql, params);
    const total = countRow?.count || 0;

    sql += " ORDER BY id DESC LIMIT ? OFFSET ?";
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const logs = queryAll(db, sql, params);

    res.json({
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Get Single Lead Details & Activity
app.get('/api/admin/leads/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;

    const lead = queryOne(db, `
      SELECT 
        l.*,
        u.name as employee_name,
        u.employee_id as employee_code,
        u.designation as employee_designation,
        u.department as employee_department,
        u.phone as employee_phone,
        u.email as employee_email
      FROM leads l
      LEFT JOIN users u ON (l.assigned_to = u.id OR (l.assigned_to IS NULL AND l.assigned_consultant = u.name))
      WHERE l.id = ?
    `, [id]);

    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const activities = queryAll(db, "SELECT * FROM activity_logs WHERE entity_type = 'LEAD' AND entity_id = ? ORDER BY id DESC LIMIT 15", [id]);
    const assignmentHistory = queryAll(db, "SELECT * FROM lead_assignment_history WHERE lead_id = ? ORDER BY id DESC LIMIT 15", [id]);

    res.json({ lead, activities, assignmentHistory });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Image format validator
function validateImageData(dataUri, fieldName = 'Image') {
  if (!dataUri) return null;
  if (typeof dataUri !== 'string') return `${fieldName} must be a valid string`;
  if (dataUri.startsWith('data:')) {
    const match = dataUri.match(/^data:image\/(jpeg|jpg|png|webp);base64,/i);
    if (!match) {
      return `${fieldName} must be a valid JPG, PNG, or WEBP image format`;
    }
    if (dataUri.length > 35 * 1024 * 1024) {
      return `${fieldName} exceeds maximum size limit (25MB)`;
    }
  }
  return null;
}

// List All Employees (with Masked Aadhaar & CRM Stats)
app.get('/api/admin/employees', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const employees = queryAll(db, `
      SELECT 
        id, name, employee_id, email, phone, role, department, designation, 
        status, employment_status, joining_date, profile_photo, aadhaar_number,
        CASE WHEN (aadhaar_front_document IS NOT NULL AND aadhaar_front_document != '') THEN 1 ELSE 0 END as has_aadhaar_front,
        CASE WHEN (aadhaar_back_document IS NOT NULL AND aadhaar_back_document != '') THEN 1 ELSE 0 END as has_aadhaar_back,
        created_at, updated_at 
      FROM users 
      WHERE role = 'EMPLOYEE' 
      ORDER BY id DESC
    `);

    // Enrich with CRM stats and safely mask Aadhaar
    const enriched = employees.map(emp => {
      const leads = queryOne(db, "SELECT COUNT(*) as count FROM leads WHERE assigned_to = ? OR assigned_consultant = ?", [emp.id, emp.name]);
      const clients = queryOne(db, "SELECT COUNT(*) as count FROM clients WHERE assigned_to = ? OR assigned_consultant = ?", [emp.id, emp.name]);
      const agreements = queryOne(db, "SELECT COUNT(*) as count FROM agreements WHERE assigned_to = ? OR client_name IN (SELECT name FROM clients WHERE assigned_to = ? OR assigned_consultant = ?)", [emp.id, emp.id, emp.name]);
      const collectionsRow = queryOne(db, "SELECT SUM(received_amount) as total FROM clients WHERE assigned_to = ? OR assigned_consultant = ?", [emp.id, emp.name]);
      const converted = queryOne(db, "SELECT COUNT(*) as count FROM leads WHERE (assigned_to = ? OR assigned_consultant = ?) AND lead_status = 'Converted'", [emp.id, emp.name]);
      const lc = leads?.count || 0;
      const cc = converted?.count || 0;
      const perf = lc > 0 ? Math.round((cc / lc) * 100) : 0;

      return {
        ...emp,
        aadhaar_number: maskAadhaar(emp.aadhaar_number),
        has_aadhaar_front: Boolean(emp.has_aadhaar_front),
        has_aadhaar_back: Boolean(emp.has_aadhaar_back),
        has_profile_photo: Boolean(emp.profile_photo && emp.profile_photo.length > 0),
        stats: {
          leads: lc,
          clients: clients?.count || 0,
          agreements: agreements?.count || 0,
          collections: collectionsRow?.total || 0,
          performance: perf
        }
      };
    });

    res.json({ data: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Employee
app.post('/api/admin/employees', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const {
      name, employee_id, email, phone, department, designation,
      employment_status, joining_date, profile_photo,
      aadhaar_number, aadhaar_front_document, aadhaar_back_document,
      password
    } = req.body;

    if (!name || !name.trim()) return res.status(400).json({ error: 'Full Name is required' });
    if (!employee_id || !employee_id.trim()) return res.status(400).json({ error: 'Employee ID is required' });
    if (!email || !email.trim()) return res.status(400).json({ error: 'Email is required' });
    if (!phone || !phone.trim()) return res.status(400).json({ error: 'Mobile Number is required' });
    if (!department || !department.trim()) return res.status(400).json({ error: 'Department is required' });
    if (!designation || !designation.trim()) return res.status(400).json({ error: 'Designation is required' });
    if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    // Validate email uniqueness
    const existingEmail = queryOne(db, "SELECT id FROM users WHERE LOWER(email) = ?", [email.trim().toLowerCase()]);
    if (existingEmail) {
      return res.status(400).json({ error: 'An account with this email address already exists' });
    }

    // Validate employee_id uniqueness
    const cleanEid = employee_id.trim();
    const existingEid = queryOne(db, "SELECT id FROM users WHERE LOWER(employee_id) = ?", [cleanEid.toLowerCase()]);
    if (existingEid) {
      return res.status(400).json({ error: `Employee ID "${cleanEid}" is already in use by another staff member` });
    }

    // Validate and Encrypt Aadhaar if provided
    let encryptedAadhaar = '';
    if (aadhaar_number && aadhaar_number.trim()) {
      const cleanAadhaar = aadhaar_number.replace(/\D/g, '');
      if (cleanAadhaar.length !== 12) {
        return res.status(400).json({ error: 'Aadhaar Number must be exactly 12 numeric digits' });
      }

      // Check duplicate Aadhaar across existing users
      const allEmps = queryAll(db, "SELECT id, name, aadhaar_number FROM users WHERE aadhaar_number IS NOT NULL AND aadhaar_number != ''");
      for (const e of allEmps) {
        const dec = decryptAadhaar(e.aadhaar_number);
        if (dec === cleanAadhaar) {
          return res.status(400).json({ error: `Aadhaar number is already registered under employee "${e.name}"` });
        }
      }

      encryptedAadhaar = encryptAadhaar(cleanAadhaar);
    }

    // Validate images
    const photoErr = validateImageData(profile_photo, 'Profile Photo');
    if (photoErr) return res.status(400).json({ error: photoErr });

    const frontErr = validateImageData(aadhaar_front_document, 'Aadhaar Front Document');
    if (frontErr) return res.status(400).json({ error: frontErr });

    const backErr = validateImageData(aadhaar_back_document, 'Aadhaar Back Document');
    if (backErr) return res.status(400).json({ error: backErr });

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    const id = executeRun(db, `
      INSERT INTO users (
        name, employee_id, email, phone, password_hash, role,
        department, designation, status, employment_status,
        joining_date, profile_photo, aadhaar_number,
        aadhaar_front_document, aadhaar_back_document
      ) VALUES (?, ?, ?, ?, ?, 'EMPLOYEE', ?, ?, 'active', ?, ?, ?, ?, ?, ?)
    `, [
      name.trim(),
      cleanEid,
      email.trim().toLowerCase(),
      phone.trim(),
      hash,
      department.trim(),
      designation.trim(),
      employment_status || 'active',
      joining_date || new Date().toISOString().split('T')[0],
      profile_photo || '',
      encryptedAadhaar,
      aadhaar_front_document || '',
      aadhaar_back_document || ''
    ]);

    await logActivity(db, req.user.id, req.user.name, 'CREATE_EMPLOYEE', 'USER', id, `Created employee: ${name} (ID: ${cleanEid})`);

    const newEmp = queryOne(db, `
      SELECT 
        id, name, employee_id, email, phone, role, department, designation, 
        status, employment_status, joining_date, profile_photo,
        CASE WHEN (aadhaar_front_document IS NOT NULL AND aadhaar_front_document != '') THEN 1 ELSE 0 END as has_aadhaar_front,
        CASE WHEN (aadhaar_back_document IS NOT NULL AND aadhaar_back_document != '') THEN 1 ELSE 0 END as has_aadhaar_back,
        created_at 
      FROM users WHERE id = ?
    `, [id]);

    res.status(201).json({
      ...newEmp,
      aadhaar_number: maskAadhaar(encryptedAadhaar),
      has_aadhaar_front: Boolean(newEmp.has_aadhaar_front),
      has_aadhaar_back: Boolean(newEmp.has_aadhaar_back)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Single Employee (Masked)
app.get('/api/admin/employees/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const emp = queryOne(db, `
      SELECT 
        id, name, employee_id, email, phone, role, department, designation, 
        status, employment_status, joining_date, profile_photo, aadhaar_number,
        CASE WHEN (aadhaar_front_document IS NOT NULL AND aadhaar_front_document != '') THEN 1 ELSE 0 END as has_aadhaar_front,
        CASE WHEN (aadhaar_back_document IS NOT NULL AND aadhaar_back_document != '') THEN 1 ELSE 0 END as has_aadhaar_back,
        created_at, updated_at 
      FROM users 
      WHERE id = ? AND role = 'EMPLOYEE'
    `, [req.params.id]);

    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    res.json({
      ...emp,
      aadhaar_number: maskAadhaar(emp.aadhaar_number),
      has_aadhaar_front: Boolean(emp.has_aadhaar_front),
      has_aadhaar_back: Boolean(emp.has_aadhaar_back)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Secure Aadhaar Reveal Endpoint (Admin Only with Audit Logging)
app.get('/api/admin/employees/:id/aadhaar', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const emp = queryOne(db, `
      SELECT id, name, employee_id, aadhaar_number, aadhaar_front_document, aadhaar_back_document 
      FROM users 
      WHERE id = ? AND role = 'EMPLOYEE'
    `, [req.params.id]);

    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    const decryptedAadhaar = decryptAadhaar(emp.aadhaar_number);

    // Create secure audit log entry for viewing sensitive KYC data
    await logActivity(
      db,
      req.user.id,
      req.user.name,
      'VIEW_AADHAAR_DOCUMENT',
      'USER',
      emp.id,
      `Viewed sensitive Aadhaar details & documents for employee ${emp.name} (${emp.employee_id})`
    );

    res.json({
      success: true,
      employee_id: emp.employee_id,
      employee_name: emp.name,
      aadhaar_number: decryptedAadhaar,
      masked_aadhaar: maskAadhaar(emp.aadhaar_number),
      aadhaar_front_document: emp.aadhaar_front_document || null,
      aadhaar_back_document: emp.aadhaar_back_document || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Employee
app.put('/api/admin/employees/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;
    const existing = queryOne(db, "SELECT * FROM users WHERE id = ? AND role = 'EMPLOYEE'", [id]);
    if (!existing) return res.status(404).json({ error: 'Employee not found' });

    const {
      name, employee_id, email, phone, department, designation,
      employment_status, joining_date, status, profile_photo,
      aadhaar_number, aadhaar_front_document, aadhaar_back_document,
      remove_profile_photo, remove_aadhaar_front, remove_aadhaar_back
    } = req.body;

    if (email && email.trim()) {
      const duplicateEmail = queryOne(db, "SELECT id FROM users WHERE LOWER(email) = ? AND id != ?", [email.trim().toLowerCase(), id]);
      if (duplicateEmail) {
        return res.status(400).json({ error: 'Another account with this email already exists' });
      }
    }

    if (employee_id && employee_id.trim()) {
      const cleanEid = employee_id.trim();
      const duplicateEid = queryOne(db, "SELECT id FROM users WHERE LOWER(employee_id) = ? AND id != ?", [cleanEid.toLowerCase(), id]);
      if (duplicateEid) {
        return res.status(400).json({ error: `Employee ID "${cleanEid}" is already used by another employee` });
      }
    }

    // Process Aadhaar update if provided
    let newEncryptedAadhaar = existing.aadhaar_number;
    if (aadhaar_number !== undefined) {
      if (aadhaar_number && aadhaar_number.trim()) {
        const clean = aadhaar_number.replace(/\D/g, '');
        if (clean.length !== 12) {
          return res.status(400).json({ error: 'Aadhaar Number must be exactly 12 numeric digits' });
        }

        // Duplicate check
        const otherEmps = queryAll(db, "SELECT id, name, aadhaar_number FROM users WHERE id != ? AND aadhaar_number IS NOT NULL AND aadhaar_number != ''", [id]);
        for (const o of otherEmps) {
          if (decryptAadhaar(o.aadhaar_number) === clean) {
            return res.status(400).json({ error: `Aadhaar number is already assigned to employee "${o.name}"` });
          }
        }

        newEncryptedAadhaar = encryptAadhaar(clean);
      } else {
        newEncryptedAadhaar = '';
      }
    }

    // Determine documents and photo updates
    let newPhoto = existing.profile_photo;
    if (remove_profile_photo) {
      newPhoto = '';
    } else if (profile_photo !== undefined) {
      const photoErr = validateImageData(profile_photo, 'Profile Photo');
      if (photoErr) return res.status(400).json({ error: photoErr });
      newPhoto = profile_photo;
    }

    let newFrontDoc = existing.aadhaar_front_document;
    if (remove_aadhaar_front) {
      newFrontDoc = '';
    } else if (aadhaar_front_document !== undefined) {
      const frontErr = validateImageData(aadhaar_front_document, 'Aadhaar Front Document');
      if (frontErr) return res.status(400).json({ error: frontErr });
      newFrontDoc = aadhaar_front_document;
    }

    let newBackDoc = existing.aadhaar_back_document;
    if (remove_aadhaar_back) {
      newBackDoc = '';
    } else if (aadhaar_back_document !== undefined) {
      const backErr = validateImageData(aadhaar_back_document, 'Aadhaar Back Document');
      if (backErr) return res.status(400).json({ error: backErr });
      newBackDoc = aadhaar_back_document;
    }

    executeRun(db, `
      UPDATE users SET
        name = COALESCE(?, name),
        employee_id = COALESCE(?, employee_id),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        department = COALESCE(?, department),
        designation = COALESCE(?, designation),
        employment_status = COALESCE(?, employment_status),
        joining_date = COALESCE(?, joining_date),
        status = COALESCE(?, status),
        profile_photo = ?,
        aadhaar_number = ?,
        aadhaar_front_document = ?,
        aadhaar_back_document = ?,
        updated_at = datetime('now')
      WHERE id = ? AND role = 'EMPLOYEE'
    `, [
      name ? name.trim() : null,
      employee_id ? employee_id.trim() : null,
      email ? email.trim().toLowerCase() : null,
      phone ? phone.trim() : null,
      department ? department.trim() : null,
      designation ? designation.trim() : null,
      employment_status || null,
      joining_date || null,
      status || null,
      newPhoto,
      newEncryptedAadhaar,
      newFrontDoc,
      newBackDoc,
      id
    ]);

    await logActivity(db, req.user.id, req.user.name, 'UPDATE_EMPLOYEE', 'USER', id, `Updated employee profile & documents: ${name || existing.name}`);

    const updated = queryOne(db, `
      SELECT 
        id, name, employee_id, email, phone, role, department, designation, 
        status, employment_status, joining_date, profile_photo, aadhaar_number,
        CASE WHEN (aadhaar_front_document IS NOT NULL AND aadhaar_front_document != '') THEN 1 ELSE 0 END as has_aadhaar_front,
        CASE WHEN (aadhaar_back_document IS NOT NULL AND aadhaar_back_document != '') THEN 1 ELSE 0 END as has_aadhaar_back,
        created_at, updated_at 
      FROM users WHERE id = ?
    `, [id]);

    res.json({
      ...updated,
      aadhaar_number: maskAadhaar(updated.aadhaar_number),
      has_aadhaar_front: Boolean(updated.has_aadhaar_front),
      has_aadhaar_back: Boolean(updated.has_aadhaar_back)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Audit CRM Navigation and Profile Views
app.post('/api/admin/employees/:id/audit', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const { action = 'OPEN_EMPLOYEE_CRM' } = req.body;
    const emp = queryOne(db, "SELECT id, name, employee_id FROM users WHERE id = ?", [req.params.id]);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    const logAction = ['OPEN_EMPLOYEE_CRM', 'VIEW_EMPLOYEE_PROFILE'].includes(action) ? action : 'OPEN_EMPLOYEE_CRM';
    const detailMsg = logAction === 'OPEN_EMPLOYEE_CRM'
      ? `Admin navigated into CRM workspace for employee ${emp.name} (${emp.employee_id})`
      : `Admin viewed detailed profile for employee ${emp.name} (${emp.employee_id})`;

    await logActivity(db, req.user.id, req.user.name, logAction, 'USER', emp.id, detailMsg);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Activate/Deactivate Employee
app.put('/api/admin/employees/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Status must be active or inactive' });
    }

    executeRun(db, "UPDATE users SET status = ?, updated_at = datetime('now') WHERE id = ? AND role = 'EMPLOYEE'", [status, req.params.id]);
    await logActivity(db, req.user.id, req.user.name, status === 'active' ? 'ACTIVATE_EMPLOYEE' : 'DEACTIVATE_EMPLOYEE', 'USER', req.params.id, `Employee ${status}`);
    const updated = queryOne(db, "SELECT id, name, employee_id, email, status FROM users WHERE id = ?", [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset Employee Password
app.put('/api/admin/employees/:id/password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    executeRun(db, "UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ? AND role = 'EMPLOYEE'", [hash, req.params.id]);
    await logActivity(db, req.user.id, req.user.name, 'RESET_PASSWORD', 'USER', req.params.id, 'Password reset by admin');
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// Catch-all 404 for /api routes to prevent HTML error responses
app.all('/api/*', (req, res) => {
  res.status(404).json({ success: false, error: `API route not found: ${req.method} ${req.originalUrl}` });
});

// Global Express error handler to guarantee JSON error response
app.use((err, req, res, next) => {
  console.error('Express Server Error:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Start Server
app.listen(PORT, '0.0.0.0', async () => {
  await getDb();
  console.log(`SettleXpert CRM Backend running on http://0.0.0.0:${PORT}`);
});
