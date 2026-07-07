import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { api } from '../api';
import LoadingSpinner from './LoadingSpinner';

export default function AccumulatedProgressChart({ days = 90 }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getAllProgress(days)
      .then((grouped) => {
        const allLogs = [];
        for (const name of Object.keys(grouped)) {
          for (const log of grouped[name]) {
            allLogs.push(log);
          }
        }

        const weekMap = {};
        for (const log of allLogs) {
          const d = new Date(log.logged_at);
          const weekStart = new Date(d);
          weekStart.setDate(d.getDate() - d.getDay());
          const key = weekStart.toISOString().split('T')[0];
          if (!weekMap[key]) weekMap[key] = 0;
          weekMap[key] += (Number(log.weight) || 0) * (log.reps || 1);
        }

        const chartData = Object.entries(weekMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([week, volume]) => ({
            week: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            volume: Math.round(volume),
          }));

        setData(chartData);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) return <LoadingSpinner size="sm" />;
  if (!data || data.length === 0) {
    return <p className="text-sm text-center py-4" style={{ color: 'var(--text-dim)' }}>No data yet. Start logging to see accumulated progress!</p>;
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis
            dataKey="week"
            stroke="#6b7280"
            tick={{ fontSize: 11 }}
          />
          <YAxis
            stroke="#6b7280"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#111827',
              border: '1px solid #1f2937',
              borderRadius: '8px',
              color: '#e5e7eb',
              fontSize: '13px',
            }}
            formatter={(value) => [`${value.toLocaleString()} kg`, 'Volume']}
            labelFormatter={(label) => `Week of ${label}`}
          />
          <Bar dataKey="volume" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
