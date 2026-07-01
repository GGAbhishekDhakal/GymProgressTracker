import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import ProgressChart from '../components/ProgressChart';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getStats(),
      api.getExercises(),
      api.getLogs({ limit: '10' }),
    ]).then(([statsData, exercisesData, logsData]) => {
      setStats(statsData);
      setExercises(exercisesData);
      setRecentLogs(logsData);
      if (exercisesData.length) setSelectedExercise(exercisesData[0].id);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link to="/log" className="btn-primary text-sm">+ Log Workout</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="stat-card">
          <div className="stat-value">{stats.totalWorkouts}</div>
          <div className="stat-label">Workout Days</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalEntries}</div>
          <div className="stat-label">Total Entries</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{exercises.length}</div>
          <div className="stat-label">Exercises</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.activeGoals}</div>
          <div className="stat-label">Active Goals</div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-200">Progress</h2>
          <select
            value={selectedExercise || ''}
            onChange={(e) => setSelectedExercise(parseInt(e.target.value))}
            className="w-auto text-sm !py-1 !px-2"
          >
            {exercises.map((ex) => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
        </div>
        {selectedExercise && <ProgressChart exerciseId={selectedExercise} />}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-200">Recent Logs</h2>
          <Link to="/history" className="text-sm text-emerald-400 hover:text-emerald-300">View all →</Link>
        </div>
        {recentLogs.length === 0 ? (
          <EmptyState
            icon="💪"
            title="No workouts logged yet"
            description="Log your first workout to start tracking progress!"
            action={<Link to="/log" className="btn-primary text-sm">Log Workout</Link>}
          />
        ) : (
          <div className="space-y-2">
            {recentLogs.map((log) => (
              <div key={log.id} className="card flex items-center justify-between !py-3 !px-4">
                <div>
                  <span className="font-medium text-gray-200">{log.exercise_name}</span>
                  <span className="text-gray-500 text-sm ml-2">
                    {log.weight}kg × {log.reps} × {log.sets}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(log.logged_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
