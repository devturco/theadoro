
-- Migration to create all required storage buckets and setup RLS policies
-- Buckets: products, avatars, categories, documents, cms, gift-wraps

-- 1. Create Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('products', 'products', true),
  ('avatars', 'avatars', true),
  ('categories', 'categories', true),
  ('documents', 'documents', false),
  ('cms', 'cms', true),
  ('gift-wraps', 'gift-wraps', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Setup RLS for Buckets (Cleanup existing to avoid duplicates if re-run)
DO $$ 
BEGIN
    -- Public Buckets Policies (Select)
    DROP POLICY IF EXISTS "Public Access" ON storage.objects;
    CREATE POLICY "Public Access" ON storage.objects
        FOR SELECT TO public
        USING (bucket_id IN ('products', 'avatars', 'categories', 'cms', 'gift-wraps'));

    -- Admin/Seller Policies for Products
    DROP POLICY IF EXISTS "Sellers can upload product images" ON storage.objects;
    CREATE POLICY "Sellers can upload product images" ON storage.objects
        FOR INSERT TO authenticated
        WITH CHECK (
            bucket_id = 'products' AND 
            (public.has_role(auth.uid(), 'seller') OR public.has_role(auth.uid(), 'admin'))
        );

    DROP POLICY IF EXISTS "Sellers can delete product images" ON storage.objects;
    CREATE POLICY "Sellers can delete product images" ON storage.objects
        FOR DELETE TO authenticated
        USING (
            bucket_id = 'products' AND 
            (public.has_role(auth.uid(), 'seller') OR public.has_role(auth.uid(), 'admin'))
        );

    -- Admin Policies for CMS
    DROP POLICY IF EXISTS "Admins can manage CMS images" ON storage.objects;
    CREATE POLICY "Admins can manage CMS images" ON storage.objects
        FOR ALL TO authenticated
        USING (
            bucket_id = 'cms' AND 
            public.has_role(auth.uid(), 'admin')
        )
        WITH CHECK (
            bucket_id = 'cms' AND 
            public.has_role(auth.uid(), 'admin')
        );

    -- Admin Policies for Categories and Gift Wraps
    DROP POLICY IF EXISTS "Admins can manage common buckets" ON storage.objects;
    CREATE POLICY "Admins can manage common buckets" ON storage.objects
        FOR ALL TO authenticated
        USING (
            bucket_id IN ('categories', 'gift-wraps') AND 
            public.has_role(auth.uid(), 'admin')
        )
        WITH CHECK (
            bucket_id IN ('categories', 'gift-wraps') AND 
            public.has_role(auth.uid(), 'admin')
        );

    -- User Policies for Avatars
    DROP POLICY IF EXISTS "Users can manage own avatar" ON storage.objects;
    CREATE POLICY "Users can manage own avatar" ON storage.objects
        FOR ALL TO authenticated
        USING (
            bucket_id = 'avatars' AND 
            (auth.uid()::text = (storage.foldername(name))[1])
        )
        WITH CHECK (
            bucket_id = 'avatars' AND 
            (auth.uid()::text = (storage.foldername(name))[1])
        );

    -- User/Admin Policies for Documents
    DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;
    CREATE POLICY "Users can upload own documents" ON storage.objects
        FOR INSERT TO authenticated
        WITH CHECK (
            bucket_id = 'documents' AND 
            (auth.uid()::text = (storage.foldername(name))[2]) -- folder format: documents/type/userId/file.ext
        );

    DROP POLICY IF EXISTS "Users can view own documents" ON storage.objects;
    CREATE POLICY "Users can view own documents" ON storage.objects
        FOR SELECT TO authenticated
        USING (
            bucket_id = 'documents' AND 
            ((auth.uid()::text = (storage.foldername(name))[2]) OR public.has_role(auth.uid(), 'admin'))
        );

END $$;
