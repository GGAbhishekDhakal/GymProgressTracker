import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function AdminAssign() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [clients, setClients] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [assignedEx, setAssignedEx] = useState([]);
  const [assignedRt, setAssignedRt] = useState([]);
  const [selectedClient, setSelectedClient] = useState(searchParams.get('client') || '');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('exercises');

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      loadAssignments(selectedClient);
      setSearchParams({ client: selectedClient }, { replace: true });
    }
  }, [selectedClient]);

  async function loadClients() {
    try {
      const data = await api.request('/admin/users');
      const myClients = data.filter(p => p.role === 'client' && p.approved);
      setClients(myClients);
    } catch {}
    setLoading(false);
  }

  async function loadAssignments(clientId) {
    try {
      const [ex, rt, allEx, allRt] = await Promise.all([
        api.request(`/assignments/exercises/${clientId}`),
        api.request(`/assignments/routines/${clientId}`),
        api.getExercises(),
        api.getRoutines(),
      ]);
      setAssignedEx(ex.map(e => e.exercise_id));
      setAssignedRt(rt.map(r => r.routine_id));
      setExercises(allEx);
      setRoutines(allRt.filter(r => r.owner_type === 'admin_created' || !r.owner_type));
    } catch {}
  }

  async function toggleExercise(exerciseId) {
    try {
      if (assignedEx.includes(exerciseId)) {
        const found = await api.request(`/assignments/exercises/${selectedClient}`);
        const item = found.find(e => e.exercise_id === exerciseId);
        if (item) await api.request(`/assignments/exercises/${item.id}`, { method: 'DELETE' });
        setAssignedEx(prev => prev.filter(id => id !== exerciseId));
      } else {
        await api.request('/assignments/exercises', {
          method: 'POST',
          body: JSON.stringify({ client_id: selectedClient, exercise_id: exerciseId }),
        });
        setAssignedEx(prev => [...prev, exerciseId]);
      }
    } catch (err) { alert(err.message); }
  }

  async function toggleRoutine(routineId) {
    try {
      if (assignedRt.includes(routineId)) {
        const found = await api.request(`/assignments/routines/${selectedClient}`);
        const item = found.find(r => r.routine_id === routineId);
        if (item) await api.request(`/assignments/routines/${item.id}`, { method: 'DELETE' });
        setAssignedRt(prev => prev.filter(id => id !== routineId));
      } else {
        await api.request('/assignments/routines', {
          method: 'POST',
          body: JSON.stringify({ client_id: selectedClient, routine_id: routineId }),
        });
        setAssignedRt(prev => [...prev, routineId]);
      }
    } catch (err) { alert(err.message); }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Assign to Clients</h1>

      <select
        value={selectedClient}
        onChange={e => setSelectedClient(e.target.value)}
        className="w-full !py-2"
      >
        <option value="">Select a client...</option>
        {clients.map(c => <option key={c.id} value={c.id}>{c.username}</option>)}
      </select>

      {!selectedClient && (
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Select a client to manage their assignments</p>
      )}

      {selectedClient && (
        <>
          <div className="flex gap-2 border-b pb-2" style={{ borderColor: 'var(--border)' }}>
            <button onClick={() => setActiveTab('exercises')}
              className={`text-sm px-3 py-1 ${activeTab === 'exercises' ? 'font-semibold border-b-2 border-emerald-500' : ''}`}
              style={{ color: activeTab === 'exercises' ? 'var(--text-secondary)' : 'var(--text-dim)' }}>
              Exercises ({assignedEx.length} assigned)
            </button>
            <button onClick={() => setActiveTab('routines')}
              className={`text-sm px-3 py-1 ${activeTab === 'routines' ? 'font-semibold border-b-2 border-emerald-500' : ''}`}
              style={{ color: activeTab === 'routines' ? 'var(--text-secondary)' : 'var(--text-dim)' }}>
              Routines ({assignedRt.length} assigned)
            </button>
          </div>

          {activeTab === 'exercises' && (
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {exercises.map(ex => (
                <label key={ex.id} className="flex items-center gap-3 !p-2 rounded cursor-pointer" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
                  <input
                    type="checkbox"
                    checked={assignedEx.includes(ex.id)}
                    onChange={() => toggleExercise(ex.id)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{ex.name}</span>
                  <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{ex.muscle_group}</span>
                </label>
              ))}
            </div>
          )}

          {activeTab === 'routines' && (
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {routines.map(rt => (
                <label key={rt.id} className="flex items-center gap-3 !p-2 rounded cursor-pointer" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
                  <input
                    type="checkbox"
                    checked={assignedRt.includes(rt.id)}
                    onChange={() => toggleRoutine(rt.id)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{rt.name}</span>
                </label>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
