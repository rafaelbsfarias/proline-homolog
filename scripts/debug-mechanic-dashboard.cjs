require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugMechanicPartner() {
  console.log('\n🔍 DEBUG: Parceiro Mecânica - Inconsistência de Contadores\n');
  console.log('='.repeat(70));

  // Buscar parceiro "Mecânica"
  const { data: partner } = await supabase
    .from('partners')
    .select('profile_id, company_name, profiles!inner(email)')
    .ilike('company_name', '%mecânica%')
    .or('company_name.ilike.%mecanic%')
    .limit(1)
    .single();

  if (!partner) {
    console.log('❌ Parceiro de mecânica não encontrado');
    console.log('\n📋 Listando todos os parceiros:');
    const { data: all } = await supabase
      .from('partners')
      .select('company_name, profiles!inner(email)');
    all?.forEach(p => console.log(`   - ${p.company_name} (${p.profiles.email})`));
    return;
  }

  const partnerId = partner.profile_id;
  console.log(`✅ Parceiro: ${partner.company_name}`);
  console.log(`   ID: ${partnerId}`);
  console.log(`   Email: ${partner.profiles.email}\n`);

  // Buscar  os quotes deste parceiro
  const { data: quotes } = await supabase
    .from('quotes')
    .select(`
      id,
      status,
      total_value,
      sent_to_admin_at,
      created_at,
      service_orders!inner(
        vehicles!inner(plate, brand, model)
      )
    `)
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false });

  console.log(`📊 Total de Quotes: ${quotes?.length || 0}\n`);

  if (!quotes || quotes.length === 0) {
    console.log('⚠️  Nenhum quote encontrado para este parceiro');
    return;
  }

  // Agrupar por status
  const byStatus = {};
  quotes.forEach(q => {
    const st = q.status || 'NULL';
    if (!byStatus[st]) byStatus[st] = [];
    byStatus[st].push(q);
  });

  console.log('📋 Detalhamento por Status:\n');
  Object.keys(byStatus).sort().forEach(status => {
    const items = byStatus[status];
    console.log(`   🏷️  ${status} (${items.length})`);
    items.forEach(q => {
      const veh = q.service_orders?.vehicles;
      console.log(`      - ${veh?.brand} ${veh?.model} (${veh?.plate})`);
      console.log(`        Valor: R$ ${q.total_value || 0}`);
      console.log(`        Criado: ${new Date(q.created_at).toLocaleString('pt-BR')}`);
      if (q.sent_to_admin_at) {
        console.log(`        ✉️  Enviado Admin: ${new Date(q.sent_to_admin_at).toLocaleString('pt-BR')}`);
      } else {
        console.log(`        ⏳ Ainda não enviado ao admin`);
      }
    });
    console.log();
  });

  console.log('='.repeat(70));
  console.log('\n🧮 SIMULAÇÃO DOS CONTADORES (lógica da RPC):\n');

  // Simular contadores da RPC
  const pending = quotes.filter(q => q.status === 'pending_partner').length;
  const inAnalysis = quotes.filter(q => 
    ['pending_admin_approval', 'admin_review', 'pending_client_approval'].includes(q.status) &&
    (q.total_value || 0) > 0
  ).length;
  const approved = quotes.filter(q => q.status === 'approved').length;
  const rejected = quotes.filter(q => q.status === 'rejected').length;

  console.log(`   ⏳ Pendente (pending_partner): ${pending}`);
  console.log(`   🔍 Em Análise (pending_admin/client + valor > 0): ${inAnalysis}`);
  console.log(`   ✅ Aprovado: ${approved}`);
  console.log(`   ❌ Rejeitado: ${rejected}\n`);

  console.log('='.repeat(70));
  console.log('\n📋 SIMULAÇÃO DA LISTA "Pendentes" (lógica da RPC):\n');

  // Simular lista pending_quotes
  const pendingList = quotes.filter(q =>
    q.status === 'pending_partner' ||
    ['pending_admin_approval', 'admin_review', 'pending_client_approval'].includes(q.status)
  );

  console.log(`   Total de itens na lista: ${pendingList.length}\n`);
  pendingList.forEach((q, i) => {
    const veh = q.service_orders?.vehicles;
    console.log(`   ${i + 1}. ${veh?.brand} ${veh?.model} (${veh?.plate})`);
    console.log(`      Status: ${q.status}`);
    console.log(`      Valor: R$ ${q.total_value || 0}`);
    console.log(`      Enviado ao admin: ${q.sent_to_admin_at ? 'SIM' : 'NÃO'}`);
    console.log();
  });

  console.log('='.repeat(70));
  console.log('\n⚠️  ANÁLISE DO PROBLEMA:\n');

  console.log(`   📊 Contador exibido: ${pending}`);
  console.log(`   📋 Itens na lista: ${pendingList.length}`);

  if (pending !== pendingList.length) {
    console.log('\n   ❌ INCONSISTÊNCIA CONFIRMADA!\n');
    console.log('   🔍 Causa:');
    console.log('      - Contador conta APENAS status="pending_partner"');
    console.log('      - Lista inclui pending_partner + em análise (pending_admin/client)');
    console.log('\n   💡 Solução:');
    console.log('      - Opção 1: Contador deve contar pending_partner + em análise');
    console.log('      - Opção 2: Lista deve mostrar APENAS pending_partner');
    console.log('      - Opção 3: Separar em duas listas diferentes');

    const notCounted = pendingList.filter(q => q.status !== 'pending_partner');
    if (notCounted.length > 0) {
      console.log('\n   📝 Quotes na lista MAS NÃO contados:');
      notCounted.forEach(q => {
        const veh = q.service_orders?.vehicles;
        console.log(`      - ${veh?.brand} ${veh?.model}: ${q.status}`);
      });
    }
  } else {
    console.log('\n   ✅ Contador e lista estão consistentes');
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

debugMechanicPartner().catch(console.error);
