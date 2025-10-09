#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fullDebug() {
  console.log('\n🔍 === DEBUG COMPLETO DO FLUXO ===\n');

  const inspectionId = '60283b9e-9406-47d5-ac04-d62e008c25d7';

  // 1. Pegar os serviços da inspeção
  const { data: services } = await supabase
    .from('inspection_services')
    .select('category')
    .eq('inspection_id', inspectionId)
    .eq('required', true);

  console.log('1️⃣ SERVIÇOS NECESSÁRIOS:');
  console.log('   Categorias:', services?.map(s => s.category).join(', '));
  console.log();

  // 2. Pegar as service orders
  const { data: serviceOrders } = await supabase
    .from('service_orders')
    .select('id, order_code, category_id, service_categories(key, name)')
    .eq('source_inspection_id', inspectionId);

  console.log('2️⃣ SERVICE ORDERS CRIADAS:', serviceOrders?.length || 0);
  serviceOrders?.forEach((so, i) => {
    console.log(`   ${i + 1}. ${so.order_code}`);
    console.log(`      ID: ${so.id}`);
    console.log(`      Category: ${so.service_categories?.name} (${so.service_categories?.key})`);
  });
  console.log();

  // 3. Para cada service order, buscar quotes
  console.log('3️⃣ QUOTES POR SERVICE ORDER:\n');

  for (const so of serviceOrders || []) {
    const { data: quotes } = await supabase
      .from('quotes')
      .select('id, partner_id, status')
      .eq('service_order_id', so.id);

    console.log(`   SO: ${so.order_code}`);
    console.log(`   Categoria: ${so.service_categories?.key}`);
    console.log(`   Quotes: ${quotes?.length || 0}`);

    if (quotes && quotes.length > 0) {
      quotes.forEach(q => {
        console.log(`      - Partner: ${q.partner_id}, Status: ${q.status}`);
      });
    } else {
      // Verificar quantos parceiros deveriam ter recebido
      const { data: partners } = await supabase
        .from('partners_service_categories')
        .select('partner_id, partners!inner(profile_id, company_name)')
        .eq('category_id', so.category_id);

      console.log(`      ⚠️  DEVERIA TER ${partners?.length || 0} QUOTES!`);
      if (partners && partners.length > 0) {
        partners.forEach(p => {
          const companyName = Array.isArray(p.partners) 
            ? p.partners[0]?.company_name 
            : p.partners?.company_name;
          console.log(`         - ${companyName || 'Sem nome'} (${p.partner_id})`);
        });
      }
    }
    console.log();
  }

  console.log('\n================================================================================\n');
}

fullDebug().catch(console.error);
