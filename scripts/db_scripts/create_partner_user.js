// db_scripts/create_partner_user.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname para módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega variáveis de ambiente do .env.local na raiz do projeto
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey =
  process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Mapeamento de categorias para criação de parceiros
const categoryPartners = [
  {
    key: 'mechanics',
    email: 'mecanica@parceiro.com',
    companyName: 'Oficina Mecânica ProLine',
    categoryName: 'Mecânica',
    type: 'preparacao',
  },
  {
    key: 'body_paint',
    email: 'pintura@parceiro.com',
    companyName: 'Funilaria e Pintura ProLine',
    categoryName: 'Funilaria/Pintura',
    type: 'preparacao',
  },
  {
    key: 'washing',
    email: 'lavagem@parceiro.com',
    companyName: 'Lavagem ProLine',
    categoryName: 'Lavagem',
    type: 'preparacao',
  },
  {
    key: 'tires',
    email: 'pneus@parceiro.com',
    companyName: 'Pneus ProLine',
    categoryName: 'Pneus',
    type: 'preparacao',
  },
  {
    key: 'loja',
    email: 'loja@parceiro.com',
    companyName: 'Loja de Peças ProLine',
    categoryName: 'Loja',
    type: 'comercializacao',
  },
  {
    key: 'patio_atacado',
    email: 'patio@parceiro.com',
    companyName: 'Pátio Atacado ProLine',
    categoryName: 'Pátio Atacado',
    type: 'comercializacao',
  },
];

async function createPartnerForCategory(categoryConfig) {
  const { key, email, companyName, categoryName } = categoryConfig;
  const password = '123qwe';
  const fullName = `Parceiro ${categoryName}`;
  const role = 'partner';
  const cnpj = `00.000.000/0001-${String(Math.floor(Math.random() * 99)).padStart(2, '0')}`;

  try {
    console.log(`🔧 Criando parceiro para categoria: ${categoryName}`);

    // 1. Criar usuário no Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: role,
        email_verified: true,
      },
    });

    if (authError) {
      if (authError.message.includes('User already exists')) {
        console.log(`⚠️  Usuário ${email} já existe, tentando recuperar...`);
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers?.users.find(u => u.email === email);
        if (existingUser) {
          authUser.user = existingUser;
          console.log(`✅ Usuário ${email} recuperado com sucesso`);
        } else {
          console.log(`❌ Não foi possível recuperar usuário ${email}`);
          return;
        }
      } else {
        console.log(`❌ Erro ao criar usuário ${email}:`, authError.message);
        return;
      }
    } else {
      console.log(`✅ Usuário ${email} criado com sucesso`);
    }

    const userId = authUser?.user?.id;

    if (!userId) {
      console.log(`❌ ID do usuário não obtido para ${email}`);
      return;
    }

    // 2. Criar/Atualizar perfil na tabela public.profiles
    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        id: userId,
        full_name: fullName,
        role: role,
        status: 'ativo',
      },
      { onConflict: 'id' }
    );

    if (profileError) {
      console.log(`❌ Erro ao criar perfil para ${email}:`, profileError.message);
      return;
    }

    console.log(`✅ Perfil criado para ${email}`);

    // 3. Criar entrada na tabela public.partners
    const { error: partnerError } = await supabase.from('partners').upsert(
      {
        profile_id: userId,
        cnpj: cnpj,
        company_name: companyName,
        is_active: true,
        category: categoryName,
      },
      { onConflict: 'profile_id' }
    );

    if (partnerError) {
      console.log(`❌ Erro ao criar parceiro para ${email}:`, partnerError.message);
      return;
    }

    console.log(`✅ Parceiro criado para ${email}`);

    // 4. Associar parceiro à categoria específica
    const { data: serviceCategory } = await supabase
      .from('service_categories')
      .select('id')
      .eq('key', key)
      .single();

    if (!serviceCategory) {
      console.log(`❌ Categoria ${key} não encontrada`);
      return;
    }

    // Add this block to update the type in service_categories
    const { error: updateTypeError } = await supabase
      .from('service_categories')
      .update({ type: categoryConfig.type })
      .eq('id', serviceCategory.id);

    if (updateTypeError) {
      console.log(`❌ Erro ao atualizar tipo para categoria ${key}:`, updateTypeError.message);
      return;
    }
    console.log(`✅ Tipo '${categoryConfig.type}' atualizado para categoria ${categoryName}`);

    const { error: associationError } = await supabase.from('partners_service_categories').upsert(
      {
        partner_id: userId,
        category_id: serviceCategory.id,
        priority: 1,
        created_at: new Date().toISOString(),
      },
      {
        onConflict: 'partner_id,category_id',
      }
    );

    if (associationError) {
      console.log(`❌ Erro ao associar parceiro à categoria ${key}:`, associationError.message);
      return;
    }

    console.log(`✅ Parceiro ${email} associado à categoria ${categoryName}`);
    console.log(`   📧 Email: ${email}`);
    console.log(`   🔑 Senha: ${password}`);
    console.log(`   🏢 Empresa: ${companyName}`);
    console.log(`   📂 Categoria: ${categoryName}`);
    console.log('');
  } catch (error) {
    console.log(`❌ Erro inesperado ao criar parceiro para ${email}:`, error.message);
  }
}

async function createAllPartners() {
  console.log('🚀 Iniciando criação de parceiros para todas as categorias...\n');

  for (const categoryConfig of categoryPartners) {
    await createPartnerForCategory(categoryConfig);
  }

  console.log('🎉 Processo concluído!');
  console.log('\n📋 Resumo dos parceiros criados:');
  categoryPartners.forEach(config => {
    console.log(`   • ${config.email} - ${config.categoryName} (senha: 123qwe)`);
  });
}

createAllPartners();
