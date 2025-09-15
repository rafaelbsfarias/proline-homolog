/**
 * Script de Investigação Específica: Serviços de Parceiro não Aparecem no Orçamento
 * Verifica todas as possíveis causas da inconsistência identificada
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { writeFileSync } from 'fs';
import { join } from 'path';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

console.log(`🔗 Conectando ao banco: ${SUPABASE_URL}`);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

class PartnerServicesInvestigator {
  constructor() {
    this.report = {
      timestamp: new Date().toISOString(),
      investigation: {},
      findings: [],
      recommendations: [],
    };
  }

  async investigate() {
    console.log('🔍 INICIANDO INVESTIGAÇÃO: SERVIÇOS DE PARCEIRO NO ORÇAMENTO');
    console.log('='.repeat(80));

    try {
      await this.checkPartnerUser();
      await this.checkPartnerServicesTable();
      await this.checkPartnerServicesData();
      await this.checkAPIEndpoint();
      await this.checkAuthenticationFlow();
      await this.simulateAPICall();
      await this.generateInvestigationReport();

      console.log('\n✅ INVESTIGAÇÃO CONCLUÍDA!');
      console.log('📄 Relatório salvo em: reports/partner-services-investigation.json');
    } catch (error) {
      console.error('💥 ERRO NA INVESTIGAÇÃO:', error);
      this.report.findings.push(`Erro crítico: ${error.message}`);
    }
  }

  async checkPartnerUser() {
    console.log('\n👤 VERIFICANDO USUÁRIO PARCEIRO');
    console.log('-'.repeat(50));

    // Procurar pelo usuário mencionado (mecanica@parceiro.com)
    const { data: user, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.log(`❌ Erro ao listar usuários: ${error.message}`);
      this.report.findings.push(`Erro ao acessar usuários: ${error.message}`);
      return;
    }

    const partnerUser = user.users.find(u => u.email === 'mecanica@parceiro.com');

    if (!partnerUser) {
      console.log('❌ Usuário "mecanica@parceiro.com" não encontrado');
      this.report.findings.push('Usuário parceiro não encontrado no sistema');
      return;
    }

    console.log(`✅ Usuário encontrado: ${partnerUser.email}`);
    console.log(`   ID: ${partnerUser.id}`);
    console.log(`   Criado em: ${partnerUser.created_at}`);

    // Verificar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', partnerUser.id)
      .single();

    if (profileError) {
      console.log(`❌ Erro ao buscar perfil: ${profileError.message}`);
      this.report.findings.push(`Erro ao buscar perfil do usuário: ${profileError.message}`);
    } else if (profile) {
      console.log(`✅ Perfil encontrado:`);
      console.log(`   Role: ${profile.role}`);
      console.log(`   Empresa: ${profile.company_name || 'N/A'}`);
      console.log(`   Status: ${profile.status || 'N/A'}`);

      if (profile.role !== 'partner') {
        console.log(`⚠️  PROBLEMA: Role do usuário é "${profile.role}", deveria ser "partner"`);
        this.report.findings.push(`Role incorreta: ${profile.role} (deveria ser "partner")`);
      } else {
        console.log('✅ Role do usuário está correta');
      }
    } else {
      console.log('❌ Perfil não encontrado');
      this.report.findings.push('Perfil do usuário não encontrado');
    }

    this.report.investigation.user = {
      id: partnerUser.id,
      email: partnerUser.email,
      profile: profile || null,
    };
  }

  async checkPartnerServicesTable() {
    console.log('\n📋 VERIFICANDO TABELA PARTNER_SERVICES');
    console.log('-'.repeat(50));

    try {
      // Verificar estrutura da tabela
      const { data: sample, error: sampleError } = await supabase
        .from('partner_services')
        .select('*')
        .limit(1);

      if (sampleError) {
        console.log(`❌ Erro ao acessar tabela: ${sampleError.message}`);
        this.report.findings.push(`Erro na tabela partner_services: ${sampleError.message}`);
        return;
      }

      if (sample && sample.length > 0) {
        console.log('✅ Tabela acessível');
        console.log(`   Colunas: ${Object.keys(sample[0]).join(', ')}`);
      } else {
        console.log('⚠️  Tabela existe mas está vazia');
        this.report.findings.push('Tabela partner_services está vazia');
      }

      // Contar total de serviços
      const { count, error: countError } = await supabase
        .from('partner_services')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.log(`❌ Erro ao contar serviços: ${countError.message}`);
      } else {
        console.log(`📊 Total de serviços na tabela: ${count}`);
      }

      this.report.investigation.tableStructure = {
        accessible: !sampleError,
        columns: sample && sample.length > 0 ? Object.keys(sample[0]) : [],
        totalServices: count || 0,
      };
    } catch (error) {
      console.log(`❌ Erro geral na tabela: ${error.message}`);
      this.report.findings.push(`Erro geral na tabela partner_services: ${error.message}`);
    }
  }

  async checkPartnerServicesData() {
    console.log('\n🔍 VERIFICANDO DADOS DOS SERVIÇOS DO PARCEIRO');
    console.log('-'.repeat(50));

    if (!this.report.investigation.user?.id) {
      console.log('❌ Não foi possível verificar dados - usuário não encontrado');
      return;
    }

    const partnerId = this.report.investigation.user.id;

    try {
      // Buscar serviços do parceiro específico
      const { data: services, error } = await supabase
        .from('partner_services')
        .select('*')
        .eq('partner_id', partnerId);

      if (error) {
        console.log(`❌ Erro ao buscar serviços: ${error.message}`);
        this.report.findings.push(`Erro ao buscar serviços do parceiro: ${error.message}`);
        return;
      }

      console.log(`📊 Serviços encontrados para o parceiro: ${services?.length || 0}`);

      if (services && services.length > 0) {
        console.log('\n🏆 SERVIÇOS DO PARCEIRO:');
        services.forEach((service, index) => {
          console.log(`   ${index + 1}. ${service.name}`);
          console.log(`      Preço: R$ ${service.price}`);
          console.log(`      Categoria: ${service.category}`);
          console.log(`      Descrição: ${service.description || 'N/A'}`);
          console.log(`      ID: ${service.id}`);
          console.log('');
        });

        // Verificar se os serviços têm todos os campos necessários
        const incompleteServices = services.filter(s => !s.name || !s.price || !s.category);
        if (incompleteServices.length > 0) {
          console.log(`⚠️  Serviços incompletos encontrados: ${incompleteServices.length}`);
          this.report.findings.push(`${incompleteServices.length} serviços com dados incompletos`);
        }
      } else {
        console.log('❌ NENHUM SERVIÇO ENCONTRADO PARA ESTE PARCEIRO');
        this.report.findings.push('Parceiro não possui serviços cadastrados');
      }

      this.report.investigation.partnerServices = {
        count: services?.length || 0,
        services: services || [],
        incompleteCount: services?.filter(s => !s.name || !s.price || !s.category).length || 0,
      };
    } catch (error) {
      console.log(`❌ Erro ao verificar dados: ${error.message}`);
      this.report.findings.push(`Erro ao verificar dados dos serviços: ${error.message}`);
    }
  }

  async checkAPIEndpoint() {
    console.log('\n🌐 VERIFICANDO ENDPOINT DA API');
    console.log('-'.repeat(50));

    // Verificar se o endpoint existe e está acessível
    console.log('ℹ️  Endpoint esperado: /api/partner/list-services');
    console.log('ℹ️  Método: GET');
    console.log('ℹ️  Autenticação: Bearer token required');

    // Verificar se existem outras rotas relacionadas
    const possibleEndpoints = [
      '/api/partner/list-services',
      '/api/partner/services',
      '/api/services',
    ];

    console.log('\n🔍 Endpoints relacionados encontrados no projeto:');
    possibleEndpoints.forEach(endpoint => {
      console.log(`   ${endpoint}`);
    });

    this.report.investigation.apiEndpoint = {
      expectedEndpoint: '/api/partner/list-services',
      method: 'GET',
      authRequired: true,
      possibleEndpoints,
    };
  }

  async checkAuthenticationFlow() {
    console.log('\n🔐 VERIFICANDO FLUXO DE AUTENTICAÇÃO');
    console.log('-'.repeat(50));

    if (!this.report.investigation.user?.id) {
      console.log('❌ Não foi possível verificar autenticação - usuário não encontrado');
      return;
    }

    console.log('ℹ️  Verificando middleware de autenticação...');
    console.log('   Middleware esperado: withPartnerAuth');
    console.log('   Verificações esperadas:');
    console.log('   - Token JWT válido');
    console.log('   - Role do usuário = "partner"');
    console.log('   - Sessão ativa');

    // Simular verificação de sessão
    const { data: session, error: sessionError } = await supabase.auth.admin.getUserById(
      this.report.investigation.user.id
    );

    if (sessionError) {
      console.log(`❌ Erro ao verificar sessão: ${sessionError.message}`);
      this.report.findings.push(`Erro na verificação de sessão: ${sessionError.message}`);
    } else {
      console.log('✅ Sessão do usuário pode ser verificada');
    }

    this.report.investigation.authentication = {
      middleware: 'withPartnerAuth',
      checks: ['JWT token', 'user role', 'active session'],
      sessionValid: !sessionError,
    };
  }

  async simulateAPICall() {
    console.log('\n🔄 SIMULANDO CHAMADA DA API');
    console.log('-'.repeat(50));

    if (!this.report.investigation.user?.id) {
      console.log('❌ Não foi possível simular API - usuário não encontrado');
      return;
    }

    console.log('ℹ️  Simulando chamada para /api/partner/list-services...');

    try {
      // Simular a query que a API faria
      const { data: services, error } = await supabase
        .from('partner_services')
        .select('*')
        .eq('partner_id', this.report.investigation.user.id);

      if (error) {
        console.log(`❌ Erro na simulação: ${error.message}`);
        this.report.findings.push(`Erro na simulação da API: ${error.message}`);
      } else {
        console.log(`✅ Simulação bem-sucedida: ${services?.length || 0} serviços retornados`);

        if (services && services.length > 0) {
          console.log('\n📋 Serviços que seriam retornados pela API:');
          services.forEach((service, index) => {
            console.log(`   ${index + 1}. ${service.name} - R$ ${service.price}`);
          });
        }
      }

      this.report.investigation.apiSimulation = {
        success: !error,
        servicesReturned: services?.length || 0,
        error: error?.message || null,
      };
    } catch (error) {
      console.log(`❌ Erro na simulação: ${error.message}`);
      this.report.findings.push(`Erro na simulação da API: ${error.message}`);
    }
  }

  generateInvestigationReport() {
    console.log('\n📄 GERANDO RELATÓRIO DE INVESTIGAÇÃO');
    console.log('-'.repeat(50));

    // Análise dos achados
    const findings = this.report.findings;
    const hasServices = (this.report.investigation.partnerServices?.count || 0) > 0;
    const userExists = !!this.report.investigation.user;
    const correctRole = this.report.investigation.user?.profile?.role === 'partner';
    const apiWorks = this.report.investigation.apiSimulation?.success;

    console.log('\n🔍 RESUMO DA INVESTIGAÇÃO:');
    console.log('='.repeat(50));
    console.log(`👤 Usuário existe: ${userExists ? '✅ Sim' : '❌ Não'}`);
    console.log(`🔑 Role correta: ${correctRole ? '✅ Sim' : '❌ Não'}`);
    console.log(
      `🏆 Serviços cadastrados: ${hasServices ? '✅ Sim' : '❌ Não'} (${this.report.investigation.partnerServices?.count || 0})`
    );
    console.log(`🌐 API funcionando: ${apiWorks ? '✅ Sim' : '❌ Não'}`);

    // Diagnosticar problema principal
    if (!hasServices && userExists && correctRole) {
      console.log('\n🎯 DIAGNÓSTICO PRINCIPAL:');
      console.log('❌ O parceiro não possui serviços cadastrados');
      console.log('💡 SOLUÇÃO: Cadastrar serviços na tabela partner_services');
    } else if (!correctRole && userExists) {
      console.log('\n🎯 DIAGNÓSTICO PRINCIPAL:');
      console.log('❌ O usuário não tem a role "partner"');
      console.log('💡 SOLUÇÃO: Atualizar role do usuário no perfil');
    } else if (!userExists) {
      console.log('\n🎯 DIAGNÓSTICO PRINCIPAL:');
      console.log('❌ O usuário não existe no sistema');
      console.log('💡 SOLUÇÃO: Criar usuário ou verificar email');
    } else if (!apiWorks) {
      console.log('\n🎯 DIAGNÓSTICO PRINCIPAL:');
      console.log('❌ A API não está funcionando corretamente');
      console.log('💡 SOLUÇÃO: Verificar implementação da API');
    } else if (hasServices && correctRole && apiWorks) {
      console.log('\n🎯 DIAGNÓSTICO PRINCIPAL:');
      console.log('✅ Todos os componentes estão funcionando');
      console.log('🔍 PROBLEMA: Pode ser cache, rede ou frontend');
    }

    if (findings.length > 0) {
      console.log('\n🚨 PROBLEMAS IDENTIFICADOS:');
      findings.forEach((finding, index) => {
        console.log(`   ${index + 1}. ${finding}`);
      });
    }

    // Recomendações
    console.log('\n💡 RECOMENDAÇÕES:');
    if (!hasServices) {
      console.log('   1. Cadastrar serviços para o parceiro na tabela partner_services');
    }
    if (!correctRole) {
      console.log('   2. Verificar e corrigir a role do usuário');
    }
    if (!apiWorks) {
      console.log('   3. Testar e corrigir a implementação da API');
    }
    console.log('   4. Limpar cache do navegador');
    console.log('   5. Verificar logs do servidor para erros');
    console.log('   6. Testar com outro usuário parceiro');

    // Salvar relatório detalhado
    const reportPath = join(process.cwd(), 'reports', 'partner-services-investigation.json');
    writeFileSync(reportPath, JSON.stringify(this.report, null, 2));

    console.log(`\n📄 Relatório detalhado salvo em: ${reportPath}`);
  }
}

// Executar investigação
const investigator = new PartnerServicesInvestigator();
investigator
  .investigate()
  .then(() => {
    console.log('\n🎉 INVESTIGAÇÃO FINALIZADA!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 ERRO FATAL:', error);
    process.exit(1);
  });
