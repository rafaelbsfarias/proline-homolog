#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeVehicleStatus() {
  console.log('\n🔍 === ANALISANDO STATUS DOS VEÍCULOS DAS INSPEÇÕES ===\n');

  // IDs das inspeções que não geraram quotes
  const inspectionIds = [
    '60283b9e-9406-47d5-ac04-d62e008c25d7',
    '5c86c359-d078-4e88-8489-6d2d929fe3c3'
  ];

  for (const inspectionId of inspectionIds) {
    const { data: inspection } = await supabase
      .from('inspections')
      .select(`
        id,
        finalized,
        finalized_at,
        created_at,
        vehicles!inner(
          id,
          plate,
          status
        )
      `)
      .eq('id', inspectionId)
      .single();

    if (inspection) {
      console.log(`📋 INSPEÇÃO: ${inspectionId.substring(0, 8)}...`);
      console.log(`   Veículo: ${inspection.vehicles.plate}`);
      console.log(`   Status atual: ${inspection.vehicles.status}`);
      console.log(`   Finalizada: ${inspection.finalized ? 'SIM' : 'NÃO'}`);
      console.log(`   Finalizada em: ${inspection.finalized_at || 'N/A'}`);
      console.log(`   Criada em: ${inspection.created_at}`);
      console.log();

      // Buscar histórico de status do veículo
      const { data: history } = await supabase
        .from('vehicle_history')
        .select('status, description, created_at')
        .eq('vehicle_id', inspection.vehicles.id)
        .order('created_at', { ascending: true });

      if (history && history.length > 0) {
        console.log('   📜 HISTÓRICO DE STATUS:');
        history.forEach((h, i) => {
          console.log(`      ${i + 1}. ${h.status} - ${h.created_at}`);
          if (h.description) {
            console.log(`         "${h.description}"`);
          }
        });
        console.log();

        // Qual era o status quando a inspeção foi criada?
        const inspectionCreated = new Date(inspection.created_at);
        const statusAtCreation = history
          .filter(h => new Date(h.created_at) <= inspectionCreated)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

        if (statusAtCreation) {
          console.log(`   ⏰ STATUS QUANDO INSPEÇÃO FOI CRIADA: ${statusAtCreation.status}`);
          console.log();
        }
      }
    }

    console.log('================================================================================\n');
  }

  // Comparar com inspeção que GEROU quotes
  console.log('🔍 === COMPARANDO COM INSPEÇÃO QUE GEROU QUOTES ===\n');

  const { data: workingQuotes } = await supabase
    .from('quotes')
    .select(`
      id,
      created_at,
      service_orders!inner(
        id,
        source_inspection_id,
        inspections!inner(
          id,
          created_at,
          vehicles!inner(
            plate,
            status
          )
        )
      )
    `)
    .not('service_orders.source_inspection_id', 'is', null)
    .limit(1);

  if (workingQuotes && workingQuotes.length > 0) {
    const quote = workingQuotes[0];
    const inspection = quote.service_orders.inspections;
    const vehicle = inspection.vehicles;

    console.log(`📋 INSPEÇÃO QUE FUNCIONOU:`);
    console.log(`   Veículo: ${vehicle.plate}`);
    console.log(`   Status atual: ${vehicle.status}`);
    console.log(`   Inspeção criada em: ${inspection.created_at}`);
    console.log(`   Quote criada em: ${quote.created_at}`);
    console.log();

    // Buscar histórico
    const { data: history } = await supabase
      .from('vehicle_history')
      .select('status, created_at')
      .eq('vehicle_id', vehicle.id)
      .order('created_at', { ascending: true });

    if (history && history.length > 0) {
      console.log('   📜 HISTÓRICO DE STATUS:');
      history.forEach((h, i) => {
        console.log(`      ${i + 1}. ${h.status} - ${h.created_at}`);
      });

      const inspectionCreated = new Date(inspection.created_at);
      const statusAtCreation = history
        .filter(h => new Date(h.created_at) <= inspectionCreated)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

      if (statusAtCreation) {
        console.log();
        console.log(`   ⏰ STATUS QUANDO INSPEÇÃO FOI CRIADA: ${statusAtCreation.status}`);
      }
    }
  }

  console.log('\n================================================================================\n');
}

analyzeVehicleStatus().catch(console.error);
