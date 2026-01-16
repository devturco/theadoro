-- 1. Create a truly universal helper function for order access
-- This function checks if a user is the buyer, a seller of any item, or an admin.
-- Being SECURITY DEFINER, it bypasses RLS and prevents recursion.
CREATE OR REPLACE FUNCTION public.can_access_order(_order_id UUID, _user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_buyer BOOLEAN;
    is_seller BOOLEAN;
    is_admin BOOLEAN;
BEGIN
    -- Check if user is buyer
    SELECT EXISTS (
        SELECT 1 FROM public.orders 
        WHERE id = _order_id AND buyer_id = _user_id
    ) INTO is_buyer;

    -- Check if user is seller of any item in this order
    SELECT EXISTS (
        SELECT 1 FROM public.order_items 
        WHERE order_id = _order_id AND seller_id = _user_id
    ) INTO is_seller;

    -- Check if user is admin
    -- Note: has_role is already stable, but we query user_roles directly for speed
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = _user_id AND role = 'admin'
    ) INTO is_admin;

    RETURN is_buyer OR is_seller OR is_admin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Clean up ALL old policies to start fresh and avoid conflicts
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Sellers can view orders containing their products" ON public.orders;
DROP POLICY IF EXISTS "Users can view order items for their orders" ON public.order_items;
DROP POLICY IF EXISTS "Order universal access" ON public.orders;
DROP POLICY IF EXISTS "Order items universal access" ON public.order_items;

-- 3. Apply the universal access policy to 'orders'
CREATE POLICY "Universal order access"
  ON public.orders FOR SELECT
  TO authenticated
  USING ( public.can_access_order(id, auth.uid()) );

-- 4. Apply the universal access policy to 'order_items'
CREATE POLICY "Universal order items access"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    seller_id = auth.uid() OR -- Direct access optimization
    public.can_access_order(order_id, auth.uid()) -- Access via order participation
  );

-- 5. If there are other tables that need similar access, they can use the same function.
-- For example, 'appointments' could also be secured this way.
