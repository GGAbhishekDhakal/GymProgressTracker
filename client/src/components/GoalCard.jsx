export default function GoalCard({ goal, onStatusChange, onDelete }) {
  const current = goal.current_weight || 0;
  const target = goal.target_weight;
  const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  const isAchieved = goal.status === 'achieved';
  const isAbandoned = goal.status === 'abandoned';

  const barColor = isAchieved
    ? 'bg-emerald-500'
    : isAbandoned
      ? 'bg-gray-600'
      : progress >= 100
        ? 'bg-emerald-500'
        : 'bg-emerald-600';

  return (
    <div className={`card ${isAchieved ? 'border-emerald-800/50' : isAbandoned ? 'border-gray-700' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-200">{goal.exercise_name}</h3>
          <p className="text-sm text-gray-500">{goal.muscle_group}</p>
        </div>
        <div className="flex gap-1">
          {goal.status === 'active' && (
            <button onClick={() => onStatusChange(goal.id, 'achieved')} className="text-xs btn-primary !py-1 !px-2" title="Mark achieved">
              ✓
            </button>
          )}
          {goal.status === 'active' && (
            <button onClick={() => onStatusChange(goal.id, 'abandoned')} className="text-xs btn-secondary !py-1 !px-2" title="Abandon goal">
              ✗
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(goal.id)} className="text-xs btn-danger !py-1 !px-2" title="Delete goal">
              🗑
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1 mb-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">
            {current}kg / {target}kg
          </span>
          <span className="text-gray-500">{progress}%</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex justify-between text-xs text-gray-500">
        <span>
          {goal.status === 'active' ? (
            goal.target_date ? `Target: ${new Date(goal.target_date).toLocaleDateString()}` : 'No deadline'
          ) : (
            <span className={isAchieved ? 'text-emerald-500' : 'text-gray-500'}>
              {isAchieved ? '✓ Achieved' : '✗ Abandoned'}
            </span>
          )}
        </span>
        {goal.last_logged_at && <span>Last: {new Date(goal.last_logged_at).toLocaleDateString()}</span>}
      </div>
    </div>
  );
}
