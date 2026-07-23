const { Router } = require('express');
const { supabase } = require('../db');
const { authenticate, authorize, requireOrg } = require('../middleware/auth');
const router = Router();

router.use(authenticate);
router.use(authorize('superadmin'));
router.use(requireOrg);

// GET /api/org/profile — get org details
router.get('/profile', async (req, res) => {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', req.user.org_id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return res.status(404).json({ error: 'Organization not found' });
  res.json(data);
});

// PUT /api/org/profile — update org details
router.put('/profile', async (req, res) => {
  const allowed = ['name', 'description', 'contact_email', 'contact_phone', 'address', 'website'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  // Check name uniqueness if changing
  if (updates.name) {
    const { data: existing } = await supabase
      .from('organizations')
      .select('id')
      .eq('name', updates.name)
      .neq('id', req.user.org_id)
      .maybeSingle();
    if (existing) {
      return res.status(409).json({ error: 'Organization name already taken' });
    }
  }

  const { data, error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', req.user.org_id)
    .select()
    .single();
  if (error) throw error;
  res.json(data);
});

// POST /api/org/kyc — submit org KYC
router.post('/kyc', async (req, res) => {
  const org = await supabase
    .from('organizations')
    .select('kyc_status')
    .eq('id', req.user.org_id)
    .maybeSingle();
  if (org.data?.kyc_status === 'pending' || org.data?.kyc_status === 'verified') {
    return res.status(400).json({ error: `KYC already ${org.data.kyc_status}` });
  }

  const {
    kyc_business_name, kyc_registration_number, kyc_tax_id,
    kyc_business_type, kyc_business_address, kyc_contact_person,
    kyc_contact_email, kyc_contact_phone,
  } = req.body;

  if (!kyc_business_name || !kyc_registration_number || !kyc_tax_id || !kyc_business_type) {
    return res.status(400).json({ error: 'Business name, registration number, tax ID, and business type are required' });
  }

  const { error } = await supabase
    .from('organizations')
    .update({
      kyc_status: 'pending',
      kyc_business_name,
      kyc_registration_number,
      kyc_tax_id,
      kyc_business_type,
      kyc_business_address: kyc_business_address || null,
      kyc_contact_person: kyc_contact_person || null,
      kyc_contact_email: kyc_contact_email || null,
      kyc_contact_phone: kyc_contact_phone || null,
      kyc_submitted_at: new Date().toISOString(),
    })
    .eq('id', req.user.org_id);
  if (error) throw error;

  res.json({ message: 'Organization KYC submitted for review' });
});

// PUT /api/org-profile/kyc/approve — superadmin self-approves org KYC
router.put('/kyc/approve', async (req, res) => {
  const { data: org } = await supabase
    .from('organizations')
    .select('kyc_status')
    .eq('id', req.user.org_id)
    .maybeSingle();
  if (!org) return res.status(404).json({ error: 'Organization not found' });
  if (org.kyc_status !== 'pending') {
    return res.status(400).json({ error: 'No pending KYC to approve' });
  }

  const { error } = await supabase
    .from('organizations')
    .update({
      kyc_status: 'verified',
      kyc_verified_at: new Date().toISOString(),
    })
    .eq('id', req.user.org_id);
  if (error) throw error;

  res.json({ message: 'Organization KYC verified' });
});

// GET /api/org-profile/kyc — get org KYC status
router.get('/kyc', async (req, res) => {
  const { data, error } = await supabase
    .from('organizations')
    .select('kyc_status, kyc_business_name, kyc_registration_number, kyc_tax_id, kyc_business_type, kyc_business_address, kyc_contact_person, kyc_contact_email, kyc_contact_phone, kyc_submitted_at, kyc_verified_at')
    .eq('id', req.user.org_id)
    .maybeSingle();
  if (error) throw error;
  res.json(data);
});

module.exports = router;
