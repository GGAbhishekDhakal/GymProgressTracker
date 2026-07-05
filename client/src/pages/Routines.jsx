import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const muscleGroups = ['Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Core'];
const muscleColors = {
  Chest: { border: 'border-l-red-500/50', emoji: '🦍', text: 'text-red-400', bg: 'bg-red-500/10' },
  Back: { border: 'border-l-emerald-500/50', emoji: '🔱', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  Shoulders: { border: 'border-l-orange-500/50', emoji: '🏔️', text: 'text-orange-400', bg: 'bg-orange-500/10' },
  Legs: { border: 'border-l-blue-500/50', emoji: '🦵', text: 'text-blue-400', bg: 'bg-blue-500/10' },
  Arms: { border: 'border-l-purple-500/50', emoji: '💪', text: 'text-purple-400', bg: 'bg-purple-500/10' },
  Core: { border: 'border-l-yellow-500/50', emoji: '🔥', text: 'text-yellow-400', bg: 'bg-yellow-500/10' },
};

const templates = [
  { name: 'Push Day', description: 'Chest · Shoulders', groups: ['Chest', 'Shoulders'], emoji: '🔥', gradient: 'from-red-600/20 to-orange-600/10' },
  { name: 'Pull Day', description: 'Back · Arms', groups: ['Back', 'Arms'], emoji: '💪', gradient: 'from-emerald-600/20 to-purple-600/10' },
  { name: 'Legs Day', description: 'Quads · Hamstrings · Glutes', groups: ['Legs'], emoji: '🦵', gradient: 'from-blue-600/20 to-cyan-600/10' },
  { name: 'Full Body', description: 'All muscle groups', groups: ['Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Core'], emoji: '💯', gradient: 'from-emerald-600/20 to-yellow-600/10' },
  { name: 'Chest + Triceps', description: 'Chest · Arms (Triceps)', groups: ['Chest', 'Arms'], emoji: '🦍', gradient: 'from-red-600/20 to-purple-600/10' },
  { name: 'Back + Biceps', description: 'Back · Arms (Biceps)', groups: ['Back', 'Arms'], emoji: '🔱', gradient: 'from-emerald-600/20 to-purple-600/10' },
  { name: 'Upper Body', description: 'Chest · Back · Shoulders · Arms', groups: ['Chest', 'Back', 'Shoulders', 'Arms'], emoji: '🏋️', gradient: 'from-red-600/20 via-emerald-600/10 to-purple-600/10' },
];

export default function Routines() {
  const navigate = useNavigate();
  const [routines, setRoutines] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editRoutine, setEditRoutine] = useState(null);
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

  function applyTemplate(template) {
    const ids = exercises
      .filter(e => template.groups.includes(e.muscle_group))
      .map(e => e.id);
    setName(template.name);
    setDescription(template.description);
    setSelectedExercises(ids);
    setExerciseOrder(ids);
    setShowPicker(false);
    setEditing(editRoutine ? editRoutine.id : 'new');
  }

  function openCreate() {
    setShowPicker(true);
    setEditRoutine(null);
    setEditing(null);
  }

  function openEdit(routine) {
    setShowPicker(true);
    setEditRoutine(routine);
    setEditing(null);
  }

  function skipPicker() {
    if (editRoutine) {
      setName(editRoutine.name);
      setDescription(editRoutine.description || '');
      setSelectedExercises(editRoutine.exercise_ids || []);
      setExerciseOrder(editRoutine.exercise_ids || []);
      setEditing(editRoutine.id);
    } else {
      setName('');
      setDescription('');
      setSelectedExercises([]);
      setExerciseOrder([]);
      setEditing('new');
    }
    setShowPicker(false);
  }

  function goBackToPicker() {
    setShowPicker(true);
  }

  function cancelAll() {
    setShowPicker(false);
    setEditing(null);
    setEditRoutine(null);
    setShowMenu(null);
  }

  function toggleExercise(id) {
    setSelectedExercises(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      setExerciseOrder(next);
      return next;
    });
  }

  function toggleGroup(group) {
    const groupIds = exercises
      .filter(e => e.muscle_group === group)
      .map(e => e.id);
    const allSelected = groupIds.every(id => selectedExercises.includes(id));
    setSelectedExercises(prev => {
      const filtered = prev.filter(id => !groupIds.includes(id));
      const next = allSelected ? filtered : [...filtered, ...groupIds];
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
      cancelAll();
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

  function handleStartRoutine(id) {
    navigate(`/log?routine=${id}`);
  }

  if (loading) return <LoadingSpinner />;

  const orderedExercises = editing ? exerciseOrder : [];
  const selectedSet = new Set(selectedExercises);

  function groupSelectedCount(group) {
    return exercises.filter(e => e.muscle_group === group && selectedSet.has(e.id)).length;
  }

  function groupTotalCount(group) {
    return exercises.filter(e => e.muscle_group === group).length;
  }

  function groupAllSelected(group) {
    return groupTotalCount(group) > 0 && groupSelectedCount(group) === groupTotalCount(group);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">📋 My Routines</h1>
        {!showPicker && editing !== 'new' && !editing && (
          <button onClick={openCreate} className="btn-primary text-sm flex items-center gap-1">
            <span>+</span> Create Routine
          </button>
        )}
      </div>

      {showPicker && (
        <div className="card border-emerald-800/30">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-200">
              {editRoutine ? '✏️ Edit Routine' : '🏗️ New Routine'}
            </h2>
            <button onClick={cancelAll} className="text-sm text-gray-500 hover:text-gray-300">Cancel</button>
          </div>
          <p className="text-sm text-gray-400 mb-4">Start from a template or build your own</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {templates.map(t => (
              <button
                key={t.name}
                onClick={() => applyTemplate(t)}
                className={`text-left p-3 rounded-xl bg-gradient-to-br ${t.gradient} border border-gray-700/50 hover:border-emerald-700/50 hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-200 group`}
              >
                <div className="text-xl mb-1">{t.emoji}</div>
                <div className="font-semibold text-sm text-gray-200 group-hover:text-emerald-400">{t.name}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">{t.description}</div>
              </button>
            ))}
          </div>
          <div className="mt-3 text-center">
            <button onClick={skipPicker} className="text-sm text-gray-500 hover:text-gray-300">
              ✏️ Custom — start from scratch
            </button>
          </div>
        </div>
      )}

      {editing && (
        <form onSubmit={handleSave} className="card space-y-4 border-emerald-800/30">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-200">
              {editing === 'new' ? '🏗️ New Routine' : '✏️ Edit Routine'}
            </h2>
            <button type="button" onClick={cancelAll} className="text-sm text-gray-500 hover:text-gray-300">Cancel</button>
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
            <div className="flex items-center justify-between mb-2">
              <label>Exercises ({selectedExercises.length} selected)</label>
              <button type="button" onClick={goBackToPicker} className="text-xs text-emerald-500 hover:text-emerald-400">← Pick template</button>
            </div>
            <div className="mt-2 space-y-3 max-h-72 overflow-y-auto">
              {muscleGroups.map(group => {
                const groupExs = exercises.filter(e => e.muscle_group === group);
                if (groupExs.length === 0) return null;
                const sel = groupSelectedCount(group);
                const total = groupTotalCount(group);
                const allSel = groupAllSelected(group);
                const mc = muscleColors[group];
                return (
                  <div key={group}>
                    <div
                      className={`flex items-center justify-between gap-2 border-l-4 ${mc?.border || 'border-l-gray-600'} pl-2 mb-1 cursor-pointer hover:opacity-80 transition-opacity`}
                      onClick={() => toggleGroup(group)}
                    >
                      <div className="flex items-center gap-2">
                        <span>{mc?.emoji || '•'}</span>
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{group}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${allSel ? `${mc?.bg} ${mc?.text}` : 'text-gray-700 bg-gray-800'}`}>
                          {sel}/{total}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-600">{allSel ? '✓ All' : 'Tap to toggle'}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {groupExs.map(ex => (
                        <label key={ex.id} className={`flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-colors ${
                          selectedSet.has(ex.id) ? `${mc?.bg} ring-1 ring-emerald-600/30` : 'hover:bg-gray-800'
                        }`}>
                          <input
                            type="checkbox"
                            checked={selectedSet.has(ex.id)}
                            onChange={() => toggleExercise(ex.id)}
                            className="rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-emerald-500"
                          />
                          <span className={`text-sm ${selectedSet.has(ex.id) ? 'text-gray-200' : 'text-gray-400'}`}>{ex.name}</span>
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
                  const mc = muscleColors[ex?.muscle_group];
                  return (
                    <div key={id} className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-3 py-2">
                      <span className="text-xs text-gray-600 w-6">{i + 1}</span>
                      <span className="text-xs mr-1">{mc?.emoji || '•'}</span>
                      <span className="flex-1 text-sm text-gray-200">{ex?.name}</span>
                      <span className={`text-[10px] ${mc?.text || 'text-gray-600'} w-16`}>{ex?.muscle_group}</span>
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

      {!editing && !showPicker && routines.length === 0 && (
        <EmptyState
          icon="📋"
          title="No routines yet"
          description="Create a routine to quickly log related exercises."
          action={<button onClick={openCreate} className="btn-primary text-sm">Create Routine</button>}
        />
      )}

      {!editing && !showPicker && routines.length > 0 && (
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
                        <button onClick={() => { openEdit(routine); setShowMenu(null); }} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2">
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
                  {Object.entries(grouped).map(([group, exs]) => {
                    const mc = muscleColors[group];
                    return (
                      <div key={group}>
                        <div className={`flex items-center gap-1 border-l-4 ${mc?.border || 'border-l-gray-600'} pl-2 mb-1`}>
                          <span className="text-xs">{mc?.emoji || '•'}</span>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">{group}</span>
                          <span className="text-[10px] text-gray-700">({exs.length})</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {exs.map(ex => (
                            <span key={ex.id} className={`text-xs px-2 py-0.5 rounded-full bg-gray-800 ${mc?.text || 'text-gray-400'}`}>
                              {ex.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-800 flex gap-2">
                  <button onClick={() => handleStartRoutine(routine.id)} className="btn-primary text-xs flex-1 flex items-center justify-center gap-1">
                    <span>▶</span> Start
                  </button>
                  <button onClick={() => openEdit(routine)} className="btn-secondary text-xs">Edit</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
