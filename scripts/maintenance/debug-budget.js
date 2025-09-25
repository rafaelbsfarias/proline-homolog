/**
 * Script de debug para verificar dados do orçamento
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugBudget(budgetId) {
  console.log('🔍 Verificando orçamento:', budgetId);

  try {
    // Buscar o orçamento
    const { data: budget, error: budgetError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', budgetId)
      .single();

    if (budgetError) {
      console.error('❌ Erro ao buscar orçamento:', budgetError);
      return;
    }

    console.log('📋 Dados do orçamento:');
    console.log({
      id: budget.id,
      name: budget.name,
      vehicle_plate: budget.vehicle_plate,
      vehicle_model: budget.vehicle_model,
      vehicle_brand: budget.vehicle_brand,
      vehicle_year: budget.vehicle_year,
      total_value: budget.total_value,
      status: budget.status,
      partner_id: budget.partner_id,
      service_request_id: budget.service_request_id,
    });

    // Se existe service_request_id, buscar dados do veículo via quote
    if (budget.service_request_id) {
      console.log('\n🚗 Buscando dados do veículo via service_request...');

      const { data: quote, error: quoteError } = await supabase
        .from('service_requests')
        .select(
          `
          id,
          service_orders (
            vehicles (
              plate,
              brand,
              model,
              year,
              color
            )
          )
        `
        )
        .eq('id', budget.service_request_id)
        .single();

      if (quoteError) {
        console.error('❌ Erro ao buscar quote:', quoteError);
      } else {
        console.log('🚙 Dados do veículo do quote:');
        console.log(quote?.service_orders?.vehicles);
      }
    }

    // Buscar itens do orçamento
    const { data: items, error: itemsError } = await supabase
      .from('quote_items')
      .select('*')
      .eq('quote_id', budgetId);

    if (itemsError) {
      console.error('❌ Erro ao buscar itens:', itemsError);
    } else {
      console.log('\n📝 Itens do orçamento:', items?.length || 0);
      items?.forEach((item, index) => {
        console.log(
          `  ${index + 1}. ${item.description} - Qtd: ${item.quantity} - Preço: R$ ${item.unit_price}`
        );
      });
    }
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

// Executar o debug
debugBudget('f5bb300a-a2c2-4c1c-bcba-b47e4b7d7b77');
