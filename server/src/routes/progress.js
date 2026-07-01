const { Router } = require('express');
const { supabase } = require('../db');

const router = Router();

function epleyOneRM(weight, reps) {
  if (reps <= 1) return Number(weight);
  return Math.round(Number(weight) * (1 + reps / 30) * 10) / 10;
}

router.get('/:exerciseId', async (req, res) => {
  const { exerciseId } = req.params;
  const { days } = req.query;

  const { data: exercise, error: exErr } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', exerciseId)
    .maybeSingle();

  if (exErr) throw exErr;
  if (!exercise) return res.status(404).json({ error: 'Exercise not found' });

  let query = supabase
    .from('workout_logs')
    .select('*')
    .eq('exercise_id', exerciseId);

  if (days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(days));
    query = query.gte('logged_at', cutoff.toISOString().split('T')[0]);
  }

  const { data: logs, error } = await query
    .order('logged_at', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;

  const data = (logs || []).map(log => ({
    ...log,
    estimated_one_rm: epleyOneRM(log.weight, log.reps),
  }));

  res.json({ exercise, data });
});

router.get('/', async (req, res) => {
  const { days } = req.query;

  let query = supabase
    .from('workout_logs')
    .select('*, exercises(name, muscle_group)');

  if (days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(days));
    query = query.gte('logged_at', cutoff.toISOString().split('T')[0]);
  }

  const { data: logs, error } = await query
    .order('logged_at', { ascending: true });

  if (error) throw error;

  const grouped = {};
  for (const log of logs || []) {
    const key = log.exercises?.name || 'Unknown';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push({
      ...log,
      exercise_name: log.exercises?.name,
      muscle_group: log.exercises?.muscle_group,
      estimated_one_rm: epleyOneRM(log.weight, log.reps),
      exercises: undefined,
    });
  }

  res.json(grouped);
});

module.exports = router;
