import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanInvalidEvidences() {
  console.log('🧹 LIMPANDO EVIDÊNCIAS INVÁLIDAS');
  console.log('='.repeat(50));

  const quoteId = '78b4e14c-cc35-4139-b15a-1de6b36ba6dc';
  const partnerId = '648bade7-3fb9-4c4c-b50f-fab0320e9c8b';

  // Primeiro, verificar quais evidências existem
  const { data: allEvidences, error: listError } = await supabase
    .from('mechanics_checklist_evidences')
    .select('id, storage_path')
    .eq('quote_id', quoteId)
    .eq('partner_id', partnerId);

  if (listError) {
    console.error('❌ Erro ao listar evidências:', listError);
    return;
  }

  console.log(`📊 Total de evidências: ${allEvidences?.length || 0}`);

  // Testar cada uma para ver se o arquivo existe
  const validEvidences = [];
  const invalidEvidences = [];

  for (const evidence of allEvidences || []) {
    try {
      const { data, error } = await supabase.storage
        .from('vehicle-media')
        .list(evidence.storage_path.split('/').slice(0, -1).join('/'), {
          search: evidence.storage_path.split('/').pop(),
        });

      if (error || !data || data.length === 0) {
        console.log(`❌ Arquivo não encontrado: ${evidence.storage_path}`);
        invalidEvidences.push(evidence.id);
      } else {
        console.log(`✅ Arquivo válido: ${evidence.storage_path}`);
        validEvidences.push(evidence.id);
      }
    } catch (err) {
      console.log(`❌ Erro ao verificar: ${evidence.storage_path}`);
      invalidEvidences.push(evidence.id);
    }
  }

  // Remover evidências inválidas
  if (invalidEvidences.length > 0) {
    console.log(`\n🗑️  Removendo ${invalidEvidences.length} evidências inválidas...`);

    const { error: deleteError } = await supabase
      .from('mechanics_checklist_evidences')
      .delete()
      .in('id', invalidEvidences);

    if (deleteError) {
      console.error('❌ Erro ao remover evidências inválidas:', deleteError);
    } else {
      console.log('✅ Evidências inválidas removidas com sucesso!');
    }
  }

  // Verificar resultado final
  const { data: finalEvidences, error: finalError } = await supabase
    .from('mechanics_checklist_evidences')
    .select('id, item_key, storage_path')
    .eq('quote_id', quoteId)
    .eq('partner_id', partnerId);

  if (!finalError) {
    console.log(`\n📊 Evidências restantes: ${finalEvidences?.length || 0}`);
    finalEvidences?.forEach(ev => console.log(`   - ${ev.item_key}: ${ev.storage_path}`));
  }
}

cleanInvalidEvidences().catch(console.error);
