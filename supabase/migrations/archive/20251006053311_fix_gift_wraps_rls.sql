-- Update policies for gift_wraps to be more explicit for anon/authenticated
DROP POLICY IF EXISTS "Public gift wraps access" ON public.gift_wraps;
DROP POLICY IF EXISTS "Admin gift wraps full access" ON public.gift_wraps;

-- Allow reading active gift wraps for everyone
CREATE POLICY "Enable read for all active gift wraps"
  ON public.gift_wraps FOR SELECT
  USING (is_active = true);

-- Allow admins full access
CREATE POLICY "Enable all for admins"
  ON public.gift_wraps FOR ALL
  TO authenticated
  USING ( public.has_role(auth.uid(), 'admin') );
