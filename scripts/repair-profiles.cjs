
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pfpbaepzvgovqheeqxlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcGJhZXB6dmdvdnFoZWVxeGxnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgxMDg0MywiZXhwIjoyMDgzMzg2ODQzfQ.Uc4d12ubAnZ-JdNlC-gsL3P0sUsNqKd3j93I0mmCi8g'
);

async function repairProfilesTable() {
  console.log('🚀 Iniciando reparo da tabela profiles...');

  try {
    // Como não posso rodar ALTER TABLE direto via JS (sem RPC), 
    // vou tentar atualizar o serviço de usuários para usar 'verified' como substituto de 'status' 
    // OU se houver um RPC de execução de SQL, eu usaria.
    
    // Verificando se existe RPC para SQL (comum em projetos Supabase customizados)
    const { error: sqlError } = await supabase.rpc('exec_sql', { 
      sql_query: "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';" 
    });

    if (sqlError) {
      console.log('⚠️ RPC exec_sql não disponível. Vou ajustar o frontend para usar as colunas existentes.');
      return false;
    } else {
      console.log('✅ Coluna status adicionada com sucesso via RPC.');
      return true;
    }
  } catch (error) {
    console.error('Erro no reparo:', error.message);
    return false;
  }
}

repairProfilesTable().then(success => {
    if (!success) {
        console.log('Procedendo com ajuste técnico no código...');
    }
});
