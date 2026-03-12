
-- Consolidated Fix for Security, Coupons and Seller Approval

-- 1. Add is_approved column to profiles if not exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;

-- 2. Ensure coupons table exists with correct structure
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'coupons') THEN
        CREATE TABLE public.coupons (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
            code TEXT NOT NULL,
            discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
            discount_value DECIMAL(10,2) NOT NULL,
            min_purchase_value DECIMAL(10,2) DEFAULT 0,
            max_discount_value DECIMAL(10,2),
            usage_limit INTEGER,
            used_count INTEGER DEFAULT 0,
            starts_at TIMESTAMPTZ DEFAULT now(),
            expires_at TIMESTAMPTZ,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now(),
            UNIQUE(code, seller_id)
        );
        
        -- RLS for new coupons table
        ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Coupons are viewable by everyone" ON public.coupons FOR SELECT USING (is_active = true);
        CREATE POLICY "Sellers manage own coupons" ON public.coupons FOR ALL USING (auth.uid() = seller_id);
    END IF;
END $$;

-- 3. Update Product RLS to require is_approved = true
DROP POLICY IF EXISTS "Approved sellers can create products" ON public.products;
DROP POLICY IF EXISTS "Approved sellers can update own products" ON public.products;
DROP POLICY IF EXISTS "Sellers can create products" ON public.products;
DROP POLICY IF EXISTS "Sellers can update own products" ON public.products;

CREATE POLICY "Approved sellers can create products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = seller_id AND 
    (
        public.has_role(auth.uid(), 'admin') OR 
        (
            public.has_role(auth.uid(), 'seller') AND 
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_approved = true)
        )
    )
  );

CREATE POLICY "Approved sellers can update own products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    (
        auth.uid() = seller_id AND 
        public.has_role(auth.uid(), 'seller') AND 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_approved = true)
    )
  );

-- 4. Robust Seller Approval Trigger
CREATE OR REPLACE FUNCTION public.handle_seller_approval_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_plan_id UUID;
    v_plan_price DECIMAL(10,2);
    v_subscription_id UUID;
BEGIN
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status <> 'approved') THEN
        
        -- Update Profile
        UPDATE public.profiles
        SET role = 'seller', is_approved = true
        WHERE id = NEW.user_id;

        -- Ensure user_roles entry
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.user_id, 'seller')
        ON CONFLICT (user_id, role) DO NOTHING;

        -- Subscription handling...
        IF NEW.chosen_plan_id IS NOT NULL THEN
             v_plan_id := NEW.chosen_plan_id;
        ELSE
             SELECT id INTO v_plan_id FROM public.subscription_plans WHERE is_active = true ORDER BY price ASC LIMIT 1;
        END IF;

        IF v_plan_id IS NOT NULL THEN
            INSERT INTO public.seller_subscriptions (seller_id, plan_id, status, current_period_start, current_period_end)
            VALUES (NEW.user_id, v_plan_id, 'active', now(), now() + INTERVAL '30 days')
            ON CONFLICT (seller_id) DO UPDATE SET status = 'active';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;
