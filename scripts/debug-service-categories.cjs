#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugServiceCategories() {
  console.log('\n🔍 === VERIFICANDO SERVICE_CATEGORIES ===\n');

  const { data: categories, error } = await supabase
    .from('service_categories')
    .select('*');

  if (error) {
    console.log('❌ Erro:', error);
    return;
  }

  console.log(`📦 TOTAL DE CATEGORIAS: ${categories?.length || 0}\n`);

  if (categories && categories.length > 0) {
    console.log('📋 ESTRUTURA:');
    console.log('Colunas:', Object.keys(categories[0]).join(', '));
    console.log();

    console.log('📄 CATEGORIAS:\n');
    categories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name || 'Sem nome'}`);
      console.log(`   ID: ${cat.id}`);
      console.log(`   Key: ${cat.key || 'SEM KEY'}`);
      console.log(`   Type: ${cat.type || 'SEM TYPE'}`);
      console.log();
    });
  }

  // Testar busca por key
  console.log('\n🔍 TESTANDO BUSCA POR KEY:\n');

  const testKeys = ['mechanics', 'body_paint', 'washing', 'tires', 'patio_atacado'];

  for (const key of testKeys) {
    const { data: result, error: searchError } = await supabase
      .from('service_categories')
      .select('id, name, key')
      .eq('key', key)
      .maybeSingle();

    console.log(`Key "${key}":`);
    if (searchError) {
      console.log('  ❌ Erro:', searchError.message);
    } else if (result) {
      console.log(`  ✓ Encontrada: ${result.name} (ID: ${result.id})`);
    } else {
      console.log('  ⚠️  Não encontrada');
    }
  }

  console.log('\n================================================================================\n');
}

debugServiceCategories().catch(console.error);
