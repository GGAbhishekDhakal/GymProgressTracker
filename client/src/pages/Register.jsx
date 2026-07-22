import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState('org'); // 'org' | 'ghost' | 'join'
  const [orgName, setOrgName] = useState('');
  const { register, joinOrg } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setBusy(true);
    try {
      if (mode === 'ghost') {
        await register(username, password, true);
        navigate('/', { replace: true });
        return;
      }
      if (mode === 'join') {
        if (!orgName.trim()) { setError('Organization name is required'); setBusy(false); return; }
        const result = await joinOrg(username, password, orgName.trim());
        setSuccess(result.message || 'Account created!');
        return;
      }
      // mode === 'org' → superadmin creating org
      if (!orgName.trim()) { setError('Organization name is required'); setBusy(false); return; }
      const result = await register(username, password, false, orgName.trim());
      setSuccess(result.message || 'Account created!');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-sm card !p-6 space-y-5">
        <div className="text-center">
          <h1 className="text-xl font-bold">Create Account</h1>
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Join the gym tracker</p>
        </div>

        {error && (
          <div className="text-sm p-2 rounded bg-red-900/30 text-red-400 text-center border border-red-800/40">
            {error}
          </div>
        )}

        {success && (
          <div className="text-sm p-2 rounded bg-emerald-900/30 text-emerald-400 text-center border border-emerald-800/40">
            {success}
            <div className="mt-2">
              <Link to="/login" className="text-emerald-300 hover:text-emerald-200 underline">Go to login</Link>
            </div>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mode selector */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'org', label: 'Create Org', desc: 'New organization' },
                { key: 'join', label: 'Join Org', desc: 'Join existing org' },
                { key: 'ghost', label: 'Solo Mode', desc: 'No trainer' },
              ].map(m => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMode(m.key)}
                  className={`text-center p-2 rounded-lg border text-xs transition-colors ${
                    mode === m.key ? 'border-emerald-500/50 bg-emerald-900/20 text-emerald-400' : 'border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <div className="font-medium">{m.label}</div>
                  <div className="text-[10px] opacity-70">{m.desc}</div>
                </button>
              ))}
            </div>

            {/* Org name field (org + join modes) */}
            {mode !== 'ghost' && (
              <div>
                <label className="text-xs font-medium" style={{ color: 'var(--text-dim)' }}>
                  {mode === 'org' ? 'Organization Name' : 'Organization to Join'}
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  className="w-full !py-2 mt-1"
                  placeholder={mode === 'org' ? 'e.g. Iron Paradise Gym' : 'Enter exact org name'}
                  required
                  autoFocus={mode !== 'ghost'}
                />
              </div>
            )}

            <div>
              <label className="text-xs font-medium" style={{ color: 'var(--text-dim)' }}>Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full !py-2 mt-1"
                placeholder="Choose a username"
                required
                minLength={3}
              />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: 'var(--text-dim)' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full !py-2 mt-1"
                placeholder="At least 6 characters"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: 'var(--text-dim)' }}>Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="w-full !py-2 mt-1"
                placeholder="Repeat password"
                required
              />
            </div>
            <button type="submit" disabled={busy} className="btn-primary w-full !py-2.5">
              {busy ? 'Creating...' : mode === 'org' ? 'Create Organization' : mode === 'join' ? 'Request to Join' : 'Create Solo Account'}
            </button>
          </form>
        )}

        {!success && (
          <p className="text-center text-xs" style={{ color: 'var(--text-faint)' }}>
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-400 hover:text-emerald-300">Sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
}
