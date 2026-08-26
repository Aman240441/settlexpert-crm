const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

let supabase = null;

try {
  supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  console.log('[Supabase] Client initialized successfully for SettleXpert centralized production storage.');
} catch (err) {
  console.error('[Supabase] Failed to initialize Supabase client:', err.message);
}

module.exports = {
  supabase,
  SUPABASE_URL,
  SUPABASE_SECRET_KEY,
  SUPABASE_ANON_KEY
};
