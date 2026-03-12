
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = "https://pfpbaepzvgovqheeqxlg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcGJhZXB6dmdvdnFoZWVxeGxnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgxMDg0MywiZXhwIjoyMDgzMzg2ODQzfQ.Uc4d12ubAnZ-JdNlC-gsL3P0sUsNqKd3j93I0mmCi8g";
const supabase = createClient(supabaseUrl, supabaseKey);

async function reset() {
  const email = 'projettando@gmail.com';
  const { data: profile } = await supabase.from('profiles').select('id').eq('email', email).single();
  
  if (profile) {
    // 1. Volta status para pending
    await supabase.from('seller_applications').update({ status: 'pending' }).eq('user_id', profile.id);
    // 2. Remove is_approved e role do perfil para simular novo usuário
    await supabase.from('profiles').update({ is_approved: false, role: 'buyer' }).eq('id', profile.id);
    // 3. Remove role da tabela user_roles
    await supabase.from('user_roles').delete().eq('user_id', profile.id).eq('role', 'seller');
    
    console.log(`✅ Vendedor ${email} resetado para PENDENTE para teste.`);
  }
}
reset();
