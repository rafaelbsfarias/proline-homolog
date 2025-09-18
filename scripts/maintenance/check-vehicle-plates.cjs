const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function checkVehiclePlates() {
  console.log('🔍 === VERIFICAÇÃO DAS PLACAS DE VEÍCULOS ===');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Buscar todos os veículos para ver as placas disponíveis
    console.log('🚗 Buscando todos os veículos...');
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('*');

    if (vehiclesError) {
      console.error('❌ Erro ao buscar veículos:', vehiclesError);
    } else {
      console.log('✅ Veículos encontrados:', vehicles?.length || 0);
      if (vehicles && vehicles.length > 0) {
        vehicles.forEach((vehicle, index) => {
          console.log(`\n  ${index + 1}. Veículo:`);
          console.log(`      ID: ${vehicle.id}`);
          console.log(`      Placa: "${vehicle.license_plate}"`);
          console.log(`      Marca: ${vehicle.brand}`);
          console.log(`      Modelo: ${vehicle.model}`);
          console.log(`      Ano: ${vehicle.year}`);
        });
      }
    }

    // Buscar especificamente pela placa ABC561S8
    console.log('\n🔍 Buscando especificamente pela placa ABC561S8...');
    const { data: specificVehicle, error: specificError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('license_plate', 'ABC561S8')
      .single();

    if (specificError) {
      console.error('❌ Erro ao buscar veículo ABC561S8:', specificError);
    } else {
      console.log('✅ Veículo ABC561S8 encontrado:', specificVehicle);
    }

    // Tentar também uma busca case-insensitive
    console.log('\n🔍 Tentando busca case-insensitive...');
    const { data: caseInsensitive, error: caseError } = await supabase
      .from('vehicles')
      .select('*')
      .ilike('license_plate', 'ABC561S8');

    if (caseError) {
      console.error('❌ Erro na busca case-insensitive:', caseError);
    } else {
      console.log('✅ Resultados case-insensitive:', caseInsensitive?.length || 0);
      if (caseInsensitive && caseInsensitive.length > 0) {
        caseInsensitive.forEach(vehicle => {
          console.log(`  - Placa: "${vehicle.license_plate}" | Marca: ${vehicle.brand} | Modelo: ${vehicle.model}`);
        });
      }
    }

    // Verificar se há alguma relação com service_orders
    console.log('\n🔗 Verificando service_orders...');
    const { data: serviceOrders, error: serviceOrdersError } = await supabase
      .from('service_orders')
      .select(`
        *,
        vehicles (*)
      `);

    if (serviceOrdersError) {
      console.error('❌ Erro ao buscar service_orders:', serviceOrdersError);
    } else {
      console.log('✅ Service orders encontradas:', serviceOrders?.length || 0);
      if (serviceOrders && serviceOrders.length > 0) {
        serviceOrders.forEach((order, index) => {
          console.log(`\n  ${index + 1}. Service Order:`);
          console.log(`      ID: ${order.id}`);
          console.log(`      Vehicle ID: ${order.vehicle_id}`);
          console.log(`      Status: ${order.status}`);
          if (order.vehicles) {
            console.log(`      Vehicle Plate: "${order.vehicles.license_plate}"`);
            console.log(`      Vehicle Brand: ${order.vehicles.brand}`);
            console.log(`      Vehicle Model: ${order.vehicles.model}`);
          }
        });
      }
    }

  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }

  console.log('🔍 === FIM DA VERIFICAÇÃO ===');
}

checkVehiclePlates();
