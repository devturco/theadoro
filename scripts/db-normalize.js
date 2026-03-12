
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://pfpbaepzvgovqheeqxlg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcGJhZXB6dmdvdnFoZWVxeGxnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgxMDg0MywiZXhwIjoyMDgzMzg2ODQzfQ.Uc4d12ubAnZ-JdNlC-gsL3P0sUsNqKd3j93I0mmCi8g";

const supabase = createClient(supabaseUrl, supabaseKey);

async function normalize() {
  console.log('🚀 Normalizando estrutura da tabela public.coupons...');

  const sql = `
    DO $$ 
    BEGIN
        -- Check for min_purchase and rename to min_purchase_value if found
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'min_purchase') THEN
            ALTER TABLE public.coupons RENAME COLUMN min_purchase TO min_purchase_value;
        END IF;

        -- Ensure the column exists with the correct name if it wasn't there at all
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'min_purchase_value') THEN
            ALTER TABLE public.coupons ADD COLUMN min_purchase_value DECIMAL(10,2) DEFAULT 0;
        END IF;
    END $$;
    
    -- Force cache refresh by touching the table
    COMMENT ON TABLE public.coupons IS 'Vouchers management table';
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { query: sql });

    if (error) {
      console.error('❌ Erro na normalização:', error.message);
    } else {
      console.log('✅ Tabela coupons normalizada com min_purchase_value!');
    }
  } catch (error) {
    console.error('❌ Erro fatal:', error);
  }
}

normalize();
