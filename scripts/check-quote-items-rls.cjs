require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRLS() {
  console.log('🔍 Verificando políticas RLS da tabela quote_items...\n');

  const { data, error } = await supabase.rpc('pg_get_tabledef', {
    table_name: 'quote_items'
  }).then(() => 
    supabase.from('pg_policies')
      .select('*')
      .eq('tablename', 'quote_items')
  );

  if (error) {
    console.log('⚠️  Erro ao buscar políticas, tentando query alternativa...\n');
    
    // Consulta alternativa
    const result = await supabase.from('information_schema.tables')
      .select('*')
      .eq('table_name', 'quote_items');
    
    console.log('Tabela quote_items existe?', result.data && result.data.length > 0);
  }

  // Vamos testar se conseguimos ler os dados com autenticação de partner
  console.log('\n📋 Testando leitura de quote_items...\n');
  
  // Buscar um partner de exemplo
  const { data: partners } = await supabase
    .from('users')
    .select('id, email')
    .eq('role', 'partner')
    .limit(1);

  if (partners && partners.length > 0) {
    const partner = partners[0];
    console.log(`Partner encontrado: ${partner.email} (${partner.id})`);
    
    // Buscar quotes deste partner
    const { data: quotes } = await supabase
      .from('quotes')
      .select('id, status')
      .eq('partner_id', partner.id)
      .eq('status', 'approved')
      .limit(1);

    if (quotes && quotes.length > 0) {
      const quote = quotes[0];
      console.log(`Quote aprovado: ${quote.id}\n`);

      // Testar com service role key (sem RLS)
      console.log('✅ Teste COM service role key (bypass RLS):');
      const { data: itemsWithoutRLS, error: errorWithoutRLS } = await supabase
        .from('quote_items')
        .select('*')
        .eq('quote_id', quote.id);

      console.log(`   Itens encontrados: ${itemsWithoutRLS?.length || 0}`);
      if (errorWithoutRLS) console.log(`   Erro: ${errorWithoutRLS.message}`);

      // Criar cliente autenticado como partner para testar RLS
      console.log('\n🔐 Teste SEM service role key (com RLS simulado):');
      const { data: authData } = await supabase.auth.signInWithPassword({
        email: partner.email,
        password: 'test' // Não vai funcionar, mas mostra o conceito
      });

      console.log('   ⚠️  Não podemos testar autenticação aqui, mas as políticas RLS');
      console.log('   podem estar bloqueando a leitura dos quote_items para partners.\n');

    } else {
      console.log('❌ Nenhum quote aprovado para este partner');
    }
  } else {
    console.log('❌ Nenhum partner encontrado');
  }

  // Verificar se RLS está ativado
  console.log('\n🔒 Verificando se RLS está ativado na tabela quote_items...');
  const { data: rlsStatus } = await supabase
    .from('pg_tables')
    .select('*')
    .eq('tablename', 'quote_items');

  console.log('Status RLS:', rlsStatus);
}

checkRLS().catch(console.error);
