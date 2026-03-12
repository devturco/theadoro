
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://pfpbaepzvgovqheeqxlg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcGJhZXB6dmdvdnFoZWVxeGxnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgxMDg0MywiZXhwIjoyMDgzMzg2ODQzfQ.Uc4d12ubAnZ-JdNlC-gsL3P0sUsNqKd3j93I0mmCi8g";

const supabase = createClient(supabaseUrl, supabaseKey);

async function finalRepair() {
  console.log('🚀 Executando reparo DEFINITIVO...');

  const sql = `
    -- 1. Se a tabela min_purchase existe, renomeia para o padrão do código
    DO $$ 
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'min_purchase') THEN
            ALTER TABLE public.coupons RENAME COLUMN min_purchase TO min_purchase_value;
        END IF;
    END $$;

    -- 2. Garante todas as colunas que o SELECT do frontend está pedindo
    ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS seller_id UUID;
    ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS code TEXT;
    ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS discount_type TEXT;
    ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10,2);
    ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS min_purchase_value DECIMAL(10,2) DEFAULT 0;
    ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS max_discount_value DECIMAL(10,2);
    ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS usage_limit INTEGER;
    ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS used_count INTEGER DEFAULT 0;
    ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ DEFAULT now();
    ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
    ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
    ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

    -- 3. Força o recarregamento do cache alterando algo estrutural
    ALTER TABLE public.coupons SET (autovacuum_enabled = true);
    
    -- 4. Notifica o PostgREST
    NOTIFY pgrst, 'reload schema';
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { query: sql });
    if (error) {
      console.error('❌ Erro:', error.message);
    } else {
      console.log('✅ Reparo concluído. Cache notificado.');
    }
  } catch (error) {
    console.error('❌ Erro fatal:', error);
  }
}

finalRepair();
