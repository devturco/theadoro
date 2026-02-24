-- Add shipping_info and shipping_options to products table
ALTER TABLE public.products
ADD COLUMN shipping_info JSONB,
ADD COLUMN shipping_options JSONB;

-- shipping_info structure example: { "weight": 0.5, "height": 10, "width": 20, "depth": 15 }
-- shipping_options structure example: { "express_delivery": true, "own_delivery": false }
