const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function checkVehicleColumns() {
  console.log('🔍 === VERIFICAÇÃO DAS COLUNAS DA TABELA VEHICLES ===');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Pegar um veículo específico para ver todas as colunas
    console.log('🚗 Buscando um veículo específico...');
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', 'cced559b-8fcc-4777-9587-d63fc6369d83')
      .single();

    if (vehicleError) {
      console.error('❌ Erro ao buscar veículo:', vehicleError);
    } else {
      console.log('✅ Veículo encontrado:');
      console.log('📋 Todas as colunas e valores:');
      Object.entries(vehicle).forEach(([key, value]) => {
        console.log(`  ${key}: ${value} (tipo: ${typeof value})`);
      });
    }

    // Verificar se existe alguma coluna que contenha 'ABC561S8'
    console.log('\n🔍 Procurando por ABC561S8 em todas as colunas...');
    const searchColumns = ['id', 'brand', 'model', 'year', 'plate', 'license_plate', 'registration_plate', 'vehicle_plate'];
    
    for (const column of searchColumns) {
      try {
        console.log(`  Testando coluna: ${column}`);
        const { data: searchResult, error: searchError } = await supabase
          .from('vehicles')
          .select(column)
          .eq(column, 'ABC561S8')
          .limit(1);

        if (!searchError && searchResult && searchResult.length > 0) {
          console.log(`  ✅ Encontrado em ${column}:`, searchResult);
        } else if (searchError) {
          console.log(`  ❌ Coluna ${column} não existe ou erro:`, searchError.message);
        } else {
          console.log(`  ⚪ Coluna ${column} existe mas não contém ABC561S8`);
        }
      } catch (e) {
        console.log(`  ❌ Erro ao testar coluna ${column}:`, e.message);
      }
    }

    // Verificar as quotes existentes para entender o relacionamento
    console.log('\n💰 Verificando quotes existentes...');
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select(`
        *,
        service_orders (
          *,
          vehicles (*)
        )
      `);

    if (quotesError) {
      console.error('❌ Erro ao buscar quotes:', quotesError);
    } else {
      console.log('✅ Quotes encontradas:', quotes?.length || 0);
      if (quotes && quotes.length > 0) {
        quotes.forEach((quote, index) => {
          console.log(`\n  ${index + 1}. Quote: ${quote.id}`);
          console.log(`      Status: ${quote.status}`);
          console.log(`      Service Order ID: ${quote.service_order_id}`);
          if (quote.service_orders && quote.service_orders.vehicles) {
            const vehicle = quote.service_orders.vehicles;
            console.log(`      Vehicle ID: ${vehicle.id}`);
            console.log(`      Vehicle Data:`, Object.keys(vehicle));
            console.log(`      Vehicle Values:`, Object.values(vehicle));
          }
        });
      }
    }

  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }

  console.log('🔍 === FIM DA VERIFICAÇÃO ===');
}

checkVehicleColumns();
