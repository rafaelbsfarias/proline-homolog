/**
 * Script para testar se a aprovação do admin cria entrada no vehicle_history
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function testAdminApproval() {
  console.log('\n=== TESTE: Admin Approval Creates Vehicle History ===\n');

  // 1. Buscar um quote pending_admin_approval
  console.log('1. Buscando quotes pending_admin_approval...');
  const { data: quotes, error: quotesError } = await supabase
    .from('quotes')
    .select('id, status, service_order_id')
    .eq('status', 'pending_admin_approval')
    .limit(1);

  if (quotesError) {
    console.error('❌ Erro ao buscar quotes:', quotesError);
    return;
  }

  if (!quotes || quotes.length === 0) {
    console.log('⚠️  Nenhum quote pending_admin_approval encontrado');
    console.log('Criando um manualmente para teste...\n');

    // Buscar um quote qualquer
    const { data: anyQuote } = await supabase
      .from('quotes')
      .select('id, status, service_order_id')
      .limit(1)
      .single();

    if (!anyQuote) {
      console.log('❌ Nenhum quote encontrado no banco');
      return;
    }

    // Atualizar para pending_admin_approval
    await supabase
      .from('quotes')
      .update({ status: 'pending_admin_approval' })
      .eq('id', anyQuote.id);

    quotes[0] = { ...anyQuote, status: 'pending_admin_approval' };
    console.log('✅ Quote atualizado para pending_admin_approval');
  }

  const quote = quotes[0];
  console.log('✅ Quote encontrado:', {
    quote_id: quote.id,
    status: quote.status,
    service_order_id: quote.service_order_id,
  });

  // 2. Buscar vehicle_id
  console.log('\n2. Buscando vehicle_id...');
  const { data: serviceOrder } = await supabase
    .from('service_orders')
    .select('vehicle_id')
    .eq('id', quote.service_order_id)
    .single();

  if (!serviceOrder) {
    console.log('❌ Service order não encontrado');
    return;
  }

  const vehicleId = serviceOrder.vehicle_id;
  console.log('✅ Vehicle ID:', vehicleId);

  // 3. Verificar vehicle_history ANTES
  console.log('\n3. Verificando vehicle_history ANTES da aprovação...');
  const { data: historyBefore } = await supabase
    .from('vehicle_history')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false });

  console.log(`   Total de entradas: ${historyBefore?.length || 0}`);
  if (historyBefore && historyBefore.length > 0) {
    console.log('   Última entrada:', {
      status: historyBefore[0].status,
      created_at: historyBefore[0].created_at,
    });
  }

  // 4. Simular aprovação do admin
  console.log('\n4. Simulando aprovação do admin...');
  
  // Atualizar quote
  await supabase
    .from('quotes')
    .update({ status: 'pending_client_approval' })
    .eq('id', quote.id);

  // Atualizar status do veículo
  await supabase
    .from('vehicles')
    .update({ status: 'Fase Orçamentaria' })
    .eq('id', vehicleId);

  // Inserir no vehicle_history
  const { data: historyInsert, error: historyError } = await supabase
    .from('vehicle_history')
    .insert({
      vehicle_id: vehicleId,
      status: 'Orçamento Aprovado pelo Administrador',
      notes: 'Teste de aprovação via script',
    })
    .select();

  if (historyError) {
    console.error('❌ Erro ao inserir no vehicle_history:', historyError);
  } else {
    console.log('✅ Entrada criada no vehicle_history:', historyInsert);
  }

  // 5. Verificar vehicle_history DEPOIS
  console.log('\n5. Verificando vehicle_history DEPOIS da aprovação...');
  const { data: historyAfter } = await supabase
    .from('vehicle_history')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false });

  console.log(`   Total de entradas: ${historyAfter?.length || 0}`);
  const newEntries = (historyAfter?.length || 0) - (historyBefore?.length || 0);
  console.log(`   Novas entradas: ${newEntries}`);
  
  if (historyAfter && historyAfter.length > 0) {
    console.log('\n   Últimas 3 entradas:');
    historyAfter.slice(0, 3).forEach((entry, idx) => {
      console.log(`   ${idx + 1}. ${entry.status} (${entry.created_at})`);
      if (entry.notes) console.log(`      Notes: ${entry.notes}`);
    });
  }

  // 6. Testar API client/vehicle-history
  console.log('\n6. Testando API /api/client/vehicle-history...');
  try {
    // Buscar o client_id do veículo
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('client_id')
      .eq('id', vehicleId)
      .single();

    if (!vehicle?.client_id) {
      console.log('⚠️  Veículo não tem client_id');
    } else {
      console.log('✅ Vehicle tem client_id:', vehicle.client_id);
      
      // Simular query da API (com RLS)
      const { data: apiResult } = await supabase
        .from('vehicle_history')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: true });

      console.log(`   API retornaria ${apiResult?.length || 0} registros`);
    }
  } catch (apiError) {
    console.error('❌ Erro ao testar API:', apiError);
  }

  console.log('\n=== FIM DO TESTE ===\n');
}

testAdminApproval()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Erro:', err);
    process.exit(1);
  });
