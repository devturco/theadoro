-- Create subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb, -- Array of strings describing features
  limits JSONB DEFAULT '{}'::jsonb, -- Object defining limits e.g. {"products": 15}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS for plans (public read)
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read plans"
  ON public.subscription_plans FOR SELECT
  TO public
  USING (is_active = true);


-- Create seller subscriptions table
CREATE TYPE public.subscription_status AS ENUM ('active', 'past_due', 'canceled', 'trialing');

CREATE TABLE public.seller_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.profiles(id),
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status public.subscription_status DEFAULT 'active',
  current_period_start TIMESTAMPTZ DEFAULT now(),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS for subscriptions
ALTER TABLE public.seller_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers view own subscription"
  ON public.seller_subscriptions FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

CREATE POLICY "Admins manage subscriptions"
  ON public.seller_subscriptions FOR ALL
  TO authenticated
  USING ((SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1) = 'admin');


-- Add chosen_plan_id to seller_applications
ALTER TABLE public.seller_applications
ADD COLUMN chosen_plan_id UUID REFERENCES public.subscription_plans(id);


-- Seed initial plans
INSERT INTO public.subscription_plans (name, description, price, features, limits)
VALUES 
(
  'Start', 
  'Para quem está começando a vender online.', 
  29.90, 
  '["Até 15 produtos ativos", "Taxa de venda: 12%", "Painel de vendas básico", "Suporte por e-mail"]',
  '{"products": 15}'
),
(
  'Scale', 
  'Ideal para lojas em crescimento.', 
  79.90, 
  '["Até 100 produtos ativos", "Taxa de venda: 9%", "Relatórios de desempenho", "Embalagens personalizadas", "Suporte via Chat"]',
  '{"products": 100}'
),
(
  'TheAdoro Pro', 
  'Poder máximo com Inteligência Artificial.', 
  149.90, 
  '["Produtos Ilimitados", "Taxa de venda: 6%", "IA para descrições e títulos", "Destaque na Home e Busca", "Gerente de conta dedicado"]',
  '{"products": -1}' -- -1 for unlimited
);
