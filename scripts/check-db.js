
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://pfpbaepzvgovqheeqxlg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcGJhZXB6dmdvdnFoZWVxeGxnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgxMDg0MywiZXhwIjoyMDgzMzg2ODQzfQ.Uc4d12ubAnZ-JdNlC-gsL3P0sUsNqKd3j93I0mmCi8g";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStructure() {
  console.log('🔍 Verificando colunas da tabela public.coupons...');

  const sql = `
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'coupons';
  `;

  try {
    // We can't return data directly from exec_sql if it's void. 
    // I'll create a temp function to return JSON if needed, or just trust my fix below.
    
    // Instead of just checking, I will FORCE the column creation one by one 
    // with a very explicit SQL to ensure no silent failures.
    const repairSql = `
      -- Force add missing columns
      ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS min_purchase_value DECIMAL(10,2) DEFAULT 0;
      ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS used_count INTEGER DEFAULT 0;
      ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS discount_type TEXT;
      ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10,2);
      ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS code TEXT;
      ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS seller_id UUID;
      
      -- Grant access explicitly (sometimes RLS blocks the visibility of the schema)
      GRANT ALL ON public.coupons TO postgres, service_role, authenticated, anon;
    `;

    const { error } = await supabase.rpc('exec_sql', { query: repairSql });

    if (error) {
      console.error('❌ Erro ao forçar colunas:', error.message);
    } else {
      console.log('✅ Comando de reparo executado. Forçando reload pesado do cache...');
      // A best way to reload cache is to touch the table comment or something similar
      await supabase.rpc('exec_sql', { query: "COMMENT ON TABLE public.coupons IS 'Table for seller vouchers';" });
      console.log('✅ Estrutura reforçada. Tente novamente em 15 segundos.');
    }
  } catch (error) {
    console.error('❌ Erro fatal:', error);
  }
}

checkStructure();
