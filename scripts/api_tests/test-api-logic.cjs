const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function testAPILogic() {
  console.log('🔍 === TESTE DA LÓGICA DA API ===');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const budgetId = '57306036-9de7-4676-a6fa-1a1f0fee298d';
  const partnerId = '5713fa01-3475-4c52-ad64-5230285adef1';

  try {
    console.log('📡 Executando consulta complexa como na API...');
    
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select(`
        id,
        total_value,
        status,
        created_at,
        updated_at,
        supplier_delivery_date,
        service_order_id,
        service_orders (
          id,
          order_code,
          vehicle_id,
          vehicles (
            id,
            plate,
            brand,
            model,
            year,
            color
          )
        )
      `)
      .eq('id', budgetId)
      .eq('partner_id', partnerId)
      .single();

    if (quoteError) {
      console.error('❌ Erro na consulta do quote:', quoteError);
      console.log('  Code:', quoteError.code);
      console.log('  Message:', quoteError.message);
      console.log('  Details:', quoteError.details);
      console.log('  Hint:', quoteError.hint);
      return;
    }

    console.log('✅ Quote encontrado! Estrutura dos dados:');
    console.log('  ID:', quote.id);
    console.log('  Status:', quote.status);
    console.log('  Total Value:', quote.total_value);
    console.log('  Service Orders Type:', typeof quote.service_orders);
    console.log('  Service Orders:', JSON.stringify(quote.service_orders, null, 2));

    // Extrair dados como na API
    const serviceOrder = quote.service_orders;
    const vehicle = serviceOrder?.vehicles;

    console.log('\n📋 Dados extraídos:');
    console.log('  Service Order ID:', serviceOrder?.id);
    console.log('  Vehicle ID:', vehicle?.id);
    console.log('  Vehicle Plate:', vehicle?.plate);
    console.log('  Vehicle Brand:', vehicle?.brand);
    console.log('  Vehicle Model:', vehicle?.model);
    console.log('  Vehicle Year:', vehicle?.year);

    // Buscar quote_items
    console.log('\n🔍 Buscando quote_items...');
    const { data: quoteItems, error: itemsError } = await supabase
      .from('quote_items')
      .select(`
        id,
        service_id,
        quantity,
        unit_price,
        total_price,
        notes,
        created_at
      `)
      .eq('quote_id', budgetId)
      .order('created_at', { ascending: true });

    if (itemsError) {
      console.error('❌ Erro ao buscar quote_items:', itemsError);
    } else {
      console.log('✅ Quote items encontrados:', quoteItems?.length || 0);
      if (quoteItems && quoteItems.length > 0) {
        console.log('📄 Quote items:', JSON.stringify(quoteItems, null, 2));
      }
    }

    // Simular formatação da resposta da API
    const budgetItems = (quoteItems || []).map(item => ({
      id: item.id,
      serviceId: item.service_id,
      description: item.notes || `Serviço ${item.service_id.slice(0, 8)}`,
      quantity: item.quantity,
      unitPrice: parseFloat(item.unit_price.toString()),
      totalPrice: parseFloat(item.total_price.toString()),
    }));

    const response = {
      id: quote.id,
      name: `Orçamento ${serviceOrder?.order_code || quote.id.slice(0, 8)}`,
      vehiclePlate: vehicle?.plate || '',
      vehicleModel: vehicle?.model || null,
      vehicleBrand: vehicle?.brand || null,
      vehicleYear: vehicle?.year || null,
      totalValue: quote.total_value ? parseFloat(quote.total_value.toString()) : 0,
      status: quote.status || 'draft',
      createdAt: quote.created_at,
      updatedAt: quote.updated_at,
      items: budgetItems,
    };

    console.log('\n✅ Resposta formatada:');
    console.log(JSON.stringify(response, null, 2));

  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }

  console.log('🔍 === FIM DO TESTE ===');
}

testAPILogic();
