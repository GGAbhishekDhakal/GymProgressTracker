const { Router } = require('express');
const { supabase, supabaseAuth } = require('../db');
const { authenticate } = require('../middleware/auth');
const router = Router();

const EMAIL_DOMAIN = 'gt.local';

function usernameToEmail(username) {
  return `${username}@${EMAIL_DOMAIN}`;
}

// POST /api/auth/register
// Modes:
//   - org_name → superadmin creating an org
//   - ghost → standalone solo user
//   - org_name + client flow → client joining an org (pending approval)
router.post('/register', async (req, res) => {
  const { username, password, org_name, ghost } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  if (username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const isGhost = ghost === true || ghost === 'true';
  const isSuperadmin = !!org_name && !isGhost;

  if (!isGhost && !org_name) {
    return res.status(400).json({ error: 'Organization name is required. Use Solo Mode for a standalone account.' });
  }

  const email = usernameToEmail(username);

  // Create auth user (admin API needs service role key)
  const { data: authUser, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username },
  });
  if (createErr) {
    if (createErr.message?.includes('already exists')) {
      return res.status(409).json({ error: 'Username already taken' });
    }
    throw createErr;
  }

  try {
    if (isGhost) {
      // Ghost: no org, auto-approved
      const { error: profileErr } = await supabase
        .from('profiles')
        .insert({ id: authUser.user.id, username, role: 'ghost', approved: true });
      if (profileErr) throw profileErr;

      return res.status(201).json({
        message: 'Solo account created! You can log in immediately.',
      });
    }

    if (isSuperadmin) {
      // Check if org name is taken
      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('name', org_name)
        .maybeSingle();
      if (existingOrg) {
        await supabase.auth.admin.deleteUser(authUser.user.id);
        return res.status(409).json({ error: 'Organization name already taken' });
      }

      // Create profile first (needed for organizations.created_by FK)
      const { error: profileErr } = await supabase
        .from('profiles')
        .insert({
          id: authUser.user.id,
          username,
          role: 'superadmin',
          approved: true,
        });
      if (profileErr) {
        await supabase.auth.admin.deleteUser(authUser.user.id);
        throw profileErr;
      }

      // Create org (created_by now references an existing profile)
      const { data: org, error: orgErr } = await supabase
        .from('organizations')
        .insert({ name: org_name, created_by: authUser.user.id })
        .select()
        .single();
      if (orgErr) throw orgErr;

      // Update profile with org_id
      const { error: updErr } = await supabase
        .from('profiles')
        .update({ org_id: org.id })
        .eq('id', authUser.user.id);
      if (updErr) throw updErr;

      return res.status(201).json({
        message: 'Organization and admin account created! You can log in now.',
      });
    }
  } catch (err) {
    await supabase.auth.admin.deleteUser(authUser.user.id);
    throw err;
  }

  // Should not reach here
  await supabase.auth.admin.deleteUser(authUser.user.id);
  return res.status(400).json({ error: 'Invalid registration' });
});

// POST /api/auth/join — client joins an org (pending approval)
router.post('/join', async (req, res) => {
  const { username, password, org_name } = req.body;
  if (!username || !password || !org_name) {
    return res.status(400).json({ error: 'Username, password, and organization name are required' });
  }
  if (username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  // Find the org
  const { data: org, error: orgErr } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', org_name)
    .maybeSingle();
  if (orgErr) throw orgErr;
  if (!org) {
    return res.status(404).json({ error: 'Organization not found' });
  }

  const email = usernameToEmail(username);

  // Create auth user (admin API needs service role key)
  const { data: authUser, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username },
  });
  if (createErr) {
    if (createErr.message?.includes('already exists')) {
      return res.status(409).json({ error: 'Username already taken' });
    }
    throw createErr;
  }

  try {
    const { error: profileErr } = await supabase
      .from('profiles')
      .insert({
        id: authUser.user.id,
        username,
        role: 'client',
        org_id: org.id,
        approved: false,
      });
    if (profileErr) throw profileErr;

    return res.status(201).json({
      message: 'Account created! An admin must approve your account before you can log in.',
    });
  } catch (err) {
    await supabase.auth.admin.deleteUser(authUser.user.id);
    throw err;
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const email = usernameToEmail(username);

  // signInWithPassword MUST use supabaseAuth (anon key) to avoid session pollution
  const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });
  if (error) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organizations(name)')
    .eq('id', data.user.id)
    .maybeSingle();

  if (!profile) {
    return res.status(401).json({ error: 'Profile not found' });
  }

  if (!['superadmin', 'ghost'].includes(profile.role) && !profile.approved) {
    return res.status(403).json({
      error: 'Your account is pending admin approval',
      pending: true,
    });
  }

  // Flatten org name onto profile
  const orgName = profile.organizations?.name || null;
  delete profile.organizations;
  profile.org_name = orgName;

  res.json({
    session: data.session,
    user: profile,
  });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

// GET /api/auth/orgs — list all orgs (for join dropdown)
router.get('/orgs', async (req, res) => {
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name')
    .order('name');
  if (error) throw error;
  res.json(data);
});

// POST /api/auth/google-setup
router.post('/google-setup', async (req, res) => {
  const { username, ghost } = req.body;
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  if (!username) return res.status(400).json({ error: 'Username is required' });

  // getUser MUST use supabaseAuth (anon key) — it validates the user's token
  const { data: { user }, error: authErr } = await supabaseAuth.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: 'Invalid token' });

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle();
  if (existing) return res.status(409).json({ error: 'Username already taken' });

  const isGhost = ghost === true || ghost === 'true';
  const role = isGhost ? 'ghost' : 'client';
  const approved = isGhost;

  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .insert({ id: user.id, username, role, approved })
    .select()
    .single();
  if (profileErr) throw profileErr;

  res.status(201).json({ user: profile, message: isGhost ? 'Solo account created!' : 'Account created! Awaiting admin approval.' });
});

module.exports = router;
