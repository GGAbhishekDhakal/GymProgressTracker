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
  const [expanded, setExpanded] = useState({});

  function loadLogs() {
    const params = {};
    if (filterExercise) params.exercise_id = filterExercise;
    if (filterFrom) params.from = filterFrom;
    if (filterTo) params.to = filterTo;
    params.limit = '200';

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

  function toggleExpand(key) {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const grouped = {};
  for (const log of logs) {
    const key = log.exercise_name || 'Unknown';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(log);
  }

  const exerciseNames = Object.keys(grouped).sort();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">📜 Workout History</h1>

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

      {loading ? <LoadingSpinner /> : logs.length === 0 ? (
        <EmptyState
          icon="📜"
          title="No logs found"
          description={filterExercise || filterFrom || filterTo ? 'Try different filters.' : 'Log your first workout to see history here.'}
        />
      ) : (
        <div className="space-y-3">
          {exerciseNames.map(name => {
            const exLogs = grouped[name];
            const isOpen = expanded[name] !== false;

            const dateGroups = {};
            for (const log of exLogs) {
              const d = log.logged_at;
              if (!dateGroups[d]) dateGroups[d] = [];
              dateGroups[d].push(log);
            }
            const dates = Object.keys(dateGroups).sort((a, b) => new Date(b) - new Date(a));

            return (
              <div key={name} className="card !p-0 overflow-hidden">
                <button
                  onClick={() => toggleExpand(name)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`transition-transform ${isOpen ? 'rotate-90' : ''}`}>▶</span>
                    <span className="font-semibold text-gray-200">{name}</span>
                    <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                      {exLogs.length} set{exLogs.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs text-gray-600">
                      {dates.length} day{dates.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-800 pt-3">
                    {dates.map(date => {
                      const dayLogs = dateGroups[date];
                      const volume = dayLogs.reduce((sum, l) => sum + (Number(l.weight) || 0) * (l.reps || 1), 0);
                      const formatted = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

                      return (
                        <div key={date}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-medium text-gray-400">{formatted}</span>
                            <span className="text-xs text-gray-600">{volume.toLocaleString()}kg total</span>
                          </div>
                          <div className="space-y-1">
                            {dayLogs.map((log, i) => (
                              <div key={log.id} className="flex items-center justify-between bg-gray-800/50 rounded-lg px-3 py-2 group">
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-gray-600 w-6">S{i + 1}</span>
                                  <span className="text-emerald-400 font-semibold">{Number(log.weight).toFixed(1)}kg</span>
                                  <span className="text-gray-500">× {log.reps}</span>
                                  {log.notes && <span className="text-gray-600 text-xs italic">— {log.notes}</span>}
                                </div>
                                <button
                                  onClick={() => handleDelete(log.id)}
                                  className="text-xs text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  Delete
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
