-- Admin RLS Policies for Subscription Plans
-- This ensures admins can CRUD plans via the new admin panel

-- Plan Management
DROP POLICY IF EXISTS "Admins manage plans" ON public.subscription_plans;
CREATE POLICY "Admins manage plans"
ON public.subscription_plans FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Ensure public read still works but only for active plans
DROP POLICY IF EXISTS "Public read plans" ON public.subscription_plans;
CREATE POLICY "Public read plans"
ON public.subscription_plans FOR SELECT
TO public
USING (is_active = true OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
));

-- Final check for Invoices (already should be correct, but let's reinforce)
DROP POLICY IF EXISTS "Admins can view all invoices" ON public.seller_invoices;
CREATE POLICY "Admins manage all invoices" 
ON public.seller_invoices FOR ALL 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);
