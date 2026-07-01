const { Router } = require('express');
const { getPool } = require('../db');

const router = Router();

router.get('/', async (req, res) => {
  const pool = getPool();
  const { rows } = await pool.query(`
    SELECT g.*, e.name as exercise_name, e.muscle_group,
      (SELECT MAX(weight) FROM workout_logs WHERE exercise_id = g.exercise_id) as current_weight,
      (SELECT MAX(logged_at) FROM workout_logs WHERE exercise_id = g.exercise_id) as last_logged_at
    FROM goals g
    JOIN exercises e ON e.id = g.exercise_id
    ORDER BY g.created_at DESC
  `);

  const result = rows.map(r => ({
    ...r,
    current_weight: r.current_weight ? Number(r.current_weight) : null,
  }));

  res.json(result);
});

router.post('/', async (req, res) => {
  const pool = getPool();
  const { exercise_id, target_weight, target_date, notes } = req.body;

  if (!exercise_id || !target_weight) {
    return res.status(400).json({ error: 'exercise_id and target_weight are required' });
  }

  const { rows: [exercise] } = await pool.query('SELECT id FROM exercises WHERE id = $1', [exercise_id]);
  if (!exercise) return res.status(404).json({ error: 'Exercise not found' });

  const { rows } = await pool.query(
    'INSERT INTO goals (exercise_id, target_weight, target_date, notes) VALUES ($1, $2, $3, $4) RETURNING *',
    [exercise_id, target_weight, target_date || null, notes || null]
  );

  const goal = rows[0];
  const { rows: [withExercise] } = await pool.query(`
    SELECT g.*, e.name as exercise_name, e.muscle_group
    FROM goals g
    JOIN exercises e ON e.id = g.exercise_id
    WHERE g.id = $1
  `, [goal.id]);

  res.status(201).json(withExercise);
});

router.put('/:id', async (req, res) => {
  const pool = getPool();
  const { target_weight, target_date, notes, status } = req.body;

  const { rows: [existing] } = await pool.query('SELECT * FROM goals WHERE id = $1', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  await pool.query(`
    UPDATE goals SET target_weight = $1, target_date = $2, notes = $3, status = $4 WHERE id = $5
  `, [
    target_weight !== undefined ? target_weight : existing.target_weight,
    target_date !== undefined ? target_date : existing.target_date,
    notes !== undefined ? notes : existing.notes,
    status || existing.status,
    req.params.id,
  ]);

  const { rows: [goal] } = await pool.query(`
    SELECT g.*, e.name as exercise_name, e.muscle_group
    FROM goals g
    JOIN exercises e ON e.id = g.exercise_id
    WHERE g.id = $1
  `, [req.params.id]);

  res.json(goal);
});

router.delete('/:id', async (req, res) => {
  const pool = getPool();
  const result = await pool.query('DELETE FROM goals WHERE id = $1', [req.params.id]);
  if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;
