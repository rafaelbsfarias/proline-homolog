#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugPartnerQuotes() {
  console.log('\n🔍 === VERIFICANDO QUOTES PARA PARCEIROS ===\n');

  // 1. Buscar todas as quotes
  const { data: allQuotes, error: quotesError } = await supabase
    .from('quotes')
    .select(`
      id,
      status,
      partner_id,
      service_order_id,
      total_value,
      created_at
    `)
    .order('created_at', { ascending: false });

  if (quotesError) {
    console.log('❌ Erro ao buscar quotes:', quotesError);
    return;
  }

  console.log(`📦 TOTAL DE QUOTES: ${allQuotes?.length || 0}\n`);

  if (allQuotes && allQuotes.length > 0) {
    console.log('📋 QUOTES POR STATUS:\n');
    
    const byStatus = {};
    allQuotes.forEach(q => {
      byStatus[q.status] = (byStatus[q.status] || 0) + 1;
    });

    Object.entries(byStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    console.log();

    // 2. Para cada quote, buscar detalhes do parceiro
    console.log('📄 DETALHES DAS QUOTES:\n');

    for (const quote of allQuotes.slice(0, 5)) { // Mostrar apenas as 5 mais recentes
      console.log(`Quote ID: ${quote.id}`);
      console.log(`  Status: ${quote.status}`);
      console.log(`  Partner ID: ${quote.partner_id}`);
      console.log(`  Service Order: ${quote.service_order_id}`);
      console.log(`  Valor: ${quote.total_value}`);
      console.log(`  Criado em: ${new Date(quote.created_at).toLocaleString()}`);

      // Buscar nome do parceiro
      const { data: partner } = await supabase
        .from('partners')
        .select('company_name')
        .eq('profile_id', quote.partner_id)
        .single();

      if (partner) {
        console.log(`  Parceiro: ${partner.company_name}`);
      }

      // Buscar service order
      const { data: so } = await supabase
        .from('service_orders')
        .select('order_code, service_categories(name)')
        .eq('id', quote.service_order_id)
        .single();

      if (so) {
        console.log(`  SO: ${so.order_code} - ${so.service_categories?.name}`);
      }

      console.log();
    }
  }

  // 3. Verificar o que a RPC do dashboard retorna
  console.log('🔍 TESTANDO RPC get_partner_dashboard_data:\n');

  // Pegar um partner_id
  const { data: firstPartner } = await supabase
    .from('partners')
    .select('profile_id, company_name')
    .limit(1)
    .single();

  if (firstPartner) {
    console.log(`Testando com parceiro: ${firstPartner.company_name}`);
    console.log(`Partner ID: ${firstPartner.profile_id}\n`);

    const { data: dashboardData, error: rpcError } = await supabase
      .rpc('get_partner_dashboard_data', {
        partner_profile_id: firstPartner.profile_id
      });

    if (rpcError) {
      console.log('❌ Erro na RPC:', rpcError);
    } else {
      console.log('✓ RPC executada com sucesso');
      console.log('Resultado:', JSON.stringify(dashboardData, null, 2));
    }
  }

  console.log('\n================================================================================\n');
}

debugPartnerQuotes().catch(console.error);
