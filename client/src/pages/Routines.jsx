import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ExerciseCard from '../components/ExerciseCard';

const muscleGroups = ['Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Core'];
const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const dayAbbr = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const muscleColors = {
  Chest: { border: 'border-l-red-500/50', emoji: '🦍', text: 'text-red-400', bg: 'bg-red-500/10', gradient: 'from-red-600/10 to-transparent' },
  Back: { border: 'border-l-emerald-500/50', emoji: '🔱', text: 'text-emerald-400', bg: 'bg-emerald-500/10', gradient: 'from-emerald-600/10 to-transparent' },
  Shoulders: { border: 'border-l-orange-500/50', emoji: '🏔️', text: 'text-orange-400', bg: 'bg-orange-500/10', gradient: 'from-orange-600/10 to-transparent' },
  Legs: { border: 'border-l-blue-500/50', emoji: '🦵', text: 'text-blue-400', bg: 'bg-blue-500/10', gradient: 'from-blue-600/10 to-transparent' },
  Arms: { border: 'border-l-purple-500/50', emoji: '💪', text: 'text-purple-400', bg: 'bg-purple-500/10', gradient: 'from-purple-600/10 to-transparent' },
  Core: { border: 'border-l-yellow-500/50', emoji: '🔥', text: 'text-yellow-400', bg: 'bg-yellow-500/10', gradient: 'from-yellow-600/10 to-transparent' },
};

const templates = [
  { name: 'Push Day', groups: ['Chest', 'Shoulders'], emoji: '🔥', gradient: 'from-red-600/20 to-orange-600/10' },
  { name: 'Pull Day', groups: ['Back', 'Arms'], emoji: '💪', gradient: 'from-emerald-600/20 to-purple-600/10' },
  { name: 'Legs Day', groups: ['Legs'], emoji: '🦵', gradient: 'from-blue-600/20 to-cyan-600/10' },
  { name: 'Full Body', groups: ['Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Core'], emoji: '💯', gradient: 'from-emerald-600/20 to-yellow-600/10' },
  { name: 'Chest + Triceps', groups: ['Chest', 'Arms'], emoji: '🦍', gradient: 'from-red-600/20 to-purple-600/10' },
  { name: 'Back + Biceps', groups: ['Back', 'Arms'], emoji: '🔱', gradient: 'from-emerald-600/20 to-purple-600/10' },
  { name: 'Upper Body', groups: ['Chest', 'Back', 'Shoulders', 'Arms'], emoji: '🏋️', gradient: 'from-red-600/20 via-emerald-600/10 to-purple-600/10' },
];

const todayIndex = new Date().getDay();
const todayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][todayIndex];
const todayDateNum = new Date().getDate();
const weekDates = (() => {
  const now = new Date();
  const startOfWeek = new Date(now);
  const diffToMonday = (now.getDay() + 6) % 7;
  startOfWeek.setDate(now.getDate() - diffToMonday);
  return dayNames.map((_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d.getDate();
  });
})();

export default function Routines() {
  const navigate = useNavigate();
  const routinesRef = useRef(null);
  const [routines, setRoutines] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editRoutine, setEditRoutine] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('');
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [exerciseOrder, setExerciseOrder] = useState([]);
  const [showMenu, setShowMenu] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  function loadData() {
    Promise.all([api.getRoutines(), api.getExercises()])
      .then(([r, e]) => { setRoutines(r); setExercises(e); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, []);

  function flashSuccess(msg) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 2500);
  }

  function applyTemplate(template) {
    const ids = exercises
      .filter(e => template.groups.includes(e.muscle_group))
      .map(e => e.id);
    setName(template.name);
    setDescription('');
    setSelectedExercises(ids);
    setExerciseOrder(ids);
    setShowPicker(false);
    setEditing(editRoutine ? editRoutine.id : 'new');
  }

  function openCreate() {
    setShowPicker(true);
    setEditRoutine(null);
    setEditing(null);
    setName('');
    setDescription('');
    setDayOfWeek('');
    setSelectedExercises([]);
    setExerciseOrder([]);
  }

  function openEdit(routine) {
    setEditRoutine(routine);
    setName(routine.name);
    setDescription(routine.description || '');
    setDayOfWeek(routine.day_of_week || '');
    setSelectedExercises(routine.exercise_ids || []);
    setExerciseOrder(routine.exercise_ids || []);
    setEditing(routine.id);
    setShowPicker(false);
  }

  function skipPicker() {
    if (editRoutine) {
      setName(editRoutine.name);
      setDescription(editRoutine.description || '');
      setDayOfWeek(editRoutine.day_of_week || '');
      setSelectedExercises(editRoutine.exercise_ids || []);
      setExerciseOrder(editRoutine.exercise_ids || []);
      setEditing(editRoutine.id);
    } else {
      setName('');
      setDescription('');
      setDayOfWeek('');
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
    setConfirmDelete(null);
  }

  function clearForm() {
    setName('');
    setDescription('');
    setDayOfWeek('');
    setSelectedExercises([]);
    setExerciseOrder([]);
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
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        day_of_week: dayOfWeek || null,
        exercise_ids: exerciseOrder,
      };
      if (editing === 'new') {
        await api.createRoutine(payload);
        flashSuccess('Routine created! 🎉');
      } else {
        await api.updateRoutine(editing, payload);
        flashSuccess('Routine updated! ✨');
      }
      cancelAll();
      loadData();
      setTimeout(() => routinesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!confirmDelete) return;
    try {
      await api.deleteRoutine(confirmDelete);
      setConfirmDelete(null);
      flashSuccess('Routine deleted');
      loadData();
    } catch (err) {
      alert(err.message);
      setConfirmDelete(null);
    }
  }

  function handleStartRoutine(id) {
    navigate(`/log?routine=${id}`);
  }

  if (loading) return <LoadingSpinner />;

  const orderedExercises = editing ? exerciseOrder : [];
  const selectedSet = new Set(selectedExercises);

  const todayRoutine = routines.find(r => r.day_of_week === todayName);
  const dayMap = {};
  for (const r of routines) {
    if (r.day_of_week) {
      if (!dayMap[r.day_of_week]) dayMap[r.day_of_week] = [];
      dayMap[r.day_of_week].push(r);
    }
  }

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
    <div className="space-y-6" ref={routinesRef}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">📋 My Routines</h1>
        {!showPicker && editing !== 'new' && !editing && (
          <button onClick={openCreate} className="btn-primary text-sm flex items-center gap-1">
            <span>+</span> Create Routine
          </button>
        )}
      </div>

      {successMsg && (
        <div className="animate-[fadeInUp_0.3s_ease-out] bg-emerald-900/40 border border-emerald-700/50 rounded-xl px-4 py-3 text-emerald-300 text-sm font-medium text-center backdrop-blur-sm">
          {successMsg}
        </div>
      )}

      {confirmDelete && (
        <div className="animate-[fadeInUp_0.3s_ease-out] bg-red-900/30 border border-red-700/40 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🗑️</span>
            <div>
              <p className="text-sm text-gray-200 font-medium">Delete routine?</p>
              <p className="text-xs text-gray-500">
                "{routines.find(r => r.id === confirmDelete)?.name}" and all its data will be permanently removed.
              </p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setConfirmDelete(null)} className="btn-secondary text-xs">Cancel</button>
            <button onClick={handleConfirmDelete} className="btn-danger text-xs">Delete</button>
          </div>
        </div>
      )}

      {routines.length > 0 && (
        <div className="card border-gray-700/50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">📅 Weekly Schedule</h2>
            {todayRoutine && (
              <span className="text-xs text-emerald-400 animate-[pulseGlow_2s_infinite] rounded-full px-2 py-0.5 bg-emerald-900/30">
                Today: {todayRoutine.name}
              </span>
            )}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {dayAbbr.map((abbr, i) => {
              const fullName = dayNames[i];
              const dayRoutines = dayMap[fullName] || [];
              const isToday = fullName === todayName;
              return (
                <div key={fullName} className="text-center">
                  <div className={`text-[10px] font-semibold uppercase mb-0.5 ${isToday ? 'text-emerald-400' : 'text-gray-600'}`}>
                    {abbr}
                  </div>
                  <div className={`text-[9px] font-medium mb-1 ${isToday ? 'text-emerald-300' : 'text-gray-700'}`}>
                    {weekDates[i]}
                  </div>
                  <div className={`relative rounded-lg py-1.5 ${isToday ? 'bg-emerald-900/30 ring-1 ring-emerald-700/50' : 'bg-gray-800/50'}`}>
                    {dayRoutines.length === 0 ? (
                      <span className="text-[10px] text-gray-700">—</span>
                    ) : (
                      <div className="space-y-0.5">
                        {dayRoutines.slice(0, 2).map(r => (
                          <button
                            key={r.id}
                            onClick={() => navigate(`/log?routine=${r.id}`)}
                            className="block text-[9px] leading-tight text-gray-300 hover:text-emerald-400 truncate px-1 w-full transition-colors"
                          >
                            {r.name}
                          </button>
                        ))}
                        {dayRoutines.length > 2 && (
                          <div className="text-[8px] text-gray-600">+{dayRoutines.length - 2}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {todayRoutine && (
        <div className="bg-gradient-to-r from-emerald-900/30 to-blue-900/20 border border-emerald-800/40 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">📅</span>
              <span className="text-sm text-gray-400">Today's Workout</span>
            </div>
            <h3 className="text-xl font-bold text-gray-200">{todayRoutine.name}</h3>
            {todayRoutine.description && (
              <p className="text-sm text-gray-500">{todayRoutine.description}</p>
            )}
          </div>
          <button onClick={() => handleStartRoutine(todayRoutine.id)} className="btn-primary text-sm flex items-center gap-1 shrink-0">
            <span>▶</span> Start
          </button>
        </div>
      )}

      {showPicker && (
        <div className="card border-emerald-800/30">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-200">
              {editRoutine ? '✏️ Edit Routine' : '🏗️ New Routine'}
            </h2>
            <button onClick={cancelAll} className="text-sm text-gray-500 hover:text-gray-300">Cancel</button>
          </div>
          <p className="text-sm text-gray-400 mb-4">Start from a template</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {templates.map(t => (
              <button
                key={t.name}
                onClick={() => applyTemplate(t)}
                className={`text-left p-3 rounded-xl bg-gradient-to-br ${t.gradient} border border-gray-700/50 hover:border-emerald-700/50 hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-200 group`}
              >
                <div className="text-xl mb-1">{t.emoji}</div>
                <div className="font-semibold text-sm text-gray-200 group-hover:text-emerald-400">{t.name}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">{t.groups.join(' · ')}</div>
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
            <div className="flex items-center gap-2">
              <button type="button" onClick={clearForm} className="text-xs text-gray-500 hover:text-gray-300">Clear</button>
              <button type="button" onClick={cancelAll} className="text-sm text-gray-500 hover:text-gray-300">Cancel</button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label>Routine Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Push Day" />
            </div>
            <div>
              <label>Scheduled Day</label>
              <select value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)}>
                <option value="">— None —</option>
                {dayNames.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label>Description (optional)</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Monday chest & shoulders" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label>Exercises ({selectedExercises.length} selected)</label>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => { setSelectedExercises([]); setExerciseOrder([]); }} className="text-xs text-gray-500 hover:text-gray-300">Deselect all</button>
                <button type="button" onClick={goBackToPicker} className="text-xs text-emerald-500 hover:text-emerald-400">← Pick template</button>
              </div>
            </div>
            <div className="mt-2 space-y-3 max-h-80 overflow-y-auto">
              {muscleGroups.map(group => {
                const groupExs = exercises.filter(e => e.muscle_group === group).sort((a, b) => a.name.localeCompare(b.name));
                if (groupExs.length === 0) return null;
                const sel = groupSelectedCount(group);
                const total = groupTotalCount(group);
                const allSel = groupAllSelected(group);
                const mc = muscleColors[group];
                return (
                  <div key={group}>
                    <div
                      className={`flex items-center gap-2 border-l-4 ${mc?.border || 'border-l-gray-600'} pl-2 mb-2 cursor-pointer hover:opacity-80 transition-opacity`}
                      onClick={() => toggleGroup(group)}
                    >
                      <span className="text-xs">{mc?.emoji || '•'}</span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{group}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${allSel ? `${mc?.bg} ${mc?.text}` : 'text-gray-700 bg-gray-800'}`}>
                        {sel}/{total}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {groupExs.map(ex => (
                        <ExerciseCard
                          key={ex.id}
                          exercise={ex}
                          selected={selectedSet.has(ex.id)}
                          onToggle={toggleExercise}
                        />
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
                      <span className="flex-1 text-sm text-gray-200 truncate">{ex?.name}</span>
                      <span className={`text-[10px] ${mc?.text || 'text-gray-600'} w-16 text-right`}>{ex?.muscle_group}</span>
                      <button type="button" onClick={() => moveUp(i)} disabled={i === 0} className="text-gray-600 hover:text-gray-300 disabled:opacity-30 text-sm">▲</button>
                      <button type="button" onClick={() => moveDown(i)} disabled={i >= orderedExercises.length - 1} className="text-gray-600 hover:text-gray-300 disabled:opacity-30 text-sm">▼</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={saving}
          >
            {saving ? 'Saving...' : editing === 'new' ? 'Create Routine' : 'Save Changes'}
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-200 text-lg">{routine.name}</h3>
                      {routine.day_of_week && (
                        <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full border border-gray-700/50">
                          📅 {routine.day_of_week.slice(0, 3)}
                        </span>
                      )}
                    </div>
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
                        <button onClick={() => { setConfirmDelete(routine.id); setShowMenu(null); }} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2">
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
