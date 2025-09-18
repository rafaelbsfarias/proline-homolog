/**
 * Script para Testar API com Autenticação Simulada
 * Testa a API de list-services com diferentes cenários de autenticação
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

console.log('🧪 TESTANDO API COM AUTENTICAÇÃO SIMULADA');
console.log('='.repeat(60));

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAPIScenarios() {
  try {
    console.log('\n🔐 CENÁRIO 1: Tentativa de acesso sem autenticação');

    const { data: noAuthData, error: noAuthError } = await supabase
      .from('partner_services')
      .select('*')
      .limit(5);

    if (noAuthError) {
      console.log(`✅ Bloqueado corretamente: ${noAuthError.message}`);
    } else {
      console.log(`⚠️  ACESSO PERMITIDO SEM AUTENTICAÇÃO!`);
      console.log(`📊 Dados retornados: ${noAuthData?.length || 0} registros`);
    }

    console.log('\n🔐 CENÁRIO 2: Simulação de login como parceiro');

    // Tentar fazer login (usando credenciais que podem não existir)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'mecanica@parceiro.com',
      password: 'senha_teste_123', // Senha de teste
    });

    if (authError) {
      console.log(`❌ Login falhou: ${authError.message}`);
      console.log('💡 Isso é esperado se a senha estiver incorreta');
    } else {
      console.log(`✅ Login bem-sucedido: ${authData.user?.email}`);

      // Tentar acessar serviços após login
      console.log('\n📋 CENÁRIO 3: Acesso após login autenticado');

      const { data: servicesData, error: servicesError } = await supabase
        .from('partner_services')
        .select('*')
        .eq('partner_id', authData.user?.id);

      if (servicesError) {
        console.log(`❌ Erro ao buscar serviços: ${servicesError.message}`);
      } else {
        console.log(`✅ Serviços retornados: ${servicesData?.length || 0}`);
        if (servicesData && servicesData.length > 0) {
          servicesData.forEach((service, index) => {
            console.log(`   ${index + 1}. ${service.name} - R$ ${service.price}`);
          });
        }
      }
    }

    console.log('\n🔧 CENÁRIO 4: Verificação da API via service role (simulando backend)');

    const serviceSupabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const { data: serviceData, error: serviceError } = await serviceSupabase
      .from('partner_services')
      .select('*')
      .limit(10);

    if (serviceError) {
      console.log(`❌ Erro com service role: ${serviceError.message}`);
    } else {
      console.log(`✅ Service role funcionando: ${serviceData?.length || 0} serviços`);
      if (serviceData && serviceData.length > 0) {
        console.log('📋 Serviços encontrados:');
        serviceData.forEach((service, index) => {
          console.log(
            `   ${index + 1}. ${service.name} - R$ ${service.price} (${service.partner_id})`
          );
        });
      }
    }

    console.log('\n🎯 ANÁLISE DOS RESULTADOS:');
    console.log('='.repeat(50));

    if (noAuthData && noAuthData.length > 0) {
      console.log('🚨 PROBLEMA CRÍTICO: Dados acessíveis sem autenticação!');
      console.log('💡 Isso indica que as políticas RLS não estão funcionando');
    }

    if (authData?.user) {
      console.log('✅ Autenticação funcionando');
    } else {
      console.log('⚠️  Autenticação não testada (credenciais incorretas)');
    }

    if (serviceData && serviceData.length > 0) {
      console.log('✅ Backend tem acesso aos dados');
    }

    console.log('\n💡 DIAGNÓSTICO DA DISCREPÂNCIA:');
    console.log('   • Banco de dados: 3 serviços');
    console.log('   • Interface mostra: 6 serviços');
    console.log('   • Possíveis causas:');
    console.log('     1. Cache do navegador');
    console.log('     2. Dados mock no frontend');
    console.log('     3. Ambiente diferente (produção vs homologação)');
    console.log('     4. API retornando dados de cache');
    console.log('     5. Problemas de sincronização');

    console.log('\n🔧 PRÓXIMAS AÇÕES RECOMENDADAS:');
    console.log('   1. Limpar cache do navegador completamente');
    console.log('   2. Verificar URL do ambiente');
    console.log('   3. Testar em modo incógnito');
    console.log('   4. Verificar se há console.log no frontend');
    console.log('   5. Verificar network tab no DevTools');
  } catch (error) {
    console.error('💥 ERRO GERAL:', error);
  }
}

// Executar testes
testAPIScenarios().catch(console.error);
