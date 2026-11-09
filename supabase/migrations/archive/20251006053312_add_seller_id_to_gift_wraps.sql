-- Migration to add seller_id to gift_wraps table
-- This allows sellers to create and manage their own gift wrap options.

-- Add seller_id column
ALTER TABLE public.gift_wraps 
ADD COLUMN seller_id UUID REFERENCES public.profiles(id);

-- Update RLS policies to allow sellers to manage their own gift wraps
DROP POLICY IF EXISTS "Admin gift wraps full access" ON public.gift_wraps;

-- Policy for public read access (remains correct: anyone can see active wraps)
-- We might want to restrict this in the future to only show wraps for products in cart, 
-- but for now public read access is fine.

-- Policy for Sellers to manage their own wraps
CREATE POLICY "Sellers manage own gift wraps"
  ON public.gift_wraps
  FOR ALL
  TO authenticated
  USING (
    seller_id = auth.uid() OR 
    -- Admins can still manage everything (optional, but good practice)
    (SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1) = 'admin'
  )
  WITH CHECK (
    seller_id = auth.uid() OR
    (SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1) = 'admin'
  );

-- Helper index for performance since we'll query by seller_id often
CREATE INDEX idx_gift_wraps_seller_id ON public.gift_wraps(seller_id);
