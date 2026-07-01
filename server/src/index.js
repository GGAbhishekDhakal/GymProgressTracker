const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDb } = require('./db');

const exercisesRouter = require('./routes/exercises');
const routinesRouter = require('./routes/routines');
const logsRouter = require('./routes/logs');
const progressRouter = require('./routes/progress');
const goalsRouter = require('./routes/goals');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

app.use('/api/exercises', exercisesRouter);
app.use('/api/routines', routinesRouter);
app.use('/api/logs', logsRouter);
app.use('/api/progress', progressRouter);
app.use('/api/goals', goalsRouter);

app.get('/api/stats', (req, res) => {
  const db = getDb();
  const totalWorkouts = db.prepare('SELECT COUNT(DISTINCT logged_at) as count FROM workout_logs').get();
  const totalExercises = db.prepare('SELECT COUNT(*) as count FROM exercises').get();
  const activeGoals = db.prepare("SELECT COUNT(*) as count FROM goals WHERE status = 'active'").get();
  const totalEntries = db.prepare('SELECT COUNT(*) as count FROM workout_logs').get();

  res.json({
    totalWorkouts: totalWorkouts.count,
    totalExercises: totalExercises.count,
    activeGoals: activeGoals.count,
    totalEntries: totalEntries.count,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
