-- RLS policies for exercises (shared/global table — everyone reads, admins manage)
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "authenticated_read_exercises" ON public.exercises
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "superadmin_manage_exercises" ON public.exercises
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'superadmin')
  );

CREATE POLICY IF NOT EXISTS "admin_manage_exercises" ON public.exercises
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );

-- RLS policies for profiles table
-- Allow users to read their own profile
CREATE POLICY IF NOT EXISTS "read_own_profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow superadmins to read all profiles
CREATE POLICY IF NOT EXISTS "superadmin_read_all" ON public.profiles
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'superadmin')
  );

-- Allow admins to read their own + their clients' profiles
CREATE POLICY IF NOT EXISTS "admin_read_own_and_clients" ON public.profiles
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    AND (id = auth.uid() OR admin_id = auth.uid())
  );

-- Allow users to insert their own profile (registration)
CREATE POLICY IF NOT EXISTS "insert_own_profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS policies for routines
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "access_own_routines" ON public.routines
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "admin_access_client_routines" ON public.routines
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    AND user_id IN (SELECT id FROM public.profiles WHERE admin_id = auth.uid())
  );

CREATE POLICY IF NOT EXISTS "superadmin_all_routines" ON public.routines
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'superadmin')
  );

-- RLS policies for workout_logs
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "access_own_logs" ON public.workout_logs
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "admin_access_client_logs" ON public.workout_logs
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    AND user_id IN (SELECT id FROM public.profiles WHERE admin_id = auth.uid())
  );

CREATE POLICY IF NOT EXISTS "superadmin_all_logs" ON public.workout_logs
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'superadmin')
  );

-- RLS policies for goals
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "access_own_goals" ON public.goals
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "admin_access_client_goals" ON public.goals
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    AND user_id IN (SELECT id FROM public.profiles WHERE admin_id = auth.uid())
  );

CREATE POLICY IF NOT EXISTS "superadmin_all_goals" ON public.goals
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'superadmin')
  );

-- RLS policies for session_targets
ALTER TABLE public.session_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "access_own_targets" ON public.session_targets
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "admin_access_client_targets" ON public.session_targets
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    AND user_id IN (SELECT id FROM public.profiles WHERE admin_id = auth.uid())
  );

CREATE POLICY IF NOT EXISTS "superadmin_all_targets" ON public.session_targets
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'superadmin')
  );
