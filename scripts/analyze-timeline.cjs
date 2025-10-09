#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeTimeline() {
  console.log('\n🔍 === ANALISANDO TIMELINE E DUPLICATAS ===\n');

  const vehicleId = '263f0599-4407-41a4-bae0-9628bee36eef';

  // Buscar vehicle
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', vehicleId)
    .single();

  // Buscar inspection
  const { data: inspection } = await supabase
    .from('inspections')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .eq('finalized', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Buscar history
  const { data: history } = await supabase
    .from('vehicle_history')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: true });

  console.log('📦 DADOS:\n');
  console.log(`Vehicle Created At: ${vehicle?.created_at}`);
  console.log(`Estimated Arrival: ${vehicle?.estimated_arrival_date}`);
  console.log(`Inspection Date: ${inspection?.inspection_date}`);
  console.log(`Inspection Finalized: ${inspection?.finalized}`);
  console.log(`History Entries: ${history?.length || 0}\n`);

  // Simular timeline items (como o componente faz)
  const items = [];

  // 1. Itens estáticos
  if (vehicle?.created_at) {
    items.push({
      id: `static-created`,
      label: 'Veículo Cadastrado',
      date: vehicle.created_at,
      source: 'STATIC',
      color: '#3498db',
    });
  }

  if (vehicle?.estimated_arrival_date) {
    items.push({
      id: `static-prevision`,
      label: 'Previsão de Chegada',
      date: vehicle.estimated_arrival_date,
      source: 'STATIC',
      color: '#f39c12',
    });
  }

  if (inspection?.inspection_date) {
    items.push({
      id: `static-analysis-started`,
      label: 'Análise Iniciada',
      date: inspection.inspection_date,
      source: 'STATIC',
      color: '#e74c3c',
    });

    if (inspection.finalized) {
      items.push({
        id: `static-analysis-finished`,
        label: 'Análise Finalizada',
        date: inspection.inspection_date,
        source: 'STATIC',
        color: '#27ae60',
      });
    }
  }

  // 2. Itens do histórico
  for (const h of history || []) {
    if (!h?.created_at) continue;
    items.push({
      id: `vh-${h.id}`,
      label: h.status,
      date: h.created_at,
      source: 'HISTORY',
      color: '#9b59b6',
    });
  }

  // 3. Ordenar por data desc
  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  console.log('📋 TIMELINE COMPLETA (como exibida):\n');
  items.forEach((item, i) => {
    console.log(`${i + 1}. [${item.source}] ${item.label}`);
    console.log(`   Data: ${new Date(item.date).toLocaleString()}`);
    console.log(`   ID: ${item.id}`);
    console.log();
  });

  // Detectar possíveis duplicatas semânticas
  console.log('🔍 ANÁLISE DE DUPLICATAS SEMÂNTICAS:\n');

  const semanticMap = {
    'Veículo Cadastrado': ['VEÍCULO CADASTRADO', 'CADASTRADO'],
    'Análise Iniciada': ['EM ANÁLISE', 'ANALISE INICIADA'],
    'Análise Finalizada': ['ANALISE FINALIZADA', 'ANÁLISE FINALIZADA'],
    'Previsão de Chegada': ['AGUARDANDO CHEGADA DO VEÍCULO', 'PREVISTA CHEGADA'],
    'CHEGADA CONFIRMADA': ['CHEGADA CONFIRMADA', 'VEÍCULO CHEGOU'],
  };

  const possibleDuplicates = [];

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const label1 = items[i].label.toUpperCase();
      const label2 = items[j].label.toUpperCase();

      // Verificar se são semanticamente iguais
      for (const [key, variants] of Object.entries(semanticMap)) {
        const allVariants = [key.toUpperCase(), ...variants.map(v => v.toUpperCase())];
        if (allVariants.includes(label1) && allVariants.includes(label2)) {
          possibleDuplicates.push({
            item1: items[i],
            item2: items[j],
            reason: `Ambos representam: ${key}`,
          });
        }
      }
    }
  }

  if (possibleDuplicates.length > 0) {
    console.log(`⚠️  ENCONTRADAS ${possibleDuplicates.length} POSSÍVEIS DUPLICATAS:\n`);
    possibleDuplicates.forEach((dup, i) => {
      console.log(`Duplicata ${i + 1}:`);
      console.log(`  1. [${dup.item1.source}] ${dup.item1.label}`);
      console.log(`  2. [${dup.item2.source}] ${dup.item2.label}`);
      console.log(`  Motivo: ${dup.reason}`);
      console.log();
    });
  } else {
    console.log('✓ Nenhuma duplicata semântica encontrada');
  }

  console.log('\n================================================================================\n');
}

analyzeTimeline().catch(console.error);
