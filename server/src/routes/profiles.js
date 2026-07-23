const { Router } = require('express');
const { supabase, supabaseAuth } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = Router();
router.use(authenticate);

// GET /api/profiles/me
router.get('/me', async (req, res) => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*, organizations(name)')
    .eq('id', req.user.id)
    .maybeSingle();
  if (error) throw error;
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const orgName = profile.organizations?.name || null;
  delete profile.organizations;
  profile.org_name = orgName;

  res.json(profile);
});

// PUT /api/profiles/me — update profile fields
router.put('/me', async (req, res) => {
  const allowed = ['full_name', 'phone', 'bio', 'height', 'weight', 'date_of_birth', 'gender', 'fitness_level', 'fitness_goals'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', req.user.id)
    .select()
    .single();
  if (error) throw error;
  res.json(data);
});

// PUT /api/profiles/me/username — change username
router.put('/me/username', async (req, res) => {
  const { username } = req.body;
  if (!username || username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }
  if (username === req.user.username) {
    return res.status(400).json({ error: 'New username is the same as current' });
  }

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle();
  if (existing) {
    return res.status(409).json({ error: 'Username already taken' });
  }

  const { error } = await supabase
    .from('profiles')
    .update({ username })
    .eq('id', req.user.id);
  if (error) throw error;

  res.json({ message: 'Username updated', username });
});

// PUT /api/profiles/me/password — change password
router.put('/me/password', async (req, res) => {
  const { new_password } = req.body;
  if (!new_password || new_password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const { error } = await supabase.auth.admin.updateUserById(req.user.id, {
    password: new_password,
  });
  if (error) throw error;

  res.json({ message: 'Password updated successfully' });
});

// POST /api/profiles/me/kyc — submit KYC
router.post('/me/kyc', async (req, res) => {
  if (req.user.kyc_status === 'pending' || req.user.kyc_status === 'verified') {
    return res.status(400).json({ error: `KYC already ${req.user.kyc_status}` });
  }

  const { kyc_full_name, kyc_dob, kyc_address, kyc_id_type, kyc_id_number } = req.body;
  if (!kyc_full_name || !kyc_dob || !kyc_address || !kyc_id_type || !kyc_id_number) {
    return res.status(400).json({ error: 'All KYC fields are required' });
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      kyc_status: 'pending',
      kyc_full_name,
      kyc_dob,
      kyc_address,
      kyc_id_type,
      kyc_id_number,
      kyc_submitted_at: new Date().toISOString(),
    })
    .eq('id', req.user.id);
  if (error) throw error;

  res.json({ message: 'KYC submitted for review' });
});

// POST /api/profiles/me/kyc/documents — upload KYC documents
router.post('/me/kyc/documents', async (req, res) => {
  const { file_type } = req.body;
  const validTypes = ['kyc_id_front', 'kyc_id_back', 'kyc_selfie'];
  if (!validTypes.includes(file_type)) {
    return res.status(400).json({ error: 'Invalid file_type. Use: kyc_id_front, kyc_id_back, kyc_selfie' });
  }

  // For now return upload instructions — Supabase Storage handles actual upload
  res.json({
    message: 'Use Supabase Storage directly to upload, then PATCH profile with the URL',
    bucket: 'kyc-documents',
    path: `${req.user.id}/${file_type}`,
  });
});

// GET /api/profiles/me/kyc — get KYC status
router.get('/me/kyc', async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('kyc_status, kyc_full_name, kyc_dob, kyc_address, kyc_id_type, kyc_id_number, kyc_submitted_at, kyc_verified_at')
    .eq('id', req.user.id)
    .single();
  if (error) throw error;
  res.json(data);
});

module.exports = router;
