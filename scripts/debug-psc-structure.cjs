#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugPSCStructure() {
  console.log('\n🔍 === ESTRUTURA DE PARTNERS_SERVICE_CATEGORIES ===\n');

  // 1. Buscar alguns registros
  const { data: pscRecords, error } = await supabase
    .from('partners_service_categories')
    .select('*')
    .limit(5);

  if (error) {
    console.log('❌ Erro:', error);
    return;
  }

  console.log(`📦 TOTAL DE REGISTROS (amostra): ${pscRecords?.length || 0}\n`);

  if (pscRecords && pscRecords.length > 0) {
    console.log('📋 ESTRUTURA:');
    console.log('Colunas:', Object.keys(pscRecords[0]).join(', '));
    console.log();

    console.log('📄 EXEMPLOS:\n');
    pscRecords.forEach((record, index) => {
      console.log(`${index + 1}. Partner ID: ${record.partner_id}`);
      console.log(`   Category ID: ${record.category_id}`);
      console.log();
    });
  }

  // 2. Tentar fazer a query que está falhando
  console.log('🔍 TESTANDO QUERY PROBLEMÁTICA:\n');

  const { data: testQuery, error: queryError } = await supabase
    .from('partners_service_categories')
    .select(`
      partner_id,
      partners!inner(profile_id)
    `)
    .eq('category_id', 'f88070f4-cd17-40f0-9780-552ca64e086c'); // mechanics

  console.log('Resultado da query com inner join:');
  console.log('  Data:', testQuery);
  console.log('  Error:', queryError);
  console.log();

  // 3. Testar query alternativa sem join
  const { data: noJoin, error: noJoinError } = await supabase
    .from('partners_service_categories')
    .select('partner_id, category_id')
    .eq('category_id', 'f88070f4-cd17-40f0-9780-552ca64e086c');

  console.log('Resultado da query SEM join:');
  console.log('  Data:', noJoin);
  console.log('  Error:', noJoinError);
  console.log();

  // 4. Verificar se partner_id em PSC corresponde a profile_id em partners
  if (noJoin && noJoin.length > 0) {
    const partnerId = noJoin[0].partner_id;
    
    console.log(`🔍 Verificando se partner_id ${partnerId} existe em partners:\n`);

    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('profile_id, company_name')
      .eq('profile_id', partnerId)
      .single();

    console.log('  Parceiro encontrado:', partner);
    console.log('  Error:', partnerError);
  }

  console.log('\n================================================================================\n');
}

debugPSCStructure().catch(console.error);
