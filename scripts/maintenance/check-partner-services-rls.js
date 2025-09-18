/**
 * Script para Verificar Políticas RLS de Serviços de Parceiro
 * Investigação específica de Row Level Security
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkRLSPolicies() {
  console.log('🔐 VERIFICANDO POLÍTICAS RLS - SERVIÇOS DE PARCEIRO');
  console.log('='.repeat(60));

  try {
    // 1. Verificar políticas da tabela partner_services
    console.log('\n📋 POLÍTICAS DA TABELA partner_services:');
    console.log('-'.repeat(50));

    // Como não temos acesso direto às políticas via cliente, vamos testar diferentes cenários
    await testRLSScenarios();

    // 2. Verificar estrutura da tabela
    await checkTableStructure();

    // 3. Testar queries com diferentes usuários
    await testQueriesWithDifferentUsers();
  } catch (error) {
    console.error('💥 ERRO:', error);
  }
}

async function testRLSScenarios() {
  console.log('\n🧪 TESTANDO CENÁRIOS DE RLS...');

  // Cenário 1: Query sem autenticação (deve falhar)
  console.log('\n1. Query sem autenticação:');
  try {
    const anonClient = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { data, error } = await anonClient.from('partner_services').select('*').limit(1);

    if (error) {
      console.log(`   ✅ Corretamente bloqueado: ${error.message}`);
    } else {
      console.log(`   ⚠️  POSSÍVEL PROBLEMA: Query anônima permitida`);
    }
  } catch (error) {
    console.log(`   ✅ Corretamente bloqueado: ${error.message}`);
  }

  // Cenário 2: Query com service role (deve funcionar)
  console.log('\n2. Query com service role:');
  try {
    const { data, error } = await supabase.from('partner_services').select('*').limit(1);

    if (error) {
      console.log(`   ❌ Erro inesperado: ${error.message}`);
    } else {
      console.log(`   ✅ Service role funcionando: ${data?.length || 0} registros`);
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
  }

  // Cenário 3: Verificar se existe política para partners
  console.log('\n3. Verificando política para partners:');
  try {
    // Tentar buscar serviços filtrando por partner_id
    const { data, error } = await supabase.from('partner_services').select('*').limit(5);

    if (error) {
      console.log(`   ❌ Erro ao buscar serviços: ${error.message}`);
    } else {
      console.log(`   ✅ Acesso aos serviços: ${data?.length || 0} encontrados`);

      if (data && data.length > 0) {
        console.log('   📊 Amostra de dados:');
        data.forEach((service, index) => {
          console.log(`      ${index + 1}. ${service.name} (partner_id: ${service.partner_id})`);
        });
      }
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
  }
}

async function checkTableStructure() {
  console.log('\n🔧 VERIFICANDO ESTRUTURA DA TABELA...');

  try {
    const { data, error } = await supabase.from('partner_services').select('*').limit(1);

    if (error) {
      console.log(`❌ Erro ao acessar tabela: ${error.message}`);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ Tabela acessível');
      console.log(`📊 Colunas encontradas: ${Object.keys(data[0]).join(', ')}`);

      // Verificar campos importantes
      const service = data[0];
      const requiredFields = ['id', 'partner_id', 'name', 'price', 'category'];
      const missingFields = requiredFields.filter(field => !(field in service));

      if (missingFields.length > 0) {
        console.log(`⚠️  Campos obrigatórios ausentes: ${missingFields.join(', ')}`);
      } else {
        console.log('✅ Todos os campos obrigatórios presentes');
      }

      // Mostrar exemplo de registro
      console.log('\n📋 Exemplo de registro:');
      console.log(JSON.stringify(service, null, 2));
    } else {
      console.log('⚠️  Tabela vazia ou sem dados de exemplo');
    }
  } catch (error) {
    console.log(`❌ Erro na verificação: ${error.message}`);
  }
}

async function testQueriesWithDifferentUsers() {
  console.log('\n👥 TESTANDO QUERIES COM DIFERENTES USUÁRIOS...');

  try {
    // Buscar usuários com diferentes roles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, role, company_name')
      .limit(10);

    if (error) {
      console.log(`❌ Erro ao buscar perfis: ${error.message}`);
      return;
    }

    if (profiles && profiles.length > 0) {
      console.log('📊 Usuários encontrados:');
      profiles.forEach((profile, index) => {
        console.log(
          `   ${index + 1}. ${profile.role} - ${profile.company_name || 'N/A'} (ID: ${profile.id})`
        );
      });

      // Verificar especificamente usuários com role 'partner'
      const partners = profiles.filter(p => p.role === 'partner');
      if (partners.length > 0) {
        console.log(`\n🎯 Usuários com role 'partner': ${partners.length}`);

        // Para cada parceiro, verificar seus serviços
        for (const partner of partners.slice(0, 3)) {
          // Limitar a 3 para não sobrecarregar
          console.log(
            `\n   🔍 Verificando serviços do parceiro: ${partner.company_name || partner.id}`
          );

          const { data: services, error: servicesError } = await supabase
            .from('partner_services')
            .select('*')
            .eq('partner_id', partner.id);

          if (servicesError) {
            console.log(`      ❌ Erro: ${servicesError.message}`);
          } else {
            console.log(`      ✅ Serviços encontrados: ${services?.length || 0}`);
            if (services && services.length > 0) {
              services.forEach(service => {
                console.log(`         • ${service.name} - R$ ${service.price}`);
              });
            }
          }
        }
      } else {
        console.log('❌ Nenhum usuário com role "partner" encontrado');
      }
    } else {
      console.log('⚠️  Nenhum perfil encontrado');
    }
  } catch (error) {
    console.log(`❌ Erro no teste: ${error.message}`);
  }
}

// Executar verificação
checkRLSPolicies().catch(console.error);
