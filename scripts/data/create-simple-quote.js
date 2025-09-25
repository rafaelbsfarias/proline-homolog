const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const partnerId = '9408a9f6-5f63-44e0-a879-c1c6a5dd072c';

async function createQuoteForPartner() {
  try {
    // Usar veículo existente
    const { data: vehicles, error: vError } = await supabase
      .from('vehicles')
      .select('id, plate, brand, model, year')
      .limit(1);

    if (vError || !vehicles || vehicles.length === 0) {
      console.log('❌ Erro ou nenhum veículo:', vError);
      return;
    }

    const vehicle = vehicles[0];
    console.log('✅ Usando veículo:', vehicle);

    // Usar service order existente
    const { data: serviceOrders, error: soError } = await supabase
      .from('service_orders')
      .select('id')
      .eq('vehicle_id', vehicle.id)
      .limit(1);

    if (soError || !serviceOrders || serviceOrders.length === 0) {
      console.log('❌ Erro ou nenhum service order:', soError);
      return;
    }

    const serviceOrder = serviceOrders[0];
    console.log('✅ Usando service order:', serviceOrder.id);

    // Criar quote para o partner
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        service_order_id: serviceOrder.id,
        partner_id: partnerId,
        total_value: 1500.0,
        status: 'pending_admin_approval',
      })
      .select()
      .single();

    if (quoteError) {
      console.log('❌ Erro ao criar quote:', quoteError);
    } else {
      console.log('🎉 Quote criado com sucesso:', quote.id);
      console.log('🎯 Use este ID para testar:', quote.id);
    }
  } catch (error) {
    console.log('💥 Erro geral:', error);
  }
}

createQuoteForPartner();
