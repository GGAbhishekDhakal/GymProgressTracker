const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

// Separate client for auth operations (signInWithPassword, getUser, etc.)
// The main client must NEVER be used for auth calls — signInWithPassword sets
// a session on the client, which causes all subsequent queries to use the
// user's JWT instead of the service role key, breaking RLS bypass.
const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = { supabase, supabaseAuth };
