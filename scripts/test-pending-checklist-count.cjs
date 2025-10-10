require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPendingChecklistCount() {
  console.log('🔍 Testando RPC get_pending_checklist_reviews_count...\n');

  try {
    // Tentar executar a função
    console.log('📊 Executando get_pending_checklist_reviews_count...');
    const { data, error } = await supabase.rpc('get_pending_checklist_reviews_count');

    if (error) {
      console.log('❌ Erro ao executar RPC:');
      console.log('   Mensagem:', error.message);
      console.log('   Código:', error.code);
      console.log('   Detalhes:', error.details);
      console.log();

      // Verificar se há inspections finalizadas
      console.log('🔍 Verificando inspections finalizadas...');
      const { data: inspections, error: inspError } = await supabase
        .from('inspections')
        .select('id, finalized, created_at')
        .eq('finalized', true)
        .limit(5);

      if (inspError) {
        console.log('❌ Erro ao buscar inspections:', inspError.message);
      } else {
        console.log(`   Encontradas ${inspections?.length || 0} inspections finalizadas`);
        if (inspections && inspections.length > 0) {
          inspections.forEach((insp, idx) => {
            console.log(`   ${idx + 1}. ID: ${insp.id}`);
          });
        }
      }
      console.log();

      // Verificar se há inspection_delegations
      console.log('🔍 Verificando inspection_delegations...');
      const { data: delegations, error: delError } = await supabase
        .from('inspection_delegations')
        .select('*')
        .limit(5);

      if (delError) {
        console.log('❌ Erro ao buscar delegations:', delError.message);
      } else {
        console.log(`   Encontradas ${delegations?.length || 0} delegations`);
      }

    } else {
      console.log('✅ RPC executada com sucesso!');
      console.log(`   Contagem: ${data}`);
      console.log();

      if (data === 0) {
        console.log('ℹ️  Nenhuma checklist pendente de revisão.');
        console.log('   Isso pode significar:');
        console.log('   - Não há inspections finalizadas');
        console.log('   - Todas as inspections já têm delegations');
      }
    }

  } catch (e) {
    console.log('❌ Erro inesperado:', e.message);
  }
}

testPendingChecklistCount().catch(console.error);
