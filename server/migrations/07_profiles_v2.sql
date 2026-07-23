-- Profile v2: edit profile, KYC, gym data
-- Run this in Supabase SQL Editor

-- 1. Profile fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- 2. Gym tracking data
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS height NUMERIC;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weight NUMERIC;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fitness_level TEXT CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced', 'elite'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fitness_goals TEXT;

-- 3. KYC
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'none'
  CHECK (kyc_status IN ('none', 'pending', 'verified', 'rejected'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_dob DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_id_type TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_id_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_id_front_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_id_back_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_selfie_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_submitted_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMPTZ;
