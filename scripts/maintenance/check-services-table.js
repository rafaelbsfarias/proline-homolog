import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkServicesTableStructure() {
  console.log('🔍 VERIFICANDO ESTRUTURA DA TABELA SERVICES...');

  try {
    // Tentar uma query que retorna erro para ver a estrutura
    const { error } = await supabase.from('services').select('*');

    if (error) {
      console.log('📋 Detalhes do erro (útil para entender estrutura):');
      console.log('   Código:', error.code);
      console.log('   Mensagem:', error.message);
      console.log('   Detalhes:', error.details);
    }

    // Verificar se há alguma estrutura através de uma query diferente
    console.log('\n🔧 Tentando descobrir estrutura através de metadados...');

    // Query para ver se conseguimos informações sobre a tabela
    const { data: tableInfo, error: tableError } = await supabase.rpc('get_table_info', {
      table_name: 'services',
    });

    if (!tableError && tableInfo) {
      console.log('✅ Informações da tabela obtidas:');
      console.log(tableInfo);
    } else {
      console.log('❌ Não foi possível obter metadados da tabela');
    }
  } catch (err) {
    console.log('❌ Erro geral:', err.message);
  }
}

checkServicesTableStructure();
