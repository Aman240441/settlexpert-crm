/**
 * Execute the full SettleXpert schema on Supabase PostgreSQL
 * Uses the Supabase service_role key to check table existence
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

console.log('=== SETTLEXPERT SCHEMA DEPLOYMENT CHECK ===');
console.log(`Target: ${SUPABASE_URL}`);
console.log('');

async function testConnection() {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  console.log('Testing Supabase connectivity...');
  
  const tablesToCheck = [
    'departments', 'manager_types', 'users', 'teams', 'user_permissions',
    'advocates', 'fee_plans', 'leads', 'follow_ups', 'clients',
    'lenders', 'agreements', 'monthly_payment_records', 'monthly_payment_history',
    'payments', 'tasks', 'advocate_assignment_history', 'payment_due_notifications',
    'lead_imports', 'lead_distributions', 'staff_extended_profiles', 'staff_kyc',
    'staff_advocate_details', 'audit_logs'
  ];

  let existingTables = [];
  let missingTables = [];

  for (const table of tablesToCheck) {
    const { data, error } = await supabase.from(table).select('id').limit(1);
    if (error) {
      if (error.code === 'PGRST205' || error.code === '42P01' || (error.message && error.message.includes('Could not find'))) {
        missingTables.push(table);
      } else {
        console.log(`  Table '${table}': warning ${error.message}`);
        missingTables.push(table);
      }
    } else {
      existingTables.push(table);
    }
  }

  console.log('');
  console.log(`Existing tables (${existingTables.length}): ${existingTables.join(', ') || 'none'}`);
  console.log(`Missing tables (${missingTables.length}): ${missingTables.join(', ') || 'none'}`);
  console.log('');

  const projectRef = SUPABASE_URL.split('//')[1].split('.')[0];
  if (missingTables.length > 0) {
    console.log('ACTION REQUIRED:');
    console.log('Run the schema SQL in the Supabase SQL Editor.');
    console.log(`URL: https://supabase.com/dashboard/project/${projectRef}/sql/new`);
  } else {
    console.log('ALL TABLES EXIST! Schema is fully deployed on Supabase.');
  }

  return { existingTables, missingTables };
}

testConnection().catch(err => {
  console.error('Error:', err.message);
});
