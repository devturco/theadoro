
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://pfpbaepzvgovqheeqxlg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcGJhZXB6dmdvdnFoZWVxeGxnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgxMDg0MywiZXhwIjoyMDgzMzg2ODQzfQ.Uc4d12ubAnZ-JdNlC-gsL3P0sUsNqKd3j93I0mmCi8g";

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTable() {
  console.log('🔍 Inspecionando colunas da tabela public.coupons...');

  // Criando uma função temporária para ler o schema e retornar como JSON
  const helperSql = `
    CREATE OR REPLACE FUNCTION public.get_table_columns(t_name text)
    RETURNS json AS $$
    DECLARE
        cols json;
    BEGIN
        SELECT json_agg(column_name) INTO cols
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = t_name;
        RETURN cols;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;

  try {
    await supabase.rpc('exec_sql', { query: helperSql });
    const { data, error } = await supabase.rpc('get_table_columns', { t_name: 'coupons' });

    if (error) {
      console.error('❌ Erro ao ler colunas:', error.message);
    } else {
      console.log('✅ Colunas encontradas:', data);
    }
  } catch (error) {
    console.error('❌ Erro fatal:', error);
  }
}

inspectTable();
