
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pfpbaepzvgovqheeqxlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcGJhZXB6dmdvdnFoZWVxeGxnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgxMDg0MywiZXhwIjoyMDgzMzg2ODQzfQ.Uc4d12ubAnZ-JdNlC-gsL3P0sUsNqKd3j93I0mmCi8g'
);

async function checkProductsCols() {
  console.log('--- Verificando Colunas de products ---');
  try {
    const { data, error } = await supabase.from('products').select('*').limit(1);
    if (error) throw error;
    if (data && data.length > 0) {
      console.log('Colunas reais em products:', Object.keys(data[0]));
    }
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

checkProductsCols();
