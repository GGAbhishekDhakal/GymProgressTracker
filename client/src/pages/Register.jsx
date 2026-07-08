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
  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setBusy(true);
    try {
      const result = await register(username, password);
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
                autoFocus
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
              {busy ? 'Creating...' : 'Create Account'}
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
