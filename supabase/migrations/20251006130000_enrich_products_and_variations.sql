-- Create product_variations table
CREATE TABLE public.product_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  sku TEXT UNIQUE,
  color TEXT,
  size TEXT,
  dimensions TEXT,
  weight DECIMAL(10,3), -- Weight in kg
  price DECIMAL(10,2), -- Optional override
  stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add updated_at trigger for product_variations
CREATE TRIGGER update_product_variations_updated_at BEFORE UPDATE ON public.product_variations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add parent_id to categories for subcategories
ALTER TABLE public.categories 
ADD COLUMN parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- Add new columns to products
ALTER TABLE public.products
ADD COLUMN brand TEXT,
ADD COLUMN model TEXT,
ADD COLUMN gender TEXT,
ADD COLUMN video_url TEXT,
ADD COLUMN warranty_info JSONB,
ADD COLUMN specifications JSONB;

-- Update product type check constraint if possible, or just trust the application
-- Postgres enums can be altered:
ALTER TYPE public.product_type ADD VALUE IF NOT EXISTS 'digital';

-- Enable RLS on product_variations
ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_variations
CREATE POLICY "Variations are viewable by everyone"
  ON public.product_variations FOR SELECT
  USING (true);

CREATE POLICY "Sellers can manage own product variations"
  ON public.product_variations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE id = product_variations.product_id AND seller_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE id = product_variations.product_id AND seller_id = auth.uid()
    )
  );
