import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const muscleGroups = ['Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Core'];
const muscleColors = {
  Chest: { border: 'border-l-red-500/50', emoji: '🦍', text: 'text-red-400' },
  Back: { border: 'border-l-emerald-500/50', emoji: '🔱', text: 'text-emerald-400' },
  Shoulders: { border: 'border-l-orange-500/50', emoji: '🏔️', text: 'text-orange-400' },
  Legs: { border: 'border-l-blue-500/50', emoji: '🦵', text: 'text-blue-400' },
  Arms: { border: 'border-l-purple-500/50', emoji: '💪', text: 'text-purple-400' },
  Core: { border: 'border-l-yellow-500/50', emoji: '🔥', text: 'text-yellow-400' },
};

export default function Routines() {
  const navigate = useNavigate();
  const [routines, setRoutines] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [exerciseOrder, setExerciseOrder] = useState([]);
  const [showMenu, setShowMenu] = useState(null);

  function loadData() {
    Promise.all([api.getRoutines(), api.getExercises()])
      .then(([r, e]) => { setRoutines(r); setExercises(e); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, []);

  function startCreate() {
    setEditing('new');
    setName('');
    setDescription('');
    setSelectedExercises([]);
    setExerciseOrder([]);
  }

  function startEdit(routine) {
    setEditing(routine.id);
    setName(routine.name);
    setDescription(routine.description || '');
    setSelectedExercises(routine.exercise_ids || []);
    setExerciseOrder(routine.exercise_ids || []);
  }

  function cancelEdit() {
    setEditing(null);
    setShowMenu(null);
  }

  function toggleExercise(id) {
    setSelectedExercises(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      setExerciseOrder(next);
      return next;
    });
  }

  function moveUp(index) {
    if (index <= 0) return;
    const next = [...exerciseOrder];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setExerciseOrder(next);
  }

  function moveDown(index) {
    if (index >= exerciseOrder.length - 1) return;
    const next = [...exerciseOrder];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    setExerciseOrder(next);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      if (editing === 'new') {
        await api.createRoutine({ name: name.trim(), description: description.trim() || undefined, exercise_ids: exerciseOrder });
      } else {
        await api.updateRoutine(editing, { name: name.trim(), description: description.trim() || undefined, exercise_ids: exerciseOrder });
      }
      cancelEdit();
      loadData();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this routine?')) return;
    try {
      await api.deleteRoutine(id);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  }

  function getExerciseName(id) {
    return exercises.find(e => e.id === id)?.name || 'Unknown';
  }

  function getExerciseGroup(id) {
    return exercises.find(e => e.id === id)?.muscle_group || '';
  }

  function handleStartRoutine(id) {
    navigate(`/log?routine=${id}`);
  }

  if (loading) return <LoadingSpinner />;

  const orderedExercises = editing ? exerciseOrder : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">📋 My Routines</h1>
        {editing !== 'new' && (
          <button onClick={startCreate} className="btn-primary text-sm flex items-center gap-1">
            <span>+</span> Create Routine
          </button>
        )}
      </div>

      {editing && (
        <form onSubmit={handleSave} className="card space-y-4 border-emerald-800/30">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-200">
              {editing === 'new' ? '🏗️ New Routine' : '✏️ Edit Routine'}
            </h2>
            <button type="button" onClick={cancelEdit} className="text-sm text-gray-500 hover:text-gray-300">Cancel</button>
          </div>

          <div>
            <label>Routine Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Push Day" />
          </div>

          <div>
            <label>Description (optional)</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Monday chest & shoulders" />
          </div>

          <div>
            <label>Exercises ({selectedExercises.length} selected)</label>
            <div className="mt-2 space-y-3 max-h-64 overflow-y-auto">
              {muscleGroups.map(group => {
                const groupExs = exercises.filter(e => e.muscle_group === group);
                if (groupExs.length === 0) return null;
                return (
                  <div key={group}>
                    <div className={`flex items-center gap-2 border-l-4 ${(muscleColors[group]?.border) || 'border-l-gray-600'} pl-2 mb-1`}>
                      <span>{muscleColors[group]?.emoji || '•'}</span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{group}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {groupExs.map(ex => (
                        <label key={ex.id} className={`flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-colors ${
                          selectedExercises.includes(ex.id) ? 'bg-emerald-600/10 ring-1 ring-emerald-600/30' : 'hover:bg-gray-800'
                        }`}>
                          <input
                            type="checkbox"
                            checked={selectedExercises.includes(ex.id)}
                            onChange={() => toggleExercise(ex.id)}
                            className="rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-emerald-500"
                          />
                          <span className="text-sm text-gray-300">{ex.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {orderedExercises.length > 0 && (
            <div>
              <label className="text-gray-400">Exercise Order</label>
              <div className="mt-1 space-y-1">
                {orderedExercises.map((id, i) => {
                  const ex = exercises.find(e => e.id === id);
                  return (
                    <div key={id} className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-3 py-2">
                      <span className="text-xs text-gray-600 w-6">{i + 1}</span>
                      <span className="flex-1 text-sm text-gray-200">{ex?.name}</span>
                      <span className="text-[10px] text-gray-600 w-16">{ex?.muscle_group}</span>
                      <button type="button" onClick={() => moveUp(i)} disabled={i === 0} className="text-gray-600 hover:text-gray-300 disabled:opacity-30 text-sm">▲</button>
                      <button type="button" onClick={() => moveDown(i)} disabled={i >= orderedExercises.length - 1} className="text-gray-600 hover:text-gray-300 disabled:opacity-30 text-sm">▼</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <button type="submit" className="btn-primary w-full">
            {editing === 'new' ? 'Create Routine' : 'Save Changes'}
          </button>
        </form>
      )}

      {routines.length === 0 && !editing ? (
        <EmptyState
          icon="📋"
          title="No routines yet"
          description="Create a routine to quickly log related exercises."
          action={<button onClick={startCreate} className="btn-primary text-sm">Create Routine</button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {routines.map((routine) => {
            const routineExs = exercises.filter(e => routine.exercise_ids?.includes(e.id));
            const grouped = {};
            for (const ex of routineExs) {
              if (!grouped[ex.muscle_group]) grouped[ex.muscle_group] = [];
              grouped[ex.muscle_group].push(ex);
            }
            return (
              <div key={routine.id} className="card relative hover:border-gray-700 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-200 text-lg">{routine.name}</h3>
                    {routine.description && (
                      <p className="text-sm text-gray-500">{routine.description}</p>
                    )}
                  </div>
                  <div className="relative">
                    <button onClick={() => setShowMenu(showMenu === routine.id ? null : routine.id)} className="text-gray-500 hover:text-gray-300 px-1 text-lg leading-none">⋯</button>
                    {showMenu === routine.id && (
                      <div className="absolute right-0 top-8 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 py-1">
                        <button onClick={() => { handleStartRoutine(routine.id); setShowMenu(null); }} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2">
                          <span>▶</span> Start Workout
                        </button>
                        <button onClick={() => { startEdit(routine); setShowMenu(null); }} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2">
                          <span>✏️</span> Edit
                        </button>
                        <button onClick={() => { handleDelete(routine.id); setShowMenu(null); }} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2">
                          <span>🗑️</span> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-500 mb-3">{routineExs.length} exercises</p>

                <div className="space-y-2">
                  {Object.entries(grouped).map(([group, exs]) => (
                    <div key={group}>
                      <div className={`flex items-center gap-1 border-l-4 ${(muscleColors[group]?.border) || 'border-l-gray-600'} pl-2 mb-1`}>
                        <span className="text-xs">{muscleColors[group]?.emoji || '•'}</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">{group}</span>
                        <span className="text-[10px] text-gray-700">({exs.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {exs.map(ex => (
                          <span key={ex.id} className={`text-xs px-2 py-0.5 rounded-full bg-gray-800 ${muscleColors[group]?.text || 'text-gray-400'}`}>
                            {ex.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-800 flex gap-2">
                  <button onClick={() => handleStartRoutine(routine.id)} className="btn-primary text-xs flex-1 flex items-center justify-center gap-1">
                    <span>▶</span> Start
                  </button>
                  <button onClick={() => startEdit(routine)} className="btn-secondary text-xs">Edit</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
