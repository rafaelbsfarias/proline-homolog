#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Simular exatamente o que o endpoint faz
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function testExactQuery() {
  console.log('\n🔍 === TESTANDO QUERY EXATA DO ENDPOINT ===\n');

  // Simular o fluxo completo
  const category = 'mechanics';
  console.log(`1️⃣ Categoria a processar: ${category}\n`);

  // Buscar service category (como o endpoint faz)
  console.log('2️⃣ Buscando service_category por key...');
  const { data: serviceCategory, error: catError } = await adminClient
    .from('service_categories')
    .select('id')
    .eq('key', category)
    .single();

  if (catError) {
    console.log('   ❌ Erro:', catError);
    return;
  }

  console.log(`   ✓ Encontrada: ${serviceCategory.id}\n`);

  // Buscar parceiros (como o endpoint faz)
  console.log('3️⃣ Buscando parceiros...');
  console.log(`   Query: .eq('category_id', '${serviceCategory.id}')`);

  const { data: partners, error: partnersError } = await adminClient
    .from('partners_service_categories')
    .select(`
      partner_id,
      partners!inner(profile_id)
    `)
    .eq('category_id', serviceCategory.id);

  console.log('   Resultado:');
  console.log('     Data:', JSON.stringify(partners, null, 2));
  console.log('     Error:', partnersError);
  console.log('     Count:', partners?.length);
  console.log();

  if (partners && partners.length > 0) {
    console.log('4️⃣ ✅ QUERY FUNCIONOU!');
    console.log(`   ${partners.length} parceiro(s) encontrado(s)`);
    
    partners.forEach((p, i) => {
      const profileId = Array.isArray(p.partners)
        ? p.partners[0]?.profile_id
        : p.partners?.profile_id;
      
      console.log(`   ${i + 1}. Partner ID: ${p.partner_id}`);
      console.log(`      Profile ID: ${profileId}`);
    });
  } else {
    console.log('4️⃣ ❌ QUERY RETORNOU 0 RESULTADOS');
    console.log('   Isso é o problema que está acontecendo no endpoint!');
  }

  // Tentar query alternativa sem join
  console.log('\n5️⃣ Tentando query SEM o join...');
  const { data: partnersNoJoin, error: noJoinError } = await adminClient
    .from('partners_service_categories')
    .select('partner_id, category_id')
    .eq('category_id', serviceCategory.id);

  console.log('   Resultado sem join:');
  console.log('     Count:', partnersNoJoin?.length);
  console.log('     Error:', noJoinError);

  if (partnersNoJoin && partnersNoJoin.length > 0) {
    console.log('   ✓ Query SEM join funciona!');
    console.log('   → O problema está no INNER JOIN com a tabela partners');
  }

  console.log('\n================================================================================\n');
}

testExactQuery().catch(console.error);
