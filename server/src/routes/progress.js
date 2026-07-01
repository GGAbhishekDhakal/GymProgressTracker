const { Router } = require('express');
const { getDb } = require('../db');

const router = Router();

function epleyOneRM(weight, reps) {
  if (reps <= 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

router.get('/:exerciseId', (req, res) => {
  const db = getDb();
  const { exerciseId } = req.params;
  const { days } = req.query;

  const exercise = db.prepare('SELECT * FROM exercises WHERE id = ?').get(exerciseId);
  if (!exercise) return res.status(404).json({ error: 'Exercise not found' });

  let query = 'SELECT * FROM workout_logs WHERE exercise_id = ?';
  const params = [exerciseId];

  if (days) {
    query += ' AND logged_at >= date("now", ?)';
    params.push(`-${parseInt(days)} days`);
  }

  query += ' ORDER BY logged_at ASC, created_at ASC';

  const logs = db.prepare(query).all(...params);

  const data = logs.map(log => ({
    ...log,
    estimated_one_rm: epleyOneRM(log.weight, log.reps),
  }));

  res.json({ exercise, data });
});

router.get('/', (req, res) => {
  const db = getDb();
  const { days } = req.query;

  let query = `
    SELECT wl.*, e.name as exercise_name, e.muscle_group
    FROM workout_logs wl
    JOIN exercises e ON e.id = wl.exercise_id
  `;
  const params = [];

  if (days) {
    query += ' WHERE wl.logged_at >= date("now", ?)';
    params.push(`-${parseInt(days)} days`);
  }

  query += ' ORDER BY wl.logged_at ASC';

  const logs = db.prepare(query).all(...params);

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
