import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import GoalCard from '../components/GoalCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function Goals() {
  const { user } = useAuth();
  const canViewClients = user && (user.role === 'superadmin' || user.role === 'admin');
  const isClient = user && (user.role === 'client' || user.role === 'ghost');
  const [goals, setGoals] = useState([]);
  const [clients, setClients] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [exerciseId, setExerciseId] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');

  function loadGoals() {
    const params = {};
    if (selectedUser && canViewClients) params.user_id = selectedUser;
    api.getGoals(params).then(setGoals).finally(() => setLoading(false));
  }

  useEffect(() => {
    const promises = [api.getExercises()];
    if (canViewClients) {
      promises.push(
        api.request('/admin/users').then(data => {
          const myClients = user.role === 'superadmin'
            ? data.filter(p => p.role === 'client')
            : data.filter(p => p.admin_id === user.id && p.role === 'client' && p.approved);
          setClients(myClients);
        }).catch(() => {})
      );
    }
    if (isClient) {
      promises.push(api.getGoals());
    }
    Promise.all(promises)
      .then(([e]) => { setExercises(e); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (isClient || canViewClients) loadGoals(); }, [selectedUser]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!exerciseId || !targetWeight) return;
    try {
      await api.createGoal({
        exercise_id: parseInt(exerciseId),
        target_weight: parseFloat(targetWeight),
        target_date: targetDate || null,
        notes: notes || null,
      });
      setExerciseId('');
      setTargetWeight('');
      setTargetDate('');
      setNotes('');
      setShowForm(false);
      loadGoals();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleStatusChange(id, status) {
    try {
      await api.updateGoal(id, { status });
      loadGoals();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this goal?')) return;
    try {
      await api.deleteGoal(id);
      loadGoals();
    } catch (err) {
      alert(err.message);
    }
  }

  const filtered = goals.filter((g) => statusFilter === 'all' || g.status === statusFilter);
  const activeGoals = goals.filter((g) => g.status === 'active');

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">🎯 Goals</h1>
        <div className="flex items-center gap-2">
          {canViewClients && (
            <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="text-sm !py-1.5 w-auto">
              <option value="">{user.role === 'superadmin' ? 'All users' : 'My clients'}</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.username}</option>
              ))}
            </select>
          )}
          {isClient && (
            <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
              {showForm ? 'Cancel' : '+ New Goal'}
            </button>
          )}
        </div>
      </div>

      {activeGoals.length > 0 && (
        <div className="card bg-gray-900/50">
          <p className="text-sm text-gray-400">
            🎯 <strong className="text-gray-200">{activeGoals.length}</strong> active goal{activeGoals.length > 1 ? 's' : ''}
            — keep pushing!
          </p>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="card space-y-4">
          <h2 className="text-lg font-semibold text-gray-200">Set New Goal</h2>

          <div>
            <label>Exercise</label>
            <select value={exerciseId} onChange={(e) => setExerciseId(e.target.value)} required>
              <option value="">Select exercise...</option>
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>{ex.name} — {ex.muscle_group}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label>Target Weight (kg)</label>
              <input type="number" step="0.5" min="0" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} required placeholder="100" />
            </div>
            <div>
              <label>Target Date (optional)</label>
              <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
            </div>
          </div>

          <div>
            <label>Notes (optional)</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. 100kg bench by March" />
          </div>

          <button type="submit" className="btn-primary w-full">Set Goal</button>
        </form>
      )}

      <div className="flex gap-2">
        {['active', 'achieved', 'abandoned', 'all'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`text-sm px-3 py-1.5 rounded-lg capitalize transition-colors ${
              statusFilter === s
                ? 'bg-emerald-600/20 text-emerald-400'
                : 'text-gray-500 hover:text-gray-300 bg-gray-800'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="🎯"
          title="No goals here"
          description={statusFilter !== 'all' ? `No ${statusFilter} goals.` : 'Set your first goal to start tracking progress!'}
          action={statusFilter === 'active' ? <button onClick={() => setShowForm(true)} className="btn-primary text-sm">Set Goal</button> : null}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
