const muscleStyle = {
  Chest: {
    gradient: 'from-red-600/20 via-red-600/5 to-transparent',
    border: 'border-l-red-500/50',
    emoji: '🦍',
    accent: 'text-red-400',
    bg: 'bg-red-500/10',
    shadow: 'shadow-red-900/10',
  },
  Back: {
    gradient: 'from-emerald-600/20 via-emerald-600/5 to-transparent',
    border: 'border-l-emerald-500/50',
    emoji: '🔱',
    accent: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    shadow: 'shadow-emerald-900/10',
  },
  Shoulders: {
    gradient: 'from-orange-600/20 via-orange-600/5 to-transparent',
    border: 'border-l-orange-500/50',
    emoji: '🏔️',
    accent: 'text-orange-400',
    bg: 'bg-orange-500/10',
    shadow: 'shadow-orange-900/10',
  },
  Legs: {
    gradient: 'from-blue-600/20 via-blue-600/5 to-transparent',
    border: 'border-l-blue-500/50',
    emoji: '🦵',
    accent: 'text-blue-400',
    bg: 'bg-blue-500/10',
    shadow: 'shadow-blue-900/10',
  },
  Arms: {
    gradient: 'from-purple-600/20 via-purple-600/5 to-transparent',
    border: 'border-l-purple-500/50',
    emoji: '💪',
    accent: 'text-purple-400',
    bg: 'bg-purple-500/10',
    shadow: 'shadow-purple-900/10',
  },
  Core: {
    gradient: 'from-yellow-600/20 via-yellow-600/5 to-transparent',
    border: 'border-l-yellow-500/50',
    emoji: '🔥',
    accent: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    shadow: 'shadow-yellow-900/10',
  },
};

const categoryColors = {
  Barbell: 'bg-orange-500/20 text-orange-400 border-orange-500/20',
  Dumbbell: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
  Cable: 'bg-purple-500/20 text-purple-400 border-purple-500/20',
  Machine: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/20',
  Bodyweight: 'bg-green-500/20 text-green-400 border-green-500/20',
};

export default function ExerciseCard({ exercise, onDelete, selected, onToggle }) {
  const style = muscleStyle[exercise.muscle_group] || muscleStyle.Chest;

  return (
    <div
      className={`card relative overflow-hidden group cursor-pointer transition-all duration-200 ${
        selected
          ? 'ring-2 ring-emerald-500 shadow-lg shadow-emerald-500/20 scale-[1.02]'
          : 'hover:scale-[1.02] hover:-translate-y-0.5'
      }`}
      onClick={() => onToggle?.(exercise.id)}
    >
      <div className={`absolute inset-0 bg-gradient-to-br opacity-50 ${style.gradient}`} />
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`w-10 h-10 rounded-xl ${style.bg} flex items-center justify-center text-lg shrink-0 ${style.shadow}`}>
              {style.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold truncate ${style.accent}`}>{exercise.name}</h3>
              <p className="text-xs text-gray-500">{exercise.muscle_group}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-2 shrink-0">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${categoryColors[exercise.category] || 'bg-gray-500/20 text-gray-400 border-gray-500/20'}`}>
              {exercise.category}
            </span>
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(exercise.id); }}
                className="w-6 h-6 rounded-full bg-gray-800/80 hover:bg-red-500/20 hover:text-red-400 text-gray-600 flex items-center justify-center text-sm transition-all opacity-0 group-hover:opacity-100"
                title="Delete exercise"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
