#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function simulateQuoteCreation() {
  console.log('\n🔍 === SIMULANDO CRIAÇÃO DE QUOTES ===\n');

  // Pegar a categoria mechanics
  const mechanicsCategoryId = 'f88070f4-cd17-40f0-9780-552ca64e086c';

  console.log('1️⃣ Buscando parceiros para categoria mechanics...\n');

  const { data: partners, error } = await supabase
    .from('partners_service_categories')
    .select(`
      partner_id,
      partners!inner(profile_id)
    `)
    .eq('category_id', mechanicsCategoryId);

  console.log('Resultado da query:');
  console.log('  Data:', JSON.stringify(partners, null, 2));
  console.log('  Error:', error);
  console.log('  Count:', partners?.length);
  console.log();

  if (partners && partners.length > 0) {
    console.log('2️⃣ Processando partners...\n');
    
    partners.forEach((partnerRelation, index) => {
      console.log(`Partner ${index + 1}:`);
      console.log('  partner_id:', partnerRelation.partner_id);
      console.log('  partners:', partnerRelation.partners);
      
      const profileId = Array.isArray(partnerRelation.partners)
        ? partnerRelation.partners[0]?.profile_id
        : partnerRelation.partners?.profile_id;
      
      console.log('  → profile_id extraído:', profileId);
      console.log();
    });

    console.log('3️⃣ Verificando se existe uma service order recente...\n');

    const { data: recentSO } = await supabase
      .from('service_orders')
      .select('id, order_number, service_category_id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (recentSO) {
      console.log('Service Order encontrada:');
      console.log('  ID:', recentSO.id);
      console.log('  Number:', recentSO.order_number);
      console.log('  Category:', recentSO.service_category_id);
      console.log();

      // Verificar se já existe quote para essa SO
      const { data: existingQuotes } = await supabase
        .from('quotes')
        .select('id, partner_id, status')
        .eq('service_order_id', recentSO.id);

      console.log('4️⃣ Quotes existentes para esta SO:', existingQuotes?.length || 0);
      if (existingQuotes && existingQuotes.length > 0) {
        existingQuotes.forEach((q, i) => {
          console.log(`  Quote ${i + 1}: partner=${q.partner_id}, status=${q.status}`);
        });
      }
      console.log();
    }
  }

  console.log('\n================================================================================\n');
}

simulateQuoteCreation().catch(console.error);
