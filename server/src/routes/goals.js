const { Router } = require('express');
const { getDb } = require('../db');

const router = Router();

router.get('/', (req, res) => {
  const db = getDb();
  const goals = db.prepare(`
    SELECT g.*, e.name as exercise_name, e.muscle_group,
      (SELECT MAX(weight) FROM workout_logs WHERE exercise_id = g.exercise_id) as current_weight,
      (SELECT MAX(logged_at) FROM workout_logs WHERE exercise_id = g.exercise_id) as last_logged_at
    FROM goals g
    JOIN exercises e ON e.id = g.exercise_id
    ORDER BY g.created_at DESC
  `).all();

  res.json(goals);
});

router.post('/', (req, res) => {
  const db = getDb();
  const { exercise_id, target_weight, target_date, notes } = req.body;

  if (!exercise_id || !target_weight) {
    return res.status(400).json({ error: 'exercise_id and target_weight are required' });
  }

  const exercise = db.prepare('SELECT id FROM exercises WHERE id = ?').get(exercise_id);
  if (!exercise) return res.status(404).json({ error: 'Exercise not found' });

  const result = db.prepare(
    'INSERT INTO goals (exercise_id, target_weight, target_date, notes) VALUES (?, ?, ?, ?)'
  ).run(exercise_id, target_weight, target_date || null, notes || null);

  const goal = db.prepare(`
    SELECT g.*, e.name as exercise_name, e.muscle_group
    FROM goals g
    JOIN exercises e ON e.id = g.exercise_id
    WHERE g.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(goal);
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const { target_weight, target_date, notes, status } = req.body;

  const existing = db.prepare('SELECT * FROM goals WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  db.prepare(`
    UPDATE goals SET target_weight = ?, target_date = ?, notes = ?, status = ? WHERE id = ?
  `).run(
    target_weight !== undefined ? target_weight : existing.target_weight,
    target_date !== undefined ? target_date : existing.target_date,
    notes !== undefined ? notes : existing.notes,
    status || existing.status,
    req.params.id
  );

  const goal = db.prepare(`
    SELECT g.*, e.name as exercise_name, e.muscle_group
    FROM goals g
    JOIN exercises e ON e.id = g.exercise_id
    WHERE g.id = ?
  `).get(req.params.id);

  res.json(goal);
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM goals WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;
