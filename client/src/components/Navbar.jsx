import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/log', label: 'Log', icon: '💪' },
  { to: '/exercises', label: 'Exercises', icon: '🏋️' },
  { to: '/routines', label: 'Routines', icon: '📋' },
  { to: '/goals', label: 'Goals', icon: '🎯' },
  { to: '/history', label: 'History', icon: '📜' },
];

export default function Navbar() {
  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <span className="text-lg font-bold text-emerald-400 tracking-tight">GymTracker</span>
          <div className="flex gap-1 overflow-x-auto">
            {links.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-600/20 text-emerald-400'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }`
                }
              >
                <span>{icon}</span>
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
