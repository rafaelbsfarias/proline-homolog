require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixPrematureStatusQuote() {
  console.log('\n🔧 Corrigindo quote com status prematuro...\n');
  
  const quoteId = 'a03afdd3-ad50-4292-8fb7-bad1180ba88d';
  
  // 1. Verificar estado atual
  const { data: quote, error: loadError } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', quoteId)
    .single();
  
  if (loadError || !quote) {
    console.error('❌ Erro ao carregar quote:', loadError?.message || 'Quote não encontrado');
    return;
  }
  
  console.log('📊 Estado atual do quote:');
  console.log(`   ID: ${quote.id}`);
  console.log(`   Status: ${quote.status}`);
  console.log(`   Total: R$ ${quote.total_value || 0}`);
  console.log(`   Enviado admin: ${quote.sent_to_admin_at || 'NULL'}`);
  console.log(`   Aprovação admin: ${quote.admin_approval_date || 'NULL'}`);
  console.log();
  
  // 2. Confirmar que é o quote problemático
  if (quote.status !== 'pending_client_approval' || quote.sent_to_admin_at !== null) {
    console.log('ℹ️  Este quote não precisa de correção.');
    return;
  }
  
  // 3. Resetar para pending_partner (status inicial correto)
  console.log('🔄 Resetando status para pending_partner...');
  
  const { error: updateError } = await supabase
    .from('quotes')
    .update({
      status: 'pending_partner',
      updated_at: new Date().toISOString()
    })
    .eq('id', quoteId);
  
  if (updateError) {
    console.error('❌ Erro ao atualizar quote:', updateError.message);
    return;
  }
  
  console.log('✅ Status corrigido com sucesso!');
  
  // 4. Verificar se há service order relacionada
  const { data: serviceOrder } = await supabase
    .from('service_orders')
    .select('vehicle_id')
    .eq('quote_id', quoteId)
    .single();
  
  if (serviceOrder) {
    // 5. Atualizar status do veículo se necessário
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('status')
      .eq('id', serviceOrder.vehicle_id)
      .single();
    
    if (vehicle && vehicle.status === 'Fase Orçamentaria') {
      console.log('\n🔄 Atualizando status do veículo...');
      
      await supabase
        .from('vehicles')
        .update({ status: 'Aguardando Checklist' })
        .eq('id', serviceOrder.vehicle_id);
      
      console.log('✅ Status do veículo corrigido!');
    }
  }
  
  // 6. Verificar resultado final
  const { data: fixedQuote } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', quoteId)
    .single();
  
  console.log('\n📊 Estado final do quote:');
  console.log(`   Status: ${fixedQuote.status}`);
  console.log(`   Total: R$ ${fixedQuote.total_value || 0}`);
  console.log();
  console.log('✨ Correção concluída!');
}

fixPrematureStatusQuote().catch(console.error);
