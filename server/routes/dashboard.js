const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// GET /api/dashboard/stats
router.get('/stats', authenticateToken, requireAdmin, (req, res) => {
  try {
    // 1. Organization & CRM Totals
    const totalManagers = db.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'manager'`).get().count;
    const totalEmployees = db.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'employee'`).get().count;
    const totalAdvocates = db.prepare(`SELECT COUNT(*) as count FROM advocates`).get().count;
    const totalLeads = db.prepare(`SELECT COUNT(*) as count FROM leads`).get().count;
    const totalClients = db.prepare(`SELECT COUNT(*) as count FROM clients`).get().count;
    const totalAgreements = db.prepare(`SELECT COUNT(*) as count FROM agreements`).get().count;

    // 2. Finance Highlights
    const totalFeesRow = db.prepare(`SELECT COALESCE(SUM(total_fee), 0) as total FROM agreements`).get();
    const totalReceivedRow = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'verified'`).get();
    const pendingVerificationCount = db.prepare(`SELECT COUNT(*) as count FROM payments WHERE status = 'pending_verification'`).get().count;
    const pendingVerificationAmt = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'pending_verification'`).get().total;

    const totalFees = totalFeesRow.total;
    const totalReceived = totalReceivedRow.total;
    const totalPending = Math.max(0, totalFees - totalReceived);

    // 3. Operations Highlights
    const pendingTasks = db.prepare(`SELECT COUNT(*) as count FROM tasks WHERE status != 'completed'`).get().count;
    const pendingAgreements = db.prepare(`SELECT COUNT(*) as count FROM agreements WHERE status = 'pending'`).get().count;
    const todayFollowups = db.prepare(`SELECT COUNT(*) as count FROM tasks WHERE status != 'completed' AND (due_date <= date('now') OR due_date IS NULL)`).get().count;

    // 4. Manager Overview
    const managerOverview = db.prepare(`
      SELECT 
        u.id, 
        u.name, 
        u.emp_or_mgr_id, 
        u.status,
        COALESCE(mt.name, 'General') as manager_type,
        COALESCE(d.name, 'Unassigned') as department_name,
        (SELECT COUNT(*) FROM users e WHERE e.manager_id = u.id AND e.role = 'employee') as employee_count,
        (SELECT COUNT(*) FROM leads l WHERE l.manager_id = u.id) as lead_count,
        (SELECT COUNT(*) FROM clients c WHERE c.manager_id = u.id) as client_count
      FROM users u
      LEFT JOIN manager_types mt ON u.manager_type_id = mt.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.role = 'manager'
      ORDER BY employee_count DESC, u.name ASC
    `).all();

    // 5. Recent Leads
    const recentLeads = db.prepare(`
      SELECT l.id, l.lead_number, l.name, l.phone, l.loan_amount, l.bank_name, l.status, l.created_at,
             u.name as manager_name
      FROM leads l
      LEFT JOIN users u ON l.manager_id = u.id
      ORDER BY l.created_at DESC LIMIT 5
    `).all();

    // 6. Recent Clients
    const recentClients = db.prepare(`
      SELECT c.id, c.client_number, c.name, c.phone, c.total_debt, c.settlement_target, c.status, c.created_at,
             fp.name as fee_plan_name, u.name as manager_name
      FROM clients c
      LEFT JOIN fee_plans fp ON c.fee_plan_id = fp.id
      LEFT JOIN users u ON c.manager_id = u.id
      ORDER BY c.created_at DESC LIMIT 5
    `).all();

    // 7. Recent Payments
    const recentPayments = db.prepare(`
      SELECT p.id, p.receipt_number, p.amount, p.payment_method, p.transaction_id, p.status, p.payment_date, p.created_at,
             c.name as client_name
      FROM payments p
      LEFT JOIN clients c ON p.client_id = c.id
      ORDER BY p.created_at DESC LIMIT 5
    `).all();

    // 8. Recent Audit Activity
    const recentActivity = db.prepare(`
      SELECT id, user_name, role, action, module, record_id, details_json, created_at
      FROM audit_logs
      ORDER BY created_at DESC LIMIT 8
    `).all();

    res.json({
      counts: {
        totalManagers,
        totalEmployees,
        totalAdvocates,
        totalLeads,
        totalClients,
        totalAgreements
      },
      finance: {
        totalFees,
        totalReceived,
        totalPending,
        pendingVerificationCount,
        pendingVerificationAmt
      },
      operations: {
        todayFollowups,
        pendingTasks,
        pendingAgreements
      },
      managerOverview,
      recentLeads,
      recentClients,
      recentPayments,
      recentActivity
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to generate dashboard metrics' });
  }
});

module.exports = router;
