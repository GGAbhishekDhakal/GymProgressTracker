const { Router } = require('express');
const { supabase } = require('../db');
const { authenticate, authorize, requireOrg } = require('../middleware/auth');
const router = Router();

const EMAIL_DOMAIN = 'gt.local';

// All admin routes require authentication + superadmin or admin role
router.use(authenticate);
router.use(authorize('superadmin', 'admin'));

// GET /api/admin/users — list users in same org
router.get('/users', requireOrg, async (req, res) => {
  if (req.user.role === 'superadmin') {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('org_id', req.user.org_id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json(profiles);
  }

  // Admin: own profile + their clients in same org + pending unassigned clients in same org
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('org_id', req.user.org_id)
    .or(`id.eq.${req.user.id},admin_id.eq.${req.user.id},and(role.eq.client,admin_id.is.null,approved.eq.false)`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  res.json(profiles);
});

// PUT /api/admin/users/:id/approve — approve a client
router.put('/users/:id/approve', requireOrg, async (req, res) => {
  const userId = req.params.id;

  const { data: target, error: fetchErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (fetchErr || !target) return res.status(404).json({ error: 'User not found' });

  if (target.org_id !== req.user.org_id) {
    return res.status(403).json({ error: 'User not in your organization' });
  }
  if (target.role !== 'client') {
    return res.status(400).json({ error: 'Only client accounts can be approved' });
  }
  if (target.approved) {
    return res.status(400).json({ error: 'Already approved' });
  }

  const { error: updErr } = await supabase
    .from('profiles')
    .update({ approved: true, admin_id: req.user.role === 'admin' ? req.user.id : target.admin_id })
    .eq('id', userId);
  if (updErr) throw updErr;

  res.json({ message: 'Client approved' });
});

// POST /api/admin/users/create-client — create a client account in this org
router.post('/users/create-client', requireOrg, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const email = `${username}@${EMAIL_DOMAIN}`;

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

  const { error: profileErr } = await supabase
    .from('profiles')
    .insert({
      id: authUser.user.id,
      username,
      role: 'client',
      org_id: req.user.org_id,
      admin_id: req.user.role === 'admin' ? req.user.id : null,
      approved: true,
    });
  if (profileErr) {
    await supabase.auth.admin.deleteUser(authUser.user.id);
    throw profileErr;
  }

  res.status(201).json({ message: 'Client account created successfully' });
});

// POST /api/admin/users/create-admin — superadmin creates an admin in this org
router.post('/users/create-admin', authorize('superadmin'), requireOrg, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const email = `${username}@${EMAIL_DOMAIN}`;

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

  const { error: profileErr } = await supabase
    .from('profiles')
    .insert({
      id: authUser.user.id,
      username,
      role: 'admin',
      org_id: req.user.org_id,
      approved: true,
    });
  if (profileErr) {
    await supabase.auth.admin.deleteUser(authUser.user.id);
    throw profileErr;
  }

  res.status(201).json({ message: 'Admin account created successfully' });
});

// PUT /api/admin/users/:id/role — superadmin only: change user role (within same org)
router.put('/users/:id/role', authorize('superadmin'), requireOrg, async (req, res) => {
  const { role } = req.body;
  if (!['superadmin', 'admin', 'client', 'ghost'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const { data: target } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', req.params.id)
    .maybeSingle();
  if (!target) return res.status(404).json({ error: 'User not found' });
  if (target.org_id !== req.user.org_id) {
    return res.status(403).json({ error: 'User not in your organization' });
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', req.params.id);
  if (error) throw error;

  res.json({ message: 'Role updated' });
});

module.exports = router;
