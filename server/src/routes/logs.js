const { Router } = require('express');
const { getPool } = require('../db');

const router = Router();

router.get('/', async (req, res) => {
  const pool = getPool();
  const { exercise_id, from, to, limit, offset } = req.query;
  let query = `
    SELECT wl.*, e.name as exercise_name, e.muscle_group, e.category
    FROM workout_logs wl
    JOIN exercises e ON e.id = wl.exercise_id
  `;
  const params = [];
  const conditions = [];

  let paramIndex = 1;
  if (exercise_id) {
    conditions.push('wl.exercise_id = $' + paramIndex++);
    params.push(exercise_id);
  }
  if (from) {
    conditions.push('wl.logged_at >= $' + paramIndex++);
    params.push(from);
  }
  if (to) {
    conditions.push('wl.logged_at <= $' + paramIndex++);
    params.push(to);
  }

  if (conditions.length) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY wl.logged_at DESC, wl.created_at DESC';

  if (limit) {
    query += ' LIMIT $' + paramIndex++;
    params.push(parseInt(limit));
    if (offset) {
      query += ' OFFSET $' + paramIndex++;
      params.push(parseInt(offset));
    }
  }

  const { rows } = await pool.query(query, params);
  res.json(rows);
});

router.post('/', async (req, res) => {
  const pool = getPool();
  const { exercise_id, weight, reps, sets, notes, logged_at } = req.body;

  if (!exercise_id || weight === undefined) {
    return res.status(400).json({ error: 'exercise_id and weight are required' });
  }

  const { rows: [exercise] } = await pool.query('SELECT id FROM exercises WHERE id = $1', [exercise_id]);
  if (!exercise) return res.status(404).json({ error: 'Exercise not found' });

  const date = logged_at || new Date().toISOString().split('T')[0];
  const { rows } = await pool.query(
    'INSERT INTO workout_logs (exercise_id, weight, reps, sets, notes, logged_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [exercise_id, weight, reps || 1, sets || 1, notes || null, date]
  );

  const log = rows[0];
  const { rows: [withExercise] } = await pool.query(`
    SELECT wl.*, e.name as exercise_name, e.muscle_group
    FROM workout_logs wl
    JOIN exercises e ON e.id = wl.exercise_id
    WHERE wl.id = $1
  `, [log.id]);

  res.status(201).json(withExercise);
});

router.put('/:id', async (req, res) => {
  const pool = getPool();
  const { weight, reps, sets, notes, logged_at } = req.body;

  const { rows: [existing] } = await pool.query('SELECT * FROM workout_logs WHERE id = $1', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  await pool.query(`
    UPDATE workout_logs SET weight = $1, reps = $2, sets = $3, notes = $4, logged_at = $5 WHERE id = $6
  `, [
    weight !== undefined ? weight : existing.weight,
    reps !== undefined ? reps : existing.reps,
    sets !== undefined ? sets : existing.sets,
    notes !== undefined ? notes : existing.notes,
    logged_at || existing.logged_at,
    req.params.id,
  ]);

  const { rows: [log] } = await pool.query(`
    SELECT wl.*, e.name as exercise_name, e.muscle_group
    FROM workout_logs wl
    JOIN exercises e ON e.id = wl.exercise_id
    WHERE wl.id = $1
  `, [req.params.id]);

  res.json(log);
});

router.delete('/:id', async (req, res) => {
  const pool = getPool();
  const result = await pool.query('DELETE FROM workout_logs WHERE id = $1', [req.params.id]);
  if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;
