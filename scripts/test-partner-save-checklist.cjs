/**
 * Script para testar a funcionalidade de salvar checklist pelo parceiro
 * e verificar se o status do veículo é atualizado para "Fase Orçamentaria"
 */

const { createClient } = require('@supabase/supabase-js');

// Configurações locais
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function testPartnerSaveChecklist() {
  console.log('\n=== TESTE: Partner Save Checklist ===\n');

  // 1. Buscar um quote pending_partner
  console.log('1. Buscando quotes pending_partner...');
  const { data: quotes, error: quotesError } = await supabase
    .from('quotes')
    .select(
      `
      id,
      partner_id,
      status,
      service_orders!inner(
        id,
        vehicle_id,
        vehicles(id, plate, status)
      )
    `
    )
    .eq('status', 'pending_partner')
    .limit(1);

  if (quotesError) {
    console.error('❌ Erro ao buscar quotes:', quotesError);
    return;
  }

  if (!quotes || quotes.length === 0) {
    console.log('⚠️  Nenhum quote pending_partner encontrado');
    return;
  }

  const quote = quotes[0];
  const serviceOrder = Array.isArray(quote.service_orders)
    ? quote.service_orders[0]
    : quote.service_orders;
  const vehicle = Array.isArray(serviceOrder.vehicles)
    ? serviceOrder.vehicles[0]
    : serviceOrder.vehicles;

  console.log('✅ Quote encontrado:', {
    quote_id: quote.id,
    partner_id: quote.partner_id,
    vehicle_id: vehicle.id,
    vehicle_plate: vehicle.plate,
    current_status: vehicle.status,
  });

  // 2. Verificar histórico atual
  console.log('\n2. Verificando histórico atual do veículo...');
  const { data: historyBefore, error: historyBeforeError } = await supabase
    .from('vehicle_history')
    .select('*')
    .eq('vehicle_id', vehicle.id)
    .order('created_at', { ascending: false });

  if (historyBeforeError) {
    console.error('❌ Erro ao buscar histórico:', historyBeforeError);
  } else {
    console.log(`✅ Histórico atual: ${historyBefore?.length || 0} entradas`);
    if (historyBefore && historyBefore.length > 0) {
      console.log('   Última entrada:', historyBefore[0].status);
    }
  }

  // 3. Chamar RPC para atualizar status
  console.log('\n3. Chamando RPC partner_save_checklist_update_vehicle_status...');
  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    'partner_save_checklist_update_vehicle_status',
    {
      p_partner_id: quote.partner_id,
      p_vehicle_id: vehicle.id,
    }
  );

  if (rpcError) {
    console.error('❌ Erro ao chamar RPC:', rpcError);
    return;
  }

  console.log('✅ RPC executado com sucesso:', rpcResult);

  // 4. Verificar novo status do veículo
  console.log('\n4. Verificando novo status do veículo...');
  const { data: updatedVehicle, error: vehicleError } = await supabase
    .from('vehicles')
    .select('id, plate, status')
    .eq('id', vehicle.id)
    .single();

  if (vehicleError) {
    console.error('❌ Erro ao buscar veículo atualizado:', vehicleError);
  } else {
    console.log('✅ Veículo atualizado:', {
      plate: updatedVehicle.plate,
      old_status: vehicle.status,
      new_status: updatedVehicle.status,
    });
  }

  // 5. Verificar nova entrada no histórico
  console.log('\n5. Verificando nova entrada no histórico...');
  const { data: historyAfter, error: historyAfterError } = await supabase
    .from('vehicle_history')
    .select('*')
    .eq('vehicle_id', vehicle.id)
    .order('created_at', { ascending: false });

  if (historyAfterError) {
    console.error('❌ Erro ao buscar histórico atualizado:', historyAfterError);
  } else {
    console.log(`✅ Histórico atualizado: ${historyAfter?.length || 0} entradas`);
    const newEntries = (historyAfter?.length || 0) - (historyBefore?.length || 0);
    console.log(`   Novas entradas: ${newEntries}`);
    if (historyAfter && historyAfter.length > 0) {
      console.log('   Última entrada:', {
        status: historyAfter[0].status,
        notes: historyAfter[0].notes,
        created_at: historyAfter[0].created_at,
      });
    }
  }

  console.log('\n=== FIM DO TESTE ===\n');
}

testPartnerSaveChecklist()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Erro não tratado:', err);
    process.exit(1);
  });
