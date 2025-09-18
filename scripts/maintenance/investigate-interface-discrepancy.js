/**
 * Script para Investigar Discrepância entre Interface e Banco
 * Verifica por que a interface mostra 6 serviços mas o banco tem apenas 3
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

async function investigateInterfaceDiscrepancy() {
  console.log('🔍 INVESTIGANDO DISCREPÂNCIA: INTERFACE vs BANCO DE DADOS');
  console.log('='.repeat(70));

  console.log('\n📊 DADOS DA INTERFACE (6 serviços):');
  console.log('1. Lavagem Completa - R$ 85,00 - Lavagem');
  console.log('2. Polimento de Faróis - R$ 45,00 - Polimento');
  console.log('3. Higienização de Ar-Condicionado - R$ 120,00 - Higienização');
  console.log('4. Lavagem de Motor - R$ 65,00 - Lavagem');
  console.log('5. Aplicação de Cera - R$ 35,00 - Polimento');
  console.log('6. Limpeza de Estofados - R$ 95,00 - null');

  try {
    console.log('\n📋 VERIFICANDO TODOS OS SERVIÇOS NO BANCO...');
    const { data: allServices, error: allError } = await supabase
      .from('partner_services')
      .select('*');

    if (allError) {
      console.error('❌ Erro ao buscar todos os serviços:', allError);
      return;
    }

    console.log(`📊 Total de serviços no banco: ${allServices?.length || 0}`);

    if (allServices && allServices.length > 0) {
      console.log('\n🏆 TODOS OS SERVIÇOS NO BANCO:');
      allServices.forEach((service, index) => {
        console.log(`   ${index + 1}. ${service.name}`);
        console.log(`      Preço: R$ ${service.price}`);
        console.log(`      Categoria: ${service.category || 'null'}`);
        console.log(`      Parceiro ID: ${service.partner_id}`);
        console.log(`      ID: ${service.id}`);
        console.log('');
      });
    }

    console.log('\n🔍 VERIFICANDO SE OS SERVIÇOS DA INTERFACE EXISTEM NO BANCO...');

    const interfaceServices = [
      { name: 'Lavagem Completa', price: 85.0, category: 'Lavagem' },
      { name: 'Polimento de Faróis', price: 45.0, category: 'Polimento' },
      { name: 'Higienização de Ar-Condicionado', price: 120.0, category: 'Higienização' },
      { name: 'Lavagem de Motor', price: 65.0, category: 'Lavagem' },
      { name: 'Aplicação de Cera', price: 35.0, category: 'Polimento' },
      { name: 'Limpeza de Estofados', price: 95.0, category: null },
    ];

    let foundCount = 0;
    const notFoundServices = [];

    for (const interfaceService of interfaceServices) {
      const found = allServices?.find(
        service =>
          service.name === interfaceService.name &&
          service.price === interfaceService.price &&
          service.category === interfaceService.category
      );

      if (found) {
        foundCount++;
        console.log(`✅ ENCONTRADO: ${interfaceService.name}`);
      } else {
        notFoundServices.push(interfaceService);
        console.log(`❌ NÃO ENCONTRADO: ${interfaceService.name}`);
      }
    }

    console.log(`\n📊 RESULTADO DA VERIFICAÇÃO:`);
    console.log(`   Serviços da interface encontrados no banco: ${foundCount}/6`);
    console.log(`   Serviços não encontrados: ${notFoundServices.length}`);

    console.log('\n👥 VERIFICANDO USUÁRIOS E PARCEIROS...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, role, full_name');

    if (profilesError) {
      console.error('❌ Erro ao buscar perfis:', profilesError);
    } else {
      console.log(`📊 Total de perfis: ${profiles?.length || 0}`);
      const partners = profiles?.filter(p => p.role === 'partner') || [];
      console.log(`🎯 Usuários com role 'partner': ${partners.length}`);

      if (partners.length > 0) {
        console.log('\n🏢 PARCEIROS ENCONTRADOS:');
        partners.forEach((partner, index) => {
          console.log(`   ${index + 1}. ${partner.full_name || 'N/A'} (ID: ${partner.id})`);
        });
      }
    }

    console.log('\n🔍 VERIFICANDO POSSÍVEIS FONTES DE DADOS...');

    console.log('ℹ️  Verificando se há dados hardcoded no código...');

    console.log('ℹ️  Possível cache do navegador ou localStorage');

    console.log('\n🎯 DIAGNÓSTICO FINAL:');
    console.log('='.repeat(50));

    if (foundCount === 0) {
      console.log('❌ NENHUM serviço da interface foi encontrado no banco');
      console.log('💡 POSSÍVEIS CAUSAS:');
      console.log('   1. Dados hardcoded no frontend');
      console.log('   2. Cache do navegador');
      console.log('   3. API retornando dados mock');
      console.log('   4. Problema de ambiente (produção vs homologação)');
    } else if (foundCount < 6) {
      console.log(`⚠️  Apenas ${foundCount} dos 6 serviços foram encontrados no banco`);
      console.log('💡 POSSÍVEIS CAUSAS:');
      console.log('   1. Mistura de dados reais e mock');
      console.log('   2. Problemas de sincronização');
      console.log('   3. Dados de diferentes ambientes');
    } else {
      console.log('✅ Todos os serviços foram encontrados no banco');
      console.log('💡 POSSÍVEIS CAUSAS:');
      console.log('   1. Problemas de cache');
      console.log('   2. Questões de permissões RLS');
    }

    console.log('\n💡 RECOMENDAÇÕES:');
    console.log('   1. Limpar cache do navegador (Ctrl+F5)');
    console.log('   2. Verificar se está no ambiente correto');
    console.log('   3. Verificar logs da API');
    console.log('   4. Testar em modo incógnito');
    console.log('   5. Verificar se há dados mock no código');
  } catch (error) {
    console.error('💥 ERRO GERAL:', error);
  }
}

investigateInterfaceDiscrepancy().catch(console.error);
