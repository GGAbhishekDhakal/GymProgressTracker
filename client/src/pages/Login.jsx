import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(username, password);
      navigate('/', { replace: true });
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
          <h1 className="text-xl font-bold">Welcome Back</h1>
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Sign in to continue</p>
        </div>

        {error && (
          <div className="text-sm p-2 rounded bg-red-900/30 text-red-400 text-center border border-red-800/40">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium" style={{ color: 'var(--text-dim)' }}>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full !py-2 mt-1"
              placeholder="Enter username"
              required
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
              placeholder="Enter password"
              required
            />
          </div>
          <button type="submit" disabled={busy} className="btn-primary w-full !py-2.5">
            {busy ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" style={{ borderColor: 'var(--border)' }} />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-faint)' }}>or</span>
          </div>
        </div>

        <button onClick={loginWithGoogle} className="btn-secondary w-full !py-2.5 flex items-center justify-center gap-2">
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Sign in with Google
        </button>

        <p className="text-center text-xs" style={{ color: 'var(--text-faint)' }}>
          Don't have an account?{' '}
          <Link to="/register" className="text-emerald-400 hover:text-emerald-300">Register</Link>
        </p>
      </div>
    </div>
  );
}
