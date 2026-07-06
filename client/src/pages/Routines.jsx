import { useState, useEffect, useRef, useCallback } from 'react';
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

const today = new Date();

function formatDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getWeekDays(centerDate) {
  const start = new Date(centerDate);
  start.setDate(centerDate.getDate() - 3);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function Routines() {
  const navigate = useNavigate();
  const routinesRef = useRef(null);
  const dateStripRef = useRef(null);
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
  const [selectedDate, setSelectedDate] = useState(new Date(today));
  const [weekDays, setWeekDays] = useState(() => getWeekDays(today));
  const [showAllRoutines, setShowAllRoutines] = useState(false);
  const touchStartX = useRef(0);
  const [isTouching, setIsTouching] = useState(false);

  const selectedDayName = dayNames[selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1];
  const isToday = isSameDay(selectedDate, today);
  const selectedRoutines = routines.filter(r => r.day_of_week === selectedDayName);

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

  function goToDate(d) {
    setSelectedDate(new Date(d));
    setWeekDays(getWeekDays(d));
  }

  function prevDay() {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    goToDate(prev);
  }

  function nextDay() {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    goToDate(next);
  }

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
    setIsTouching(true);
  }

  function handleTouchEnd(e) {
    if (!isTouching) return;
    setIsTouching(false);
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextDay();
      else prevDay();
    }
  }

  const applyTemplate = useCallback((template) => {
    const ids = exercises
      .filter(e => template.groups.includes(e.muscle_group))
      .map(e => e.id);
    setName(template.name);
    setDescription('');
    setSelectedExercises(ids);
    setExerciseOrder(ids);
    setShowPicker(false);
    setEditing(editRoutine ? editRoutine.id : 'new');
  }, [exercises, editRoutine]);

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
        <h1 className="text-2xl font-bold">📋 Routines</h1>
      </div>

      {successMsg && (
        <div className="animate-[fadeInUp_0.3s_ease-out] rounded-xl px-4 py-3 text-emerald-300 text-sm font-medium text-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(6,78,59,0.3)', border: '1px solid rgba(4,120,87,0.4)' }}>
          {successMsg}
        </div>
      )}

      {/* Date strip */}
      <div
        ref={dateStripRef}
        className="select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center gap-1">
          <button onClick={prevDay} className="p-2 rounded-lg hover:bg-gray-800/60 transition-colors shrink-0" style={{ color: 'var(--text-dim)' }} aria-label="Previous day">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 grid grid-cols-7 gap-1">
            {weekDays.map((d, i) => {
              const isSel = isSameDay(d, selectedDate);
              const isTdy = isSameDay(d, today);
              return (
                <button
                  key={i}
                  onClick={() => goToDate(d)}
                  className={`rounded-xl py-2 text-center transition-all duration-200 ${
                    isSel
                      ? 'ring-2 ring-emerald-500 shadow-lg shadow-emerald-900/30'
                      : 'hover:bg-gray-800/40'
                  } ${isTdy ? 'bg-emerald-900/40' : ''}`}
                  style={isSel ? { backgroundColor: 'rgba(16,185,129,0.15)' } : {}}
                >
                  <div className={`text-[10px] font-semibold uppercase ${isTdy ? 'text-emerald-400' : ''}`} style={{ color: isTdy ? undefined : 'var(--text-dim)' }}>
                    {dayAbbr[d.getDay() === 0 ? 6 : d.getDay() - 1]}
                  </div>
                  <div className={`text-sm font-bold ${isTdy ? 'text-emerald-300' : ''}`} style={{ color: isTdy ? undefined : 'var(--text-primary)' }}>
                    {d.getDate()}
                  </div>
                </button>
              );
            })}
          </div>
          <button onClick={nextDay} className="p-2 rounded-lg hover:bg-gray-800/60 transition-colors shrink-0" style={{ color: 'var(--text-dim)' }} aria-label="Next day">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Selected day routine */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            {isToday ? '📅 Today' : selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </h2>
          {selectedRoutines.length > 0 && (
            <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{selectedDayName}</span>
          )}
        </div>

        {selectedRoutines.length === 0 ? (
          <div className="card text-center py-6">
            <div className="text-3xl mb-2">😴</div>
            <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Rest Day</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>No routine scheduled for {selectedDayName}</p>
            <button onClick={() => setShowAllRoutines(true)} className="text-xs mt-3 text-emerald-400 hover:text-emerald-300">
              View all routines →
            </button>
          </div>
        ) : (
          selectedRoutines.map(routine => {
            const routineExs = exercises.filter(e => routine.exercise_ids?.includes(e.id));
            const grouped = {};
            for (const ex of routineExs) {
              if (!grouped[ex.muscle_group]) grouped[ex.muscle_group] = [];
              grouped[ex.muscle_group].push(ex);
            }
            return (
              <div key={routine.id} className="card" style={{ backgroundImage: 'linear-gradient(to right, rgba(16,185,129,0.06), transparent)' }}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: 'var(--text-secondary)' }}>{routine.name}</h3>
                    {routine.description && (
                      <p className="text-sm" style={{ color: 'var(--text-dim)' }}>{routine.description}</p>
                    )}
                  </div>
                </div>
                <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>{routineExs.length} exercises</p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {Object.entries(grouped).map(([group, exs]) => {
                    const mc = muscleColors[group];
                    return (
                      <span key={group} className={`text-[10px] px-2 py-0.5 rounded-full ${mc?.bg || 'bg-gray-800'} ${mc?.text || 'text-gray-400'}`}>
                        {mc?.emoji || ''} {exs.length}
                      </span>
                    );
                  })}
                </div>
                <button
                  onClick={() => handleStartRoutine(routine.id)}
                  className="btn-primary text-sm w-full flex items-center justify-center gap-1"
                >
                  <span>▶</span> Start Workout
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Manage routines toggle */}
      <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={() => setShowAllRoutines(s => !s)}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
            📋 All Routines ({routines.length})
          </span>
          <span className="text-xs transition-transform" style={{ color: 'var(--text-dim)', transform: showAllRoutines ? 'rotate(180deg)' : '' }}>
            ▼
          </span>
        </button>

        {showAllRoutines && (
          <div className="mt-4 space-y-4">
            {confirmDelete && (
              <div className="animate-[fadeInUp_0.3s_ease-out] rounded-xl p-4 space-y-3" style={{ backgroundColor: 'rgba(127,29,29,0.3)', border: '1px solid rgba(185,28,28,0.4)' }}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🗑️</span>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Delete routine?</p>
                    <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
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

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Manage Routines</h3>
              {!showPicker && editing !== 'new' && !editing && (
                <button onClick={openCreate} className="btn-primary text-sm flex items-center gap-1">
                  <span>+</span> Create Routine
                </button>
              )}
            </div>

            {showPicker && (
              <div className="card" style={{ borderColor: 'rgba(16,185,129,0.3)' }}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {editRoutine ? '✏️ Edit Routine' : '🏗️ New Routine'}
                  </h2>
                  <button onClick={cancelAll} className="text-sm" style={{ color: 'var(--text-dim)' }}>Cancel</button>
                </div>
                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Start from a template</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {templates.map(t => (
                    <button
                      key={t.name}
                      onClick={() => applyTemplate(t)}
                      className={`text-left p-3 rounded-xl bg-gradient-to-br ${t.gradient} border transition-all duration-200 group`}
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <div className="text-xl mb-1">{t.emoji}</div>
                      <div className="font-semibold text-sm group-hover:text-emerald-400" style={{ color: 'var(--text-secondary)' }}>{t.name}</div>
                      <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-dim)' }}>{t.groups.join(' · ')}</div>
                    </button>
                  ))}
                </div>
                <div className="mt-3 text-center">
                  <button onClick={skipPicker} className="text-sm" style={{ color: 'var(--text-dim)' }}>
                    ✏️ Custom — start from scratch
                  </button>
                </div>
              </div>
            )}

            {editing && (
              <form onSubmit={handleSave} className="card space-y-4" style={{ borderColor: 'rgba(16,185,129,0.3)' }}>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {editing === 'new' ? '🏗️ New Routine' : '✏️ Edit Routine'}
                  </h2>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={clearForm} className="text-xs" style={{ color: 'var(--text-dim)' }}>Clear</button>
                    <button type="button" onClick={cancelAll} className="text-sm" style={{ color: 'var(--text-dim)' }}>Cancel</button>
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
                      <button type="button" onClick={() => { setSelectedExercises([]); setExerciseOrder([]); }} className="text-xs" style={{ color: 'var(--text-dim)' }}>Deselect all</button>
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
                            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>{group}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${allSel ? `${mc?.bg} ${mc?.text}` : ''}`} style={allSel ? {} : { color: 'var(--text-faint)', backgroundColor: 'var(--bg-card-hover)' }}>
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
                    <label style={{ color: 'var(--text-muted)' }}>Exercise Order</label>
                    <div className="mt-1 space-y-1">
                      {orderedExercises.map((id, i) => {
                        const ex = exercises.find(e => e.id === id);
                        const mc = muscleColors[ex?.muscle_group];
                        return (
                          <div key={id} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
                            <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{i + 1}</span>
                            <span className="text-xs mr-1">{mc?.emoji || '•'}</span>
                            <span className="flex-1 text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{ex?.name}</span>
                            <span className={`text-[10px] ${mc?.text || ''} w-16 text-right`} style={mc?.text ? {} : { color: 'var(--text-faint)' }}>{ex?.muscle_group}</span>
                            <button type="button" onClick={() => moveUp(i)} disabled={i === 0} className="disabled:opacity-30 text-sm" style={{ color: 'var(--text-dim)' }}>▲</button>
                            <button type="button" onClick={() => moveDown(i)} disabled={i >= orderedExercises.length - 1} className="disabled:opacity-30 text-sm" style={{ color: 'var(--text-dim)' }}>▼</button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button type="submit" className="btn-primary w-full" disabled={saving}>
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
                    <div key={routine.id} className="card relative transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-lg" style={{ color: 'var(--text-secondary)' }}>{routine.name}</h3>
                            {routine.day_of_week && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-card-hover)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                                📅 {routine.day_of_week.slice(0, 3)}
                              </span>
                            )}
                          </div>
                          {routine.description && (
                            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>{routine.description}</p>
                          )}
                        </div>
                        <div className="relative">
                          <button onClick={() => setShowMenu(showMenu === routine.id ? null : routine.id)} className="px-1 text-lg leading-none" style={{ color: 'var(--text-dim)' }}>⋯</button>
                          {showMenu === routine.id && (
                            <div className="absolute right-0 top-8 w-40 rounded-lg shadow-xl z-10 py-1" style={{ backgroundColor: 'var(--bg-card-solid)', border: '1px solid var(--border)' }}>
                              <button onClick={() => { handleStartRoutine(routine.id); setShowMenu(null); }} className="w-full text-left px-3 py-2 text-sm flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                                <span>▶</span> Start Workout
                              </button>
                              <button onClick={() => { openEdit(routine); setShowMenu(null); }} className="w-full text-left px-3 py-2 text-sm flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                                <span>✏️</span> Edit
                              </button>
                              <button onClick={() => { setConfirmDelete(routine.id); setShowMenu(null); }} className="w-full text-left px-3 py-2 text-sm flex items-center gap-2" style={{ color: 'var(--text-red-400)' }}>
                                <span>🗑️</span> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-sm mb-3" style={{ color: 'var(--text-dim)' }}>{routineExs.length} exercises</p>

                      <div className="space-y-2">
                        {Object.entries(grouped).map(([group, exs]) => {
                          const mc = muscleColors[group];
                          return (
                            <div key={group}>
                              <div className={`flex items-center gap-1 border-l-4 ${mc?.border || 'border-l-gray-600'} pl-2 mb-1`}>
                                <span className="text-xs">{mc?.emoji || '•'}</span>
                                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{group}</span>
                                <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>({exs.length})</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {exs.map(ex => (
                                  <span key={ex.id} className={`text-xs px-2 py-0.5 rounded-full ${mc?.bg || ''} ${mc?.text || ''}`} style={mc?.text ? {} : { color: 'var(--text-muted)' }}>
                                    {ex.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-3 pt-3 border-t flex gap-2" style={{ borderColor: 'var(--border)' }}>
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
        )}
      </div>
    </div>
  );
}
