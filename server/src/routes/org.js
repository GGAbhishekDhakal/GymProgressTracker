const { Router } = require('express');
const { supabase } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const router = Router();

router.use(authenticate);
router.use(authorize('superadmin'));

// GET /api/org/stats
router.get('/stats', async (req, res) => {
  const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  const { count: totalAdmins } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin');
  const { count: totalClients } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client').eq('approved', true);
  const { count: totalGhosts } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'ghost');
  const { count: pendingClients } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client').eq('approved', false);

  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyStr = thirtyDaysAgo.toISOString().split('T')[0];

  let { data: activeUsers } = await supabase
    .from('workout_logs')
    .select('user_id')
    .gte('logged_at', thirtyStr);

  const activeMembers = new Set((activeUsers || []).map(l => l.user_id)).size;

  const { data: logs } = await supabase.from('workout_logs').select('weight, reps, logged_at');
  const totalVolume = (logs || []).reduce((sum, l) => sum + (Number(l.weight) || 0) * (l.reps || 1), 0);
  const { count: totalWorkouts } = await supabase.from('workout_logs').select('*', { count: 'exact', head: true });

  // Trainer performance: count clients per admin
  const { data: adminProfiles } = await supabase.from('profiles').select('id, username').eq('role', 'admin');
  const trainerPerformance = [];
  for (const admin of adminProfiles || []) {
    const { count: clientCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('admin_id', admin.id).eq('approved', true);
    const { count: logCount } = await supabase.from('workout_logs').select('*, profiles!inner(admin_id)', { count: 'exact', head: true }).eq('profiles.admin_id', admin.id);
    trainerPerformance.push({ id: admin.id, username: admin.username, clientCount, totalClientLogs: logCount });
  }

  res.json({
    totalUsers,
    totalAdmins,
    totalClients,
    totalGhosts,
    pendingClients,
    activeMembers,
    totalWorkouts,
    totalVolume,
    trainerPerformance,
  });
});

// GET /api/org/users — list all users for superadmin
router.get('/users', async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  res.json(data);
});

module.exports = router;
