/**
 * Script para buscar quotes com veículos
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function findQuotesWithVehicles() {
  console.log('🔍 Buscando quotes com dados de veículos...');

  try {
    // Buscar quotes com service_orders e vehicles
    const { data: quotes, error } = await supabase
      .from('quotes')
      .select(
        `
        id,
        status,
        total_value,
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
      .limit(5);

    if (error) {
      console.error('❌ Erro ao buscar quotes:', error);
      return;
    }

    console.log(`✅ Encontrados ${quotes.length} quotes:`);

    quotes.forEach((quote, index) => {
      console.log(`\n📋 Quote ${index + 1}:`);
      console.log(`  ID: ${quote.id}`);
      console.log(`  Status: ${quote.status}`);
      console.log(`  Valor: R$ ${quote.total_value}`);

      if (quote.service_orders && quote.service_orders.vehicles) {
        const vehicle = quote.service_orders.vehicles;
        console.log(
          `  🚗 Veículo: ${vehicle.plate} - ${vehicle.brand} ${vehicle.model} - ${vehicle.year}`
        );
        console.log(`  Cor: ${vehicle.color}`);
      } else {
        console.log(`  ❌ Sem dados de veículo`);
      }
    });

    // Pegar o primeiro quote com veículo para teste
    const quoteWithVehicle = quotes.find(q => q.service_orders && q.service_orders.vehicles);
    if (quoteWithVehicle) {
      console.log(`\n🎯 Quote recomendado para teste: ${quoteWithVehicle.id}`);
      const vehicle = quoteWithVehicle.service_orders.vehicles;
      console.log(
        `  Veículo: ${vehicle.plate} - ${vehicle.brand} ${vehicle.model} - ${vehicle.year}`
      );
    }
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

findQuotesWithVehicles();
