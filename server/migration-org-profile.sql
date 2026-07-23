-- Org profile + KYC fields
-- Run this in Supabase SQL Editor

-- 1. Org profile fields
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 2. Org KYC (business verification)
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'none'
  CHECK (kyc_status IN ('none', 'pending', 'verified', 'rejected'));
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS kyc_business_name TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS kyc_registration_number TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS kyc_tax_id TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS kyc_business_type TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS kyc_business_address TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS kyc_contact_person TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS kyc_contact_email TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS kyc_contact_phone TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS kyc_registration_doc_url TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS kyc_tax_doc_url TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS kyc_submitted_at TIMESTAMPTZ;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMPTZ;
