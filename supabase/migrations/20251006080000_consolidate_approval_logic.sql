-- Consolidate all seller approval logic into a single robust function
-- This handles: Role Update, Subscription Activation, and Initial Invoice Generation

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
    -- Only run when status changes to 'approved'
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status <> 'approved') THEN
        
        -- 1. Update the user's role in public.profiles to 'seller'
        UPDATE public.profiles
        SET role = 'seller'
        WHERE id = NEW.user_id;

        -- 1.5 Ensure the 'seller' role exists in public.user_roles (CRITICAL FOR RLS)
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.user_id, 'seller')
        ON CONFLICT (user_id, role) DO NOTHING;

        -- 2. Determine Plan
        IF NEW.chosen_plan_id IS NOT NULL THEN
             v_plan_id := NEW.chosen_plan_id;
        ELSE
             -- Default to the cheapest active plan
             SELECT id INTO v_plan_id
             FROM public.subscription_plans
             WHERE is_active = true
             ORDER BY price ASC
             LIMIT 1;
        END IF;

        -- Get plan price for the invoice
        SELECT price INTO v_plan_price
        FROM public.subscription_plans
        WHERE id = v_plan_id;

        IF v_plan_id IS NOT NULL THEN
            -- 3. Create or Update the subscription
            -- We use an UPSERT like logic: if they already had one (maybe a previous trial), we reactivate it
            INSERT INTO public.seller_subscriptions (
                seller_id,
                plan_id,
                status,
                current_period_start,
                current_period_end
            ) VALUES (
                NEW.user_id,
                v_plan_id,
                'active',
                now(),
                now() + INTERVAL '30 days'
            )
            ON CONFLICT (seller_id) DO UPDATE 
            SET plan_id = EXCLUDED.plan_id,
                status = 'active',
                current_period_start = now(),
                current_period_end = now() + INTERVAL '30 days'
            RETURNING id INTO v_subscription_id;

            -- 4. Create Initial Invoice
            -- This ensures that as soon as they are approved, they see a "Pending Payment" in their dashboard
            INSERT INTO public.seller_invoices (
                seller_id,
                subscription_id,
                amount,
                status,
                due_date,
                created_at
            ) VALUES (
                NEW.user_id,
                v_subscription_id,
                v_plan_price,
                'pending',
                now() + INTERVAL '3 days', -- 3 days to pay
                now()
            );
        END IF;

    END IF;
    RETURN NEW;
END;
$$;

-- Add unique constraint if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'seller_subscriptions_seller_id_key') THEN
        ALTER TABLE public.seller_subscriptions ADD CONSTRAINT seller_subscriptions_seller_id_key UNIQUE (seller_id);
    END IF;
END $$;

-- Ensure the trigger exists and points to this function
DROP TRIGGER IF EXISTS trg_seller_approval_subscription ON public.seller_applications;
CREATE TRIGGER trg_seller_approval_subscription
AFTER UPDATE ON public.seller_applications
FOR EACH ROW
EXECUTE FUNCTION public.handle_seller_approval_subscription();
