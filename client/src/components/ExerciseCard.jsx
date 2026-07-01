export default function ExerciseCard({ exercise, onDelete, selected, onToggle }) {
  const categoryColors = {
    Barbell: 'text-orange-400 bg-orange-400/10',
    Dumbbell: 'text-blue-400 bg-blue-400/10',
    Cable: 'text-purple-400 bg-purple-400/10',
    Machine: 'text-cyan-400 bg-cyan-400/10',
    Bodyweight: 'text-green-400 bg-green-400/10',
  };

  return (
    <div
      className={`card cursor-pointer transition-all ${selected ? 'ring-2 ring-emerald-500' : 'hover:border-gray-700'}`}
      onClick={() => onToggle?.(exercise.id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-200 truncate">{exercise.name}</h3>
          <p className="text-sm text-gray-500">{exercise.muscle_group}</p>
        </div>
        <div className="flex items-center gap-2 ml-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[exercise.category] || 'text-gray-400 bg-gray-400/10'}`}>
            {exercise.category}
          </span>
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(exercise.id); }}
              className="text-gray-600 hover:text-red-400 transition-colors text-lg leading-none"
              title="Delete exercise"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
