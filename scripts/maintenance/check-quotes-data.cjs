const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function checkQuotesData() {
  console.log('🔍 === VERIFICAÇÃO DE DADOS DE QUOTES ===');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Verificar quantas quotes existem na tabela usando o service role (sem RLS)
    console.log('📊 Contando quotes diretamente na tabela...');
    const { count: totalQuotes, error: countError } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Erro ao contar quotes:', countError);
    } else {
      console.log('✅ Total de quotes na tabela:', totalQuotes);
    }

    // Buscar todas as quotes diretamente
    console.log('\n📋 Buscando todas as quotes...');
    const { data: allQuotes, error: allQuotesError } = await supabase
      .from('quotes')
      .select('*');

    if (allQuotesError) {
      console.error('❌ Erro ao buscar todas as quotes:', allQuotesError);
    } else {
      console.log('✅ Quotes encontradas:', allQuotes?.length || 0);
      if (allQuotes && allQuotes.length > 0) {
        allQuotes.forEach((quote, index) => {
          console.log(`  ${index + 1}. ID: ${quote.id}`);
          console.log(`      Partner ID: ${quote.partner_id}`);
          console.log(`      Status: ${quote.status}`);
          console.log(`      Created: ${quote.created_at}`);
        });
      }
    }

    // Buscar quotes especificamente para o partner ID
    const partnerId = '86e44b50-3ecd-4d24-bb69-35a83ae09f8a';
    console.log(`\n🎯 Buscando quotes para o partner ID: ${partnerId}...`);
    
    const { data: partnerQuotes, error: partnerQuotesError } = await supabase
      .from('quotes')
      .select('*')
      .eq('partner_id', partnerId);

    if (partnerQuotesError) {
      console.error('❌ Erro ao buscar quotes do partner:', partnerQuotesError);
    } else {
      console.log('✅ Quotes do partner encontradas:', partnerQuotes?.length || 0);
    }

    // Verificar RLS policies
    console.log('\n🔒 Verificando políticas RLS da tabela quotes...');
    const { data: policies, error: policiesError } = await supabase
      .from('information_schema.tables')
      .select('*')
      .eq('table_name', 'quotes');

    if (policiesError) {
      console.error('❌ Erro ao buscar informações da tabela:', policiesError);
    }

    // Tentar desabilitar RLS temporariamente e testar
    console.log('\n🚫 Tentando consultar sem RLS (como service role)...');
    const { data: quotesWithoutRLS, error: noRLSError } = await supabase
      .from('quotes')
      .select(`
        *,
        service_orders:service_order_id (
          *,
          vehicles (*)
        )
      `);

    if (noRLSError) {
      console.error('❌ Erro ao buscar quotes sem RLS:', noRLSError);
    } else {
      console.log('✅ Quotes sem RLS encontradas:', quotesWithoutRLS?.length || 0);
      if (quotesWithoutRLS && quotesWithoutRLS.length > 0) {
        quotesWithoutRLS.forEach((quote, index) => {
          console.log(`  ${index + 1}. Quote ID: ${quote.id}`);
          console.log(`      Partner ID: ${quote.partner_id}`);
          console.log(`      Service Order: ${quote.service_order_id}`);
          if (quote.service_orders) {
            console.log(`      Vehicle: ${quote.service_orders.vehicles?.license_plate}`);
          }
        });
      }
    }

  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }

  console.log('🔍 === FIM DA VERIFICAÇÃO ===');
}

checkQuotesData();
