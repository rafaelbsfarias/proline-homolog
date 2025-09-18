const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function testBudgetSaveFlow() {
  console.log('🧪 === TESTE COMPLETO DO FLUXO DE SALVAMENTO ===');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    const partnerId = '86e44b50-3ecd-4d24-bb69-35a83ae09f8a';
    const vehiclePlate = 'ABC561S8';

    // PASSO 1: Verificar se o veículo existe
    console.log('🚗 PASSO 1: Verificando veículo...');
    const { data: existingVehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('plate', vehiclePlate)
      .single();

    if (vehicleError || !existingVehicle) {
      console.error('❌ Veículo não encontrado:', vehicleError);
      return;
    }
    console.log('✅ Veículo encontrado:', {
      id: existingVehicle.id,
      plate: existingVehicle.plate,
      brand: existingVehicle.brand,
      model: existingVehicle.model
    });

    // PASSO 2: Verificar service_order existente
    console.log('\n📋 PASSO 2: Verificando service_order...');
    const { data: existingServiceOrder, error: serviceOrderSearchError } = await supabase
      .from('service_orders')
      .select('*')
      .eq('vehicle_id', existingVehicle.id)
      .eq('status', 'pending_quote')
      .single();

    let serviceOrder;
    if (serviceOrderSearchError || !existingServiceOrder) {
      console.log('ℹ️ Service order não encontrada, criando nova...');
      // Criar nova service_order
      const { data: newServiceOrder, error: serviceOrderError } = await supabase
        .from('service_orders')
        .insert({
          vehicle_id: existingVehicle.id,
          client_id: partnerId,
          status: 'pending_quote',
          order_code: `TEST-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (serviceOrderError) {
        console.error('❌ Erro ao criar service order:', serviceOrderError);
        return;
      }
      serviceOrder = newServiceOrder;
      console.log('✅ Service order criada:', serviceOrder.id);
    } else {
      serviceOrder = existingServiceOrder;
      console.log('✅ Service order existente encontrada:', serviceOrder.id);
    }

    // PASSO 3: Testar criação de quote
    console.log('\n💰 PASSO 3: Testando criação de quote...');
    const quoteData = {
      service_order_id: serviceOrder.id,
      partner_id: partnerId,
      total_value: 150.00,
      status: 'pending_admin_approval',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('📋 Dados da quote:', quoteData);

    const { data: savedQuote, error: quoteError } = await supabase
      .from('quotes')
      .insert(quoteData)
      .select()
      .single();

    if (quoteError) {
      console.error('❌ Erro ao criar quote:', quoteError);
      return;
    }
    console.log('✅ Quote criada com sucesso:', {
      id: savedQuote.id,
      partner_id: savedQuote.partner_id,
      total_value: savedQuote.total_value,
      status: savedQuote.status
    });

    // PASSO 4: Testar criação de quote_items
    console.log('\n📦 PASSO 4: Testando criação de quote_items...');
    
    // Primeiro, vamos buscar um serviço real para usar
    const { data: services, error: servicesError } = await supabase
      .from('partner_services')
      .select('*')
      .eq('partner_id', partnerId)
      .limit(1)
      .single();

    if (servicesError || !services) {
      console.error('❌ Erro ao buscar serviços:', servicesError);
      return;
    }
    console.log('✅ Serviço encontrado para teste:', {
      id: services.id,
      name: services.name,
      price: services.price
    });

    const quoteItemData = {
      quote_id: savedQuote.id,
      service_id: services.id,
      quantity: 1,
      unit_price: services.price,
      total_price: services.price,
      notes: 'Teste de instalação',
      created_at: new Date().toISOString(),
    };

    console.log('📋 Dados do item da quote:', quoteItemData);

    const { data: savedQuoteItem, error: quoteItemError } = await supabase
      .from('quote_items')
      .insert(quoteItemData)
      .select()
      .single();

    if (quoteItemError) {
      console.error('❌ Erro ao criar quote_item:', quoteItemError);
      // Limpar quote criada
      await supabase.from('quotes').delete().eq('id', savedQuote.id);
      return;
    }
    console.log('✅ Quote item criado com sucesso:', {
      id: savedQuoteItem.id,
      quote_id: savedQuoteItem.quote_id,
      service_id: savedQuoteItem.service_id,
      quantity: savedQuoteItem.quantity,
      total_price: savedQuoteItem.total_price
    });

    // PASSO 5: Verificar integridade dos dados
    console.log('\n🔍 PASSO 5: Verificando integridade dos dados...');
    const { data: fullQuote, error: fullQuoteError } = await supabase
      .from('quotes')
      .select(`
        *,
        quote_items (*),
        service_orders (
          *,
          vehicles (*)
        )
      `)
      .eq('id', savedQuote.id)
      .single();

    if (fullQuoteError) {
      console.error('❌ Erro ao verificar dados completos:', fullQuoteError);
    } else {
      console.log('✅ Dados completos verificados:');
      console.log('  Quote ID:', fullQuote.id);
      console.log('  Partner ID:', fullQuote.partner_id);
      console.log('  Status:', fullQuote.status);
      console.log('  Total Value:', fullQuote.total_value);
      console.log('  Items Count:', fullQuote.quote_items?.length || 0);
      console.log('  Vehicle Plate:', fullQuote.service_orders?.vehicles?.plate);
      console.log('  Vehicle Brand:', fullQuote.service_orders?.vehicles?.brand);
      console.log('  Vehicle Model:', fullQuote.service_orders?.vehicles?.model);
    }

    // PASSO 6: Limpeza (remover dados de teste)
    console.log('\n🧹 PASSO 6: Limpando dados de teste...');
    
    // Remover quote_item
    await supabase.from('quote_items').delete().eq('id', savedQuoteItem.id);
    console.log('✅ Quote item removido');
    
    // Remover quote
    await supabase.from('quotes').delete().eq('id', savedQuote.id);
    console.log('✅ Quote removida');
    
    // Se criamos uma nova service_order, remover também
    if (!existingServiceOrder) {
      await supabase.from('service_orders').delete().eq('id', serviceOrder.id);
      console.log('✅ Service order de teste removida');
    }

    console.log('\n🎉 TESTE COMPLETO COM SUCESSO! As tabelas estão preparadas para salvamento.');

  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }

  console.log('🧪 === FIM DO TESTE ===');
}

testBudgetSaveFlow();
