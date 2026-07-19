require('express-async-errors');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
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
const assignmentsRouter = require('./routes/assignments');
const orgRouter = require('./routes/org');

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  'https://gym-progress-tracker-nu.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
];

app.use(cors({
  origin: (origin, cb) => { if (!origin || allowedOrigins.includes(origin)) cb(null, true); else cb(new Error('Not allowed by CORS')); },
}));

app.use(helmet());
app.use(express.json({ limit: '10kb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many attempts, try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use('/api/auth', authRouter);
app.use('/api/exercises', exercisesRouter);
app.use('/api/routines', routinesRouter);
app.use('/api/logs', logsRouter);
app.use('/api/progress', progressRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/targets', targetsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/assignments', assignmentsRouter);
app.use('/api/org', orgRouter);

app.get('/api/stats', authenticate, async (req, res) => {
  let targetUserId = req.user.id;
  if (req.user.role === 'superadmin') targetUserId = null;
  if (req.user.role === 'admin') targetUserId = null;

  let logQuery = supabase.from('workout_logs').select('logged_at');
  if (targetUserId) logQuery = logQuery.eq('user_id', targetUserId);
  const { data: dates } = await logQuery.order('logged_at', { ascending: false });

  const totalWorkouts = new Set((dates || []).map(d => d.logged_at)).size;

  const { count: totalExercises } = await supabase
    .from('exercises')
    .select('*', { count: 'exact', head: true });

  let goalsQuery = supabase.from('goals').select('*', { count: 'exact', head: true }).eq('status', 'active');
  if (targetUserId) goalsQuery = goalsQuery.eq('user_id', targetUserId);
  const { count: activeGoals } = await goalsQuery;

  let countQuery = supabase.from('workout_logs').select('*', { count: 'exact', head: true });
  if (targetUserId) countQuery = countQuery.eq('user_id', targetUserId);
  const { count: totalEntries } = await countQuery;

  res.json({ totalWorkouts, totalExercises, activeGoals, totalEntries });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message });
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
