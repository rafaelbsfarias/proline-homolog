/**
 * Script para verificar o quote específico
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkQuote() {
  console.log('🔍 Verificando quote f5bb300a-a2c2-4c1c-bcba-b47e4b7d7b77...');

  try {
    // Buscar o quote
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', 'f5bb300a-a2c2-4c1c-bcba-b47e4b7d7b77')
      .single();

    if (quoteError) {
      console.error('❌ Erro ao buscar quote:', quoteError);

      // Tentar buscar qualquer quote para ver a estrutura
      const { data: anyQuote, error: anyError } = await supabase
        .from('quotes')
        .select('*')
        .limit(1);

      if (!anyError && anyQuote && anyQuote.length > 0) {
        console.log('📋 Estrutura de um quote exemplo:');
        console.log(anyQuote[0]);
      }
      return;
    }

    console.log('✅ Quote encontrado:');
    console.log(quote);

    // Buscar o service_order relacionado
    if (quote.service_order_id) {
      console.log('\n🔗 Buscando service_order relacionado...');

      const { data: serviceOrder, error: soError } = await supabase
        .from('service_orders')
        .select(
          `
          *,
          vehicles (*)
        `
        )
        .eq('id', quote.service_order_id)
        .single();

      if (soError) {
        console.error('❌ Erro ao buscar service_order:', soError);
      } else {
        console.log('✅ Service Order encontrado:');
        console.log({
          id: serviceOrder.id,
          vehicle_id: serviceOrder.vehicle_id,
          status: serviceOrder.status,
          order_code: serviceOrder.order_code,
          vehicle: serviceOrder.vehicles,
        });
      }
    }
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

checkQuote();
