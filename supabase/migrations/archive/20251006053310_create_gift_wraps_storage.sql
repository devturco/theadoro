-- Migration to create the gift-wraps storage bucket
-- This allows storing images for gift wrap options.

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('gift-wraps', 'gift-wraps', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Setup RLS for the bucket
-- Allow public access to read files
CREATE POLICY "Public access to gift-wrap images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'gift-wraps');

-- Allow authenticated users with admin role to upload files
CREATE POLICY "Admins can upload gift-wrap images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'gift-wraps' AND
    (public.has_role(auth.uid(), 'admin'))
  );

-- Allow authenticated users with admin role to update files
CREATE POLICY "Admins can update gift-wrap images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'gift-wraps' AND
    (public.has_role(auth.uid(), 'admin'))
  );

-- Allow authenticated users with admin role to delete files
CREATE POLICY "Admins can delete gift-wrap images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'gift-wraps' AND
    (public.has_role(auth.uid(), 'admin'))
  );
