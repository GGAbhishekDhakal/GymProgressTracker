import { useState, useEffect } from 'react';
import { api } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function History() {
  const [logs, setLogs] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterExercise, setFilterExercise] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editWeight, setEditWeight] = useState('');
  const [editReps, setEditReps] = useState('');
  const [editSets, setEditSets] = useState('');

  function loadLogs() {
    const params = {};
    if (filterExercise) params.exercise_id = filterExercise;
    if (filterFrom) params.from = filterFrom;
    if (filterTo) params.to = filterTo;
    params.limit = '100';

    api.getLogs(params)
      .then(setLogs)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    api.getExercises().then(setExercises);
  }, []);

  useEffect(() => { loadLogs(); }, [filterExercise, filterFrom, filterTo]);

  async function handleDelete(id) {
    if (!confirm('Delete this entry?')) return;
    try {
      await api.deleteLog(id);
      loadLogs();
    } catch (err) {
      alert(err.message);
    }
  }

  function startEdit(log) {
    setEditingId(log.id);
    setEditWeight(log.weight.toString());
    setEditReps(log.reps.toString());
    setEditSets(log.sets.toString());
  }

  async function handleSaveEdit(id) {
    try {
      await api.updateLog(id, {
        weight: parseFloat(editWeight),
        reps: parseInt(editReps),
        sets: parseInt(editSets),
      });
      setEditingId(null);
      loadLogs();
    } catch (err) {
      alert(err.message);
    }
  }

  function cancelEdit() {
    setEditingId(null);
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">History</h1>

      <div className="card grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <label>Exercise</label>
          <select value={filterExercise} onChange={(e) => setFilterExercise(e.target.value)}>
            <option value="">All exercises</option>
            {exercises.map((ex) => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label>From</label>
          <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
        </div>
        <div>
          <label>To</label>
          <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
        </div>
        <div className="flex items-end">
          <button onClick={() => { setFilterExercise(''); setFilterFrom(''); setFilterTo(''); }} className="btn-secondary w-full text-sm">
            Reset
          </button>
        </div>
      </div>

      {logs.length === 0 ? (
        <EmptyState
          icon="📜"
          title="No logs found"
          description={filterExercise || filterFrom || filterTo ? 'Try different filters.' : 'Log your first workout to see history here.'}
        />
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="card !py-3 !px-4">
              {editingId === log.id ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-300 min-w-[120px]">{log.exercise_name}</span>
                  <input type="number" step="0.5" value={editWeight} onChange={(e) => setEditWeight(e.target.value)} className="!py-1 !px-2 w-20 text-sm" />
                  <span className="text-gray-500 text-sm">×</span>
                  <input type="number" value={editReps} onChange={(e) => setEditReps(e.target.value)} className="!py-1 !px-2 w-16 text-sm" />
                  <span className="text-gray-500 text-sm">×</span>
                  <input type="number" value={editSets} onChange={(e) => setEditSets(e.target.value)} className="!py-1 !px-2 w-16 text-sm" />
                  <button onClick={() => handleSaveEdit(log.id)} className="btn-primary !py-1 !px-2 text-xs">Save</button>
                  <button onClick={cancelEdit} className="btn-secondary !py-1 !px-2 text-xs">Cancel</button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-medium text-gray-200 min-w-[120px]">{log.exercise_name}</span>
                    <span className="text-emerald-400 font-semibold">{log.weight}kg</span>
                    <span className="text-gray-500">× {log.reps}</span>
                    <span className="text-gray-500">× {log.sets}</span>
                    {log.notes && <span className="text-gray-500 text-sm italic">— {log.notes}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{new Date(log.logged_at).toLocaleDateString()}</span>
                    <button onClick={() => startEdit(log)} className="text-xs btn-secondary !py-1 !px-2">Edit</button>
                    <button onClick={() => handleDelete(log.id)} className="text-xs btn-danger !py-1 !px-2">Del</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
