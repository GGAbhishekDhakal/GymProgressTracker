import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import ProgressChart from '../components/ProgressChart';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const greetings = ['Let\'s go!', 'Time to grind!', 'Keep pushing!', 'One more rep!', 'PR incoming!', 'No days off!'];
const hours = new Date().getHours();
const timeGreeting = hours < 12 ? 'Good morning' : hours < 18 ? 'Good afternoon' : 'Good evening';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [goals, setGoals] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [greeting] = useState(greetings[Math.floor(Math.random() * greetings.length)]);

  useEffect(() => {
    Promise.all([
      api.getStats(),
      api.getExercises(),
      api.getLogs({ limit: '50' }),
      api.getGoals(),
    ]).then(([statsData, exercisesData, logsData, goalsData]) => {
      setStats(statsData);
      setExercises(exercisesData);
      setRecentLogs(logsData);
      setGoals(goalsData.filter(g => g.status === 'active'));
      if (exercisesData.length) setSelectedExercise(exercisesData[0].id);
    }).catch(() => {
      setStats({ totalWorkouts: 0, totalEntries: 0, activeGoals: 0 });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const groupedLogs = {};
  for (const log of recentLogs) {
    const key = log.exercise_name || 'Unknown';
    if (!groupedLogs[key]) groupedLogs[key] = [];
    groupedLogs[key].push(log);
  }

  const exerciseNames = Object.keys(groupedLogs).slice(0, 5);

  const streakDays = (() => {
    const dates = [...new Set(recentLogs.map(l => l.logged_at))].sort((a, b) => new Date(b) - new Date(a));
    if (dates.length === 0) return 0;
    let streak = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diff = (prev - curr) / (1000 * 60 * 60 * 24);
      if (diff <= 1.5) streak++;
      else break;
    }
    return streak;
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{timeGreeting}!</h1>
          <p className="text-emerald-400 text-sm font-medium">{greeting}</p>
        </div>
        <Link to="/log" className="btn-primary text-sm flex items-center gap-1">
          <span>💪</span> Log Workout
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="stat-card">
          <div className="text-2xl mb-1">🗓️</div>
          <div className="stat-value">{stats.totalWorkouts}</div>
          <div className="stat-label">Workout Days</div>
        </div>
        <div className="stat-card">
          <div className="text-2xl mb-1">📊</div>
          <div className="stat-value">{stats.totalEntries}</div>
          <div className="stat-label">Total Sets</div>
        </div>
        <div className="stat-card">
          <div className="text-2xl mb-1">🏋️</div>
          <div className="stat-value">{exercises.length}</div>
          <div className="stat-label">Exercises</div>
        </div>
        <div className="stat-card">
          <div className="text-2xl mb-1">🎯</div>
          <div className="stat-value">{stats.activeGoals}</div>
          <div className="stat-label">Active Goals</div>
        </div>
      </div>

      {streakDays > 0 && (
        <div className="card bg-gradient-to-r from-orange-900/20 to-gray-900 border-orange-800/30 text-center py-3">
          <span className="text-lg">🔥</span>
          <span className="text-orange-400 font-semibold ml-2">{streakDays} day streak!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-200">📈 Progress</h2>
            <select
              value={selectedExercise || ''}
              onChange={(e) => setSelectedExercise(parseInt(e.target.value))}
              className="w-auto text-sm !py-1 !px-2"
            >
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </select>
          </div>
          {selectedExercise && <ProgressChart exerciseId={selectedExercise} />}
        </div>

        <div className="card space-y-3">
          <h2 className="text-lg font-semibold text-gray-200">🎯 Active Goals</h2>
          {goals.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm mb-2">No active goals</p>
              <Link to="/goals" className="text-sm text-emerald-400 hover:text-emerald-300">Set a goal →</Link>
            </div>
          ) : (
            goals.slice(0, 4).map(goal => {
              const pct = goal.current_weight && goal.target_weight > 0
                ? Math.min(100, Math.round((goal.current_weight / goal.target_weight) * 100))
                : 0;
              return (
                <div key={goal.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300 truncate">{goal.exercise_name}</span>
                    <span className="text-gray-500">{goal.current_weight || 0}/{goal.target_weight}kg</span>
                  </div>
                  <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
          {goals.length > 4 && (
            <Link to="/goals" className="text-xs text-gray-500 hover:text-gray-300">+{goals.length - 4} more</Link>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-200">📝 Recent Activity</h2>
          <Link to="/history" className="text-sm text-emerald-400 hover:text-emerald-300">View all →</Link>
        </div>
        {recentLogs.length === 0 ? (
          <EmptyState
            icon="💪"
            title="No workouts logged yet"
            description="Log your first workout to start tracking progress!"
            action={<Link to="/log" className="btn-primary text-sm">Log Workout</Link>}
          />
        ) : (
          <div className="space-y-3">
            {exerciseNames.map(name => {
              const logs = groupedLogs[name];
              const latest = logs[0];
              const todayStr = new Date().toISOString().split('T')[0];
              const todayCount = logs.filter(l => l.logged_at === todayStr).length;
              return (
                <Link key={name} to={`/history?exercise=${latest.exercise_id}`} className="card flex items-center justify-between !py-3 !px-4 hover:border-emerald-800/50 transition-colors group">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-gray-400 group-hover:text-emerald-400 font-medium truncate">{name}</span>
                    <span className="text-emerald-400 font-semibold whitespace-nowrap">{Number(latest.weight).toFixed(1)}kg</span>
                    <span className="text-gray-500 text-sm">× {latest.reps}</span>
                    {todayCount > 0 && (
                      <span className="text-[10px] bg-emerald-600/20 text-emerald-400 px-1.5 py-0.5 rounded-full whitespace-nowrap">Today</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{logs.length} set{logs.length !== 1 ? 's' : ''}</span>
                    <span className="text-xs text-gray-600">
                      {new Date(latest.logged_at).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
