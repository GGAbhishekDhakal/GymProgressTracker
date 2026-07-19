const { Router } = require('express');
const { supabase } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const router = Router();

router.use(authenticate);
router.use(authorize('superadmin', 'admin'));

// GET /api/assignments/exercises/:clientId
router.get('/exercises/:clientId', async (req, res) => {
  const { clientId } = req.params;
  if (req.user.role !== 'superadmin') {
    const { data: profile } = await supabase.from('profiles').select('admin_id').eq('id', clientId).maybeSingle();
    if (!profile || profile.admin_id !== req.user.id) return res.status(403).json({ error: 'Not your client' });
  }
  const { data, error } = await supabase
    .from('assigned_exercises')
    .select('*, exercises(name, muscle_group, category)')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  res.json(data);
});

// POST /api/assignments/exercises
router.post('/exercises', async (req, res) => {
  const { client_id, exercise_id } = req.body;
  if (!client_id || !exercise_id) return res.status(400).json({ error: 'client_id and exercise_id are required' });
  if (req.user.role !== 'superadmin') {
    const { data: profile } = await supabase.from('profiles').select('admin_id').eq('id', client_id).maybeSingle();
    if (!profile || profile.admin_id !== req.user.id) return res.status(403).json({ error: 'Not your client' });
  }
  const { data, error } = await supabase.from('assigned_exercises').insert({ client_id, exercise_id, assigned_by: req.user.id }).select().single();
  if (error) { if (error.code === '23505') return res.status(409).json({ error: 'Already assigned' }); throw error; }
  res.status(201).json(data);
});

// DELETE /api/assignments/exercises/:id
router.delete('/exercises/:id', async (req, res) => {
  const { data: existing, error: checkErr } = await supabase.from('assigned_exercises').select('*').eq('id', req.params.id).maybeSingle();
  if (checkErr) throw checkErr;
  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (req.user.role !== 'superadmin') {
    const { data: profile } = await supabase.from('profiles').select('admin_id').eq('id', existing.client_id).maybeSingle();
    if (!profile || profile.admin_id !== req.user.id) return res.status(403).json({ error: 'Not your client' });
  }
  const { data, error } = await supabase.from('assigned_exercises').delete().eq('id', req.params.id);
  if (error) throw error;
  res.json({ message: 'Removed' });
});

// Routines

// GET /api/assignments/routines/:clientId
router.get('/routines/:clientId', async (req, res) => {
  const { clientId } = req.params;
  if (req.user.role !== 'superadmin') {
    const { data: profile } = await supabase.from('profiles').select('admin_id').eq('id', clientId).maybeSingle();
    if (!profile || profile.admin_id !== req.user.id) return res.status(403).json({ error: 'Not your client' });
  }
  const { data, error } = await supabase
    .from('assigned_routines')
    .select('*, routines(name, description, day_of_week)')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  res.json(data);
});

// POST /api/assignments/routines
router.post('/routines', async (req, res) => {
  const { client_id, routine_id } = req.body;
  if (!client_id || !routine_id) return res.status(400).json({ error: 'client_id and routine_id are required' });
  if (req.user.role !== 'superadmin') {
    const { data: profile } = await supabase.from('profiles').select('admin_id').eq('id', client_id).maybeSingle();
    if (!profile || profile.admin_id !== req.user.id) return res.status(403).json({ error: 'Not your client' });
  }
  const { data, error } = await supabase.from('assigned_routines').insert({ client_id, routine_id, assigned_by: req.user.id }).select().single();
  if (error) { if (error.code === '23505') return res.status(409).json({ error: 'Already assigned' }); throw error; }
  res.status(201).json(data);
});

// DELETE /api/assignments/routines/:id
router.delete('/routines/:id', async (req, res) => {
  const { data: existing, error: checkErr } = await supabase.from('assigned_routines').select('*').eq('id', req.params.id).maybeSingle();
  if (checkErr) throw checkErr;
  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (req.user.role !== 'superadmin') {
    const { data: profile } = await supabase.from('profiles').select('admin_id').eq('id', existing.client_id).maybeSingle();
    if (!profile || profile.admin_id !== req.user.id) return res.status(403).json({ error: 'Not your client' });
  }
  const { data, error } = await supabase.from('assigned_routines').delete().eq('id', req.params.id);
  if (error) throw error;
  res.json({ message: 'Removed' });
});

module.exports = router;
