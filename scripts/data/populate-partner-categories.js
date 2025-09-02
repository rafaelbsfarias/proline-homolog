import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function populatePartnerCategories() {
  try {
    console.log('🔍 Buscando parceiros...');

    // Buscar todos os parceiros
    const { data: partners, error: partnersError } = await supabase
      .from('partners')
      .select('profile_id, company_name');

    if (partnersError) {
      console.error('❌ Erro ao buscar parceiros:', partnersError);
      return;
    }

    console.log(`📋 Encontrados ${partners.length} parceiros`);

    // Buscar todas as categorias
    const { data: categories, error: categoriesError } = await supabase
      .from('service_categories')
      .select('id, key, name');

    if (categoriesError) {
      console.error('❌ Erro ao buscar categorias:', categoriesError);
      return;
    }

    console.log(`📋 Encontradas ${categories.length} categorias:`);
    categories.forEach(cat => console.log(`   - ${cat.key}: ${cat.name}`));

    // Para cada parceiro, associar a categoria 'mechanics' (mais comum)
    const mechanicsCategory = categories.find(cat => cat.key === 'mechanics');

    if (!mechanicsCategory) {
      console.error('❌ Categoria mechanics não encontrada');
      return;
    }

    console.log('');
    console.log('🔧 Associando parceiros à categoria mechanics...');

    let successCount = 0;
    let skipCount = 0;

    for (const partner of partners) {
      try {
        // Tentar inserir associação (usar upsert para evitar duplicatas)
        const { error: insertError } = await supabase.from('partners_service_categories').upsert(
          {
            partner_id: partner.profile_id,
            category_id: mechanicsCategory.id,
            priority: 1,
            created_at: new Date().toISOString(),
          },
          {
            onConflict: 'partner_id,category_id',
          }
        );

        if (insertError) {
          console.log(`   ⚠️  ${partner.company_name}: ${insertError.message}`);
          skipCount++;
        } else {
          console.log(`   ✅ ${partner.company_name} associado a mechanics`);
          successCount++;
        }
      } catch (error) {
        console.log(`   ❌ ${partner.company_name}: Erro inesperado - ${error.message}`);
        skipCount++;
      }
    }

    console.log(`📊 Resultado: ${successCount} associações criadas, ${skipCount} puladas`);

    // Verificar resultado final
    const { data: finalAssociations, error: finalError } = await supabase.from(
      'partners_service_categories'
    ).select(`
        partner_id,
        partners!inner(company_name),
        service_categories!inner(key, name)
      `);

    if (!finalError && finalAssociations) {
      console.log('');
      console.log('📊 Associações atuais:');
      finalAssociations.forEach(assoc => {
        console.log(
          `   - ${assoc.partners.company_name} → ${assoc.service_categories.name} (${assoc.service_categories.key})`
        );
      });
    }
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

populatePartnerCategories();
