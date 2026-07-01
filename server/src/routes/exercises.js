const { Router } = require('express');
const { getDb } = require('../db');

const router = Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { muscle_group, search } = req.query;

  let query = 'SELECT * FROM exercises';
  const params = [];
  const conditions = [];

  if (muscle_group) {
    conditions.push('muscle_group = ?');
    params.push(muscle_group);
  }

  if (search) {
    conditions.push('name LIKE ?');
    params.push(`%${search}%`);
  }

  if (conditions.length) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY muscle_group, name';

  const exercises = db.prepare(query).all(...params);
  res.json(exercises);
});

router.post('/', (req, res) => {
  const db = getDb();
  const { name, muscle_group, category } = req.body;

  if (!name || !muscle_group) {
    return res.status(400).json({ error: 'Name and muscle_group are required' });
  }

  try {
    const result = db.prepare(
      'INSERT INTO exercises (name, muscle_group, category) VALUES (?, ?, ?)'
    ).run(name, muscle_group, category || 'Barbell');

    const exercise = db.prepare('SELECT * FROM exercises WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(exercise);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Exercise already exists' });
    }
    throw err;
  }
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM exercises WHERE id = ?').run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Exercise not found' });
  }
  res.json({ message: 'Deleted' });
});

module.exports = router;
