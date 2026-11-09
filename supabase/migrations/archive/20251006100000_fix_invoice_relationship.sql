-- Fix seller_invoices relationship to public.profiles
-- This allows PostgREST to properly join and fetch seller metadata (name, email)

-- 1. Drop existing FK if it exists (usually it doesn't have a specific name if not defined, but let's check)
DO $$ 
BEGIN 
    -- Try to drop the constraint by name if we can find it, otherwise we'll just drop and recreate
    ALTER TABLE public.seller_invoices DROP CONSTRAINT IF EXISTS seller_invoices_seller_id_fkey;
END $$;

-- 2. Re-add the reference to public.profiles
ALTER TABLE public.seller_invoices
ADD CONSTRAINT seller_invoices_seller_id_fkey 
FOREIGN KEY (seller_id) REFERENCES public.profiles(id);

-- 3. Verify RLS (should be fine as it uses seller_id which is the same UUID)
