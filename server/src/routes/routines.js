const { Router } = require('express');
const { getDb } = require('../db');

const router = Router();

router.get('/', (req, res) => {
  const db = getDb();
  const routines = db.prepare(`
    SELECT r.*, GROUP_CONCAT(re.exercise_id) as exercise_ids
    FROM routines r
    LEFT JOIN routine_exercises re ON re.routine_id = r.id
    GROUP BY r.id
    ORDER BY r.name
  `).all();

  const result = routines.map(r => ({
    ...r,
    exercise_ids: r.exercise_ids ? r.exercise_ids.split(',').map(Number) : [],
  }));

  res.json(result);
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const routine = db.prepare('SELECT * FROM routines WHERE id = ?').get(req.params.id);
  if (!routine) return res.status(404).json({ error: 'Not found' });

  const exercises = db.prepare(`
    SELECT e.* FROM exercises e
    JOIN routine_exercises re ON re.exercise_id = e.id
    WHERE re.routine_id = ?
    ORDER BY re.order_index
  `).all(req.params.id);

  res.json({ ...routine, exercises });
});

router.post('/', (req, res) => {
  const db = getDb();
  const { name, description, exercise_ids } = req.body;

  if (!name) return res.status(400).json({ error: 'Name is required' });

  const tx = db.transaction(() => {
    const result = db.prepare('INSERT INTO routines (name, description) VALUES (?, ?)').run(name, description || null);
    const routineId = result.lastInsertRowid;

    if (exercise_ids && exercise_ids.length) {
      const insert = db.prepare('INSERT INTO routine_exercises (routine_id, exercise_id, order_index) VALUES (?, ?, ?)');
      exercise_ids.forEach((id, i) => insert.run(routineId, id, i));
    }

    return routineId;
  });

  const routineId = tx();
  const routine = db.prepare('SELECT * FROM routines WHERE id = ?').get(routineId);
  res.status(201).json(routine);
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const { name, description, exercise_ids } = req.body;

  const existing = db.prepare('SELECT * FROM routines WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const tx = db.transaction(() => {
    db.prepare('UPDATE routines SET name = ?, description = ? WHERE id = ?')
      .run(name || existing.name, description !== undefined ? description : existing.description, req.params.id);

    if (exercise_ids) {
      db.prepare('DELETE FROM routine_exercises WHERE routine_id = ?').run(req.params.id);
      const insert = db.prepare('INSERT INTO routine_exercises (routine_id, exercise_id, order_index) VALUES (?, ?, ?)');
      exercise_ids.forEach((id, i) => insert.run(req.params.id, id, i));
    }
  });

  tx();

  const routine = db.prepare('SELECT * FROM routines WHERE id = ?').get(req.params.id);
  res.json(routine);
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM routines WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;
