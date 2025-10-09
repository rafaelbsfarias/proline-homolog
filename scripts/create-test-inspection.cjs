#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestInspection() {
  console.log('\n🔍 === CRIANDO INSPEÇÃO DE TESTE ===\n');

  // 1. Buscar um veículo em análise
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, plate, status')
    .eq('status', 'EM_ANALISE')
    .limit(1);

  if (!vehicles || vehicles.length === 0) {
    console.log('❌ Nenhum veículo em análise encontrado');
    console.log('   Crie um veículo com status EM_ANALISE primeiro');
    return;
  }

  const vehicle = vehicles[0];
  console.log(`✓ Veículo encontrado: ${vehicle.plate} (${vehicle.id})`);
  console.log();

  // 2. Buscar o specialist
  const { data: specialist } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'specialist')
    .limit(1)
    .single();

  if (!specialist) {
    console.log('❌ Nenhum specialist encontrado');
    return;
  }

  console.log(`✓ Specialist: ${specialist.id}`);
  console.log();

  // 3. Verificar se já existe uma inspeção não finalizada
  const { data: existingInspection } = await supabase
    .from('inspections')
    .select('id, finalized')
    .eq('vehicle_id', vehicle.id)
    .eq('finalized', false)
    .maybeSingle();

  let inspectionId;

  if (existingInspection) {
    console.log(`✓ Já existe inspeção não finalizada: ${existingInspection.id}`);
    inspectionId = existingInspection.id;
    
    // Limpar services existentes
    await supabase
      .from('inspection_services')
      .delete()
      .eq('inspection_id', inspectionId);
      
    console.log('  → Services anteriores removidos');
  } else {
    // 4. Criar inspeção
    const { data: newInspection, error: inspError } = await supabase
      .from('inspections')
      .insert({
        vehicle_id: vehicle.id,
        specialist_id: specialist.id,
        finalized: false,
        inspection_date: new Date().toISOString().split('T')[0],
        odometer: 50000,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (inspError) {
      console.log('❌ Erro ao criar inspeção:', inspError);
      return;
    }

    inspectionId = newInspection.id;
    console.log(`✓ Inspeção criada: ${inspectionId}`);
  }

  console.log();

  // 5. Adicionar serviços necessários
  const services = [
    { category: 'mechanics', required: true, notes: 'Teste mechanics' },
    { category: 'body_paint', required: true, notes: 'Teste body_paint' },
  ];

  console.log('Adicionando serviços:');
  for (const service of services) {
    const { error } = await supabase
      .from('inspection_services')
      .insert({
        inspection_id: inspectionId,
        category: service.category,
        required: service.required,
        notes: service.notes,
      });

    if (error) {
      console.log(`  ❌ Erro ao adicionar ${service.category}:`, error);
    } else {
      console.log(`  ✓ ${service.category} adicionado`);
    }
  }

  console.log();
  console.log('================================================================================');
  console.log('✅ INSPEÇÃO PRONTA PARA FINALIZAR!');
  console.log();
  console.log(`   Vehicle ID: ${vehicle.id}`);
  console.log(`   Inspection ID: ${inspectionId}`);
  console.log();
  console.log('🔧 Para finalizar, faça uma chamada POST para:');
  console.log(`   /api/specialist/finalize-checklist`);
  console.log('   Body: { "vehicleId": "${vehicle.id}" }');
  console.log();
  console.log('================================================================================\n');
}

createTestInspection().catch(console.error);
