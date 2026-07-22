-- Multi-organization migration
-- Run this in Supabase SQL Editor

-- 1. Organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2. Add org_id to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON public.profiles(org_id);

-- 3. Add org_id to exercises (null = global, non-null = org-specific)
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
CREATE INDEX IF NOT EXISTS idx_exercises_org_id ON public.exercises(org_id);

-- 4. RLS for organizations
DROP POLICY IF EXISTS "superadmin_manage_org" ON public.organizations;
CREATE POLICY "superadmin_manage_org" ON public.organizations
  FOR ALL USING (created_by = auth.uid());

DROP POLICY IF EXISTS "org_members_read_org" ON public.organizations;
CREATE POLICY "org_members_read_org" ON public.organizations
  FOR SELECT USING (
    id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  );

-- 5. Update profiles RLS: superadmins see all in their org
DROP POLICY IF EXISTS "superadmin_read_all" ON public.profiles;
DROP POLICY IF EXISTS "superadmin_read_org" ON public.profiles;
CREATE POLICY "superadmin_read_org" ON public.profiles
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'superadmin')
    AND (
      org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
      OR org_id IS NULL
    )
  );

-- 6. Update admin profile reads: admins see users in same org
DROP POLICY IF EXISTS "admin_read_own_and_clients" ON public.profiles;
DROP POLICY IF EXISTS "admin_read_org_clients" ON public.profiles;
CREATE POLICY "admin_read_org_clients" ON public.profiles
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    AND (
      id = auth.uid()
      OR admin_id = auth.uid()
      OR (role = 'client' AND org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()) AND admin_id IS NULL)
    )
  );

-- 7. Exercises: global readable by all, org-specific readable by org members
DROP POLICY IF EXISTS "authenticated_read_exercises" ON public.exercises;
DROP POLICY IF EXISTS "read_global_exercises" ON public.exercises;
CREATE POLICY "read_global_exercises" ON public.exercises
  FOR SELECT USING (org_id IS NULL);

DROP POLICY IF EXISTS "read_org_exercises" ON public.exercises;
CREATE POLICY "read_org_exercises" ON public.exercises
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  );

-- superadmins/admins can manage exercises (global or their org)
DROP POLICY IF EXISTS "superadmin_manage_exercises" ON public.exercises;
CREATE POLICY "superadmin_manage_exercises" ON public.exercises
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'superadmin')
  );

DROP POLICY IF EXISTS "admin_manage_exercises" ON public.exercises;
CREATE POLICY "admin_manage_exercises" ON public.exercises
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );

-- 8. RLS for data tables: scope admin/superadmin access to org
-- Routines
DROP POLICY IF EXISTS "superadmin_all_routines" ON public.routines;
CREATE POLICY "superadmin_all_routines" ON public.routines
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'superadmin')
    AND user_id IN (
      SELECT p.id FROM public.profiles p
      WHERE p.org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "admin_access_client_routines" ON public.routines;
CREATE POLICY "admin_access_client_routines" ON public.routines
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    AND user_id IN (SELECT id FROM public.profiles WHERE admin_id = auth.uid())
  );

-- Workout logs
DROP POLICY IF EXISTS "superadmin_all_logs" ON public.workout_logs;
CREATE POLICY "superadmin_all_logs" ON public.workout_logs
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'superadmin')
    AND user_id IN (
      SELECT p.id FROM public.profiles p
      WHERE p.org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "admin_access_client_logs" ON public.workout_logs;
CREATE POLICY "admin_access_client_logs" ON public.workout_logs
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    AND user_id IN (SELECT id FROM public.profiles WHERE admin_id = auth.uid())
  );

-- Goals
DROP POLICY IF EXISTS "superadmin_all_goals" ON public.goals;
CREATE POLICY "superadmin_all_goals" ON public.goals
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'superadmin')
    AND user_id IN (
      SELECT p.id FROM public.profiles p
      WHERE p.org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "admin_access_client_goals" ON public.goals;
CREATE POLICY "admin_access_client_goals" ON public.goals
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    AND user_id IN (SELECT id FROM public.profiles WHERE admin_id = auth.uid())
  );

-- Session targets
DROP POLICY IF EXISTS "superadmin_all_targets" ON public.session_targets;
CREATE POLICY "superadmin_all_targets" ON public.session_targets
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'superadmin')
    AND user_id IN (
      SELECT p.id FROM public.profiles p
      WHERE p.org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "admin_access_client_targets" ON public.session_targets;
CREATE POLICY "admin_access_client_targets" ON public.session_targets
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    AND user_id IN (SELECT id FROM public.profiles WHERE admin_id = auth.uid())
  );
