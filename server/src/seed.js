const { getPool } = require('./db');

const exercises = [
  { name: 'Bench Press', muscle_group: 'Chest', category: 'Barbell' },
  { name: 'Incline Bench Press', muscle_group: 'Chest', category: 'Barbell' },
  { name: 'Decline Bench Press', muscle_group: 'Chest', category: 'Barbell' },
  { name: 'Dumbbell Bench Press', muscle_group: 'Chest', category: 'Dumbbell' },
  { name: 'Dumbbell Flyes', muscle_group: 'Chest', category: 'Dumbbell' },
  { name: 'Cable Crossover', muscle_group: 'Chest', category: 'Cable' },
  { name: 'Push-ups', muscle_group: 'Chest', category: 'Bodyweight' },
  { name: 'Chest Press Machine', muscle_group: 'Chest', category: 'Machine' },
  { name: 'Pec Deck Fly', muscle_group: 'Chest', category: 'Machine' },

  { name: 'Deadlift', muscle_group: 'Back', category: 'Barbell' },
  { name: 'Pull-ups', muscle_group: 'Back', category: 'Bodyweight' },
  { name: 'Lat Pulldown', muscle_group: 'Back', category: 'Cable' },
  { name: 'Bent Over Row', muscle_group: 'Back', category: 'Barbell' },
  { name: 'Seated Cable Row', muscle_group: 'Back', category: 'Cable' },
  { name: 'T-Bar Row', muscle_group: 'Back', category: 'Barbell' },
  { name: 'Dumbbell Row', muscle_group: 'Back', category: 'Dumbbell' },
  { name: 'Face Pull', muscle_group: 'Back', category: 'Cable' },
  { name: 'Hyperextension', muscle_group: 'Back', category: 'Bodyweight' },

  { name: 'Overhead Press', muscle_group: 'Shoulders', category: 'Barbell' },
  { name: 'Seated Dumbbell Press', muscle_group: 'Shoulders', category: 'Dumbbell' },
  { name: 'Lateral Raises', muscle_group: 'Shoulders', category: 'Dumbbell' },
  { name: 'Front Raises', muscle_group: 'Shoulders', category: 'Dumbbell' },
  { name: 'Reverse Flyes', muscle_group: 'Shoulders', category: 'Dumbbell' },
  { name: 'Arnold Press', muscle_group: 'Shoulders', category: 'Dumbbell' },
  { name: 'Upright Row', muscle_group: 'Shoulders', category: 'Barbell' },
  { name: 'Shrugs', muscle_group: 'Shoulders', category: 'Dumbbell' },

  { name: 'Squat', muscle_group: 'Legs', category: 'Barbell' },
  { name: 'Front Squat', muscle_group: 'Legs', category: 'Barbell' },
  { name: 'Leg Press', muscle_group: 'Legs', category: 'Machine' },
  { name: 'Leg Extensions', muscle_group: 'Legs', category: 'Machine' },
  { name: 'Leg Curls', muscle_group: 'Legs', category: 'Machine' },
  { name: 'Romanian Deadlift', muscle_group: 'Legs', category: 'Barbell' },
  { name: 'Walking Lunges', muscle_group: 'Legs', category: 'Dumbbell' },
  { name: 'Bulgarian Split Squat', muscle_group: 'Legs', category: 'Dumbbell' },
  { name: 'Calf Raises', muscle_group: 'Legs', category: 'Machine' },
  { name: 'Hip Thrust', muscle_group: 'Legs', category: 'Barbell' },
  { name: 'Goblet Squat', muscle_group: 'Legs', category: 'Dumbbell' },

  { name: 'Barbell Curl', muscle_group: 'Arms', category: 'Barbell' },
  { name: 'Dumbbell Curl', muscle_group: 'Arms', category: 'Dumbbell' },
  { name: 'Hammer Curl', muscle_group: 'Arms', category: 'Dumbbell' },
  { name: 'Preacher Curl', muscle_group: 'Arms', category: 'Barbell' },
  { name: 'Tricep Pushdown', muscle_group: 'Arms', category: 'Cable' },
  { name: 'Skull Crushers', muscle_group: 'Arms', category: 'Barbell' },
  { name: 'Overhead Tricep Extension', muscle_group: 'Arms', category: 'Dumbbell' },
  { name: 'Dips', muscle_group: 'Arms', category: 'Bodyweight' },
  { name: 'Close-Grip Bench Press', muscle_group: 'Arms', category: 'Barbell' },

  { name: 'Plank', muscle_group: 'Core', category: 'Bodyweight' },
  { name: 'Crunches', muscle_group: 'Core', category: 'Bodyweight' },
  { name: 'Hanging Leg Raises', muscle_group: 'Core', category: 'Bodyweight' },
  { name: 'Russian Twists', muscle_group: 'Core', category: 'Bodyweight' },
  { name: 'Cable Crunch', muscle_group: 'Core', category: 'Cable' },
  { name: 'Ab Wheel Rollout', muscle_group: 'Core', category: 'Bodyweight' },
  { name: 'Pallof Press', muscle_group: 'Core', category: 'Cable' },
  { name: 'Side Plank', muscle_group: 'Core', category: 'Bodyweight' },
];

async function seed() {
  const pool = getPool();

  const { rows: [{ count }] } = await pool.query('SELECT COUNT(*) as count FROM exercises');
  if (parseInt(count) > 0) {
    console.log('Database already seeded — skipping.');
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const ex of exercises) {
      await client.query(
        'INSERT INTO exercises (name, muscle_group, category) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING',
        [ex.name, ex.muscle_group, ex.category]
      );
    }
    await client.query('COMMIT');
    console.log(`Seeded ${exercises.length} exercises.`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
