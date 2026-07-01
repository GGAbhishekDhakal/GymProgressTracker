const { Router } = require('express');
const { getPool } = require('../db');

const router = Router();

router.get('/', async (req, res) => {
  const pool = getPool();
  const { rows } = await pool.query(`
    SELECT r.*, COALESCE(STRING_AGG(re.exercise_id::text, ',' ORDER BY re.order_index), '') as exercise_ids
    FROM routines r
    LEFT JOIN routine_exercises re ON re.routine_id = r.id
    GROUP BY r.id
    ORDER BY r.name
  `);

  const result = rows.map(r => ({
    ...r,
    exercise_ids: r.exercise_ids ? r.exercise_ids.split(',').map(Number).filter(n => !isNaN(n)) : [],
  }));

  res.json(result);
});

router.get('/:id', async (req, res) => {
  const pool = getPool();
  const { rows: [routine] } = await pool.query('SELECT * FROM routines WHERE id = $1', [req.params.id]);
  if (!routine) return res.status(404).json({ error: 'Not found' });

  const { rows: exercises } = await pool.query(`
    SELECT e.* FROM exercises e
    JOIN routine_exercises re ON re.exercise_id = e.id
    WHERE re.routine_id = $1
    ORDER BY re.order_index
  `, [req.params.id]);

  res.json({ ...routine, exercises });
});

router.post('/', async (req, res) => {
  const pool = getPool();
  const { name, description, exercise_ids } = req.body;

  if (!name) return res.status(400).json({ error: 'Name is required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'INSERT INTO routines (name, description) VALUES ($1, $2) RETURNING id',
      [name, description || null]
    );
    const routineId = rows[0].id;

    if (exercise_ids && exercise_ids.length) {
      for (const [index, id] of exercise_ids.entries()) {
        await client.query(
          'INSERT INTO routine_exercises (routine_id, exercise_id, order_index) VALUES ($1, $2, $3)',
          [routineId, id, index]
        );
      }
    }

    await client.query('COMMIT');
    const { rows: [routine] } = await pool.query('SELECT * FROM routines WHERE id = $1', [routineId]);
    res.status(201).json(routine);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

router.put('/:id', async (req, res) => {
  const pool = getPool();
  const { name, description, exercise_ids } = req.body;

  const { rows: [existing] } = await pool.query('SELECT * FROM routines WHERE id = $1', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'UPDATE routines SET name = $1, description = $2 WHERE id = $3',
      [name || existing.name, description !== undefined ? description : existing.description, req.params.id]
    );

    if (exercise_ids) {
      await client.query('DELETE FROM routine_exercises WHERE routine_id = $1', [req.params.id]);
      for (const [index, id] of exercise_ids.entries()) {
        await client.query(
          'INSERT INTO routine_exercises (routine_id, exercise_id, order_index) VALUES ($1, $2, $3)',
          [req.params.id, id, index]
        );
      }
    }

    await client.query('COMMIT');
    const { rows: [routine] } = await pool.query('SELECT * FROM routines WHERE id = $1', [req.params.id]);
    res.json(routine);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

router.delete('/:id', async (req, res) => {
  const pool = getPool();
  const result = await pool.query('DELETE FROM routines WHERE id = $1', [req.params.id]);
  if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;
