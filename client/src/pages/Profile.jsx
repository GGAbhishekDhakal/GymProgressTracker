import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('profile');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    full_name: '', phone: '', bio: '',
    height: '', weight: '', date_of_birth: '', gender: '',
    fitness_level: '', fitness_goals: '',
  });
  const [username, setUsername] = useState('');
  const [pwForm, setPwForm] = useState({ new_password: '', confirm: '' });

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    setLoading(true);
    try {
      const data = await api.request('/profiles/me');
      setForm({
        full_name: data.full_name || '',
        phone: data.phone || '',
        bio: data.bio || '',
        height: data.height || '',
        weight: data.weight || '',
        date_of_birth: data.date_of_birth || '',
        gender: data.gender || '',
        fitness_level: data.fitness_level || '',
        fitness_goals: data.fitness_goals || '',
      });
      setUsername(data.username || '');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  async function saveProfile(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    try {
      await api.request('/profiles/me', {
        method: 'PUT',
        body: JSON.stringify({
          ...form,
          height: form.height ? Number(form.height) : null,
          weight: form.weight ? Number(form.weight) : null,
        }),
      });
      setMessage('Profile updated!');
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  async function saveUsername(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    try {
      const data = await api.request('/profiles/me/username', {
        method: 'PUT',
        body: JSON.stringify({ username }),
      });
      setMessage('Username updated!');
      setUser(prev => ({ ...prev, username: data.username }));
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  async function changePassword(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    if (pwForm.new_password !== pwForm.confirm) {
      setError('Passwords do not match');
      return;
    }
    if (pwForm.new_password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      await api.request('/profiles/me/password', {
        method: 'PUT',
        body: JSON.stringify({ new_password: pwForm.new_password }),
      });
      setMessage('Password updated!');
      setPwForm({ new_password: '', confirm: '' });
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  const isSuperadmin = user?.role === 'superadmin';

  const tabs = [
    { key: 'profile', label: 'Profile' },
    ...(!isSuperadmin ? [{ key: 'gym', label: 'Gym Stats' }] : []),
    { key: 'security', label: 'Security' },
  ];

  if (!tabs.find(t => t.key === tab)) setTab('profile');

  if (loading) return <LoadingSpinner />;

  const inputClass = 'w-full !py-2 mt-1';
  const labelClass = 'text-xs font-medium';
  const labelStyle = { color: 'var(--text-dim)' };

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-xl font-bold">{isSuperadmin ? 'My Profile' : 'My Profile'}</h1>

      {message && (
        <div className="text-sm p-2 rounded bg-emerald-900/30 text-emerald-400 border border-emerald-800/40 text-center">
          {message}
          <button onClick={() => setMessage('')} className="float-right">✕</button>
        </div>
      )}
      {error && (
        <div className="text-sm p-2 rounded bg-red-900/30 text-red-400 border border-red-800/40 text-center">
          {error}
          <button onClick={() => setError('')} className="float-right">✕</button>
        </div>
      )}

      <div className="flex gap-2 border-b pb-2 flex-wrap" style={{ borderColor: 'var(--border)' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`text-sm px-3 py-1 rounded-t ${tab === t.key ? 'font-semibold' : ''}`}
            style={tab === t.key ? { color: 'var(--text-secondary)', borderBottom: '2px solid #34d399' } : { color: 'var(--text-dim)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="space-y-4">
          <div className="card !p-4">
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Account</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-dim)' }}>
                <span>Email:</span>
                <span style={{ color: 'var(--text-primary)' }}>{user?.email || '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-dim)' }}>
                <span>Role:</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-400">{user?.role}</span>
              </div>
              {user?.org_name && (
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-dim)' }}>
                  <span>Organization:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{user.org_name}</span>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={saveUsername} className="card !p-4 space-y-3">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Username</h2>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)}
              className={inputClass} required minLength={3} />
            <button type="submit" disabled={saving} className="btn-primary text-sm !py-2">Update Username</button>
          </form>

          <form onSubmit={saveProfile} className="card !p-4 space-y-3">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Personal Info</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} style={labelStyle}>Full Name</label>
                <input type="text" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>Phone</label>
                <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Bio</label>
              <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} className={inputClass} rows={3} placeholder="Tell us about yourself" />
            </div>
            <button type="submit" disabled={saving} className="btn-primary text-sm !py-2">Save Profile</button>
          </form>
        </div>
      )}

      {tab === 'gym' && (
        <form onSubmit={saveProfile} className="card !p-4 space-y-3">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Gym Stats</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} style={labelStyle}>Height (cm)</label>
              <input type="number" step="0.1" value={form.height} onChange={e => setForm(f => ({ ...f, height: e.target.value }))} className={inputClass} placeholder="175" />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Weight (kg)</label>
              <input type="number" step="0.1" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} className={inputClass} placeholder="75" />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Date of Birth</label>
              <input type="date" value={form.date_of_birth} onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Gender</label>
              <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))} className={inputClass}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Fitness Level</label>
            <select value={form.fitness_level} onChange={e => setForm(f => ({ ...f, fitness_level: e.target.value }))} className={inputClass}>
              <option value="">Select</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="elite">Elite</option>
            </select>
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Fitness Goals</label>
            <textarea value={form.fitness_goals} onChange={e => setForm(f => ({ ...f, fitness_goals: e.target.value }))} className={inputClass} rows={3} placeholder="e.g. Build muscle, lose fat, run a marathon..." />
          </div>
          <button type="submit" disabled={saving} className="btn-primary text-sm !py-2">Save Gym Stats</button>
        </form>
      )}

      {tab === 'security' && (
        <form onSubmit={changePassword} className="card !p-4 space-y-3">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Change Password</h2>
          <div>
            <label className={labelClass} style={labelStyle}>New Password</label>
            <input type="password" value={pwForm.new_password} onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))}
              className={inputClass} required minLength={6} placeholder="At least 6 characters" />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Confirm New Password</label>
            <input type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
              className={inputClass} required minLength={6} placeholder="Repeat password" />
          </div>
          <button type="submit" disabled={saving} className="btn-primary text-sm !py-2">Update Password</button>
        </form>
      )}
    </div>
  );
}
