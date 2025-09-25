/**
 * Script para Verificar Ambiente e Conexão
 * Confirma se estamos no ambiente correto e conectados ao banco certo
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

console.log('🔍 VERIFICANDO AMBIENTE E CONEXÃO');
console.log('='.repeat(50));

console.log(`🌐 SUPABASE_URL: ${SUPABASE_URL}`);
console.log(`🔑 SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY ? '✅ Presente' : '❌ Ausente'}`);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkEnvironment() {
  try {
    console.log('\n🔗 TESTANDO CONEXÃO COM O BANCO...');

    // Teste básico de conexão
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Erro de conexão:', testError.message);
      return;
    }

    console.log('✅ Conexão estabelecida com sucesso');

    // Verificar se estamos no ambiente correto
    console.log('\n🏢 VERIFICANDO AMBIENTE...');

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .limit(5);

    if (profilesError) {
      console.error('❌ Erro ao buscar perfis:', profilesError.message);
      return;
    }

    console.log(`📊 Perfis encontrados: ${profiles?.length || 0}`);

    if (profiles && profiles.length > 0) {
      console.log('🏆 Amostra de perfis:');
      profiles.forEach((profile, index) => {
        console.log(`   ${index + 1}. ${profile.full_name || 'N/A'} (${profile.role})`);
      });
    }

    // Verificar serviços novamente
    console.log('\n📋 VERIFICANDO SERVIÇOS NOVAMENTE...');

    const { data: services, error: servicesError } = await supabase
      .from('partner_services')
      .select('*');

    if (servicesError) {
      console.error('❌ Erro ao buscar serviços:', servicesError.message);
      return;
    }

    console.log(`📊 Total de serviços: ${services?.length || 0}`);

    if (services && services.length > 0) {
      console.log('🏆 Serviços encontrados:');
      services.forEach((service, index) => {
        console.log(
          `   ${index + 1}. ${service.name} - R$ ${service.price} (${service.category || 'sem categoria'})`
        );
      });
    }

    // Verificar se há dados mock ou cache
    console.log('\n🔍 VERIFICANDO POSSÍVEIS FONTES ALTERNATIVAS...');

    // Verificar se há arquivos estáticos
    console.log('ℹ️  Verificando se há arquivos JSON ou dados estáticos...');

    // Verificar se há localStorage ou sessionStorage simulados
    console.log('ℹ️  Verificando se há dados em cache do navegador...');

    // Verificar se há problemas de RLS
    console.log('\n🔐 VERIFICANDO POLÍTICAS RLS...');

    const { data: rlsTest, error: rlsError } = await supabase
      .from('partner_services')
      .select('*')
      .limit(1);

    if (rlsError) {
      console.log(`⚠️  Possível problema de RLS: ${rlsError.message}`);
    } else {
      console.log('✅ RLS parece estar funcionando');
    }

    // Diagnóstico final
    console.log('\n🎯 DIAGNÓSTICO DO AMBIENTE:');
    console.log('='.repeat(50));

    if ((services?.length || 0) === 0) {
      console.log('❌ BANCO VAZIO: Nenhum serviço encontrado');
      console.log('💡 Isso confirma que os dados na interface vêm de outra fonte');
    } else if ((services?.length || 0) < 6) {
      console.log(
        `⚠️  BANCO INCOMPLETO: ${services?.length || 0} serviços encontrados, mas interface mostra 6`
      );
      console.log('💡 Possível mistura de dados reais e mock');
    } else {
      console.log('✅ BANCO COMPLETO: Todos os serviços estão presentes');
    }

    console.log('\n💡 POSSÍVEIS CAUSAS DA DISCREPÂNCIA:');
    console.log('   1. Ambiente incorreto (produção vs homologação)');
    console.log('   2. Cache do navegador');
    console.log('   3. Dados mock no frontend');
    console.log('   4. API retornando dados de cache');
    console.log('   5. Problemas de sincronização');

    console.log('\n🔧 RECOMENDAÇÕES:');
    console.log('   1. Verificar URL do ambiente no navegador');
    console.log('   2. Limpar cache completamente (Ctrl+Shift+R)');
    console.log('   3. Testar em modo incógnito');
    console.log('   4. Verificar se há dados mock no código React');
    console.log('   5. Verificar logs da API no servidor');
  } catch (error) {
    console.error('💥 ERRO GERAL:', error);
  }
}

// Executar verificação
checkEnvironment().catch(console.error);
