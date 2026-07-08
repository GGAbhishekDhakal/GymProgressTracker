import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { api } from '../api';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('authSession');
    if (stored) {
      const session = JSON.parse(stored);
      setUser(session.user);
      api.setToken(session.session.access_token);
    }
    setLoading(false);

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        localStorage.setItem('authSession', JSON.stringify({ user: { id: session.user.id, email: session.user.email }, session }));
        api.setToken(session.access_token);
        fetchProfile(session.access_token);
      } else {
        localStorage.removeItem('authSession');
        api.setToken(null);
        setUser(null);
      }
    });
    return () => listener?.subscription?.unsubscribe();
  }, []);

  async function fetchProfile(token) {
    try {
      const data = await api.request('/auth/me');
      setUser(data.user);
    } catch {
      setUser(null);
    }
  }

  const login = useCallback(async (username, password) => {
    const data = await api.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (data.pending) throw new Error(data.error);
    localStorage.setItem('authSession', JSON.stringify({ user: data.user, session: data.session }));
    api.setToken(data.session.access_token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (username, password) => {
    return api.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authSession');
    api.setToken(null);
    setUser(null);
    supabase.auth.signOut();
  }, []);

  const loginWithGoogle = useCallback(() => {
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }, []);

  const setupGoogleUser = useCallback(async (username) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No session');
    const data = await api.request('/auth/google-setup', {
      method: 'POST',
      body: JSON.stringify({ username }),
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    localStorage.setItem('authSession', JSON.stringify({ user: data.user, session }));
    api.setToken(session.access_token);
    setUser(data.user);
    return data;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, loginWithGoogle, setupGoogleUser, supabase }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
