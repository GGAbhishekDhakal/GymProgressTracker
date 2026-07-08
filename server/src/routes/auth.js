const { Router } = require('express');
const { supabase, supabaseAdmin } = require('../db');
const { authenticate } = require('../middleware/auth');
const router = Router();

const EMAIL_DOMAIN = 'gt.local';

function usernameToEmail(username) {
  return `${username}@${EMAIL_DOMAIN}`;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  if (username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const email = usernameToEmail(username);

  const { data: authUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
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

  const { error: profileErr } = await supabase
    .from('profiles')
    .insert({ id: authUser.user.id, username, role: 'client', approved: false });
  if (profileErr) {
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    throw profileErr;
  }

  res.status(201).json({
    message: 'Account created! An admin must approve your account before you can log in.',
  });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const email = usernameToEmail(username);

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .maybeSingle();

  if (!profile) {
    return res.status(401).json({ error: 'Profile not found' });
  }

  if (profile.role !== 'superadmin' && !profile.approved) {
    return res.status(403).json({
      error: 'Your account is pending admin approval',
      pending: true,
    });
  }

  res.json({
    session: data.session,
    user: profile,
  });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/google-setup
router.post('/google-setup', async (req, res) => {
  const { username } = req.body;
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  if (!username) return res.status(400).json({ error: 'Username is required' });

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: 'Invalid token' });

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle();
  if (existing) return res.status(409).json({ error: 'Username already taken' });

  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .insert({ id: user.id, username, role: 'client', approved: false })
    .select()
    .single();
  if (profileErr) throw profileErr;

  res.status(201).json({ user: profile, message: 'Account created! Awaiting admin approval.' });
});

module.exports = router;
