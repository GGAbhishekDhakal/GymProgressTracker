const { Router } = require('express');
const { supabase } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = Router();

router.use(authenticate);

// GET /api/exercises — global + org-specific exercises
router.get('/', async (req, res) => {
  const { muscle_group, search } = req.query;
  let query = supabase.from('exercises').select('*').order('muscle_group').order('name');

  if (req.user.role === 'superadmin' || req.user.role === 'admin') {
    // Show global exercises + their org's exercises
    query = query.or(`org_id.is.null,org_id.eq.${req.user.org_id}`);
  } else if (req.user.role === 'client' && req.user.org_id) {
    // Clients see global + their org's exercises
    query = query.or(`org_id.is.null,org_id.eq.${req.user.org_id}`);
  } else {
    // Ghost or no org: global only
    query = query.is('org_id', null);
  }

  if (muscle_group) query = query.eq('muscle_group', muscle_group);
  if (search) query = query.ilike('name', `%${search}%`);
  const { data, error } = await query;
  if (error) throw error;
  res.json(data);
});

// POST /api/exercises — admin/superadmin can create
router.post('/', authorize('superadmin', 'admin'), async (req, res) => {
  const { name, muscle_group, category, org_only } = req.body;
  if (!name || !muscle_group) return res.status(400).json({ error: 'Name and muscle_group are required' });

  // If org_only, attach org_id; otherwise global (null)
  const orgId = org_only ? req.user.org_id : null;

  const { data, error } = await supabase
    .from('exercises')
    .insert({ name, muscle_group, category: category || 'Barbell', org_id: orgId })
    .select().single();
  if (error) { if (error.code === '23505') return res.status(409).json({ error: 'Exercise already exists' }); throw error; }
  res.status(201).json(data);
});

// PUT /api/exercises/:id
router.put('/:id', authorize('superadmin', 'admin'), async (req, res) => {
  const { name, muscle_group, category } = req.body;
  const { data: existing, error: checkErr } = await supabase.from('exercises').select('*').eq('id', req.params.id).maybeSingle();
  if (checkErr) throw checkErr;
  if (!existing) return res.status(404).json({ error: 'Not found' });

  // Admins can only edit their org's exercises or global exercises
  if (req.user.role === 'admin' && existing.org_id && existing.org_id !== req.user.org_id) {
    return res.status(403).json({ error: 'Cannot edit exercises from another organization' });
  }

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (muscle_group !== undefined) updates.muscle_group = muscle_group;
  if (category !== undefined) updates.category = category;
  const { data, error } = await supabase.from('exercises').update(updates).eq('id', req.params.id).select().single();
  if (error) throw error;
  res.json(data);
});

// DELETE /api/exercises/:id
router.delete('/:id', authorize('superadmin', 'admin'), async (req, res) => {
  const { data: existing } = await supabase.from('exercises').select('*').eq('id', req.params.id).maybeSingle();
  if (!existing) return res.status(404).json({ error: 'Exercise not found' });

  // Admins can only delete their org's exercises (not global ones)
  if (req.user.role === 'admin' && !existing.org_id) {
    return res.status(403).json({ error: 'Cannot delete global exercises' });
  }
  if (req.user.role === 'admin' && existing.org_id !== req.user.org_id) {
    return res.status(403).json({ error: 'Cannot delete exercises from another organization' });
  }

  const { data, error } = await supabase.from('exercises').delete().eq('id', req.params.id).select();
  if (error) throw error;
  if (!data || data.length === 0) return res.status(404).json({ error: 'Exercise not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;
