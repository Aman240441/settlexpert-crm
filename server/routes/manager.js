const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticateToken, requireManagerOrAdmin, getManagerScope, logAudit } = require('../middleware/auth');

// ==========================================
// 1. MANAGER CONTEXT & PROFILE
// ==========================================
router.get('/context', authenticateToken, requireManagerOrAdmin, (req, res) => {
  try {
    const scope = getManagerScope(req);

    const user = db.prepare(`
      SELECT u.id, u.name, u.email, u.phone, u.role, u.emp_or_mgr_id, u.status, u.joining_date,
             u.department_id, u.manager_type_id,
             d.name as department_name, d.code as department_code,
             mt.name as manager_type_name, mt.code as manager_type_code, mt.permissions_json
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN manager_types mt ON u.manager_type_id = mt.id
      WHERE u.id = ?
    `).get(req.user.id);

    const employees = db.prepare(`
      SELECT id, name, email, phone, emp_or_mgr_id, status, joining_date, id_type
      FROM users 
      WHERE (manager_id = ? OR (department_id = ? AND role = 'employee'))
        AND role = 'employee'
      ORDER BY name ASC
    `).all(req.user.id, user ? user.department_id : null);

    res.json({
      user,
      managerType: scope.managerType,
      department: user ? { id: user.department_id, name: user.department_name, code: user.department_code } : null,
      permissions: scope.permissions,
      assignedEmployees: employees
    });
  } catch (err) {
    console.error('Manager context error:', err);
    res.status(500).json({ error: 'Failed to load manager context' });
  }
});

// ==========================================
// 2. MANAGER DASHBOARD
// ==========================================
router.get('/dashboard', authenticateToken, requireManagerOrAdmin, (req, res) => {
  try {
    const scope = getManagerScope(req);
    const empIds = scope.employeeIds;
    const empInClause = empIds.length > 0 ? empIds.map(id => `'${id}'`).join(',') : `''`;

    // 1. My Employees Count
    const employeesCount = empIds.length;

    // 2. Leads Count
    let leadWhere = scope.isAdmin 
      ? `1=1` 
      : `(l.manager_id = '${scope.managerId}' OR l.employee_id IN (${empInClause}) OR l.department_id = '${scope.departmentId}')`;
    const myLeads = db.prepare(`SELECT COUNT(*) as count FROM leads l WHERE ${leadWhere}`).get().count;

    // 3. Clients Count
    let clientWhere = scope.isAdmin 
      ? `1=1` 
      : `(c.manager_id = '${scope.managerId}' OR c.employee_id IN (${empInClause}))`;
    const myClients = db.prepare(`SELECT COUNT(*) as count FROM clients c WHERE ${clientWhere}`).get().count;

    const activeClients = db.prepare(`
      SELECT COUNT(*) as count FROM clients c 
      WHERE ${clientWhere} AND (c.case_status = 'active' OR c.status = 'active')
    `).get().count;

    // 4. Pending Tasks
    let taskWhere = scope.isAdmin 
      ? `t.status != 'completed'` 
      : `t.status != 'completed' AND (t.assigned_to IN (${empInClause}) OR t.created_by = '${req.user.name}')`;
    const pendingTasks = db.prepare(`SELECT COUNT(*) as count FROM tasks t WHERE ${taskWhere}`).get().count;

    // 5. Finance / Collection Metrics
    const pendingVerificationCount = db.prepare(`
      SELECT COUNT(*) as count FROM payments p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE p.status = 'pending_verification'
      ${!scope.isAdmin ? `AND (c.manager_id = '${scope.managerId}' OR c.employee_id IN (${empInClause}))` : ''}
    `).get().count;

    const totalCollectionRow = db.prepare(`
      SELECT COALESCE(SUM(p.amount), 0) as total FROM payments p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE p.status = 'verified'
      ${!scope.isAdmin ? `AND (c.manager_id = '${scope.managerId}' OR c.employee_id IN (${empInClause}))` : ''}
    `).get();
    const totalCollection = totalCollectionRow.total;

    const totalFeesRow = db.prepare(`
      SELECT COALESCE(SUM(c.sx_fee), 0) as total FROM clients c
      WHERE ${clientWhere}
    `).get();
    const totalFees = totalFeesRow.total;
    const pendingCollection = Math.max(0, totalFees - totalCollection);

    // 6. Legal / Advocate Metrics
    const advocatesCount = db.prepare(`SELECT COUNT(*) as count FROM advocates WHERE status = 'active'`).get().count;
    const unassignedAdvocatesCount = db.prepare(`
      SELECT COUNT(*) as count FROM clients c 
      WHERE ${clientWhere} AND (c.advocate_id IS NULL OR c.advocate_id = '') AND (c.case_status = 'active' OR c.status = 'active')
    `).get().count;

    const activeAgreementsCount = db.prepare(`
      SELECT COUNT(*) as count FROM agreements a
      LEFT JOIN clients c ON a.client_id = c.id
      WHERE (a.status = 'active' OR a.status = 'signed')
      ${!scope.isAdmin ? `AND (c.manager_id = '${scope.managerId}' OR c.employee_id IN (${empInClause}))` : ''}
    `).get().count;

    // 7. Team Lead Status Pipeline
    const leadPipelineRaw = db.prepare(`
      SELECT l.status, COUNT(*) as count FROM leads l
      WHERE ${leadWhere}
      GROUP BY l.status
    `).all();

    const pipeline = { new: 0, contacted: 0, interested: 0, follow_up: 0, converted: 0, not_interested: 0 };
    leadPipelineRaw.forEach(row => {
      const k = (row.status || '').toLowerCase().replace(/ /g, '_');
      if (pipeline[k] !== undefined) pipeline[k] = row.count;
    });

    res.json({
      topCards: {
        myEmployees: employeesCount,
        myLeads,
        myClients,
        activeClients,
        pendingTasks,
        pendingVerification: pendingVerificationCount,
        totalCollection,
        pendingCollection,
        totalFees,
        advocatesCount,
        unassignedAdvocates: unassignedAdvocatesCount,
        activeAgreements: activeAgreementsCount
      },
      pipeline,
      managerType: scope.managerType
    });
  } catch (err) {
    console.error('Manager dashboard error:', err);
    res.status(500).json({ error: 'Failed to generate manager dashboard' });
  }
});

// ==========================================
// 3. TEAM DIRECTORY & EMPLOYEE MANAGEMENT
// ==========================================
router.get('/team', authenticateToken, requireManagerOrAdmin, (req, res) => {
  try {
    const scope = getManagerScope(req);

    let sql = `
      SELECT u.id, u.name, u.email, u.phone, u.emp_or_mgr_id, u.status, u.joining_date, u.id_type,
             d.name as department_name,
             (SELECT COUNT(*) FROM leads l WHERE l.employee_id = u.id) as leads_count,
             (SELECT COUNT(*) FROM clients c WHERE c.employee_id = u.id) as clients_count,
             (SELECT COUNT(*) FROM tasks t WHERE t.assigned_to = u.id AND t.status != 'completed') as active_tasks_count
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.role = 'employee'
    `;

    if (!scope.isAdmin) {
      sql += ` AND (u.manager_id = '${scope.managerId}' OR u.department_id = '${scope.departmentId}')`;
    }

    sql += ` ORDER BY u.name ASC`;
    const employees = db.prepare(sql).all();

    res.json({ employees });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load manager team' });
  }
});

// Reset Team Employee Password
router.post('/team/:employeeId/reset-password', authenticateToken, requireManagerOrAdmin, (req, res) => {
  try {
    const scope = getManagerScope(req);
    const { new_password } = req.body;
    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const employee = db.prepare(`SELECT * FROM users WHERE id = ? AND role = 'employee'`).get(req.params.employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Cross-manager authorization check
    if (!scope.isAdmin && employee.manager_id !== scope.managerId && employee.department_id !== scope.departmentId) {
      return res.status(403).json({ error: 'Forbidden: You can only reset passwords for employees in your team' });
    }

    const hash = bcrypt.hashSync(new_password, 10);
    db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(hash, employee.id);

    logAudit(req, 'Employee Password Reset', 'Users', employee.id, {
      employee: employee.name,
      empId: employee.emp_or_mgr_id
    });

    res.json({ message: `Password reset successfully for ${employee.name}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset employee password' });
  }
});

// ==========================================
// 4. MANAGER LEADS & REASSIGNMENT
// ==========================================
router.get('/leads', authenticateToken, requireManagerOrAdmin, (req, res) => {
  try {
    const scope = getManagerScope(req);
    const { search, status, employee_id, date, page = 1, limit = 25 } = req.query;
    const empIds = scope.employeeIds;
    const empInClause = empIds.length > 0 ? empIds.map(id => `'${id}'`).join(',') : `''`;

    let sql = `
      SELECT l.*,
             u.name as employee_name,
             u.emp_or_mgr_id as employee_code,
             (SELECT COUNT(*) FROM follow_ups f WHERE f.lead_id = l.id) as follow_up_count,
             (SELECT next_follow_up_date FROM follow_ups f WHERE f.lead_id = l.id ORDER BY f.created_at DESC LIMIT 1) as next_follow_up_date
      FROM leads l
      LEFT JOIN users u ON l.employee_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (!scope.isAdmin) {
      sql += ` AND (l.manager_id = ? OR l.employee_id IN (${empInClause}) OR l.department_id = ?)`;
      params.push(scope.managerId, scope.departmentId);
    }

    if (employee_id) {
      sql += ` AND l.employee_id = ?`;
      params.push(employee_id);
    }

    if (status) {
      sql += ` AND l.status = ?`;
      params.push(status);
    }

    if (search) {
      sql += ` AND (l.name LIKE ? OR l.phone LIKE ? OR l.lead_number LIKE ? OR l.city LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    if (date) {
      sql += ` AND date(l.created_at) = date(?)`;
      params.push(date);
    }

    sql += ` ORDER BY l.created_at DESC LIMIT ? OFFSET ?`;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const leads = db.prepare(sql).all(...params);

    const countSql = `SELECT COUNT(*) as total FROM leads l WHERE 1=1` +
      (!scope.isAdmin ? ` AND (l.manager_id = '${scope.managerId}' OR l.employee_id IN (${empInClause}) OR l.department_id = '${scope.departmentId}')` : '') +
      (status ? ` AND l.status = '${status}'` : '') +
      (employee_id ? ` AND l.employee_id = '${employee_id}'` : '');

    const total = db.prepare(countSql).get().total;

    res.json({
      leads,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch manager leads' });
  }
});

// Reassign Lead strictly to Team Employee
router.post('/leads/:leadId/assign', authenticateToken, requireManagerOrAdmin, (req, res) => {
  try {
    const scope = getManagerScope(req);
    const { new_employee_id, reason } = req.body;
    if (!new_employee_id) {
      return res.status(400).json({ error: 'New employee selection is required' });
    }

    const lead = db.prepare(`SELECT * FROM leads WHERE id = ?`).get(req.params.leadId);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const newEmp = db.prepare(`SELECT * FROM users WHERE id = ? AND role = 'employee'`).get(new_employee_id);
    if (!newEmp) return res.status(404).json({ error: 'Target employee not found' });

    // Strict Scope check: new employee must belong to manager's team or department
    if (!scope.isAdmin && newEmp.manager_id !== scope.managerId && newEmp.department_id !== scope.departmentId) {
      return res.status(403).json({ error: 'Forbidden: You can only assign leads to employees within your team' });
    }

    const oldEmp = lead.employee_id ? db.prepare(`SELECT name FROM users WHERE id = ?`).get(lead.employee_id) : null;

    db.prepare(`
      UPDATE leads SET
        employee_id = ?,
        manager_id = COALESCE(manager_id, ?),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newEmp.id, scope.managerId || lead.manager_id, lead.id);

    logAudit(req, 'Lead Reassigned', 'Leads', lead.id, {
      leadNumber: lead.lead_number,
      previousEmployee: oldEmp ? oldEmp.name : 'Unassigned',
      newEmployee: newEmp.name,
      reason: reason || 'Manager reassignment'
    });

    res.json({
      message: `Lead ${lead.lead_number} successfully reassigned to ${newEmp.name}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to reassign lead' });
  }
});

// ==========================================
// 5. MANAGER CLIENTS & ADVOCATE / FEE CONTROL
// ==========================================
router.get('/clients', authenticateToken, requireManagerOrAdmin, (req, res) => {
  try {
    const scope = getManagerScope(req);
    const { search, case_status, page = 1, limit = 25 } = req.query;
    const empIds = scope.employeeIds;
    const empInClause = empIds.length > 0 ? empIds.map(id => `'${id}'`).join(',') : `''`;

    let sql = `
      SELECT c.*,
             u.name as employee_name,
             a.name as advocate_name,
             a.registration_number as advocate_reg,
             COALESCE((SELECT SUM(amount) FROM payments p WHERE p.client_id = c.id AND p.status = 'verified'), 0) as total_received,
             (SELECT COUNT(*) FROM lenders len WHERE len.client_id = c.id) as lender_count,
             (SELECT COUNT(*) FROM agreements ag WHERE ag.client_id = c.id) as agreement_count
      FROM clients c
      LEFT JOIN users u ON c.employee_id = u.id
      LEFT JOIN advocates a ON c.advocate_id = a.id
      WHERE 1=1
    `;
    const params = [];

    if (!scope.isAdmin) {
      sql += ` AND (c.manager_id = ? OR c.employee_id IN (${empInClause}))`;
      params.push(scope.managerId);
    }

    if (search) {
      sql += ` AND (c.name LIKE ? OR c.phone LIKE ? OR c.client_number LIKE ? OR c.city LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    if (case_status) {
      sql += ` AND (c.case_status = ? OR c.status = ?)`;
      params.push(case_status, case_status);
    }

    sql += ` ORDER BY c.created_at DESC LIMIT ? OFFSET ?`;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const rawClients = db.prepare(sql).all(...params);

    const clients = rawClients.map(c => {
      const sxFee = c.sx_fee || (c.total_debt * 0.1);
      return {
        ...c,
        pending_amount: Math.max(0, sxFee - c.total_received)
      };
    });

    const countSql = `SELECT COUNT(*) as total FROM clients c WHERE 1=1` +
      (!scope.isAdmin ? ` AND (c.manager_id = '${scope.managerId}' OR c.employee_id IN (${empInClause}))` : '') +
      (case_status ? ` AND (c.case_status = '${case_status}' OR c.status = '${case_status}')` : '');

    const total = db.prepare(countSql).get().total;

    res.json({
      clients,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch manager clients' });
  }
});

// Legal Manager / Admin Assigns / Changes Advocate on Client
router.patch('/clients/:clientId/advocate', authenticateToken, requireManagerOrAdmin, (req, res) => {
  try {
    const scope = getManagerScope(req);
    // Security check: Only Legal Manager or Admin can assign/change advocate
    if (!scope.isAdmin && scope.managerType !== 'LEGAL') {
      return res.status(403).json({ error: 'Forbidden: Only Legal / Advocate Managers can assign advocates' });
    }

    const { advocate_id, notes } = req.body;
    const client = db.prepare(`SELECT * FROM clients WHERE id = ?`).get(req.params.clientId);
    if (!client) return res.status(404).json({ error: 'Client not found' });

    let advocateName = 'Unassigned';
    let targetAdvId = advocate_id;
    if (advocate_id) {
      // Find advocate by id or advocate_id code
      const adv = db.prepare(`SELECT id, name FROM advocates WHERE id = ? OR advocate_id = ?`).get(advocate_id, advocate_id);
      if (adv) {
        advocateName = adv.name;
        targetAdvId = adv.id;
      }
    }

    const previousAdv = client.advocate_id
      ? db.prepare(`SELECT id, name FROM advocates WHERE id = ?`).get(client.advocate_id)
      : null;
    const previousAdvName = previousAdv ? previousAdv.name : 'None';

    // Update canonical Client record
    db.prepare(`UPDATE clients SET advocate_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(targetAdvId || null, client.id);

    // Save permanent Assignment History
    const historyId = 'aah-' + uuidv4().slice(0, 8);
    db.prepare(`
      INSERT INTO advocate_assignment_history (
        id, client_id, previous_advocate_id, previous_advocate_name,
        new_advocate_id, new_advocate_name, assigned_by_id, assigned_by_name,
        assigned_by_role, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      historyId,
      client.id,
      previousAdv ? previousAdv.id : null,
      previousAdvName,
      targetAdvId || null,
      advocateName,
      req.user.id,
      req.user.name,
      req.user.role,
      notes || null
    );

    logAudit(req, 'Advocate Assigned', 'Clients', client.id, {
      client: client.client_number,
      previousAdvocate: previousAdvName,
      newAdvocate: advocateName,
      changedBy: req.user.name,
      role: req.user.role,
      notes: notes || null
    });

    res.json({
      message: `Advocate ${advocateName} successfully assigned to client ${client.client_number}`,
      advocate_id: targetAdvId || null,
      advocate_name: advocateName
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to assign advocate' });
  }
});

// Get Advocate Assignment History for a Client
router.get('/clients/:clientId/advocate-history', authenticateToken, (req, res) => {
  try {
    const history = db.prepare(`
      SELECT aah.*
      FROM advocate_assignment_history aah
      WHERE aah.client_id = ?
      ORDER BY aah.rowid DESC
    `).all(req.params.clientId);

    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch advocate history' });
  }
});

// Finance Manager / Admin Updates Client Fee
router.patch('/clients/:clientId/fee', authenticateToken, requireManagerOrAdmin, (req, res) => {
  try {
    const scope = getManagerScope(req);
    if (!scope.isAdmin && scope.managerType !== 'FINANCE' && scope.managerType !== 'FIN') {
      return res.status(403).json({ error: 'Forbidden: Only Finance Managers or Admin can update client fees' });
    }

    const { sx_fee, fees_date, fees_status } = req.body;
    const client = db.prepare(`SELECT * FROM clients WHERE id = ?`).get(req.params.clientId);
    if (!client) return res.status(404).json({ error: 'Client not found' });

    db.prepare(`
      UPDATE clients SET
        sx_fee = COALESCE(?, sx_fee),
        fees_date = COALESCE(?, fees_date),
        fees_status = COALESCE(?, fees_status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      sx_fee !== undefined ? parseFloat(sx_fee) : null,
      fees_date,
      fees_status,
      client.id
    );

    logAudit(req, 'Fee Updated', 'Clients', client.id, {
      client: client.client_number,
      previousFee: client.sx_fee,
      newFee: sx_fee,
      changedBy: req.user.name
    });

    res.json({ message: 'Client fee details updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update client fee' });
  }
});

// ==========================================
// 6. FINANCE PAYMENT VERIFICATION QUEUE
// ==========================================
router.get('/payments/verification-queue', authenticateToken, requireManagerOrAdmin, (req, res) => {
  try {
    const scope = getManagerScope(req);
    // Security check: Only Finance Manager or Admin can access payment verification queue
    if (!scope.isAdmin && scope.managerType !== 'FINANCE' && scope.managerType !== 'FIN') {
      return res.status(403).json({ error: 'Forbidden: Finance Manager access required for payment verification queue' });
    }

    const payments = db.prepare(`
      SELECT p.*,
             c.name as client_name, c.client_number, c.phone as client_phone, c.sx_fee,
             u.name as employee_name
      FROM payments p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN users u ON c.employee_id = u.id
      ORDER BY p.created_at DESC
    `).all();

    res.json({ payments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load verification queue' });
  }
});

// Verify or Reject Payment
router.patch('/payments/:paymentId/verify', authenticateToken, requireManagerOrAdmin, (req, res) => {
  try {
    const scope = getManagerScope(req);
    if (!scope.isAdmin && scope.managerType !== 'FINANCE' && scope.managerType !== 'FIN') {
      return res.status(403).json({ error: 'Forbidden: Finance Manager access required to verify payments' });
    }

    const { status = 'verified', notes } = req.body;
    const payment = db.prepare(`SELECT * FROM payments WHERE id = ?`).get(req.params.paymentId);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    db.prepare(`
      UPDATE payments SET
        status = ?,
        verified_by = ?,
        verified_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, req.user.name, payment.id);

    // If verified, recalculate and mark client fees status if fully paid
    if (status === 'verified') {
      const client = db.prepare(`SELECT * FROM clients WHERE id = ?`).get(payment.client_id);
      if (client) {
        const sumRow = db.prepare(`SELECT SUM(amount) as total FROM payments WHERE client_id = ? AND status = 'verified'`).get(client.id);
        const totalVerified = sumRow ? sumRow.total : 0;
        const totalFee = client.sx_fee || (client.total_debt * 0.1);
        if (totalVerified >= totalFee && totalFee > 0) {
          db.prepare(`UPDATE clients SET fees_status = 'Paid', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(client.id);
        }
      }
    }

    logAudit(req, status === 'verified' ? 'Payment Verified' : 'Payment Rejected', 'Payments', payment.id, {
      receiptNumber: payment.receipt_number,
      amount: payment.amount,
      status,
      verifiedBy: req.user.name,
      notes
    });

    res.json({ message: `Payment ${payment.receipt_number} ${status} successfully` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update payment status' });
  }
});

// ==========================================
// 6. FINANCE & MANAGER PAYMENT MANAGEMENT
// ==========================================

// GET /api/manager/payments/clients — List clients with their monthly payment status
router.get('/payments/clients', authenticateToken, requireManagerOrAdmin, (req, res) => {
  try {
    const clients = db.prepare(`
      SELECT c.id, c.client_number, c.name, c.phone, c.email, c.city, c.total_debt,
             c.sx_fee, c.fees_date, c.fees_status, c.case_status, c.created_at,
             u.name as employee_name,
             a.id as agreement_id, a.agreement_number, a.resolution_duration, a.monthly_fee, a.total_fee as agreement_total_fee,
             COALESCE((SELECT SUM(received_amount) FROM monthly_payment_records m WHERE m.client_id = c.id), 0) as total_received,
             COALESCE((SELECT SUM(expected_amount) FROM monthly_payment_records m WHERE m.client_id = c.id), 
                      COALESCE(a.total_fee, c.sx_fee, 48000)) as total_agreement_fee
      FROM clients c
      LEFT JOIN users u ON c.employee_id = u.id
      LEFT JOIN (
        SELECT * FROM agreements WHERE id IN (SELECT MAX(id) FROM agreements GROUP BY client_id)
      ) a ON a.client_id = c.id
      ORDER BY c.created_at DESC
    `).all();

    const formatted = clients.map((c) => {
      const duration = c.resolution_duration || '6 Months';
      const durMatch = duration.match(/(\d+)/);
      const months = durMatch ? parseInt(durMatch[1], 10) : 6;
      const monthlyFee = (c.monthly_fee && c.monthly_fee > 0)
        ? c.monthly_fee
        : (c.total_agreement_fee && months > 0 ? (c.total_agreement_fee / months) : 8000);
      const totalAgrFee = c.total_agreement_fee || (monthlyFee * months);
      const totalRec = c.total_received || 0;
      const pendingAmt = Math.max(0, totalAgrFee - totalRec);

      return {
        ...c,
        monthly_fee: monthlyFee,
        duration_months: months,
        total_agreement_fee: totalAgrFee,
        total_received: totalRec,
        pending_amount: pendingAmt,
        fees_status: totalRec >= totalAgrFee && totalAgrFee > 0 ? 'Paid' : totalRec > 0 ? 'Partially Paid' : 'Pending'
      };
    });

    res.json({ clients: formatted });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load clients payment management list' });
  }
});

// GET /api/manager/clients/:id/monthly-payments — Get client payment schedule & history
router.get('/clients/:id/monthly-payments', authenticateToken, requireManagerOrAdmin, (req, res) => {
  try {
    const client = db.prepare(`
      SELECT c.*, u.name as employee_name, adv.name as advocate_name
      FROM clients c
      LEFT JOIN users u ON c.employee_id = u.id
      LEFT JOIN advocates adv ON c.advocate_id = adv.id
      WHERE c.id = ?
    `).get(req.params.id);

    if (!client) return res.status(404).json({ error: 'Client not found' });

    const agreement = db.prepare(`
      SELECT * FROM agreements WHERE client_id = ? ORDER BY created_at DESC LIMIT 1
    `).get(client.id);

    let records = db.prepare(`
      SELECT * FROM monthly_payment_records WHERE client_id = ? ORDER BY month_number ASC
    `).all(client.id);

    // Auto-generate if not yet generated
    if (!records || records.length === 0) {
      const durStr = agreement?.resolution_duration || '6 Months';
      const durMatch = durStr.match(/(\d+)/);
      const durNum = durMatch ? parseInt(durMatch[1], 10) : 6;
      const monthlyFee = (agreement?.monthly_fee && agreement.monthly_fee > 0)
        ? agreement.monthly_fee
        : (agreement?.total_fee && durNum > 0 ? (agreement.total_fee / durNum) : 8000);

      const baseDate = new Date(agreement?.start_date || agreement?.created_at || '2026-08-01');
      const insertStmt = db.prepare(`
        INSERT INTO monthly_payment_records (
          id, client_id, agreement_id, month_number, due_date, expected_amount, received_amount, payment_status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 0, 'Pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `);

      for (let i = 0; i < durNum; i++) {
        const d = new Date(baseDate);
        d.setMonth(baseDate.getMonth() + i);
        const dueDateStr = d.toISOString().split('T')[0];
        const recId = 'mpr-' + (client.id.slice(-6)) + '-m' + (i + 1) + '-' + uuidv4().slice(0, 4);
        insertStmt.run(recId, client.id, agreement?.id || null, i + 1, dueDateStr, monthlyFee);
      }

      records = db.prepare(`
        SELECT * FROM monthly_payment_records WHERE client_id = ? ORDER BY month_number ASC
      `).all(client.id);
    }

    const totalMonths = records.length;
    const monthlyFee = records[0]?.expected_amount || agreement?.monthly_fee || 8000;
    const totalAgreementFee = records.reduce((acc, r) => acc + (r.expected_amount || 0), 0);
    const totalReceived = records.reduce((acc, r) => acc + (r.received_amount || 0), 0);
    const totalPending = Math.max(0, totalAgreementFee - totalReceived);

    const mappedRecords = records.map(r => ({
      ...r,
      pending_amount: Math.max(0, (r.expected_amount || 0) - (r.received_amount || 0)),
      payment_status: r.payment_status || (r.received_amount >= r.expected_amount && r.expected_amount > 0 ? 'Paid' : r.received_amount > 0 ? 'Partially Paid' : 'Pending')
    }));

    const history = db.prepare(`
      SELECT * FROM monthly_payment_history WHERE client_id = ? ORDER BY created_at DESC
    `).all(client.id);

    res.json({
      client,
      agreement,
      summary: {
        monthly_fee: monthlyFee,
        agreement_duration: agreement?.resolution_duration || `${totalMonths} Months`,
        duration_months: totalMonths,
        total_agreement_fee: totalAgreementFee,
        total_received: totalReceived,
        total_pending: totalPending,
        fees_status: totalReceived >= totalAgreementFee && totalAgreementFee > 0 ? 'Paid' : totalReceived > 0 ? 'Partially Paid' : 'Pending'
      },
      records: mappedRecords,
      history
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch manager client monthly payments' });
  }
});


// ==========================================
// 7. LEGAL ADVOCATES DIRECTORY
// ==========================================
router.get('/advocates', authenticateToken, requireManagerOrAdmin, (req, res) => {
  try {
    const advocates = db.prepare(`
      SELECT a.*,
             (SELECT COUNT(*) FROM clients c WHERE c.advocate_id = a.id) as assigned_clients_count
      FROM advocates a
      ORDER BY a.name ASC
    `).all();

    res.json({ advocates });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load advocates directory' });
  }
});

// ==========================================
// 8. FOLLOW-UPS MONITORING
// ==========================================
router.get('/follow-ups', authenticateToken, requireManagerOrAdmin, (req, res) => {
  try {
    const scope = getManagerScope(req);
    const { filter = 'all', employee_id } = req.query;
    const empIds = scope.employeeIds;
    const empInClause = empIds.length > 0 ? empIds.map(id => `'${id}'`).join(',') : `''`;

    let sql = `
      SELECT f.*,
             l.lead_number, l.name as lead_name, l.phone as lead_phone, l.city as lead_city,
             l.total_debt, l.status as lead_status,
             u.name as employee_name
      FROM follow_ups f
      JOIN leads l ON f.lead_id = l.id
      LEFT JOIN users u ON f.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (!scope.isAdmin) {
      sql += ` AND (l.manager_id = ? OR l.employee_id IN (${empInClause}) OR l.department_id = ?)`;
      params.push(scope.managerId, scope.departmentId);
    }

    if (employee_id) {
      sql += ` AND f.user_id = ?`;
      params.push(employee_id);
    }

    const today = new Date().toISOString().split('T')[0];

    if (filter === 'today') {
      sql += ` AND date(f.next_follow_up_date) = date('now')`;
    } else if (filter === 'tomorrow') {
      sql += ` AND date(f.next_follow_up_date) = date('now', '+1 day')`;
    } else if (filter === 'overdue') {
      sql += ` AND date(f.next_follow_up_date) < date('now') AND l.status != 'converted' AND l.status != 'not_interested'`;
    } else if (filter === 'upcoming') {
      sql += ` AND date(f.next_follow_up_date) > date('now')`;
    }

    sql += ` ORDER BY f.created_at DESC LIMIT 100`;
    const followUps = db.prepare(sql).all(...params);

    res.json({ followUps });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch team follow ups' });
  }
});

// ==========================================
// 9. MANAGER TASKS
// ==========================================
router.get('/tasks', authenticateToken, requireManagerOrAdmin, (req, res) => {
  try {
    const scope = getManagerScope(req);
    const empIds = scope.employeeIds;
    const empInClause = empIds.length > 0 ? empIds.map(id => `'${id}'`).join(',') : `''`;

    let sql = `
      SELECT t.*, u.name as assigned_to_name, u.emp_or_mgr_id as assigned_to_code
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE 1=1
    `;

    if (!scope.isAdmin) {
      sql += ` AND (t.assigned_to IN (${empInClause}) OR t.created_by = '${req.user.name}')`;
    }

    sql += ` ORDER BY t.created_at DESC LIMIT 100`;
    const tasks = db.prepare(sql).all();

    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch manager tasks' });
  }
});

router.post('/tasks', authenticateToken, requireManagerOrAdmin, (req, res) => {
  try {
    const scope = getManagerScope(req);
    const { title, description, assigned_to, priority = 'medium', due_date, module = 'General' } = req.body;
    if (!title) return res.status(400).json({ error: 'Task title is required' });

    if (assigned_to && !scope.isAdmin) {
      const emp = db.prepare(`SELECT * FROM users WHERE id = ?`).get(assigned_to);
      if (emp && emp.manager_id !== scope.managerId && emp.department_id !== scope.departmentId) {
        return res.status(403).json({ error: 'Forbidden: You can only assign tasks to employees in your team' });
      }
    }

    const taskId = 'task-' + uuidv4().slice(0, 8);

    db.prepare(`
      INSERT INTO tasks (id, title, description, module, priority, due_date, status, assigned_to, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, CURRENT_TIMESTAMP)
    `).run(taskId, title, description || null, module, priority, due_date || null, assigned_to || null, req.user.name);

    logAudit(req, 'Task Created', 'Tasks', taskId, { title, assigned_to });
    res.status(201).json({ message: 'Task queued successfully', id: taskId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// ==========================================
// 10. MANAGER ACTIVITY LOG STREAM
// ==========================================
router.get('/activity', authenticateToken, requireManagerOrAdmin, (req, res) => {
  try {
    const scope = getManagerScope(req);
    const empIds = scope.employeeIds;
    const empInClause = empIds.length > 0 ? empIds.map(id => `'${id}'`).join(',') : `''`;

    let sql = `
      SELECT a.* FROM audit_logs a
      WHERE 1=1
    `;

    if (!scope.isAdmin) {
      sql += ` AND (a.user_id = '${scope.managerId}' OR a.user_id IN (${empInClause}) OR a.module = '${scope.managerType}')`;
    }

    sql += ` ORDER BY a.created_at DESC LIMIT 100`;
    const logs = db.prepare(sql).all();

    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load manager activity feed' });
  }
});

module.exports = router;
