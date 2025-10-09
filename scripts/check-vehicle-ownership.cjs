#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkVehicleOwnership() {
  console.log('\n🔍 === VERIFICANDO PROPRIETÁRIO DO VEÍCULO ===\n');

  const vehicleId = '263f0599-4407-41a4-bae0-9628bee36eef';
  const clientIdFromToken = '34e3e94e-4d39-40c6-bcb7-9e2b5543fa84'; // Do JWT token

  // Buscar veículo
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('id, plate, client_id')
    .eq('id', vehicleId)
    .single();

  if (!vehicle) {
    console.log('❌ Veículo não encontrado');
    return;
  }

  console.log('📦 VEÍCULO:');
  console.log(`  ID: ${vehicle.id}`);
  console.log(`  Placa: ${vehicle.plate}`);
  console.log(`  Client ID: ${vehicle.client_id}`);
  console.log();

  console.log('👤 CLIENTE LOGADO:');
  console.log(`  Client ID (do token): ${clientIdFromToken}`);
  console.log();

  if (vehicle.client_id === clientIdFromToken) {
    console.log('✅ O veículo PERTENCE ao cliente logado!');
  } else {
    console.log('❌ O veículo NÃO PERTENCE ao cliente logado!');
    console.log();
    console.log('🔍 Buscando dados do cliente proprietário:');
    
    const { data: realOwner } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', vehicle.client_id)
      .single();

    if (realOwner) {
      console.log(`  Nome: ${realOwner.full_name}`);
      console.log(`  Role: ${realOwner.role}`);
      console.log(`  ID: ${realOwner.id}`);
    }
  }

  console.log('\n================================================================================\n');
}

checkVehicleOwnership().catch(console.error);
