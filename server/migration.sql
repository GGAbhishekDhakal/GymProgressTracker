CREATE TABLE IF NOT EXISTS exercises (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  muscle_group TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Barbell',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS routines (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS routine_exercises (
  id BIGSERIAL PRIMARY KEY,
  routine_id INTEGER NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS workout_logs (
  id BIGSERIAL PRIMARY KEY,
  exercise_id INTEGER NOT NULL REFERENCES exercises(id),
  weight NUMERIC(8,2) NOT NULL,
  reps INTEGER NOT NULL DEFAULT 1,
  sets INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  logged_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goals (
  id BIGSERIAL PRIMARY KEY,
  exercise_id INTEGER NOT NULL REFERENCES exercises(id),
  target_weight NUMERIC(8,2) NOT NULL,
  target_date DATE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'achieved', 'abandoned')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
