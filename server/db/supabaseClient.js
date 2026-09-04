const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

let supabase = null;

if (SUPABASE_URL && SUPABASE_SECRET_KEY && !SUPABASE_SECRET_KEY.includes('PASTE_YOUR')) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    console.log('[Supabase] Live Cloud Client initialized successfully for SettleXpert.');
  } catch (err) {
    console.error('[Supabase] Failed to initialize Supabase client:', err.message);
  }
}

/**
 * Live Sync a record or array of records directly to Supabase in real-time
 */
async function syncRecord(table, recordOrRecords, onConflict = 'id') {
  if (!supabase || !recordOrRecords) return;
  try {
    const payload = Array.isArray(recordOrRecords) ? recordOrRecords : [recordOrRecords];
    if (payload.length === 0) return;

    const { error } = await supabase.from(table).upsert(payload, { onConflict });
    if (error) {
      console.warn(`[Supabase Live Sync] Notice on '${table}':`, error.message);
    } else {
      console.log(`[Supabase Live Sync] Synced ${payload.length} record(s) to '${table}'`);
    }
  } catch (err) {
    console.warn(`[Supabase Live Sync] Exception on '${table}':`, err.message);
  }
}

/**
 * Delete a record from Supabase in real-time
 */
async function deleteRecord(table, id) {
  if (!supabase || !id) return;
  try {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
      console.warn(`[Supabase Live Delete] Notice on '${table}':`, error.message);
    } else {
      console.log(`[Supabase Live Delete] Deleted ID '${id}' from '${table}'`);
    }
  } catch (err) {
    console.warn(`[Supabase Live Delete] Exception on '${table}':`, err.message);
  }
}

/**
 * Background auto-sync runner that keeps Supabase updated continuously
 */
function startLiveSyncWorker(db, intervalMs = 60000) {
  if (!supabase) return;

  const { pullFromSupabase } = require('./pull_from_supabase');
  const { syncAllToSupabase } = require('./sync_to_supabase');
  
  // Hydrate local SQLite from cloud immediately on startup
  setTimeout(() => {
    pullFromSupabase()
      .then(() => syncAllToSupabase())
      .catch(err => console.warn('[Supabase Sync Worker] Startup error:', err.message));
  }, 2000);

  // Periodic recurring background sync
  setInterval(() => {
    syncAllToSupabase().catch(err => console.warn('[Supabase Sync Worker] Error:', err.message));
  }, intervalMs);

  console.log(`[Supabase] Live background auto-sync worker started (Interval: ${intervalMs / 1000}s)`);
}

module.exports = {
  supabase,
  SUPABASE_URL,
  SUPABASE_SECRET_KEY,
  SUPABASE_ANON_KEY,
  syncRecord,
  deleteRecord,
  startLiveSyncWorker
};

