
-- Add missing seller-related columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS seller_delivery_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS subscription_plan_id UUID REFERENCES public.subscription_plans(id),
ADD COLUMN IF NOT EXISTS max_installments INTEGER DEFAULT 12;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.seller_delivery_enabled IS 'Indicates if the seller offers own delivery/hybrid logistics';
COMMENT ON COLUMN public.profiles.verified IS 'Indicates if the seller is verified with a badge';
COMMENT ON COLUMN public.profiles.subscription_plan_id IS 'Current active subscription plan for the seller';
COMMENT ON COLUMN public.profiles.max_installments IS 'Maximum number of installments allowed by the seller';
