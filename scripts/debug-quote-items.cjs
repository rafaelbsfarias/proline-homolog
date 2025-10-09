require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugQuoteItems() {
  // Buscar um quote aprovado de exemplo
  const { data: quotes } = await supabase
    .from('quotes')
    .select('id, partner_id, status, total_value')
    .eq('status', 'approved')
    .limit(5);

  console.log('\n📊 Quotes aprovados encontrados:', quotes?.length || 0);
  console.log();

  if (!quotes || quotes.length === 0) {
    console.log('❌ Nenhum quote aprovado encontrado!');
    return;
  }

  for (const quote of quotes) {
    console.log('─'.repeat(80));
    console.log(`Quote ID: ${quote.id}`);
    console.log(`Status: ${quote.status}`);
    console.log(`Total: R$ ${quote.total_value || 0}`);

    // Buscar itens deste quote
    const { data: items, error } = await supabase
      .from('quote_items')
      .select('*')
      .eq('quote_id', quote.id);

    if (error) {
      console.log(`❌ Erro ao buscar itens: ${error.message}`);
    } else {
      console.log(`\n📋 Itens encontrados: ${items?.length || 0}`);
      
      if (items && items.length > 0) {
        items.forEach((item, idx) => {
          console.log(`\n  ${idx + 1}. ${item.description || 'Sem descrição'}`);
          console.log(`     - Quantidade: ${item.quantity || 0}`);
          console.log(`     - Valor Unit.: R$ ${item.unit_price || 0}`);
          console.log(`     - Total: R$ ${item.total_price || 0}`);
        });
      } else {
        console.log('  ⚠️  NENHUM ITEM cadastrado neste quote!');
      }
    }
    console.log();
  }

  console.log('─'.repeat(80));
  console.log('\n💡 DIAGNÓSTICO:');
  console.log('Se os quotes aprovados não têm itens (quote_items), isso explica');
  console.log('por que a página de evidências fica vazia.');
  console.log('\nSOLUÇÕES:');
  console.log('1. Verificar se o processo de criação de orçamento está salvando os itens');
  console.log('2. Verificar se a tabela quote_items tem dados');
  console.log('3. Testar com um quote que sabemos que tem itens');
}

debugQuoteItems().catch(console.error);
