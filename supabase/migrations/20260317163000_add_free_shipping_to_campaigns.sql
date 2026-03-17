ALTER TABLE public.campaigns
    ADD COLUMN IF NOT EXISTS free_shipping_enabled BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS free_shipping_threshold NUMERIC(10,2);

DROP POLICY IF EXISTS "Campaigns are viewable by all" ON public.campaigns;
CREATE POLICY "Campaigns are viewable by all"
ON public.campaigns FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins manage campaigns" ON public.campaigns;
CREATE POLICY "Admins manage campaigns"
ON public.campaigns FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Sellers can manage participation" ON public.campaign_participants;
DROP POLICY IF EXISTS "Sellers view own participation" ON public.campaign_participants;
DROP POLICY IF EXISTS "Sellers insert own participation" ON public.campaign_participants;
DROP POLICY IF EXISTS "Sellers delete own participation" ON public.campaign_participants;

CREATE POLICY "Sellers view own participation"
ON public.campaign_participants FOR SELECT
TO authenticated
USING (seller_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sellers insert own participation"
ON public.campaign_participants FOR INSERT
TO authenticated
WITH CHECK (seller_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sellers delete own participation"
ON public.campaign_participants FOR DELETE
TO authenticated
USING (seller_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
