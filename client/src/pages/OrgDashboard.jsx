import { useState, useEffect } from 'react';
import { api } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function OrgDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const data = await api.request('/org/stats');
      setStats(data);
    } catch {}
    setLoading(false);
  }

  async function updateRole(userId, role) {
    try {
      await api.request(`/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      });
      fetchStats();
    } catch {}
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Organization Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card !p-4 text-center">
          <div className="text-2xl mb-1">👥</div>
          <div className="text-2xl font-bold">{stats.totalUsers}</div>
          <div className="text-xs" style={{ color: 'var(--text-dim)' }}>Total Users</div>
        </div>
        <div className="card !p-4 text-center">
          <div className="text-2xl mb-1">💪</div>
          <div className="text-2xl font-bold">{stats.activeMembers}</div>
          <div className="text-xs" style={{ color: 'var(--text-dim)' }}>Active Members (30d)</div>
        </div>
        <div className="card !p-4 text-center">
          <div className="text-2xl mb-1">🏋️</div>
          <div className="text-2xl font-bold">{stats.totalWorkouts}</div>
          <div className="text-xs" style={{ color: 'var(--text-dim)' }}>Total Workouts</div>
        </div>
        <div className="card !p-4 text-center">
          <div className="text-2xl mb-1">📊</div>
          <div className="text-2xl font-bold">{(stats.totalVolume / 1000).toFixed(1)}k</div>
          <div className="text-xs" style={{ color: 'var(--text-dim)' }}>Total Volume (kg)</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="card !p-3 flex items-center justify-between">
          <span className="text-sm">Admins</span>
          <span className="font-bold text-lg">{stats.totalAdmins}</span>
        </div>
        <div className="card !p-3 flex items-center justify-between">
          <span className="text-sm">Approved Clients</span>
          <span className="font-bold text-lg">{stats.totalClients}</span>
        </div>
        <div className="card !p-3 flex items-center justify-between">
          <span className="text-sm">Pending Approvals</span>
          <span className="font-bold text-lg text-yellow-400">{stats.pendingClients}</span>
        </div>
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Reports</h2>

        <section className="mb-4">
          <h3 className="text-xs font-medium mb-2" style={{ color: 'var(--text-dim)' }}>Trainer Performance</h3>
          <div className="space-y-2">
            {stats.trainerPerformance.map(t => (
              <div key={t.id} className="flex items-center justify-between !p-2.5 rounded-lg" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
                <span className="text-sm font-medium">{t.username}</span>
                <div className="flex gap-4 text-xs" style={{ color: 'var(--text-dim)' }}>
                  <span>{t.clientCount} clients</span>
                  <span>{t.totalClientLogs} logs</span>
                </div>
              </div>
            ))}
            {stats.trainerPerformance.length === 0 && (
              <p className="text-xs" style={{ color: 'var(--text-faint)' }}>No trainers yet</p>
            )}
          </div>
        </section>
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>All Users</h2>
        <UserList />
      </div>
    </div>
  );
}

function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.request('/org/users').then(setUsers).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const superadmin = users.filter(u => u.role === 'superadmin');
  const admins = users.filter(u => u.role === 'admin');
  const unassignedClients = users.filter(u => u.role === 'client' && !u.admin_id && u.approved);
  const pendingClients = users.filter(u => u.role === 'client' && !u.approved);
  const ghosts = users.filter(u => u.role === 'ghost');

  const adminGroups = admins.map(admin => ({
    ...admin,
    clients: users.filter(u => u.admin_id === admin.id && u.role === 'client' && u.approved),
  }));

  return (
    <div className="space-y-3">
      {superadmin.map(u => (
        <div key={u.id} className="flex items-center justify-between !p-2.5 rounded-lg" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{u.username}</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-400">superadmin</span>
          </div>
        </div>
      ))}

      {adminGroups.map(admin => (
        <div key={admin.id} className="!p-2.5 rounded-lg space-y-1" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{admin.username}</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-400">admin</span>
            </div>
            <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{admin.clients.length} clients</span>
          </div>
          {admin.clients.length > 0 && (
            <div className="pl-4 space-y-0.5">
              {admin.clients.map(c => (
                <div key={c.id} className="flex items-center justify-between text-xs py-0.5" style={{ color: 'var(--text-dim)' }}>
                  <span>{c.username}</span>
                  {c.full_name && <span className="opacity-60">{c.full_name}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {unassignedClients.length > 0 && (
        <div className="!p-2.5 rounded-lg" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium" style={{ color: 'var(--text-dim)' }}>Unassigned Clients</span>
            <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{unassignedClients.length}</span>
          </div>
          <div className="pl-4 space-y-0.5">
            {unassignedClients.map(c => (
              <div key={c.id} className="text-xs py-0.5" style={{ color: 'var(--text-dim)' }}>{c.username}</div>
            ))}
          </div>
        </div>
      )}

      {pendingClients.length > 0 && (
        <div className="!p-2.5 rounded-lg" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-yellow-400">Pending Approval</span>
            <span className="text-xs text-yellow-400">{pendingClients.length}</span>
          </div>
          <div className="pl-4 space-y-0.5">
            {pendingClients.map(c => (
              <div key={c.id} className="text-xs py-0.5" style={{ color: 'var(--text-dim)' }}>{c.username}</div>
            ))}
          </div>
        </div>
      )}

      {ghosts.length > 0 && (
        <div className="!p-2.5 rounded-lg" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--text-dim)' }}>Solo (Ghost) Users</span>
            <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{ghosts.length}</span>
          </div>
        </div>
      )}

      {users.length === 0 && (
        <p className="text-sm text-center py-4" style={{ color: 'var(--text-dim)' }}>No users found</p>
      )}
    </div>
  );
}
