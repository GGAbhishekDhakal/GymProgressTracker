import { useState, useEffect } from 'react';
import { api } from '../api';

export default function LogForm({ exercises, onLogged, defaultExerciseId }) {
  const [currentEx, setCurrentEx] = useState(null);
  const [sets, setSets] = useState([{ weight: '', reps: '10' }]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (defaultExerciseId) {
      const ex = exercises.find(e => e.id == defaultExerciseId);
      if (ex) {
        setCurrentEx(ex);
        setSets([{ weight: '', reps: '10' }]);
        setNotes('');
        setDone(false);
      }
    }
  }, [defaultExerciseId]);

  function selectExercise(id) {
    const ex = exercises.find(e => e.id === parseInt(id));
    setCurrentEx(ex);
    setSets([{ weight: '', reps: '10' }]);
    setNotes('');
    setDone(false);
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
      setDone(true);
      onLogged?.();
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
  }

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
        <h2 className="text-lg font-semibold text-gray-200 mb-3">Select an Exercise</h2>
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
        <h2 className="text-lg font-semibold text-gray-200">{currentEx.name}</h2>
        <button type="button" onClick={handleReset} className="text-sm text-gray-500 hover:text-gray-300">Change</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs uppercase tracking-wider">
              <th className="text-left pb-2 w-12">Set</th>
              <th className="text-left pb-2">Weight (kg)</th>
              <th className="text-left pb-2">Reps</th>
              <th className="w-8 pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {sets.map((set, i) => (
              <tr key={i} className="group">
                <td className="py-1.5 text-gray-400 font-medium">{i + 1}</td>
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
