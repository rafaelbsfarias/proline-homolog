#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function prepareVehicle() {
  console.log('\n🔍 === PREPARANDO VEÍCULO PARA TESTE ===\n');

  // Buscar um veículo qualquer
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, plate, status')
    .limit(5);

  if (!vehicles || vehicles.length === 0) {
    console.log('❌ Nenhum veículo encontrado no banco');
    return;
  }

  console.log('Veículos disponíveis:');
  vehicles.forEach((v, i) => {
    console.log(`  ${i + 1}. ${v.plate} - Status: ${v.status}`);
  });
  console.log();

  // Pegar o primeiro veículo
  const vehicle = vehicles[0];

  console.log(`Atualizando veículo ${vehicle.plate} para EM_ANALISE...`);

  const { error } = await supabase
    .from('vehicles')
    .update({ status: 'EM_ANALISE' })
    .eq('id', vehicle.id);

  if (error) {
    console.log('❌ Erro:', error);
    return;
  }

  console.log('✓ Veículo atualizado!\n');
  console.log(`Vehicle ID: ${vehicle.id}`);
  console.log(`Plate: ${vehicle.plate}`);
  console.log();
  console.log('Agora execute: node scripts/create-test-inspection.cjs');
  console.log();
}

prepareVehicle().catch(console.error);
