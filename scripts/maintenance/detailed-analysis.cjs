require('dotenv').config({ path: '.env.local' });

/**
 * Análise detalhada das inconsistências e dados mockados
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function detailedAnalysis() {
  console.log('🔍 ANÁLISE DETALHADA DE INCONSISTÊNCIAS');
  console.log('========================================\n');

  try {
    // 1. VERIFICAÇÃO DE TABELAS DE ORÇAMENTO
    console.log('1. VERIFICAÇÃO DE TABELAS DE ORÇAMENTO');
    console.log('======================================');
    
    const { data: quotes, error: quotesError } = await supabase.from('quotes').select('id').limit(1);
    if (quotesError) console.log('❌ Tabela "quotes" não encontrada, mas é esperada.');
    else console.log('✅ Tabela "quotes" (para orçamentos) encontrada.');

    const { data: quoteItems, error: itemsError } = await supabase.from('quote_items').select('id').limit(1);
    if (itemsError) console.log('❌ Tabela "quote_items" não encontrada, mas é esperada.');
    else console.log('✅ Tabela "quote_items" (para itens de orçamento) encontrada.');

    // Check for obsolete tables
    const { data: oldBudget } = await supabase.from('partner_budgets').select('id').limit(1);
    if (oldBudget) console.log('⚠️  Tabela obsoleta "partner_budgets" ainda existe. Considere remover.');

    const { data: oldBudgetItems } = await supabase.from('partner_budget_items').select('id').limit(1);
    if (oldBudgetItems) console.log('⚠️  Tabela obsoleta "partner_budget_items" ainda existe. Considere remover.');


    // 2. DADOS MOCKADOS IDENTIFICADOS
    console.log('\n2. DADOS MOCKADOS IDENTIFICADOS');
    console.log('==============================');

    // Veículos mockados
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('plate, brand, model, year')
      .like('plate', 'ABC%')
      .limit(10);

    console.log('🚗 VEÍCULOS MOCKADOS:');
    vehicles?.forEach(v => {
      console.log(`   ${v.plate} - ${v.brand} ${v.model} (${v.year})`);
    });

    // Quotes com valor zero
    const { data: zeroQuotes } = await supabase
      .from('quotes')
      .select('id, total_value, status, partner_id')
      .eq('total_value', 0);

    console.log('\n💰 QUOTES COM VALOR ZERO (MOCKADOS):');
    zeroQuotes?.forEach(q => {
      console.log(`   ${q.id.slice(0, 8)} - Status: ${q.status} - Partner: ${q.partner_id.slice(0, 8)}`);
    });

    // Partners com dados fictícios
    const { data: partners } = await supabase
      .from('partners')
      .select('profile_id, company_name, cnpj')
      .like('company_name', '%Oficina Parceira%');

    console.log('\n🏢 PARTNERS COM NOMES MOCKADOS:');
    partners?.forEach(p => {
      console.log(`   ${p.company_name} - CNPJ: ${p.cnpj}`);
    });

    // 3. RELACIONAMENTOS ÓRFÃOS
    console.log('\n3. RELACIONAMENTOS ÓRFÃOS');
    console.log('=========================');

    const { data: allQuotes } = await supabase
      .from('quotes')
      .select('id, service_order_id, partner_id');

    for (const quote of allQuotes || []) {
      // Verificar se service_order existe
      const { data: so } = await supabase
        .from('service_orders')
        .select('id')
        .eq('id', quote.service_order_id)
        .single();

      if (!so) {
        console.log(`❌ Quote ${quote.id.slice(0, 8)} → Service Order inexistente`);
      }

      // Verificar se partner existe
      const { data: partner } = await supabase
        .from('partners')
        .select('profile_id')
        .eq('profile_id', quote.partner_id)
        .single();

      if (!partner) {
        console.log(`❌ Quote ${quote.id.slice(0, 8)} → Partner inexistente`);
      }
    }

  } catch (error) {
    console.error('💥 Erro:', error);
  }
}

detailedAnalysis();
