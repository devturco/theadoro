
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://pfpbaepzvgovqheeqxlg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcGJhZXB6dmdvdnFoZWVxeGxnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgxMDg0MywiZXhwIjoyMDgzMzg2ODQzfQ.Uc4d12ubAnZ-JdNlC-gsL3P0sUsNqKd3j93I0mmCi8g";

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('🔍 Buscando nomes de colunas da tabela coupons...');

  const sql = `
    CREATE OR REPLACE FUNCTION public.list_cols()
    RETURNS text AS $$
    SELECT string_agg(column_name, ', ')
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'coupons';
    $$ LANGUAGE sql SECURITY DEFINER;
  `;

  try {
    await supabase.rpc('exec_sql', { query: sql });
    const { data, error } = await supabase.rpc('list_cols');

    if (error) {
      console.error('❌ Erro:', error.message);
    } else {
      console.log('✅ Colunas reais encontradas:', data);
    }
  } catch (e) {
    console.error('❌ Erro fatal:', e);
  }
}

check();
