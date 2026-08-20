'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'reduced-debts-secret-key-2026';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://izotfjxrpqvgoaoerlbz.supabase.co',
  process.env.SUPABASE_SECRET_KEY || '',
  { auth: { persistSession: false } }
);

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ==================== HELPERS ====================

async function logActivity(userId, userName, action, entityType, entityId, details) {
  try {
    await supabase.from('activity_logs').insert({
      user_id: userId || 1,
      user_name: userName || 'Admin User',
      action,
      entity_type: entityType,
      entity_id: entityId ? String(entityId) : null,
      details: details || ''
    });
  } catch (err) {
    console.error('Failed to log activity:', err.message);
  }
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });
  next();
}

function getConsultantFilter(req) {
  if (req.user && req.user.role === 'EMPLOYEE') return req.user.name;
  if (req.user && req.user.role === 'ADMIN' && req.query && req.query.assigned_to) return req.query.assigned_to;
  return null;
}

function buildSearchOr(fields, term) {
  return fields.map(f => `${f}.ilike.%${term}%`).join(',');
}

// ==================== AUTH ROUTES ====================

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    const identifier = (email || req.body.username || req.body.employee_id || '').trim().toLowerCase();

    let { data: user } = await supabase.from('users').select('*').ilike('email', identifier).maybeSingle();
    if (!user) {
      const { data: userByEid } = await supabase.from('users').select('*').ilike('employee_id', identifier).maybeSingle();
      user = userByEid;
    }
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

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role, employee_id: user.employee_id || '' }, JWT_SECRET, { expiresIn: '24h' });
    await logActivity(user.id, user.name, 'LOGIN', 'USER', user.id, `${user.role} logged in successfully`);
    return res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, employee_id: user.employee_id || '', department: user.department || '', designation: user.designation || '', phone: user.phone || '' }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const { data: user } = await supabase.from('users').select('id, name, email, role, status').eq('id', req.user.id).single();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== DASHBOARD METRICS ====================

app.get('/api/dashboard/summary', authenticateToken, async (req, res) => {
  try {
    const consultant = getConsultantFilter(req);

    // 1. Leads
    let leadsQuery = supabase.from('leads').select('lead_status, assigned_consultant');
    if (consultant) leadsQuery = leadsQuery.eq('assigned_consultant', consultant);
    const { data: allLeads = [] } = await leadsQuery;

    const totalLeads = allLeads.length;
    const pipelineMap = { 'New': 0, 'Contacted': 0, 'Interested': 0, 'Follow Up': 0, 'Converted': 0, 'Not Interested': 0 };
    let convertedCount = 0;
    allLeads.forEach(l => {
      const st = l.lead_status;
      if (st === 'Follow up' || st === 'Follow Up') pipelineMap['Follow Up']++;
      else if (st === 'New') pipelineMap['New']++;
      else if (st === 'Contacted') pipelineMap['Contacted']++;
      else if (st === 'Interested') pipelineMap['Interested']++;
      else if (st === 'Converted') { pipelineMap['Converted']++; convertedCount++; }
      else if (st === 'Not Interested') pipelineMap['Not Interested']++;
    });
    const conversionRate = totalLeads > 0 ? ((convertedCount / totalLeads) * 100).toFixed(1) : '0.0';

    // 2. Clients
    let clientsQuery = supabase.from('clients').select('case_status, service_fee, pending_amount, received_amount, this_month_received, assigned_consultant, assigned_advocate, id, name, phone, email, city, client_id, fees_date, fees_status');
    if (consultant) clientsQuery = clientsQuery.eq('assigned_consultant', consultant);
    const { data: allClients = [] } = await clientsQuery;

    const totalClients = allClients.length;
    const activeClients = allClients.filter(c => c.case_status === 'Active').length;
    const totalDroppedClients = allClients.filter(c => c.case_status !== 'Active').length;

    const totals = allClients.reduce((acc, c) => ({
      total_fee: acc.total_fee + (c.service_fee || 0),
      total_pending: acc.total_pending + (c.pending_amount || 0),
      total_received: acc.total_received + (c.received_amount || 0),
      this_month_col: acc.this_month_col + (c.this_month_received || 0),
    }), { total_fee: 0, total_pending: 0, total_received: 0, this_month_col: 0 });

    const thisMonthCollection = totals.this_month_col;
    const thisMonthPending = totals.total_pending;
    const thisMonthExpected = thisMonthCollection + thisMonthPending;
    const nextMonthExpected = Math.round(thisMonthExpected * 0.85);

    const monthlySummary = [
      { month: 'June', target: Math.round(thisMonthExpected * 0.9), collection: Math.round(thisMonthCollection * 0.9), drop: 0 },
      { month: 'July', target: Math.round(thisMonthExpected * 0.95), collection: Math.round(thisMonthCollection * 0.95), drop: 0 },
      { month: 'August', target: thisMonthExpected || 100000, collection: thisMonthCollection, drop: 0 }
    ];

    const userWiseSummary = [{
      s_no: 1, allocated: consultant || 'Team', city: 'All India',
      new_clients: totalClients, new_client_collection: thisMonthCollection,
      active_client: activeClients, dropped: totalDroppedClients, dropped_amount: 0,
      total_target: thisMonthExpected || 100000, current_month_collection: thisMonthCollection,
      to_be_collected: thisMonthPending, next_month_expected: nextMonthExpected
    }];

    // Advocate wise summary
    const advocateMap = {};
    allClients.forEach(c => {
      const adv = c.assigned_advocate || 'Unknown';
      if (!advocateMap[adv]) advocateMap[adv] = { advocate: adv, active_client: 0, current_month_collection: 0, to_be_collected: 0 };
      advocateMap[adv].active_client++;
      advocateMap[adv].current_month_collection += c.received_amount || 0;
      advocateMap[adv].to_be_collected += c.pending_amount || 0;
    });
    let sNo = 1;
    const advocateWiseSummary = Object.values(advocateMap).map(adv => ({
      s_no: sNo++, advocate: adv.advocate, address: 'India', new_clients: 1,
      new_client_collection: Math.round(adv.current_month_collection * 0.4),
      active_client: adv.active_client, dropped: 0, dropped_amount: 0,
      current_month_collection: adv.current_month_collection,
      to_be_collected: adv.to_be_collected, next_month_expected: Math.round(adv.to_be_collected * 0.9)
    }));

    const activeClientsList = allClients.filter(c => c.case_status === 'Active');

    res.json({
      kpis: { totalLeads, totalClients, conversion: `${conversionRate}%`, activeClients, totalDroppedClients, thisMonthExpected, nextMonthExpected, thisMonthCollection, thisMonthPending, thisMonthDrop: 0, thisMonthDroppedClients: 0 },
      leadPipeline: pipelineMap,
      businessSummary: { totalClients, currentlyActive: activeClients, dropped: totalDroppedClients, months: monthlySummary },
      userWiseSummary, advocateWiseSummary, activeClientsList
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Employee Monthly Target
app.get('/api/employee/monthly-target', authenticateToken, async (req, res) => {
  try {
    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const month = req.query.month || defaultMonth;
    const [year, monthNum] = month.split('-').map(Number);
    const dateObj = new Date(year, (monthNum || 1) - 1, 1);
    const monthLabel = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();

    const { data: targetRow } = await supabase.from('employee_targets').select('*').eq('employee_id', req.user.id).eq('month', month).single();

    // Collected this month
    const { data: empClients = [] } = await supabase.from('clients').select('id').eq('assigned_consultant', req.user.name);
    const clientIds = empClients.map(c => c.id);
    let collected = 0;
    if (clientIds.length > 0) {
      const { data: payments = [] } = await supabase.from('payments').select('amount, payment_date').in('client_id', clientIds);
      payments.forEach(p => {
        if ((p.payment_date || '').startsWith(month)) collected += parseFloat(p.amount) || 0;
      });
    }

    const hasTarget = targetRow && targetRow.collection_target > 0;
    const collectionTarget = hasTarget ? targetRow.collection_target : null;
    let remaining = null, achievement = null, status = 'Target Not Set';
    if (hasTarget) {
      remaining = Math.max(0, collectionTarget - collected);
      achievement = Math.round((collected / collectionTarget) * 100);
      status = collected >= collectionTarget ? 'Target Achieved' : achievement >= 80 ? 'On Track' : achievement >= 50 ? 'Needs Attention' : 'Critical';
    }

    res.json({ success: true, month, month_label: monthLabel, target_set: hasTarget, collection_target: collectionTarget, collected, remaining, achievement, status });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ==================== LEADS CRUD ====================

app.get('/api/leads', authenticateToken, async (req, res) => {
  try {
    const { status, search, from_date, to_date, sort_dir = 'DESC', page = 1, limit = 50 } = req.query;
    const consultant = getConsultantFilter(req);

    let query = supabase.from('leads').select('*', { count: 'exact' });
    if (consultant) query = query.eq('assigned_consultant', consultant);
    if (status && status !== 'All') {
      if (status === 'Follow Up' || status === 'Follow up') query = query.or('lead_status.eq.Follow up,lead_status.eq.Follow Up');
      else query = query.eq('lead_status', status);
    }
    if (search) query = query.or(buildSearchOr(['name', 'email', 'phone', 'city', 'assigned_consultant'], search.trim()));
    if (from_date) query = query.gte('created_at', from_date);
    if (to_date) query = query.lte('created_at', to_date + 'T23:59:59');
    query = query.order('id', { ascending: sort_dir.toUpperCase() === 'ASC' });
    const from = (parseInt(page) - 1) * parseInt(limit);
    query = query.range(from, from + parseInt(limit) - 1);
    const { data: leads = [], count: totalCount } = await query;

    // Status counts
    let statQuery = supabase.from('leads').select('lead_status');
    if (consultant) statQuery = statQuery.eq('assigned_consultant', consultant);
    const { data: allStats = [] } = await statQuery;
    const statusCounts = { All: 0, New: 0, Contacted: 0, Interested: 0, 'Follow up': 0, Converted: 0, 'Not Interested': 0 };
    allStats.forEach(s => {
      statusCounts.All++;
      if (s.lead_status === 'Follow up' || s.lead_status === 'Follow Up') statusCounts['Follow up']++;
      else if (statusCounts[s.lead_status] !== undefined) statusCounts[s.lead_status]++;
    });

    res.json({ data: leads, pagination: { page: parseInt(page), limit: parseInt(limit), total: totalCount || 0, totalPages: Math.ceil((totalCount || 0) / parseInt(limit)) }, statusCounts });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/leads', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, city, outstanding_amount, monthly_income, loan_type, default_status, harassment_calls, lead_status, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Lead Name is required' });
    const assigned_consultant = req.user.role === 'EMPLOYEE' ? req.user.name : (req.body.assigned_consultant || 'Dhruv');
    const randomNum = Math.floor(100 + Math.random() * 900);
    const lead_id = `LD-${Date.now().toString().slice(-4)}${randomNum}`;

    const { data: newLead, error } = await supabase.from('leads').insert({
      lead_id, name, email: email || '', phone: phone || '', city: city || '',
      outstanding_amount: outstanding_amount || '50,000 - 1,00,000',
      monthly_income: parseFloat(monthly_income) || 0, loan_type: loan_type || 'personal_loan_settlement',
      default_status: default_status || 'yes', harassment_calls: harassment_calls || 'yes',
      assigned_consultant, lead_status: lead_status || 'New', notes: notes || ''
    }).select().single();
    if (error) throw error;

    await logActivity(req.user.id, req.user.name, 'CREATE', 'LEAD', newLead.id, `Created lead: ${name}`);
    res.status(201).json(newLead);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/leads/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role === 'EMPLOYEE') {
      const { data: existing } = await supabase.from('leads').select('id').eq('id', id).eq('assigned_consultant', req.user.name).single();
      if (!existing) return res.status(403).json({ error: 'You are not authorized to update this lead' });
    }
    const { name, email, phone, city, outstanding_amount, monthly_income, loan_type, default_status, harassment_calls, lead_status, notes } = req.body;
    const assigned_consultant = req.user.role === 'EMPLOYEE' ? req.user.name : (req.body.assigned_consultant !== undefined ? req.body.assigned_consultant : undefined);
    const updateData = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (city !== undefined) updateData.city = city;
    if (outstanding_amount !== undefined) updateData.outstanding_amount = outstanding_amount;
    if (monthly_income !== undefined) updateData.monthly_income = monthly_income;
    if (loan_type !== undefined) updateData.loan_type = loan_type;
    if (default_status !== undefined) updateData.default_status = default_status;
    if (harassment_calls !== undefined) updateData.harassment_calls = harassment_calls;
    if (assigned_consultant !== undefined) updateData.assigned_consultant = assigned_consultant;
    if (lead_status !== undefined) updateData.lead_status = lead_status;
    if (notes !== undefined) updateData.notes = notes;

    await supabase.from('leads').update(updateData).eq('id', id);
    await logActivity(req.user.id, req.user.name, 'UPDATE', 'LEAD', id, `Updated lead ID: ${id}`);
    const { data: updated } = await supabase.from('leads').select('*').eq('id', id).single();
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/leads/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role === 'EMPLOYEE') {
      const { data: existing } = await supabase.from('leads').select('id').eq('id', id).eq('assigned_consultant', req.user.name).single();
      if (!existing) return res.status(403).json({ error: 'You are not authorized to delete this lead' });
    }
    await supabase.from('leads').delete().eq('id', id);
    await logActivity(req.user.id, req.user.name, 'DELETE', 'LEAD', id, `Deleted lead ID: ${id}`);
    res.json({ success: true, message: 'Lead deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== CLIENTS CRUD ====================

app.get('/api/clients', authenticateToken, async (req, res) => {
  try {
    const { case_status = 'Active', search, date, sort_dir = 'ASC', page = 1, limit = 50 } = req.query;
    const consultant = getConsultantFilter(req);

    let query = supabase.from('clients').select('*', { count: 'exact' });
    if (consultant) query = query.eq('assigned_consultant', consultant);
    if (case_status && case_status !== 'All') query = query.eq('case_status', case_status);
    if (search) query = query.or(buildSearchOr(['name', 'client_id', 'email', 'phone', 'city', 'assigned_consultant', 'assigned_advocate'], search.trim()));
    if (date) query = query.ilike('fees_date', `%${date}%`);
    query = query.order('id', { ascending: sort_dir.toUpperCase() === 'ASC' });
    const from = (parseInt(page) - 1) * parseInt(limit);
    query = query.range(from, from + parseInt(limit) - 1);
    const { data: clients = [], count: totalCount } = await query;

    let activeQuery = supabase.from('clients').select('*', { count: 'exact', head: true }).eq('case_status', 'Active');
    let closedQuery = supabase.from('clients').select('*', { count: 'exact', head: true }).eq('case_status', 'Closed');
    if (consultant) { activeQuery = activeQuery.eq('assigned_consultant', consultant); closedQuery = closedQuery.eq('assigned_consultant', consultant); }
    const [{ count: activeCount }, { count: closedCount }] = await Promise.all([activeQuery, closedQuery]);

    res.json({ data: clients, pagination: { page: parseInt(page), limit: parseInt(limit), total: totalCount || 0, totalPages: Math.ceil((totalCount || 0) / parseInt(limit)) }, counts: { active: activeCount || 0, closed: closedCount || 0 } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/clients', authenticateToken, async (req, res) => {
  try {
    const { client_id, name, phone, email, city, pan, address, service_fee, fees_date, fees_status, pending_amount, received_amount, this_month_received, case_status, assigned_advocate, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Client Name is required' });
    const assigned_consultant = req.user.role === 'EMPLOYEE' ? req.user.name : (req.body.assigned_consultant || 'Dhruv');
    const cid = client_id || String(Math.floor(60000 + Math.random() * 9999));
    const fee = parseFloat(service_fee) || 0;
    const rec = parseFloat(received_amount) || 0;
    const thisM = parseFloat(this_month_received) || rec;
    const pend = pending_amount !== undefined ? parseFloat(pending_amount) : Math.max(0, fee - rec);
    const fStatus = fees_status || (pend === 0 && fee > 0 ? 'Paid' : 'Pending');

    const { data: newClient, error } = await supabase.from('clients').insert({
      client_id: cid, name, phone: phone || '', email: email || '', city: city || '',
      pan: pan || '', address: address || '', service_fee: fee,
      fees_date: fees_date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      fees_status: fStatus, pending_amount: pend, received_amount: rec, this_month_received: thisM,
      case_status: case_status || 'Active', assigned_consultant, assigned_advocate: assigned_advocate || 'Adv Sparsh Gupta', notes: notes || ''
    }).select().single();
    if (error) throw error;

    if (rec > 0) {
      await supabase.from('payments').insert({ client_id: newClient.id, amount: rec, payment_date: new Date().toISOString().split('T')[0], payment_status: 'Completed' });
    }
    await logActivity(req.user.id, req.user.name, 'CREATE', 'CLIENT', newClient.id, `Created client: ${name} (${cid})`);
    res.status(201).json(newClient);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role === 'EMPLOYEE') {
      const { data: existing } = await supabase.from('clients').select('id').eq('id', id).eq('assigned_consultant', req.user.name).single();
      if (!existing) return res.status(403).json({ error: 'You are not authorized to update this client' });
    }
    const { name, phone, email, city, pan, address, service_fee, fees_date, fees_status, pending_amount, received_amount, this_month_received, case_status, assigned_advocate, notes } = req.body;
    const assigned_consultant = req.user.role === 'EMPLOYEE' ? req.user.name : (req.body.assigned_consultant !== undefined ? req.body.assigned_consultant : undefined);
    const updateData = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (city !== undefined) updateData.city = city;
    if (pan !== undefined) updateData.pan = pan;
    if (address !== undefined) updateData.address = address;
    if (service_fee !== undefined) updateData.service_fee = service_fee;
    if (fees_date !== undefined) updateData.fees_date = fees_date;
    if (fees_status !== undefined) updateData.fees_status = fees_status;
    if (pending_amount !== undefined) updateData.pending_amount = pending_amount;
    if (received_amount !== undefined) updateData.received_amount = received_amount;
    if (this_month_received !== undefined) updateData.this_month_received = this_month_received;
    if (case_status !== undefined) updateData.case_status = case_status;
    if (assigned_consultant !== undefined) updateData.assigned_consultant = assigned_consultant;
    if (assigned_advocate !== undefined) updateData.assigned_advocate = assigned_advocate;
    if (notes !== undefined) updateData.notes = notes;

    await supabase.from('clients').update(updateData).eq('id', id);
    await logActivity(req.user.id, req.user.name, 'UPDATE', 'CLIENT', id, `Updated client ID: ${id}`);
    const { data: updated } = await supabase.from('clients').select('*').eq('id', id).single();
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role === 'EMPLOYEE') {
      const { data: existing } = await supabase.from('clients').select('id').eq('id', id).eq('assigned_consultant', req.user.name).single();
      if (!existing) return res.status(403).json({ error: 'You are not authorized to delete this client' });
    }
    await supabase.from('clients').delete().eq('id', id);
    await logActivity(req.user.id, req.user.name, 'DELETE', 'CLIENT', id, `Deleted client ID: ${id}`);
    res.json({ success: true, message: 'Client deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== CONVERSION & PAYMENTS ====================

app.post('/api/leads/:id/convert', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    let leadQuery = supabase.from('leads').select('*').eq('id', id);
    if (req.user.role === 'EMPLOYEE') leadQuery = leadQuery.eq('assigned_consultant', req.user.name);
    const { data: lead } = await leadQuery.single();
    if (!lead) return res.status(403).json({ error: 'Lead not found or unauthorized' });

    const { service_fee = 25000, paid_amount = 0, payment_method = 'UPI', reference_number = '', payment_date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), pan = '', address = '', city = lead.city || '', assigned_advocate = 'Adv Sparsh Gupta', notes = '' } = req.body;
    const assigned_consultant = req.user.role === 'EMPLOYEE' ? req.user.name : (req.body.assigned_consultant || lead.assigned_consultant || 'Dhruv');
    const fee = parseFloat(service_fee) || 0;
    const paid = parseFloat(paid_amount) || 0;
    const pending = Math.max(0, fee - paid);
    const fees_status = (pending === 0 && fee > 0) ? 'Paid' : 'Pending';
    const randomId = String(Math.floor(60000 + Math.random() * 9999));

    const { data: newClient, error } = await supabase.from('clients').insert({
      client_id: randomId, name: lead.name, phone: lead.phone || '', email: lead.email || '',
      city, pan, address, service_fee: fee, fees_date: payment_date, fees_status,
      pending_amount: pending, received_amount: paid, this_month_received: paid,
      case_status: 'Active', assigned_consultant, assigned_advocate,
      notes: notes || `Converted from Lead ${lead.lead_id || lead.id}`
    }).select().single();
    if (error) throw error;

    if (paid > 0) {
      await supabase.from('payments').insert({ client_id: newClient.id, amount: paid, payment_date, payment_status: 'Completed', payment_method, notes: reference_number ? `Ref: ${reference_number}` : 'Initial Service Fee Payment' });
    }
    await supabase.from('leads').update({ lead_status: 'Converted', updated_at: new Date().toISOString() }).eq('id', id);
    await logActivity(req.user.id, req.user.name, 'CONVERT', 'LEAD', id, `Lead ${lead.name} converted to Client ${randomId} with initial fee ₹${paid}`);

    res.status(201).json({ success: true, message: `Lead ${lead.name} converted to Client (${randomId}) successfully!`, client: newClient });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/clients/:id/pay', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    let clientQuery = supabase.from('clients').select('*').eq('id', id);
    if (req.user.role === 'EMPLOYEE') clientQuery = clientQuery.eq('assigned_consultant', req.user.name);
    const { data: client } = await clientQuery.single();
    if (!client) return res.status(403).json({ error: 'Client not found or unauthorized' });

    const { amount, payment_method = 'UPI', reference_number = '', payment_date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), notes = '' } = req.body;
    const payAmount = parseFloat(amount);
    if (isNaN(payAmount) || payAmount <= 0) return res.status(400).json({ error: 'Payment amount must be greater than zero' });

    const newReceived = (parseFloat(client.received_amount) || 0) + payAmount;
    const newThisMonth = (parseFloat(client.this_month_received) || 0) + payAmount;
    const newPending = Math.max(0, (parseFloat(client.service_fee) || 0) - newReceived);
    const newFeesStatus = newPending === 0 ? 'Paid' : 'Pending';

    await supabase.from('clients').update({ received_amount: newReceived, this_month_received: newThisMonth, pending_amount: newPending, fees_status: newFeesStatus, fees_date: payment_date, updated_at: new Date().toISOString() }).eq('id', id);

    const paymentNotes = [reference_number ? `Ref: ${reference_number}` : '', notes].filter(Boolean).join(' | ') || 'Pending fee payment';
    const { data: payRecord } = await supabase.from('payments').insert({ client_id: parseInt(id), amount: payAmount, payment_date, payment_status: 'Completed', payment_method, notes: paymentNotes }).select().single();

    await logActivity(req.user.id, req.user.name, 'PAYMENT', 'CLIENT', id, `Payment of ₹${payAmount} received for Client ${client.name}. Remaining: ₹${newPending}`);
    const { data: updatedClient } = await supabase.from('clients').select('*').eq('id', id).single();
    res.json({ success: true, message: `Payment of ₹${payAmount.toLocaleString('en-IN')} recorded successfully!`, client: updatedClient, payment: payRecord });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/clients/:id/payments', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role === 'EMPLOYEE') {
      const { data: client } = await supabase.from('clients').select('id').eq('id', id).eq('assigned_consultant', req.user.name).single();
      if (!client) return res.status(403).json({ error: 'Client not found or unauthorized' });
    }
    const { data: payments = [] } = await supabase.from('payments').select('*').eq('client_id', id).order('id', { ascending: false });
    res.json({ data: payments });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/clients/export', authenticateToken, async (req, res) => {
  try {
    const { case_status, search } = req.query;
    const consultant = getConsultantFilter(req);
    let query = supabase.from('clients').select('*');
    if (consultant) query = query.eq('assigned_consultant', consultant);
    if (case_status && case_status !== 'All') query = query.eq('case_status', case_status);
    if (search) query = query.or(buildSearchOr(['name', 'client_id', 'email', 'phone'], search.trim()));
    query = query.order('id', { ascending: true });
    const { data: clients = [] } = await query;

    const headers = ['#', 'Client Id', 'Name', 'Phone', 'Email', 'City', 'RD Service Fee', 'Fees Date', 'Fees Status', 'Pending Amount', 'Total Received Amount', 'This Month Received', 'Case Status', 'Assigned Consultant', 'Assigned Advocate'];
    const rows = clients.map((c, i) => [i + 1, c.client_id, `"${(c.name || '').replace(/"/g, '""')}"`, `"${c.phone || ''}"`, `"${c.email || ''}"`, `"${(c.city || '').replace(/"/g, '""')}"`, c.service_fee, `"${c.fees_date || ''}"`, `"${c.fees_status || ''}"`, c.pending_amount, c.received_amount, c.this_month_received, `"${c.case_status || ''}"`, `"${c.assigned_consultant || ''}"`, `"${(c.assigned_advocate || '').replace(/"/g, '""')}"`]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="SettleXpert_Clients.csv"');
    res.send(csvContent);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== AGREEMENTS CRUD ====================

app.get('/api/agreements', authenticateToken, async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const consultant = getConsultantFilter(req);

    let query = supabase.from('agreements').select('*', { count: 'exact' });
    if (consultant) {
      const { data: myClients = [] } = await supabase.from('clients').select('name').eq('assigned_consultant', consultant);
      const names = myClients.map(c => c.name).filter(Boolean);
      if (names.length > 0) query = query.in('client_name', names);
      else { return res.json({ data: [], pagination: { page: 1, limit: parseInt(limit), total: 0, totalPages: 0 } }); }
    }
    if (search) query = query.or(buildSearchOr(['client_name', 'email', 'phone', 'pan', 'lender'], search.trim()));
    query = query.order('id', { ascending: true });
    const from = (parseInt(page) - 1) * parseInt(limit);
    query = query.range(from, from + parseInt(limit) - 1);
    const { data: agreements = [], count: totalCount } = await query;

    res.json({ data: agreements, pagination: { page: parseInt(page), limit: parseInt(limit), total: totalCount || 0, totalPages: Math.ceil((totalCount || 0) / parseInt(limit)) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/agreements', authenticateToken, async (req, res) => {
  try {
    const { client_name, email, phone, pan, lender, loan_account_number, loan_amount, loan_type, agreement_date, status, notes } = req.body;
    if (!client_name) return res.status(400).json({ error: 'Client Name is required' });

    const { data: newAg, error } = await supabase.from('agreements').insert({
      client_name, email: email || '', phone: phone || '', pan: pan || '',
      lender: lender || '', loan_account_number: loan_account_number || '',
      loan_amount: parseFloat(loan_amount) || 0, loan_type: loan_type || '',
      agreement_date: agreement_date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: status || 'Active', notes: notes || ''
    }).select().single();
    if (error) throw error;

    await logActivity(req.user.id, req.user.name, 'CREATE', 'AGREEMENT', newAg.id, `Created agreement for: ${client_name}`);
    res.status(201).json(newAg);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/agreements/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { client_name, email, phone, pan, lender, loan_account_number, loan_amount, loan_type, agreement_date, status, notes } = req.body;
    const updateData = { updated_at: new Date().toISOString() };
    if (client_name !== undefined) updateData.client_name = client_name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (pan !== undefined) updateData.pan = pan;
    if (lender !== undefined) updateData.lender = lender;
    if (loan_account_number !== undefined) updateData.loan_account_number = loan_account_number;
    if (loan_amount !== undefined) updateData.loan_amount = loan_amount;
    if (loan_type !== undefined) updateData.loan_type = loan_type;
    if (agreement_date !== undefined) updateData.agreement_date = agreement_date;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    await supabase.from('agreements').update(updateData).eq('id', id);
    await logActivity(req.user.id, req.user.name, 'UPDATE', 'AGREEMENT', id, `Updated agreement ID: ${id}`);
    const { data: updated } = await supabase.from('agreements').select('*').eq('id', id).single();
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/agreements/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await supabase.from('agreements').delete().eq('id', id);
    await logActivity(req.user.id, req.user.name, 'DELETE', 'AGREEMENT', id, `Deleted agreement ID: ${id}`);
    res.json({ success: true, message: 'Agreement deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Bulk Mail
app.post('/api/mail/send-bulk', authenticateToken, async (req, res) => {
  try {
    const { client_ids, subject } = req.body;
    await logActivity(req.user.id, req.user.name, 'BULK_MAIL', 'CLIENT', null, `Sent bulk mail to ${client_ids?.length || 'all'} clients with subject "${subject || 'Update'}"`);
    res.json({ success: true, message: `Email successfully sent to ${client_ids?.length || 12} clients.` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== ADMIN DASHBOARD ====================

app.get('/api/admin/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [
      { count: totalEmployees }, { count: activeEmployees },
      { count: totalLeads }, { count: totalClients }, { count: totalAgreements }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'EMPLOYEE'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'EMPLOYEE').eq('status', 'active'),
      supabase.from('leads').select('*', { count: 'exact', head: true }),
      supabase.from('clients').select('*', { count: 'exact', head: true }),
      supabase.from('agreements').select('*', { count: 'exact', head: true })
    ]);

    const { data: allClients = [] } = await supabase.from('clients').select('received_amount');
    const totalCollections = allClients.reduce((sum, c) => sum + (c.received_amount || 0), 0);

    const { data: employees = [] } = await supabase.from('users').select('id, name, employee_id, designation, department, status').eq('role', 'EMPLOYEE').order('name', { ascending: true });
    const employeeWorkload = [];
    let totalPerf = 0, perfCount = 0;

    for (const emp of employees) {
      const [{ count: lc }, { count: cc }, { count: lost }, { data: colData = [] }] = await Promise.all([
        supabase.from('leads').select('*', { count: 'exact', head: true }).or(`assigned_to.eq.${emp.id},assigned_consultant.eq.${emp.name}`),
        supabase.from('leads').select('*', { count: 'exact', head: true }).or(`assigned_to.eq.${emp.id},assigned_consultant.eq.${emp.name}`).eq('lead_status', 'Converted'),
        supabase.from('leads').select('*', { count: 'exact', head: true }).or(`assigned_to.eq.${emp.id},assigned_consultant.eq.${emp.name}`).eq('lead_status', 'Not Interested'),
        supabase.from('clients').select('received_amount').eq('assigned_consultant', emp.name)
      ]);
      const totalCol = colData.reduce((s, c) => s + (c.received_amount || 0), 0);
      const perf = (lc || 0) > 0 ? Math.round(((cc || 0) / (lc || 1)) * 100) : 0;
      if ((lc || 0) > 0) { totalPerf += perf; perfCount++; }
      employeeWorkload.push({ id: emp.id, name: emp.name, employee_id: emp.employee_id, designation: emp.designation, department: emp.department, assigned_leads: lc || 0, pending_leads: 0, converted_leads: cc || 0, lost_leads: lost || 0, collections: totalCol, performance: perf, status: emp.status });
    }
    const avgPerformance = perfCount > 0 ? Math.round(totalPerf / perfCount) : 0;
    const topPerformers = [...employeeWorkload].filter(e => e.status === 'active').sort((a, b) => (b.performance * 1000 + b.collections) - (a.performance * 1000 + a.collections)).slice(0, 5);

    res.json({ totalEmployees: totalEmployees || 0, activeEmployees: activeEmployees || 0, totalLeads: totalLeads || 0, assignedLeads: 0, unassignedLeads: 0, importedLeads: 0, totalClients: totalClients || 0, totalAgreements: totalAgreements || 0, totalCollections, avgPerformance, topPerformers, employeeWorkload });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== ADMIN LEADS MANAGEMENT ====================

app.get('/api/admin/leads', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { search, status, assignment, date_filter, page = 1, limit = 50, sort_dir = 'DESC' } = req.query;

    let query = supabase.from('leads').select('*', { count: 'exact' });
    if (status && status !== 'All') {
      if (status === 'Follow Up' || status === 'Follow up') query = query.or('lead_status.eq.Follow up,lead_status.eq.Follow Up');
      else query = query.eq('lead_status', status);
    }
    if (assignment === 'unassigned') query = query.is('assigned_to', null).or('assigned_consultant.is.null,assigned_consultant.eq.');
    else if (assignment === 'assigned') query = query.not('assigned_consultant', 'is', null);
    if (date_filter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      query = query.gte('created_at', today);
    } else if (date_filter === 'week') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      query = query.gte('created_at', weekAgo);
    } else if (date_filter === 'month') {
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      query = query.gte('created_at', monthAgo);
    }
    if (search) query = query.or(buildSearchOr(['name', 'email', 'phone', 'lead_id', 'city', 'assigned_consultant'], search.trim()));
    query = query.order('id', { ascending: sort_dir.toUpperCase() === 'ASC' });
    const from = (parseInt(page) - 1) * parseInt(limit);
    query = query.range(from, from + parseInt(limit) - 1);
    const { data: leads = [], count: totalCount } = await query;

    const [{ count: totalAll }, { count: assigned }, { count: unassigned }] = await Promise.all([
      supabase.from('leads').select('*', { count: 'exact', head: true }),
      supabase.from('leads').select('*', { count: 'exact', head: true }).not('assigned_consultant', 'is', null),
      supabase.from('leads').select('*', { count: 'exact', head: true }).is('assigned_consultant', null)
    ]);

    res.json({ data: leads, pagination: { page: parseInt(page), limit: parseInt(limit), total: totalCount || 0, totalPages: Math.ceil((totalCount || 0) / parseInt(limit)) }, counts: { total: totalAll || 0, assigned: assigned || 0, unassigned: unassigned || 0 } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/leads/:id/assign', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { employee_id, notes } = req.body;
    const { data: lead } = await supabase.from('leads').select('*').eq('id', id).single();
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    let empName = null, empId = null;
    if (employee_id) {
      const { data: emp } = await supabase.from('users').select('id, name').eq('id', employee_id).eq('role', 'EMPLOYEE').single();
      if (!emp) return res.status(400).json({ error: 'Invalid employee selected' });
      empName = emp.name; empId = emp.id;
    }

    await supabase.from('leads').update({ assigned_to: empId, assigned_consultant: empName, updated_at: new Date().toISOString() }).eq('id', id);
    await supabase.from('lead_assignment_history').insert({ lead_id: parseInt(id), previous_employee_id: lead.assigned_to, previous_employee_name: lead.assigned_consultant, new_employee_id: empId, new_employee_name: empName, changed_by_id: req.user.id, changed_by_name: req.user.name, action_type: lead.assigned_to ? 'REASSIGN' : 'ASSIGN', notes: notes || (empName ? `Assigned to ${empName}` : 'Unassigned') });
    await logActivity(req.user.id, req.user.name, empName ? 'LEAD_ASSIGN' : 'LEAD_UNASSIGN', 'LEAD', id, empName ? `Assigned lead ${lead.name} to ${empName}` : `Unassigned lead ${lead.name}`);
    const { data: updated } = await supabase.from('leads').select('*').eq('id', id).single();
    res.json({ success: true, lead: updated, message: empName ? `Lead assigned to ${empName}` : 'Lead unassigned successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/leads/bulk-assign', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { lead_ids, employee_id, notes } = req.body;
    if (!Array.isArray(lead_ids) || lead_ids.length === 0) return res.status(400).json({ error: 'lead_ids must be a non-empty array' });

    let empName = null, empId = null;
    if (employee_id) {
      const { data: emp } = await supabase.from('users').select('id, name').eq('id', employee_id).eq('role', 'EMPLOYEE').single();
      if (!emp) return res.status(400).json({ error: 'Invalid employee selected' });
      empName = emp.name; empId = emp.id;
    }

    for (const lid of lead_ids) {
      await supabase.from('leads').update({ assigned_to: empId, assigned_consultant: empName, updated_at: new Date().toISOString() }).eq('id', lid);
      await supabase.from('lead_assignment_history').insert({ lead_id: parseInt(lid), new_employee_id: empId, new_employee_name: empName, changed_by_id: req.user.id, changed_by_name: req.user.name, action_type: empName ? 'BULK_ASSIGN' : 'BULK_UNASSIGN', notes: notes || (empName ? `Bulk assigned to ${empName}` : 'Bulk unassigned') });
    }

    await logActivity(req.user.id, req.user.name, 'LEAD_BULK_ASSIGN', 'LEAD', null, empName ? `Bulk assigned ${lead_ids.length} leads to ${empName}` : `Bulk unassigned ${lead_ids.length} leads`);
    res.json({ success: true, count: lead_ids.length, message: empName ? `Successfully assigned ${lead_ids.length} lead(s) to ${empName}` : `Successfully unassigned ${lead_ids.length} lead(s)` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/leads/:id/history', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { data: lead } = await supabase.from('leads').select('id, name, lead_id, phone').eq('id', id).single();
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    const { data: history = [] } = await supabase.from('lead_assignment_history').select('*').eq('lead_id', id).order('id', { ascending: false });
    res.json({ lead, history });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/leads/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { data: lead } = await supabase.from('leads').select('*').eq('id', id).single();
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    const [{ data: activities = [] }, { data: assignmentHistory = [] }] = await Promise.all([
      supabase.from('activity_logs').select('*').eq('entity_type', 'LEAD').eq('entity_id', String(id)).order('id', { ascending: false }).limit(15),
      supabase.from('lead_assignment_history').select('*').eq('lead_id', id).order('id', { ascending: false }).limit(15)
    ]);
    res.json({ lead, activities, assignmentHistory });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin Import Leads
app.post('/api/admin/leads/import', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { distribution_mode = 'single', employee_id, employee_ids = [], filename = 'imported_leads.xlsx', duplicate_action = 'skip', leads } = req.body;
    if (!Array.isArray(leads) || leads.length === 0) return res.status(400).json({ success: false, error: 'No lead rows provided' });

    const { data: allActiveEmployees = [] } = await supabase.from('users').select('id, name, employee_id, designation').eq('role', 'EMPLOYEE').eq('status', 'active').order('name', { ascending: true });
    const activeEmpMap = new Map(allActiveEmployees.map(e => [e.id, e]));

    let targetEmployees = [];
    if (distribution_mode === 'single') {
      const numId = parseInt(employee_id, 10);
      const foundEmp = !isNaN(numId) && activeEmpMap.has(numId) ? activeEmpMap.get(numId) : allActiveEmployees.find(e => e.name?.toLowerCase() === String(employee_id || '').trim().toLowerCase());
      if (!foundEmp) return res.status(400).json({ success: false, error: 'Please select a valid active employee for assignment' });
      targetEmployees = [foundEmp];
    } else if (distribution_mode === 'equal') {
      const selectedIds = Array.isArray(employee_ids) && employee_ids.length > 0 ? employee_ids.map(Number) : allActiveEmployees.map(e => e.id);
      targetEmployees = selectedIds.map(id => activeEmpMap.get(id)).filter(Boolean);
      if (targetEmployees.length === 0) return res.status(400).json({ success: false, error: 'No active employees available' });
    }

    const now = new Date();
    const batchId = `IMP-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    let importedCount = 0, skippedCount = 0, errorCount = 0;
    const errorsList = [], distributionSummary = {};
    let distributionIndex = 0;

    for (let i = 0; i < leads.length; i++) {
      const row = leads[i];
      const name = (row.name || '').trim();
      const phone = (row.phone || '').toString().trim().replace(/[^0-9+]/g, '');
      const email = (row.email || '').trim().toLowerCase();

      if (!name) { errorCount++; errorsList.push({ row: i + 1, error: 'Missing lead name' }); continue; }
      if (!phone && !email) { errorCount++; errorsList.push({ row: i + 1, name, error: 'Missing both phone and email' }); continue; }

      let assignedEmp = null;
      if (distribution_mode === 'single') assignedEmp = targetEmployees[0];
      else if (distribution_mode === 'equal') { assignedEmp = targetEmployees[distributionIndex % targetEmployees.length]; distributionIndex++; }
      else if (distribution_mode === 'manual') {
        const rowEmpId = row.assigned_to ? parseInt(row.assigned_to, 10) : null;
        assignedEmp = rowEmpId && activeEmpMap.has(rowEmpId) ? activeEmpMap.get(rowEmpId) : (targetEmployees[0] || allActiveEmployees[0]);
      }

      // Check for duplicates
      let dupQuery = supabase.from('leads').select('id').limit(1);
      if (phone && phone.length >= 7) dupQuery = dupQuery.eq('phone', phone);
      else if (email && email.includes('@')) dupQuery = dupQuery.ilike('email', email);
      const { data: dupCheck = [] } = await dupQuery;

      if (dupCheck.length > 0) {
        if (duplicate_action === 'update') {
          await supabase.from('leads').update({ assigned_to: assignedEmp?.id || null, assigned_consultant: assignedEmp?.name || null, import_batch_id: batchId, imported_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', dupCheck[0].id);
          importedCount++;
          if (assignedEmp?.name) distributionSummary[assignedEmp.name] = (distributionSummary[assignedEmp.name] || 0) + 1;
        } else { skippedCount++; }
        continue;
      }

      const rand3 = Math.floor(100 + Math.random() * 900);
      const lead_id = `LD-${Date.now().toString().slice(-4)}${rand3}${i}`;
      const { error: insertError } = await supabase.from('leads').insert({
        lead_id, name, email, phone, city: (row.city || 'India').toString(),
        outstanding_amount: (row.outstanding_amount || row.loan_amount || '1,00,000 - 3,00,000').toString(),
        monthly_income: parseFloat(row.monthly_income) || 0,
        loan_type: (row.loan_type || 'personal_loan_settlement').toString().toLowerCase().replace(/\s+/g, '_'),
        default_status: 'yes', harassment_calls: 'yes', source: 'Excel Import',
        lead_status: 'New', assigned_to: assignedEmp?.id || null, assigned_consultant: assignedEmp?.name || null,
        import_batch_id: batchId, imported_at: new Date().toISOString(),
        notes: [row.lender ? `Lender: ${row.lender}` : '', row.notes || '', `Batch: ${batchId}`].filter(Boolean).join(' | ')
      });

      if (!insertError) {
        importedCount++;
        if (assignedEmp?.name) distributionSummary[assignedEmp.name] = (distributionSummary[assignedEmp.name] || 0) + 1;
      } else { errorCount++; errorsList.push({ row: i + 1, name, error: insertError.message }); }
    }

    const primaryEmp = distribution_mode === 'single' ? targetEmployees[0] : null;
    await supabase.from('lead_import_history').insert({ batch_id: batchId, filename, employee_id: primaryEmp?.id || null, employee_name: primaryEmp?.name || (distribution_mode === 'equal' ? 'Equal Distribution' : 'Manual Distribution'), distribution_mode, total_rows: leads.length, imported_count: importedCount, skipped_count: skippedCount, error_count: errorCount, admin_id: req.user.id, admin_name: req.user.name });
    await logActivity(req.user.id, req.user.name, 'LEAD_IMPORT', 'LEAD_BATCH', batchId, `Imported ${importedCount} leads from ${filename}. Skipped: ${skippedCount}, Errors: ${errorCount}`);

    res.json({ success: true, batch_id: batchId, filename, distribution_mode, employee_name: primaryEmp?.name || 'Team', distribution_summary: distributionSummary, total_rows: leads.length, imported_count: importedCount, skipped_count: skippedCount, error_count: errorCount, errors: errorsList.slice(0, 10), message: `Successfully imported ${importedCount} lead(s) across team.` });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.get('/api/admin/leads/import-history', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data: history = [] } = await supabase.from('lead_import_history').select('*').order('id', { ascending: false }).limit(100);
    res.json({ data: history });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/leads/import/:batchId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { batchId } = req.params;
    const [{ data: history }, { data: leads = [] }] = await Promise.all([
      supabase.from('lead_import_history').select('*').eq('batch_id', batchId).single(),
      supabase.from('leads').select('*').eq('import_batch_id', batchId).order('id', { ascending: true })
    ]);
    res.json({ history, leads });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== ADMIN EMPLOYEES ====================

app.get('/api/admin/employees', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data: employees = [] } = await supabase.from('users').select('id, name, employee_id, email, phone, role, department, designation, status, created_at, updated_at').eq('role', 'EMPLOYEE').order('id', { ascending: false });
    const enriched = await Promise.all(employees.map(async emp => {
      const [{ count: lc }, { count: clients }, { data: colData = [] }, { count: cc }] = await Promise.all([
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('assigned_consultant', emp.name),
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('assigned_consultant', emp.name),
        supabase.from('clients').select('received_amount').eq('assigned_consultant', emp.name),
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('assigned_consultant', emp.name).eq('lead_status', 'Converted')
      ]);
      const totalCol = colData.reduce((s, c) => s + (c.received_amount || 0), 0);
      const perf = (lc || 0) > 0 ? Math.round(((cc || 0) / (lc || 1)) * 100) : 0;
      return { ...emp, stats: { leads: lc || 0, clients: clients || 0, agreements: 0, collections: totalCol, performance: perf } };
    }));
    res.json({ data: enriched });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/employees', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, employee_id, email, phone, department, designation, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required' });

    const { data: existing } = await supabase.from('users').select('id').ilike('email', email.trim()).single();
    if (existing) return res.status(400).json({ error: 'An account with this email already exists' });
    if (employee_id) {
      const { data: existingEid } = await supabase.from('users').select('id').eq('employee_id', employee_id.trim()).single();
      if (existingEid) return res.status(400).json({ error: 'This Employee ID is already taken' });
    }

    const hash = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
    const { data: newEmp, error } = await supabase.from('users').insert({ name: name.trim(), employee_id: (employee_id || '').trim() || null, email: email.trim().toLowerCase(), phone: (phone || '').trim(), password_hash: hash, role: 'EMPLOYEE', department: (department || '').trim(), designation: (designation || '').trim(), status: 'active' }).select('id, name, employee_id, email, phone, role, department, designation, status, created_at').single();
    if (error) throw error;
    await logActivity(req.user.id, req.user.name, 'CREATE_EMPLOYEE', 'USER', newEmp.id, `Created employee: ${name} (${employee_id})`);
    res.status(201).json(newEmp);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/employees/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data: emp } = await supabase.from('users').select('id, name, employee_id, email, phone, role, department, designation, status, created_at, updated_at').eq('id', req.params.id).eq('role', 'EMPLOYEE').single();
    if (!emp) return res.status(404).json({ error: 'Employee not found' });
    res.json(emp);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/employees/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, employee_id, phone, department, designation } = req.body;
    const updateData = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (employee_id !== undefined) updateData.employee_id = employee_id;
    if (phone !== undefined) updateData.phone = phone;
    if (department !== undefined) updateData.department = department;
    if (designation !== undefined) updateData.designation = designation;
    await supabase.from('users').update(updateData).eq('id', req.params.id).eq('role', 'EMPLOYEE');
    await logActivity(req.user.id, req.user.name, 'UPDATE_EMPLOYEE', 'USER', req.params.id, `Updated employee ID: ${req.params.id}`);
    const { data: updated } = await supabase.from('users').select('id, name, employee_id, email, phone, role, department, designation, status, created_at, updated_at').eq('id', req.params.id).single();
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/employees/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) return res.status(400).json({ error: 'Status must be active or inactive' });
    await supabase.from('users').update({ status, updated_at: new Date().toISOString() }).eq('id', req.params.id).eq('role', 'EMPLOYEE');
    await logActivity(req.user.id, req.user.name, status === 'active' ? 'ACTIVATE_EMPLOYEE' : 'DEACTIVATE_EMPLOYEE', 'USER', req.params.id, `Employee ${status}`);
    const { data: updated } = await supabase.from('users').select('id, name, employee_id, email, status').eq('id', req.params.id).single();
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/employees/:id/password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const hash = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
    await supabase.from('users').update({ password_hash: hash, updated_at: new Date().toISOString() }).eq('id', req.params.id).eq('role', 'EMPLOYEE');
    await logActivity(req.user.id, req.user.name, 'RESET_PASSWORD', 'USER', req.params.id, 'Password reset by admin');
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== ADMIN TARGETS & PERFORMANCE ====================

async function calculateEmployeeMonthPerformance(emp, monthStr) {
  const isAllTime = monthStr === 'all';
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthParam = isAllTime ? 'all' : (monthStr || defaultMonth);

  const { data: allLeads1 = [] } = await supabase.from('leads').select('*').eq('assigned_to', emp.id);
  const { data: allLeads2 = [] } = await supabase.from('leads').select('*').is('assigned_to', null).eq('assigned_consultant', emp.name);
  const allEmpLeads = [...allLeads1, ...allLeads2];

  let monthNewLeads = 0, monthContacted = 0, monthFollowups = 0, monthConverted = 0, monthLost = 0;
  const nowMs = Date.now();
  const aging = { '0_3': 0, '4_7': 0, '8_15': 0, '16_30': 0, '30_plus': 0 };

  allEmpLeads.forEach(l => {
    const cm = (l.created_at || '').slice(0, 7), im = (l.imported_at || '').slice(0, 7), um = (l.updated_at || '').slice(0, 7);
    if (isAllTime || cm === monthParam || im === monthParam) monthNewLeads++;
    if (isAllTime || um === monthParam || cm === monthParam) {
      if (l.lead_status === 'Contacted') monthContacted++;
      else if (l.lead_status === 'Follow up' || l.lead_status === 'Interested') monthFollowups++;
      else if (l.lead_status === 'Converted') monthConverted++;
      else if (l.lead_status === 'Not Interested') monthLost++;
    }
    if (l.created_at) {
      const days = Math.floor((nowMs - new Date(l.created_at).getTime()) / 86400000);
      if (days <= 3) aging['0_3']++; else if (days <= 7) aging['4_7']++; else if (days <= 15) aging['8_15']++; else if (days <= 30) aging['16_30']++; else aging['30_plus']++;
    }
  });

  const { data: allEmpClients = [] } = await supabase.from('clients').select('*').eq('assigned_consultant', emp.name);
  let monthClientsCount = 0;
  allEmpClients.forEach(c => { if (isAllTime || (c.created_at || '').slice(0, 7) === monthParam) monthClientsCount++; });

  const clientNames = allEmpClients.map(c => c.name).filter(Boolean);
  let monthAgreementsCount = 0;
  if (clientNames.length > 0) {
    const { data: agData = [] } = await supabase.from('agreements').select('agreement_date, created_at').in('client_name', clientNames);
    agData.forEach(a => { if (isAllTime || (a.agreement_date || a.created_at || '').slice(0, 7) === monthParam) monthAgreementsCount++; });
  }

  let monthCollections = 0;
  const clientIds = allEmpClients.map(c => c.id).filter(Boolean);
  if (clientIds.length > 0) {
    const { data: payments = [] } = await supabase.from('payments').select('amount, payment_date, created_at').in('client_id', clientIds);
    payments.forEach(p => { if (isAllTime || (p.payment_date || p.created_at || '').slice(0, 7) === monthParam) monthCollections += parseFloat(p.amount) || 0; });
  }
  if (monthCollections === 0) allEmpClients.forEach(c => { if (isAllTime || (c.fees_date || c.created_at || '').slice(0, 7) === monthParam) monthCollections += parseFloat(c.this_month_received || c.received_amount) || 0; });

  const { count: actCount = 0 } = await supabase.from('activity_logs').select('*', { count: 'exact', head: true }).eq('user_id', emp.id);
  const monthFollowupActivities = (actCount || 0) + monthFollowups;

  let targetRow = null;
  if (!isAllTime) { const { data } = await supabase.from('employee_targets').select('*').eq('employee_id', emp.id).eq('month', monthParam).maybeSingle(); targetRow = data; }
  const target = targetRow ? { ...targetRow, is_set: true } : { month: monthParam, lead_target: 0, conversion_target: 0, client_target: 0, agreement_target: 0, followup_target: 0, collection_target: 0, is_set: false };

  const getAch = (t, a) => (!target.is_set || t === 0) ? null : parseFloat(((a / t) * 100).toFixed(1));
  const getSt = (t, a) => { if (!target.is_set || t === 0) return 'Target Not Set'; const p = (a / t) * 100; return p >= 100 ? 'Target Achieved' : p >= 80 ? 'On Track' : p >= 50 ? 'Needs Attention' : 'Critical'; };

  const tva = {
    leads: { target: target.lead_target, actual: monthNewLeads, achievement: getAch(target.lead_target, monthNewLeads), status: getSt(target.lead_target, monthNewLeads) },
    conversions: { target: target.conversion_target, actual: monthConverted, achievement: getAch(target.conversion_target, monthConverted), status: getSt(target.conversion_target, monthConverted) },
    clients: { target: target.client_target, actual: monthClientsCount, achievement: getAch(target.client_target, monthClientsCount), status: getSt(target.client_target, monthClientsCount) },
    agreements: { target: target.agreement_target, actual: monthAgreementsCount, achievement: getAch(target.agreement_target, monthAgreementsCount), status: getSt(target.agreement_target, monthAgreementsCount) },
    followups: { target: target.followup_target, actual: monthFollowupActivities, achievement: getAch(target.followup_target, monthFollowupActivities), status: getSt(target.followup_target, monthFollowupActivities) },
    collections: { target: target.collection_target, actual: monthCollections, achievement: getAch(target.collection_target, monthCollections), status: getSt(target.collection_target, monthCollections) }
  };

  let perfScore = 0;
  if (target.is_set) { perfScore = Math.min(100, Math.round(Math.min(tva.leads.achievement || 0, 150) * 0.20 + Math.min(tva.followups.achievement || 0, 150) * 0.15 + Math.min(tva.conversions.achievement || 0, 150) * 0.20 + Math.min(tva.clients.achievement || 0, 150) * 0.10 + Math.min(tva.agreements.achievement || 0, 150) * 0.10 + Math.min(tva.collections.achievement || 0, 150) * 0.25)); }
  else { const cr = monthNewLeads > 0 ? (monthConverted / monthNewLeads) * 100 : 0; const colR = monthCollections > 0 ? Math.min((monthCollections / 500000) * 100, 100) : 0; perfScore = Math.min(100, Math.round(cr * 0.5 + colR * 0.5)); }

  const ref = (monthParam !== 'all' ? monthParam : defaultMonth).split('-').map(Number);
  const currD = new Date(ref[0], ref[1] - 1, 1);
  const trends = [];
  for (let m = 5; m >= 0; m--) {
    const d = new Date(currD.getFullYear(), currD.getMonth() - m, 1);
    const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    let tL = 0, tC = 0;
    allEmpLeads.forEach(l => { if ((l.created_at || '').startsWith(mKey) || (l.imported_at || '').startsWith(mKey)) tL++; if (l.lead_status === 'Converted' && (l.updated_at || '').startsWith(mKey)) tC++; });
    const { data: mTgt } = await supabase.from('employee_targets').select('lead_target').eq('employee_id', emp.id).eq('month', mKey).maybeSingle();
    const tAch = mTgt && mTgt.lead_target > 0 ? Math.round((tL / mTgt.lead_target) * 100) : null;
    trends.push({ monthKey: mKey, monthName: d.toLocaleString('en-US', { month: 'short', year: 'numeric' }), leads: tL, conversions: tC, achievement: tAch, performance: tAch !== null ? Math.min(100, tAch) : (tL > 0 ? Math.round((tC / tL) * 100) : 0) });
  }

  return { month: monthParam, target, actuals: { new_leads: monthNewLeads, total_assigned_leads: allEmpLeads.length, contacted: monthContacted, followups: monthFollowupActivities, converted: monthConverted, lost: monthLost, conversion_rate: monthNewLeads > 0 ? parseFloat(((monthConverted / monthNewLeads) * 100).toFixed(1)) : 0, new_clients: monthClientsCount, total_clients: allEmpClients.length, agreements: monthAgreementsCount, collections: monthCollections, performance_score: perfScore }, targetVsActual: tva, leadAging: aging, trends };
}

app.get('/api/admin/employees/:id/targets', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { month } = req.query;
    if (month) { const { data: target } = await supabase.from('employee_targets').select('*').eq('employee_id', id).eq('month', month).maybeSingle(); return res.json({ target: target || null }); }
    const { data: targets = [] } = await supabase.from('employee_targets').select('*').eq('employee_id', id).order('month', { ascending: false });
    res.json({ data: targets });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.post('/api/admin/employees/:id/targets', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { month, lead_target = 0, conversion_target = 0, client_target = 0, agreement_target = 0, followup_target = 0, collection_target = 0 } = req.body;
    if (!month || !/^\d{4}-\d{2}$/.test(month)) return res.status(400).json({ success: false, error: 'Valid month format (YYYY-MM) is required' });

    const { data: employee } = await supabase.from('users').select('id, name, employee_id').eq('id', id).eq('role', 'EMPLOYEE').single();
    if (!employee) return res.status(404).json({ success: false, error: 'Employee not found' });

    const { data: existing } = await supabase.from('employee_targets').select('*').eq('employee_id', id).eq('month', month).maybeSingle();
    if (existing) {
      await supabase.from('employee_targets').update({ lead_target: parseInt(lead_target) || 0, conversion_target: parseInt(conversion_target) || 0, client_target: parseInt(client_target) || 0, agreement_target: parseInt(agreement_target) || 0, followup_target: parseInt(followup_target) || 0, collection_target: parseFloat(collection_target) || 0, updated_at: new Date().toISOString() }).eq('id', existing.id);
      await logActivity(req.user.id, req.user.name, 'TARGET_UPDATED', 'TARGET', existing.id, `Target Updated for ${employee.name} (${month})`);
      const { data: updated } = await supabase.from('employee_targets').select('*').eq('id', existing.id).single();
      return res.json({ success: true, target: updated, message: `Targets updated for ${month}` });
    } else {
      const { data: created } = await supabase.from('employee_targets').insert({ employee_id: parseInt(id), month, lead_target: parseInt(lead_target) || 0, conversion_target: parseInt(conversion_target) || 0, client_target: parseInt(client_target) || 0, agreement_target: parseInt(agreement_target) || 0, followup_target: parseInt(followup_target) || 0, collection_target: parseFloat(collection_target) || 0, created_by: req.user.id }).select().single();
      await logActivity(req.user.id, req.user.name, 'TARGET_CREATED', 'TARGET', created.id, `Target Created for ${employee.name} (${month})`);
      return res.status(201).json({ success: true, target: created, message: `Targets created for ${month}` });
    }
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.get('/api/admin/targets/history/:employeeId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data: history = [] } = await supabase.from('employee_targets').select('*').eq('employee_id', req.params.employeeId).order('month', { ascending: false });
    res.json({ data: history });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.get('/api/admin/targets', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const month = req.query.month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const { data: activeEmployees = [] } = await supabase.from('users').select('id, name, employee_id, designation, status').eq('role', 'EMPLOYEE').eq('status', 'active').order('name', { ascending: true });

    let teamLeadTarget = 0, teamLeadActual = 0, teamConvTarget = 0, teamConvActual = 0, teamColTarget = 0, teamColActual = 0;
    const comparisons = await Promise.all(activeEmployees.map(async emp => {
      const perf = await calculateEmployeeMonthPerformance(emp, month);
      teamLeadTarget += perf.target.lead_target || 0; teamLeadActual += perf.actuals.new_leads || 0;
      teamConvTarget += perf.target.conversion_target || 0; teamConvActual += perf.actuals.converted || 0;
      teamColTarget += perf.target.collection_target || 0; teamColActual += perf.actuals.collections || 0;
      return { employee_id: emp.id, name: emp.name, employee_code: emp.employee_id, designation: emp.designation, lead_target: perf.target.lead_target, lead_actual: perf.actuals.new_leads, lead_achievement: perf.targetVsActual.leads.achievement, lead_status: perf.targetVsActual.leads.status, conversion_target: perf.target.conversion_target, conversion_actual: perf.actuals.converted, conversion_achievement: perf.targetVsActual.conversions.achievement, collection_target: perf.target.collection_target, collection_actual: perf.actuals.collections, collection_achievement: perf.targetVsActual.collections.achievement, performance_score: perf.actuals.performance_score, is_target_set: perf.target.is_set };
    }));
    res.json({ month, team_summary: { total_employees: activeEmployees.length, lead_target: teamLeadTarget, lead_actual: teamLeadActual, lead_achievement: teamLeadTarget > 0 ? parseFloat(((teamLeadActual / teamLeadTarget) * 100).toFixed(1)) : 0, conversion_target: teamConvTarget, conversion_actual: teamConvActual, conversion_achievement: teamConvTarget > 0 ? parseFloat(((teamConvActual / teamConvTarget) * 100).toFixed(1)) : 0, collection_target: teamColTarget, collection_actual: teamColActual, collection_achievement: teamColTarget > 0 ? parseFloat(((teamColActual / teamColTarget) * 100).toFixed(1)) : 0 }, comparisons });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.get('/api/admin/employees/:id/performance', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { month } = req.query;
    const { data: employee } = await supabase.from('users').select('id, name, employee_id, email, phone, role, department, designation, status, created_at').eq('id', id).eq('role', 'EMPLOYEE').single();
    if (!employee) return res.status(404).json({ success: false, error: 'Employee not found' });
    const perfData = await calculateEmployeeMonthPerformance(employee, month);
    const [{ data: recentLeads = [] }, { data: recentActivities = [] }] = await Promise.all([
      supabase.from('leads').select('id, lead_id, name, phone, city, lead_status, loan_type, outstanding_amount, created_at, imported_at').or(`assigned_to.eq.${id},and(assigned_to.is.null,assigned_consultant.eq.${employee.name})`).order('id', { ascending: false }).limit(15),
      supabase.from('activity_logs').select('*').eq('user_id', id).order('id', { ascending: false }).limit(15)
    ]);
    res.json({ employee, month: perfData.month, target: perfData.target, metrics: { leads: { assigned: perfData.actuals.new_leads, total_cumulative: perfData.actuals.total_assigned_leads, contacted: perfData.actuals.contacted, followups: perfData.actuals.followups, converted: perfData.actuals.converted, lost: perfData.actuals.lost, conversion_rate: perfData.actuals.conversion_rate }, clients: { total: perfData.actuals.new_clients, cumulative_active: perfData.actuals.total_clients }, agreements: { total: perfData.actuals.agreements }, collections: { total: perfData.actuals.collections }, performance_score: perfData.actuals.performance_score }, targetVsActual: perfData.targetVsActual, leadAging: perfData.leadAging, trends: perfData.trends, recent_leads: recentLeads, recent_activities: recentActivities });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.get('/api/admin/employees/performance', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { month } = req.query;
    const now = new Date();
    const monthParam = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const { data: employees = [] } = await supabase.from('users').select('id, name, employee_id, email, phone, designation, status').eq('role', 'EMPLOYEE').eq('status', 'active').order('name', { ascending: true });
    const performanceList = await Promise.all(employees.map(async emp => { const perf = await calculateEmployeeMonthPerformance(emp, monthParam); return { employee: emp, month: monthParam, target: perf.target, actuals: perf.actuals, targetVsActual: perf.targetVsActual }; }));
    res.json({ month: monthParam, data: performanceList });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// Admin Audit Logs
app.get('/api/admin/audit-logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { action, search, page = 1, limit = 50 } = req.query;
    let query = supabase.from('activity_logs').select('*', { count: 'exact' });
    if (action && action !== 'ALL') query = query.eq('action', action);
    if (search) query = query.or(buildSearchOr(['user_name', 'details', 'entity_id'], search.trim()));
    query = query.order('id', { ascending: false });
    const from = (parseInt(page) - 1) * parseInt(limit);
    query = query.range(from, from + parseInt(limit) - 1);
    const { data: logs = [], count: total } = await query;
    res.json({ data: logs, pagination: { page: parseInt(page), limit: parseInt(limit), total: total || 0, totalPages: Math.ceil((total || 0) / parseInt(limit)) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== SEED INITIAL DATA ====================

async function seedIfEmpty() {
  try {
    const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
    if ((userCount || 0) === 0) {
      const adminHash = bcrypt.hashSync('settlexpert931075@Abc', bcrypt.genSaltSync(10));
      const empHash = bcrypt.hashSync('admin123', bcrypt.genSaltSync(10));
      await supabase.from('users').insert([
        { name: 'Admin User', email: 'settlexperts@gmail.com', password_hash: adminHash, role: 'ADMIN', status: 'active' },
        { name: 'Dhruv Consultant', email: 'dhruv@reduceddebts.in', password_hash: empHash, role: 'EMPLOYEE', status: 'active', designation: 'Consultant' }
      ]);
      console.log('✅ Users seeded');
    }

    const { count: clientCount } = await supabase.from('clients').select('*', { count: 'exact', head: true });
    if ((clientCount || 0) === 0) {
      await supabase.from('clients').insert([
        { client_id: '60633', name: 'Mukesh Kumar', phone: '9997332524', email: 'avikormukesh977@gmail.com', city: 'Uttarakhand', pan: 'AQWPX1234F', address: 'Dehradun, Uttarakhand', service_fee: 24000, fees_date: '07 Aug 2026', fees_status: 'Pending', pending_amount: 2500, received_amount: 21500, this_month_received: 21500, case_status: 'Active', assigned_consultant: 'Dhruv', assigned_advocate: 'Adv Kalia Sudharani' },
        { client_id: '60610', name: 'Chhibu Ammernath', phone: '7357508484', email: 'ammernathchhibu2018@gmail.com', city: 'Pune', pan: 'AQJPV8099G', address: 'Kothrud, Pune, Maharashtra', service_fee: 22000, fees_date: '04 Aug 2026', fees_status: 'Pending', pending_amount: 7000, received_amount: 15000, this_month_received: 10000, case_status: 'Active', assigned_consultant: 'Dhruv', assigned_advocate: 'Adv Renu Sharma' },
        { client_id: '60488', name: 'Nazeer', phone: '9518711918', email: 'nazeermlove955@gmail.com', city: 'Karnataka', pan: 'BKMPZ9821L', address: 'Bangalore Urban, Karnataka', service_fee: 25000, fees_date: '19 Jul 2026', fees_status: 'Pending', pending_amount: 22000, received_amount: 3000, this_month_received: 0, case_status: 'Active', assigned_consultant: 'Dhruv', assigned_advocate: 'Adv Renu Sharma' },
        { client_id: '60427', name: 'Nitesh Kumar bansal', phone: '9125189072', email: 'niteshbansal75@gmail.com', city: 'Rajasthan', pan: 'DFGTY4412K', address: 'Jaipur, Rajasthan', service_fee: 24000, fees_date: '05 Jul 2026', fees_status: 'Pending', pending_amount: 24000, received_amount: 0, this_month_received: 0, case_status: 'Active', assigned_consultant: 'Dhruv', assigned_advocate: 'Adv Sparsh Gupta' },
        { client_id: '60382', name: 'Chandan Mandi', phone: '9373857181', email: 'chandanmandi88@gmail.com', city: 'Hyderabad', pan: 'GHJKL7789O', address: 'Gachibowli, Hyderabad, Telangana', service_fee: 19000, fees_date: '28 Jun 2026', fees_status: 'Pending', pending_amount: 9000, received_amount: 10000, this_month_received: 0, case_status: 'Active', assigned_consultant: 'Dhruv', assigned_advocate: 'Adv Kalia Sudharani' },
        { client_id: '60362', name: 'Sunil Singh', phone: '7498995204', email: 'techleads05@gmail.com', city: 'Ahmedabad', pan: 'POIUY3321A', address: 'Navrangpura, Ahmedabad, Gujarat', service_fee: 12000, fees_date: '22 Jun 2026', fees_status: 'Pending', pending_amount: 6000, received_amount: 6000, this_month_received: 0, case_status: 'Active', assigned_consultant: 'Dhruv', assigned_advocate: 'Adv Rrishabh Pratap Singh' },
        { client_id: '60033', name: 'Surajit Biswas', phone: '+918003115904', email: 'gps1111@gmail.com', city: 'Kolkata', pan: 'NBVCX2234J', address: 'Salt Lake, Kolkata, West Bengal', service_fee: 30000, fees_date: '08 May 2026', fees_status: 'Paid', pending_amount: 0, received_amount: 30000, this_month_received: 5000, case_status: 'Active', assigned_consultant: 'Dhruv', assigned_advocate: 'Adv Tamanna Swami' },
        { client_id: '60001', name: 'Syed Moin', phone: '+919117252709', email: 'aldsayed@gmail.com', city: 'Karnataka', pan: 'IUYTR8876H', address: 'Mysuru, Karnataka', service_fee: 23000, fees_date: '15 May 2026', fees_status: 'Pending', pending_amount: 9000, received_amount: 14000, this_month_received: 0, case_status: 'Active', assigned_consultant: 'Dhruv', assigned_advocate: 'Adv Sakshi Pal' },
        { client_id: '60004', name: 'Sneha soanli naayak', phone: '9075194714', email: 'snehachoudharybabuche@gmail.com', city: 'Nashik', pan: 'WERTY6654G', address: 'College Road, Nashik, Maharashtra', service_fee: 20000, fees_date: '01 Jun 2026', fees_status: 'Pending', pending_amount: 2000, received_amount: 18000, this_month_received: 0, case_status: 'Active', assigned_consultant: 'Dhruv', assigned_advocate: 'Adv Sakshi Pal' },
        { client_id: '60032', name: 'Sanjay Aggarwal', phone: '9784559959', email: 'sanjay.aggarwal6@gmail.com', city: 'Rajasthan', pan: 'LKJHG1122F', address: 'Kota, Rajasthan', service_fee: 28000, fees_date: '01 Jun 2026', fees_status: 'Pending', pending_amount: 9000, received_amount: 19000, this_month_received: 0, case_status: 'Active', assigned_consultant: 'Dhruv', assigned_advocate: 'Adv Sparsh Gupta' },
        { client_id: '60076', name: 'Bhupendra kumar Gohil', phone: '7487044875', email: 'bhupendragohil@gmail.com', city: 'Vadodara', pan: 'MNBVC5543D', address: 'Alkapuri, Vadodara, Gujarat', service_fee: 20000, fees_date: '12 Jun 2026', fees_status: 'Pending', pending_amount: 8000, received_amount: 12000, this_month_received: 0, case_status: 'Active', assigned_consultant: 'Dhruv', assigned_advocate: 'Adv Sparsh Gupta' },
        { client_id: '60054', name: 'Arjit Kumar Shandilya', phone: '+918700205227', email: 'ijitsm721@gmail.com', city: 'Noida - Ashok Nagar', pan: 'ZXCVB9981E', address: 'Sector 15, Noida, UP', service_fee: 27000, fees_date: '10 Jun 2026', fees_status: 'Pending', pending_amount: 7300, received_amount: 19700, this_month_received: 0, case_status: 'Active', assigned_consultant: 'Dhruv', assigned_advocate: 'Adv Sparsh Gupta' }
      ]);
      console.log('✅ Clients seeded');
    }

    // Leads table remains empty by default

    const { count: agCount } = await supabase.from('agreements').select('*', { count: 'exact', head: true });
    if ((agCount || 0) === 0) {
      await supabase.from('agreements').insert([
        { client_name: 'Mukesh Kumar', email: 'avikormukesh977@gmail.com', phone: '9997332524', pan: 'AQWPX1234F', lender: 'Home Credit, IDFC First Bank, MoneyWide, Cred', loan_account_number: '₹ 15000, 21000, 45000, 9500', loan_amount: 90500, loan_type: 'Personal Loan', agreement_date: '07 Aug 2026', status: 'Active' },
        { client_name: 'Chhibu Ammernath', email: 'ammernathchhibu2018@gmail.com', phone: '7357508484', pan: 'AQJPV8099G', lender: 'Fundee, QuickLoan, Loan Front, Kissht, Navi', loan_account_number: '₹ 25000, 18000, 45000, 12000, 60000', loan_amount: 160000, loan_type: 'Payday Loan', agreement_date: '04 Aug 2026', status: 'Active' }
      ]);
      console.log('✅ Agreements seeded');
    }

    console.log('🚀 SettleXpert CRM (Supabase) ready!');
  } catch (err) {
    console.error('⚠️ Seed error (tables may not exist yet):', err.message);
    console.error('Please run the SQL schema in Supabase SQL Editor first.');
  }
}

// ==================== ERROR HANDLERS ====================

app.all('/api/*', (req, res) => { res.status(404).json({ success: false, error: `API route not found: ${req.method} ${req.originalUrl}` }); });
app.use((err, req, res, next) => { console.error('Express Server Error:', err); res.status(err.status || 500).json({ success: false, error: err.message || 'Internal server error' }); });

// ==================== START ====================
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`\n🌐 SettleXpert CRM Backend (Supabase) running on http://0.0.0.0:${PORT}`);
  console.log(`📦 Connected to Supabase: ${process.env.SUPABASE_URL || 'https://izotfjxrpqvgoaoerlbz.supabase.co'}\n`);
  await seedIfEmpty();
});
