#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Criar cliente COM RLS (como a API usa)
const supabaseWithRLS = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Criar cliente SEM RLS (service role)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testApiQuery() {
  console.log('\n🔍 === TESTANDO QUERY DA API ===\n');

  const vehicleId = '263f0599-4407-41a4-bae0-9628bee36eef';
  const clientId = '34e3e94e-4d39-40c6-bcb7-9e2b5543fa84';

  // Teste 1: Query exata que a API faz (COM RLS)
  console.log('1️⃣ TESTANDO COM RLS (como a API faz):\n');

  // Simular auth do cliente
  const { data: { session }, error: authError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: 'cliente@prolineauto.com.br'
  });

  console.log('   Query: SELECT id, client_id FROM vehicles WHERE id = ... AND client_id = ...');
  
  const { data: vehicleWithRLS, error: vehicleErrorRLS } = await supabaseWithRLS
    .from('vehicles')
    .select('id, client_id')
    .eq('id', vehicleId)
    .eq('client_id', clientId)
    .single();

  console.log('   Resultado:', vehicleWithRLS ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
  console.log('   Erro:', vehicleErrorRLS);
  console.log();

  // Teste 2: Query sem RLS (service role)
  console.log('2️⃣ TESTANDO SEM RLS (service role):\n');

  const { data: vehicleAdmin, error: vehicleErrorAdmin } = await supabaseAdmin
    .from('vehicles')
    .select('id, client_id')
    .eq('id', vehicleId)
    .eq('client_id', clientId)
    .single();

  console.log('   Resultado:', vehicleAdmin ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
  console.log('   Erro:', vehicleErrorAdmin);
  console.log('   Data:', vehicleAdmin);
  console.log();

  // Teste 3: Verificar RLS policies da tabela vehicles
  console.log('3️⃣ VERIFICANDO RLS POLICIES:\n');

  const { data: policies } = await supabaseAdmin
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'vehicles');

  if (policies && policies.length > 0) {
    console.log(`   Total de policies: ${policies.length}`);
    policies.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.policyname} - ${p.cmd}`);
    });
  } else {
    console.log('   Nenhuma policy encontrada ou erro ao buscar');
  }

  console.log('\n================================================================================\n');
}

testApiQuery().catch(console.error);
