const { Router } = require('express');
const multer = require('multer');
const { supabase, supabaseAuth } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = Router();
router.use(authenticate);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('File type not allowed. Use JPG, PNG, WebP, or PDF.'));
  },
});

// GET /api/profiles/me
router.get('/me', async (req, res) => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', req.user.id)
    .maybeSingle();
  if (error) throw error;
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  let orgName = null;
  if (profile.org_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', profile.org_id)
      .maybeSingle();
    orgName = org?.name || null;
  }
  profile.org_name = orgName;

  res.json(profile);
});

// PUT /api/profiles/me — update profile fields
router.put('/me', async (req, res) => {
  const allowed = ['full_name', 'phone', 'bio', 'height', 'weight', 'date_of_birth', 'gender', 'fitness_level', 'fitness_goals'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      if (key === 'date_of_birth' && req.body[key] === '') {
        updates[key] = null;
      } else {
        updates[key] = req.body[key];
      }
    }
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

  const newEmail = `${username}@${process.env.EMAIL_DOMAIN || 'gt.local'}`;

  const { error: authErr } = await supabase.auth.admin.updateUserById(req.user.id, {
    email: newEmail,
    email_confirm: true,
  });
  if (authErr) {
    if (authErr.message?.includes('already exists') || authErr.message?.includes('already been registered')) {
      return res.status(409).json({ error: 'Username already taken' });
    }
    throw authErr;
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
  if (req.user.kyc_status === 'verified') {
    return res.status(400).json({ error: 'KYC already verified' });
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
router.post('/me/kyc/documents', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const { file_type } = req.body;
  const validTypes = ['kyc_id_front', 'kyc_id_back', 'kyc_selfie'];
  if (!validTypes.includes(file_type)) {
    return res.status(400).json({ error: 'Invalid file_type. Use: kyc_id_front, kyc_id_back, kyc_selfie' });
  }

  const ext = req.file.originalname.split('.').pop();
  const path = `${req.user.id}/${file_type}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from('kyc-documents')
    .upload(path, req.file.buffer, { contentType: req.file.mimetype, upsert: true });
  if (upErr) throw upErr;

  const { data: urlData } = supabase.storage.from('kyc-documents').getPublicUrl(path);

  const colMap = { kyc_id_front: 'kyc_id_front_url', kyc_id_back: 'kyc_id_back_url', kyc_selfie: 'kyc_selfie_url' };
  const { error: dbErr } = await supabase
    .from('profiles')
    .update({ [colMap[file_type]]: urlData.publicUrl })
    .eq('id', req.user.id);
  if (dbErr) throw dbErr;

  res.json({ url: urlData.publicUrl, path });
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
