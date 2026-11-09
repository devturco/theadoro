CREATE OR REPLACE FUNCTION public.handle_seller_approval_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_plan_id UUID;
BEGIN
    -- Only run when status changes to 'approved'
    IF NEW.status = 'approved' AND OLD.status <> 'approved' THEN
        
        -- 1. Update the user's role in public.profiles to 'seller'
        UPDATE public.profiles
        SET role = 'seller'
        WHERE id = NEW.user_id;

        -- 2. Handle Subscription Plan
        -- Check if a specific plan was chosen in the application
        IF NEW.chosen_plan_id IS NOT NULL THEN
             v_plan_id := NEW.chosen_plan_id;
        ELSE
             -- Default to the cheapest active plan or a specific default
             SELECT id INTO v_plan_id
             FROM public.subscription_plans
             WHERE is_active = true
             ORDER BY price ASC
             LIMIT 1;
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
                'active', -- Start active immediately
                now(),
                now() + INTERVAL '30 days'
            );
        END IF;

    END IF;
    RETURN NEW;
END;
$$;
