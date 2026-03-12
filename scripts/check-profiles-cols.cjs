
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pfpbaepzvgovqheeqxlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcGJhZXB6dmdvdnFoZWVxeGxnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgxMDg0MywiZXhwIjoyMDgzMzg2ODQzfQ.Uc4d12ubAnZ-JdNlC-gsL3P0sUsNqKd3j93I0mmCi8g'
);

async function checkProfilesColumns() {
  console.log('--- Verificando Colunas da Tabela profiles ---');
  try {
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    if (error) throw error;
    if (data && data.length > 0) {
      console.log('Colunas reais em profiles:', Object.keys(data[0]));
    } else {
      console.log('Tabela profiles vazia.');
    }
  } catch (error) {
    console.error('Erro ao inspecionar profiles:', error.message);
  }
}

checkProfilesColumns();
