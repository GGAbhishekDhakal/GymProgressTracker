const { Router } = require('express');
const { supabase } = require('../db');

const router = Router();

router.get('/', async (req, res) => {
  const { data: goals, error } = await supabase
    .from('goals')
    .select('*, exercises(name, muscle_group)')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const exerciseIds = (goals || []).map(g => g.exercise_id).filter(Boolean);

  let maxWeightMap = {};
  let lastLoggedMap = {};

  if (exerciseIds.length > 0) {
    const { data: logs } = await supabase
      .from('workout_logs')
      .select('exercise_id, weight, logged_at')
      .in('exercise_id', exerciseIds);

    for (const log of logs || []) {
      const eid = log.exercise_id;
      if (!maxWeightMap[eid] || Number(log.weight) > Number(maxWeightMap[eid])) {
        maxWeightMap[eid] = log.weight;
      }
      if (!lastLoggedMap[eid] || log.logged_at > lastLoggedMap[eid]) {
        lastLoggedMap[eid] = log.logged_at;
      }
    }
  }

  const result = (goals || []).map(r => ({
    ...r,
    exercise_name: r.exercises?.name,
    muscle_group: r.exercises?.muscle_group,
    current_weight: maxWeightMap[r.exercise_id] ? Number(maxWeightMap[r.exercise_id]) : null,
    last_logged_at: lastLoggedMap[r.exercise_id] || null,
    exercises: undefined,
  }));

  res.json(result);
});

router.post('/', async (req, res) => {
  const { exercise_id, target_weight, target_date, notes } = req.body;

  if (!exercise_id || !target_weight) {
    return res.status(400).json({ error: 'exercise_id and target_weight are required' });
  }

  const { data: exercise, error: checkErr } = await supabase
    .from('exercises')
    .select('id')
    .eq('id', exercise_id)
    .maybeSingle();

  if (checkErr) throw checkErr;
  if (!exercise) return res.status(404).json({ error: 'Exercise not found' });

  const { data: goal, error } = await supabase
    .from('goals')
    .insert({
      exercise_id,
      target_weight,
      target_date: target_date || null,
      notes: notes || null,
    })
    .select('*, exercises(name, muscle_group)')
    .single();

  if (error) throw error;

  const result = {
    ...goal,
    exercise_name: goal.exercises?.name,
    muscle_group: goal.exercises?.muscle_group,
    exercises: undefined,
  };

  res.status(201).json(result);
});

router.put('/:id', async (req, res) => {
  const { target_weight, target_date, notes, status } = req.body;

  const { data: existing, error: checkErr } = await supabase
    .from('goals')
    .select('*')
    .eq('id', req.params.id)
    .maybeSingle();

  if (checkErr) throw checkErr;
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const updates = {};
  if (target_weight !== undefined) updates.target_weight = target_weight;
  if (target_date !== undefined) updates.target_date = target_date;
  if (notes !== undefined) updates.notes = notes;
  if (status !== undefined) updates.status = status;

  const { error: updErr } = await supabase
    .from('goals')
    .update(updates)
    .eq('id', req.params.id);

  if (updErr) throw updErr;

  const { data: goal, error } = await supabase
    .from('goals')
    .select('*, exercises(name, muscle_group)')
    .eq('id', req.params.id)
    .single();

  if (error) throw error;

  const result = {
    ...goal,
    exercise_name: goal.exercises?.name,
    muscle_group: goal.exercises?.muscle_group,
    exercises: undefined,
  };

  res.json(result);
});

router.delete('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('goals')
    .delete()
    .eq('id', req.params.id)
    .select();

  if (error) throw error;
  if (!data || data.length === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;
