// Run with: node scripts/setup-superadmin.js
// Requires SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function ensureProfile(userId, username) {
  console.log('Creating profile...');
  const { error } = await supabaseAdmin
    .from('profiles')
    .insert({ id: userId, username, role: 'superadmin', approved: true });
  if (error) {
    if (error.code === '23505') {
      console.log('Profile already exists');
    } else {
      console.error('Error creating profile:', error);
      process.exit(1);
    }
  }
}

async function setup() {
  const username = 'x-admin';
  const password = 'X-Admin-Password';
  const email = `${username}@gt.local`;

  let userId;

  console.log('Creating superadmin auth user...');
  const { data: authUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { username },
  });

  if (createErr) {
    if (createErr.message?.includes('already registered') || createErr.message?.includes('already exists') || createErr.code === 'email_exists') {
      console.log('Superadmin auth user already exists, fetching...');
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      const existing = users.users.find(u => u.email === email);
      if (!existing) { console.error('Could not find existing user'); process.exit(1); }
      userId = existing.id;
    } else {
      console.error('Error creating user:', createErr);
      process.exit(1);
    }
  } else {
    userId = authUser.user.id;
  }

  await ensureProfile(userId, username);
  await assignExisting(userId);
}

async function assignExisting(userId) {
  console.log(`Assigning existing data to user ${userId}...`);

  const tables = ['routines', 'workout_logs', 'goals', 'session_targets'];
  for (const table of tables) {
    const { data: rows, error: fetchErr } = await supabaseAdmin
      .from(table)
      .select('id')
      .is('user_id', null);
    if (fetchErr) { console.error(`Error fetching ${table}:`, fetchErr); continue; }
    if (rows.length === 0) { console.log(`  ${table}: no unassigned rows`); continue; }
    const { error: updErr } = await supabaseAdmin
      .from(table)
      .update({ user_id: userId })
      .is('user_id', null);
    if (updErr) { console.error(`Error updating ${table}:`, updErr); continue; }
    console.log(`  ${table}: ${rows.length} rows assigned`);
  }

  console.log('Done!');
}

setup().catch(err => { console.error(err); process.exit(1); });
