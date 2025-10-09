#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findVehicleWithHistory() {
  console.log('\n🔍 === BUSCANDO VEÍCULOS COM HISTÓRICO ===\n');

  // Buscar veículos com mais registros no histórico
  const { data: historyCount } = await supabase
    .from('vehicle_history')
    .select('vehicle_id')
    .order('created_at', { ascending: false });

  if (!historyCount || historyCount.length === 0) {
    console.log('❌ Nenhum histórico encontrado');
    return;
  }

  // Contar registros por veículo
  const vehicleCounts = {};
  historyCount.forEach(h => {
    vehicleCounts[h.vehicle_id] = (vehicleCounts[h.vehicle_id] || 0) + 1;
  });

  // Ordenar por quantidade
  const sorted = Object.entries(vehicleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  console.log('📊 VEÍCULOS COM MAIS HISTÓRICO:\n');

  for (const [vehicleId, count] of sorted) {
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('plate, status')
      .eq('id', vehicleId)
      .single();

    console.log(`${count} registros - ${vehicle?.plate || 'N/A'} (${vehicle?.status || 'N/A'})`);
    console.log(`   Vehicle ID: ${vehicleId}`);

    // Buscar histórico detalhado
    const { data: history } = await supabase
      .from('vehicle_history')
      .select('status, created_at')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: true });

    if (history && history.length > 0) {
      console.log('   Histórico:');
      history.forEach((h, i) => {
        console.log(`     ${i + 1}. ${h.status} (${new Date(h.created_at).toLocaleString()})`);
      });
    }
    console.log();
  }

  console.log('\n================================================================================\n');
}

findVehicleWithHistory().catch(console.error);
