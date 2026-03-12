
-- 1. Regularize UNIDUNITE Seller Application (SAFER VERSION)
-- Uses a procedural block to check existence before inserting/updating
DO $$
DECLARE
    v_user_id UUID;
    v_app_exists BOOLEAN;
BEGIN
    -- Get the user ID for UNIDUNITE
    SELECT id INTO v_user_id FROM public.profiles WHERE email = 'unidunite.cuiaba@gmail.com';

    IF v_user_id IS NOT NULL THEN
        -- Check if an application already exists for this user
        SELECT EXISTS (SELECT 1 FROM public.seller_applications WHERE user_id = v_user_id) INTO v_app_exists;

        IF v_app_exists THEN
            -- Update existing application to approved
            UPDATE public.seller_applications 
            SET status = 'approved', 
                store_name = 'UNIDUNITE - Kids & Teens',
                updated_at = now()
            WHERE user_id = v_user_id;
            RAISE NOTICE 'Existing UNIDUNITE application updated to approved.';
        ELSE
            -- Insert new approved application
            INSERT INTO public.seller_applications (
                user_id, 
                store_name, 
                status, 
                type,
                full_name,
                phone,
                city,
                state,
                accepted_terms,
                created_at
            ) 
            SELECT 
                id, 
                'UNIDUNITE - Kids & Teens', 
                'approved', 
                'pf', 
                full_name, 
                COALESCE(phone, '0000000000'), 
                'Cuiabá', 
                'MT', 
                true, 
                now()
            FROM public.profiles 
            WHERE id = v_user_id;
            RAISE NOTICE 'New UNIDUNITE application created as approved.';
        END IF;
    ELSE
        RAISE WARNING 'User unidunite.cuiaba@gmail.com not found in profiles.';
    END IF;
END $$;

-- 2. Ensure all partners are ADMINS
DO $$
DECLARE
    partner_emails TEXT[] := ARRAY['lilianfabiana@hotmail.com', 'ttattizanetti@gmail.com', 'hipnose.modas@hotmail.com', 'unidunite.cuiaba@gmail.com'];
    p_email TEXT;
    p_id UUID;
BEGIN
    FOREACH p_email IN ARRAY partner_emails
    LOOP
        SELECT id INTO p_id FROM public.profiles WHERE email = p_email;
        
        IF p_id IS NOT NULL THEN
            -- Update Profile Role
            UPDATE public.profiles SET role = 'admin' WHERE id = p_id;
            
            -- Ensure Admin Role in user_roles
            INSERT INTO public.user_roles (user_id, role) 
            VALUES (p_id, 'admin') 
            ON CONFLICT (user_id, role) DO NOTHING;
            
            RAISE NOTICE 'User % promoted to ADMIN', p_email;
        END IF;
    END LOOP;
END $$;
