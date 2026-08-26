const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// GET /api/audit-logs
router.get('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { search, module, role, date, from_date, to_date, limit = 100, offset = 0 } = req.query;

    const cleanParam = (v) => (v && typeof v === 'string' && v !== 'undefined' && v !== 'null' && v.trim() !== '') ? v.trim() : null;
    const cleanSearch = cleanParam(search);
    const cleanModule = cleanParam(module);
    const cleanRole = cleanParam(role);
    const cleanDate = cleanParam(date);
    const cleanFromDate = cleanParam(from_date);
    const cleanToDate = cleanParam(to_date);

    let sql = `SELECT * FROM audit_logs WHERE 1=1`;
    const params = [];

    if (cleanSearch) {
      sql += ` AND (user_name LIKE ? OR action LIKE ? OR module LIKE ? OR record_id LIKE ? OR details_json LIKE ?)`;
      const s = `%${cleanSearch}%`;
      params.push(s, s, s, s, s);
    }

    if (cleanModule && cleanModule !== 'all') {
      sql += ` AND module = ?`;
      params.push(cleanModule);
    }

    if (cleanRole && cleanRole !== 'all') {
      sql += ` AND role = ?`;
      params.push(cleanRole);
    }

    if (cleanFromDate && cleanToDate) {
      sql += ` AND date(created_at) >= date(?) AND date(created_at) <= date(?)`;
      params.push(cleanFromDate, cleanToDate);
    } else if (cleanFromDate) {
      sql += ` AND date(created_at) >= date(?)`;
      params.push(cleanFromDate);
    } else if (cleanToDate) {
      sql += ` AND date(created_at) <= date(?)`;
      params.push(cleanToDate);
    } else if (cleanDate) {
      sql += ` AND date(created_at) = date(?)`;
      params.push(cleanDate);
    }

    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const logs = db.prepare(sql).all(...params);

    let countSql = `SELECT COUNT(*) as total FROM audit_logs WHERE 1=1` + 
      ((cleanModule && cleanModule !== 'all') ? ` AND module = '${cleanModule}'` : '') +
      ((cleanRole && cleanRole !== 'all') ? ` AND role = '${cleanRole}'` : '') +
      ((cleanFromDate && cleanToDate) ? ` AND date(created_at) >= date('${cleanFromDate}') AND date(created_at) <= date('${cleanToDate}')` : '') +
      (cleanDate ? ` AND date(created_at) = date('${cleanDate}')` : '');

    const totalCount = db.prepare(countSql).get().total;

    res.json({ logs, total: totalCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

module.exports = router;
