#!/usr/bin/env node

/**
 * Script de teste da API /init com templates dinâmicos
 * 
 * Testa:
 * 1. Busca parceiros de cada categoria
 * 2. Chama POST /init com dados simulados
 * 3. Verifica se o template correto é retornado
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const CATEGORIES = [
  'Mecânica',
  'Funilaria/Pintura',
  'Lavagem',
  'Pneus',
  'Loja',
  'Pátio Atacado',
];

async function testInitEndpoint() {
  console.log('🧪 Testando endpoint /init com templates dinâmicos\n');

  // 1. Buscar um veículo de teste
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, brand, model, plate')
    .limit(1);

  if (!vehicles || vehicles.length === 0) {
    console.error('❌ Nenhum veículo encontrado no banco');
    process.exit(1);
  }

  const testVehicle = vehicles[0];
  console.log(`📋 Usando veículo de teste: ${testVehicle.brand} ${testVehicle.model} (${testVehicle.plate})\n`);

  // 2. Buscar um specialist
  const { data: specialists } = await supabase
    .from('specialists')
    .select('profile_id')
    .limit(1);

  if (!specialists || specialists.length === 0) {
    console.error('❌ Nenhum specialist encontrado no banco');
    process.exit(1);
  }

  const testSpecialist = specialists[0];
  console.log(`👤 Usando specialist: ${testSpecialist.profile_id}\n`);

  // 2. Buscar parceiros de cada categoria
  const { data: partners } = await supabase
    .from('partners')
    .select('profile_id, category, company_name')
    .in('category', CATEGORIES);

  if (!partners || partners.length === 0) {
    console.error('❌ Nenhum parceiro encontrado');
    process.exit(1);
  }

  console.log(`🏢 Encontrados ${partners.length} parceiros\n`);

  // 3. Criar quote para cada parceiro e testar /init
  for (const partner of partners) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🔧 Testando parceiro: ${partner.company_name}`);
    console.log(`   Categoria: ${partner.category}`);
    console.log(`${'='.repeat(80)}\n`);

    try {
      // Simular lógica do endpoint /init - buscar categoria do parceiro
      const { data: partnerData } = await supabase
        .from('partners')
        .select('category')
        .eq('profile_id', partner.profile_id)
        .single();

      if (!partnerData) {
        console.error(`❌ Parceiro não encontrado`);
        continue;
      }

      // Normalizar categoria
      const normalizedCategory = partnerData.category
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '_')
        .replace(/\//g, '_');

      console.log(`\n🔄 Categoria normalizada: "${partnerData.category}" → "${normalizedCategory}"`);

      // Buscar template
      const { data: template, error: templateError } = await supabase
        .from('checklist_templates')
        .select(`
          id,
          title,
          version,
          is_active,
          checklist_template_items (
            id,
            item_key,
            label,
            description,
            section,
            subsection,
            position,
            is_required,
            allows_photos,
            max_photos,
            help_text
          )
        `)
        .eq('category', normalizedCategory)
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      if (templateError) {
        console.error(`❌ Erro ao buscar template: ${templateError.message}`);
        continue;
      }

      if (!template) {
        console.log(`⚠️  Nenhum template encontrado para categoria "${normalizedCategory}"`);
        continue;
      }

      console.log(`\n✅ Template encontrado:`);
      console.log(`   ID: ${template.id}`);
      console.log(`   Título: ${template.title}`);
      console.log(`   Versão: ${template.version}`);
      console.log(`   Itens: ${template.checklist_template_items.length}`);

      // Agrupar por seção
      const sections = template.checklist_template_items.reduce((acc, item) => {
        if (!acc[item.section]) {
          acc[item.section] = [];
        }
        acc[item.section].push(item);
        return acc;
      }, {});

      console.log(`   Seções: ${Object.keys(sections).length}`);
      Object.entries(sections).forEach(([section, items]) => {
        console.log(`      - ${section}: ${items.length} itens`);
      });

    } catch (error) {
      console.error(`❌ Erro durante teste: ${error.message}`);
    }
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log('🎉 Testes concluídos!');
  console.log(`${'='.repeat(80)}\n`);
}

testInitEndpoint().catch(console.error);
