import { NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { sidebarCollapsed: collapsed, setSidebarCollapsed: setCollapsed, theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const isAuthed = !!user;
  const isSuperadmin = user?.role === 'superadmin';
  const isAdmin = user?.role === 'admin';
  const isClient = user?.role === 'client' || user?.role === 'ghost';

  let links = [];
  if (isSuperadmin) {
    links = [
      { to: '/', label: 'Dashboard', icon: '📊' },
      { to: '/org', label: 'Reports', icon: '📈' },
      { to: '/exercises', label: 'Exercises', icon: '🏋️' },
      { to: '/clients', label: 'Clients', icon: '👥' },
      { to: '/history', label: 'History', icon: '📜' },
    ];
  } else if (isAdmin) {
    links = [
      { to: '/', label: 'Dashboard', icon: '📊' },
      { to: '/exercises', label: 'Exercises', icon: '🏋️' },
      { to: '/routines', label: 'Routines', icon: '📋' },
      { to: '/assign', label: 'Assign', icon: '🔗' },
      { to: '/admin', label: 'Clients', icon: '👥' },
      { to: '/history', label: 'History', icon: '📜' },
    ];
  } else if (isClient) {
    links = [
      { to: '/', label: 'Dashboard', icon: '📊' },
      { to: '/log', label: 'Log', icon: '💪' },
      { to: '/exercises', label: 'Exercises', icon: '🏋️' },
      { to: '/routines', label: 'Routines', icon: '📋' },
      { to: '/goals', label: 'Goals', icon: '🎯' },
      { to: '/history', label: 'History', icon: '📜' },
    ];
  }

  function navClass({ isActive }) {
    const base = 'flex items-center gap-3 rounded-lg transition-all duration-200 ';
    const activeStyle = isActive
      ? 'bg-emerald-600/20 text-emerald-400 shadow-sm shadow-emerald-900/20'
      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60';
    const size = collapsed ? 'justify-center px-0 py-2.5 mx-1' : 'px-3 py-2 mx-2';
    return base + activeStyle + ' ' + size;
  }

  const sidebarContent = (
    <div
      className={`h-full flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-56'}`}
      style={{ backgroundColor: 'var(--bg-sidebar)' }}
    >
      <div className={`flex items-center h-14 shrink-0 border-b ${collapsed ? 'justify-center px-0' : 'px-4'}`} style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={() => setCollapsed(c => !c)}
          className="text-gray-400 hover:text-gray-200 transition-colors p-1 rounded-lg hover:bg-gray-800/60"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {collapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            )}
          </svg>
        </button>
        {!collapsed && (
          <NavLink to="/" className="ml-2 text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            GymTracker
          </NavLink>
        )}
      </div>

      {isAuthed && (
        <nav className="flex-1 flex flex-col gap-0.5 py-2 overflow-y-auto">
          {links.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} end={to === '/'} className={navClass}>
              <span className="text-lg shrink-0">{icon}</span>
              {!collapsed && <span className="text-sm font-medium truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>
      )}

      {isAuthed && !collapsed && (
        <div className="shrink-0 border-t px-3 py-2" style={{ borderColor: 'var(--border)' }}>
          <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{user.username}</div>
          <div className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{user.role === 'ghost' ? 'ghost' : user.role}</div>
        </div>
      )}

      <div className="shrink-0 border-t py-2" style={{ borderColor: 'var(--border)' }}>
        {isAuthed ? (
          <button
            onClick={logout}
            className={`flex items-center gap-3 rounded-lg transition-all duration-200 text-gray-400 hover:text-red-400 hover:bg-red-900/20 w-full ${collapsed ? 'justify-center px-0 py-2.5 mx-1' : 'px-3 py-2 mx-2'}`}
            title="Logout"
          >
            <span className="text-lg shrink-0">🚪</span>
            {!collapsed && <span className="text-sm font-medium truncate">Logout</span>}
          </button>
        ) : (
          <NavLink
            to="/login"
            className={`flex items-center gap-3 rounded-lg transition-all duration-200 text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 w-full ${collapsed ? 'justify-center px-0 py-2.5 mx-1' : 'px-3 py-2 mx-2'}`}
          >
            <span className="text-lg shrink-0">🔑</span>
            {!collapsed && <span className="text-sm font-medium truncate">Sign In</span>}
          </NavLink>
        )}
        <button
          onClick={toggleTheme}
          className={`flex items-center gap-3 rounded-lg transition-all duration-200 text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 w-full ${collapsed ? 'justify-center px-0 py-2.5 mx-1' : 'px-3 py-2 mx-2'}`}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className="text-lg shrink-0">{theme === 'dark' ? '☀️' : '🌙'}</span>
          {!collapsed && <span className="text-sm font-medium truncate">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <details className="lg:hidden fixed top-3 left-3 z-50">
        <summary
          className="p-2 rounded-lg cursor-pointer list-none"
          style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </summary>
        <div className="fixed inset-0 z-40" style={{ backgroundColor: 'var(--overlay)' }} onClick={e => e.currentTarget.closest('details').open = false} />
        <div className="fixed top-0 left-0 z-50 h-full shadow-2xl" style={{ borderRight: '1px solid var(--border)' }}>
          {sidebarContent}
        </div>
      </details>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:flex top-0 left-0 z-30 h-full" style={{ borderRight: '1px solid var(--border)' }}>
        {sidebarContent}
      </div>
    </>
  );
}
