import { useState, useEffect } from 'react';
import { api } from '../api';
import ExerciseCard from '../components/ExerciseCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function Exercises() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [muscleFilter, setMuscleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMuscle, setNewMuscle] = useState('Chest');
  const [newCategory, setNewCategory] = useState('Barbell');

  function loadExercises() {
    const params = {};
    if (muscleFilter) params.muscle_group = muscleFilter;
    if (search) params.search = search;
    api.getExercises(params).then(setExercises).finally(() => setLoading(false));
  }

  useEffect(() => { loadExercises(); }, [muscleFilter, search]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await api.createExercise({ name: newName.trim(), muscle_group: newMuscle, category: newCategory });
      setNewName('');
      setShowForm(false);
      loadExercises();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this exercise? It will also remove associated logs and goals.')) return;
    try {
      await api.deleteExercise(id);
      loadExercises();
    } catch (err) {
      alert(err.message);
    }
  }

  const muscleGroups = ['Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Core'];
  const categories = ['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight'];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Exercise Library</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          {showForm ? 'Cancel' : '+ Add Exercise'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label>Name</label>
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} required placeholder="e.g. Bench Press" />
          </div>
          <div>
            <label>Muscle Group</label>
            <select value={newMuscle} onChange={(e) => setNewMuscle(e.target.value)}>
              {muscleGroups.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label>Category</label>
            <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn-primary w-full">Create</button>
          </div>
        </form>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search exercises..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 !py-1.5 text-sm"
        />
        <select value={muscleFilter} onChange={(e) => setMuscleFilter(e.target.value)} className="w-auto text-sm !py-1.5">
          <option value="">All groups</option>
          {muscleGroups.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {exercises.length === 0 ? (
        <EmptyState
          icon="🏋️"
          title="No exercises found"
          description={search || muscleFilter ? 'Try different filters.' : 'Add your first exercise to get started.'}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {exercises.map((ex) => (
            <ExerciseCard key={ex.id} exercise={ex} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
