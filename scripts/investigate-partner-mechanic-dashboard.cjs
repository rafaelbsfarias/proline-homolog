require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function investigatePartnerDashboard() {
  console.log('\n🔍 Investigando Dashboard do Parceiro de Mecânica\n');
  console.log('='.repeat(60));

  // Buscar parceiro de mecânica
  const { data: mechanicsPartner } = await supabase
    .from('partners')
    .select('profile_id, company_name, profiles!inner(full_name, email)')
    .ilike('company_name', '%mecânica%')
    .limit(1)
    .single();

  if (!mechanicsPartner) {
    console.log('❌ Parceiro de mecânica não encontrado');
    return;
  }

  const partnerId = mechanicsPartner.profile_id;
  console.log('✅ Parceiro encontrado:');
  console.log(`   ID: ${partnerId}`);
  console.log(`   Empresa: ${mechanicsPartner.company_name}`);
  console.log(`   Email: ${mechanicsPartner.profiles.email}`);
  console.log();

  // Buscar  os quotes deste parceiro
  const { data: allQuotes } = await supabase
    .from('quotes')
    .select(`
      id,
      status,
      total_value,
      sent_to_admin_at,
      created_at,
      service_orders!inner(
        id,
        vehicles!inner(plate, brand, model)
      )
    `)
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false });

  console.log(`📊 Total de Quotes: ${allQuotes?.length || 0}\n`);

  // Agrupar por status
  const byStatus = {};
  allQuotes?.forEach(q => {
    const status = q.status || 'NULL';
    if (!byStatus[status]) byStatus[status] = [];
    byStatus[status].push(q);
  });

  console.log('📋 Quotes por Status:');
  console.log('-'.repeat(60));
  Object.keys(byStatus).sort().forEach(status => {
    const quotes = byStatus[status];
    console.log(`\n   ${status} (${quotes.length} quote${quotes.length > 1 ? 's' : ''})`);
    quotes.forEach((q, i) => {
      const vehicle = q.service_orders?.vehicles;
      const vehicleInfo = vehicle 
        ? `${vehicle.brand} ${vehicle.model} (${vehicle.plate})`
        : 'N/A';
      console.log(`      ${i + 1}. ID: ${q.id.substring(0, 8)}...`);
      console.log(`         Veículo: ${vehicleInfo}`);
      console.log(`         Valor: R$ ${q.total_value || 0}`);
      console.log(`         Criado: ${new Date(q.created_at).toLocaleString('pt-BR')}`);
      if (q.sent_to_admin_at) {
        console.log(`         Enviado Admin: ${new Date(q.sent_to_admin_at).toLocaleString('pt-BR')}`);
      }
    });
  });

  console.log('\n' + '='.repeat(60));
  console.log('\n🧮 Contadores conforme a RPC:');
  console.log('-'.repeat(60));

  // Simular lógica da RPC
  const total = allQuotes?.length || 0;
  const pending = allQuotes?.filter(q => q.status === 'pending_partner').length || 0;
  const inAnalysis = allQuotes?.filter(q => 
    ['pending_admin_approval', 'admin_review', 'pending_client_approval'].includes(q.status) &&
    q.total_value > 0
  ).length || 0;
  const approved = allQuotes?.filter(q => q.status === 'approved').length || 0;
  const rejected = allQuotes?.filter(q => q.status === 'rejected').length || 0;

  console.log(`   Total: ${total}`);
  console.log(`   Pendente (pending_partner): ${pending}`);
  console.log(`   Em Análise (pending_admin/client + total_value > 0): ${inAnalysis}`);
  console.log(`   Aprovado: ${approved}`);
  console.log(`   Rejeitado: ${rejected}`);

  console.log('\n' + '='.repeat(60));
  console.log('\n📋 Quotes na Lista "Pendentes" (conforme RPC):');
  console.log('-'.repeat(60));

  // Simular query de pending_quotes da RPC
  const pendingList = allQuotes?.filter(q => 
    q.status === 'pending_partner' ||
    ['pending_admin_approval', 'admin_review', 'pending_client_approval'].includes(q.status)
  ) || [];

  console.log(`   Total na lista: ${pendingList.length}\n`);
  pendingList.forEach((q, i) => {
    const vehicle = q.service_orders?.vehicles;
    const vehicleInfo = vehicle 
      ? `${vehicle.brand} ${vehicle.model} (${vehicle.plate})`
      : 'N/A';
    console.log(`   ${i + 1}. ${vehicleInfo}`);
    console.log(`      Status: ${q.status}`);
    console.log(`      Valor: R$ ${q.total_value || 0}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('\n⚠️  PROBLEMA IDENTIFICADO:');
  console.log('-'.repeat(60));
  console.log(`   Contador "Pendente": ${pending}`);
  console.log(`   Itens na lista "Pendentes": ${pendingList.length}`);
  
  if (pending !== pendingList.length) {
    console.log('\n   ❌ INCONSISTÊNCIA DETECTADA!');
    console.log(`   - O contador mostra apenas quotes com status "pending_partner"`);
    console.log(`   - A lista mostra  (pending_partner + em análise)`);
    console.log(`   - Diferença: ${pendingList.length - pending} item(s)`);
    
    const inListButNotCounted = pendingList.filter(q => q.status !== 'pending_partner');
    if (inListButNotCounted.length > 0) {
      console.log('\n   📝 Quotes listados mas NÃO contados:');
      inListButNotCounted.forEach(q => {
        const vehicle = q.service_orders?.vehicles;
        const vehicleInfo = vehicle 
          ? `${vehicle.brand} ${vehicle.model} (${vehicle.plate})`
          : 'N/A';
        console.log(`      - ${vehicleInfo} (status: ${q.status})`);
      });
    }
  } else {
    console.log('   ✅ Contador e lista estão consistentes');
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n🔍 Verificando estado dos veículos:');
  console.log('-'.repeat(60));

  for (const quote of allQuotes || []) {
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('id, plate, status')
      .eq('id', quote.service_orders.vehicles.id)
      .single();

    if (vehicle) {
      console.log(`   ${vehicle.plate}: status = "${vehicle.status || 'NULL'}"`);
    }
  }

  console.log('\n✅ Investigação concluída!\n');
}

investigatePartnerDashboard().catch(console.error);
