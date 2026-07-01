import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import LogForm from '../components/LogForm';
import ExerciseCard from '../components/ExerciseCard';
import LoadingSpinner from '../components/LoadingSpinner';

const muscleGroups = ['Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Core'];
const muscleColors = {
  Chest: 'border-l-red-500/50',
  Back: 'border-l-emerald-500/50',
  Shoulders: 'border-l-orange-500/50',
  Legs: 'border-l-blue-500/50',
  Arms: 'border-l-purple-500/50',
  Core: 'border-l-yellow-500/50',
};

export default function LogWorkout() {
  const [searchParams] = useSearchParams();
  const [exercises, setExercises] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [mode, setMode] = useState(null);
  const [selectedRoutine, setSelectedRoutine] = useState(null);
  const [routineExercises, setRoutineExercises] = useState([]);
  const [routineStep, setRoutineStep] = useState(0);
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
          setRoutineStep(0);
        }
      }
    }).finally(() => setLoading(false));
  }, []);

  function startRoutine(id) {
    const idNum = parseInt(id);
    if (!idNum) return;
    setMode('routine');
    setSelectedRoutine(idNum);
    const routine = routines.find(r => r.id === idNum);
    if (routine) {
      const exs = exercises.filter(e => routine.exercise_ids.includes(e.id));
      setRoutineExercises(exs);
      setRoutineStep(0);
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
    setLogKey(k => k + 1);
    if (mode === 'routine') {
      const next = routineStep + 1;
      if (next < routineExercises.length) {
        setRoutineStep(next);
      } else {
        setRoutineStep(-1);
      }
    }
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

  const currentRoutineEx = mode === 'routine' && routineStep >= 0 ? routineExercises[routineStep] : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">💪 Log Workout</h1>
      </div>

      {!mode && routines.length > 0 && (
        <div className="card bg-gradient-to-r from-emerald-900/30 to-gray-900 border-emerald-800/50">
          <h2 className="text-lg font-semibold text-gray-200 mb-2">🚀 Quick Start</h2>
          <p className="text-sm text-gray-400 mb-3">Pick a routine and log sets exercise by exercise</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {routines.map(r => {
              const exs = exercises.filter(e => r.exercise_ids?.includes(e.id));
              return (
                <button
                  key={r.id}
                  onClick={() => startRoutine(r.id)}
                  className="text-left p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-emerald-700 transition-all group"
                >
                  <span className="font-medium text-gray-200 group-hover:text-emerald-400">{r.name}</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {exs.slice(0, 4).map(ex => (
                      <span key={ex.id} className="text-[10px] bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">{ex.name}</span>
                    ))}
                    {exs.length > 4 && <span className="text-[10px] text-gray-600">+{exs.length - 4}</span>}
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

      {mode === 'routine' && routineStep >= 0 && currentRoutineEx && (
        <div className="card border-l-4 border-emerald-500">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wider">Step {routineStep + 1} of {routineExercises.length}</span>
              <h2 className="text-xl font-bold text-gray-200">{currentRoutineEx.name}</h2>
              <span className="text-sm text-gray-500">{currentRoutineEx.muscle_group} · {currentRoutineEx.category}</span>
            </div>
            <div className="flex flex-wrap gap-1 max-w-[120px]">
              {routineExercises.map((ex, i) => (
                <span key={ex.id} className={`w-2 h-2 rounded-full ${i < routineStep ? 'bg-emerald-500' : i === routineStep ? 'bg-emerald-400 ring-2 ring-emerald-400/30' : 'bg-gray-700'}`} />
              ))}
            </div>
          </div>
          <LogForm
            key={`${logKey}-${routineStep}`}
            exercises={[currentRoutineEx]}
            onLogged={handleLogged}
          />
        </div>
      )}

      {mode === 'routine' && routineStep === -1 && (
        <div className="card text-center py-8 space-y-3">
          <div className="text-4xl">🎉</div>
          <p className="text-emerald-400 font-semibold text-lg">Workout complete!</p>
          <p className="text-gray-500 text-sm">{routineExercises.length} exercises logged</p>
          <div className="flex gap-2 justify-center">
            <button onClick={() => { setMode(null); setSelectedRoutine(null); }} className="btn-primary text-sm">Done</button>
            <button onClick={() => { setRoutineStep(0); }} className="btn-secondary text-sm">Log again</button>
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
            <div className="card border-l-4 border-emerald-500">
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
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {groupedExercises.map(group => (
                <div key={group.label}>
                  <div className={`flex items-center gap-2 mb-2 border-l-4 ${muscleColors[group.label] || 'border-l-gray-600'} pl-3`}>
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
