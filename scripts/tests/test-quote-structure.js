/**
 * Teste da API de budget com quote real
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuoteStructure() {
  console.log('🔍 Testando estrutura do quote...');

  try {
    const quoteId = '40f61fb3-0676-458c-9131-3a5b0af9887d'; // Quote que sabemos que existe

    const { data: quote, error } = await supabase
      .from('quotes')
      .select(
        `
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
      `
      )
      .eq('id', quoteId)
      .single();

    if (error) {
      console.error('❌ Erro:', error);
      return;
    }

    console.log('✅ Quote estrutura:');
    console.log(JSON.stringify(quote, null, 2));

    console.log('\n📊 Análise da estrutura:');
    console.log(`- ID: ${quote.id}`);
    console.log(`- Service Order ID: ${quote.service_order_id}`);
    console.log(`- Service Orders tipo: ${typeof quote.service_orders}`);
    console.log(`- Service Orders é array: ${Array.isArray(quote.service_orders)}`);

    if (quote.service_orders) {
      console.log(`- Service Orders conteúdo:`, quote.service_orders);

      if (quote.service_orders.vehicles) {
        console.log(`- Vehicles:`, quote.service_orders.vehicles);
      }
    }
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

testQuoteStructure();
