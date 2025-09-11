import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function exploreServicesStructure() {
  console.log('🔍 Explorando estrutura de serviços...\n');

  // Verificar tabelas relacionadas a serviços
  const tables = ['services', 'partner_services', 'service_items', 'inspection_services'];

  for (const table of tables) {
    try {
      const { data, count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(1);

      if (!error) {
        console.log(`📋 Tabela: ${table}`);
        console.log(`   Registros: ${count}`);
        if (data && data.length > 0) {
          console.log(`   Colunas: ${Object.keys(data[0]).join(', ')}`);
          console.log(`   Exemplo: ${JSON.stringify(data[0], null, 2)}\n`);
        } else {
          console.log('   (Tabela vazia)\n');
        }
      } else {
        console.log(`❌ Erro na tabela ${table}: ${error.message}\n`);
      }
    } catch (e) {
      console.log(`❌ Tabela ${table} não encontrada\n`);
    }
  }

  // Verificar estrutura de inspection_services especificamente
  console.log('🔍 Detalhes da tabela inspection_services:');
  try {
    const { data: inspectionServices } = await supabase
      .from('inspection_services')
      .select('*')
      .limit(5);

    if (inspectionServices && inspectionServices.length > 0) {
      console.log('Exemplos de inspection_services:');
      inspectionServices.forEach((service, index) => {
        console.log(`  ${index + 1}. ${JSON.stringify(service, null, 2)}`);
      });
    }
  } catch (e) {
    console.log('Erro ao consultar inspection_services');
  }
}

exploreServicesStructure();
