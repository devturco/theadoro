
const { createClient } = require('@supabase/supabase-js');

// Configuração direta com Service Role para bypass de RLS
const supabase = createClient(
  'https://pfpbaepzvgovqheeqxlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcGJhZXB6dmdvdnFoZWVxeGxnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgxMDg0MywiZXhwIjoyMDgzMzg2ODQzfQ.Uc4d12ubAnZ-JdNlC-gsL3P0sUsNqKd3j93I0mmCi8g'
);

async function runMigration() {
  console.log('🚀 Iniciando execução manual da migração via Service Role...');

  try {
    // 1. Regularizar UNIDUNITE
    const email = 'unidunite.cuiaba@gmail.com';
    console.log(`--- Processando loja para: ${email} ---`);
    
    const { data: profile, error: pError } = await supabase
      .from('profiles')
      .select('id, full_name, phone')
      .eq('email', email)
      .single();

    if (pError || !profile) {
      console.error('❌ Perfil não encontrado para o e-mail informado.');
    } else {
      console.log('✅ Perfil localizado. Verificando aplicação...');
      
      const { data: app } = await supabase
        .from('seller_applications')
        .select('id')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (app) {
        console.log('ℹ️ Aplicação já existe. Atualizando status para approved...');
        const { error: uError } = await supabase
          .from('seller_applications')
          .update({ 
            status: 'approved', 
            store_name: 'UNIDUNITE - Kids & Teens',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', profile.id);
        
        if (uError) console.error('❌ Erro ao atualizar aplicação:', uError.message);
        else console.log('✅ Aplicação atualizada com sucesso.');
      } else {
        console.log('ℹ️ Criando nova aplicação aprovada...');
        const { error: iError } = await supabase
          .from('seller_applications')
          .insert({
            user_id: profile.id,
            store_name: 'UNIDUNITE - Kids & Teens',
            status: 'approved',
            type: 'pf',
            full_name: profile.full_name,
            phone: profile.phone || '0000000000',
            address: 'Endereço não informado',
            address_number: '0',
            neighborhood: 'Bairro não informado',
            city: 'Cuiabá',
            state: 'MT',
            postal_code: '00000-000',
            cpf: '000.000.000-00',
            accepted_terms: true
          });
        
        if (iError) console.error('❌ Erro ao inserir aplicação:', iError.message);
        else console.log('✅ Nova aplicação criada.');
      }
    }

    // 2. Promover Sócias a Admin
    const partnerEmails = [
      'lilianfabiana@hotmail.com', 
      'ttattizanetti@gmail.com', 
      'hipnose.modas@hotmail.com', 
      'unidunite.cuiaba@gmail.com'
    ];

    console.log('--- Promovendo Sócias a Admin ---');
    for (const pEmail of partnerEmails) {
      const { data: p, error: fError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', pEmail)
        .maybeSingle();

      if (p) {
        // Update profile
        await supabase.from('profiles').update({ role: 'admin' }).eq('id', p.id);
        // Upsert user_role
        await supabase.from('user_roles').upsert({ user_id: p.id, role: 'admin' }, { onConflict: 'user_id,role' });
        console.log(`✅ Usuária ${pEmail} promovida a ADMIN MASTER.`);
      } else {
        console.log(`⚠️ Usuária ${pEmail} não encontrada no banco.`);
      }
    }

    console.log('🏁 Execução concluída.');

  } catch (error) {
    console.error('💥 Erro fatal durante a execução:', error.message);
  }
}

runMigration();
