#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugTimelineRendering() {
  console.log('\n🔍 === DEBUG: O QUE O COMPONENTE ESTÁ RECEBENDO ===\n');

  const vehicleId = '263f0599-4407-41a4-bae0-9628bee36eef';

  // 1. Buscar veículo
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', vehicleId)
    .single();

  // 2. Buscar inspeção
  const { data: inspection } = await supabase
    .from('inspections')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // 3. Buscar histórico (EXATAMENTE como a API faz)
  const { data: vehicleHistory } = await supabase
    .from('vehicle_history')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: true });

  console.log('📦 DADOS QUE O COMPONENTE RECEBE:\n');
  console.log('Vehicle:');
  console.log(`  created_at: ${vehicle?.created_at}`);
  console.log(`  estimated_arrival_date: ${vehicle?.estimated_arrival_date}`);
  console.log();

  console.log('Inspection:');
  console.log(`  inspection_date: ${inspection?.inspection_date}`);
  console.log(`  finalized: ${inspection?.finalized}`);
  console.log();

  console.log(`Vehicle History: ${vehicleHistory?.length || 0} registros\n`);

  // 4. Simular EXATAMENTE o que o TimelineSection faz
  console.log('🎨 SIMULANDO TimelineSection.tsx:\n');

  const items = [];

  // Itens estáticos
  console.log('Adicionando itens ESTÁTICOS:');
  
  items.push({
    type: 'STATIC',
    title: 'Veículo Cadastrado',
    date: vehicle?.created_at,
  });
  console.log(`  ✓ Veículo Cadastrado (${vehicle?.created_at})`);

  if (vehicle?.estimated_arrival_date) {
    items.push({
      type: 'STATIC',
      title: 'Previsão de Chegada',
      date: vehicle.estimated_arrival_date,
    });
    console.log(`  ✓ Previsão de Chegada (${vehicle.estimated_arrival_date})`);
  }

  if (inspection?.inspection_date) {
    items.push({
      type: 'STATIC',
      title: 'Análise Iniciada',
      date: inspection.inspection_date,
    });
    console.log(`  ✓ Análise Iniciada (${inspection.inspection_date})`);

    if (inspection.finalized) {
      items.push({
        type: 'STATIC',
        title: 'Análise Finalizada',
        date: inspection.inspection_date,
      });
      console.log(`  ✓ Análise Finalizada (${inspection.inspection_date})`);
    }
  }

  console.log();
  console.log('Adicionando itens do VEHICLE_HISTORY:');

  // sortedHistory (como o componente faz)
  const sortedHistory = [...(vehicleHistory || [])];
  sortedHistory.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  sortedHistory.forEach((h, index) => {
    console.log(`  ${index + 1}. ${h.status}`);
    console.log(`     ID: ${h.id}`);
    console.log(`     created_at: ${h.created_at}`);
    
    // O componente NÃO adiciona ao items[] - ele renderiza direto!
    // items.push({ ... })  ← ISSO NÃO ACONTECE
  });

  console.log();
  console.log('📊 TOTAL DE ITENS QUE DEVERIAM APARECER:');
  console.log(`  Estáticos: ${items.length}`);
  console.log(`  Do Histórico: ${sortedHistory.length}`);
  console.log(`  TOTAL: ${items.length + sortedHistory.length}`);
  console.log();

  console.log('👀 O QUE VOCÊ VÊ NA TELA:');
  console.log('  Apenas 4 itens!');
  console.log();

  console.log('🔍 ANÁLISE DO PROBLEMA:\n');
  console.log('O TimelineSection.tsx renderiza assim:');
  console.log('  1. <Event> para "Veículo Cadastrado"');
  console.log('  2. <Event> para "Previsão de Chegada" (se existir)');
  console.log('  3. <Event> para "Análise Iniciada" (se existir)');
  console.log('  4. <Event> para "Análise Finalizada" (se finalized)');
  console.log('  5. sortedHistory.map(h => <Event ... />) ← AQUI DEVEM APARECER OS 6 REGISTROS');
  console.log();

  console.log('⚠️  HIPÓTESE: O sortedHistory está vazio ou não está sendo passado!');
  console.log();

  console.log('\n================================================================================\n');
}

debugTimelineRendering().catch(console.error);
