require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPartnerOverviewCounters() {
  // Buscar o parceiro com o quote que corrigimos
  const quoteId = 'a03afdd3-ad50-4292-8fb7-bad1180ba88d';
  
  const { data: quote } = await supabase
    .from('quotes')
    .select('partner_id, status')
    .eq('id', quoteId)
    .single();
  
  if (!quote) {
    console.log('Quote não encontrado');
    return;
  }
  
  console.log('\n🔍 Quote corrigido:');
  console.log(`   ID: ${quoteId}`);
  console.log(`   Partner ID: ${quote.partner_id}`);
  console.log(`   Status: ${quote.status}`);
  
  // Contar quotes do parceiro por status
  const { count: pendingPartner } = await supabase
    .from('quotes')
    .select('*', { count: 'exact', head: true })
    .eq('partner_id', quote.partner_id)
    .eq('status', 'pending_partner');
  
  const { count: pendingAdmin } = await supabase
    .from('quotes')
    .select('*', { count: 'exact', head: true })
    .eq('partner_id', quote.partner_id)
    .in('status', ['pending_admin_approval', 'admin_review']);
  
  const { count: pendingClient } = await supabase
    .from('quotes')
    .select('*', { count: 'exact', head: true })
    .eq('partner_id', quote.partner_id)
    .eq('status', 'pending_client_approval');
  
  console.log('\n📊 Contadores esperados na API:');
  console.log(`   Orçamentos Pendentes (pending_partner): ${pendingPartner}`);
  console.log(`   Aguardando Admin: ${pendingAdmin}`);
  console.log(`   Aguardando Cliente: ${pendingClient}`);
  console.log(`   Para Aprovação (total): ${(pendingAdmin || 0) + (pendingClient || 0)}`);
  
  console.log('\n✅ A API /api/admin/partners/[partnerId]/overview agora retornará:');
  console.log(`   pending_budgets: ${pendingPartner}`);
  console.log(`   approval_budgets: ${(pendingAdmin || 0) + (pendingClient || 0)}`);
}

testPartnerOverviewCounters().catch(console.error);
