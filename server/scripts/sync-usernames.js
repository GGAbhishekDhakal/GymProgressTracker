const { supabase } = require('../src/db');

const EMAIL_DOMAIN = process.env.EMAIL_DOMAIN || 'gt.local';

async function sync() {
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('id, username');
  if (pErr) throw pErr;

  const { data: users, error: uErr } = await supabase.auth.admin.listUsers();
  if (uErr) throw uErr;

  const emailToId = new Map(users.users.map(u => [u.email, u.id]));

  let fixed = 0;
  for (const profile of profiles) {
    const expected = `${profile.username}@${EMAIL_DOMAIN}`;
    const existing = emailToId.get(expected);
    if (existing) continue;

    const oldEmail = [...emailToId.entries()].find(([, id]) => id === profile.id)?.[0];
    if (!oldEmail) {
      console.log(`SKIP ${profile.username}: no auth user email for profile ${profile.id}`);
      continue;
    }

    const { error } = await supabase.auth.admin.updateUserById(profile.id, {
      email: expected,
      email_confirm: true,
    });
    if (error) {
      console.log(`FAIL ${profile.username}: ${error.message}`);
      continue;
    }
    emailToId.delete(oldEmail);
    emailToId.set(expected, profile.id);
    fixed++;
    console.log(`FIXED ${oldEmail} -> ${expected}`);
  }

  console.log(`\nDone. ${fixed} email(s) updated.`);
  process.exit(0);
}

sync().catch(err => {
  console.error(err);
  process.exit(1);
});
