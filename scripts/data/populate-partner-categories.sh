#!/bin/bash

echo "=== Populando Relacionamentos Parceiro-Categoria ==="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: Execute este script do diretório raiz do projeto${NC}"
    exit 1
fi

echo -e "${BLUE}🔍 Verificando parceiros existentes...${NC}"

# Executar script Node.js para popular os relacionamentos
node -e "
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

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

    console.log(\`📋 Encontrados \${partners.length} parceiros\`);

    // Buscar todas as categorias
    const { data: categories, error: categoriesError } = await supabase
      .from('service_categories')
      .select('id, key, name');

    if (categoriesError) {
      console.error('❌ Erro ao buscar categorias:', categoriesError);
      return;
    }

    console.log(\`📋 Encontradas \${categories.length} categorias:\`);
    categories.forEach(cat => console.log(\`   - \${cat.key}: \${cat.name}\`));

    // Para cada parceiro, associar a categoria 'mechanics' (mais comum)
    const mechanicsCategory = categories.find(cat => cat.key === 'mechanics');

    if (!mechanicsCategory) {
      console.error('❌ Categoria mechanics não encontrada');
      return;
    }

    console.log('');
    console.log('🔧 Associando parceiros à categoria mechanics...');

    const associations = [];
    for (const partner of partners) {
      // Verificar se já existe associação
      const { data: existing } = await supabase
        .from('partners_service_categories')
        .select('id')
        .eq('partner_id', partner.profile_id)
        .eq('category_id', mechanicsCategory.id)
        .single();

      if (!existing) {
        associations.push({
          partner_id: partner.profile_id,
          category_id: mechanicsCategory.id,
          priority: 1,
          created_at: new Date().toISOString()
        });
        console.log(\`   ✅ \${partner.company_name} será associado a mechanics\`);
      } else {
        console.log(\`   ⚠️  \${partner.company_name} já está associado a mechanics\`);
      }
    }

    if (associations.length > 0) {
      const { error: insertError } = await supabase
        .from('partners_service_categories')
        .insert(associations);

      if (insertError) {
        console.error('❌ Erro ao inserir associações:', insertError);
      } else {
        console.log(\`✅ Inseridas \${associations.length} associações parceiro-categoria\`);
      }
    } else {
      console.log('ℹ️  Nenhuma nova associação necessária');
    }

    // Verificar resultado final
    const { data: finalAssociations, error: finalError } = await supabase
      .from('partners_service_categories')
      .select(\`
        partner_id,
        partners!inner(company_name),
        service_categories!inner(key, name)
      \`);

    if (!finalError && finalAssociations) {
      console.log('');
      console.log('📊 Associações atuais:');
      finalAssociations.forEach(assoc => {
        console.log(\`   - \${assoc.partners.company_name} → \${assoc.service_categories.name} (\${assoc.service_categories.key})\`);
      });
    }

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

populatePartnerCategories();
"
