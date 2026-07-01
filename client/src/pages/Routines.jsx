import { useState, useEffect } from 'react';
import { api } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function Routines() {
  const [routines, setRoutines] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedExercises, setSelectedExercises] = useState([]);

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
  }

  function startEdit(routine) {
    setEditing(routine.id);
    setName(routine.name);
    setDescription(routine.description || '');
    setSelectedExercises(routine.exercise_ids || []);
  }

  function cancelEdit() {
    setEditing(null);
  }

  function toggleExercise(id) {
    setSelectedExercises((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      if (editing === 'new') {
        await api.createRoutine({ name: name.trim(), description: description.trim() || undefined, exercise_ids: selectedExercises });
      } else {
        await api.updateRoutine(editing, { name: name.trim(), description: description.trim() || undefined, exercise_ids: selectedExercises });
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

  if (loading) return <LoadingSpinner />;

  const muscleGroups = [...new Set(exercises.map((e) => e.muscle_group))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Routines</h1>
        {editing !== 'new' && (
          <button onClick={startCreate} className="btn-primary text-sm">+ New Routine</button>
        )}
      </div>

      {editing && (
        <form onSubmit={handleSave} className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-200">
              {editing === 'new' ? 'New Routine' : 'Edit Routine'}
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
            <div className="max-h-48 overflow-y-auto space-y-1 mt-1">
              {muscleGroups.map((group) => (
                <div key={group}>
                  <p className="text-xs text-gray-500 font-medium mt-2 mb-1">{group}</p>
                  {exercises.filter((e) => e.muscle_group === group).map((ex) => (
                    <label key={ex.id} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-800 rounded px-1">
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
              ))}
            </div>
          </div>

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
            const routineExs = exercises.filter((e) => routine.exercise_ids.includes(e.id));
            return (
              <div key={routine.id} className="card">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-200">{routine.name}</h3>
                    {routine.description && (
                      <p className="text-sm text-gray-500">{routine.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(routine)} className="text-xs btn-secondary !py-1 !px-2">Edit</button>
                    <button onClick={() => handleDelete(routine.id)} className="text-xs btn-danger !py-1 !px-2">Del</button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-2">{routineExs.length} exercises</p>
                <div className="flex flex-wrap gap-1">
                  {routineExs.map((ex) => (
                    <span key={ex.id} className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">
                      {ex.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
