-- Robust Coupons Table Management
-- Use this file to create or repair the coupons table structure

-- 1. Ensure table exists
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

-- 2. Add all columns with safety checks
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed'));
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10,2);
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS min_purchase_value DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS max_discount_value DECIMAL(10,2);
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS usage_limit INTEGER;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS used_count INTEGER DEFAULT 0;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 3. Ensure uniqueness
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'coupons_code_seller_id_key') THEN
        ALTER TABLE public.coupons ADD CONSTRAINT coupons_code_seller_id_key UNIQUE(code, seller_id);
    END IF;
END $$;

-- 4. Secure the table
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coupons are viewable by everyone" ON public.coupons;
DROP POLICY IF EXISTS "Sellers can manage their own coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can manage all coupons" ON public.coupons;

CREATE POLICY "Coupons are viewable by everyone"
    ON public.coupons FOR SELECT
    USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Sellers can manage their own coupons"
    ON public.coupons FOR ALL
    TO authenticated
    USING (auth.uid() = seller_id)
    WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Admins can manage all coupons"
    ON public.coupons FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- 5. Updated At Trigger
DROP TRIGGER IF EXISTS update_coupons_updated_at ON public.coupons;
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
