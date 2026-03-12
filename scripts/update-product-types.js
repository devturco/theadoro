
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://pfpbaepzvgovqheeqxlg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcGJhZXB6dmdvdnFoZWVxeGxnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgxMDg0MywiZXhwIjoyMDgzMzg2ODQzfQ.Uc4d12ubAnZ-JdNlC-gsL3P0sUsNqKd3j93I0mmCi8g";

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateEnum() {
  console.log('🚀 Atualizando tipos de produto no banco de dados...');

  const sql = `
    -- Adiciona 'digital' ao enum product_type se não existir
    DO $$ 
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'product_type' AND e.enumlabel = 'digital') THEN
            ALTER TYPE public.product_type ADD VALUE 'digital';
        END IF;
    END $$;
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { query: sql });
    if (error) console.error('❌ Erro:', error.message);
    else console.log('✅ Tipo "digital" adicionado com sucesso!');
  } catch (e) {
    console.error('❌ Erro fatal:', e);
  }
}

updateEnum();
