#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkQuotesData() {
  console.log('🔍 Verificando dados de orçamentos...\n');

  // 1. Total de quotes
  const { data: allQuotes, error: allError } = await supabase
    .from('quotes')
    .select('id, status, total_value');

  if (allError) {
    console.error('❌ Erro ao buscar quotes:', allError);
    return;
  }

  console.log(`📊 Total de orçamentos: ${allQuotes?.length || 0}\n`);

  // 2. Quotes por status
  const statusCounts = {};
  allQuotes?.forEach(q => {
    statusCounts[q.status] = (statusCounts[q.status] || 0) + 1;
  });

  console.log('📈 Orçamentos por status:');
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`   ${status}: ${count}`);
  });
  console.log('');

  // 3. Quotes com valores (não-zero)
  const quotesWithValue = allQuotes?.filter(q => q.total_value && q.total_value > 0);
  console.log(`💰 Orçamentos com valor (> 0): ${quotesWithValue?.length || 0}`);
  
  if (quotesWithValue && quotesWithValue.length > 0) {
    const totalValue = quotesWithValue.reduce((sum, q) => sum + (q.total_value || 0), 0);
    console.log(`   Valor total: R$ ${totalValue.toFixed(2)}\n`);
    
    console.log('📋 Primeiros 5 orçamentos com valor:');
    quotesWithValue.slice(0, 5).forEach(q => {
      console.log(`   - ID: ${q.id.substring(0, 8)}... | Status: ${q.status} | Valor: R$ ${q.total_value}`);
    });
  }
  console.log('');

  // 4. Quotes com service_order_id
  const { data: quotesWithSO, error: soError } = await supabase
    .from('quotes')
    .select('id, status, total_value, service_order_id, service_orders ( vehicle_id, vehicles ( plate, brand, model ) )')
    .not('service_order_id', 'is', null)
    .limit(5);

  if (!soError && quotesWithSO && quotesWithSO.length > 0) {
    console.log('🚗 Orçamentos vinculados a veículos (primeiros 5):');
    quotesWithSO.forEach(q => {
      const so = Array.isArray(q.service_orders) ? q.service_orders[0] : q.service_orders;
      const vehicle = Array.isArray(so?.vehicles) ? so.vehicles[0] : so?.vehicles;
      const plate = vehicle?.plate || 'N/A';
      const brand = vehicle?.brand || 'N/A';
      const model = vehicle?.model || 'N/A';
      console.log(`   - ${plate} (${brand} ${model}) | Status: ${q.status} | Valor: R$ ${q.total_value || 0}`);
    });
  } else {
    console.log('⚠️  Nenhum orçamento vinculado a veículos encontrado');
  }
  console.log('');

  // 5. Status disponíveis no sistema
  console.log('📌 Status únicos encontrados:');
  const uniqueStatuses = [...new Set(allQuotes?.map(q => q.status) || [])];
  uniqueStatuses.forEach(status => {
    console.log(`   - ${status}`);
  });
}

checkQuotesData().catch(console.error);
