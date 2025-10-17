#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Partner ID da oficina mecânica criada nos scripts
const MECHANICS_PARTNER_ID = '23dc9b3d-11a0-4cf2-8862-54c6b7fc567e';

async function createTestFinancialData() {
  console.log('\n💰 === CRIANDO DADOS FINANCEIROS DE TESTE ===\n');

  try {
    // 1. Buscar uma service order existente para associar quotes
    console.log('1️⃣ Buscando service order existente...\n');

    let serviceOrder;
    const { data: existingSO, error: soError } = await supabase
      .from('service_orders')
      .select('id, order_number, vehicle_id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!soError && existingSO) {
      serviceOrder = existingSO;
    } else {
      console.log('❌ Nenhuma service order encontrada. Criando uma...\n');

      // Criar uma service order básica
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .limit(1)
        .single();

      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('id')
        .limit(1)
        .single();

      if (!client || !vehicle) {
        console.log('❌ Cliente ou veículo não encontrado. Populando dados básicos...\n');

        // Usar dados dos usuários criados pelos scripts
        const { data: clientData } = await supabase
          .from('clients')
          .select('profile_id')
          .limit(1)
          .single();

        const { data: vehicleData } = await supabase
          .from('vehicles')
          .select('id')
          .limit(1)
          .single();

        if (!clientData || !vehicleData) {
          console.log('❌ Cliente ou veículo não encontrado. Abortando...\n');
          return;
        }

        const clientId = clientData.profile_id;
        const vehicleId = vehicleData.id;

        const { data: newSO, error: createSOError } = await supabase
          .from('service_orders')
          .insert({
            client_id: clientId,
            vehicle_id: vehicleId,
            specialist_id: '115e0d63-3e86-475b-a450-2b26f8deb9b6', // especialista@prolineauto.com.br
            status: 'pending_quote',
            order_code: 'TEST-' + Date.now()
          })
          .select()
          .single();

        if (createSOError) throw createSOError;
        serviceOrder = newSO;
      } else {
        const { data: newSO, error: createSOError } = await supabase
          .from('service_orders')
          .insert({
            client_id: client.id,
            vehicle_id: vehicle.id,
            specialist_id: '115e0d63-3e86-475b-a450-2b26f8deb9b6', // especialista@prolineauto.com.br
            status: 'pending_quote',
            order_code: 'TEST-' + Date.now()
          })
          .select()
          .single();

        if (createSOError) throw createSOError;
        serviceOrder = newSO;
      }
    }

    console.log('✅ Service Order:', serviceOrder.id);

    // 2. Criar quotes com diferentes status
    console.log('\n2️⃣ Criando quotes com diferentes status...\n');

    const quotesData = [
      { status: 'confirmed', total_value: 850.00, created_at: '2025-09-15T10:00:00Z' },
      { status: 'confirmed', total_value: 1200.00, created_at: '2025-09-20T14:30:00Z' },
      { status: 'pending_approval', total_value: 650.00, created_at: '2025-10-10T09:15:00Z' },
      { status: 'in_execution', total_value: 950.00, created_at: '2025-10-12T16:45:00Z' },
    ];

    const createdQuotes = [];

    for (const quoteInfo of quotesData) {
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          service_order_id: serviceOrder.id,
          partner_id: MECHANICS_PARTNER_ID,
          status: quoteInfo.status,
          total_value: quoteInfo.total_value,
          notes: `Quote de teste - ${quoteInfo.status}`,
          created_at: quoteInfo.created_at
        })
        .select()
        .single();

      if (quoteError) {
        console.log('❌ Erro criando quote:', quoteError);
        continue;
      }

      console.log(`✅ Quote criada: ${quote.id} - Status: ${quote.status} - Valor: R$ ${quote.total_value}`);
      createdQuotes.push(quote);
    }

    // 3. Adicionar itens aos quotes (serviços)
    console.log('\n3️⃣ Adicionando serviços aos quotes...\n');

    // Buscar serviços da categoria mechanics
    const { data: services } = await supabase
      .from('partner_services')
      .select('id, name, price')
      .eq('partner_id', MECHANICS_PARTNER_ID)
      .limit(5);

    for (const quote of createdQuotes) {
      const numServices = Math.floor(Math.random() * 3) + 1; // 1-3 serviços por quote
      const selectedServices = services.slice(0, numServices);

      for (const service of selectedServices) {
        const { error: itemError } = await supabase
          .from('quote_items')
          .insert({
            quote_id: quote.id,
            service_id: service.id,
            quantity: 1,
            unit_price: service.price,
            total_price: service.price,
            type: 'service'
          });

        if (itemError) {
          console.log('❌ Erro adicionando serviço:', itemError);
        } else {
          console.log(`   ➕ Serviço: ${service.name} - R$ ${service.price}`);
        }
      }
    }

    // 4. Criar solicitações de peças para alguns quotes
    console.log('\n4️⃣ Criando solicitações de peças...\n');

    const partsData = [
      { name: 'Filtro de óleo', price: 45.00, quantity: 1 },
      { name: 'Pastilhas de freio', price: 120.00, quantity: 1 },
      { name: 'Velas de ignição', price: 85.00, quantity: 4 },
      { name: 'Bateria 60Ah', price: 280.00, quantity: 1 },
    ];

    // Pegar apenas quotes confirmed e in_execution para ter peças
    const quotesWithParts = createdQuotes.filter(q => ['confirmed', 'in_execution'].includes(q.status));

    for (const quote of quotesWithParts) {
      const numParts = Math.floor(Math.random() * 2) + 1; // 1-2 peças por quote
      const selectedParts = partsData.slice(0, numParts);

      for (const part of selectedParts) {
        const { data: partRequest, error: partError } = await supabase
          .from('part_requests')
          .insert({
            quote_id: quote.id,
            part_name: part.name,
            quantity: part.quantity,
            estimated_price: part.price,
            status: 'approved',
            notes: 'Peça solicitada para reparo'
          })
          .select()
          .single();

        if (partError) {
          console.log('❌ Erro criando solicitação de peça:', partError);
        } else {
          console.log(`   🔧 Peça: ${part.name} x${part.quantity} - R$ ${part.price * part.quantity}`);
        }
      }
    }

    console.log('\n🎉 Dados financeiros de teste criados com sucesso!\n');

    // 5. Verificar o resultado final
    console.log('5️⃣ Verificando dados criados...\n');

    const { data: finalQuotes } = await supabase
      .from('quotes')
      .select(`
        id,
        status,
        total_value,
        created_at,
        quote_items(count),
        part_requests(count)
      `)
      .eq('partner_id', MECHANICS_PARTNER_ID);

    console.log('📊 Resumo dos quotes criados:');
    finalQuotes.forEach((q, i) => {
      console.log(`   ${i + 1}. Status: ${q.status} | Valor: R$ ${q.total_value} | Serviços: ${q.quote_items?.[0]?.count || 0} | Peças: ${q.part_requests?.[0]?.count || 0}`);
    });

    console.log('\n✅ Processo concluído! Agora você pode testar a API de resumo financeiro.\n');

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

createTestFinancialData();