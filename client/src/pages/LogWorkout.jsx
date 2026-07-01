import { useState, useEffect } from 'react';
import { api } from '../api';
import LogForm from '../components/LogForm';
import ExerciseCard from '../components/ExerciseCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function LogWorkout() {
  const [exercises, setExercises] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [selectedRoutine, setSelectedRoutine] = useState(null);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [routineExercises, setRoutineExercises] = useState([]);
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
    }).finally(() => setLoading(false));
  }, []);

  function handleRoutineChange(routineId) {
    const id = parseInt(routineId);
    if (!id) {
      setSelectedRoutine(null);
      setRoutineExercises([]);
      setSelectedExercises([]);
      return;
    }
    setSelectedRoutine(id);
    const routine = routines.find((r) => r.id === id);
    if (routine) {
      const exs = exercises.filter((e) => routine.exercise_ids.includes(e.id));
      setRoutineExercises(exs);
      setSelectedExercises(exs.map((e) => e.id));
    }
  }

  function toggleExercise(id) {
    setSelectedExercises((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const filteredExercises = exercises.filter((ex) => {
    if (muscleFilter && ex.muscle_group !== muscleFilter) return false;
    if (search && !ex.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const muscleGroups = [...new Set(exercises.map((e) => e.muscle_group))];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Log Workout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {routines.length > 0 && (
            <div className="card">
              <label className="!mb-2">Quick-start from Routine</label>
              <select value={selectedRoutine || ''} onChange={(e) => handleRoutineChange(e.target.value)}>
                <option value="">Manual selection</option>
                {routines.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              {routineExercises.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {routineExercises.map((ex) => (
                    <span key={ex.id} className="text-xs bg-emerald-600/20 text-emerald-400 px-2 py-0.5 rounded-full">
                      {ex.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <LogForm
            key={logKey}
            exercises={selectedExercises.length ? exercises.filter((e) => selectedExercises.includes(e.id)) : exercises}
            onLogged={() => setLogKey((k) => k + 1)}
          />

          <div className="card">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Quick Stats</h3>
            <p className="text-3xl font-bold text-emerald-400">
              {exercises.filter((e) => selectedExercises.includes(e.id)).length || exercises.length}
            </p>
            <p className="text-sm text-gray-500">exercises in selection</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Search exercises..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 !py-1.5 text-sm"
              />
              <select value={muscleFilter} onChange={(e) => setMuscleFilter(e.target.value)} className="w-auto text-sm !py-1.5">
                <option value="">All groups</option>
                {muscleGroups.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <p className="text-xs text-gray-500 mb-2">
              {selectedExercises.length > 0
                ? `${selectedExercises.length} selected — tap to toggle`
                : 'Tap exercises to filter the log form'}
            </p>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredExercises.map((ex) => (
                <ExerciseCard
                  key={ex.id}
                  exercise={ex}
                  selected={selectedExercises.includes(ex.id)}
                  onToggle={toggleExercise}
                />
              ))}
              {filteredExercises.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">No exercises match your filters.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
