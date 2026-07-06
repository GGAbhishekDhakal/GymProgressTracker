const { Router } = require('express');
const { supabase } = require('../db');

const router = Router();

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('routines')
    .select('*, routine_exercises(exercise_id, order_index)')
    .order('name');

  if (error) throw error;

  const result = data.map(r => ({
    ...r,
    exercise_ids: (r.routine_exercises || [])
      .sort((a, b) => a.order_index - b.order_index)
      .map(re => re.exercise_id),
    routine_exercises: undefined,
  }));

  res.json(result);
});

router.get('/:id', async (req, res) => {
  const { data: routine, error } = await supabase
    .from('routines')
    .select('*')
    .eq('id', req.params.id)
    .maybeSingle();

  if (error) throw error;
  if (!routine) return res.status(404).json({ error: 'Not found' });

  const { data: re } = await supabase
    .from('routine_exercises')
    .select('exercise_id, order_index')
    .eq('routine_id', req.params.id)
    .order('order_index');

  if (!re || re.length === 0) {
    return res.json({ ...routine, exercises: [] });
  }

  const ids = re.map(r => r.exercise_id);

  const { data: exercises, error: exErr } = await supabase
    .from('exercises')
    .select('*')
    .in('id', ids);

  if (exErr) throw exErr;

  const exercisesById = {}; for (const e of exercises || []) exercisesById[e.id] = e;
  const orderedExercises = re.map(r => exercisesById[r.exercise_id]).filter(Boolean);

  res.json({ ...routine, exercises: orderedExercises });
});

router.post('/', async (req, res) => {
  const { name, description, day_of_week, exercise_ids } = req.body;

  if (!name) return res.status(400).json({ error: 'Name is required' });

  const { data: routine, error } = await supabase
    .from('routines')
    .insert({ name, description: description || null, day_of_week: day_of_week || null })
    .select()
    .single();

  if (error) throw error;

  if (exercise_ids && exercise_ids.length) {
    const routineExercises = exercise_ids.map((id, index) => ({
      routine_id: routine.id,
      exercise_id: id,
      order_index: index,
    }));

    const { error: reErr } = await supabase
      .from('routine_exercises')
      .insert(routineExercises);

    if (reErr) throw reErr;
  }

  res.status(201).json(routine);
});

router.put('/:id', async (req, res) => {
  const { name, description, day_of_week, exercise_ids } = req.body;

  const { data: existing, error: checkErr } = await supabase
    .from('routines')
    .select('*')
    .eq('id', req.params.id)
    .maybeSingle();

  if (checkErr) throw checkErr;
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (day_of_week !== undefined) updates.day_of_week = day_of_week || null;

  if (Object.keys(updates).length > 0) {
    const { error: updErr } = await supabase
      .from('routines')
      .update(updates)
      .eq('id', req.params.id);

    if (updErr) throw updErr;
  }

  if (exercise_ids) {
    const { error: delErr } = await supabase
      .from('routine_exercises')
      .delete()
      .eq('routine_id', req.params.id);

    if (delErr) throw delErr;

    const routineExercises = exercise_ids.map((id, index) => ({
      routine_id: parseInt(req.params.id),
      exercise_id: id,
      order_index: index,
    }));

    const { error: insErr } = await supabase
      .from('routine_exercises')
      .insert(routineExercises);

    if (insErr) throw insErr;
  }

  const { data: routine, error } = await supabase
    .from('routines')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) throw error;
  res.json(routine);
});

router.delete('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('routines')
    .delete()
    .eq('id', req.params.id)
    .select();

  if (error) throw error;
  if (!data || data.length === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;
