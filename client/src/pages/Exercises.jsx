import { useState, useEffect } from 'react';
import { api } from '../api';
import ExerciseCard from '../components/ExerciseCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const muscleGroups = ['Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Core'];
const categories = ['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight'];

const muscleColors = {
  Chest: { bg: 'border-l-red-500/50', dot: 'bg-red-500', label: 'text-red-400' },
  Back: { bg: 'border-l-emerald-500/50', dot: 'bg-emerald-500', label: 'text-emerald-400' },
  Shoulders: { bg: 'border-l-orange-500/50', dot: 'bg-orange-500', label: 'text-orange-400' },
  Legs: { bg: 'border-l-blue-500/50', dot: 'bg-blue-500', label: 'text-blue-400' },
  Arms: { bg: 'border-l-purple-500/50', dot: 'bg-purple-500', label: 'text-purple-400' },
  Core: { bg: 'border-l-yellow-500/50', dot: 'bg-yellow-500', label: 'text-yellow-400' },
};

export default function Exercises() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [muscleFilter, setMuscleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [groupBy, setGroupBy] = useState('muscle');
  const [sortBy, setSortBy] = useState('name');
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

  let displayExercises = [...exercises];

  if (categoryFilter) {
    displayExercises = displayExercises.filter(e => e.category === categoryFilter);
  }

  if (sortBy === 'name') {
    displayExercises.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === 'muscle') {
    displayExercises.sort((a, b) => a.muscle_group.localeCompare(b.muscle_group) || a.name.localeCompare(b.name));
  } else if (sortBy === 'category') {
    displayExercises.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  }

  function groupedExercises() {
    if (groupBy === 'muscle') {
      return muscleGroups.map(g => ({
        label: g,
        color: muscleColors[g],
        items: displayExercises.filter(e => e.muscle_group === g),
      })).filter(g => g.items.length > 0);
    }
    if (groupBy === 'category') {
      return categories.map(c => ({
        label: c,
        items: displayExercises.filter(e => e.category === c),
      })).filter(g => g.items.length > 0);
    }
    return [{ label: 'All', items: displayExercises }];
  }

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

      <div className="flex gap-2 flex-wrap">
        <input
          type="text"
          placeholder="Search exercises..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[160px] !py-1.5 text-sm"
        />
        <select value={muscleFilter} onChange={(e) => setMuscleFilter(e.target.value)} className="w-auto text-sm !py-1.5">
          <option value="">All groups</option>
          {muscleGroups.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-auto text-sm !py-1.5">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} className="w-auto text-sm !py-1.5">
          <option value="muscle">Group: Muscle</option>
          <option value="category">Group: Category</option>
          <option value="none">Group: None</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-auto text-sm !py-1.5">
          <option value="name">Sort: Name</option>
          <option value="muscle">Sort: Muscle</option>
          <option value="category">Sort: Category</option>
        </select>
      </div>

      {displayExercises.length === 0 ? (
        <EmptyState
          icon="🏋️"
          title="No exercises found"
          description={search || muscleFilter ? 'Try different filters.' : 'Add your first exercise to get started.'}
        />
      ) : (
        <div className="space-y-6">
          {groupedExercises().map((group) => (
            <div key={group.label}>
              {groupBy !== 'none' && (
                <div className={`flex items-center gap-2 mb-3 border-l-4 ${group.color?.bg || 'border-l-gray-600'} pl-3`}>
                  <span className={`text-sm font-semibold uppercase tracking-wider ${group.color?.label || 'text-gray-400'}`}>
                    {group.label}
                  </span>
                  <span className="text-xs text-gray-600">({group.items.length})</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.items.map((ex) => (
                  <ExerciseCard key={ex.id} exercise={ex} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
