
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pfpbaepzvgovqheeqxlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcGJhZXB6dmdvdnFoZWVxeGxnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgxMDg0MywiZXhwIjoyMDgzMzg2ODQzfQ.Uc4d12ubAnZ-JdNlC-gsL3P0sUsNqKd3j93I0mmCi8g'
);

async function listAllSellers() {
  console.log('--- Listando Todos os Vendedores ---');

  try {
    const { data: sellers } = await supabase
      .from('sellers')
      .select('id, store_name, status, user_id, profile:profiles(email, full_name)');

    console.log(JSON.stringify(sellers, null, 2));

    const { data: apps } = await supabase
      .from('seller_applications')
      .select('id, store_name, status, user_id');
    
    console.log('--- Aplicações Pendentes/Totais ---');
    console.log(JSON.stringify(apps, null, 2));

  } catch (error) {
    console.error('Erro:', error.message);
  }
}

listAllSellers();
