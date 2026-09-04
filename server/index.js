const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
require('dotenv').config();

// Ensure DB initialization
const db = require('./db/database');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const managersRoutes = require('./routes/managers');
const employeesRoutes = require('./routes/employees');
const advocatesRoutes = require('./routes/advocates');
const departmentsRoutes = require('./routes/departments');
const teamsRoutes = require('./routes/teams');
const managerTypesRoutes = require('./routes/managerTypes');
const permissionsRoutes = require('./routes/permissions');
const feePlansRoutes = require('./routes/feePlans');
const auditRoutes = require('./routes/audit');
const crmRoutes = require('./routes/crm');
const managerRoutes = require('./routes/manager');
const advocatePortalRoutes = require('./routes/advocatePortal');
const staffRoutes = require('./routes/staff');
const leadImportRoutes = require('./routes/leadImport');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : null;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || !allowedOrigins || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy'));
    }
  },
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Settl Expert Admin API', time: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/managers', managersRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/advocates', advocatesRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/manager-types', managerTypesRoutes);
app.use('/api/permissions', permissionsRoutes);
app.use('/api/fee-plans', feePlansRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/crm/lead-import', leadImportRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/manager/lead-import', leadImportRoutes);
app.use('/api/advocate-portal', advocatePortalRoutes);
app.use('/api/staff', staffRoutes);

// Static files for client SPA build if present
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// Fallback for SPA routing
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(200).send('Settl Expert Admin API Server is active on port ' + PORT);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  const isProd = process.env.NODE_ENV === 'production';
  res.status(500).json({ 
    error: 'Internal server error', 
    details: isProd ? 'An error occurred processing the request' : err.message 
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=================================================`);
  console.log(` SETTL EXPERT - ADMIN CONTROL CENTER BACKEND`);
  console.log(` Server running on http://0.0.0.0:${PORT}`);
  console.log(`=================================================`);

  // Run initial payment due check on startup
  if (typeof db.runPaymentDueCheck === 'function') {
    try {
      db.runPaymentDueCheck();
      console.log(' Payment Due Check: Initial run completed.');
    } catch (e) {
      console.warn(' Payment Due Check startup error:', e.message);
    }
  }

  // Initialize Live Supabase Cloud Sync Worker
  const { startLiveSyncWorker } = require('./db/supabaseClient');
  startLiveSyncWorker(db, 60000); // syncs every 60s
});

module.exports = app;
