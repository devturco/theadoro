
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pfpbaepzvgovqheeqxlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcGJhZXB6dmdvdnFoZWVxeGxnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgxMDg0MywiZXhwIjoyMDgzMzg2ODQzfQ.Uc4d12ubAnZ-JdNlC-gsL3P0sUsNqKd3j93I0mmCi8g'
);

async function inspectUnidunite() {
  console.log('--- Inspecionando Loja UNIDUNITE ---');

  try {
    // 1. Buscar na tabela de aplicações
    const { data: appData } = await supabase
      .from('seller_applications')
      .select('*')
      .ilike('store_name', '%UNIDUNITE%');

    console.log('Aplicação:', appData && appData.length > 0 ? appData : 'Não encontrada em seller_applications');

    // 2. Buscar na tabela de vendedores
    const { data: sellerData } = await supabase
      .from('sellers')
      .select('*, profile:profiles(full_name, email)')
      .ilike('store_name', '%UNIDUNITE%');

    console.log('Vendedor/Loja:', JSON.stringify(sellerData, null, 2) || 'Não encontrado na tabela sellers');

    if (sellerData && sellerData.length > 0) {
      const userId = sellerData[0].user_id;
      
      // 3. Ver assinaturas
      const { data: subData } = await supabase
        .from('seller_subscriptions')
        .select('*')
        .eq('user_id', userId);
      
      console.log('Assinaturas:', subData && subData.length > 0 ? subData : 'Nenhuma assinatura encontrada');

      // 4. Ver papéis reais
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId);
      
      console.log('Papéis (user_roles):', rolesData && rolesData.length > 0 ? rolesData : 'Nenhum registro em user_roles');
    }
  } catch (error) {
    console.error('Erro durante a inspeção:', error.message);
  }
}

inspectUnidunite();
