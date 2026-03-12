
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://pfpbaepzvgovqheeqxlg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcGJhZXB6dmdvdnFoZWVxeGxnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgxMDg0MywiZXhwIjoyMDgzMzg2ODQzfQ.Uc4d12ubAnZ-JdNlC-gsL3P0sUsNqKd3j93I0mmCi8g";

const supabase = createClient(supabaseUrl, supabaseKey);

async function sync() {
  console.log('🔄 Sincronizando status de aprovação de vendedores...');

  const sql = `
    -- Sincroniza is_approved = true para quem já tem a aplicação aprovada
    UPDATE public.profiles p
    SET is_approved = true,
        role = 'seller'
    FROM public.seller_applications a
    WHERE p.id = a.user_id 
    AND a.status = 'approved';

    -- Garante que todos que são 'seller' tenham a role na tabela user_roles também
    INSERT INTO public.user_roles (user_id, role)
    SELECT id, 'seller' FROM public.profiles WHERE role = 'seller'
    ON CONFLICT (user_id, role) DO NOTHING;
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { query: sql });
    if (error) {
      console.error('❌ Erro na sincronização:', error.message);
    } else {
      console.log('✅ Todos os vendedores aprovados foram sincronizados com sucesso!');
    }
  } catch (e) {
    console.error('❌ Erro fatal:', e);
  }
}

sync();
