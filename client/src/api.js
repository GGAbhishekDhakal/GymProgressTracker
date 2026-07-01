const BASE = import.meta.env.VITE_API_URL || '/api';

async function request(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Exercises
  getExercises: (params) => {
    const q = new URLSearchParams(params).toString();
    return request(`/exercises${q ? `?${q}` : ''}`);
  },
  createExercise: (data) => request('/exercises', { method: 'POST', body: JSON.stringify(data) }),
  deleteExercise: (id) => request(`/exercises/${id}`, { method: 'DELETE' }),

  // Routines
  getRoutines: () => request('/routines'),
  getRoutine: (id) => request(`/routines/${id}`),
  createRoutine: (data) => request('/routines', { method: 'POST', body: JSON.stringify(data) }),
  updateRoutine: (id, data) => request(`/routines/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRoutine: (id) => request(`/routines/${id}`, { method: 'DELETE' }),

  // Logs
  getLogs: (params) => {
    const q = new URLSearchParams(params).toString();
    return request(`/logs${q ? `?${q}` : ''}`);
  },
  createLog: (data) => request('/logs', { method: 'POST', body: JSON.stringify(data) }),
  createLogs: (entries) => request('/logs/batch', { method: 'POST', body: JSON.stringify({ entries }) }),
  updateLog: (id, data) => request(`/logs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLog: (id) => request(`/logs/${id}`, { method: 'DELETE' }),

  // Progress
  getProgress: (exerciseId, days) => {
    const q = days ? `?days=${days}` : '';
    return request(`/progress/${exerciseId}${q}`);
  },
  getAllProgress: (days) => {
    const q = days ? `?days=${days}` : '';
    return request(`/progress${q}`);
  },

  // Goals
  getGoals: () => request('/goals'),
  createGoal: (data) => request('/goals', { method: 'POST', body: JSON.stringify(data) }),
  updateGoal: (id, data) => request(`/goals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGoal: (id) => request(`/goals/${id}`, { method: 'DELETE' }),

  // Stats
  getStats: () => request('/stats'),
};
