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

async function runMigration() {
  try {
    console.log('🔄 Executando migração para adicionar categorias faltantes...');

    // Verificar se as categorias já existem
    const { data: existingCategories, error: checkError } = await supabase
      .from('service_categories')
      .select('key')
      .in('key', ['loja', 'patio_atacado']);

    if (checkError) {
      console.error('❌ Erro ao verificar categorias existentes:', checkError);
      return;
    }

    const existingKeys = existingCategories.map(cat => cat.key);
    console.log('📋 Categorias existentes:', existingKeys);

    // Adicionar categorias faltantes
    const categoriesToAdd = [];

    if (!existingKeys.includes('loja')) {
      categoriesToAdd.push({
        key: 'loja',
        name: 'Loja',
        description: 'Serviços de loja e acessórios',
        active: true,
        created_at: new Date().toISOString(),
      });
    }

    if (!existingKeys.includes('patio_atacado')) {
      categoriesToAdd.push({
        key: 'patio_atacado',
        name: 'Pátio Atacado',
        description: 'Serviços de pátio atacado',
        active: true,
        created_at: new Date().toISOString(),
      });
    }

    if (categoriesToAdd.length > 0) {
      const { error: insertError } = await supabase
        .from('service_categories')
        .insert(categoriesToAdd);

      if (insertError) {
        console.error('❌ Erro ao inserir categorias:', insertError);
      } else {
        console.log(`✅ Adicionadas ${categoriesToAdd.length} categorias`);
      }
    } else {
      console.log('ℹ️  Todas as categorias já existem');
    }

    // Verificar resultado final
    const { data: allCategories, error: finalError } = await supabase
      .from('service_categories')
      .select('key, name')
      .order('key');

    if (!finalError && allCategories) {
      console.log('');
      console.log('📊 Todas as categorias:');
      allCategories.forEach(cat => {
        console.log(`   - ${cat.key}: ${cat.name}`);
      });
    }
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

runMigration();
