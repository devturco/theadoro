
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pfpbaepzvgovqheeqxlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcGJhZXB6dmdvdnFoZWVxeGxnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgxMDg0MywiZXhwIjoyMDgzMzg2ODQzfQ.Uc4d12ubAnZ-JdNlC-gsL3P0sUsNqKd3j93I0mmCi8g'
);

async function checkConstraints() {
  console.log('--- Verificando Restrições de Unicidade ---');
  try {
    // No Supabase JS não conseguimos ver constraints diretamente, mas podemos tentar um INSERT para ver o erro ou deduzir
    // Vou usar uma query para ver se existem duplicatas de user_id, o que indicaria falta de unique constraint
    const { data, error } = await supabase.from('seller_applications').select('user_id');
    if (error) throw error;
    
    const userIds = data.map(d => d.user_id);
    const uniqueUserIds = new Set(userIds);
    console.log(`Total de registros: ${userIds.length}, IDs únicos: ${uniqueUserIds.size}`);
    
    if (userIds.length !== uniqueUserIds.size) {
      console.log('⚠️ A coluna user_id NÃO possui restrição de unicidade (existem duplicatas ou é permitido).');
    } else {
      console.log('ℹ️ user_id parece ser único nos dados atuais, mas o Postgres exige uma CONSTRAINT formal para ON CONFLICT.');
    }
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

checkConstraints();
