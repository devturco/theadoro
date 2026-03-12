
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://pfpbaepzvgovqheeqxlg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcGJhZXB6dmdvdnFoZWVxeGxnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgxMDg0MywiZXhwIjoyMDgzMzg2ODQzfQ.Uc4d12ubAnZ-JdNlC-gsL3P0sUsNqKd3j93I0mmCi8g";

const supabase = createClient(supabaseUrl, supabaseKey);

async function setup() {
  const sql = `
    CREATE TABLE IF NOT EXISTS public.campaigns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        discount_percentage INTEGER NOT NULL DEFAULT 0,
        starts_at TIMESTAMPTZ NOT NULL,
        ends_at TIMESTAMPTZ NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS public.campaign_participants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
        seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        joined_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(campaign_id, seller_id)
    );

    ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.campaign_participants ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Campaigns are viewable by all" ON public.campaigns;
    CREATE POLICY "Campaigns are viewable by all" ON public.campaigns FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Sellers can manage participation" ON public.campaign_participants;
    CREATE POLICY "Sellers can manage participation" ON public.campaign_participants FOR ALL USING (auth.uid() = seller_id);

    INSERT INTO public.campaigns (title, description, discount_percentage, starts_at, ends_at)
    VALUES ('Semana das Mães 2026', 'Participe da nossa maior campanha do ano e aumente suas vendas!', 15, now(), now() + INTERVAL '30 days')
    ON CONFLICT DO NOTHING;
  `;

  const { error } = await supabase.rpc('exec_sql', { query: sql });
  if (error) console.error(error.message);
  else console.log('✅ Tabelas de Campanhas criadas!');
}

setup();
