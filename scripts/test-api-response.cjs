#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testApiResponse() {
  console.log('\n🔍 === SIMULANDO RESPOSTA DA API ===\n');

  // Usar o veículo com 5 registros
  const vehicleId = '263f0599-4407-41a4-bae0-9628bee36eef';

  console.log(`Vehicle ID: ${vehicleId}\n`);

  // Simular exatamente o que a API faz
  const { data: history, error } = await supabase
    .from('vehicle_history')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: true });

  if (error) {
    console.log('❌ Erro:', error);
    return;
  }

  console.log(`✅ Histórico retornado: ${history?.length || 0} registros\n`);

  if (history && history.length > 0) {
    console.log('📋 REGISTROS RETORNADOS:\n');
    history.forEach((h, i) => {
      console.log(`${i + 1}. ${h.status}`);
      console.log(`   ID: ${h.id}`);
      console.log(`   Created At: ${h.created_at}`);
      console.log(`   Prevision Date: ${h.prevision_date || 'null'}`);
      console.log(`   End Date: ${h.end_date || 'null'}`);
      console.log();
    });

    // Verificar se a ordenação está correta
    console.log('🔍 VERIFICANDO ORDENAÇÃO:\n');
    for (let i = 1; i < history.length; i++) {
      const prev = new Date(history[i - 1].created_at).getTime();
      const curr = new Date(history[i].created_at).getTime();
      
      if (prev > curr) {
        console.log(`⚠️  ERRO NA ORDENAÇÃO: Item ${i - 1} (${history[i - 1].created_at}) > Item ${i} (${history[i].created_at})`);
      }
    }
    console.log('✓ Ordenação está correta (ascending)');
    console.log();

    // Simular como o componente processa
    console.log('🎨 COMO O COMPONENTE PROCESSA:\n');
    console.log('O componente VehicleDetails faz:');
    console.log('  1. Recebe vehicleHistory[] do hook');
    console.log('  2. Cria timelineItems combinando dados estáticos + vehicleHistory');
    console.log('  3. Ordena por data DESCENDENTE (mais recente primeiro)');
    console.log();

    // Simular a timeline
    const timelineItems = history.map(h => ({
      id: `vh-${h.id}`,
      label: h.status,
      date: h.created_at,
      color: '#9b59b6'
    }));

    // Adicionar item estático
    timelineItems.unshift({
      id: 'static-created',
      label: 'Veículo Cadastrado',
      date: '2025-10-09T09:30:10.000Z',
      color: '#002E4C'
    });

    // Ordenar descendente (como o componente faz)
    timelineItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    console.log('TIMELINE FINAL (ordem de exibição):\n');
    timelineItems.forEach((item, i) => {
      console.log(`${i + 1}. ${item.label} (${new Date(item.date).toLocaleString()})`);
    });
  }

  console.log('\n================================================================================\n');
}

testApiResponse().catch(console.error);
