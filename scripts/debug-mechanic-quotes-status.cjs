require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const partnerId = '291648e6-79eb-44ea-a2c8-ceb140e155bc'; // Extraído do token

async function debugMechanicQuotes() {
  console.log('\n🔍 DEBUG: Quotes do Parceiro Mecânica\n');
  console.log('='.repeat(70));
  console.log(`Partner ID: ${partnerId}\n`);

  // Buscar  os quotes deste parceiro
  const { data: quotes, error } = await supabase
    .from('quotes')
    .select(`
      id,
      status,
      total_value,
      sent_to_admin_at,
      created_at,
      service_orders!inner(
        id,
        vehicles!inner(id, plate, brand, model, year, status)
      )
    `)
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.log('❌ Erro ao buscar quotes:', error);
    return;
  }

  console.log(`📊 Total de Quotes: ${quotes?.length || 0}\n`);

  if (!quotes || quotes.length === 0) {
    console.log('⚠️  Nenhum quote encontrado');
    return;
  }

  console.log('📋 Detalhamento de  os Quotes:\n');
  quotes.forEach((q, i) => {
    const veh = Array.isArray(q.service_orders.vehicles) 
      ? q.service_orders.vehicles[0] 
      : q.service_orders.vehicles;
    
    console.log(`${i + 1}. Quote ID: ${q.id.substring(0, 8)}...`);
    console.log(`   Status: "${q.status}"`);
    console.log(`   Veículo: ${veh?.brand} ${veh?.model} (${veh?.plate})`);
    console.log(`   Veículo Status: "${veh?.status || 'NULL'}"`);
    console.log(`   Valor: R$ ${q.total_value || 0}`);
    console.log(`   Criado: ${new Date(q.created_at).toLocaleString('pt-BR')}`);
    if (q.sent_to_admin_at) {
      console.log(`   ✉️  Enviado Admin: ${new Date(q.sent_to_admin_at).toLocaleString('pt-BR')}`);
    } else {
      console.log(`   ⏳ Ainda NÃO enviado ao admin`);
    }
    console.log();
  });

  console.log('='.repeat(70));
  console.log('\n🧮 Análise por Status:\n');

  const byStatus = {};
  quotes.forEach(q => {
    const st = q.status || 'NULL';
    if (!byStatus[st]) byStatus[st] = 0;
    byStatus[st]++;
  });

  Object.keys(byStatus).sort().forEach(status => {
    console.log(`   ${status}: ${byStatus[status]}`);
  });

  console.log('\n' + '='.repeat(70));
  console.log('\n❓ O QUE DEVERIA APARECER NA LISTA?\n');

  // Verificar o que a RPC ANTIGA retornava
  console.log('📋 Lógica ANTIGA (que mostrava 1 item):');
  const oldLogic = quotes.filter(q =>
    q.status === 'pending_partner' ||
    ['pending_admin_approval', 'admin_review', 'pending_client_approval'].includes(q.status)
  );
  console.log(`   Total: ${oldLogic.length}`);
  oldLogic.forEach(q => {
    const veh = Array.isArray(q.service_orders.vehicles) 
      ? q.service_orders.vehicles[0] 
      : q.service_orders.vehicles;
    console.log(`   - ${veh?.brand} ${veh?.model}: status="${q.status}"`);
  });

  console.log('\n📋 Lógica NOVA (apenas pending_partner):');
  const newLogic = quotes.filter(q => q.status === 'pending_partner');
  console.log(`   Total: ${newLogic.length}`);
  if (newLogic.length > 0) {
    newLogic.forEach(q => {
      const veh = Array.isArray(q.service_orders.vehicles) 
        ? q.service_orders.vehicles[0] 
        : q.service_orders.vehicles;
      console.log(`   - ${veh?.brand} ${veh?.model}: status="${q.status}"`);
    });
  } else {
    console.log('   (nenhum)');
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n💡 DIAGNÓSTICO:\n');

  if (oldLogic.length > 0 && newLogic.length === 0) {
    console.log('   ⚠️  O quote que aparecia antes tinha status diferente de "pending_partner"');
    console.log('   ⚠️  Provavelmente: pending_admin_approval, admin_review ou pending_client_approval');
    console.log('\n   🤔 QUESTÃO:');
    console.log('      - O parceiro JÁ ENVIOU esse quote para o admin?');
    console.log('      - Se SIM: correto não aparecer na lista "Pendentes"');
    console.log('      - Se NÃO: há um problema no fluxo de atualização de status');
    
    const inAnalysis = oldLogic.filter(q => 
      ['pending_admin_approval', 'admin_review', 'pending_client_approval'].includes(q.status)
    );
    
    if (inAnalysis.length > 0) {
      console.log('\n   📝 Quotes "em análise" que sumiu da lista:');
      inAnalysis.forEach(q => {
        const veh = Array.isArray(q.service_orders.vehicles) 
          ? q.service_orders.vehicles[0] 
          : q.service_orders.vehicles;
        console.log(`      - ${veh?.brand} ${veh?.model}`);
        console.log(`        Status: ${q.status}`);
        console.log(`        Enviado admin: ${q.sent_to_admin_at ? 'SIM' : 'NÃO'}`);
        console.log(`        Valor: R$ ${q.total_value || 0}`);
      });
    }
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

debugMechanicQuotes().catch(console.error);
