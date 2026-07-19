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

  return (
    <div className="space-y-1">
      {users.map(u => (
        <div key={u.id} className="flex items-center justify-between !p-2 rounded" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
          <div className="flex items-center gap-2">
            <span className="text-sm">{u.username}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              u.role === 'superadmin' ? 'bg-purple-900/40 text-purple-400' :
              u.role === 'admin' ? 'bg-blue-900/40 text-blue-400' :
              u.role === 'ghost' ? 'bg-indigo-900/40 text-indigo-400' : 'bg-gray-800 text-gray-400'
            }`}>{u.role}</span>
            {!u.approved && <span className="text-xs text-yellow-400">(pending)</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
