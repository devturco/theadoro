
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://pfpbaepzvgovqheeqxlg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcGJhZXB6dmdvdnFoZWVxeGxnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgxMDg0MywiZXhwIjoyMDgzMzg2ODQzfQ.Uc4d12ubAnZ-JdNlC-gsL3P0sUsNqKd3j93I0mmCi8g";

const supabase = createClient(supabaseUrl, supabaseKey);

async function refreshCache() {
  console.log('⏳ Recarregando o cache do esquema do Supabase...');

  try {
    // NOTA: Para recarregar o cache via PostgREST, basta emitir um comando de NOTIFY ou apenas esperar.
    // Mas a forma mais garantida via RPC é rodar um comando trivial que force o re-check.
    const { error } = await supabase.rpc('exec_sql', { 
        query: `NOTIFY pgrst, 'reload schema';` 
    });

    if (error) {
      console.error('❌ Erro ao recarregar cache:', error.message);
    } else {
      console.log('✅ Cache recarregado! Tente criar o cupom novamente em alguns segundos.');
    }
  } catch (error) {
    console.error('❌ Erro fatal:', error);
  }
}

refreshCache();
