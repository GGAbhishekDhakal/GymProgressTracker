const { Router } = require('express');
const { supabase } = require('../db');
const { authenticate, authorize, requireOrg } = require('../middleware/auth');
const router = Router();

router.use(authenticate);
router.use(authorize('superadmin'));
router.use(requireOrg);

// GET /api/org/stats — scoped to superadmin's org
router.get('/stats', async (req, res) => {
  const orgId = req.user.org_id;

  const { count: totalUsers } = await supabase
    .from('profiles').select('*', { count: 'exact', head: true }).eq('org_id', orgId);
  const { count: totalAdmins } = await supabase
    .from('profiles').select('*', { count: 'exact', head: true }).eq('org_id', orgId).eq('role', 'admin');
  const { count: totalClients } = await supabase
    .from('profiles').select('*', { count: 'exact', head: true }).eq('org_id', orgId).eq('role', 'client').eq('approved', true);
  const { count: pendingClients } = await supabase
    .from('profiles').select('*', { count: 'exact', head: true }).eq('org_id', orgId).eq('role', 'client').eq('approved', false);

  // Ghost users are global — count those assigned to admins in this org
  const { count: totalGhosts } = await supabase
    .from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'ghost');

  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyStr = thirtyDaysAgo.toISOString().split('T')[0];

  // Active users: clients in this org who logged in last 30 days
  const { data: orgUserIds } = await supabase
    .from('profiles').select('id').eq('org_id', orgId).in('role', ['client', 'admin']);
  const userIds = (orgUserIds || []).map(u => u.id);

  let activeMembers = 0;
  if (userIds.length > 0) {
    const { data: activeUsers } = await supabase
      .from('workout_logs').select('user_id')
      .gte('logged_at', thirtyStr)
      .in('user_id', userIds);
    activeMembers = new Set((activeUsers || []).map(l => l.user_id)).size;
  }

  // Volume & workouts for org users
  let totalVolume = 0;
  let totalWorkouts = 0;
  if (userIds.length > 0) {
    const { data: logs } = await supabase
      .from('workout_logs').select('weight, reps, user_id')
      .in('user_id', userIds);
    totalVolume = (logs || []).reduce((sum, l) => sum + (Number(l.weight) || 0) * (l.reps || 1), 0);
    totalWorkouts = logs?.length || 0;
  }

  // Trainer performance: count clients per admin in this org
  const { data: adminProfiles } = await supabase
    .from('profiles').select('id, username').eq('org_id', orgId).eq('role', 'admin');
  const trainerPerformance = [];
  for (const admin of adminProfiles || []) {
    const { count: clientCount } = await supabase
      .from('profiles').select('*', { count: 'exact', head: true })
      .eq('admin_id', admin.id).eq('approved', true);
    const { count: logCount } = await supabase
      .from('workout_logs').select('*, profiles!inner(admin_id)', { count: 'exact', head: true })
      .eq('profiles.admin_id', admin.id);
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

// GET /api/org/users — list all users in this org
router.get('/users', async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('org_id', req.user.org_id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  res.json(data);
});

module.exports = router;
