const express = require('express');
const cors = require('cors');
const path = require('path');
const { getPool } = require('./db');

const exercisesRouter = require('./routes/exercises');
const routinesRouter = require('./routes/routines');
const logsRouter = require('./routes/logs');
const progressRouter = require('./routes/progress');
const goalsRouter = require('./routes/goals');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/exercises', exercisesRouter);
app.use('/api/routines', routinesRouter);
app.use('/api/logs', logsRouter);
app.use('/api/progress', progressRouter);
app.use('/api/goals', goalsRouter);

app.get('/api/stats', async (req, res) => {
  const pool = getPool();
  const { rows: [totalWorkouts] } = await pool.query('SELECT COUNT(DISTINCT logged_at) as count FROM workout_logs');
  const { rows: [totalExercises] } = await pool.query('SELECT COUNT(*) as count FROM exercises');
  const { rows: [activeGoals] } = await pool.query("SELECT COUNT(*) as count FROM goals WHERE status = 'active'");
  const { rows: [totalEntries] } = await pool.query('SELECT COUNT(*) as count FROM workout_logs');

  res.json({
    totalWorkouts: Number(totalWorkouts.count),
    totalExercises: Number(totalExercises.count),
    activeGoals: Number(activeGoals.count),
    totalEntries: Number(totalEntries.count),
  });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
