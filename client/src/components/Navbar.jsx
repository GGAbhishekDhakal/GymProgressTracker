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
    <nav className="bg-gray-900/80 border-b border-gray-800/80 sticky top-0 z-50 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <NavLink to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-emerald-900/30 group-hover:shadow-emerald-900/50 transition-shadow">
              G
            </div>
            <span className="text-lg font-bold text-white tracking-tight hidden sm:block">GymTracker</span>
          </NavLink>
          <div className="flex gap-0.5 overflow-x-auto">
            {links.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-600/20 text-emerald-400 shadow-sm shadow-emerald-900/20'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
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
