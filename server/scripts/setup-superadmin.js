// Run with: node scripts/setup-superadmin.js
// Requires SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setup() {
  const username = 'x-admin';
  const password = 'X-Admin-Password';
  const email = `${username}@gt.local`;

  console.log('Creating superadmin auth user...');
  const { data: authUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username },
  });
  if (createErr) {
    if (createErr.message.includes('already exists')) {
      console.log('Superadmin auth user already exists, fetching...');
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      const existing = users.users.find(u => u.email === email);
      if (!existing) { console.error('Could not find existing user'); process.exit(1); }
      return await assignExisting(authUser?.id || existing.id);
    }
    console.error('Error creating user:', createErr);
    process.exit(1);
  }

  console.log('Creating profile...');
  const { error: profileErr } = await supabaseAdmin
    .from('profiles')
    .insert({ id: authUser.user.id, username, role: 'superadmin', approved: true });
  if (profileErr) {
    if (profileErr.code === '23505') {
      console.log('Profile already exists');
    } else {
      console.error('Error creating profile:', profileErr);
      process.exit(1);
    }
  }

  await assignExisting(authUser.user.id);
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
