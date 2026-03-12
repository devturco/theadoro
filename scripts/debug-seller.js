
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://pfpbaepzvgovqheeqxlg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcGJhZXB6dmdvdnFoZWVxeGxnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgxMDg0MywiZXhwIjoyMDgzMzg2ODQzfQ.Uc4d12ubAnZ-JdNlC-gsL3P0sUsNqKd3j93I0mmCi8g";

const supabase = createClient(supabaseUrl, supabaseKey);

async function directDebug() {
  const email = 'projettando@gmail.com';
  console.log(`🔍 Diagnóstico Direto para: ${email}`);

  // Como o RPC exec_sql é void, vou criar uma função que insere o resultado numa tabela temporária ou log
  // Ou melhor, vou apenas usar o Supabase SDK normal agora que tenho a service_role!
  
  try {
    const { data: profile } = await supabase.from('profiles').select('*').eq('email', email).single();
    if (!profile) {
        console.error('❌ Perfil não encontrado');
        return;
    }

    const { data: application } = await supabase.from('seller_applications').select('*').eq('user_id', profile.id).maybeSingle();
    const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', profile.id);

    console.log('📊 RESULTADO:');
    console.log({
        profile_id: profile.id,
        profile_role: profile.role,
        is_approved: profile.is_approved,
        application_status: application?.status,
        db_roles: roles?.map(r => r.role)
    });

  } catch (e) {
    console.error('❌ Erro fatal:', e);
  }
}

directDebug();
