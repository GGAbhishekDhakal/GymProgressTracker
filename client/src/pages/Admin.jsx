import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Admin() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('users');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const data = await api.request('/admin/users');
      setUsers(data);
    } catch {}
    setLoading(false);
  }

  async function approveUser(id) {
    try {
      await api.request(`/admin/users/${id}/approve`, { method: 'PUT' });
      setMessage('Client approved!');
      fetchUsers();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function createClient(e) {
    e.preventDefault();
    setMessage('');
    try {
      await api.request('/admin/users/create-client', {
        method: 'POST',
        body: JSON.stringify({ username: newUsername, password: newPassword }),
      });
      setMessage('Client created!');
      setNewUsername('');
      setNewPassword('');
      fetchUsers();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function createAdmin(e) {
    e.preventDefault();
    setMessage('');
    try {
      await api.request('/admin/users/create-admin', {
        method: 'POST',
        body: JSON.stringify({ username: newUsername, password: newPassword }),
      });
      setMessage('Admin created!');
      setNewUsername('');
      setNewPassword('');
      fetchUsers();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function changeRole(id, role) {
    try {
      await api.request(`/admin/users/${id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      });
      setMessage('Role updated!');
      fetchUsers();
    } catch (err) {
      setMessage(err.message);
    }
  }

  const isSuperadmin = user?.role === 'superadmin';
  const pending = users.filter(u => !u.approved && u.role === 'client');
  const admins = users.filter(u => u.role === 'admin');
  const clients = users.filter(u => u.role === 'client');

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Admin Panel</h1>
        {user?.org_name && (
          <span className="text-xs px-2 py-1 rounded-full bg-emerald-900/30 text-emerald-400 border border-emerald-800/40">
            {user.org_name}
          </span>
        )}
      </div>

      {message && (
        <div className="text-sm p-2 rounded" style={{ backgroundColor: 'rgba(16,185,129,0.2)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}>
          {message}
          <button onClick={() => setMessage('')} className="float-right">✕</button>
        </div>
      )}

      <div className="flex gap-2 border-b pb-2 flex-wrap" style={{ borderColor: 'var(--border)' }}>
        <button onClick={() => setTab('users')} className={`text-sm px-3 py-1 rounded-t ${tab === 'users' ? 'font-semibold' : ''}`}
          style={tab === 'users' ? { color: 'var(--text-secondary)', borderBottom: '2px solid #34d399' } : { color: 'var(--text-dim)' }}>
          All Users ({users.length})
        </button>
        {pending.length > 0 && (
          <button onClick={() => setTab('pending')} className={`text-sm px-3 py-1 rounded-t ${tab === 'pending' ? 'font-semibold' : ''}`}
            style={tab === 'pending' ? { color: 'var(--text-secondary)', borderBottom: '2px solid #f59e0b' } : { color: 'var(--text-dim)' }}>
            Pending ({pending.length})
          </button>
        )}
        <button onClick={() => setTab('create')} className={`text-sm px-3 py-1 rounded-t ${tab === 'create' ? 'font-semibold' : ''}`}
          style={tab === 'create' ? { color: 'var(--text-secondary)', borderBottom: '2px solid #34d399' } : { color: 'var(--text-dim)' }}>
          Create Client
        </button>
        {isSuperadmin && (
          <button onClick={() => setTab('create-admin')} className={`text-sm px-3 py-1 rounded-t ${tab === 'create-admin' ? 'font-semibold' : ''}`}
            style={tab === 'create-admin' ? { color: 'var(--text-secondary)', borderBottom: '2px solid #a78bfa' } : { color: 'var(--text-dim)' }}>
            Create Admin
          </button>
        )}
      </div>

      {tab === 'users' && (
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="card !p-3 flex items-center justify-between">
              <div>
                <span className="font-medium text-sm">{u.username}</span>
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${u.role === 'superadmin' ? 'bg-purple-900/40 text-purple-400' : u.role === 'admin' ? 'bg-blue-900/40 text-blue-400' : u.role === 'ghost' ? 'bg-indigo-900/40 text-indigo-400' : 'bg-gray-800 text-gray-400'}`}>
                  {u.role}
                </span>
                {!u.approved && <span className="ml-1 text-xs text-yellow-400">(pending)</span>}
              </div>
              {isSuperadmin && u.role !== 'superadmin' && (
                <select
                  value={u.role}
                  onChange={e => changeRole(u.id, e.target.value)}
                  className="w-auto text-xs !py-1"
                >
                  <option value="client">Client</option>
                  <option value="admin">Admin</option>
                </select>
              )}
              {isSuperadmin && u.role !== 'superadmin' && !u.approved && (
                <button onClick={() => approveUser(u.id)} className="btn-primary text-xs !py-1.5 ml-2">
                  Approve
                </button>
              )}
            </div>
          ))}
          {users.length === 0 && (
            <p className="text-sm text-center py-4" style={{ color: 'var(--text-dim)' }}>No users found</p>
          )}
        </div>
      )}

      {tab === 'pending' && (
        <div className="space-y-2">
          {pending.map(u => (
            <div key={u.id} className="card !p-3 flex items-center justify-between">
              <div>
                <span className="font-medium text-sm">{u.username}</span>
                <span className="ml-2 text-xs text-yellow-400">(awaiting approval)</span>
              </div>
              <button onClick={() => approveUser(u.id)} className="btn-primary text-xs !py-1.5">
                Approve
              </button>
            </div>
          ))}
          {pending.length === 0 && (
            <p className="text-sm text-center py-4" style={{ color: 'var(--text-dim)' }}>No pending approvals</p>
          )}
        </div>
      )}

      {tab === 'create' && (
        <form onSubmit={createClient} className="card !p-4 space-y-3 max-w-sm">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Create Client Account</h2>
          <div>
            <label className="text-xs font-medium" style={{ color: 'var(--text-dim)' }}>Username</label>
            <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)}
              className="w-full !py-2 mt-1" required minLength={3} />
          </div>
          <div>
            <label className="text-xs font-medium" style={{ color: 'var(--text-dim)' }}>Password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
              className="w-full !py-2 mt-1" required minLength={6} />
          </div>
          <button type="submit" className="btn-primary w-full !py-2">Create Client Account</button>
        </form>
      )}

      {tab === 'create-admin' && isSuperadmin && (
        <form onSubmit={createAdmin} className="card !p-4 space-y-3 max-w-sm">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Create Admin Account</h2>
          <div>
            <label className="text-xs font-medium" style={{ color: 'var(--text-dim)' }}>Username</label>
            <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)}
              className="w-full !py-2 mt-1" required minLength={3} />
          </div>
          <div>
            <label className="text-xs font-medium" style={{ color: 'var(--text-dim)' }}>Password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
              className="w-full !py-2 mt-1" required minLength={6} />
          </div>
          <button type="submit" className="btn-primary w-full !py-2" style={{ backgroundColor: '#7c3aed' }}>Create Admin Account</button>
        </form>
      )}
    </div>
  );
}
