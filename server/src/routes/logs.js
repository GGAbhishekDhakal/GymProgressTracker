const { Router } = require('express');
const { supabase } = require('../db');

const router = Router();

router.get('/', async (req, res) => {
  const { exercise_id, from, to, limit, offset } = req.query;

  let query = supabase
    .from('workout_logs')
    .select('*, exercises(name, muscle_group, category)');

  if (exercise_id) {
    query = query.eq('exercise_id', exercise_id);
  }
  if (from) {
    query = query.gte('logged_at', from);
  }
  if (to) {
    query = query.lte('logged_at', to);
  }

  query = query
    .order('logged_at', { ascending: false })
    .order('created_at', { ascending: false });

  if (limit) {
    const lim = parseInt(limit);
    const off = parseInt(offset || 0);
    query = query.range(off, off + lim - 1);
  }

  const { data, error } = await query;
  if (error) throw error;

  const result = (data || []).map(l => ({
    ...l,
    exercise_name: l.exercises?.name,
    muscle_group: l.exercises?.muscle_group,
    category: l.exercises?.category,
    exercises: undefined,
  }));

  res.json(result);
});

router.post('/', async (req, res) => {
  const { exercise_id, weight, reps, sets, notes, logged_at } = req.body;

  if (!exercise_id || weight === undefined) {
    return res.status(400).json({ error: 'exercise_id and weight are required' });
  }

  const { data: exercise, error: checkErr } = await supabase
    .from('exercises')
    .select('id')
    .eq('id', exercise_id)
    .maybeSingle();

  if (checkErr) throw checkErr;
  if (!exercise) return res.status(404).json({ error: 'Exercise not found' });

  const date = logged_at || new Date().toISOString().split('T')[0];

  const { data: log, error } = await supabase
    .from('workout_logs')
    .insert({
      exercise_id,
      weight,
      reps: reps || 1,
      sets: sets || 1,
      notes: notes || null,
      logged_at: date,
    })
    .select('*, exercises(name, muscle_group)')
    .single();

  if (error) throw error;

  const result = {
    ...log,
    exercise_name: log.exercises?.name,
    muscle_group: log.exercises?.muscle_group,
    exercises: undefined,
  };

  res.status(201).json(result);
});

router.put('/:id', async (req, res) => {
  const { weight, reps, sets, notes, logged_at } = req.body;

  const { data: existing, error: checkErr } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('id', req.params.id)
    .maybeSingle();

  if (checkErr) throw checkErr;
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const updates = {};
  if (weight !== undefined) updates.weight = weight;
  if (reps !== undefined) updates.reps = reps;
  if (sets !== undefined) updates.sets = sets;
  if (notes !== undefined) updates.notes = notes;
  if (logged_at !== undefined) updates.logged_at = logged_at;

  const { error: updErr } = await supabase
    .from('workout_logs')
    .update(updates)
    .eq('id', req.params.id);

  if (updErr) throw updErr;

  const { data: log, error } = await supabase
    .from('workout_logs')
    .select('*, exercises(name, muscle_group)')
    .eq('id', req.params.id)
    .single();

  if (error) throw error;

  const result = {
    ...log,
    exercise_name: log.exercises?.name,
    muscle_group: log.exercises?.muscle_group,
    exercises: undefined,
  };

  res.json(result);
});

router.delete('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('workout_logs')
    .delete()
    .eq('id', req.params.id)
    .select();

  if (error) throw error;
  if (!data || data.length === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;
