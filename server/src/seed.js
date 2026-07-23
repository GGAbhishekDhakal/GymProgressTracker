const { supabase } = require('./db');

const exercises = [
  { name: 'Bench Press', muscle_group: 'Chest', category: 'Barbell' },
  { name: 'Incline Bench Press', muscle_group: 'Chest', category: 'Barbell' },
  { name: 'Decline Bench Press', muscle_group: 'Chest', category: 'Barbell' },
  { name: 'Dumbbell Bench Press', muscle_group: 'Chest', category: 'Dumbbell' },
  { name: 'Dumbbell Flyes', muscle_group: 'Chest', category: 'Dumbbell' },
  { name: 'Cable Crossover', muscle_group: 'Chest', category: 'Cable' },
  { name: 'Push-ups', muscle_group: 'Chest', category: 'Bodyweight' },
  { name: 'Chest Press Machine', muscle_group: 'Chest',  category: 'Machine' },
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

const EMAIL_DOMAIN = 'gt.local';

async function seed() {
  const { count, error } = await supabase
    .from('exercises')
    .select('*', { count: 'exact', head: true });

  if (error) throw error;

  if (count > 0) {
    console.log(`Database already seeded (${count} exercises) — skipping.`);
  } else {
    const { error: insErr } = await supabase
      .from('exercises')
      .insert(exercises);
    if (insErr) throw insErr;
    console.log(`Seeded ${exercises.length} exercises.`);
  }

  // Create test superadmin + org if env vars set
  const testUsername = process.env.SEED_ADMIN_USERNAME;
  const testPassword = process.env.SEED_ADMIN_PASSWORD;
  const testOrg = process.env.SEED_ORG_NAME || 'Test Gym';

  if (testUsername && testPassword) {
    const email = `${testUsername}@${EMAIL_DOMAIN}`;

    // Check if org exists
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('name', testOrg)
      .maybeSingle();

    if (existingOrg) {
      console.log(`Organization "${testOrg}" already exists — skipping admin seed.`);
      return;
    }

    // Create auth user
    const { data: authUser, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password: testPassword,
      email_confirm: true,
      user_metadata: { username: testUsername },
    });
    if (createErr) {
      if (createErr.message?.includes('already exists')) {
        console.log(`User ${testUsername} already exists — skipping.`);
        return;
      }
      throw createErr;
    }

    // Create superadmin profile first (needed for organizations.created_by FK)
    const { error: profileErr } = await supabase
      .from('profiles')
      .insert({
        id: authUser.user.id,
        username: testUsername,
        role: 'superadmin',
        approved: true,
      });
    if (profileErr) throw profileErr;

    // Create org
    const { data: org, error: orgErr } = await supabase
      .from('organizations')
      .insert({ name: testOrg, created_by: authUser.user.id })
      .select()
      .single();
    if (orgErr) throw orgErr;

    // Update profile with org_id
    const { error: updErr } = await supabase
      .from('profiles')
      .update({ org_id: org.id })
      .eq('id', authUser.user.id);
    if (updErr) throw updErr;

    console.log(`Created superadmin "${testUsername}" in org "${testOrg}"`);
  }
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
ç