import { useState } from 'react';
import { api } from '../api';

export default function LogForm({ exercises, onLogged }) {
  const [exerciseId, setExerciseId] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('10');
  const [sets, setSets] = useState('3');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!exerciseId || !weight) return;

    setSaving(true);
    try {
      await api.createLog({
        exercise_id: parseInt(exerciseId),
        weight: parseFloat(weight),
        reps: parseInt(reps) || 1,
        sets: parseInt(sets) || 1,
        notes: notes || null,
        logged_at: date,
      });

      setWeight('');
      setReps('10');
      setSets('3');
      setNotes('');
      onLogged?.();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h2 className="text-lg font-semibold text-gray-200">Log Entry</h2>

      <div>
        <label htmlFor="exercise">Exercise</label>
        <select id="exercise" value={exerciseId} onChange={(e) => setExerciseId(e.target.value)} required>
          <option value="">Select exercise...</option>
          {exercises.map((ex) => (
            <option key={ex.id} value={ex.id}>{ex.name} — {ex.muscle_group}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label htmlFor="weight">Weight (kg)</label>
          <input id="weight" type="number" step="0.5" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} required placeholder="0" />
        </div>
        <div>
          <label htmlFor="reps">Reps</label>
          <input id="reps" type="number" min="1" value={reps} onChange={(e) => setReps(e.target.value)} />
        </div>
        <div>
          <label htmlFor="sets">Sets</label>
          <input id="sets" type="number" min="1" value={sets} onChange={(e) => setSets(e.target.value)} />
        </div>
      </div>

      <div>
        <label htmlFor="date">Date</label>
        <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div>
        <label htmlFor="notes">Notes (optional)</label>
        <input id="notes" type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. PR, slow negatives..." />
      </div>

      <button type="submit" className="btn-primary w-full" disabled={saving || !exerciseId || !weight}>
        {saving ? 'Saving...' : '💪 Log It'}
      </button>
    </form>
  );
}
