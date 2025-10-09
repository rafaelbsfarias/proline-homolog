require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function debugPartnerCategories() {
  console.log('🔍 === VERIFICANDO ASSOCIAÇÃO DE PARCEIROS ÀS CATEGORIAS ===\n');

  // 1. Listar todas as categorias
  const { data: categories } = await supabase
    .from('service_categories')
    .select('id, key, name')
    .order('name');

  console.log('📋 CATEGORIAS DISPONÍVEIS:\n');
  categories?.forEach((cat, i) => {
    console.log(`  ${i + 1}. ${cat.name} (${cat.key})`);
    console.log(`     ID: ${cat.id}`);
  });

  console.log('\n' + '='.repeat(80) + '\n');

  // 2. Para cada categoria, buscar parceiros associados
  for (const category of categories || []) {
    console.log(`📦 CATEGORIA: ${category.name} (${category.key})`);
    console.log(`   ID: ${category.id}\n`);

    // Buscar na tabela partners_service_categories
    const { data: associations, error } = await supabase
      .from('partners_service_categories')
      .select(`
        partner_id,
        partners!inner (
          profile_id,
          company_name,
          is_active
        )
      `)
      .eq('category_id', category.id);

    if (error) {
      console.error(`   ❌ Erro:`, error);
      continue;
    }

    console.log(`   Parceiros associados: ${associations?.length || 0}`);

    if (associations && associations.length > 0) {
      for (const assoc of associations) {
        const partner = assoc.partners;
        console.log(`\n   ✓ ${partner.company_name}`);
        console.log(`     Partner ID (tabela): ${assoc.partner_id}`);
        console.log(`     Profile ID: ${partner.profile_id}`);
        console.log(`     Ativo: ${partner.is_active ? 'SIM' : 'NÃO'}`);

        // Verificar se o profile_id existe na tabela profiles
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, email, role')
          .eq('id', partner.profile_id)
          .single();

        if (profileError || !profile) {
          console.log(`     ⚠️  PROFILE NÃO ENCONTRADO EM profiles!`);
        } else {
          console.log(`     Profile: ${profile.full_name} (${profile.email})`);
          console.log(`     Role: ${profile.role}`);
        }
      }
    } else {
      console.log(`   ⚠️  Nenhum parceiro associado a esta categoria!`);
    }

    console.log('');
  }

  console.log('='.repeat(80) + '\n');

  // 3. Verificar se há parceiros sem categorias
  console.log('🔍 PARCEIROS SEM CATEGORIAS:\n');
  
  const { data: allPartners } = await supabase
    .from('partners')
    .select(`
      id,
      profile_id,
      company_name,
      is_active
    `)
    .eq('is_active', true);

  for (const partner of allPartners || []) {
    const { data: categories } = await supabase
      .from('partners_service_categories')
      .select('category_id')
      .eq('partner_id', partner.id);

    if (!categories || categories.length === 0) {
      console.log(`   ⚠️  ${partner.company_name}`);
      console.log(`      Partner ID: ${partner.id}`);
      console.log(`      Profile ID: ${partner.profile_id}`);
    }
  }
}

debugPartnerCategories();
