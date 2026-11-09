-- Checkout: integridade de estoque, cupom e frete grátis.
--
-- O navegador não pode atualizar products/coupons diretamente (RLS exige
-- vendedor/admin). Por isso a baixa de estoque e o contador de cupom são
-- operações atômicas executadas no servidor.

-- ─────────────────────────────────────────────────────────────
-- Estoque
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.decrement_product_stock(
    p_product_id UUID,
    p_quantity INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_updated INTEGER;
BEGIN
    IF p_quantity IS NULL OR p_quantity <= 0 THEN
        RETURN false;
    END IF;

    UPDATE public.products
       SET stock_quantity = stock_quantity - p_quantity
     WHERE id = p_product_id
       AND stock_quantity IS NOT NULL
       AND stock_quantity >= p_quantity;

    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decrement_product_stock(UUID, INTEGER) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.decrement_product_stock(UUID, INTEGER) FROM anon;

CREATE OR REPLACE FUNCTION public.restore_product_stock(
    p_product_id UUID,
    p_quantity INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_quantity IS NULL OR p_quantity <= 0 THEN
        RETURN;
    END IF;

    UPDATE public.products
       SET stock_quantity = COALESCE(stock_quantity, 0) + p_quantity
     WHERE id = p_product_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.restore_product_stock(UUID, INTEGER) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.restore_product_stock(UUID, INTEGER) FROM anon;

-- ─────────────────────────────────────────────────────────────
-- Cupom
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(p_code TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.coupons
       SET used_count = COALESCE(used_count, 0) + 1,
           updated_at = now()
     WHERE upper(code) = upper(p_code)
       AND is_active = true
       AND (usage_limit IS NULL OR usage_limit = 0 OR COALESCE(used_count, 0) < usage_limit);
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_coupon_usage(TEXT) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_coupon_usage(TEXT) FROM anon;

-- ─────────────────────────────────────────────────────────────
-- Frete grátis por campanha (a coluna estava ausente no banco)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.campaigns
    ADD COLUMN IF NOT EXISTS free_shipping_enabled BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS free_shipping_threshold NUMERIC(10,2);

-- ─────────────────────────────────────────────────────────────
-- Listas de presentes e datas importantes (telas do comprador)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gift_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE,
    is_public BOOLEAN NOT NULL DEFAULT true,
    slug TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gift_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID NOT NULL REFERENCES public.gift_lists(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity_desired INTEGER NOT NULL DEFAULT 1 CHECK (quantity_desired > 0),
    quantity_purchased INTEGER NOT NULL DEFAULT 0 CHECK (quantity_purchased >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.important_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    type TEXT NOT NULL DEFAULT 'other' CHECK (type IN ('birthday', 'anniversary', 'holiday', 'other')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gift_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.important_dates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners view gift lists" ON public.gift_lists;
CREATE POLICY "Owners view gift lists"
    ON public.gift_lists FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR is_public = true);

DROP POLICY IF EXISTS "Owners manage gift lists" ON public.gift_lists;
CREATE POLICY "Owners manage gift lists"
    ON public.gift_lists FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "View items of visible lists" ON public.gift_list_items;
CREATE POLICY "View items of visible lists"
    ON public.gift_list_items FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.gift_lists gl
            WHERE gl.id = gift_list_items.list_id
              AND (gl.user_id = auth.uid() OR gl.is_public = true)
        )
    );

DROP POLICY IF EXISTS "Owners manage gift list items" ON public.gift_list_items;
CREATE POLICY "Owners manage gift list items"
    ON public.gift_list_items FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.gift_lists gl
            WHERE gl.id = gift_list_items.list_id AND gl.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.gift_lists gl
            WHERE gl.id = gift_list_items.list_id AND gl.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Owners manage important dates" ON public.important_dates;
CREATE POLICY "Owners manage important dates"
    ON public.important_dates FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP TRIGGER IF EXISTS update_gift_lists_updated_at ON public.gift_lists;
CREATE TRIGGER update_gift_lists_updated_at
    BEFORE UPDATE ON public.gift_lists
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─────────────────────────────────────────────────────────────
-- Bucket de documentos do vendedor (existia só no banco vivo)
-- ─────────────────────────────────────────────────────────────
-- Mantém o mesmo comportamento do projeto em produção: o painel admin lê os
-- documentos por URL pública. Se quiser tornar privado, troque para `false`
-- e passe a usar createSignedUrl no Admin → Aprovações.
INSERT INTO storage.buckets (id, name, public)
VALUES ('seller-docs', 'seller-docs', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Sellers upload own documents" ON storage.objects;
CREATE POLICY "Sellers upload own documents"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'seller-docs'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Sellers view own documents" ON storage.objects;
CREATE POLICY "Sellers view own documents"
    ON storage.objects FOR SELECT TO authenticated
    USING (
        bucket_id = 'seller-docs'
        AND (
            (storage.foldername(name))[1] = auth.uid()::text
            OR public.has_role(auth.uid(), 'admin')
        )
    );

DROP POLICY IF EXISTS "Admins manage seller documents" ON storage.objects;
CREATE POLICY "Admins manage seller documents"
    ON storage.objects FOR ALL TO authenticated
    USING (
        bucket_id = 'seller-docs'
        AND public.has_role(auth.uid(), 'admin')
    )
    WITH CHECK (
        bucket_id = 'seller-docs'
        AND public.has_role(auth.uid(), 'admin')
    );