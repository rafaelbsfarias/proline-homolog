#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugInspectionServices() {
  console.log('\n🔍 === VERIFICANDO INSPECTION_SERVICES ===\n');

  // Pegar uma das inspeções que não geraram quotes
  const inspectionId = '60283b9e-9406-47d5-ac04-d62e008c25d7';

  console.log(`📋 Inspeção ID: ${inspectionId}\n`);

  const { data: services, error } = await supabase
    .from('inspection_services')
    .select('*')
    .eq('inspection_id', inspectionId);

  if (error) {
    console.log('❌ Erro:', error);
    return;
  }

  console.log(`📦 SERVIÇOS MARCADOS: ${services?.length || 0}\n`);

  if (services && services.length > 0) {
    console.log('📋 ESTRUTURA:');
    console.log('Colunas:', Object.keys(services[0]).join(', '));
    console.log();

    console.log('📄 SERVIÇOS:\n');
    
    for (const [index, service] of services.entries()) {
      console.log(`${index + 1}. Serviço:`);
      console.log(`   Inspection ID: ${service.inspection_id}`);
      console.log(`   Category: ${service.category || 'SEM CATEGORY'}`);
      console.log(`   Service Type: ${service.service_type || 'SEM SERVICE_TYPE'}`);
      console.log(`   Required: ${service.required ? 'SIM' : 'NÃO'}`);
      console.log();

      // Tentar buscar categoria com esse valor
      if (service.category || service.service_type) {
        const key = service.category || service.service_type;
        console.log(`   🔍 Buscando categoria com key="${key}"...`);
        
        const { data: cat, error: catError } = await supabase
          .from('service_categories')
          .select('id, name')
          .eq('key', key)
          .maybeSingle();

        if (cat) {
          console.log(`      ✓ Encontrada: ${cat.name}`);
        } else {
          console.log(`      ⚠️  NÃO ENCONTRADA!`);
          if (catError) console.log(`      Error:`, catError);
        }
        console.log();
      }
    }
  }

  console.log('\n================================================================================\n');
}

debugInspectionServices().catch(console.error);
