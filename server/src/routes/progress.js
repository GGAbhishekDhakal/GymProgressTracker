const { Router } = require('express');
const { getPool } = require('../db');

const router = Router();

function epleyOneRM(weight, reps) {
  if (reps <= 1) return Number(weight);
  return Math.round(Number(weight) * (1 + reps / 30) * 10) / 10;
}

router.get('/:exerciseId', async (req, res) => {
  const pool = getPool();
  const { exerciseId } = req.params;
  const { days } = req.query;

  const { rows: [exercise] } = await pool.query('SELECT * FROM exercises WHERE id = $1', [exerciseId]);
  if (!exercise) return res.status(404).json({ error: 'Exercise not found' });

  let query = 'SELECT * FROM workout_logs WHERE exercise_id = $1';
  const params = [exerciseId];

  if (days) {
    query += ' AND logged_at >= CURRENT_DATE - $2::INTERVAL';
    params.push(`${parseInt(days)} days`);
  }

  query += ' ORDER BY logged_at ASC, created_at ASC';

  const { rows: logs } = await pool.query(query, params);

  const data = logs.map(log => ({
    ...log,
    estimated_one_rm: epleyOneRM(log.weight, log.reps),
  }));

  res.json({ exercise, data });
});

router.get('/', async (req, res) => {
  const pool = getPool();
  const { days } = req.query;

  let query = `
    SELECT wl.*, e.name as exercise_name, e.muscle_group
    FROM workout_logs wl
    JOIN exercises e ON e.id = wl.exercise_id
  `;
  const params = [];

  if (days) {
    query += ' WHERE wl.logged_at >= CURRENT_DATE - $1::INTERVAL';
    params.push(`${parseInt(days)} days`);
  }

  query += ' ORDER BY wl.logged_at ASC';

  const { rows: logs } = await pool.query(query, params);

  const grouped = {};
  for (const log of logs) {
    const key = log.exercise_name;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push({
      ...log,
      estimated_one_rm: epleyOneRM(log.weight, log.reps),
    });
  }

  res.json(grouped);
});

module.exports = router;
