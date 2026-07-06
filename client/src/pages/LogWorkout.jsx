import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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

export default function LogWorkout() {
  const [searchParams] = useSearchParams();
  const [exercises, setExercises] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [mode, setMode] = useState(null);
  const [selectedRoutine, setSelectedRoutine] = useState(null);
  const [routineExercises, setRoutineExercises] = useState([]);
  const [completedExIds, setCompletedExIds] = useState([]);
  const [loggingExId, setLoggingExId] = useState(null);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [muscleFilter, setMuscleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [logKey, setLogKey] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getExercises(),
      api.getRoutines(),
    ]).then(([exData, rtData]) => {
      setExercises(exData);
      setRoutines(rtData);
      const routineParam = searchParams.get('routine');
      if (routineParam && rtData.length > 0) {
        const rt = rtData.find(r => r.id === parseInt(routineParam));
        if (rt) {
          setMode('routine');
          setSelectedRoutine(rt.id);
          const exs = exData.filter(e => rt.exercise_ids?.includes(e.id));
          setRoutineExercises(exs);
        }
      }
    }).finally(() => setLoading(false));
  }, []);

  function startRoutine(id) {
    const idNum = parseInt(id);
    if (!idNum) return;
    setMode('routine');
    setSelectedRoutine(idNum);
    setCompletedExIds([]);
    setLoggingExId(null);
    const routine = routines.find(r => r.id === idNum);
    if (routine) {
      const exs = exercises.filter(e => routine.exercise_ids.includes(e.id));
      setRoutineExercises(exs);
    }
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
    }
    setLoggingExId(null);
    setLogKey(k => k + 1);
  }

  function exitToMenu() {
    setMode(null);
    setSelectedRoutine(null);
    setRoutineExercises([]);
    setCompletedExIds([]);
    setLoggingExId(null);
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

  const routineDone = mode === 'routine' && routineExercises.length > 0 && completedExIds.length >= routineExercises.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">💪 Log Workout</h1>
        {mode && (
          <button onClick={exitToMenu} className="text-sm text-gray-500 hover:text-gray-300">← Back</button>
        )}
      </div>

      {!mode && routines.length > 0 && (
        <div className="card bg-gradient-to-r from-emerald-900/30 to-gray-900 border-emerald-800/50">
          <h2 className="text-lg font-semibold text-gray-200 mb-2">🚀 Quick Start</h2>
          <p className="text-sm text-gray-400 mb-3">Pick a routine and log sets exercise by exercise</p>
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
                  className="text-left p-4 rounded-xl bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-emerald-700 hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-200 group-hover:text-emerald-400">{r.name}</span>
                    {r.day_of_week && (
                      <span className="text-[10px] text-gray-600">📅 {r.day_of_week.slice(0, 3)}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{exs.length} exercises</p>
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
            <button onClick={startManual} className="text-sm text-gray-500 hover:text-gray-300">
              — or pick exercises manually —
            </button>
          </div>
        </div>
      )}

      {!mode && routines.length === 0 && (
        <div className="text-center py-6">
          <p className="text-gray-500 mb-2">No routines yet — pick exercises manually or create one first.</p>
          <button onClick={startManual} className="btn-primary text-sm">Pick Exercises</button>
        </div>
      )}

      {mode === 'routine' && !routineDone && loggingExId && (
        <div className="card border-emerald-800/30">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-200">
              {exercises.find(e => e.id == loggingExId)?.name || 'Log Exercise'}
            </h2>
            <button onClick={() => setLoggingExId(null)} className="text-sm text-gray-500 hover:text-gray-300">← Back</button>
          </div>
          <LogForm
            key={`${logKey}-${loggingExId}`}
            exercises={exercises}
            defaultExerciseId={loggingExId}
            onLogged={handleLogged}
          />
        </div>
      )}

      {mode === 'routine' && !routineDone && !loggingExId && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-200">
              {routines.find(r => r.id === selectedRoutine)?.name || 'Routine'}
            </h2>
            <span className="text-sm text-gray-500">
              {completedExIds.length}/{routineExercises.length} logged
            </span>
          </div>
          {routineExercises.length > 0 && (
            <div className="space-y-2">
              {routineExercises.map((ex, i) => {
                const isDone = completedExIds.includes(ex.id);
                const mc = muscleColors[ex.muscle_group];
                return (
                  <div
                    key={ex.id}
                    className={`card !p-3 flex items-center justify-between transition-all duration-200 ${
                      isDone ? 'opacity-60 border-emerald-800/40' : 'hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-8 h-8 rounded-lg ${mc?.bg || 'bg-gray-800'} flex items-center justify-center text-sm shrink-0`}>
                        {isDone ? '✅' : (mc?.emoji || '💪')}
                      </div>
                      <div className="min-w-0">
                        <div className={`font-medium text-sm truncate ${isDone ? 'text-gray-500' : 'text-gray-200'}`}>
                          {ex.name}
                        </div>
                        <div className="text-[10px] text-gray-600">{ex.muscle_group} · {ex.category}</div>
                      </div>
                    </div>
                    {isDone ? (
                      <span className="text-xs text-emerald-600 shrink-0">Logged ✓</span>
                    ) : (
                      <button
                        onClick={() => setLoggingExId(ex.id)}
                        className="btn-primary text-[10px] !px-3 !py-1.5 shrink-0 flex items-center gap-1 animate-[pulseGlow_2s_infinite]"
                      >
                        <span>💪</span> Log
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {routineDone && (
        <div className="card text-center py-8 space-y-3 animate-[fadeInUp_0.4s_ease-out]">
          <div className="text-4xl">🎉</div>
          <p className="text-emerald-400 font-semibold text-lg">Workout complete!</p>
          <p className="text-gray-500 text-sm">{routineExercises.length} exercises logged</p>
          <div className="flex gap-2 justify-center">
            <button onClick={exitToMenu} className="btn-primary text-sm">Done</button>
            <button onClick={() => { setCompletedExIds([]); setLoggingExId(null); }} className="btn-secondary text-sm">Log again</button>
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
                onLogged={() => setLogKey(k => k + 1)}
              />
            </div>
          )}

          <div>
            <p className="text-xs text-gray-500 mb-2">
              {selectedExercises.length > 0
                ? `✅ ${selectedExercises.length} selected — tap to toggle`
                : 'Tap exercises below to select them for logging'}
            </p>
            <div className="space-y-4">
              {groupedExercises.map(group => (
                <div key={group.label} className="animate-[fadeInUp_0.3s_ease-out]">
                  <div className={`flex items-center gap-2 mb-2 border-l-4 ${muscleColors[group.label]?.border || 'border-l-gray-600'} pl-3`}>
                    <span className="text-xs">{muscleColors[group.label]?.emoji || '•'}</span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{group.label}</span>
                    <span className="text-[10px] text-gray-700">({group.items.length})</span>
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
                <p className="text-gray-500 text-sm text-center py-4">No exercises match your filters.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
