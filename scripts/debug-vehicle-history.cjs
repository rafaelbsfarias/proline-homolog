#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugVehicleHistory() {
  console.log('\n🔍 === VERIFICANDO VEHICLE_HISTORY ===\n');

  // Pegar um veículo qualquer
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, plate')
    .limit(1);

  if (!vehicles || vehicles.length === 0) {
    console.log('❌ Nenhum veículo encontrado');
    return;
  }

  const vehicle = vehicles[0];
  console.log(`Veículo: ${vehicle.plate} (${vehicle.id})\n`);

  // Buscar histórico
  const { data: history, error } = await supabase
    .from('vehicle_history')
    .select('*')
    .eq('vehicle_id', vehicle.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.log('❌ Erro ao buscar histórico:', error);
    return;
  }

  console.log(`📦 TOTAL DE REGISTROS NO HISTÓRICO: ${history?.length || 0}\n`);

  if (history && history.length > 0) {
    console.log('📋 ESTRUTURA DA TABELA:');
    console.log('Colunas:', Object.keys(history[0]).join(', '));
    console.log();

    console.log('📄 HISTÓRICO COMPLETO:\n');
    history.forEach((h, index) => {
      console.log(`${index + 1}. Status: ${h.status}`);
      console.log(`   Created At: ${new Date(h.created_at).toLocaleString()}`);
      console.log(`   Prevision Date: ${h.prevision_date || 'null'}`);
      console.log(`   End Date: ${h.end_date || 'null'}`);
      console.log(`   ID: ${h.id}`);
      console.log();
    });

    // Verificar se existem status duplicados ou que não deveriam aparecer
    const statusCount = {};
    history.forEach(h => {
      statusCount[h.status] = (statusCount[h.status] || 0) + 1;
    });

    console.log('📊 STATUS ÚNICOS:\n');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} registro(s)`);
    });
  }

  // Comparar com o que o componente TimelineSection recebe
  console.log('\n🔍 COMPARANDO COM O COMPONENTE:\n');
  
  console.log('O componente TimelineSection espera:');
  console.log('  - vehicleHistory: VehicleHistoryEntry[]');
  console.log('  - Campos: id, vehicle_id, status, prevision_date, end_date, created_at');
  console.log();

  console.log('O que temos no banco:');
  if (history && history.length > 0) {
    const sample = history[0];
    console.log('  Campos disponíveis:', Object.keys(sample).join(', '));
    
    // Verificar se todos os campos necessários existem
    const requiredFields = ['id', 'vehicle_id', 'status', 'prevision_date', 'end_date', 'created_at'];
    const missingFields = requiredFields.filter(field => !(field in sample));
    
    if (missingFields.length > 0) {
      console.log(`  ⚠️  CAMPOS FALTANDO: ${missingFields.join(', ')}`);
    } else {
      console.log('  ✓ Todos os campos necessários estão presentes');
    }
  }

  console.log('\n================================================================================\n');
}

debugVehicleHistory().catch(console.error);
