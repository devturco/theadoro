
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pfpbaepzvgovqheeqxlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcGJhZXB6dmdvdnFoZWVxeGxnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgxMDg0MywiZXhwIjoyMDgzMzg2ODQzfQ.Uc4d12ubAnZ-JdNlC-gsL3P0sUsNqKd3j93I0mmCi8g'
);

async function listTables() {
  console.log('--- Listando Tabelas do Banco ---');
  try {
    // RPC para listar tabelas não existe por padrão, vamos tentar queries comuns
    const { data, error } = await supabase.rpc('get_table_names'); // Tentativa se existir RPC custom
    
    if (error) {
        console.warn('RPC get_table_names não existe. Tentando query direta.');
        // No JS do Supabase não dá pra rodar SQL direto sem RPC.
        // Vamos tentar inferir testando tabelas comuns.
        const tables = ['sellers', 'stores', 'profiles', 'seller_applications', 'seller_subscriptions'];
        for (const t of tables) {
            const { count, error: tErr } = await supabase.from(t).select('*', { count: 'exact', head: true });
            console.log(`Tabela ${t}: ${tErr ? 'ERRO (' + tErr.message + ')' : count + ' registros'}`);
        }
    } else {
        console.log(data);
    }
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

listTables();
