import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import ProgressChart from '../components/ProgressChart';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const hours = new Date().getHours();
const timeGreeting = hours < 12 ? 'Good morning' : hours < 18 ? 'Good afternoon' : 'Good evening';
const todayStr = new Date().toISOString().split('T')[0];
const todayDate = new Date();
const todayDayName = todayDate.toLocaleDateString('en-US', { weekday: 'long' });
const todayFormatted = todayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
const firstOfMonth = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1).toISOString().split('T')[0];
const lastOfMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0).toISOString().split('T')[0];
const monthName = todayDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
const monthStartDay = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1).getDay();
const daysInMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0).getDate();

const muscleColors = {
  Chest: { emoji: '🦍', border: 'border-l-red-500/40', text: 'text-red-400' },
  Back: { emoji: '🔱', border: 'border-l-emerald-500/40', text: 'text-emerald-400' },
  Shoulders: { emoji: '🏔️', border: 'border-l-orange-500/40', text: 'text-orange-400' },
  Legs: { emoji: '🦵', border: 'border-l-blue-500/40', text: 'text-blue-400' },
  Arms: { emoji: '💪', border: 'border-l-purple-500/40', text: 'text-purple-400' },
  Core: { emoji: '🔥', border: 'border-l-yellow-500/40', text: 'text-yellow-400' },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [todayLogs, setTodayLogs] = useState([]);
  const [monthLogs, setMonthLogs] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [goals, setGoals] = useState([]);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);

  const todayRoutine = routines.find(r => r.day_of_week === todayDayName);

  useEffect(() => {
    Promise.all([
      api.getLogs({ from: todayStr, to: todayStr }),
      api.getLogs({ from: firstOfMonth, to: lastOfMonth, limit: '500' }),
      api.getRoutines(),
      api.getExercises(),
      api.getGoals(),
    ]).then(([tdLogs, mLogs, rtData, exData, glData]) => {
      setTodayLogs(tdLogs);
      setMonthLogs(mLogs);
      setRoutines(rtData);
      setExercises(exData);
      setGoals(glData.filter(g => g.status === 'active'));
      if (exData.length) setSelectedExercise(exData[0].id);
    }).catch(() => {
      setTodayLogs([]);
      setMonthLogs([]);
    }).finally(() => setLoading(false));
  }, []);

  const todayExercises = [...new Set(todayLogs.map(l => l.exercise_id))];
  const todayVolume = todayLogs.reduce((sum, l) => sum + (Number(l.weight) || 0) * (l.reps || 1), 0);
  const todaySets = todayLogs.length;

  const loggedDates = new Set(monthLogs.map(l => l.logged_at));

  const todayActivity = {};
  for (const log of todayLogs) {
    const name = log.exercise_name || 'Unknown';
    if (!todayActivity[name]) {
      todayActivity[name] = { id: log.exercise_id, muscle: log.muscle_group, sets: [] };
    }
    todayActivity[name].sets.push(log);
  }

  const dayLogs = {};
  for (const log of monthLogs) {
    if (!dayLogs[log.logged_at]) dayLogs[log.logged_at] = [];
    dayLogs[log.logged_at].push(log);
  }

  function getDaySummary(date) {
    const logs = dayLogs[date] || [];
    const exNames = [...new Set(logs.map(l => l.exercise_name || 'Unknown'))];
    return { count: logs.length, exercises: exNames };
  }

  const streakDays = (() => {
    const dates = [...new Set(monthLogs.filter(l => l.logged_at <= todayStr).map(l => l.logged_at))]
      .sort((a, b) => new Date(b) - new Date(a));
    if (dates.length === 0) return 0;
    if (dates[0] !== todayStr && dates[0] !== new Date(Date.now() - 86400000).toISOString().split('T')[0]) return 0;
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

  const calendarDays = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    calendarDays.push(i);
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{timeGreeting}!</h1>
          <p className="text-sm text-gray-500">{todayFormatted}</p>
        </div>
        <div className="flex items-center gap-2">
          {streakDays > 0 && (
            <span className="text-xs bg-orange-900/30 text-orange-400 px-2 py-1 rounded-full border border-orange-800/30 flex items-center gap-1">
              🔥 {streakDays}d
            </span>
          )}
          <Link to="/log" className="btn-primary text-sm flex items-center gap-1">
            <span>💪</span> Log
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="stat-card !py-3">
          <div className="text-lg mb-0.5">🏋️</div>
          <div className="stat-value text-lg">{todaySets}</div>
          <div className="stat-label text-[10px]">Sets today</div>
        </div>
        <div className="stat-card !py-3">
          <div className="text-lg mb-0.5">💪</div>
          <div className="stat-value text-lg">{todayExercises.length}</div>
          <div className="stat-label text-[10px]">Exercises</div>
        </div>
        <div className="stat-card !py-3">
          <div className="text-lg mb-0.5">📊</div>
          <div className="stat-value text-lg">{todayVolume.toLocaleString()}</div>
          <div className="stat-label text-[10px]">Volume kg</div>
        </div>
      </div>

      {todayRoutine && (
        <div className="bg-gradient-to-r from-emerald-900/30 to-blue-900/20 border border-emerald-800/40 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📅</span>
            <div>
              <span className="text-xs text-gray-500">Today's routine</span>
              <p className="font-semibold text-gray-200 text-sm">{todayRoutine.name}</p>
            </div>
          </div>
          <button onClick={() => navigate(`/log?routine=${todayRoutine.id}`)} className="btn-primary text-xs flex items-center gap-1">
            <span>▶</span> Start
          </button>
        </div>
      )}

      <div className="card border-gray-700/50">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{monthName}</h2>
        <div className="grid grid-cols-7 gap-0.5 text-center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-[9px] text-gray-600 font-semibold py-1">{d}</div>
          ))}
          {Array.from({ length: monthStartDay }).map((_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {calendarDays.map(day => {
            const dateStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === todayStr;
            const hasLogs = loggedDates.has(dateStr);
            const isSelected = selectedCalendarDay === dateStr;
            const summary = isSelected ? getDaySummary(dateStr) : null;
            return (
              <div key={day} className="relative">
                <button
                  onClick={() => setSelectedCalendarDay(isSelected ? null : dateStr)}
                  className={`w-full rounded-lg py-1 text-xs font-medium transition-all ${
                    isToday
                      ? 'bg-emerald-900/40 text-emerald-300 ring-1 ring-emerald-700/50'
                      : isSelected
                        ? 'bg-gray-700/50 text-gray-200'
                        : 'text-gray-500 hover:bg-gray-800/50'
                  }`}
                >
                  {day}
                  {hasLogs && !isToday && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
        {selectedCalendarDay && (() => {
          const summary = getDaySummary(selectedCalendarDay);
          const dayDate = new Date(selectedCalendarDay + 'T00:00:00');
          const weekdayName = dayDate.toLocaleDateString('en-US', { weekday: 'long' });
          const dayRoutines = routines.filter(r => r.day_of_week === weekdayName);
          return (
            <div className="mt-2 pt-2 border-t animate-[fadeInUp_0.2s_ease-out]" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {selectedCalendarDay === todayStr ? 'Today' : dayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}:
                {' '}{summary.count} set{summary.count !== 1 ? 's' : ''}
                {summary.exercises.length > 0 && (
                  <> — <span style={{ color: 'var(--text-dim)' }}>{summary.exercises.slice(0, 3).join(', ')}{summary.exercises.length > 3 ? '...' : ''}</span></>
                )}
              </p>
              {dayRoutines.length > 0 && (
                <div className="mt-1.5 space-y-1">
                  {dayRoutines.map(r => (
                    <div key={r.id} className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>📋 {r.name}</span>
                      <button
                        onClick={() => navigate(`/log?routine=${r.id}`)}
                        className="text-[10px] text-emerald-400 hover:text-emerald-300"
                      >
                        Start ▶
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {todayLogs.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-300 mb-2">Today's Activity</h2>
          <div className="space-y-2">
            {Object.entries(todayActivity).map(([name, data]) => {
              const mc = muscleColors[data.muscle] || {};
              const volume = data.sets.reduce((sum, s) => sum + (Number(s.weight) || 0) * (s.reps || 1), 0);
              return (
                <div key={name} className={`card !p-3 border-l-4 ${mc.border || 'border-l-gray-600'}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span>{mc.emoji || '💪'}</span>
                      <span className="font-medium text-sm text-gray-200">{name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{volume.toLocaleString()}kg</span>
                  </div>
                  <div className="space-y-0.5">
                    {data.sets.map((set, i) => (
                      <div key={set.id} className="flex items-center gap-2 text-xs">
                        <span className="text-gray-600 w-5">S{i + 1}</span>
                        <span className="text-emerald-400 font-medium">{Number(set.weight).toFixed(1)}kg</span>
                        <span className="text-gray-500">× {set.reps}</span>
                        {set.notes && <span className="text-gray-600 italic">— {set.notes}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {todayLogs.length === 0 && (
        <EmptyState
          icon="💪"
          title="No activity today"
          description="Log your first set to start tracking!"
          action={<Link to="/log" className="btn-primary text-sm">Log Workout</Link>}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-300">📈 Progress</h2>
            <select
              value={selectedExercise || ''}
              onChange={(e) => setSelectedExercise(parseInt(e.target.value))}
              className="w-auto text-xs !py-1 !px-2"
            >
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </select>
          </div>
          {selectedExercise && <ProgressChart exerciseId={selectedExercise} />}
        </div>

        <div className="card space-y-3">
          <h2 className="text-sm font-semibold text-gray-300">🎯 Active Goals</h2>
          {goals.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500 text-xs mb-2">No active goals</p>
              <Link to="/goals" className="text-xs text-emerald-400 hover:text-emerald-300">Set a goal →</Link>
            </div>
          ) : (
            goals.slice(0, 4).map(goal => {
              const pct = goal.current_weight && goal.target_weight > 0
                ? Math.min(100, Math.round((goal.current_weight / goal.target_weight) * 100))
                : 0;
              return (
                <div key={goal.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-300 truncate">{goal.exercise_name}</span>
                    <span className="text-gray-500">{goal.current_weight || 0}/{goal.target_weight}kg</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
