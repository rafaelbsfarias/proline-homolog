require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const quoteId = '9c95b7de-d3a1-42d2-aaca-783b04319870';
const partnerId = '5d0ae206-675d-45cf-b71f-75aa15c13989';

async function testServiceOrderAPI() {
  console.log('\n🔍 Testando API de Ordem de Serviço\n');
  console.log('Quote ID:', quoteId);
  console.log('Partner ID:', partnerId);

  // 1. Verificar o quote
  console.log('\n1️⃣ Verificando Quote...');
  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .select('id, status, partner_id, service_order_id, created_at')
    .eq('id', quoteId)
    .single();

  if (quoteError) {
    console.error('❌ Erro ao buscar quote:', quoteError);
    return;
  }

  console.log('✅ Quote encontrado:', JSON.stringify(quote, null, 2));

  // 2. Verificar se pertence ao parceiro
  console.log('\n2️⃣ Verificando propriedade...');
  if (quote.partner_id !== partnerId) {
    console.error('❌ Quote não pertence ao parceiro!');
    console.log('   Quote partner_id:', quote.partner_id);
    console.log('   Expected partner_id:', partnerId);
    return;
  }
  console.log('✅ Quote pertence ao parceiro');

  // 3. Verificar status
  console.log('\n3️⃣ Verificando status...');
  console.log('   Status atual:', quote.status);
  if (quote.status !== 'approved') {
    console.error('❌ Quote não está aprovado!');
    return;
  }
  console.log('✅ Quote está aprovado');

  // 4. Verificar service_order
  console.log('\n4️⃣ Verificando Service Order...');
  if (!quote.service_order_id) {
    console.error('❌ Quote não tem service_order_id!');
    return;
  }

  const { data: serviceOrder, error: soError } = await supabase
    .from('service_orders')
    .select('id, vehicle_id, client_id, created_at')
    .eq('id', quote.service_order_id)
    .single();

  if (soError) {
    console.error('❌ Erro ao buscar service_order:', soError);
    return;
  }

  console.log('✅ Service Order encontrado:', JSON.stringify(serviceOrder, null, 2));

  // 5. Verificar veículo
  console.log('\n5️⃣ Verificando Veículo...');
  const { data: vehicle, error: vehicleError } = await supabase
    .from('vehicles')
    .select('plate, brand, model, year, color, current_odometer')
    .eq('id', serviceOrder.vehicle_id)
    .single();

  if (vehicleError) {
    console.error('❌ Erro ao buscar veículo:', vehicleError);
    return;
  }

  console.log('✅ Veículo encontrado:', JSON.stringify(vehicle, null, 2));

  // 6. Verificar cliente
  console.log('\n6️⃣ Verificando Cliente...');
  const { data: client, error: clientError } = await supabase
    .from('profiles')
    .select('full_name, phone, email')
    .eq('id', serviceOrder.client_id)
    .single();

  if (clientError) {
    console.error('❌ Erro ao buscar cliente:', clientError);
  } else {
    console.log('✅ Cliente encontrado:', JSON.stringify(client, null, 2));
  }

  // 7. Verificar parceiro
  console.log('\n7️⃣ Verificando Parceiro...');
  const { data: partner, error: partnerError } = await supabase
    .from('partners')
    .select('company_name, profile_id, profiles!inner(full_name, phone)')
    .eq('profile_id', partnerId)
    .single();

  if (partnerError) {
    console.error('❌ Erro ao buscar parceiro:', partnerError);
  } else {
    console.log('✅ Parceiro encontrado:', JSON.stringify(partner, null, 2));
  }

  // 8. Verificar itens do orçamento
  console.log('\n8️⃣ Verificando Itens do Orçamento...');
  const { data: items, error: itemsError } = await supabase
    .from('quote_items')
    .select('id, description, quantity')
    .eq('quote_id', quoteId)
    .order('description', { ascending: true });

  if (itemsError) {
    console.error('❌ Erro ao buscar itens:', itemsError);
  } else {
    console.log(`✅ ${items.length} itens encontrados`);
    items.forEach((item, i) => {
      console.log(`   ${i + 1}. ${item.description} (Qtd: ${item.quantity})`);
    });
  }

  // 9. Verificar estimated_days na tabela services
  console.log('\n9️⃣ Verificando Estimated Days...');
  const { data: serviceData, error: serviceError } = await supabase
    .from('services')
    .select('estimated_days')
    .eq('quote_id', quoteId)
    .limit(1)
    .maybeSingle();

  if (serviceError) {
    console.error('❌ Erro ao buscar service:', serviceError);
  } else if (!serviceData) {
    console.log('⚠️  Nenhum service encontrado para este quote');
  } else {
    console.log('✅ Estimated days:', serviceData.estimated_days || 0);
  }

  // 10. Testar query simplificada da API
  console.log('\n🔟 Testando Query Simplificada da API...');
  // 10. Testar query simplificada da API
  console.log('\n🔟 Testando Query Simplificada da API...');
  const { data: fullQuery, error: fullError } = await supabase
    .from('quotes')
    .select('id, status, created_at, partner_id, service_order_id')
    .eq('id', quoteId)
    .eq('partner_id', partnerId)
    .eq('status', 'approved')
    .single();

  if (fullError) {
    console.error('❌ Erro na query completa:', fullError);
    console.error('   Código:', fullError.code);
    console.error('   Detalhes:', fullError.details);
    console.error('   Hint:', fullError.hint);
    console.error('   Mensagem:', fullError.message);
  } else {
    console.log('✅ Query completa funcionou!');
    console.log('   Dados:', JSON.stringify(fullQuery, null, 2));
  }

  console.log('\n✅ Teste concluído!\n');
}

testServiceOrderAPI().catch(console.error);
