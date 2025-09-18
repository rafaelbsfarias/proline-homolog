const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function debugVehicleData() {
  console.log('🚗 === VERIFICAÇÃO DE DADOS DO VEÍCULO ===');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const vehicleId = 'cced559b-8fcc-4777-9587-d63fc6369d83';

  try {
    console.log('🔍 Verificando dados na tabela vehicles...');
    
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId);

    if (vehiclesError) {
      console.error('❌ Erro ao buscar vehicles:', vehiclesError);
      return;
    }

    console.log('✅ Vehicles encontrados:', vehicles?.length || 0);
    if (vehicles && vehicles.length > 0) {
      console.log('📄 Dados do veículo:', JSON.stringify(vehicles[0], null, 2));
    }

    // Testar query mais complexa como a API original tentava fazer
    console.log('\n🔍 Testando query complexa com JOINs...');
    
    const { data: complexQuery, error: complexError } = await supabase
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
      .eq('id', '57306036-9de7-4676-a6fa-1a1f0fee298d')
      .eq('partner_id', '5713fa01-3475-4c52-ad64-5230285adef1')
      .single();

    if (complexError) {
      console.error('❌ Erro na query complexa:', complexError);
    } else {
      console.log('✅ Query complexa funcionou! Dados:', JSON.stringify(complexQuery, null, 2));
    }

  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }

  console.log('🚗 === FIM DA VERIFICAÇÃO ===');
}

debugVehicleData();
