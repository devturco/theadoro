
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = "https://pfpbaepzvgovqheeqxlg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcGJhZXB6dmdvdnFoZWVxeGxnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgxMDg0MywiZXhwIjoyMDgzMzg2ODQzfQ.Uc4d12ubAnZ-JdNlC-gsL3P0sUsNqKd3j93I0mmCi8g";
const supabase = createClient(supabaseUrl, supabaseKey);

async function findPendingSellers() {
  console.log('🔍 Buscando lojistas pendentes...');
  const { data, error } = await supabase
    .from('seller_applications')
    .select('store_name, user:profiles(email)')
    .eq('status', 'pending')
    .limit(5);

  if (error) {
    console.error('❌ Erro:', error.message);
  } else {
    console.log('📋 Lojistas para Teste:', data);
  }
}
findPendingSellers();
