import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api';

const DRAFT_KEY = 'logFormDraft';

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveDraft(state) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
  } catch {}
}

function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch {}
}

export default function LogForm({ exercises, onLogged, defaultExerciseId, onDraftChange }) {
  const [currentEx, setCurrentEx] = useState(null);
  const [sets, setSets] = useState([{ weight: '', reps: '10' }]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [targets, setTargets] = useState({});
  const [targetVolume, setTargetVolume] = useState('');
  const [targetReps, setTargetReps] = useState('');
  const draftTimer = useRef(null);

  const draftState = { currentExId: currentEx?.id || null, sets, date, notes, targetVolume, targetReps };

  const scheduleDraft = useCallback(() => {
    clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      saveDraft(draftState);
      onDraftChange?.(true);
    }, 2000);
  }, [currentEx, sets, date, notes, targetVolume, targetReps]);

  useEffect(() => {
    return () => clearTimeout(draftTimer.current);
  }, []);

  useEffect(() => {
    if (defaultExerciseId) {
      const ex = exercises.find(e => e.id == defaultExerciseId);
      if (ex) {
        setCurrentEx(ex);
        setSets([{ weight: '', reps: '10' }]);
        setNotes('');
        setDone(false);
        loadTargets(ex.id);
      }
    }
  }, [defaultExerciseId]);

  useEffect(() => {
    const draft = loadDraft();
    if (draft && draft.currentExId) {
      const ex = exercises.find(e => e.id == draft.currentExId);
      if (ex) {
        setCurrentEx(ex);
        setSets(draft.sets || [{ weight: '', reps: '10' }]);
        setDate(draft.date || new Date().toISOString().split('T')[0]);
        setNotes(draft.notes || '');
        setTargetVolume(draft.targetVolume || '');
        setTargetReps(draft.targetReps || '');
        loadTargets(ex.id);
      }
    }
  }, [exercises]);

  useEffect(() => {
    if (currentEx && !done) scheduleDraft();
    else clearDraft();
  }, [currentEx, sets, date, notes, targetVolume, targetReps, done]);

  async function loadTargets(exId) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const existing = await api.getTargets(today);
      const t = existing.find(t => t.exercise_id === exId);
      if (t) {
        setTargetVolume(t.target_volume?.toString() || '');
        setTargetReps(t.target_reps?.toString() || '');
      }
    } catch {}
  }

  async function saveTarget() {
    if (!currentEx) return;
    try {
      await api.setTarget({
        exercise_id: currentEx.id,
        target_volume: targetVolume ? parseFloat(targetVolume) : null,
        target_reps: targetReps ? parseInt(targetReps) : null,
        target_date: date,
      });
    } catch {}
  }

  function selectExercise(id) {
    const ex = exercises.find(e => e.id === parseInt(id));
    setCurrentEx(ex);
    setSets([{ weight: '', reps: '10' }]);
    setNotes('');
    setDone(false);
    setTargetVolume('');
    setTargetReps('');
    if (ex) loadTargets(ex.id);
  }

  function addSet() {
    setSets(prev => [...prev, { weight: '', reps: '10' }]);
  }

  function removeSet(i) {
    setSets(prev => prev.filter((_, idx) => idx !== i));
  }

  function updateSet(i, field, val) {
    setSets(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!currentEx) return;

    const validSets = sets.filter(s => s.weight !== '' && s.weight > 0);
    if (validSets.length === 0) return;

    setSaving(true);
    try {
      const entries = validSets.map(s => ({
        exercise_id: currentEx.id,
        weight: parseFloat(s.weight),
        reps: parseInt(s.reps) || 1,
        notes: notes || null,
        logged_at: date,
      }));

      await api.createLogs(entries);
      await saveTarget();
      clearDraft();
      setDone(true);
      onLogged?.();
      onDraftChange?.(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setCurrentEx(null);
    setSets([{ weight: '', reps: '10' }]);
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setDone(false);
    setTargetVolume('');
    setTargetReps('');
    clearDraft();
    onDraftChange?.(false);
  }

  const currentVolume = sets.reduce((sum, s) => {
    const w = parseFloat(s.weight) || 0;
    const r = parseInt(s.reps) || 0;
    return sum + w * r;
  }, 0);
  const targetVolNum = parseFloat(targetVolume) || 0;
  const progressPct = targetVolNum > 0 ? Math.min(100, Math.round((currentVolume / targetVolNum) * 100)) : 0;

  if (done) {
    return (
      <div className="card text-center py-8 space-y-4">
        <div className="text-4xl">💪</div>
        <p className="text-emerald-400 font-semibold">Logged successfully!</p>
        <button onClick={handleReset} className="btn-primary text-sm">Log another</button>
      </div>
    );
  }

  if (!currentEx) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Select an Exercise</h2>
        <select value="" onChange={(e) => selectExercise(e.target.value)}>
          <option value="">Choose exercise...</option>
          {exercises.map((ex) => (
            <option key={ex.id} value={ex.id}>{ex.name}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-secondary)' }}>{currentEx.name}</h2>
        <button type="button" onClick={handleReset} className="text-sm" style={{ color: 'var(--text-dim)' }}>Change</button>
      </div>

      {targetVolNum > 0 && (
        <div>
          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            <span>Goal: {targetVolNum.toLocaleString()} kg volume</span>
            <span>{currentVolume.toLocaleString()} kg ({progressPct}%)</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%`, backgroundColor: progressPct >= 100 ? '#10b981' : '#f59e0b' }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-dim)' }}>
        <span>🎯 Goal volume:</span>
        <input
          type="number"
          min="0"
          step="50"
          value={targetVolume}
          onChange={(e) => setTargetVolume(e.target.value)}
          placeholder="0"
          className="!py-0.5 !px-1.5 w-20 text-xs"
        />
        <span>kg</span>
        <span className="ml-1">Reps:</span>
        <input
          type="number"
          min="0"
          value={targetReps}
          onChange={(e) => setTargetReps(e.target.value)}
          placeholder="0"
          className="!py-0.5 !px-1.5 w-16 text-xs"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
              <th className="text-left pb-2 w-12">Set</th>
              <th className="text-left pb-2">Weight (kg)</th>
              <th className="text-left pb-2">Reps</th>
              <th className="w-8 pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {sets.map((set, i) => (
              <tr key={i} className="group">
                <td className="py-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                <td className="py-1.5 pr-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={set.weight}
                    onChange={(e) => updateSet(i, 'weight', e.target.value)}
                    placeholder="0"
                    required
                    className="!py-1 !px-2 text-sm w-24"
                    autoFocus={i === sets.length - 1}
                  />
                </td>
                <td className="py-1.5 pr-2">
                  <input
                    type="number"
                    min="1"
                    value={set.reps}
                    onChange={(e) => updateSet(i, 'reps', e.target.value)}
                    className="!py-1 !px-2 text-sm w-20"
                  />
                </td>
                <td className="py-1.5">
                  {sets.length > 1 && (
                    <button type="button" onClick={() => removeSet(i)} className="text-gray-600 hover:text-red-400 text-lg leading-none opacity-0 group-hover:opacity-100 transition-opacity" title="Remove set">×</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button type="button" onClick={addSet} className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
        <span>+</span> Add Set
      </button>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="!py-1.5 text-sm" />
        </div>
        <div>
          <label>Notes (optional)</label>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. PR, slow negatives..." className="!py-1.5 text-sm" />
        </div>
      </div>

      <button
        type="submit"
        className="btn-primary w-full"
        disabled={saving || sets.every(s => !s.weight || s.weight <= 0)}
      >
        {saving ? 'Saving...' : `💪 Log ${sets.filter(s => s.weight && s.weight > 0).length} Set${sets.filter(s => s.weight && s.weight > 0).length !== 1 ? 's' : ''}`}
      </button>
    </form>
  );
}
