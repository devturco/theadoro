-- Migration to create the gift_wraps table
-- This allows the admin to manage gift wrap options for the platform.

-- Clean up any previous partial installation
DROP TABLE IF EXISTS public.gift_wraps;

-- Ensure required extension for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE public.gift_wraps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Turn on RLS
ALTER TABLE public.gift_wraps ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public gift wraps access"
  ON public.gift_wraps FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admin gift wraps full access"
  ON public.gift_wraps FOR ALL
  TO authenticated
  USING ( public.has_role(auth.uid(), 'admin') );

-- Insert initial data from GIFT_WRAPS static config
INSERT INTO public.gift_wraps (name, description, price, image_url)
VALUES 
('Clássico Vermelho', 'Papel de presente vermelho clássico com laço dourado.', 5.90, 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=300&auto=format&fit=crop'),
('Kraft & Flores', 'Papel kraft ecológico com barbante rústico e ramo de flores secas.', 3.90, 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?q=80&w=300&auto=format&fit=crop'),
('Caixa Premium', 'Caixa rígida preta com logo em hot stamping dourado e laço de cetim.', 15.90, 'https://images.unsplash.com/photo-1607344645866-009c320c5af8?q=80&w=300&auto=format&fit=crop'),
('Infantil Colorido', 'Papel colorido com estampas de bichinhos e laço colorido.', 6.90, 'https://images.unsplash.com/photo-1628149811808-3606992d4f20?q=80&w=300&auto=format&fit=crop');
