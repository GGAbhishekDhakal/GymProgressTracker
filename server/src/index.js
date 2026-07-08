require('express-async-errors');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { supabase } = require('./db');
const { authenticate } = require('./middleware/auth');

const exercisesRouter = require('./routes/exercises');
const routinesRouter = require('./routes/routines');
const logsRouter = require('./routes/logs');
const progressRouter = require('./routes/progress');
const goalsRouter = require('./routes/goals');
const targetsRouter = require('./routes/targets');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/exercises', exercisesRouter);
app.use('/api/routines', routinesRouter);
app.use('/api/logs', logsRouter);
app.use('/api/progress', progressRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/targets', targetsRouter);
app.use('/api/admin', adminRouter);

app.get('/api/stats', authenticate, async (req, res) => {
  const filter = req.user.role === 'superadmin' ? {} :
    req.user.role === 'admin' ? { or: `user_id.eq.${req.user.id},user_id.in.(select id from profiles where admin_id = ${req.user.id})` } :
    { user_id: req.user.id };

  let logQuery = supabase.from('workout_logs').select('logged_at');
  for (const [k, v] of Object.entries(filter)) {
    if (k === 'or') logQuery = logQuery.or(v);
    else logQuery = logQuery.eq(k, v);
  }
  const { data: dates } = await logQuery.order('logged_at', { ascending: false });

  const totalWorkouts = new Set((dates || []).map(d => d.logged_at)).size;

  const { count: totalExercises } = await supabase
    .from('exercises')
    .select('*', { count: 'exact', head: true });

  let goalsQuery = supabase.from('goals').select('*', { count: 'exact', head: true }).eq('status', 'active');
  for (const [k, v] of Object.entries(filter)) {
    if (k === 'or') goalsQuery = goalsQuery.or(v);
    else goalsQuery = goalsQuery.eq(k, v);
  }
  const { count: activeGoals } = await goalsQuery;

  let countQuery = supabase.from('workout_logs').select('*', { count: 'exact', head: true });
  for (const [k, v] of Object.entries(filter)) {
    if (k === 'or') countQuery = countQuery.or(v);
    else countQuery = countQuery.eq(k, v);
  }
  const { count: totalEntries } = await countQuery;

  res.json({ totalWorkouts, totalExercises, activeGoals, totalEntries });
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
