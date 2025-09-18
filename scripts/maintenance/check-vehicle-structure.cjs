const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function checkVehicleStructure() {
  console.log('🔍 === VERIFICAÇÃO DA ESTRUTURA DA TABELA VEHICLES ===');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Verificar alguns veículos existentes para ver a estrutura
    console.log('🚗 Buscando veículos existentes...');
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('*')
      .limit(3);

    if (vehiclesError) {
      console.error('❌ Erro ao buscar veículos:', vehiclesError);
    } else {
      console.log('✅ Veículos encontrados:', vehicles?.length || 0);
      if (vehicles && vehicles.length > 0) {
        vehicles.forEach((vehicle, index) => {
          console.log(`\n  ${index + 1}. Veículo:`);
          console.log(`      ID: ${vehicle.id}`);
          console.log(`      Placa: ${vehicle.license_plate}`);
          console.log(`      Marca: ${vehicle.brand}`);
          console.log(`      Modelo: ${vehicle.model}`);
          console.log(`      Ano: ${vehicle.year}`);
          console.log(`      Todas as colunas:`, Object.keys(vehicle));
        });
      }
    }

    // Tentar criar um veículo de teste para ver qual erro específico ocorre
    console.log('\n🧪 Testando criação de veículo...');
    const testVehicle = {
      license_plate: 'TEST123',
      brand: 'Ford',
      model: 'Teste',
      year: 2021,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newVehicle, error: createError } = await supabase
      .from('vehicles')
      .insert(testVehicle)
      .select()
      .single();

    if (createError) {
      console.error('❌ Erro ao criar veículo de teste:', createError);
      console.log('📋 Dados enviados:', testVehicle);
      
      // Tentar com dados mínimos
      console.log('\n🧪 Tentando com dados mínimos...');
      const minimalVehicle = {
        license_plate: 'MIN123',
        brand: 'Test',
        model: 'Test'
      };

      const { data: minVehicle, error: minError } = await supabase
        .from('vehicles')
        .insert(minimalVehicle)
        .select()
        .single();

      if (minError) {
        console.error('❌ Erro com dados mínimos:', minError);
      } else {
        console.log('✅ Veículo criado com dados mínimos:', minVehicle);
        // Limpar o veículo de teste
        await supabase.from('vehicles').delete().eq('id', minVehicle.id);
      }

    } else {
      console.log('✅ Veículo de teste criado:', newVehicle);
      // Limpar o veículo de teste
      await supabase.from('vehicles').delete().eq('id', newVehicle.id);
    }

  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }

  console.log('🔍 === FIM DA VERIFICAÇÃO ===');
}

checkVehicleStructure();
