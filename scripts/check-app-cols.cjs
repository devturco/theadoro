
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pfpbaepzvgovqheeqxlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcGJhZXB6dmdvdnFoZWVxeGxnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgxMDg0MywiZXhwIjoyMDgzMzg2ODQzfQ.Uc4d12ubAnZ-JdNlC-gsL3P0sUsNqKd3j93I0mmCi8g'
);

async function inspectTable() {
  const table = 'seller_applications';
  console.log(`--- Inspecionando colunas de ${table} ---`);
  try {
    // Pegar um registro para ver as chaves
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) throw error;
    if (data && data.length > 0) {
      console.log('Colunas encontradas:', Object.keys(data[0]));
    } else {
      console.log('Tabela vazia ou sem registros para inferir colunas.');
    }
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

inspectTable();
