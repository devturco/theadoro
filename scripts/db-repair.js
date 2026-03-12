
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://pfpbaepzvgovqheeqxlg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcGJhZXB6dmdvdnFoZWVxeGxnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgxMDg0MywiZXhwIjoyMDgzMzg2ODQzfQ.Uc4d12ubAnZ-JdNlC-gsL3P0sUsNqKd3j93I0mmCi8g";

const supabase = createClient(supabaseUrl, supabaseKey);

async function repair() {
  console.log('🚀 Executando manutenção autônoma passo-a-passo...');

  const steps = [
    // 1. Base Function
    `CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SECURITY DEFINER;`,
    
    // 2. Profile security flag
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;`,
    
    // 3. Coupons Structure
    `CREATE TABLE IF NOT EXISTS public.coupons (id UUID PRIMARY KEY DEFAULT gen_random_uuid());`,
    `ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;`,
    `ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS code TEXT;`,
    `ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS discount_type TEXT;`,
    `ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10,2);`,
    `ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;`,
    `ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;`,
    `ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS used_count INTEGER DEFAULT 0;`,
    `ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();`,
    
    // 4. Coupons Constraints & RLS
    `ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;`,
    `DROP POLICY IF EXISTS "Coupons are viewable by everyone" ON public.coupons;`,
    `CREATE POLICY "Coupons are viewable by everyone" ON public.coupons FOR SELECT USING (is_active = true);`,
    `DROP POLICY IF EXISTS "Sellers manage own coupons" ON public.coupons;`,
    `CREATE POLICY "Sellers manage own coupons" ON public.coupons FOR ALL USING (auth.uid() = seller_id);`,
    
    // 5. Triggers
    `DROP TRIGGER IF EXISTS update_coupons_updated_at ON public.coupons;`,
    `CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();`
  ];

  for (let i = 0; i < steps.length; i++) {
    const { error } = await supabase.rpc('exec_sql', { query: steps[i] });
    if (error) {
      console.warn(`⚠️ Aviso no passo ${i + 1}: ${error.message}`);
    } else {
      console.log(`✅ Passo ${i + 1}/${steps.length} concluído.`);
    }
  }

  console.log('🏁 Processo finalizado!');
}

repair();
