
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://pfpbaepzvgovqheeqxlg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcGJhZXB6dmdvdnFoZWVxeGxnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgxMDg0MywiZXhwIjoyMDgzMzg2ODQzfQ.Uc4d12ubAnZ-JdNlC-gsL3P0sUsNqKd3j93I0mmCi8g";

const supabase = createClient(supabaseUrl, supabaseKey);

async function forceReload() {
  console.log('🔄 Disparando recarregamento de cache agressivo...');

  try {
    // 1. Notifica o PostgREST
    await supabase.rpc('exec_sql', { query: "NOTIFY pgrst, 'reload schema';" });
    
    // 2. Altera a descrição da tabela (isso costuma forçar o re-scan do PostgREST)
    await supabase.rpc('exec_sql', { query: "COMMENT ON TABLE public.coupons IS 'Vouchers table updated at " + new Date().toISOString() + "';" });

    console.log('✅ Sinais de recarregamento enviados. Aguarde 30 segundos e tente novamente.');
    console.log('💡 Dica: Se não funcionar, tente dar um Refresh na aba do navegador do seu projeto (Dashboard do Supabase).');
  } catch (error) {
    console.error('❌ Erro fatal:', error);
  }
}

forceReload();
