
-- Campaigns Table (Managed by Admin)
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    discount_percentage INTEGER NOT NULL DEFAULT 0,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    banner_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Campaign Participants (Sellers who joined)
CREATE TABLE IF NOT EXISTS public.campaign_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(campaign_id, seller_id)
);

-- RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaigns are viewable by all" ON public.campaigns FOR SELECT USING (true);
CREATE POLICY "Sellers can manage participation" ON public.campaign_participants FOR ALL USING (auth.uid() = seller_id);

-- Insert a sample campaign for testing
INSERT INTO public.campaigns (title, description, discount_percentage, starts_at, ends_at)
VALUES ('Semana das Mães 2026', 'Participe da nossa maior campanha do ano e aumente suas vendas!', 15, now(), now() + INTERVAL '30 days')
ON CONFLICT DO NOTHING;
