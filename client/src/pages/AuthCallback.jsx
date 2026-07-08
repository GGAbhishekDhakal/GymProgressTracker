import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { api } from '../api';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function AuthCallback() {
  const [status, setStatus] = useState('Processing...');
  const [needsUsername, setNeedsUsername] = useState(false);
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        setStatus('No session found');
        return;
      }
      try {
        const data = await api.request('/auth/me', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        localStorage.setItem('authSession', JSON.stringify({ user: data.user, session }));
        api.setToken(session.access_token);
        navigate('/', { replace: true });
      } catch {
        setNeedsUsername(true);
        setStatus('Welcome! Choose a username to complete setup.');
      }
    });
  }, [navigate]);

  async function handleSetup(e) {
    e.preventDefault();
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const data = await api.request('/auth/google-setup', {
        method: 'POST',
        body: JSON.stringify({ username }),
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      localStorage.setItem('authSession', JSON.stringify({ user: data.user, session }));
      api.setToken(session.access_token);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    }
  }

  if (needsUsername) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-full max-w-sm card !p-6 space-y-4">
          <h2 className="text-lg font-semibold text-center">Choose a Username</h2>
          <p className="text-xs text-center" style={{ color: 'var(--text-dim)' }}>One more step to get started</p>
          {error && (
            <div className="text-sm p-2 rounded bg-red-900/30 text-red-400 text-center border border-red-800/40">
              {error}
            </div>
          )}
          <form onSubmit={handleSetup} className="space-y-3">
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full !py-2"
              placeholder="Enter username"
              required
              minLength={3}
              autoFocus
            />
            <button type="submit" className="btn-primary w-full !py-2.5">Complete Setup</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="animate-spin text-2xl">⏳</div>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>{status}</p>
      </div>
    </div>
  );
}
