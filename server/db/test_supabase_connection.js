const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

async function testConnection() {
  console.log('Testing connection to Supabase:', SUPABASE_URL);

  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    console.error('ERROR: SUPABASE_URL and SUPABASE_SECRET_KEY must be set in .env');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  try {
    // Check if we can query or test basic endpoint
    const { data, error } = await supabase.from('users').select('*').limit(1);
    console.log('Query result:', { data, error });
  } catch (err) {
    console.error('Connection error:', err);
  }
}

testConnection();
