/**
 * Script para Testar API de Serviços de Parceiro
 * Simula exatamente a chamada que o frontend faz
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

console.log(`🔗 Conectando ao Supabase: ${SUPABASE_URL}`);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testPartnerServicesAPI() {
  console.log('🧪 TESTANDO API: /api/partner/list-services');
  console.log('='.repeat(60));

  try {
    console.log('\n🔐 FAZENDO LOGIN COMO PARCEIRO...');

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'mecanica@parceiro.com',
      password: '123qwe',
    });

    if (authError) {
      console.log(`❌ Erro no login: ${authError.message}`);

      console.log('\n🔧 TENTANDO COM SERVICE ROLE PARA INVESTIGAÇÃO...');
      const serviceSupabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

      const { data: userData, error: userError } = await serviceSupabase.auth.admin.listUsers();
      if (userError) {
        console.log(`❌ Erro ao listar usuários: ${userError.message}`);
        return;
      }

      const partnerUser = userData.users.find(u => u.email === 'mecanica@parceiro.com');
      if (!partnerUser) {
        console.log('❌ Usuário parceiro não encontrado');
        return;
      }

      console.log(`✅ Usuário encontrado: ${partnerUser.email} (ID: ${partnerUser.id})`);

      await checkServicesDirectly(serviceSupabase, partnerUser.id);
      return;
    }

    console.log(`✅ Login bem-sucedido: ${authData.user.email}`);
    console.log(`   Token: ${authData.session?.access_token ? '✅ Presente' : '❌ Ausente'}`);

    await simulateAPIListServices(authData.session?.access_token);
  } catch (error) {
    console.error('💥 ERRO GERAL:', error);
  }
}

async function simulateAPIListServices(accessToken) {
  console.log('\n🌐 SIMULANDO CHAMADA DA API...');

  if (!accessToken) {
    console.log('❌ Token de acesso não disponível');
    return;
  }

  try {
    const { data: services, error } = await supabase
      .from('partner_services')
      .select('*')
      .eq('partner_id', (await supabase.auth.getUser()).data.user?.id);

    if (error) {
      console.log(`❌ Erro na query: ${error.message}`);
      console.log(`   Código: ${error.code}`);
      console.log(`   Detalhes: ${error.details}`);
      console.log(`   Hint: ${error.hint}`);
    } else {
      console.log(`✅ Query executada com sucesso`);
      console.log(`📊 Serviços retornados: ${services?.length || 0}`);

      if (services && services.length > 0) {
        console.log('\n🏆 SERVIÇOS ENCONTRADOS:');
        services.forEach((service, index) => {
          console.log(`   ${index + 1}. ${service.name}`);
          console.log(`      ID: ${service.id}`);
          console.log(`      Preço: R$ ${service.price}`);
          console.log(`      Categoria: ${service.category}`);
          console.log(`      Parceiro ID: ${service.partner_id}`);
          console.log('');
        });
      } else {
        console.log('❌ NENHUM SERVIÇO RETORNADO');
        console.log('💡 Possíveis causas:');
        console.log('   - Usuário não tem serviços cadastrados');
        console.log('   - partner_id não corresponde ao usuário logado');
        console.log('   - Problemas de RLS (Row Level Security)');
      }
    }
  } catch (error) {
    console.log(`❌ Erro na simulação: ${error.message}`);
  }
}

async function checkServicesDirectly(serviceSupabase, partnerId) {
  console.log('\n🔍 VERIFICANDO SERVIÇOS DIRETAMENTE NO BANCO...');

  try {
    const { data: allServices, error: allError } = await serviceSupabase
      .from('partner_services')
      .select('*');

    if (allError) {
      console.log(`❌ Erro ao buscar todos os serviços: ${allError.message}`);
      return;
    }

    console.log(`📊 Total de serviços no banco: ${allServices?.length || 0}`);

    if (allServices && allServices.length > 0) {
      console.log('\n📋 TODOS OS SERVIÇOS:');
      allServices.forEach((service, index) => {
        console.log(`   ${index + 1}. ${service.name} (Parceiro: ${service.partner_id})`);
      });

      const partnerServices = allServices.filter(s => s.partner_id === partnerId);
      console.log(`\n🎯 Serviços do parceiro ${partnerId}: ${partnerServices.length}`);

      if (partnerServices.length > 0) {
        console.log('🏆 SERVIÇOS DO PARCEIRO:');
        partnerServices.forEach((service, index) => {
          console.log(`   ${index + 1}. ${service.name} - R$ ${service.price}`);
        });
      } else {
        console.log('❌ PARCEIRO NÃO TEM SERVIÇOS CADASTRADOS');
        console.log('💡 Solução: Inserir serviços na tabela partner_services');
      }
    } else {
      console.log('❌ NENHUM SERVIÇO NO BANCO');
      console.log('💡 Solução: Popular a tabela partner_services');
    }

    console.log('\n🔧 ESTRUTURA DA TABELA:');
    if (allServices && allServices.length > 0) {
      console.log(`   Colunas: ${Object.keys(allServices[0]).join(', ')}`);
    }
  } catch (error) {
    console.log(`❌ Erro na verificação direta: ${error.message}`);
  }
}

testPartnerServicesAPI().catch(console.error);
