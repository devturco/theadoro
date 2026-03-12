
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://pfpbaepzvgovqheeqxlg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcGJhZXB6dmdvdnFoZWVxeGxnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgxMDg0MywiZXhwIjoyMDgzMzg2ODQzfQ.Uc4d12ubAnZ-JdNlC-gsL3P0sUsNqKd3j93I0mmCi8g";

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  const sql = `
    SELECT 
        column_name, 
        data_type 
    FROM 
        information_schema.columns 
    WHERE 
        table_name = 'coupons' 
        AND table_schema = 'public';
  `;

  const { data, error } = await supabase.rpc('exec_sql_query', { query_text: sql });
  // If exec_sql_query doesn't exist, I'll try another way to get results.
  // Since I have service_role, I can just use a temporary function that returns JSON.
  
  const helperSql = `
    CREATE OR REPLACE FUNCTION public.get_table_info()
    RETURNS json AS $$
    BEGIN
        RETURN (SELECT json_agg(row_to_json(c)) FROM (
            SELECT column_name, data_type FROM information_schema.columns 
            WHERE table_name = 'coupons' AND table_schema = 'public'
        ) c);
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;

  try {
    await supabase.rpc('exec_sql', { query: helperSql });
    const { data: cols, error: err } = await supabase.rpc('get_table_info');
    
    if (err) {
      console.error('❌ Erro ao inspecionar:', err.message);
    } else {
      console.log('📊 Estrutura REAL da tabela coupons:');
      console.table(cols);
    }
  } catch (e) {
    console.error('❌ Erro fatal:', e);
  }
}

inspect();
