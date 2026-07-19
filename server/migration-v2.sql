-- Phase 1: RBAC v2 migration
-- Run this in Supabase SQL Editor

-- 1. Assigned exercises (admin assigns exercises to clients)
CREATE TABLE IF NOT EXISTS assigned_exercises (
  id BIGSERIAL PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, exercise_id)
);

-- 2. Assigned routines (admin assigns routines to clients)
CREATE TABLE IF NOT EXISTS assigned_routines (
  id BIGSERIAL PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  routine_id INTEGER NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, routine_id)
);

-- 3. Add owner_type to routines
ALTER TABLE routines ADD COLUMN IF NOT EXISTS owner_type TEXT DEFAULT 'personal'
  CHECK (owner_type IN ('personal', 'admin_created'));

-- 4. Enable RLS on new tables
ALTER TABLE assigned_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE assigned_routines ENABLE ROW LEVEL SECURITY;

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_assigned_exercises_client ON assigned_exercises(client_id);
CREATE INDEX IF NOT EXISTS idx_assigned_exercises_exercise ON assigned_exercises(exercise_id);
CREATE INDEX IF NOT EXISTS idx_assigned_routines_client ON assigned_routines(client_id);
CREATE INDEX IF NOT EXISTS idx_assigned_routines_routine ON assigned_routines(routine_id);
CREATE INDEX IF NOT EXISTS idx_routines_owner_type ON routines(owner_type);
