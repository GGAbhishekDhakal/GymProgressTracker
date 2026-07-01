const { Router } = require('express');
const { getPool } = require('../db');

const router = Router();

router.get('/', async (req, res) => {
  const pool = getPool();
  const { muscle_group, search } = req.query;

  let query = 'SELECT * FROM exercises';
  const params = [];
  const conditions = [];

  if (muscle_group) {
    conditions.push('muscle_group = $' + (params.length + 1));
    params.push(muscle_group);
  }

  if (search) {
    conditions.push('name LIKE $' + (params.length + 1));
    params.push(`%${search}%`);
  }

  if (conditions.length) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY muscle_group, name';

  const { rows } = await pool.query(query, params);
  res.json(rows);
});

router.post('/', async (req, res) => {
  const pool = getPool();
  const { name, muscle_group, category } = req.body;

  if (!name || !muscle_group) {
    return res.status(400).json({ error: 'Name and muscle_group are required' });
  }

  try {
    const { rows } = await pool.query(
      'INSERT INTO exercises (name, muscle_group, category) VALUES ($1, $2, $3) RETURNING *',
      [name, muscle_group, category || 'Barbell']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Exercise already exists' });
    }
    throw err;
  }
});

router.delete('/:id', async (req, res) => {
  const pool = getPool();
  const result = await pool.query('DELETE FROM exercises WHERE id = $1', [req.params.id]);

  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Exercise not found' });
  }
  res.json({ message: 'Deleted' });
});

module.exports = router;
