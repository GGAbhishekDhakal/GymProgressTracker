require('express-async-errors');
const express = require('express');
const cors = require('cors');
const { supabase } = require('./db');

const exercisesRouter = require('./routes/exercises');
const routinesRouter = require('./routes/routines');
const logsRouter = require('./routes/logs');
const progressRouter = require('./routes/progress');
const goalsRouter = require('./routes/goals');
const targetsRouter = require('./routes/targets');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/exercises', exercisesRouter);
app.use('/api/routines', routinesRouter);
app.use('/api/logs', logsRouter);
app.use('/api/progress', progressRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/targets', targetsRouter);

app.get('/api/stats', async (req, res) => {
  const { data: dates } = await supabase
    .from('workout_logs')
    .select('logged_at')
    .order('logged_at', { ascending: false });

  const totalWorkouts = new Set((dates || []).map(d => d.logged_at)).size;

  const { count: totalExercises } = await supabase
    .from('exercises')
    .select('*', { count: 'exact', head: true });

  const { count: activeGoals } = await supabase
    .from('goals')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const { count: totalEntries } = await supabase
    .from('workout_logs')
    .select('*', { count: 'exact', head: true });

  res.json({
    totalWorkouts,
    totalExercises,
    activeGoals,
    totalEntries,
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
