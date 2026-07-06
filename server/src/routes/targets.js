const { Router } = require('express');
const { supabase } = require('../db');

const router = Router();

router.get('/', async (req, res) => {
  const { date } = req.query;
  let query = supabase
    .from('session_targets')
    .select('*, exercises(name, muscle_group)')
    .order('created_at', { ascending: false });

  if (date) query = query.eq('target_date', date);

  const { data, error } = await query;
  if (error) throw error;

  const result = (data || []).map(r => ({
    ...r,
    exercise_name: r.exercises?.name,
    muscle_group: r.exercises?.muscle_group,
    exercises: undefined,
  }));

  res.json(result);
});

router.post('/', async (req, res) => {
  const { exercise_id, target_volume, target_reps, target_date, notes } = req.body;

  if (!exercise_id) {
    return res.status(400).json({ error: 'exercise_id is required' });
  }

  const existing = await supabase
    .from('session_targets')
    .select('id')
    .eq('exercise_id', exercise_id)
    .eq('target_date', target_date || new Date().toISOString().split('T')[0])
    .maybeSingle();

  if (existing.data) {
    const { data, error } = await supabase
      .from('session_targets')
      .update({ target_volume, target_reps, notes })
      .eq('id', existing.data.id)
      .select('*, exercises(name, muscle_group)')
      .single();

    if (error) throw error;
    const result = {
      ...data,
      exercise_name: data.exercises?.name,
      muscle_group: data.exercises?.muscle_group,
      exercises: undefined,
    };
    return res.json(result);
  }

  const { data, error } = await supabase
    .from('session_targets')
    .insert({
      exercise_id,
      target_volume: target_volume || null,
      target_reps: target_reps || null,
      target_date: target_date || new Date().toISOString().split('T')[0],
      notes: notes || null,
    })
    .select('*, exercises(name, muscle_group)')
    .single();

  if (error) throw error;

  const result = {
    ...data,
    exercise_name: data.exercises?.name,
    muscle_group: data.exercises?.muscle_group,
    exercises: undefined,
  };

  res.status(201).json(result);
});

router.delete('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('session_targets')
    .delete()
    .eq('id', req.params.id)
    .select();

  if (error) throw error;
  if (!data || data.length === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;
