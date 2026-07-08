const { Router } = require('express');
const { supabase } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.use(authenticate);

function userFilter(req) {
  if (req.user.role === 'superadmin') return {};
  if (req.user.role === 'admin') {
    return { or: `user_id.eq.${req.user.id},user_id.in.(select id from profiles where admin_id = ${req.user.id})` };
  }
  return { user_id: req.user.id };
}

router.get('/', async (req, res) => {
  const { date } = req.query;
  const filter = userFilter(req);
  let query = supabase.from('session_targets').select('*, exercises(name, muscle_group)');
  for (const [k, v] of Object.entries(filter)) {
    if (k === 'or') query = query.or(v);
    else query = query.eq(k, v);
  }
  if (date) query = query.eq('target_date', date);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  const result = (data || []).map(r => ({ ...r, exercise_name: r.exercises?.name, muscle_group: r.exercises?.muscle_group, exercises: undefined }));
  res.json(result);
});

router.post('/', async (req, res) => {
  const { exercise_id, target_volume, target_reps, target_date, notes } = req.body;
  if (!exercise_id) return res.status(400).json({ error: 'exercise_id is required' });
  const date = target_date || new Date().toISOString().split('T')[0];
  const existing = await supabase
    .from('session_targets')
    .select('id')
    .eq('exercise_id', exercise_id)
    .eq('target_date', date)
    .eq('user_id', req.user.id)
    .maybeSingle();
  if (existing.data) {
    const { data, error } = await supabase
      .from('session_targets')
      .update({ target_volume, target_reps, notes })
      .eq('id', existing.data.id)
      .select('*, exercises(name, muscle_group)')
      .single();
    if (error) throw error;
    const result = { ...data, exercise_name: data.exercises?.name, muscle_group: data.exercises?.muscle_group, exercises: undefined };
    return res.json(result);
  }
  const { data, error } = await supabase
    .from('session_targets')
    .insert({ exercise_id, target_volume: target_volume || null, target_reps: target_reps || null, target_date: date, notes: notes || null, user_id: req.user.id })
    .select('*, exercises(name, muscle_group)')
    .single();
  if (error) throw error;
  const result = { ...data, exercise_name: data.exercises?.name, muscle_group: data.exercises?.muscle_group, exercises: undefined };
  res.status(201).json(result);
});

router.delete('/:id', async (req, res) => {
  const { data: existing, error: checkErr } = await supabase.from('session_targets').select('*').eq('id', req.params.id).maybeSingle();
  if (checkErr) throw checkErr;
  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (existing.user_id !== req.user.id && req.user.role !== 'superadmin') return res.status(403).json({ error: 'Not your target' });
  const { data, error } = await supabase.from('session_targets').delete().eq('id', req.params.id).select();
  if (error) throw error;
  res.json({ message: 'Deleted' });
});

module.exports = router;
