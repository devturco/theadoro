-- Existing migration content
-- Migration to add subscription plans table etc...

-- 1. Function to check overdue subscriptions
-- This function is intended to be called daily (e.g. via PG_CRON or Edge Function)
CREATE OR REPLACE FUNCTION public.check_overdue_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    r RECORD;
BEGIN
    -- 1. Handle subscriptions that are just overdue (expired yesterday)
    -- Update status to 'past_due'
    UPDATE public.seller_subscriptions
    SET status = 'past_due',
        updated_at = now()
    WHERE status = 'active'
      AND current_period_end < now();

    -- 2. Handle subscriptions that are overdue by 10 days
    -- Update status to 'canceled' (or 'suspended' if we added it, but 'canceled' suffices for logic)
    -- And deactivate seller products
    FOR r IN
        SELECT id, seller_id 
        FROM public.seller_subscriptions
        WHERE status IN ('active', 'past_due')
          AND current_period_end < (now() - INTERVAL '10 days')
    LOOP
        -- Update subscription status
        UPDATE public.seller_subscriptions
        SET status = 'canceled', -- Effectively suspended
            updated_at = now()
        WHERE id = r.id;

        -- Deactivate seller's products
        UPDATE public.products
        SET is_active = false
        WHERE seller_id = r.seller_id;

        -- Optional: Log or notify
        -- RAISE NOTICE 'Suspended seller % due to payment overdue', r.seller_id;
    END LOOP;
END;
$$;


-- 2. Function to provision subscription on approval
-- This will be called via RPC from the frontend when admin approves, 
-- OR via a Database Trigger on seller_applications update.
-- Let's use a Trigger for robustness.

CREATE OR REPLACE FUNCTION public.handle_seller_approval_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_plan_id UUID;
    v_plan_price DECIMAL;
BEGIN
    -- Only run if status changed to 'approved'
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        
        -- Get the chosen plan from application
        v_plan_id := NEW.chosen_plan_id;

        -- If no plan chosen (legacy), default to the cheapest active plan or specific one
        IF v_plan_id IS NULL THEN
            SELECT id INTO v_plan_id FROM public.subscription_plans WHERE is_active = true ORDER BY price ASC LIMIT 1;
        END IF;

        IF v_plan_id IS NOT NULL THEN
            -- Create the subscription
            INSERT INTO public.seller_subscriptions (
                seller_id,
                plan_id,
                status,
                current_period_start,
                current_period_end
            ) VALUES (
                NEW.user_id,
                v_plan_id,
                'active', -- Start active immediately (or 'trialing' if you prefer)
                now(),
                now() + INTERVAL '30 days' -- Give 30 days initially, or handle payment first
            );
        END IF;

    END IF;
    RETURN NEW;
END;
$$;

-- Create Trigger
DROP TRIGGER IF EXISTS trg_seller_approval_subscription ON public.seller_applications;
CREATE TRIGGER trg_seller_approval_subscription
AFTER UPDATE ON public.seller_applications
FOR EACH ROW
EXECUTE FUNCTION public.handle_seller_approval_subscription();
