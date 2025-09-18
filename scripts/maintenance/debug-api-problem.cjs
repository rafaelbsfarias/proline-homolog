const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

(async () => {
  console.log('🔍 INVESTIGANDO PROBLEMA NA API');
  console.log('==============================');
  
  const quoteId = '57306036-9de7-4676-a6fa-1a1f0fee298d';
  const partnerId = '5713fa01-3475-4c52-ad64-5230285adef1';
  
  // Verificar se o quote existe
  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .select('id, partner_id')
    .eq('id', quoteId);
    
  console.log('📋 Quote encontrado:', !!quote);
  if (quote && quote.length > 0) {
    console.log('   Partner ID no quote:', quote[0].partner_id);
    console.log('   Partner ID esperado:', partnerId);
    console.log('   IDs coincidem:', quote[0].partner_id === partnerId);
  } else {
    console.log('   Erro:', quoteError);
  }
  
  // Tentar a mesma consulta que a API faz
  console.log('\n🔍 TESTANDO CONSULTA DA API');
  const { data: fullQuote, error: fullError } = await supabase
    .from('quotes')
    .select(`
      id,
      total_value,
      status,
      created_at,
      updated_at,
      supplier_delivery_date,
      service_order_id,
      partner_id,
      service_orders (
        id,
        order_code,
        vehicle_id,
        vehicles (
          id,
          plate,
          brand,
          model,
          year,
          color
        )
      )
    `)
    .eq('id', quoteId)
    .eq('partner_id', partnerId)
    .single();
    
  if (fullQuote) {
    console.log('✅ Consulta da API funcionou!');
    console.log('   Quote ID:', fullQuote.id);
    console.log('   Veículo:', fullQuote.service_orders?.vehicles?.plate);
  } else {
    console.log('❌ Erro na consulta da API:', fullError);
  }
})();
