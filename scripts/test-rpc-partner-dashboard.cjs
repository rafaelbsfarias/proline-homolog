require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testRPCDirectly() {
  console.log('\n🔍 Testando função RPC get_partner_dashboard_data\n');
  console.log('='.repeat(70));

  // Primeiro, buscar o parceiro "Mecânica" pelo nome do perfil
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .ilike('full_name', '%mecânica%')
    .limit(5);

  console.log('\n📋 Perfis encontrados com "mecânica":\n');
  if (profiles && profiles.length > 0) {
    profiles.forEach((p, i) => {
      console.log(`${i + 1}. ${p.full_name}`);
      console.log(`   Email: ${p.email}`);
      console.log(`   ID: ${p.id}\n`);
    });

    // Testar RPC para cada um
    for (const profile of profiles) {
      console.log(`\n🔍 Testando RPC para: ${profile.full_name}`);
      console.log('-'.repeat(70));

      const { data, error } = await supabase.rpc('get_partner_dashboard_data', {
        p_partner_id: profile.id
      });

      if (error) {
        console.log(`❌ Erro: ${error.message}`);
        continue;
      }

      if (!data) {
        console.log('⚠️  Sem dados retornados');
        continue;
      }

      console.log('\n📊 Dados retornados:\n');
      console.log(JSON.stringify(data, null, 2));

      // Análise dos contadores
      const counters = data.budget_counters || {};
      const pendingQuotes = data.pending_quotes || {};

      console.log('\n📈 Análise:');
      console.log(`   Contador "pending": ${counters.pending || 0}`);
      console.log(`   Contador "in_analysis": ${counters.in_analysis || 0}`);
      console.log(`   Items na lista pending_quotes: ${pendingQuotes.count || 0}`);

      if (counters.pending !== pendingQuotes.count) {
        console.log('\n   ⚠️  INCONSISTÊNCIA DETECTADA!');
        console.log(`   - Contador mostra: ${counters.pending}`);
        console.log(`   - Lista tem: ${pendingQuotes.count} item(s)`);

        if (pendingQuotes.items && pendingQuotes.items.length > 0) {
          console.log('\n   📝 Itens na lista:');
          pendingQuotes.items.forEach((item, i) => {
            console.log(`      ${i + 1}. Status: ${item.status}`);
            console.log(`         Valor: R$ ${item.total_value || 0}`);
            console.log(`         Veículo: ${item.vehicle_info || 'N/A'}`);
          });
        }
      }
    }
  } else {
    console.log('❌ Nenhum perfil encontrado com "mecânica"');
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

testRPCDirectly().catch(console.error);
