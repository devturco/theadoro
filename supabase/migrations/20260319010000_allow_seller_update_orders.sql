DROP POLICY IF EXISTS "Sellers can update orders containing their products" ON public.orders;

CREATE POLICY "Sellers can update orders containing their products"
    ON public.orders
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.order_items oi
            WHERE oi.order_id = orders.id
              AND oi.seller_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.order_items oi
            WHERE oi.order_id = orders.id
              AND oi.seller_id = auth.uid()
        )
    );
