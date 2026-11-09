
-- Reforce security for product creation and updates
-- Sellers MUST be approved to manage products

-- 1. DROP old policies
DROP POLICY IF EXISTS "Sellers can create products" ON public.products;
DROP POLICY IF EXISTS "Sellers can update own products" ON public.products;

-- 2. CREATE robust policies
CREATE POLICY "Approved sellers can create products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = seller_id AND 
    (
        public.has_role(auth.uid(), 'admin') OR 
        (
            public.has_role(auth.uid(), 'seller') AND 
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND is_approved = true
            )
        )
    )
  );

CREATE POLICY "Approved sellers can update own products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    (
        auth.uid() = seller_id AND 
        public.has_role(auth.uid(), 'seller') AND 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_approved = true
        )
    )
  );
