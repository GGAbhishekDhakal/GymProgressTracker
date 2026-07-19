import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import LogForm from '../components/LogForm';
import ExerciseCard from '../components/ExerciseCard';
import LoadingSpinner from '../components/LoadingSpinner';

const muscleGroups = ['Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Core'];
const muscleColors = {
  Chest: { border: 'border-l-red-500/50', emoji: '🦍', text: 'text-red-400', bg: 'bg-red-500/10' },
  Back: { border: 'border-l-emerald-500/50', emoji: '🔱', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  Shoulders: { border: 'border-l-orange-500/50', emoji: '🏔️', text: 'text-orange-400', bg: 'bg-orange-500/10' },
  Legs: { border: 'border-l-blue-500/50', emoji: '🦵', text: 'text-blue-400', bg: 'bg-blue-500/10' },
  Arms: { border: 'border-l-purple-500/50', emoji: '💪', text: 'text-purple-400', bg: 'bg-purple-500/10' },
  Core: { border: 'border-l-yellow-500/50', emoji: '🔥', text: 'text-yellow-400', bg: 'bg-yellow-500/10' },
};

const DRAFT_KEY = 'logFormDraft';
const SUMMARY_KEY = 'lastWorkoutSummary';

function hasDraft() {
  try { return !!localStorage.getItem(DRAFT_KEY); } catch { return false; }
}
function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch {}
}
function saveSummary(data) {
  try { localStorage.setItem(SUMMARY_KEY, JSON.stringify(data)); } catch {}
}

export default function LogWorkout() {
  const { user } = useAuth();
  const isClient = user && (user.role === 'client' || user.role === 'ghost');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [exercises, setExercises] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [mode, setMode] = useState(null);
  const [selectedRoutine, setSelectedRoutine] = useState(null);
  const [routineExercises, setRoutineExercises] = useState([]);
  const [completedExIds, setCompletedExIds] = useState([]);
  const [skippedExIds, setSkippedExIds] = useState([]);
  const [loggingExId, setLoggingExId] = useState(null);
  const [startedAt, setStartedAt] = useState(null);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [muscleFilter, setMuscleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [logKey, setLogKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [todayLoggedExIds, setTodayLoggedExIds] = useState(new Set());
  const [incompleteExs, setIncompleteExs] = useState([]);
  const finishCalled = useRef(false);
  const todayStr = new Date().toISOString().split('T')[0];

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDayName = dayNames[new Date().getDay()];
  const todayRoutine = routines.find(r => r.day_of_week === todayDayName);

  useEffect(() => {
    setShowDraftBanner(hasDraft());
  }, []);

  useEffect(() => {
    Promise.all([
      api.getExercises(),
      api.getRoutines(),
      api.getLogs({ from: todayStr, to: todayStr }),
    ]).then(([exData, rtData, tdLogs]) => {
      setExercises(exData);
      setRoutines(rtData);
      const loggedSet = new Set(tdLogs.map(l => l.exercise_id));
      setTodayLoggedExIds(loggedSet);

      const routineParam = searchParams.get('routine');
      if (routineParam && rtData.length > 0) {
        const rt = rtData.find(r => r.id === parseInt(routineParam));
        if (rt) {
          startRoutineInternal(rt, exData, loggedSet);
          setMode('routine');
        }
      }
    }).finally(() => setLoading(false));
  }, []);

  function startRoutineInternal(rt, exsOverride, loggedSet) {
    const exs = exsOverride
      ? exsOverride.filter(e => rt.exercise_ids?.includes(e.id))
      : exercises.filter(e => rt.exercise_ids?.includes(e.id));
    setSelectedRoutine(rt.id);
    setRoutineExercises(exs);
    const alreadyLogged = (loggedSet || todayLoggedExIds);
    setCompletedExIds(prev => {
      const merged = new Set([...prev, ...exs.filter(e => alreadyLogged.has(e.id)).map(e => e.id)]);
      return [...merged];
    });
    setSkippedExIds([]);
    setLoggingExId(null);
    setStartedAt(prev => prev || new Date());
    setShowSummary(false);
    setShowFinishConfirm(false);
    finishCalled.current = false;
  }

  function startRoutine(id) {
    const idNum = parseInt(id);
    if (!idNum) return;
    const rt = routines.find(r => r.id === idNum);
    if (!rt) return;
    setMode('routine');
    startRoutineInternal(rt);
  }

  function startManual() {
    setMode('manual');
    setSelectedExercises([]);
  }

  function toggleExercise(id) {
    setSelectedExercises(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function handleLogged() {
    if (loggingExId) {
      setCompletedExIds(prev => [...new Set([...prev, loggingExId])]);
      setTodayLoggedExIds(prev => new Set([...prev, loggingExId]));
    }
    setLoggingExId(null);
    setLogKey(k => k + 1);
  }

  function handleSkip(exId) {
    setSkippedExIds(prev => [...new Set([...prev, exId])]);
  }

  function exitToMenu() {
    setMode(null);
    setSelectedRoutine(null);
    setRoutineExercises([]);
    setCompletedExIds([]);
    setSkippedExIds([]);
    setLoggingExId(null);
    setStartedAt(null);
    setShowSummary(false);
    setShowFinishConfirm(false);
    setSelectedExercises([]);
    finishCalled.current = false;
  }

  function resumeDraft() {
    setShowDraftBanner(false);
    if (hasDraft()) setMode('manual');
  }

  function discardDraft() {
    clearDraft();
    setShowDraftBanner(false);
  }

  async function handleFinishClick() {
    let currentIncomplete;
    if (mode === 'routine') {
      currentIncomplete = routineExercises.filter(
        ex => !completedExIds.includes(ex.id) && !skippedExIds.includes(ex.id) && !todayLoggedExIds.has(ex.id)
      );
    } else {
      currentIncomplete = exercises.filter(
        ex => selectedExercises.includes(ex.id) && !todayLoggedExIds.has(ex.id)
      );
    }

    if (currentIncomplete.length > 0) {
      setIncompleteExs(currentIncomplete);
      setShowFinishConfirm(true);
    } else {
      finishWorkout();
    }
  }

  function finishWorkout() {
    if (finishCalled.current) return;
    finishCalled.current = true;

    const now = new Date();
    const durationMs = startedAt ? now - startedAt : 0;
    const minutes = Math.floor(durationMs / 60000);
    const durationStr = minutes >= 60
      ? `${Math.floor(minutes / 60)}h ${minutes % 60}m`
      : `${minutes}m`;

    let exsDone, exsSkipped, setsLogged;
    if (mode === 'routine') {
      const completeExs = routineExercises.filter(ex => completedExIds.includes(ex.id));
      const allSkipped = [...new Set([
        ...skippedExIds,
        ...incompleteExs.map(ex => ex.id)
      ])];
      setSkippedExIds(allSkipped);
      exsDone = completeExs.length;
      exsSkipped = allSkipped.length;
      setsLogged = completedExIds.length;
    } else {
      exsDone = [...todayLoggedExIds].length;
      exsSkipped = 0;
      setsLogged = exsDone;
    }

    const data = {
      routineName: mode === 'routine' ? (routines.find(r => r.id === selectedRoutine)?.name || 'Workout') : 'Manual Workout',
      setsLogged,
      exercisesDone: exsDone,
      exercisesSkipped: exsSkipped,
      totalExercises: mode === 'routine' ? routineExercises.length : exsDone,
      duration: durationStr,
      completedAt: now.toISOString(),
    };

    setSummaryData(data);
    saveSummary(data);
    setShowFinishConfirm(false);
    setShowSummary(true);
  }

  const filteredExercises = exercises.filter(ex => {
    if (muscleFilter && ex.muscle_group !== muscleFilter) return false;
    if (search && !ex.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const groupedExercises = muscleGroups
    .map(g => ({ label: g, items: filteredExercises.filter(e => e.muscle_group === g) }))
    .filter(g => g.items.length > 0);

  if (loading) return <LoadingSpinner />;

  if (!isClient) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">💪 Log Workout</h1>
        <div className="card text-center py-8">
          <div className="text-4xl mb-3">🔒</div>
          <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Workout logging is for clients only</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>View client workout logs in the History page.</p>
          <button onClick={() => navigate('/history')} className="btn-primary text-sm mt-4">Go to History</button>
        </div>
      </div>
    );
  }

  const routineDone = mode === 'routine' && showSummary === false
    && routineExercises.length > 0
    && routineExercises.every(ex => completedExIds.includes(ex.id) || skippedExIds.includes(ex.id))
    && !showFinishConfirm;
  const todayFormatted = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  const numLogged = mode === 'routine' ? completedExIds.length + skippedExIds.length : 0;
  const totalRoutineExs = routineExercises.length;
  const manualLogged = [...todayLoggedExIds].filter(id => selectedExercises.includes(id)).length;

  return (
    <div className="space-y-6">
      {/* Finish confirmation modal */}
      {showFinishConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'var(--overlay)' }}>
          <div className="card max-w-md w-full space-y-4 animate-[fadeInUp_0.2s_ease-out]">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-secondary)' }}>Finish Workout?</h3>
            {incompleteExs.length > 0 ? (
              <>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  You still have incomplete exercises:
                </p>
                <ul className="space-y-1">
                  {incompleteExs.map(ex => (
                    <li key={ex.id} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      <span>{muscleColors[ex.muscle_group]?.emoji || '•'}</span>
                      {ex.name}
                    </li>
                  ))}
                </ul>
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  Unfinished exercises will be marked as skipped.
                </p>
              </>
            ) : (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Ready to finish your workout?
              </p>
            )}
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => { setShowFinishConfirm(false); setIncompleteExs([]); }} className="btn-secondary text-sm">Go Back</button>
              <button onClick={finishWorkout} className="btn-primary text-sm">Finish Anyway</button>
            </div>
          </div>
        </div>
      )}

      {/* Summary overlay */}
      {showSummary && summaryData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'var(--overlay)' }}>
          <div className="card max-w-sm w-full text-center space-y-5 animate-[fadeInUp_0.3s_ease-out]">
            <div className="text-5xl">🎉</div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-secondary)' }}>Workout Complete!</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>{summaryData.routineName}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="stat-card !py-3">
                <div className="stat-value text-lg">{summaryData.setsLogged}</div>
                <div className="stat-label text-[10px]">Sets</div>
              </div>
              <div className="stat-card !py-3">
                <div className="stat-value text-lg">{summaryData.exercisesDone}</div>
                <div className="stat-label text-[10px]">Exercises</div>
              </div>
              {summaryData.exercisesSkipped > 0 && (
                <div className="stat-card !py-3">
                  <div className="stat-value text-lg" style={{ color: '#f59e0b' }}>{summaryData.exercisesSkipped}</div>
                  <div className="stat-label text-[10px]">Skipped</div>
                </div>
              )}
              <div className="stat-card !py-3">
                <div className="stat-value text-lg">{summaryData.duration}</div>
                <div className="stat-label text-[10px]">Duration</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { exitToMenu(); navigate('/'); }} className="btn-primary flex-1 text-sm">Dashboard</button>
              <button onClick={exitToMenu} className="btn-secondary flex-1 text-sm">Done</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">💪 Log Workout</h1>
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>📅 {todayFormatted}</p>
        </div>
        {mode && (
          <button onClick={exitToMenu} className="text-sm" style={{ color: 'var(--text-dim)' }}>← Back</button>
        )}
      </div>

      {showDraftBanner && (
        <div className="card border-l-4 border-yellow-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📝</span>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>You have an unsaved workout</p>
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Auto-saved from your last session</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={resumeDraft} className="btn-primary text-xs">Resume</button>
            <button onClick={discardDraft} className="btn-secondary text-xs">Discard</button>
          </div>
        </div>
      )}

      {!mode && (
        <div className="card" style={{ backgroundImage: 'linear-gradient(to right, rgba(16,185,129,0.08), transparent)', borderColor: 'rgba(16,185,129,0.3)' }}>
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>🚀 Quick Start</h2>
          <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>Pick a routine and log sets exercise by exercise</p>

          {/* Today's Workout card */}
          {todayRoutine && (
            <div className="mb-3 rounded-xl p-4 flex items-center justify-between" style={{ backgroundImage: 'linear-gradient(to right, rgba(16,185,129,0.15), rgba(59,130,246,0.1))', border: '1px solid rgba(16,185,129,0.3)' }}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">📅</span>
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Today's Workout</p>
                  <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{todayRoutine.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                    {exercises.filter(e => todayRoutine.exercise_ids?.includes(e.id)).length} exercises
                  </p>
                </div>
              </div>
              <button
                onClick={() => startRoutine(todayRoutine.id)}
                className="btn-primary text-sm flex items-center gap-1"
              >
                <span>▶</span> Start
              </button>
            </div>
          )}

          {routines.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {routines.map(r => {
                  const exs = exercises.filter(e => r.exercise_ids?.includes(e.id));
                  const groupCounts = {};
                  for (const ex of exs) {
                    groupCounts[ex.muscle_group] = (groupCounts[ex.muscle_group] || 0) + 1;
                  }
                  return (
                    <button
                      key={r.id}
                      onClick={() => startRoutine(r.id)}
                      className="text-left p-4 rounded-xl transition-all duration-200 group"
                      style={{ backgroundColor: 'var(--bg-card-hover)', border: '1px solid var(--border)' }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium group-hover:text-emerald-400" style={{ color: 'var(--text-secondary)' }}>{r.name}</span>
                        {r.day_of_week && (
                          <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>📅 {r.day_of_week.slice(0, 3)}</span>
                        )}
                      </div>
                      <p className="text-xs mb-2" style={{ color: 'var(--text-dim)' }}>{exs.length} exercises</p>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(groupCounts).slice(0, 4).map(([g, count]) => {
                          const mc = muscleColors[g];
                          return (
                            <span key={g} className={`text-[10px] px-1.5 py-0.5 rounded-full ${mc?.bg || 'bg-gray-700'} ${mc?.text || 'text-gray-400'}`}>
                              {mc?.emoji || ''} {count}
                            </span>
                          );
                        })}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 text-center">
                <button onClick={startManual} className="text-sm" style={{ color: 'var(--text-dim)' }}>
                  — or pick exercises manually —
                </button>
              </div>
            </>
          )}

          {routines.length === 0 && (
            <div className="text-center py-4">
              <p className="mb-2" style={{ color: 'var(--text-dim)' }}>No routines yet — pick exercises manually or create one first.</p>
              <button onClick={startManual} className="btn-primary text-sm">Pick Exercises</button>
            </div>
          )}
        </div>
      )}

      {mode === 'routine' && !showSummary && loggingExId && (
        <div className="card" style={{ borderColor: 'rgba(16,185,129,0.3)' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {exercises.find(e => e.id == loggingExId)?.name || 'Log Exercise'}
            </h2>
            <button onClick={() => setLoggingExId(null)} className="text-sm" style={{ color: 'var(--text-dim)' }}>← Back</button>
          </div>
          <LogForm
            key={`${logKey}-${loggingExId}`}
            exercises={exercises}
            defaultExerciseId={loggingExId}
            onLogged={handleLogged}
            loggedToday={todayLoggedExIds}
          />
        </div>
      )}

      {mode === 'routine' && !showSummary && !loggingExId && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {routines.find(r => r.id === selectedRoutine)?.name || 'Routine'}
            </h2>
            <span className="text-sm" style={{ color: 'var(--text-dim)' }}>
              {completedExIds.length}/{totalRoutineExs} logged{skippedExIds.length > 0 ? ` · ${skippedExIds.length} skipped` : ''}
            </span>
          </div>
          {routineExercises.length > 0 && (
            <div className="space-y-2">
              {routineExercises.map((ex) => {
                const isDone = completedExIds.includes(ex.id);
                const isSkipped = skippedExIds.includes(ex.id);
                const mc = muscleColors[ex.muscle_group];
                return (
                  <div
                    key={ex.id}
                    className={`card !p-3 flex items-center justify-between transition-all duration-200 ${
                      isDone || isSkipped ? 'opacity-60' : ''
                    }`}
                    style={isDone ? { borderColor: 'rgba(16,185,129,0.3)' } : isSkipped ? { borderColor: 'rgba(234,179,8,0.3)' } : {}}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-8 h-8 rounded-lg ${mc?.bg || 'bg-gray-800'} flex items-center justify-center text-sm shrink-0`}>
                        {isDone ? '✅' : isSkipped ? '⏭' : (mc?.emoji || '💪')}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate" style={{ color: isDone || isSkipped ? 'var(--text-dim)' : 'var(--text-secondary)' }}>
                          {ex.name}
                        </div>
                        <div className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{ex.muscle_group} · {ex.category}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isDone ? (
                        <span className="text-xs" style={{ color: 'var(--text-dim)' }}>Logged ✓</span>
                      ) : isSkipped ? (
                        <span className="text-xs" style={{ color: 'var(--text-dim)' }}>Skipped</span>
                      ) : (
                        <>
                          <button
                            onClick={() => setLoggingExId(ex.id)}
                            className="btn-primary text-[10px] !px-3 !py-1.5 flex items-center gap-1 animate-glow"
                          >
                            <span>💪</span> Log
                          </button>
                          <button
                            onClick={() => handleSkip(ex.id)}
                            className="text-[10px] px-2 py-1.5 rounded-lg transition-colors"
                            style={{ color: 'var(--text-dim)', backgroundColor: 'var(--bg-card-hover)' }}
                            title="Skip this exercise"
                          >
                            ⏭
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              <button
                onClick={startManual}
                className="card !p-3 w-full text-sm flex items-center justify-center gap-1 hover:border-emerald-700 transition-colors"
                style={{ color: 'var(--text-dim)' }}
              >
                <span>+</span> Add extra exercise
              </button>

              {numLogged > 0 && (
                <button onClick={handleFinishClick} className="btn-primary w-full text-sm py-3">
                  🎯 Finish Workout
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {routineDone && (
        <div className="card text-center py-8 space-y-3 animate-[fadeInUp_0.4s_ease-out]">
          <div className="text-4xl">🎉</div>
          <p className="text-emerald-400 font-semibold text-lg">All exercises complete!</p>
          <div className="flex gap-2 justify-center">
            <button onClick={handleFinishClick} className="btn-primary text-sm">Finish Workout</button>
            <button onClick={exitToMenu} className="btn-secondary text-sm">Back to menu</button>
          </div>
        </div>
      )}

      {mode === 'manual' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search exercises..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 !py-1.5 text-sm"
            />
            <select value={muscleFilter} onChange={(e) => setMuscleFilter(e.target.value)} className="w-auto text-sm !py-1.5">
              <option value="">All groups</option>
              {muscleGroups.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <button onClick={() => setMode(null)} className="btn-secondary text-sm">Back</button>
          </div>

          {selectedExercises.length > 0 && (
            <div className="card border-l-4 border-emerald-500 animate-[fadeInUp_0.3s_ease-out]">
              <LogForm
                key={logKey}
                exercises={exercises.filter(e => selectedExercises.includes(e.id))}
                onLogged={() => { setLogKey(k => k + 1); setTodayLoggedExIds(prev => new Set([...prev, ...selectedExercises])); }}
                loggedToday={todayLoggedExIds}
              />
            </div>
          )}

          {manualLogged > 0 && (
            <button onClick={handleFinishClick} className="btn-primary w-full text-sm py-3">
              🎯 Finish Workout
            </button>
          )}

          <div>
            <p className="text-xs mb-2" style={{ color: 'var(--text-dim)' }}>
              {selectedExercises.length > 0
                ? `✅ ${selectedExercises.length} selected — tap to toggle`
                : 'Tap exercises below to select them for logging'}
            </p>
            <div className="space-y-4">
              {groupedExercises.map(group => (
                <div key={group.label} className="animate-[fadeInUp_0.3s_ease-out]">
                  <div className={`flex items-center gap-2 mb-2 border-l-4 ${muscleColors[group.label]?.border || 'border-l-gray-600'} pl-3`}>
                    <span className="text-xs">{muscleColors[group.label]?.emoji || '•'}</span>
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>{group.label}</span>
                    <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>({group.items.length})</span>
                  </div>
                  <div className="space-y-1">
                    {group.items.map(ex => (
                      <ExerciseCard
                        key={ex.id}
                        exercise={ex}
                        selected={selectedExercises.includes(ex.id)}
                        onToggle={toggleExercise}
                      />
                    ))}
                  </div>
                </div>
              ))}
              {filteredExercises.length === 0 && (
                <p className="text-sm text-center py-4" style={{ color: 'var(--text-dim)' }}>No exercises match your filters.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
