import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import ProgressChart from '../components/ProgressChart';
import AccumulatedProgressChart from '../components/AccumulatedProgressChart';
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

const SUMMARY_KEY = 'lastWorkoutSummary';

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
  const [lastSummary, setLastSummary] = useState(null);

  const todayRoutine = routines.find(r => r.day_of_week === todayDayName);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SUMMARY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const completedDate = new Date(parsed.completedAt).toISOString().split('T')[0];
        if (completedDate === todayStr) {
          setLastSummary(parsed);
        } else {
          localStorage.removeItem(SUMMARY_KEY);
        }
      }
    } catch {}
  }, []);

  function dismissSummary() {
    setLastSummary(null);
    try { localStorage.removeItem(SUMMARY_KEY); } catch {}
  }

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
    calendarDays.push(i);
  }

  if (loading) return <LoadingSpinner />;

  const activityEntries = Object.entries(todayActivity);

  return (
    <div className="space-y-4">
      {/* Workout summary banner */}
      {lastSummary && (
        <div className="card animate-[fadeInUp_0.3s_ease-out] relative overflow-hidden" style={{ borderColor: 'rgba(16,185,129,0.4)', backgroundImage: 'linear-gradient(to right, rgba(16,185,129,0.08), transparent)' }}>
          <button onClick={dismissSummary} className="absolute top-2 right-2 text-sm" style={{ color: 'var(--text-dim)' }}>✕</button>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>Workout Complete!</p>
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>{lastSummary.routineName} · {lastSummary.duration}</p>
            </div>
            <div className="flex gap-3 text-center">
              <div>
                <div className="text-sm font-bold text-emerald-400">{lastSummary.setsLogged}</div>
                <div className="text-[9px]" style={{ color: 'var(--text-dim)' }}>Sets</div>
              </div>
              <div>
                <div className="text-sm font-bold text-emerald-400">{lastSummary.exercisesDone}</div>
                <div className="text-[9px]" style={{ color: 'var(--text-dim)' }}>Exs</div>
              </div>
              {lastSummary.exercisesSkipped > 0 && (
                <div>
                  <div className="text-sm font-bold" style={{ color: '#f59e0b' }}>{lastSummary.exercisesSkipped}</div>
                  <div className="text-[9px]" style={{ color: 'var(--text-dim)' }}>Skip</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{timeGreeting}!</h1>
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>{todayFormatted}</p>
        </div>
        <div className="flex items-center gap-2">
          {streakDays > 0 && (
            <span className="text-xs px-2 py-1 rounded-full flex items-center gap-1" style={{ backgroundColor: 'rgba(234,88,12,0.3)', color: '#fb923c', border: '1px solid rgba(234,88,12,0.3)' }}>
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
        <div className="rounded-xl p-3 flex items-center justify-between" style={{ backgroundImage: 'linear-gradient(to right, rgba(16,185,129,0.15), rgba(59,130,246,0.1))', border: '1px solid rgba(16,185,129,0.3)' }}>
          <div className="flex items-center gap-2">
            <span className="text-lg">📅</span>
            <div>
              <span className="text-xs" style={{ color: 'var(--text-dim)' }}>Today's routine</span>
              <p className="font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>{todayRoutine.name}</p>
            </div>
          </div>
          <button onClick={() => navigate(`/log?routine=${todayRoutine.id}`)} className="btn-primary text-xs flex items-center gap-1">
            <span>▶</span> Start
          </button>
        </div>
      )}

      <div className="card" style={{ borderColor: 'var(--border)' }}>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>{monthName}</h2>
        <div className="grid grid-cols-7 gap-0.5 text-center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-[9px] font-semibold py-1" style={{ color: 'var(--text-faint)' }}>{d}</div>
          ))}
          {Array.from({ length: monthStartDay }).map((_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {calendarDays.map(day => {
            const dateStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === todayStr;
            const hasLogs = loggedDates.has(dateStr);
            const isSelected = selectedCalendarDay === dateStr;
            return (
              <div key={day} className="relative">
                <button
                  onClick={() => setSelectedCalendarDay(isSelected ? null : dateStr)}
                  className={`w-full rounded-lg py-1 text-xs font-medium transition-all ${
                    isToday
                      ? 'text-emerald-300 ring-1 ring-emerald-700/50'
                      : isSelected
                        ? 'text-gray-200'
                        : 'hover:bg-gray-800/40'
                  }`}
                  style={isToday ? { backgroundColor: 'rgba(6,78,59,0.4)' } : isSelected ? { backgroundColor: 'var(--bg-card-hover)' } : { color: 'var(--text-dim)' }}
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

      {/* Today's Activity — Carousel */}
      {activityEntries.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Today's Activity</h2>
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 scrollbar-hide">
            {activityEntries.map(([name, data]) => {
              const mc = muscleColors[data.muscle] || {};
              const volume = data.sets.reduce((sum, s) => sum + (Number(s.weight) || 0) * (s.reps || 1), 0);
              return (
                <div key={name} className={`snap-start shrink-0 w-72 card !p-3 border-l-4 ${mc.border || 'border-l-gray-600'}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span>{mc.emoji || '💪'}</span>
                      <span className="font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>{name}</span>
                    </div>
                    <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{volume.toLocaleString()}kg</span>
                  </div>
                  <div className="space-y-0.5">
                    {data.sets.map((set, i) => (
                      <div key={set.id} className="flex items-center gap-2 text-xs">
                        <span className="w-5" style={{ color: 'var(--text-faint)' }}>S{i + 1}</span>
                        <span className="text-emerald-400 font-medium">{Number(set.weight).toFixed(1)}kg</span>
                        <span style={{ color: 'var(--text-dim)' }}>× {set.reps}</span>
                        {set.notes && <span className="text-xs italic" style={{ color: 'var(--text-faint)' }}>— {set.notes}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activityEntries.length === 0 && (
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
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>📈 Per-Exercise Progress</h2>
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
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>🎯 Active Goals</h2>
          {goals.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-xs mb-2" style={{ color: 'var(--text-dim)' }}>No active goals</p>
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
                    <span className="truncate" style={{ color: 'var(--text-secondary)' }}>{goal.exercise_name}</span>
                    <span style={{ color: 'var(--text-dim)' }}>{goal.current_weight || 0}/{goal.target_weight}kg</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Accumulated Progress Chart */}
      <div className="card">
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>📊 Weekly Volume (90 days)</h2>
        <AccumulatedProgressChart />
      </div>
    </div>
  );
}
