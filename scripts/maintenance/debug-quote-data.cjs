const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function debugQuoteData() {
  console.log('🔍 === VERIFICAÇÃO DE DADOS DO QUOTE ===');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const quoteId = '57306036-9de7-4676-a6fa-1a1f0fee298d';
  const partnerId = '5713fa01-3475-4c52-ad64-5230285adef1';

  try {
    console.log('📋 Verificando dados na tabela quotes...');
    
    // 1. Verificar se o quote existe
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId);

    if (quotesError) {
      console.error('❌ Erro ao buscar quotes:', quotesError);
      return;
    }

    console.log('✅ Quotes encontrados:', quotes?.length || 0);
    if (quotes && quotes.length > 0) {
      console.log('📄 Dados do quote:', JSON.stringify(quotes[0], null, 2));
    }

    // 2. Verificar quotes por partner_id
    const { data: partnerQuotes, error: partnerQuotesError } = await supabase
      .from('quotes')
      .select('*')
      .eq('partner_id', partnerId);

    if (partnerQuotesError) {
      console.error('❌ Erro ao buscar quotes do partner:', partnerQuotesError);
      return;
    }

    console.log('✅ Quotes do partner encontrados:', partnerQuotes?.length || 0);
    if (partnerQuotes && partnerQuotes.length > 0) {
      console.log('📄 Quotes do partner:');
      partnerQuotes.forEach((quote, index) => {
        console.log(`  ${index + 1}. ID: ${quote.id} | Status: ${quote.status} | Partner: ${quote.partner_id} | Total: ${quote.total_value}`);
      });
    }

    // 3. Verificar se existem quote_items para este quote
    const { data: quoteItems, error: itemsError } = await supabase
      .from('quote_items')
      .select('*')
      .eq('quote_id', quoteId);

    if (itemsError) {
      console.error('❌ Erro ao buscar quote_items:', itemsError);
    } else {
      console.log('✅ Quote items encontrados:', quoteItems?.length || 0);
      if (quoteItems && quoteItems.length > 0) {
        console.log('📄 Quote items:', JSON.stringify(quoteItems, null, 2));
      }
    }

    // 4. Verificar se existe service_order relacionado
    if (quotes && quotes[0] && quotes[0].service_order_id) {
      const { data: serviceOrders, error: soError } = await supabase
        .from('service_orders')
        .select('*')
        .eq('id', quotes[0].service_order_id);

      if (soError) {
        console.error('❌ Erro ao buscar service_orders:', soError);
      } else {
        console.log('✅ Service orders encontrados:', serviceOrders?.length || 0);
        if (serviceOrders && serviceOrders.length > 0) {
          console.log('📄 Service order data:', JSON.stringify(serviceOrders[0], null, 2));
        }
      }
    }

    // 5. Verificar se a tabela partners existe e se o partner está lá
    const { data: partners, error: partnersError } = await supabase
      .from('partners')
      .select('*')
      .eq('profile_id', partnerId);

    if (partnersError) {
      console.error('❌ Erro ao buscar partners (pode não existir):', partnersError);
    } else {
      console.log('✅ Partners encontrados:', partners?.length || 0);
      if (partners && partners.length > 0) {
        console.log('📄 Partner data:', JSON.stringify(partners[0], null, 2));
      }
    }

  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }

  console.log('🔍 === FIM DA VERIFICAÇÃO ===');
}

debugQuoteData();
