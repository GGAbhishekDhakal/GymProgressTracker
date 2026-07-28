-- Supabase Storage buckets for file uploads
-- Run this in Supabase SQL Editor

-- 1. Create buckets (idempotent)
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-documents', 'kyc-documents', true)
  ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES ('org-assets', 'org-assets', true)
  ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies then recreate (avoids "already exists" errors)
DROP POLICY IF EXISTS "Users upload own KYC docs" ON storage.objects;
DROP POLICY IF EXISTS "Users read own KYC docs" ON storage.objects;
DROP POLICY IF EXISTS "Users update own KYC docs" ON storage.objects;
DROP POLICY IF EXISTS "Org admins upload org assets" ON storage.objects;
DROP POLICY IF EXISTS "Public read org assets" ON storage.objects;

-- 3. RLS policies for kyc-documents bucket
CREATE POLICY "Users upload own KYC docs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users read own KYC docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users update own KYC docs"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 4. RLS policies for org-assets bucket
CREATE POLICY "Org admins upload org assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'org-assets');

CREATE POLICY "Public read org assets"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'org-assets');
