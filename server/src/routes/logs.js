const { Router } = require('express');
const { getDb } = require('../db');

const router = Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { exercise_id, from, to, limit, offset } = req.query;
  let query = `
    SELECT wl.*, e.name as exercise_name, e.muscle_group, e.category
    FROM workout_logs wl
    JOIN exercises e ON e.id = wl.exercise_id
  `;
  const params = [];
  const conditions = [];

  if (exercise_id) {
    conditions.push('wl.exercise_id = ?');
    params.push(exercise_id);
  }
  if (from) {
    conditions.push('wl.logged_at >= ?');
    params.push(from);
  }
  if (to) {
    conditions.push('wl.logged_at <= ?');
    params.push(to);
  }

  if (conditions.length) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY wl.logged_at DESC, wl.created_at DESC';

  if (limit) {
    query += ' LIMIT ?';
    params.push(parseInt(limit));
    if (offset) {
      query += ' OFFSET ?';
      params.push(parseInt(offset));
    }
  }

  const logs = db.prepare(query).all(...params);
  res.json(logs);
});

router.post('/', (req, res) => {
  const db = getDb();
  const { exercise_id, weight, reps, sets, notes, logged_at } = req.body;

  if (!exercise_id || weight === undefined) {
    return res.status(400).json({ error: 'exercise_id and weight are required' });
  }

  const exercise = db.prepare('SELECT id FROM exercises WHERE id = ?').get(exercise_id);
  if (!exercise) return res.status(404).json({ error: 'Exercise not found' });

  const result = db.prepare(
    'INSERT INTO workout_logs (exercise_id, weight, reps, sets, notes, logged_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(exercise_id, weight, reps || 1, sets || 1, notes || null, logged_at || new Date().toISOString().split('T')[0]);

  const log = db.prepare(`
    SELECT wl.*, e.name as exercise_name, e.muscle_group
    FROM workout_logs wl
    JOIN exercises e ON e.id = wl.exercise_id
    WHERE wl.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(log);
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const { weight, reps, sets, notes, logged_at } = req.body;

  const existing = db.prepare('SELECT * FROM workout_logs WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  db.prepare(`
    UPDATE workout_logs SET weight = ?, reps = ?, sets = ?, notes = ?, logged_at = ? WHERE id = ?
  `).run(
    weight !== undefined ? weight : existing.weight,
    reps !== undefined ? reps : existing.reps,
    sets !== undefined ? sets : existing.sets,
    notes !== undefined ? notes : existing.notes,
    logged_at || existing.logged_at,
    req.params.id
  );

  const log = db.prepare(`
    SELECT wl.*, e.name as exercise_name, e.muscle_group
    FROM workout_logs wl
    JOIN exercises e ON e.id = wl.exercise_id
    WHERE wl.id = ?
  `).get(req.params.id);

  res.json(log);
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM workout_logs WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;
