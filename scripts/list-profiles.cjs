
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pfpbaepzvgovqheeqxlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcGJhZXB6dmdvdnFoZWVxeGxnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgxMDg0MywiZXhwIjoyMDgzMzg2ODQzfQ.Uc4d12ubAnZ-JdNlC-gsL3P0sUsNqKd3j93I0mmCi8g'
);

async function listProfiles() {
  console.log('--- Listando Todos os Perfis ---');
  try {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, role');
    console.log(JSON.stringify(profiles, null, 2));
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

listProfiles();
