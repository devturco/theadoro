DROP POLICY IF EXISTS "Buyers can insert payment events from own orders" ON public.payment_events;
CREATE POLICY "Buyers can insert payment events from own orders"
    ON public.payment_events
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.orders o
            WHERE o.id = payment_events.order_id
              AND o.buyer_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can manage payment events" ON public.payment_events;
CREATE POLICY "Admins can manage payment events"
    ON public.payment_events
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
