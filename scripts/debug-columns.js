
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://pfpbaepzvgovqheeqxlg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcGJhZXB6dmdvdnFoZWVxeGxnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgxMDg0MywiZXhwIjoyMDgzMzg2ODQzfQ.Uc4d12ubAnZ-JdNlC-gsL3P0sUsNqKd3j93I0mmCi8g";

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugColumns() {
  console.log('🔍 Listando colunas REAIS da tabela public.coupons...');

  const sql = `
    CREATE OR REPLACE FUNCTION public.get_coupons_columns()
    RETURNS TABLE(col text) AS $$
    BEGIN
        RETURN QUERY SELECT column_name::text FROM information_schema.columns 
        WHERE table_name = 'coupons' AND table_schema = 'public';
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;

  try {
    await supabase.rpc('exec_sql', { query: sql });
    const { data, error } = await supabase.rpc('get_coupons_columns');

    if (error) {
      console.error('❌ Erro:', error.message);
    } else {
      console.log('✅ Colunas encontradas no banco:', data.map(d => d.col).join(', '));
    }
  } catch (error) {
    console.error('❌ Erro fatal:', error);
  }
}

debugColumns();
