import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const data = await api.request('/admin/users');
      const myClients = data.filter(p => p.admin_id === user.id && p.role === 'client' && p.approved);
      const pendingClients = data.filter(p => !p.approved && p.role === 'client' && !p.admin_id);
      setClients(myClients);
      setPending(pendingClients);
    } catch {}
    setLoading(false);
  }

  async function approveClient(id) {
    try {
      await api.request(`/admin/users/${id}/approve`, { method: 'PUT' });
      fetchData();
    } catch {}
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Trainer Dashboard</h1>
        <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{user.username}</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="card !p-3 text-center">
          <div className="text-xl font-bold">{clients.length}</div>
          <div className="text-xs" style={{ color: 'var(--text-dim)' }}>Clients</div>
        </div>
        <div className="card !p-3 text-center">
          <div className="text-xl font-bold text-yellow-400">{pending.length}</div>
          <div className="text-xs" style={{ color: 'var(--text-dim)' }}>Pending</div>
        </div>
        <div className="card !p-3 text-center">
          <div className="text-xl font-bold">{clients.reduce((s, c) => s + (c._logCount || 0), 0)}</div>
          <div className="text-xs" style={{ color: 'var(--text-dim)' }}>Client Logs</div>
        </div>
      </div>

      {pending.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Pending Approvals</h2>
          <div className="space-y-1">
            {pending.map(p => (
              <div key={p.id} className="flex items-center justify-between !p-2 rounded" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
                <span className="text-sm">{p.username}</span>
                <button onClick={() => approveClient(p.id)} className="btn-primary text-xs !py-1">
                  Approve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>My Clients</h2>
        {clients.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>No clients yet. Approve pending users or create new client accounts.</p>
        ) : (
          <div className="space-y-1">
            {clients.map(c => (
              <div key={c.id} className="flex items-center justify-between !p-2 rounded" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
                <span className="text-sm">{c.username}</span>
                <div className="flex gap-2">
                  <button onClick={() => navigate(`/history?user=${c.id}`)} className="btn-secondary text-xs !py-1">
                    Progress
                  </button>
                  <button onClick={() => navigate(`/assign?client=${c.id}`)} className="btn-secondary text-xs !py-1">
                    Assign
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button onClick={() => navigate('/assign')} className="btn-primary text-sm">
          + Assign Exercises / Routines
        </button>
        <button onClick={() => navigate('/admin?tab=create')} className="btn-secondary text-sm">
          + Create Client
        </button>
      </div>
    </div>
  );
}
